import { deflateRawSync } from "node:zlib";

export type ExportCell = string | number | null | undefined;

/* -------------------------------------------------------------------------- */
/* CSV                                                                        */
/* -------------------------------------------------------------------------- */

function csvCell(value: ExportCell): string {
  const text = value === null || value === undefined ? "" : String(value);

  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(columns: string[], rows: ExportCell[][]): string {
  return [
    columns.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ].join("\r\n");
}

/* -------------------------------------------------------------------------- */
/* XLSX (ZIP + SpreadsheetML, no external dependency)                         */
/* -------------------------------------------------------------------------- */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);

  for (let index = 0; index < 256; index += 1) {
    let value = index;

    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }

    table[index] = value >>> 0;
  }

  return table;
})();

function crc32(bytes: Buffer): number {
  let crc = 0xffffffff;

  for (let index = 0; index < bytes.length; index += 1) {
    crc = CRC_TABLE[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

type ZipEntry = { name: string; data: Buffer };

function zip(entries: ZipEntry[]): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const compressed = deflateRawSync(entry.data);
    const crc = crc32(entry.data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(entry.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);

    localParts.push(local, name, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(entry.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);

    centralParts.push(central, name);

    offset += local.length + name.length + compressed.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);

  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, end]);
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function columnName(index: number): string {
  let name = "";
  let current = index + 1;

  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }

  return name;
}

function sheetCell(value: ExportCell, column: number, row: number): string {
  const ref = `${columnName(column)}${row}`;

  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return `<c r="${ref}"><v>${value}</v></c>`;
  }

  const text = String(value).slice(0, 32000);

  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(
    text
  )}</t></is></c>`;
}

export function toXlsx(columns: string[], rows: ExportCell[][]): Buffer {
  const sheetRows = [
    `<row r="1">${columns
      .map((header, index) => sheetCell(header, index, 1))
      .join("")}</row>`,
    ...rows.map(
      (row, rowIndex) =>
        `<row r="${rowIndex + 2}">${columns
          .map((_, columnIndex) =>
            sheetCell(row[columnIndex], columnIndex, rowIndex + 2)
          )
          .join("")}</row>`
    ),
  ].join("");

  const files: ZipEntry[] = [
    {
      name: "[Content_Types].xml",
      data: Buffer.from(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
          `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
          `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
          `<Default Extension="xml" ContentType="application/xml"/>` +
          `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
          `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
          `</Types>`,
        "utf8"
      ),
    },
    {
      name: "_rels/.rels",
      data: Buffer.from(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
          `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
          `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
          `</Relationships>`,
        "utf8"
      ),
    },
    {
      name: "xl/workbook.xml",
      data: Buffer.from(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
          `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
          `<sheets><sheet name="Report" sheetId="1" r:id="rId1"/></sheets>` +
          `</workbook>`,
        "utf8"
      ),
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: Buffer.from(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
          `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
          `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
          `</Relationships>`,
        "utf8"
      ),
    },
    {
      name: "xl/worksheets/sheet1.xml",
      data: Buffer.from(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
          `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
          `<sheetData>${sheetRows}</sheetData>` +
          `</worksheet>`,
        "utf8"
      ),
    },
  ];

  return zip(files);
}

/* -------------------------------------------------------------------------- */
/* PDF (single font, paginated, no external dependency)                       */
/* -------------------------------------------------------------------------- */

function pdfText(value: string): string {
  return value
    .replace(/[^\x20-\x7e]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function padCell(value: string, width: number): string {
  const clean = value.replace(/[\r\n\t]/g, " ");

  if (clean.length >= width) {
    return clean.slice(0, Math.max(0, width));
  }

  return clean.padEnd(width, " ");
}

export function toPdf(
  title: string,
  subtitle: string,
  columns: string[],
  rows: ExportCell[][]
): Buffer {
  const pageWidth = 792;
  const pageHeight = 612;
  const margin = 36;
  const lineHeight = 10;
  const fontSize = 7;
  const charWidth = fontSize * 0.6;
  const usableWidth = pageWidth - margin * 2;
  const maxChars = Math.floor(usableWidth / charWidth);

  const columnLengths = columns.map((column, index) => {
    const sample = rows
      .slice(0, 200)
      .reduce(
        (max, row) => Math.max(max, String(row[index] ?? "").length),
        column.length
      );

    return Math.min(Math.max(sample, 6), 40);
  });

  const totalLength = columnLengths.reduce((sum, length) => sum + length, 0);
  const scale = totalLength > maxChars ? maxChars / totalLength : 1;
  const widths = columnLengths.map((length) =>
    Math.max(4, Math.floor(length * scale))
  );

  const formatRow = (row: ExportCell[]) =>
    columns
      .map((_, index) => padCell(String(row[index] ?? ""), widths[index]))
      .join(" | ");

  const headerLine = formatRow(columns);
  const separator = widths.map((width) => "-".repeat(width)).join("-+-");

  const lines = [
    title.replace(/[^\x20-\x7e]/g, "?"),
    subtitle.replace(/[^\x20-\x7e]/g, "?"),
    "",
    headerLine,
    separator,
    ...rows.map((row) => formatRow(row)),
  ];

  const linesPerPage = Math.floor((pageHeight - margin * 2 - 20) / lineHeight);
  const pages: string[][] = [];

  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage));
  }

  if (pages.length === 0) {
    pages.push(lines);
  }

  const objects = new Map<number, string>();
  const pageIds = pages.map((_, index) => 4 + index * 2);
  const fontId = 3;

  objects.set(
    1,
    "<< /Type /Catalog /Pages 2 0 R >>"
  );
  objects.set(
    2,
    `<< /Type /Pages /Kids [${pageIds
      .map((id) => `${id} 0 R`)
      .join(" ")}] /Count ${pages.length} >>`
  );
  objects.set(
    fontId,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>"
  );

  pages.forEach((pageLines, index) => {
    const pageId = pageIds[index];
    const contentId = pageId + 1;

    const streamLines = pageLines.map((line, lineIndex) => {
      const command = `(${pdfText(line)}) Tj`;
      return lineIndex === 0 ? command : `0 -${lineHeight} Td\n${command}`;
    });

    const content = `BT\n/F1 ${fontSize} Tf\n${margin} ${
      pageHeight - margin
    } Td\n${streamLines.join("\n")}\nET`;

    objects.set(
      pageId,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] ` +
        `/Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`
    );
    objects.set(
      contentId,
      `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`
    );
  });

  const maxId = Math.max(...objects.keys());
  const parts: string[] = ["%PDF-1.4\n"];
  const offsets = new Map<number, number>();
  let byteLength = parts[0].length;

  for (let id = 1; id <= maxId; id += 1) {
    const body = objects.get(id);

    if (body === undefined) {
      continue;
    }

    offsets.set(id, byteLength);
    const chunk = `${id} 0 obj\n${body}\nendobj\n`;
    parts.push(chunk);
    byteLength += Buffer.byteLength(chunk, "latin1");
  }

  const xrefOffset = byteLength;
  const xrefLines = [
    "xref",
    `0 ${maxId + 1}`,
    "0000000000 65535 f ",
    ...Array.from({ length: maxId }, (_, index) => {
      const id = index + 1;
      const offset = offsets.get(id);

      return offset === undefined
        ? "0000000000 65535 f "
        : `${String(offset).padStart(10, "0")} 00000 n `;
    }),
  ];

  parts.push(xrefLines.join("\n"));
  parts.push(
    `\ntrailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  );

  return Buffer.from(parts.join(""), "latin1");
}
