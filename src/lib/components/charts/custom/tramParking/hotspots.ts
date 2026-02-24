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
 * Detect hotspots from a list of geocoded, date-filtered incidents.
 *
 * Algorithm:
 * 1. Group incidents by address string
 * 2. For each group, compute centroid and extract street/house number
 * 3. Merge nearby groups (within 80m) that share the same street name → street-range hotspot
 * 4. Groups at intersections/stops that are close together → location hotspot
 * 5. Filter by minimum count, sort descending, return top 50
 */
export function detectHotspots(incidents: Incident[], minCount = 3): Hotspot[] {
	// Only use geocoded incidents
	const geocoded = incidents.filter((i) => i.lat != null && i.lon != null);
	if (geocoded.length === 0) return [];

	// Step 1: Group by address
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

	// Step 3: Merge nearby groups into hotspots
	const merged = new Set<number>();
	const hotspots: Hotspot[] = [];
	let hotspotId = 0;

	// Sort groups by street name for efficient merging
	groups.sort((a, b) => a.streetName.localeCompare(b.streetName));

	for (let i = 0; i < groups.length; i++) {
		if (merged.has(i)) continue;

		const cluster: AddressGroup[] = [groups[i]];
		merged.add(i);

		// Find all nearby groups with the same street name
		for (let j = i + 1; j < groups.length; j++) {
			if (merged.has(j)) continue;

			const sameStreet = groups[i].streetName === groups[j].streetName;
			const dist = haversine(groups[i].center, groups[j].center);

			if (sameStreet && dist < 300) {
				// Same street, within 300m → merge into street-range hotspot
				cluster.push(groups[j]);
				merged.add(j);
			} else if (!sameStreet && dist < 80) {
				// Different street but very close → intersection/location hotspot
				cluster.push(groups[j]);
				merged.add(j);
			}
		}

		const allIncidents = cluster.flatMap((g) => g.incidents);
		if (allIncidents.length < minCount) continue;

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
			// Street-range hotspot
			type = 'street';
			streetName = cluster[0].streetName;
			houseNumberRange = [houseNumbers[0], houseNumbers[houseNumbers.length - 1]];
			label = `${streetName} ${houseNumberRange[0]}–${houseNumberRange[1]}`;
		} else if (allSameStreet) {
			// Single street location (no house numbers)
			type = 'street';
			streetName = cluster[0].streetName;
			label = streetName;
		} else {
			// Location hotspot (intersection or area)
			type = 'location';
			// Use the most common address as label
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

		hotspots.push({
			id: `hs-${hotspotId++}`,
			type,
			label,
			count: allIncidents.length,
			center: allCenter,
			radius: Math.min(maxDist, 500),
			incidents: allIncidents,
			topLines: topLines(allIncidents),
			streetName,
			houseNumberRange
		});
	}

	// Sort by count descending, return top 50
	hotspots.sort((a, b) => b.count - a.count);
	return hotspots.slice(0, 50);
}
