import { Role, User, Instruction, InstructionStatus, CustomerCode, ActivityLog, AppSettings } from '../types';

// --- Initial Mock Data ---

const INITIAL_USERS: User[] = [
  { id: 1, username: 'admin', fullName: 'Admin User', shortName: 'ADM', role: Role.Admin, isActive: true },
  { id: 2, username: 'sales1', fullName: 'Sales Representative 1', shortName: 'SL1', role: Role.Sales, isActive: true },
  { id: 3, username: 'comm1', fullName: 'Commercial Manager 1', shortName: 'CM1', role: Role.Commercial, isActive: true },
  { id: 4, username: 'comm2', fullName: 'Commercial Manager 2', shortName: 'CM2', role: Role.Commercial, isActive: true },
  { id: 5, username: 'sales2', fullName: 'Sales Representative 2', shortName: 'SL2', role: Role.Sales, isActive: true },
];

const INITIAL_CODES: CustomerCode[] = [
  { id: 1, code: 'CUST001', description: 'Tech Corp', commercialUserId: 3, status: 'Active', createdAt: '2025-01-15T10:00:00Z' },
  { id: 2, code: 'CUST002', description: 'Logistics Ltd', commercialUserId: 4, status: 'Active', createdAt: '2025-02-20T14:30:00Z' },
  { id: 3, code: 'CUST003', description: 'Retail Inc', commercialUserId: 3, status: 'Active', createdAt: '2025-03-05T09:15:00Z' },
  { id: 4, code: 'B00019-T', description: 'Bodyline', commercialUserId: 3, status: 'Active', createdAt: '2025-12-12T08:00:00Z' },
];

const INITIAL_SETTINGS: AppSettings = {
  cutoffEnabled: true,
  cutoffStart: '10:00',
  cutoffEnd: '15:00',
  autoDeleteDays: 14,
  lastBackup: new Date().toISOString(),
};

// Generate some mock instructions
const generateMockInstructions = (): Instruction[] => {
  const instructions: Instruction[] = [];
  const now = new Date();
  for (let i = 0; i < 15; i++) {
    const isCompleted = i % 5 === 0;
    instructions.push({
      id: i + 1,
      referenceNumber: `202405${10 + i}SL100${i}`,
      createdAt: new Date(now.getTime() - i * 86400000).toISOString(),
      creName: i % 2 === 0 ? 'SL1' : 'SL2',
      creUserId: i % 2 === 0 ? 2 : 5,
      customerCode: i % 3 === 0 ? 'CUST001' : 'CUST002',
      location: i % 2 === 0 ? 'New York' : 'London',
      salesOrder: `SO-900${i}`,
      productionOrder: `PO-800${i}`,
      assignedCommercialUserId: i % 3 === 0 ? 3 : 4,
      status: isCompleted ? InstructionStatus.Completed : InstructionStatus.Pending,
      currentUpdate: isCompleted ? 'Approved' : 'Under review',
      commentsSales: `Initial request for order ${i}`,
      commentsCommercial: isCompleted ? 'Processed successfully' : '',
      completedAt: isCompleted ? new Date(now.getTime() - i * 86400000 + 3600000).toISOString() : undefined,
      isDeleted: false,
    });
  }
  return instructions;
};

// --- In-Memory Store ---

class MockStore {
  users = INITIAL_USERS;
  customerCodes = INITIAL_CODES;
  instructions = generateMockInstructions();
  settings = INITIAL_SETTINGS;
  logs: ActivityLog[] = [];
  currentUser: User | null = null;
  referenceCounter = 100;

  login(username: string): User | null {
    const user = this.users.find(u => u.username === username && u.isActive);
    if (user) {
      this.currentUser = user;
      this.addLog(user.id, 'Login', 'User logged in');
      return user;
    }
    return null;
  }

  logout() {
    if (this.currentUser) {
      this.addLog(this.currentUser.id, 'Logout', 'User logged out');
      this.currentUser = null;
    }
  }

  addLog(userId: number, action: string, details: string) {
    this.logs.unshift({
      id: this.logs.length + 1,
      userId,
      userName: this.users.find(u => u.id === userId)?.username || 'Unknown',
      action,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  // --- User Management ---
  addUser(user: Partial<User>, adminUser: User): void {
      const newUser: User = {
          id: this.users.length + 1,
          username: user.username || `User${this.users.length + 1}`,
          fullName: user.fullName || user.username || 'New User',
          shortName: user.shortName || 'USR',
          role: user.role || Role.Sales,
          isActive: true
      };
      this.users.push(newUser);
      this.addLog(adminUser.id, 'Add User', `Added user ${newUser.username} (${newUser.role})`);
  }

  updateUser(id: number, updates: Partial<User> & { password?: string }, adminUser: User): void {
      const idx = this.users.findIndex(u => u.id === id);
      if (idx !== -1) {
          const updatedUser = { ...this.users[idx], ...updates };
          delete (updatedUser as any).password; // Don't store password in user object for this mock
          this.users[idx] = updatedUser;
          
          let details = `Updated details for ${updatedUser.username}`;
          if (updates.password) {
              details += ' (Password Reset)';
          }
          this.addLog(adminUser.id, 'Update User', details);
      }
  }

  toggleUserStatus(userId: number, adminUser: User): void {
      const user = this.users.find(u => u.id === userId);
      if (user) {
          user.isActive = !user.isActive;
          this.addLog(adminUser.id, 'Update User', `Set status ${user.isActive ? 'Active' : 'Inactive'} for ${user.username}`);
      }
  }

  deleteUser(userId: number, adminUser: User): void {
      this.users = this.users.filter(u => u.id !== userId);
      this.addLog(adminUser.id, 'Delete User', `Deleted user ID ${userId}`);
  }

  resetUserPassword(userId: number, adminUser: User): void {
      const user = this.users.find(u => u.id === userId);
      if (user) {
          this.addLog(adminUser.id, 'Reset Password', `Reset password for user ${user.username}`);
      }
  }

  changePassword(userId: number, current: string, newPass: string): boolean {
      if (current && newPass) {
          this.addLog(userId, 'Change Password', 'User changed their own password');
          return true;
      }
      return false;
  }

  // --- Mapping Management ---
  addMapping(code: string, description: string, commercialUserId: number | null, adminUser: User): void {
      this.customerCodes.push({
          id: this.customerCodes.length + 1,
          code,
          description,
          commercialUserId,
          status: 'Active',
          createdAt: new Date().toISOString()
      });
      this.addLog(adminUser.id, 'Add Mapping', `Added mapping for ${code}`);
  }

  updateMapping(id: number, updates: Partial<CustomerCode>, adminUser: User): void {
      const idx = this.customerCodes.findIndex(c => c.id === id);
      if (idx !== -1) {
          this.customerCodes[idx] = { ...this.customerCodes[idx], ...updates };
          this.addLog(adminUser.id, 'Update Mapping', `Updated mapping for ${this.customerCodes[idx].code}`);
      }
  }

  deleteMapping(id: number, adminUser: User): void {
      const mapping = this.customerCodes.find(c => c.id === id);
      if (mapping) {
          this.customerCodes = this.customerCodes.filter(c => c.id !== id);
          this.addLog(adminUser.id, 'Delete Mapping', `Deleted mapping for ${mapping.code}`);
      }
  }

  // --- Data Management ---
  getBackupData(): string {
      return JSON.stringify({
          users: this.users,
          customerCodes: this.customerCodes,
          instructions: this.instructions,
          settings: this.settings,
          logs: this.logs
      }, null, 2);
  }

  performCleanup(adminUser: User): number {
      const days = this.settings.autoDeleteDays;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const initialCount = this.instructions.length;
      this.instructions = this.instructions.filter(i => 
        !(i.status === InstructionStatus.Completed && i.completedAt && new Date(i.completedAt) < cutoffDate)
      );

      const deletedCount = initialCount - this.instructions.length;
      
      if (deletedCount > 0) {
        this.addLog(adminUser.id, 'Cleanup', `Removed ${deletedCount} records older than ${days} days.`);
      }
      
      return deletedCount;
  }

  getInstructions(user: User): Instruction[] {
    if (user.role === Role.Admin) {
      return this.instructions.filter(i => !i.isDeleted);
    } else if (user.role === Role.Sales) {
      return this.instructions.filter(i => i.creUserId === user.id && !i.isDeleted);
    } else if (user.role === Role.Commercial) {
      return this.instructions.filter(i => i.assignedCommercialUserId === user.id && !i.isDeleted);
    }
    return [];
  }

  submitInstructions(data: Partial<Instruction>[], user: User): boolean {
    if (this.settings.cutoffEnabled) {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const [startH, startM] = this.settings.cutoffStart.split(':').map(Number);
      const [endH, endM] = this.settings.cutoffEnd.split(':').map(Number);
      
      const currentTimeVal = currentHours * 60 + currentMinutes;
      const startTimeVal = startH * 60 + startM;
      const endTimeVal = endH * 60 + endM;

      if (currentTimeVal >= startTimeVal && currentTimeVal <= endTimeVal) {
        throw new Error(`Submission blocked. Cutoff active between ${this.settings.cutoffStart} and ${this.settings.cutoffEnd}.`);
      }
    }

    const batchRef = `REF-${Date.now()}`;
    const newInstructions: Instruction[] = data.map((item, index) => {
        const codeMapping = this.customerCodes.find(c => c.code === item.customerCode);
        const assignedUser = codeMapping ? codeMapping.commercialUserId : null;

        this.referenceCounter++;
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const refNum = `${dateStr}${user.shortName}${String(this.referenceCounter).padStart(3, '0')}`;

        return {
            id: this.instructions.length + 1 + index,
            referenceNumber: refNum,
            createdAt: new Date().toISOString(),
            creName: user.shortName,
            creUserId: user.id,
            customerCode: item.customerCode || '',
            location: item.location || '',
            salesOrder: item.salesOrder || '',
            productionOrder: item.productionOrder || '',
            assignedCommercialUserId: assignedUser,
            status: InstructionStatus.Pending,
            currentUpdate: '',
            commentsSales: item.commentsSales || '',
            commentsCommercial: '',
            isDeleted: false
        } as Instruction;
    });

    for (const ni of newInstructions) {
        const exists = this.instructions.find(i => 
            !i.isDeleted && 
            i.salesOrder === ni.salesOrder && 
            i.productionOrder === ni.productionOrder
        );
        if (exists) {
            throw new Error(`Duplicate detected on server: SO ${ni.salesOrder} / PO ${ni.productionOrder}`);
        }
    }

    this.instructions.push(...newInstructions);
    this.addLog(user.id, 'Submit Instructions', `Submitted ${newInstructions.length} instructions. Batch: ${batchRef}`);
    
    // If unknown code, add it
    const uniqueCodes = Array.from(new Set(newInstructions.map(i => i.customerCode)));
    uniqueCodes.forEach(code => {
        if (!this.customerCodes.find(c => c.code === code)) {
            this.customerCodes.push({
                id: this.customerCodes.length + 1,
                code: code,
                description: 'Auto-created',
                commercialUserId: null,
                status: 'Active',
                createdAt: new Date().toISOString()
            });
            this.addLog(user.id, 'Auto-Create Code', `Created new customer code: ${code}`);
        }
    });

    return true;
  }

  updateInstruction(id: number, updates: Partial<Instruction>, user: User) {
    const idx = this.instructions.findIndex(i => i.id === id);
    if (idx === -1) return;

    const old = this.instructions[idx];
    const updated = { ...old, ...updates };

    if (old.status !== updated.status && updated.status === InstructionStatus.Completed) {
        updated.completedAt = new Date().toISOString();
    }

    this.instructions[idx] = updated;
    this.addLog(user.id, 'Update Instruction', `Updated ${old.referenceNumber}. Changes: ${JSON.stringify(updates)}`);
  }

  getKPIData() {
    const total = this.instructions.filter(i => !i.isDeleted).length;
    const pending = this.instructions.filter(i => !i.isDeleted && i.status === InstructionStatus.Pending).length;
    const completed = this.instructions.filter(i => !i.isDeleted && i.status === InstructionStatus.Completed).length;
    
    const userStats = this.users
        .filter(u => u.role === Role.Sales)
        .map(u => ({
            name: u.username,
            count: this.instructions.filter(i => i.creUserId === u.id).length
        }));
    
    return { total, pending, completed, userStats };
  }

  generateReference(creShort: string): string {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      return `${dateStr}${creShort}XXX`; 
  }
}

export const mockStore = new MockStore();