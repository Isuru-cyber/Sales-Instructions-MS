import { supabase } from './supabaseClient';
import { Role, User, Instruction, InstructionStatus, CustomerCode, ActivityLog, AppSettings } from '../types';

// Map DB snake_case to TS camelCase
const mapUser = (u: any): User => ({
    id: u.id,
    username: u.username,
    fullName: u.full_name,
    shortName: u.short_name,
    role: u.role as Role,
    isActive: u.is_active
});

const mapInstruction = (i: any): Instruction => ({
    id: i.id,
    referenceNumber: i.reference_number,
    createdAt: i.created_at,
    creName: i.cre_name,
    creUserId: i.cre_user_id,
    customerCode: i.customer_code,
    location: i.location,
    salesOrder: i.sales_order,
    productionOrder: i.production_order,
    assignedCommercialUserId: i.assigned_commercial_user_id,
    status: i.status as InstructionStatus,
    currentUpdate: i.current_update,
    commentsSales: i.comments_sales,
    commentsCommercial: i.comments_commercial,
    completedAt: i.completed_at,
    isDeleted: i.is_deleted
});

const mapCode = (c: any): CustomerCode => ({
    id: c.id,
    code: c.code,
    description: c.description,
    commercialUserId: c.commercial_user_id,
    status: c.status,
    createdAt: c.created_at
});

class SupabaseStore {
  
  async login(username: string, password?: string): Promise<User | null> {
    const trimmedUsername = (username || '').trim();
    const trimmedPassword = (password || '').trim();

    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', trimmedUsername)
            .eq('password', trimmedPassword)
            .eq('is_active', true)
            .single();
        
        if (data && !error) {
            const user = mapUser(data);
            await this.addLog(user.id, user.username, 'Login', 'User logged in (Database)');
            return user;
        }
    } catch (e) {
        console.error("Database login failed:", e);
    }
    
    return null;
  }

  async logout(user: User) {
    try {
        await this.addLog(user.id, user.username, 'Logout', 'User logged out');
    } catch (e) {}
  }

  async addLog(userId: number, userName: string, action: string, details: string) {
    try {
        await supabase.from('activity_logs').insert({
            user_id: userId,
            user_name: userName,
            action,
            details,
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        console.warn("Could not write log to Supabase.");
    }
  }

  async getLogs(): Promise<ActivityLog[]> {
    try {
        const { data } = await supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(100);
        return (data || []).map((l: any) => ({
            id: l.id,
            userId: l.user_id,
            userName: l.user_name,
            action: l.action,
            details: l.details,
            timestamp: l.timestamp
        }));
    } catch (e) {
        return [];
    }
  }

  async getUsers(): Promise<User[]> {
      try {
          const { data } = await supabase.from('users').select('*').order('id');
          return (data || []).map(mapUser);
      } catch (e) {
          return [];
      }
  }

  async addUser(user: Partial<User> & { password?: string }, adminUser: User): Promise<void> {
      const { data, error } = await supabase.from('users').insert({
          username: user.username,
          password: user.password || user.username,
          full_name: user.fullName,
          short_name: user.shortName,
          role: user.role,
          is_active: true
      }).select().single();

      if (!error && data) {
          await this.addLog(adminUser.id, adminUser.username, 'Add User', `Added user ${data.username}`);
      }
  }

  async updateUser(id: number, updates: Partial<User> & { password?: string }, adminUser: User): Promise<void> {
      const payload: any = {};
      if (updates.fullName) payload.full_name = updates.fullName;
      if (updates.username) payload.username = updates.username;
      if (updates.role) payload.role = updates.role;
      if (updates.password) payload.password = updates.password;

      const { error } = await supabase.from('users').update(payload).eq('id', id);
      
      if (!error) {
          let details = `Updated details for user ID ${id}`;
          if (updates.password) details += ' (Password Reset)';
          await this.addLog(adminUser.id, adminUser.username, 'Update User', details);
      }
  }

  async toggleUserStatus(id: number, adminUser: User): Promise<void> {
      const { data } = await supabase.from('users').select('is_active').eq('id', id).single();
      if (data) {
          const newStatus = !data.is_active;
          await supabase.from('users').update({ is_active: newStatus }).eq('id', id);
          await this.addLog(adminUser.id, adminUser.username, 'Update User', `Set status ${newStatus ? 'Active' : 'Inactive'} for user ID ${id}`);
      }
  }

  async deleteUser(id: number, adminUser: User): Promise<void> {
      await supabase.from('users').delete().eq('id', id);
      await this.addLog(adminUser.id, adminUser.username, 'Delete User', `Deleted user ID ${id}`);
  }

  async changePassword(userId: number, current: string, newPass: string): Promise<boolean> {
      try {
          const { data } = await supabase.from('users').select('password, username').eq('id', userId).single();
          if (data && data.password === current) {
              await supabase.from('users').update({ password: newPass }).eq('id', userId);
              await this.addLog(userId, data.username, 'Change Password', 'User changed their own password');
              return true;
          }
      } catch (e) {}
      return false;
  }

  async getCustomerCodes(): Promise<CustomerCode[]> {
      try {
          const { data } = await supabase.from('customer_codes').select('*').order('code');
          return (data || []).map(mapCode);
      } catch (e) {
          return [];
      }
  }

  async addMapping(code: string, description: string, commercialUserId: number | null, adminUser: User): Promise<void> {
      await supabase.from('customer_codes').insert({
          code,
          description,
          commercial_user_id: commercialUserId,
          status: 'Active'
      });
      await this.addLog(adminUser.id, adminUser.username, 'Add Mapping', `Added mapping for ${code}`);
  }

  async updateMapping(id: number, updates: Partial<CustomerCode>, adminUser: User): Promise<void> {
      const payload: any = {};
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.commercialUserId !== undefined) payload.commercial_user_id = updates.commercialUserId;
      
      await supabase.from('customer_codes').update(payload).eq('id', id);
      await this.addLog(adminUser.id, adminUser.username, 'Update Mapping', `Updated mapping ID ${id}`);
  }

  async deleteMapping(id: number, adminUser: User): Promise<void> {
      await supabase.from('customer_codes').delete().eq('id', id);
      await this.addLog(adminUser.id, adminUser.username, 'Delete Mapping', `Deleted mapping ID ${id}`);
  }

  async getSettings(): Promise<AppSettings> {
      try {
          const { data } = await supabase.from('app_settings').select('*').limit(1).single();
          if (data) {
              return {
                  cutoffEnabled: data.cutoff_enabled,
                  cutoffStart: data.cutoff_start,
                  cutoffEnd: data.cutoff_end,
                  autoDeleteDays: data.auto_delete_days,
                  lastBackup: null
              };
          }
      } catch (e) {}
      return {
          cutoffEnabled: false,
          cutoffStart: "10:00",
          cutoffEnd: "15:00",
          autoDeleteDays: 14,
          lastBackup: null
      };
  }

  async saveSettings(settings: AppSettings): Promise<void> {
      try {
          const { data } = await supabase.from('app_settings').select('id').limit(1);
          if (data && data.length > 0) {
              await supabase.from('app_settings').update({
                  cutoff_enabled: settings.cutoffEnabled,
                  cutoff_start: settings.cutoffStart,
                  cutoff_end: settings.cutoffEnd,
                  auto_delete_days: settings.autoDeleteDays
              }).eq('id', data[0].id);
          } else {
               await supabase.from('app_settings').insert({
                  cutoff_enabled: settings.cutoffEnabled,
                  cutoff_start: settings.cutoffStart,
                  cutoff_end: settings.cutoffEnd,
                  auto_delete_days: settings.autoDeleteDays
              });
          }
      } catch (e) {}
  }

  async getBackupData(): Promise<string> {
      return JSON.stringify({ message: "Backup download not supported via client-side in this version" });
  }

  async performCleanup(adminUser: User): Promise<number> {
     const settings = await this.getSettings();
     const days = settings.autoDeleteDays;
     const cutoffDate = new Date();
     cutoffDate.setDate(cutoffDate.getDate() - days);
     
     try {
         const { data } = await supabase
            .from('instructions')
            .delete()
            .eq('status', InstructionStatus.Completed)
            .lt('completed_at', cutoffDate.toISOString())
            .select();
         
         const count = data ? data.length : 0;
         if (count > 0) {
            await this.addLog(adminUser.id, adminUser.username, 'Cleanup', `Removed ${count} records older than ${days} days.`);
         }
         return count;
     } catch (e) {
         return 0;
     }
  }

  async getInstructions(user: User): Promise<Instruction[]> {
    try {
        let query = supabase.from('instructions').select('*').eq('is_deleted', false).order('created_at', { ascending: false });

        if (user.role === Role.Sales) {
            query = query.eq('cre_user_id', user.id);
        }
        
        const { data } = await query;
        return (data || []).map(mapInstruction);
    } catch (e) {
        return [];
    }
  }

  async submitInstructions(data: Partial<Instruction>[], user: User): Promise<boolean> {
    const settings = await this.getSettings();
    
    if (settings.cutoffEnabled) {
      const now = new Date();
      const currentTimeVal = now.getHours() * 60 + now.getMinutes();
      const [startH, startM] = settings.cutoffStart.split(':').map(Number);
      const [endH, endM] = settings.cutoffEnd.split(':').map(Number);
      const startTimeVal = startH * 60 + startM;
      const endTimeVal = endH * 60 + endM;

      const isBlocked = startTimeVal <= endTimeVal
          ? (currentTimeVal >= startTimeVal && currentTimeVal <= endTimeVal)
          : (currentTimeVal >= startTimeVal || currentTimeVal <= endTimeVal);

      if (isBlocked) {
        throw new Error(`Submission blocked. Cutoff active between ${settings.cutoffStart} and ${settings.cutoffEnd}.`);
      }
    }

    const allCodes = await this.getCustomerCodes();
    
    let countVal = 0;
    try {
        const { count } = await supabase.from('instructions').select('*', { count: 'exact', head: true });
        countVal = count || 0;
    } catch (e) {}
    
    let refCounter = countVal + 100;

    const payload = data.map((item, index) => {
        const codeMapping = allCodes.find(c => c.code === item.customerCode);
        const assignedUser = codeMapping ? codeMapping.commercialUserId : null;

        refCounter++;
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        // Updated: YYYYMMDD + ID format (removed user short name)
        const refNum = `${dateStr}${String(refCounter + index).padStart(4, '0')}`;

        return {
            reference_number: refNum,
            created_at: new Date().toISOString(),
            cre_name: user.shortName,
            cre_user_id: user.id,
            customer_code: item.customerCode || '',
            location: item.location || '',
            sales_order: item.salesOrder || '',
            production_order: item.productionOrder || '',
            assigned_commercial_user_id: assignedUser,
            status: InstructionStatus.Pending,
            comments_sales: (item.commentsSales || '').toUpperCase(),
            comments_commercial: '',
            is_deleted: false
        };
    });

    const { error } = await supabase.from('instructions').insert(payload);
    if (error) throw new Error(error.message);

    await this.addLog(user.id, user.username, 'Submit Instructions', `Submitted ${payload.length} instructions.`);
    
    const uniqueCodes = Array.from(new Set(payload.map(i => i.customer_code)));
    for (const code of uniqueCodes) {
        if (!allCodes.find(c => c.code === code)) {
            await this.addMapping(code, 'Auto-created', null, user);
        }
    }

    return true;
  }

  async updateInstruction(id: number, updates: Partial<Instruction>, user: User) {
    const payload: any = {};
    if (updates.commentsSales !== undefined) payload.comments_sales = updates.commentsSales.toUpperCase();
    if (updates.commentsCommercial !== undefined) payload.comments_commercial = updates.commentsCommercial;
    if (updates.status !== undefined) {
        payload.status = updates.status;
        if (updates.status === InstructionStatus.Completed) {
            payload.completed_at = new Date().toISOString();
        }
    }
    if (updates.currentUpdate !== undefined) payload.current_update = updates.currentUpdate;

    const { error } = await supabase.from('instructions').update(payload).eq('id', id);
    if (!error) {
         await this.addLog(user.id, user.username, 'Update Instruction', `Updated instruction ID ${id}`);
    }
  }

  async getKPIData() {
    try {
        const { data } = await supabase.from('instructions').select('status, cre_user_id, is_deleted');
        const validData = (data || []).filter((i: any) => !i.is_deleted);
        
        const total = validData.length;
        const pending = validData.filter((i: any) => i.status === InstructionStatus.Pending).length;
        const completed = validData.filter((i: any) => i.status === InstructionStatus.Completed).length;
        
        const users = await this.getUsers();
        const salesUsers = users.filter(u => u.role === Role.Sales);
        
        const userStats = salesUsers.map(u => ({
            name: u.username,
            count: validData.filter((i: any) => i.cre_user_id === u.id).length
        }));
        
        return { total, pending, completed, userStats };
    } catch (e) {
        return { total: 0, pending: 0, completed: 0, userStats: [] };
    }
  }
}

export const mockStore = new SupabaseStore();