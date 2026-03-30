export interface Incident {
	id: number;
	incident_id: string;
	title: string | null;
	description: string | null;
	date_start: string | null;
	date_fix: string | null;
	date_end: string | null;
	lines: string | null;
	stops: string | null;
	address: string | null;
	address_category: string | null;
	lat: number | null;
	lon: number | null;
	address_full: string | null;
	district: number | null;
}

export interface Hotspot {
	id: string;
	type: 'street' | 'location';
	label: string;
	count: number;
	center: [number, number]; // [lon, lat]
	radius: number; // meters, for map highlight
	incidents: Incident[];
	topLines: string[];
	district: number | null;
	streetName?: string;
	houseNumberRange?: [number, number];
}

/** Haversine distance in meters between two [lon, lat] points */
function haversine(a: [number, number], b: [number, number]): number {
	const R = 6371000;
	const toRad = (d: number) => (d * Math.PI) / 180;
	const dLat = toRad(b[1] - a[1]);
	const dLon = toRad(b[0] - a[0]);
	const lat1 = toRad(a[1]);
	const lat2 = toRad(b[1]);
	const s =
		Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(s));
}

/** Extract street name from address string */
function extractStreetName(address: string): string {
	// Remove house number at the end: "Kreuzgasse 34" -> "Kreuzgasse"
	// Also handles "Kreuzgasse 34-36", "Kreuzgasse 34/2"
	return address.replace(/\s+\d[\d\s/\-–]*$/, '').trim();
}

/** Extract house number from address string */
function extractHouseNumber(address: string): number | null {
	const match = address.match(/\s+(\d+)[\s/\-–\d]*$/);
	return match ? parseInt(match[1], 10) : null;
}

/** Compute centroid of incidents */
function centroid(incidents: Incident[]): [number, number] {
	const geocoded = incidents.filter((i) => i.lat != null && i.lon != null);
	if (geocoded.length === 0) return [0, 0];
	const lon = geocoded.reduce((s, i) => s + i.lon!, 0) / geocoded.length;
	const lat = geocoded.reduce((s, i) => s + i.lat!, 0) / geocoded.length;
	return [lon, lat];
}

/** Count line occurrences and return top N */
function topLines(incidents: Incident[], n = 3): string[] {
	const counts = new Map<string, number>();
	for (const inc of incidents) {
		if (!inc.lines) continue;
		for (const line of inc.lines.split(',')) {
			const l = line.trim();
			if (l) counts.set(l, (counts.get(l) || 0) + 1);
		}
	}
	return [...counts.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, n)
		.map(([line]) => line);
}

interface AddressGroup {
	address: string;
	streetName: string;
	houseNumber: number | null;
	center: [number, number];
	incidents: Incident[];
}

/**
 * Build a hotspot from a list of address groups that belong together.
 */
function buildHotspot(
	cluster: AddressGroup[],
	id: number
): Hotspot | null {
	const allIncidents = cluster.flatMap((g) => g.incidents);
	const allCenter = centroid(allIncidents);
	const houseNumbers = cluster
		.map((g) => g.houseNumber)
		.filter((n): n is number => n != null)
		.sort((a, b) => a - b);

	const allSameStreet = cluster.every((g) => g.streetName === cluster[0].streetName);

	let label: string;
	let type: 'street' | 'location';
	let streetName: string | undefined;
	let houseNumberRange: [number, number] | undefined;

	if (allSameStreet && houseNumbers.length >= 2) {
		type = 'street';
		streetName = cluster[0].streetName;
		houseNumberRange = [houseNumbers[0], houseNumbers[houseNumbers.length - 1]];
		label = `${streetName} ${houseNumberRange[0]}–${houseNumberRange[1]}`;
	} else if (allSameStreet && houseNumbers.length === 1) {
		type = 'street';
		streetName = cluster[0].streetName;
		label = `${streetName} ${houseNumbers[0]}`;
	} else if (allSameStreet) {
		type = 'street';
		streetName = cluster[0].streetName;
		label = streetName;
	} else {
		type = 'location';
		const addrCounts = new Map<string, number>();
		for (const g of cluster) {
			addrCounts.set(g.address, g.incidents.length);
		}
		label =
			[...addrCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unbekannt';
	}

	// Compute radius: max distance from center to any incident, min 50m
	let maxDist = 50;
	for (const inc of allIncidents) {
		if (inc.lat != null && inc.lon != null) {
			const d = haversine(allCenter, [inc.lon, inc.lat]);
			if (d > maxDist) maxDist = d;
		}
	}

	// Determine primary district (most common among incidents)
	const districtCounts = new Map<number, number>();
	for (const inc of allIncidents) {
		if (inc.district != null) {
			districtCounts.set(inc.district, (districtCounts.get(inc.district) || 0) + 1);
		}
	}
	const district = districtCounts.size > 0
		? [...districtCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]
		: null;

	return {
		id: `hs-${id}`,
		type,
		label,
		count: allIncidents.length,
		center: allCenter,
		radius: Math.min(maxDist, 500),
		incidents: allIncidents,
		topLines: topLines(allIncidents),
		district,
		streetName,
		houseNumberRange
	};
}

/**
 * Detect hotspots from a list of geocoded, date-filtered incidents.
 *
 * Algorithm:
 * 1. Group incidents by exact address string
 * 2. Extract street name from each address group
 * 3. STREET HOTSPOTS: merge ALL address groups that share the same street name
 *    into one hotspot (no distance limit — "Kreuzgasse 28" and "Kreuzgasse 56"
 *    always combine, as do "Währinger Straße 79-102" and "Währinger Straße 99-156")
 * 4. LOCATION HOTSPOTS: for remaining ungrouped addresses (no street name match),
 *    merge groups within 80m proximity → intersection/crossing hotspots
 * 5. Filter by minimum count, sort descending, return top 50
 */
export function detectHotspots(incidents: Incident[], minCount = 3): Hotspot[] {
	// Only use geocoded incidents
	const geocoded = incidents.filter((i) => i.lat != null && i.lon != null);
	if (geocoded.length === 0) return [];

	// Step 1: Group by exact address
	const byAddress = new Map<string, Incident[]>();
	for (const inc of geocoded) {
		const addr = inc.address || 'Unbekannt';
		if (!byAddress.has(addr)) byAddress.set(addr, []);
		byAddress.get(addr)!.push(inc);
	}

	// Step 2: Build address groups with metadata
	const groups: AddressGroup[] = [];
	for (const [address, incs] of byAddress) {
		groups.push({
			address,
			streetName: extractStreetName(address),
			houseNumber: extractHouseNumber(address),
			center: centroid(incs),
			incidents: incs
		});
	}

	// Step 3: Merge ALL groups with the same street name (no distance limit)
	const byStreet = new Map<string, AddressGroup[]>();
	const noStreetGroups: AddressGroup[] = [];

	for (const group of groups) {
		// If street name is the same as the full address (no house number extracted)
		// AND it's a kreuzung/haltestelle type, treat it as a location, not a street
		const isLocationType = group.address === group.streetName &&
			group.incidents.some((i) =>
				i.address_category === 'kreuzung' ||
				i.address_category === 'kreuzung_2' ||
				i.address_category === 'haltestelle' ||
				i.address_category === 'platz'
			);

		if (isLocationType) {
			noStreetGroups.push(group);
		} else {
			const key = group.streetName;
			if (!byStreet.has(key)) byStreet.set(key, []);
			byStreet.get(key)!.push(group);
		}
	}

	const hotspots: Hotspot[] = [];
	let hotspotId = 0;

	// Build street hotspots — each street name becomes exactly one hotspot
	for (const [, streetGroups] of byStreet) {
		const totalCount = streetGroups.reduce((s, g) => s + g.incidents.length, 0);
		if (totalCount < minCount) {
			// Not enough incidents for a hotspot; put them back for location clustering
			noStreetGroups.push(...streetGroups);
			continue;
		}
		const hs = buildHotspot(streetGroups, hotspotId++);
		if (hs) hotspots.push(hs);
	}

	// Step 4: Location hotspots — proximity-based clustering for remaining groups
	// Use simple greedy clustering: pick a group, absorb all within 80m, repeat
	const used = new Set<number>();

	for (let i = 0; i < noStreetGroups.length; i++) {
		if (used.has(i)) continue;

		const cluster: AddressGroup[] = [noStreetGroups[i]];
		used.add(i);

		// Expand cluster: find all groups within 80m of ANY member (transitive)
		let changed = true;
		while (changed) {
			changed = false;
			for (let j = 0; j < noStreetGroups.length; j++) {
				if (used.has(j)) continue;
				// Check distance to any existing cluster member
				const closeToCluster = cluster.some(
					(member) => haversine(member.center, noStreetGroups[j].center) < 80
				);
				if (closeToCluster) {
					cluster.push(noStreetGroups[j]);
					used.add(j);
					changed = true;
				}
			}
		}

		const totalCount = cluster.reduce((s, g) => s + g.incidents.length, 0);
		if (totalCount < minCount) continue;

		const hs = buildHotspot(cluster, hotspotId++);
		if (hs) hotspots.push(hs);
	}

	// Sort by count descending, return top 50
	hotspots.sort((a, b) => b.count - a.count);
	return hotspots.slice(0, 50);
}
