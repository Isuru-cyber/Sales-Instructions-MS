import React, { useState, useMemo } from 'react';
import { Card, Button, Input, Select, Modal } from '../components/Common';
import { useAuth } from '../App';
import { Role, User, CustomerCode } from '../types';
import { 
    Save, User as UserIcon, Database, Clock, Plus, 
    Search, Filter, Shield, Briefcase, DollarSign, Trash2, Lock, RefreshCw, Power, CheckCircle, Edit2, MoreHorizontal
} from 'lucide-react';
import { mockStore } from '../services/mockService';

// --- Sub-components for Tabs ---

const TabButton: React.FC<{ 
    id: string; 
    label: string; 
    active: string; 
    onClick: (id: string) => void; 
}> = ({ id, label, active, onClick }) => (
    <button
        onClick={() => onClick(id)}
        className={`
            px-6 py-2.5 text-sm font-medium transition-all relative
            ${active === id ? 'text-gray-900 bg-white shadow-sm rounded-md' : 'text-gray-500 hover:text-gray-700'}
        `}
    >
        {label}
    </button>
);

// --- 1. Users Tab ---

const UsersTab: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState(mockStore.users);
    
    // Modal States
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
    
    // Form States
    const [newUser, setNewUser] = useState({ username: '', fullName: '', shortName: '', role: Role.Sales, password: '' });
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editFormData, setEditFormData] = useState({ fullName: '', username: '', role: Role.Sales, newPassword: '' });

    const refreshUsers = () => setUsers([...mockStore.users]);

    // Add User Logic
    const handleAddUser = () => {
        if (!newUser.username || !newUser.shortName) return;
        if (!currentUser) return;
        
        mockStore.addUser({
            username: newUser.username,
            fullName: newUser.fullName || newUser.username,
            shortName: newUser.shortName,
            role: newUser.role
        }, currentUser);
        
        setIsAddUserModalOpen(false);
        setNewUser({ username: '', fullName: '', shortName: '', role: Role.Sales, password: '' });
        refreshUsers();
        alert('User added successfully');
    };

    // Edit User Logic
    const openEditModal = (user: User) => {
        setEditingUser(user);
        setEditFormData({
            fullName: user.fullName || user.username,
            username: user.username,
            role: user.role,
            newPassword: ''
        });
        setIsEditUserModalOpen(true);
    };

    const handleUpdateUser = () => {
        if (!editingUser || !currentUser) return;
        
        mockStore.updateUser(editingUser.id, {
            fullName: editFormData.fullName,
            username: editFormData.username,
            role: editFormData.role,
            password: editFormData.newPassword || undefined
        }, currentUser);

        setIsEditUserModalOpen(false);
        setEditingUser(null);
        refreshUsers();
        alert('User updated successfully');
    };

    const handleToggleStatus = (id: number) => {
        if (!currentUser) return;
        mockStore.toggleUserStatus(id, currentUser);
        refreshUsers();
    };

    const handleDeleteUser = (id: number) => {
        if (!currentUser) return;
        if (window.confirm('Are you sure you want to delete this user?')) {
            mockStore.deleteUser(id, currentUser);
            refreshUsers();
        }
    };
    
    const getRoleBadge = (role: Role) => {
        switch (role) {
            case Role.Admin: return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">Admin</span>;
            case Role.Sales: return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">Sales</span>;
            case Role.Commercial: return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">Commercial</span>;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">User Management</h3>
                    <p className="text-gray-500 text-sm mt-1">Manage all user accounts in the system.</p>
                </div>
                <Button icon={Plus} size="sm" onClick={() => setIsAddUserModalOpen(true)}>Add User</Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white text-gray-500 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-medium">Full Name</th>
                                <th className="px-6 py-4 font-medium">Username</th>
                                <th className="px-6 py-4 font-medium">Short Code</th>
                                <th className="px-6 py-4 font-medium">Role</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{u.fullName || u.username}</td>
                                    <td className="px-6 py-4 text-gray-600">{u.username}</td>
                                    <td className="px-6 py-4 text-gray-600 font-mono">{u.shortName}</td>
                                    <td className="px-6 py-4">{getRoleBadge(u.role)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                            {u.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => openEditModal(u)}
                                                className="p-1 text-gray-400 hover:text-blue-600" 
                                                title="Edit User"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleToggleStatus(u.id)}
                                                className={`p-1 ${u.isActive ? 'text-gray-400 hover:text-orange-600' : 'text-gray-400 hover:text-green-600'}`} 
                                                title={u.isActive ? "Disable User" : "Enable User"}
                                            >
                                                <Power size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteUser(u.id)}
                                                className="p-1 text-gray-400 hover:text-red-600" 
                                                title="Delete User"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add User Modal */}
            <Modal
                isOpen={isAddUserModalOpen}
                onClose={() => setIsAddUserModalOpen(false)}
                title="Add New User"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsAddUserModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddUser}>Create User</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Input 
                        label="Full Name" 
                        value={newUser.fullName}
                        onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                        placeholder="e.g. John Doe"
                    />
                    <Input 
                        label="Username" 
                        value={newUser.username}
                        onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                        placeholder="e.g. jdoe"
                    />
                    <Input 
                        label="Short Name (3-8 chars)" 
                        value={newUser.shortName}
                        onChange={(e) => setNewUser({...newUser, shortName: e.target.value})}
                        placeholder="e.g. JDoe"
                        maxLength={8}
                    />
                     <Select 
                        label="Role"
                        value={newUser.role}
                        onChange={(e) => setNewUser({...newUser, role: e.target.value as Role})}
                        options={[
                            { label: 'Sales', value: Role.Sales },
                            { label: 'Commercial', value: Role.Commercial },
                            { label: 'Admin', value: Role.Admin },
                        ]}
                    />
                    <Input 
                        label="Initial Password" 
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        placeholder="Minimum 6 characters"
                    />
                </div>
            </Modal>

            {/* Edit User Modal */}
            <Modal
                isOpen={isEditUserModalOpen}
                onClose={() => setIsEditUserModalOpen(false)}
                title="Edit User"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsEditUserModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateUser}>Save Changes</Button>
                    </>
                }
            >
                <p className="text-gray-500 text-sm mb-4">Update the details for {editingUser?.username}.</p>
                <div className="space-y-4">
                    <Input 
                        label="Full Name" 
                        value={editFormData.fullName}
                        onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value})}
                    />
                    <Input 
                        label="Username" 
                        value={editFormData.username}
                        onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                    />
                    <div className="w-full">
                         <Input 
                            label="New Password" 
                            type="password"
                            value={editFormData.newPassword}
                            onChange={(e) => setEditFormData({...editFormData, newPassword: e.target.value})}
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave blank to keep the current password.</p>
                    </div>
                     <Select 
                        label="Role"
                        value={editFormData.role}
                        onChange={(e) => setEditFormData({...editFormData, role: e.target.value as Role})}
                        options={[
                            { label: 'Sales', value: Role.Sales },
                            { label: 'Commercial', value: Role.Commercial },
                            { label: 'Admin', value: Role.Admin },
                        ]}
                        disabled={editingUser?.id === currentUser?.id}
                    />
                    {editingUser?.id === currentUser?.id && (
                         <p className="text-xs text-gray-500">You cannot change your own role.</p>
                    )}
                </div>
            </Modal>
        </div>
    );
};

// --- 2. Mappings Tab ---

const MappingsTab: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [mappings, setMappings] = useState(mockStore.customerCodes);
    const users = mockStore.users;
    const [filterCode, setFilterCode] = useState('');
    const [filterUser, setFilterUser] = useState('');
    
    // Mapping States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [newMapping, setNewMapping] = useState({ code: '', description: '', userId: '' });
    const [editingMapping, setEditingMapping] = useState<CustomerCode | null>(null);
    const [editFormData, setEditFormData] = useState({ description: '', userId: '' });

    const refreshMappings = () => setMappings([...mockStore.customerCodes]);

    const handleAddMapping = () => {
        if (!currentUser || !newMapping.code) return;
        
        mockStore.addMapping(
            newMapping.code, 
            newMapping.description, 
            newMapping.userId ? Number(newMapping.userId) : null, 
            currentUser
        );
        
        setIsAddModalOpen(false);
        setNewMapping({ code: '', description: '', userId: '' });
        refreshMappings();
    };

    const openEditModal = (mapping: CustomerCode) => {
        setEditingMapping(mapping);
        setEditFormData({
            description: mapping.description,
            userId: mapping.commercialUserId ? String(mapping.commercialUserId) : ''
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateMapping = () => {
        if (!currentUser || !editingMapping) return;

        mockStore.updateMapping(editingMapping.id, {
            description: editFormData.description,
            commercialUserId: editFormData.userId ? Number(editFormData.userId) : null
        }, currentUser);

        setIsEditModalOpen(false);
        setEditingMapping(null);
        refreshMappings();
    };

    const handleDeleteMapping = (id: number) => {
        if (!currentUser) return;
        if (window.confirm('Delete this mapping?')) {
            mockStore.deleteMapping(id, currentUser);
            refreshMappings();
        }
    };

    const filteredMappings = mappings.filter(m => {
        const matchCode = m.code.toLowerCase().includes(filterCode.toLowerCase());
        const commercialUser = users.find(u => u.id === m.commercialUserId);
        const userName = commercialUser ? commercialUser.username : '';
        const matchUser = !filterUser || (commercialUser && userName === filterUser);
        return matchCode && matchUser;
    });

    const commercialUsers = users.filter(u => u.role === Role.Commercial || u.role === Role.Admin);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Customer Code Mappings</h3>
                    <p className="text-gray-500 text-sm mt-1">Assign commercial users to customer codes.</p>
                </div>
                <Button icon={Plus} size="sm" onClick={() => setIsAddModalOpen(true)}>Add Mapping</Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="w-64">
                    <Input 
                        placeholder="Filter by Customer Code..." 
                        value={filterCode}
                        onChange={(e) => setFilterCode(e.target.value)}
                        className="text-sm bg-white"
                    />
                </div>
                <div className="w-64">
                    <Select 
                        value={filterUser}
                        onChange={(e) => setFilterUser(e.target.value)}
                        options={[
                            { label: 'Filter by Assigned User...', value: '' },
                            ...commercialUsers.map(u => ({ label: u.fullName || u.username, value: u.username }))
                        ]}
                        className="text-sm bg-white"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white text-gray-500 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-medium">Customer Code</th>
                                <th className="px-6 py-4 font-medium">Customer Name</th>
                                <th className="px-6 py-4 font-medium">Assigned User</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Date Added</th>
                                <th className="px-6 py-4 font-medium w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredMappings.map((m) => {
                                const user = users.find(u => u.id === m.commercialUserId);
                                return (
                                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{m.code}</td>
                                        <td className="px-6 py-4 text-gray-600">{m.description || '-'}</td>
                                        <td className="px-6 py-4">
                                            {user ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                                    {user.fullName || user.username}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic text-xs">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                {m.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                             <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => openEditModal(m)}
                                                    className="text-gray-400 hover:text-blue-600"
                                                >
                                                    <MoreHorizontal size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteMapping(m.id)}
                                                    className="text-gray-400 hover:text-red-600"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Mapping Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add Customer Mapping"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddMapping}>Add Mapping</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Input 
                        label="Customer Code" 
                        value={newMapping.code}
                        onChange={(e) => setNewMapping({...newMapping, code: e.target.value.toUpperCase()})}
                        placeholder="e.g. CUST005"
                    />
                    <Input 
                        label="Customer Name" 
                        value={newMapping.description}
                        onChange={(e) => setNewMapping({...newMapping, description: e.target.value})}
                        placeholder="Company Name"
                    />
                     <Select 
                        label="Assign Commercial User"
                        value={newMapping.userId}
                        onChange={(e) => setNewMapping({...newMapping, userId: e.target.value})}
                        options={[
                            { label: '- Unassigned -', value: '' },
                            ...commercialUsers.map(u => ({ label: u.fullName || u.username, value: u.id }))
                        ]}
                    />
                </div>
            </Modal>

            {/* Edit Mapping Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Mapping"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateMapping}>Save Changes</Button>
                    </>
                }
            >
                <p className="text-gray-500 text-sm mb-4">Update the mapping for {editingMapping?.code}.</p>
                <div className="space-y-4">
                    <Input 
                        label="Customer Code" 
                        value={editingMapping?.code || ''}
                        disabled
                        className="bg-gray-50 text-gray-500"
                    />
                    <Input 
                        label="Customer Name" 
                        value={editFormData.description}
                        onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                        placeholder="Company Name"
                    />
                     <Select 
                        label="Assign to Commercial User"
                        value={editFormData.userId}
                        onChange={(e) => setEditFormData({...editFormData, userId: e.target.value})}
                        options={[
                            { label: '- Unassigned -', value: '' },
                            ...commercialUsers.map(u => ({ label: u.fullName || u.username, value: u.id }))
                        ]}
                    />
                </div>
            </Modal>
        </div>
    );
};

// --- 3. Config Tab ---

const ConfigTab: React.FC = () => {
    const [cutoffStart, setCutoffStart] = useState(mockStore.settings.cutoffStart);
    const [cutoffEnd, setCutoffEnd] = useState(mockStore.settings.cutoffEnd);
    const [isCutoffEnabled, setIsCutoffEnabled] = useState(mockStore.settings.cutoffEnabled);

    const handleSaveSystem = () => {
        mockStore.settings.cutoffStart = cutoffStart;
        mockStore.settings.cutoffEnd = cutoffEnd;
        mockStore.settings.cutoffEnabled = isCutoffEnabled;
        alert('System settings saved!');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                 <div>
                    <h3 className="text-lg font-bold text-gray-900">System Configuration</h3>
                    <p className="text-gray-500 text-sm mt-1">Configure global application settings.</p>
                </div>
                <Button onClick={handleSaveSystem} icon={Save} size="sm">Save Changes</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Card>
                    <h4 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Clock size={18} className="text-gray-500" /> Cutoff Configuration
                    </h4>
                    <p className="text-sm text-gray-500 mb-4">
                        Prevent new instruction submissions during specific hours (e.g. processing window).
                    </p>
                    <div className="flex items-center gap-4 mb-6 p-4 bg-yellow-50 rounded-lg text-yellow-800 text-sm border border-yellow-100">
                        <input 
                            type="checkbox" 
                            id="cutoffToggle"
                            className="w-4 h-4 text-primary rounded border-yellow-300 focus:ring-yellow-500"
                            checked={isCutoffEnabled}
                            onChange={(e) => setIsCutoffEnabled(e.target.checked)}
                        />
                        <label htmlFor="cutoffToggle" className="font-medium cursor-pointer select-none">Enable Daily Submission Cutoff</label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            label="Start Time" 
                            type="time" 
                            value={cutoffStart}
                            onChange={(e) => setCutoffStart(e.target.value)}
                            disabled={!isCutoffEnabled}
                            className={!isCutoffEnabled ? 'bg-gray-50 text-gray-400' : ''}
                        />
                        <Input 
                            label="End Time" 
                            type="time" 
                            value={cutoffEnd}
                            onChange={(e) => setCutoffEnd(e.target.value)}
                            disabled={!isCutoffEnabled}
                            className={!isCutoffEnabled ? 'bg-gray-50 text-gray-400' : ''}
                        />
                    </div>
                </Card>

                <Card>
                    <h4 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Briefcase size={18} className="text-gray-500" /> Business Rules
                    </h4>
                    <div className="space-y-4">
                        <Input label="Reference Prefix" value="2025..." disabled className="bg-gray-50" />
                        <Input label="Auto-Delete Days" type="number" defaultValue={14} disabled className="bg-gray-50" />
                    </div>
                </Card>
            </div>
        </div>
    );
};

// --- 4. Data Tab (Backups) ---

const DataTab: React.FC = () => {
    const { user: currentUser } = useAuth();

    const handleBackup = () => {
        const data = mockStore.getBackupData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `deliveryflow_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCleanup = () => {
        if (!currentUser) return;
        if (window.confirm("Are you sure? This will permanently delete old completed instructions.")) {
            const count = mockStore.performCleanup(currentUser);
            alert(`Cleanup complete. Removed ${count} old records.`);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-gray-900">Data & Maintenance</h3>
                <p className="text-gray-500 text-sm mt-1">Manage backups and data retention policies.</p>
            </div>
            <Card>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Database size={20} /> Maintenance & Backup
                </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-white rounded-lg border border-gray-200">
                            <div>
                                <p className="font-medium text-gray-900">Manual Database Backup</p>
                                <p className="text-xs text-gray-500">Download a JSON snapshot of the current system state.</p>
                            </div>
                            <Button variant="secondary" size="sm" onClick={handleBackup}>Download Backup</Button>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-white rounded-lg border border-gray-200">
                            <div>
                                <p className="font-medium text-gray-900">Auto-Delete Old Records</p>
                                <p className="text-xs text-gray-500">Removes completed instructions older than 14 days.</p>
                            </div>
                            <Button variant="danger" size="sm" onClick={handleCleanup}>Run Cleanup Now</Button>
                        </div>
                    </div>
            </Card>
        </div>
    );
};

// --- 5. Profile Settings (Non-Admin View) ---

const ProfileSettings: React.FC<{ user: User }> = ({ user }) => {
    const [currentPass, setCurrentPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    
    const handleUpdate = () => {
        if (newPass !== confirmPass) {
            alert("New passwords do not match");
            return;
        }
        if (!currentPass || !newPass) {
             alert("Please fill in all fields");
             return;
        }
        
        const success = mockStore.changePassword(user.id, currentPass, newPass);
        if (success) {
            alert("Password updated successfully");
            setCurrentPass('');
            setNewPass('');
            setConfirmPass('');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
                <p className="text-gray-500">Manage your account settings and password.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-primary text-2xl font-bold">
                            {user.shortName}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{user.username}</h3>
                            <p className="text-gray-500 text-sm">{user.role}</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <Input label="Display Name" value={user.fullName || user.username} disabled className="bg-gray-50" />
                        <Input label="User ID (Short Name)" value={user.shortName} disabled className="bg-gray-50" />
                    </div>
                </Card>
                <Card>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <UserIcon size={20} /> Change Password
                    </h3>
                    <div className="space-y-4">
                        <Input 
                            label="Current Password" 
                            type="password" 
                            placeholder="••••••••" 
                            value={currentPass}
                            onChange={(e) => setCurrentPass(e.target.value)}
                        />
                        <Input 
                            label="New Password" 
                            type="password" 
                            placeholder="••••••••" 
                            value={newPass}
                            onChange={(e) => setNewPass(e.target.value)}
                        />
                        <Input 
                            label="Confirm New Password" 
                            type="password" 
                            placeholder="••••••••" 
                            value={confirmPass}
                            onChange={(e) => setConfirmPass(e.target.value)}
                        />
                        <div className="pt-2 flex justify-end">
                            <Button onClick={handleUpdate}>Update Password</Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

// --- Main Settings Page ---

export const Settings: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('users');

    if (!user) return null;

    // Non-Admin View
    if (user.role !== Role.Admin) {
        return (
            <div className="h-full overflow-y-auto pr-2 pb-6">
                <ProfileSettings user={user} />
            </div>
        );
    }

    // Admin View
    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex-none">
                 <h2 className="text-2xl font-bold text-gray-800 mb-6">Settings</h2>
                 
                 {/* Navigation Tabs */}
                 <div className="bg-gray-100 p-1 rounded-lg inline-flex shadow-inner">
                    <TabButton id="users" label="Users" active={activeTab} onClick={setActiveTab} />
                    <TabButton id="mappings" label="Mappings" active={activeTab} onClick={setActiveTab} />
                    <TabButton id="config" label="Config" active={activeTab} onClick={setActiveTab} />
                    <TabButton id="audits" label="Audits" active={activeTab} onClick={setActiveTab} />
                    <TabButton id="data" label="Data" active={activeTab} onClick={setActiveTab} />
                 </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto pr-2 pb-6">
                {activeTab === 'users' && <UsersTab />}
                {activeTab === 'mappings' && <MappingsTab />}
                {activeTab === 'config' && <ConfigTab />}
                {activeTab === 'audits' && <div className="text-gray-500 italic p-6 text-center">Audit logs integration coming soon. See Activity Logs page.</div>}
                {activeTab === 'data' && <DataTab />}
            </div>
        </div>
    );
};