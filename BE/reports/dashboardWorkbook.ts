import ExcelJS from 'exceljs';

export type WageExportEntry = {
  date: string;
  count: number;
  paid: boolean;
  notes?: string;
};

export type WageExportGroup = {
  contractorName: string;
  workerType: string;
  entries: WageExportEntry[];
  totalWorkerCount: number;
  amount: number;
};

type InventoryExportRow = {
  name: string;
  unit: string;
  stockIn: number;
  usage: number;
  balanceStock: number;
};

export type DashboardExportData = {
  range: { from: string; to: string };
  wageGroups: WageExportGroup[];
  inventoryRows: InventoryExportRow[];
};

const PAID_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
const UNPAID_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

// Sets the value on the group's first row and merges it down through the last row of the
// group, so Contractor/Worker Type/Total/Amount read as one cell per work-log group instead
// of repeating on every date row.
function mergeAndSet(sheet: ExcelJS.Worksheet, colKey: string, startRow: number, endRow: number, value: string | number) {
  const col = sheet.getColumn(colKey).number;
  const cell = sheet.getCell(startRow, col);
  cell.value = value;
  cell.alignment = { vertical: 'middle' };
  if (endRow > startRow) {
    sheet.mergeCells(startRow, col, endRow, col);
  }
}

export async function buildDashboardWorkbook(data: DashboardExportData): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Construction Inventory';
  workbook.created = new Date();

  const wagesSheet = workbook.addWorksheet('Wages');
  wagesSheet.columns = [
    { header: 'Contractor', key: 'contractorName', width: 24 },
    { header: 'Worker Type', key: 'workerType', width: 18 },
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Workers Count', key: 'count', width: 14 },
    { header: 'Total Workers Count', key: 'total', width: 18 },
    { header: 'Amount', key: 'amount', width: 14 },
    { header: 'Note', key: 'note', width: 30 },
  ];
  wagesSheet.getRow(1).font = { bold: true };

  let totalWorkerCount = 0;
  let totalAmount = 0;
  let currentRow = 2;

  for (const group of data.wageGroups) {
    if (group.entries.length === 0) continue;
    const startRow = currentRow;

    for (const entry of group.entries) {
      const addedRow = wagesSheet.addRow({ date: formatDate(entry.date), count: entry.count, note: entry.notes ?? '' });
      addedRow.getCell('count').fill = entry.paid ? PAID_FILL : UNPAID_FILL;
      currentRow += 1;
    }

    const endRow = currentRow - 1;
    mergeAndSet(wagesSheet, 'contractorName', startRow, endRow, group.contractorName);
    mergeAndSet(wagesSheet, 'workerType', startRow, endRow, group.workerType);
    mergeAndSet(wagesSheet, 'total', startRow, endRow, group.totalWorkerCount);
    mergeAndSet(wagesSheet, 'amount', startRow, endRow, group.amount);

    totalWorkerCount += group.totalWorkerCount;
    totalAmount += group.amount;
  }

  const wagesTotalsRow = wagesSheet.addRow({ contractorName: 'TOTAL', total: totalWorkerCount, amount: totalAmount });
  wagesTotalsRow.font = { bold: true };

  const inventorySheet = workbook.addWorksheet('Inventory');
  inventorySheet.columns = [
    { header: 'Item', key: 'name', width: 24 },
    { header: 'Unit', key: 'unit', width: 10 },
    { header: 'Total Import', key: 'stockIn', width: 14 },
    { header: 'Usage', key: 'usage', width: 12 },
    { header: 'Balance Stock', key: 'balanceStock', width: 14 },
  ];
  inventorySheet.getRow(1).font = { bold: true };

  let totalStockIn = 0;
  let totalUsage = 0;
  for (const row of data.inventoryRows) {
    inventorySheet.addRow(row);
    totalStockIn += row.stockIn;
    totalUsage += row.usage;
  }
  const inventoryTotalsRow = inventorySheet.addRow({ name: 'TOTAL', stockIn: totalStockIn, usage: totalUsage });
  inventoryTotalsRow.font = { bold: true };

  return workbook.xlsx.writeBuffer();
}
