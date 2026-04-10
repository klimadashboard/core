/**
 * Quick stats for call: top 10 hotspots + all 45 combined share
 * Run: node src/lib/components/charts/custom/tramParking/calc-hotspot-stats.mjs
 */

function extractStreetName(address) {
	return address.replace(/\s+\d[\d\s/\-–]*$/, '').trim();
}
function extractHouseNumber(address) {
	const match = address.match(/\s+(\d+)[\s/\-–\d]*$/);
	return match ? parseInt(match[1], 10) : null;
}
function haversine(a, b) {
	const R = 6371000, toRad = d => d * Math.PI / 180;
	const dLat = toRad(b[1] - a[1]), dLon = toRad(b[0] - a[0]);
	const s = Math.sin(dLat/2)**2 + Math.cos(toRad(a[1]))*Math.cos(toRad(b[1]))*Math.sin(dLon/2)**2;
	return 2*R*Math.asin(Math.sqrt(s));
}
function centroid(incs) {
	const g = incs.filter(i => i.lat != null);
	if (!g.length) return [0,0];
	return [g.reduce((s,i)=>s+i.lon,0)/g.length, g.reduce((s,i)=>s+i.lat,0)/g.length];
}
function topLines(incs, n=3) {
	const c = new Map();
	for (const i of incs) if (i.lines) for (const l of i.lines.split(',')) { const t=l.trim(); if(t) c.set(t,(c.get(t)||0)+1); }
	return [...c.entries()].sort((a,b)=>b[1]-a[1]).slice(0,n).map(([l])=>l);
}

function detectHotspots(incidents, minCount=3) {
	const geocoded = incidents.filter(i => i.lat != null && i.lon != null);
	if (!geocoded.length) return [];

	const byAddress = new Map();
	for (const inc of geocoded) {
		const addr = inc.address || 'Unbekannt';
		if (!byAddress.has(addr)) byAddress.set(addr, []);
		byAddress.get(addr).push(inc);
	}

	const groups = [];
	for (const [address, incs] of byAddress) {
		groups.push({ address, streetName: extractStreetName(address), houseNumber: extractHouseNumber(address), center: centroid(incs), incidents: incs });
	}

	const byStreet = new Map(), noStreet = [];
	for (const g of groups) {
		const isLoc = g.address === g.streetName && g.incidents.some(i => ['kreuzung','kreuzung_2','haltestelle','platz'].includes(i.address_category));
		if (isLoc) { noStreet.push(g); continue; }
		if (!byStreet.has(g.streetName)) byStreet.set(g.streetName, []);
		byStreet.get(g.streetName).push(g);
	}

	const hotspots = [];
	let id = 0;

	for (const [, sg] of byStreet) {
		const total = sg.reduce((s,g)=>s+g.incidents.length,0);
		if (total < minCount) { noStreet.push(...sg); continue; }
		const allIncs = sg.flatMap(g=>g.incidents);
		const hns = sg.map(g=>g.houseNumber).filter(n=>n!=null).sort((a,b)=>a-b);
		const sn = sg[0].streetName;
		const label = hns.length>=2 ? `${sn} ${hns[0]}–${hns[hns.length-1]}` : hns.length===1 ? `${sn} ${hns[0]}` : sn;
		const dc = new Map();
		for (const i of allIncs) if (i.district!=null) dc.set(i.district,(dc.get(i.district)||0)+1);
		hotspots.push({ id:`hs-${id++}`, type:'street', label, count:allIncs.length, center:centroid(allIncs), topLines:topLines(allIncs), district: dc.size?[...dc.entries()].sort((a,b)=>b[1]-a[1])[0][0]:null });
	}

	const used = new Set();
	for (let i=0;i<noStreet.length;i++) {
		if (used.has(i)) continue;
		const cluster=[noStreet[i]]; used.add(i);
		let changed=true;
		while(changed) { changed=false; for(let j=0;j<noStreet.length;j++) { if(used.has(j)) continue; if(cluster.some(m=>haversine(m.center,noStreet[j].center)<80)) { cluster.push(noStreet[j]); used.add(j); changed=true; } } }
		const total=cluster.reduce((s,g)=>s+g.incidents.length,0);
		if(total<minCount) continue;
		const allIncs=cluster.flatMap(g=>g.incidents);
		const ac=new Map(); for(const g of cluster) ac.set(g.address,g.incidents.length);
		const label=[...ac.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]||'Unbekannt';
		const dc=new Map(); for(const i of allIncs) if(i.district!=null) dc.set(i.district,(dc.get(i.district)||0)+1);
		hotspots.push({ id:`hs-${id++}`, type:'location', label, count:allIncs.length, center:centroid(allIncs), topLines:topLines(allIncs), district:dc.size?[...dc.entries()].sort((a,b)=>b[1]-a[1])[0][0]:null });
	}

	hotspots.sort((a,b)=>b.count-a.count);
	return hotspots.slice(0,50);
}

// ---- Fetch data ----
async function fetchAll() {
	let all = [], page = 1;
	while (true) {
		const url = `https://base.klimadashboard.org/items/mobility_tram_parking?limit=5000&page=${page}&fields=id,date_start,date_end,lines,address,address_category,lat,lon,district&sort=-date_start`;
		const r = await fetch(url);
		const json = await r.json();
		const items = json.data || [];
		all = all.concat(items);
		if (items.length < 5000) break;
		page++;
	}
	return all;
}

const all = await fetchAll();
const incidents = all.filter(i => i.date_start?.slice(0,4) === '2025');
const geocoded = incidents.filter(i => i.lat != null && i.lon != null);
const hotspots = detectHotspots(geocoded);

console.log(`\nGesamt Vorfälle 2025:        ${incidents.length}`);
console.log(`Davon geocodiert:             ${geocoded.length}`);
console.log(`Hotspots gesamt (≥3):         ${hotspots.length}`);

const top45 = hotspots.slice(0, 45);
const top45Count = top45.reduce((s,h)=>s+h.count, 0);
console.log(`\nTop 45 Problemzonen zusammen: ${top45Count} Vorfälle = ${((top45Count/geocoded.length)*100).toFixed(1)}% aller verorteten Vorfälle`);

const top10 = hotspots.slice(0, 10);
const top10Count = top10.reduce((s,h)=>s+h.count, 0);
console.log(`Top 10 Problemzonen zusammen: ${top10Count} Vorfälle = ${((top10Count/geocoded.length)*100).toFixed(1)}% aller verorteten Vorfälle`);

console.log('\n--- Top 10 Problemzonen ---');
top10.forEach((hs, i) => {
	const pct = ((hs.count/geocoded.length)*100).toFixed(1);
	console.log(`${String(i+1).padStart(2)}. ${hs.label.padEnd(48)} ${String(hs.count).padStart(4)} Vorfälle  (${pct}%)  Bez. ${hs.district||'?'}`);
});
