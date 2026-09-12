export type User = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'super_admin' | 'admin' | 'engineer';
  assignedSites: string[];
  createdAt: string;
  updatedAt: string;
};

export type CreateEngineerResult = User & { temporaryPassword: string };

export type EnterpriseSettings = {
  name: string;
  address: string;
};

export type Admin = User & { enterprise: EnterpriseSettings };

export type CreateAdminResult = Admin & { temporaryPassword: string };

export type PaginatedResult<T> = { items: T[]; total: number; page: number; limit: number };

export type AuthResponse = {
  token: string;
  user: User;
};

export type Site = {
  _id: string;
  name: string;
  address: string;
  client?: string;
  startDate: string;
  endDate?: string;
  status: 'planned' | 'active' | 'completed' | 'on-hold';
  createdAt: string;
  updatedAt: string;
};

export type DailyLog = {
  _id: string;
  site: string;
  contractor: string;
  workLog?: string;
  date: string;
  workerType: string;
  count: number;
  paid: boolean;
  weather?: string;
  notes?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkLogBucket = 'current' | 'upcoming' | 'previous';

export type WorkLogOverlap = {
  contractorId: string;
  contractorName: string;
  ranges: { from: string; to: string }[];
};

export type WorkLog = {
  _id: string;
  site: string;
  contractor: string;
  contractorName: string;
  from: string;
  to: string;
  createdBy?: string;
  createdByName?: string;
  entryCount: number;
  totalWorkerCount: number;
  fullyPaid: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Contractor = {
  _id: string;
  site: string;
  name: string;
  phone?: string;
  workerTypes: string[];
  createdAt: string;
  updatedAt: string;
};

export type WageSummaryRow = {
  contractorId: string;
  contractorName: string;
  workerType: string;
  daysWorked: number;
  totalWorkerCount: number;
  unpaidDays: number;
  unpaidWorkerCount: number;
  paidAmount: number;
};

export type WorkLogPayableRow = {
  workerType: string;
  totalWorkerCount: number;
  unpaidWorkerCount: number;
  paidAmount: number;
};

export type WorkLogPayable = {
  workLogId: string;
  contractorId: string;
  contractorName: string;
  from: string;
  to: string;
  rows: WorkLogPayableRow[];
};

export type RecentWagePayment = {
  paymentId: string;
  contractorId: string;
  contractorName: string;
  workerType: string;
  from: string;
  to: string;
  amount: number;
};

export type InventoryItem = {
  _id: string;
  site: string;
  name: string;
  category: 'material' | 'tool' | 'equipment';
  unit: string;
  quantity: number;
  minThreshold?: number;
  lowStock: boolean;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
};

export type InventoryTransaction = {
  _id: string;
  site: string;
  item: string;
  type: 'stock-in' | 'usage';
  quantity: number;
  date: string;
  previousQuantity: number;
  newQuantity: number;
  note?: string;
  recordedBy?: string;
  recordedByName?: string;
  createdAt: string;
  updatedAt: string;
};

export type DashboardSummary = {
  range: { from: string; to: string };
  wages: {
    totalWorkerCount: number;
    unpaidWorkerCount: number;
    entryCount: number;
  };
  inventory: {
    totalStockIn: number;
    totalUsage: number;
    byItem: {
      itemId: string;
      name: string;
      unit: string;
      stockIn: number;
      usage: number;
      balanceStock: number;
    }[];
  };
};
