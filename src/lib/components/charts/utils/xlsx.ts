// $lib/charts/utils/xlsx.ts
// Minimal .xlsx writer for chart tables: a data sheet plus an "Info" sheet.
// Only loaded via dynamic import() from export.ts, so it stays out of the main bundle.

import type { TableColumn } from '../types';

export interface XLSXInfo {
	title?: string;
	source?: string;
	updateDate?: string;
	region?: string;
	methods?: string;
	url?: string;
	lang?: string;
}

interface XLSXTable {
	columns: TableColumn[];
	rows: Record<string, any>[];
}

const LABELS: Record<string, Record<string, string>> = {
	de: {
		title: 'Titel',
		source: 'Quelle',
		updateDate: 'Datenstand',
		region: 'Region',
		methods: 'Methodik',
		url: 'Link',
		downloaded: 'Heruntergeladen am',
		sheetData: 'Daten'
	},
	en: {
		title: 'Title',
		source: 'Source',
		updateDate: 'Data as of',
		region: 'Region',
		methods: 'Methods',
		url: 'Link',
		downloaded: 'Downloaded on',
		sheetData: 'Data'
	}
};

const ISO_DATE =
	/^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;
const NUMERIC = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;

// Style indices into cellXfs in STYLES_XML
const S_BOLD = 1;
const S_DATE = 2;
const S_DATETIME = 3;
const S_WRAP = 4;

type Cell = { n: number; s?: number } | { str: string; s?: number } | null;

function stripHtml(html: string): string {
	return html
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/(p|li|h\d)>/gi, '\n')
		.replace(/<[^>]*>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

function escapeXml(s: string): string {
	return s
		.replace(/[^\x09\x0A\x0D\x20-퟿-�\u{10000}-\u{10FFFF}]/gu, '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/** Excel serial date: days since 1899-12-30, from a UTC timestamp */
function excelDate(utcMs: number): number {
	return utcMs / 86400000 + 25569;
}

function toCell(v: any): Cell {
	if (v == null || v === '') return null;
	if (typeof v === 'number') return Number.isFinite(v) ? { n: v } : null;
	if (typeof v === 'boolean') return { str: String(v) };
	if (v instanceof Date) {
		if (isNaN(v.getTime())) return null;
		// Excel dates have no timezone: keep the local wall-clock time the chart shows
		const ms = Date.UTC(
			v.getFullYear(),
			v.getMonth(),
			v.getDate(),
			v.getHours(),
			v.getMinutes(),
			v.getSeconds()
		);
		const hasTime = v.getHours() || v.getMinutes() || v.getSeconds();
		return { n: excelDate(ms), s: hasTime ? S_DATETIME : S_DATE };
	}
	const s = String(v);
	if (ISO_DATE.test(s)) {
		const ms = new Date(s.length === 10 ? `${s}T00:00:00Z` : s).getTime();
		if (!isNaN(ms)) return { n: excelDate(ms), s: s.length === 10 ? S_DATE : S_DATETIME };
	}
	// Numeric strings like "2015" become numbers; codes with leading zeros ("09564") stay text
	if (NUMERIC.test(s)) return { n: Number(s) };
	return { str: s };
}

function colName(i: number): string {
	let name = '';
	for (i++; i > 0; i = Math.floor((i - 1) / 26))
		name = String.fromCharCode(65 + ((i - 1) % 26)) + name;
	return name;
}

function cellXml(cell: Cell, ref: string): string {
	if (!cell) return '';
	const s = cell.s ? ` s="${cell.s}"` : '';
	if ('n' in cell) return `<c r="${ref}"${s}><v>${cell.n}</v></c>`;
	return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${escapeXml(cell.str)}</t></is></c>`;
}

function sheetXml(rows: Cell[][], widths: number[], freezeHeader: boolean): string {
	const pane = freezeHeader
		? '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>'
		: '';
	const cols = widths
		.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
		.join('');
	const data = rows
		.map(
			(row, r) =>
				`<row r="${r + 1}">${row.map((c, i) => cellXml(c, `${colName(i)}${r + 1}`)).join('')}</row>`
		)
		.join('');
	return (
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
		'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
		`<sheetViews><sheetView workbookViewId="0">${pane}</sheetView></sheetViews>` +
		(cols ? `<cols>${cols}</cols>` : '') +
		`<sheetData>${data}</sheetData></worksheet>`
	);
}

function sheetName(name: string): string {
	return name.replace(/[[\]:*?/\\]/g, ' ').slice(0, 31) || 'Sheet';
}

const XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

const CONTENT_TYPES_XML =
	XML_HEAD +
	'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
	'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
	'<Default Extension="xml" ContentType="application/xml"/>' +
	'<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
	'<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
	'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
	'<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
	'</Types>';

const ROOT_RELS_XML =
	XML_HEAD +
	'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
	'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
	'</Relationships>';

const WORKBOOK_RELS_XML =
	XML_HEAD +
	'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
	'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
	'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>' +
	'<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
	'</Relationships>';

// cellXfs: 0 default, 1 bold, 2 date, 3 date+time, 4 wrapped text (top-aligned)
const STYLES_XML =
	XML_HEAD +
	'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
	'<numFmts count="2"><numFmt numFmtId="164" formatCode="yyyy-mm-dd"/><numFmt numFmtId="165" formatCode="yyyy-mm-dd hh:mm"/></numFmts>' +
	'<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
	'<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
	'<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
	'<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
	'<cellXfs count="5">' +
	'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
	'<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment vertical="top"/></xf>' +
	'<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
	'<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
	'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf>' +
	'</cellXfs>' +
	'<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
	'</styleSheet>';

function workbookXml(names: string[]): string {
	const sheets = names
		.map((n, i) => `<sheet name="${escapeXml(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
		.join('');
	return (
		XML_HEAD +
		'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
		`<sheets>${sheets}</sheets></workbook>`
	);
}

// --- Zip (deflate via the browser's CompressionStream, stored as fallback) ---

const CRC_TABLE = (() => {
	const t = new Uint32Array(256);
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		t[n] = c >>> 0;
	}
	return t;
})();

function crc32(data: Uint8Array): number {
	let c = 0xffffffff;
	for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
	return (c ^ 0xffffffff) >>> 0;
}

async function deflateRaw(data: Uint8Array): Promise<Uint8Array | null> {
	if (typeof CompressionStream === 'undefined') return null;
	try {
		const stream = new Blob([data]).stream().pipeThrough(new CompressionStream('deflate-raw'));
		return new Uint8Array(await new Response(stream).arrayBuffer());
	} catch {
		return null;
	}
}

async function zip(files: [string, string][]): Promise<Blob> {
	const enc = new TextEncoder();
	const now = new Date();
	const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
	const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

	const parts: Uint8Array[] = [];
	const central: Uint8Array[] = [];
	let offset = 0;

	for (const [path, content] of files) {
		const name = enc.encode(path);
		const raw = enc.encode(content);
		const deflated = await deflateRaw(raw);
		const method = deflated ? 8 : 0;
		const body = deflated ?? raw;
		const crc = crc32(raw);

		const local = new DataView(new ArrayBuffer(30));
		local.setUint32(0, 0x04034b50, true);
		local.setUint16(4, 20, true);
		local.setUint16(6, 0x0800, true); // UTF-8 names
		local.setUint16(8, method, true);
		local.setUint16(10, dosTime, true);
		local.setUint16(12, dosDate, true);
		local.setUint32(14, crc, true);
		local.setUint32(18, body.length, true);
		local.setUint32(22, raw.length, true);
		local.setUint16(26, name.length, true);
		parts.push(new Uint8Array(local.buffer), name, body);

		const dir = new DataView(new ArrayBuffer(46));
		dir.setUint32(0, 0x02014b50, true);
		dir.setUint16(4, 20, true);
		dir.setUint16(6, 20, true);
		dir.setUint16(8, 0x0800, true);
		dir.setUint16(10, method, true);
		dir.setUint16(12, dosTime, true);
		dir.setUint16(14, dosDate, true);
		dir.setUint32(16, crc, true);
		dir.setUint32(20, body.length, true);
		dir.setUint32(24, raw.length, true);
		dir.setUint16(28, name.length, true);
		dir.setUint32(42, offset, true);
		central.push(new Uint8Array(dir.buffer), name);

		offset += 30 + name.length + body.length;
	}

	const dirSize = central.reduce((sum, p) => sum + p.length, 0);
	const end = new DataView(new ArrayBuffer(22));
	end.setUint32(0, 0x06054b50, true);
	end.setUint16(8, files.length, true);
	end.setUint16(10, files.length, true);
	end.setUint32(12, dirSize, true);
	end.setUint32(16, offset, true);

	return new Blob([...parts, ...central, new Uint8Array(end.buffer)] as BlobPart[], {
		type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
	});
}

/** Build an .xlsx with the chart table and an "Info" sheet (source, data date, region, link). */
export async function buildXLSX(table: XLSXTable, info: XLSXInfo = {}): Promise<Blob> {
	const { columns, rows } = table;
	const labels = LABELS[info.lang ?? 'de'] ?? LABELS.de;

	const header: Cell[] = columns.map((c) => ({ str: c.label, s: S_BOLD }));
	const body: Cell[][] = rows.map((row) => columns.map((c) => toCell(row[c.key])));
	const widths = columns.map((c, i) => {
		const maxLen = Math.max(
			c.label.length,
			...body.slice(0, 500).map((r) => {
				const cell = r[i];
				if (!cell) return 0;
				if ('str' in cell) return cell.str.length;
				return cell.s === S_DATETIME ? 16 : cell.s === S_DATE ? 10 : String(cell.n).length;
			})
		);
		return Math.min(Math.max(maxLen + 2, 8), 60);
	});

	const updateDate =
		info.updateDate && ISO_DATE.test(info.updateDate)
			? info.updateDate.slice(0, 10)
			: info.updateDate;
	const infoRows: [string, string | undefined][] = [
		[labels.title, info.title],
		[labels.source, info.source && stripHtml(info.source)],
		[labels.updateDate, updateDate],
		[labels.region, info.region],
		[labels.methods, info.methods && stripHtml(info.methods)],
		[labels.url, info.url],
		[labels.downloaded, new Date().toISOString().slice(0, 10)]
	];
	const infoData: Cell[][] = infoRows
		.filter(([, v]) => v)
		.map(([k, v]) => [
			{ str: k, s: S_BOLD },
			{ str: v as string, s: S_WRAP }
		]);

	return zip([
		['[Content_Types].xml', CONTENT_TYPES_XML],
		['_rels/.rels', ROOT_RELS_XML],
		['xl/workbook.xml', workbookXml([sheetName(labels.sheetData), 'Info'])],
		['xl/_rels/workbook.xml.rels', WORKBOOK_RELS_XML],
		['xl/styles.xml', STYLES_XML],
		['xl/worksheets/sheet1.xml', sheetXml([header, ...body], widths, true)],
		['xl/worksheets/sheet2.xml', sheetXml(infoData, [20, 80], false)]
	]);
}
