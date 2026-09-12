import PDFDocument from 'pdfkit';

export type PaysheetRow = {
  contractorName: string;
  workerType: string;
  dailyCounts: Record<string, number | undefined>;
  totalLabours: number;
  amount: number;
  ratePerDay: number | null;
};

export type PaysheetData = {
  company: { name: string; address: string };
  site: { name: string; address: string };
  range: { from: string; to: string };
  dates: string[];
  rows: PaysheetRow[];
  overallTotalLabours: number;
  overallTotalAmount: number;
};

const PAGE_MARGIN = 30;
const TABLE_LEFT = PAGE_MARGIN;

function buildColumns(dates: string[]) {
  return [
    { key: 'sno', label: 'S.NO', width: 28 },
    { key: 'contractor', label: 'NAME OF CONTRACTOR', width: 105 },
    { key: 'details', label: 'DETAILS', width: 90 },
    ...dates.map((d) => ({ key: `day_${d}`, label: formatDayHeader(d), width: 58 })),
    { key: 'total', label: 'TOTAL LABOURS', width: 62 },
    { key: 'rate', label: 'RATE PER DAY', width: 62 },
    { key: 'amount', label: 'TOTAL', width: 65 },
    { key: 'stage', label: 'STAGE OF WORK', width: 105 },
    { key: 'signature', label: 'CONTRACTOR SIGNATURE', width: 105 },
  ];
}

function formatDayHeader(dateStr: string): string {
  const [, month, day] = dateStr.split('-');
  return `DATE\n${day}/${month}`;
}

function tableWidth(columns: { width: number }[]): number {
  return columns.reduce((sum, c) => sum + c.width, 0);
}

function drawCell(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  opts: { bold?: boolean; align?: 'left' | 'center' | 'right'; size?: number } = {}
) {
  doc.rect(x, y, width, height).stroke();
  if (!text) return;
  doc
    .font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
    .fontSize(opts.size ?? 7)
    .text(text, x + 3, y + 4, { width: width - 6, align: opts.align ?? 'left' });
}

function drawTableHeader(doc: PDFKit.PDFDocument, columns: ReturnType<typeof buildColumns>, y: number): number {
  const height = 26;
  let x = TABLE_LEFT;
  for (const col of columns) {
    drawCell(doc, x, y, col.width, height, col.label, { bold: true, align: 'center', size: 6.5 });
    x += col.width;
  }
  return y + height;
}

export function buildWagePaysheetPdf(data: PaysheetData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A3', layout: 'landscape', margin: PAGE_MARGIN });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const columns = buildColumns(data.dates);
    const width = tableWidth(columns);
    const pageBottom = doc.page.height - PAGE_MARGIN;

    let y = PAGE_MARGIN;

    doc.font('Helvetica-Bold').fontSize(15).text(data.company.name, TABLE_LEFT, y);
    y += 20;
    doc.font('Helvetica').fontSize(9).text(data.company.address, TABLE_LEFT, y);
    y += 18;

    drawCell(doc, TABLE_LEFT, y, width, 20, 'WEEKLY LABOUR PAYMENT SHEET', { bold: true, align: 'center', size: 11 });
    y += 20;

    const metaWidth = width / 4;
    const metaFields: [string, string][] = [
      ['Project Name', data.site.name],
      ['Location', data.site.address],
      ['Name of Engineer', ''],
      ['W/E PERIOD', `${data.range.from} to ${data.range.to}`],
    ];
    let metaX = TABLE_LEFT;
    for (const [label, value] of metaFields) {
      doc.rect(metaX, y, metaWidth, 18).stroke();
      doc.font('Helvetica-Bold').fontSize(7).text(label, metaX + 3, y + 5, { continued: false });
      doc.font('Helvetica').fontSize(7).text(value, metaX + 3, y + 5, { width: metaWidth - 6, align: 'right' });
      metaX += metaWidth;
    }
    y += 18;
    y += 14;

    doc.font('Helvetica-Bold').fontSize(9).text('CIVIL WORKS', TABLE_LEFT, y, { width, align: 'center' });
    y += 16;

    y = drawTableHeader(doc, columns, y);

    const rowHeight = 16;

    for (const row of data.rows) {
      if (y + rowHeight > pageBottom) {
        doc.addPage({ size: 'A3', layout: 'landscape', margin: PAGE_MARGIN });
        y = PAGE_MARGIN;
        y = drawTableHeader(doc, columns, y);
      }

      let x = TABLE_LEFT;
      const cellValues: Record<string, string> = {
        sno: '',
        contractor: row.contractorName,
        details: row.workerType,
        total: String(row.totalLabours),
        rate: row.ratePerDay !== null ? row.ratePerDay.toFixed(2) : '',
        amount: row.amount > 0 ? String(row.amount) : '',
        stage: '',
        signature: '',
      };
      for (const dateStr of data.dates) {
        cellValues[`day_${dateStr}`] = String(row.dailyCounts[dateStr] ?? '');
      }

      for (const col of columns) {
        const isNumeric = col.key === 'total' || col.key === 'rate' || col.key === 'amount' || col.key.startsWith('day_');
        drawCell(doc, x, y, col.width, rowHeight, cellValues[col.key] ?? '', {
          align: isNumeric ? 'center' : 'left',
        });
        x += col.width;
      }
      y += rowHeight;
    }

    if (y + rowHeight > pageBottom) {
      doc.addPage({ size: 'A3', layout: 'landscape', margin: PAGE_MARGIN });
      y = PAGE_MARGIN;
    }

    const totalsRowValues: Record<string, string> = {
      total: String(data.overallTotalLabours),
      amount: String(data.overallTotalAmount),
    };
    const totalsColumnIndex = columns.findIndex((c) => c.key === 'total');
    const preTotalsColumnsWidth = columns.slice(0, totalsColumnIndex).reduce((sum, c) => sum + c.width, 0);
    drawCell(doc, TABLE_LEFT, y, preTotalsColumnsWidth, rowHeight, 'OVERALL TOTAL', { bold: true, align: 'center' });

    let totalsX = TABLE_LEFT + preTotalsColumnsWidth;
    for (const col of columns.slice(totalsColumnIndex)) {
      drawCell(doc, totalsX, y, col.width, rowHeight, totalsRowValues[col.key] ?? '', { bold: true, align: 'center' });
      totalsX += col.width;
    }
    y += rowHeight;

    y += 10;
    doc.font('Helvetica-Bold').fontSize(8).text('Remarks :', TABLE_LEFT, y);
    doc.rect(TABLE_LEFT, y + 12, width, 36).stroke();
    y += 60;

    const signatories = ['Prepared By', 'Checked By', 'Verified By', 'Checked By', 'Verified By', 'Approved By'];
    const sigWidth = width / signatories.length;
    let sigX = TABLE_LEFT;
    for (const label of signatories) {
      doc.font('Helvetica').fontSize(8).text(label, sigX, y, { width: sigWidth, align: 'center' });
      sigX += sigWidth;
    }

    doc.end();
  });
}
