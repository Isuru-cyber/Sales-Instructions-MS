export enum Role {
  Admin = 'Admin',
  Commercial = 'Commercial',
  Sales = 'Sales',
}

export enum InstructionStatus {
  Pending = 'Pending',
  Completed = 'Completed',
}

export interface User {
  id: number;
  username: string;
  fullName: string;
  shortName: string;
  role: Role;
  isActive: boolean;
}

export interface CustomerCode {
  id: number;
  code: string;
  description: string;
  commercialUserId: number | null; // ID of the commercial user assigned
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface Instruction {
  id: number;
  referenceNumber: string;
  createdAt: string; // ISO string
  creName: string;
  creUserId: number;
  customerCode: string;
  location: string;
  salesOrder: string;
  productionOrder: string;
  assignedCommercialUserId: number | null;
  status: InstructionStatus;
  currentUpdate: string;
  commentsSales: string;
  commentsCommercial: string;
  completedAt?: string;
  isDeleted: boolean;
}

export interface ActivityLog {
  id: number;
  userId: number;
  userName: string;
  action: string;
  details: string; // JSON string
  timestamp: string;
}

export interface AppSettings {
  cutoffEnabled: boolean;
  cutoffStart: string; // "11:00"
  cutoffEnd: string; // "15:00"
  autoDeleteDays: number;
  lastBackup: string | null;
}

export const QUICK_UPDATES = [
  "Not ready to invoice",
  "Approval pending",
  "Mismatch",
  "FG Transit",
  "Delayed",
  "Under review",
  "Separate Pending",
  "QA Data Error",
  "Approved"
];