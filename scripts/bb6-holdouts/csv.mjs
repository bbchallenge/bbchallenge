// Minimal RFC-4180 CSV reader (quoted fields, embedded newlines, CRLF). No dependencies.
export function parseCSV(text) {
	const rows = [];
	let row = [];
	let field = '';
	let inQuotes = false;
	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (inQuotes) {
			if (c === '"') {
				if (text[i + 1] === '"') {
					field += '"';
					i++;
				} else inQuotes = false;
			} else field += c;
		} else if (c === '"') inQuotes = true;
		else if (c === ',') {
			row.push(field);
			field = '';
		} else if (c === '\n' || c === '\r') {
			if (c === '\r' && text[i + 1] === '\n') i++;
			row.push(field);
			rows.push(row);
			row = [];
			field = '';
		} else field += c;
	}
	if (field !== '' || row.length) {
		row.push(field);
		rows.push(row);
	}
	return rows;
}

/** 0 -> "A", 25 -> "Z", 26 -> "AA" */
export function colLetter(j) {
	let s = '';
	for (j++; j > 0; j = Math.floor((j - 1) / 26)) s = String.fromCharCode(65 + ((j - 1) % 26)) + s;
	return s;
}
