import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button, StatusBadge, Modal, Select, Input } from '../components/Common';
import { Download, Edit2, ChevronDown, Columns, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { mockStore } from '../services/mockService';
import { Instruction, Role, InstructionStatus, QUICK_UPDATES, User } from '../types';
import { useAuth } from '../App';

// Define available columns with updated order
const AVAILABLE_COLUMNS = [
    { key: 'referenceNumber', label: 'Reference #' },
    { key: 'createdAt', label: 'Submitted Date' },
    { key: 'customerCode', label: 'Customer Code' },
    { key: 'creName', label: 'Submitted By' },
    { key: 'salesOrder', label: 'Sales Order' },
    { key: 'productionOrder', label: 'Prod Order' },
    { key: 'location', label: 'Location' },
    { key: 'assignedTo', label: 'Assigned To' },
    { key: 'status', label: 'Status' },
    { key: 'currentUpdate', label: 'Current Update' },
    { key: 'commentsSales', label: 'Sales Comments' },
    { key: 'commentsCommercial', label: 'Commercial Comments' },
];

export const ReviewInstructions: React.FC = () => {
    const { user } = useAuth();
    const [instructions, setInstructions] = useState<Instruction[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedInst, setSelectedInst] = useState<Instruction | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    // Notification State
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
    
    // Column Visibility State - Default shows all columns in new order
    const [visibleColumns, setVisibleColumns] = useState<string[]>([
        'referenceNumber', 'createdAt', 'customerCode', 'creName', 'salesOrder', 
        'productionOrder', 'location', 'assignedTo', 'status', 'currentUpdate', 
        'commentsSales', 'commentsCommercial'
    ]);
    const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
    const columnMenuRef = useRef<HTMLDivElement>(null);

    // Filter States
    const [filters, setFilters] = useState({
        salesOrder: '',
        productionOrder: '',
        assignedTo: '',
        status: '',
        currentUpdate: '',
        submittedBy: ''
    });

    // Edit states
    const [editCommentsSales, setEditCommentsSales] = useState('');
    const [editCommentsCommercial, setEditCommentsCommercial] = useState('');
    const [editStatus, setEditStatus] = useState<InstructionStatus>(InstructionStatus.Pending);
    const [editUpdate, setEditUpdate] = useState('');

    useEffect(() => {
        loadData();
    }, [user]);

    // Close column menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (columnMenuRef.current && !columnMenuRef.current.contains(event.target as Node)) {
                setIsColumnMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadData = async () => {
        if (user) {
            // Parallel fetch for instructions and users (for lookup)
            const [inst, usrs] = await Promise.all([
                mockStore.getInstructions(user),
                mockStore.getUsers()
            ]);
            setInstructions(inst);
            setUsers(usrs);
        }
    };

    // --- Filter Options Logic ---
    const uniqueValues = useMemo(() => {
        const getUnique = (key: keyof Instruction) => 
            Array.from(new Set(instructions.map(i => String(i[key] || '')))).filter(Boolean).sort();
        
        return {
            assignedTo: Array.from(new Set(instructions.map(i => {
                const u = users.find(u => u.id === i.assignedCommercialUserId);
                return u ? u.shortName : 'Unassigned';
            }))).sort(),
            statuses: Object.values(InstructionStatus),
            updates: getUnique('currentUpdate'),
            submitters: getUnique('creName')
        };
    }, [instructions, users]);


    // --- Filtering Logic ---
    const filteredInstructions = useMemo(() => {
        return instructions.filter(inst => {
            const u = users.find(u => u.id === inst.assignedCommercialUserId);
            const assignedShortName = u ? u.shortName : 'Unassigned';

            const matchSO = inst.salesOrder.toLowerCase().includes(filters.salesOrder.toLowerCase());
            const matchPO = (inst.productionOrder || '').toLowerCase().includes(filters.productionOrder.toLowerCase());
            const matchAssigned = !filters.assignedTo || assignedShortName === filters.assignedTo;
            const matchStatus = !filters.status || inst.status === filters.status;
            const matchUpdate = !filters.currentUpdate || inst.currentUpdate === filters.currentUpdate;
            const matchSubmitter = !filters.submittedBy || inst.creName === filters.submittedBy;

            return matchSO && matchPO && matchAssigned && matchStatus && matchUpdate && matchSubmitter;
        });
    }, [instructions, filters, users]);

    const hasActiveFilters = useMemo(() => {
        return Object.values(filters).some(val => val !== '');
    }, [filters]);


    // --- Handlers ---
    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleEdit = (inst: Instruction) => {
        setSelectedInst(inst);
        setEditCommentsSales(inst.commentsSales);
        setEditCommentsCommercial(inst.commentsCommercial);
        setEditStatus(inst.status);
        setEditUpdate(inst.currentUpdate);
        setIsEditModalOpen(true);
    };

    const handleInlineUpdate = async (id: number, field: 'status' | 'currentUpdate', value: string) => {
        if (!user) return;
        try {
            await mockStore.updateInstruction(id, { [field]: value }, user);
            loadData();
            showNotification(`${field === 'status' ? 'Status' : 'Update'} changed successfully`);
        } catch (error) {
            showNotification('Failed to update instruction', 'error');
        }
    };

    const handleSave = async () => {
        if (!selectedInst || !user) return;
        
        await mockStore.updateInstruction(selectedInst.id, {
            commentsSales: editCommentsSales,
            commentsCommercial: editCommentsCommercial,
            status: editStatus,
            currentUpdate: editUpdate
        }, user);

        setIsEditModalOpen(false);
        loadData();
        showNotification('Instruction details updated successfully');
    };

    const toggleColumn = (key: string) => {
        setVisibleColumns(prev => 
            prev.includes(key) 
                ? prev.filter(c => c !== key) 
                : [...prev, key]
        );
    };

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleClearFilters = () => {
        setFilters({
            salesOrder: '',
            productionOrder: '',
            assignedTo: '',
            status: '',
            currentUpdate: '',
            submittedBy: ''
        });
        showNotification('Filters cleared');
    };

    const handleExport = () => {
        const headers = AVAILABLE_COLUMNS.map(c => c.label);
        const csvContent = [
            headers.join(','),
            ...filteredInstructions.map(row => AVAILABLE_COLUMNS.map(col => {
                let val: any = row[col.key as keyof Instruction];
                if (col.key === 'assignedTo') {
                    const u = users.find(u => u.id === row.assignedCommercialUserId);
                    val = u ? u.shortName : 'Unassigned';
                }
                if (col.key === 'createdAt') val = new Date(row.createdAt).toLocaleDateString();
                // Basic CSV escaping
                return `"${String(val || '').replace(/"/g, '""')}"`;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `instructions_export_${new Date().toISOString().slice(0,10)}.csv`;
        link.click();
        showNotification('Export downloaded successfully');
    };

    // --- Render Helpers ---

    const canEditCommercial = user?.role === Role.Commercial || user?.role === Role.Admin;
    const canEditSales = user?.role === Role.Sales || user?.role === Role.Admin;

    const renderCell = (inst: Instruction, key: string) => {
        switch (key) {
            case 'referenceNumber': return <span className="font-mono text-xs text-gray-500 whitespace-nowrap">{inst.referenceNumber}</span>;
            case 'customerCode': return <span className="text-primary font-semibold whitespace-nowrap">{inst.customerCode}</span>;
            case 'location': return <span className="text-gray-600 whitespace-nowrap">{inst.location}</span>;
            case 'salesOrder': return <span className="text-gray-600 whitespace-nowrap">{inst.salesOrder}</span>;
            case 'productionOrder': return <span className="text-gray-600 whitespace-nowrap">{inst.productionOrder || '-'}</span>;
            case 'assignedTo': 
                const assignedUser = users.find(u => u.id === inst.assignedCommercialUserId);
                return <span className="text-gray-600 font-medium whitespace-nowrap">{assignedUser ? assignedUser.shortName : 'Unassigned'}</span>;
            case 'status': 
                if (canEditCommercial) {
                     return (
                        <select 
                            className="text-xs bg-white border border-gray-200 text-gray-700 py-1 px-2 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer shadow-sm"
                            value={inst.status}
                            onChange={(e) => handleInlineUpdate(inst.id, 'status', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {Object.values(InstructionStatus).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    );
                }
                return <StatusBadge status={inst.status} />;
            case 'currentUpdate': 
                if (canEditCommercial) {
                     return (
                        <select 
                            className="text-xs bg-white border border-gray-200 text-gray-700 py-1 px-2 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary max-w-[160px] truncate cursor-pointer shadow-sm"
                            value={inst.currentUpdate}
                            onChange={(e) => handleInlineUpdate(inst.id, 'currentUpdate', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <option value="">- Select Update -</option>
                            {QUICK_UPDATES.map(u => (
                                <option key={u} value={u}>{u}</option>
                            ))}
                        </select>
                    );
                }
                return <span className="text-xs text-gray-500 max-w-[150px] truncate block whitespace-nowrap" title={inst.currentUpdate}>{inst.currentUpdate || '-'}</span>;
            case 'creName': return <span className="text-gray-800 font-medium whitespace-nowrap">{inst.creName}</span>;
            case 'createdAt': return <span className="text-gray-600 whitespace-nowrap">{new Date(inst.createdAt).toLocaleDateString()}</span>;
            case 'commentsSales': return <span className="text-xs text-gray-500 max-w-[200px] truncate block whitespace-nowrap" title={inst.commentsSales}>{inst.commentsSales || '-'}</span>;
            case 'commentsCommercial': return <span className="text-xs text-gray-500 max-w-[200px] truncate block whitespace-nowrap" title={inst.commentsCommercial}>{inst.commentsCommercial || '-'}</span>;
            default: return null;
        }
    };

    return (
        <div className="space-y-4 h-full flex flex-col relative">
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 transition-all transform translate-y-0 animate-in fade-in slide-in-from-bottom-4 duration-300 ${
                    notification.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'
                }`}>
                    {notification.type === 'success' ? <CheckCircle size={18} className="text-green-400" /> : <AlertTriangle size={18} />}
                    <span className="font-medium text-sm">{notification.message}</span>
                </div>
            )}

            {/* Filters & Actions Toolbar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4 flex-none">
                
                {/* Top Row: Filters Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                    <Input 
                        placeholder="Filter by Sales Order..." 
                        value={filters.salesOrder}
                        onChange={(e) => handleFilterChange('salesOrder', e.target.value)}
                        className="text-sm"
                    />
                    <Input 
                        placeholder="Filter by Prod Order..." 
                        value={filters.productionOrder}
                        onChange={(e) => handleFilterChange('productionOrder', e.target.value)}
                        className="text-sm"
                    />
                    <Select 
                        value={filters.assignedTo}
                        onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                        options={[
                            { label: 'Filter by Assigned To...', value: '' },
                            ...uniqueValues.assignedTo.map(v => ({ label: v, value: v }))
                        ]}
                        className="text-sm"
                    />
                    <Select 
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        options={[
                            { label: 'Filter by Status...', value: '' },
                            ...uniqueValues.statuses.map(v => ({ label: v, value: v }))
                        ]}
                        className="text-sm"
                    />
                    <Select 
                        value={filters.currentUpdate}
                        onChange={(e) => handleFilterChange('currentUpdate', e.target.value)}
                        options={[
                            { label: 'Filter by Update...', value: '' },
                            ...uniqueValues.updates.map(v => ({ label: v, value: v }))
                        ]}
                        className="text-sm"
                    />
                    <Select 
                        value={filters.submittedBy}
                        onChange={(e) => handleFilterChange('submittedBy', e.target.value)}
                        options={[
                            { label: 'Filter by Submitter...', value: '' },
                            ...uniqueValues.submitters.map(v => ({ label: v, value: v }))
                        ]}
                        className="text-sm"
                    />
                </div>

                {/* Bottom Row: Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-center border-t border-gray-50 pt-3 gap-3">
                    <div className="relative w-full sm:w-auto" ref={columnMenuRef}>
                         <Button 
                             variant="secondary" 
                             icon={Columns} 
                             onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
                             className="text-sm w-full sm:w-40 justify-center"
                         >
                             View
                         </Button>
                        
                        {isColumnMenuOpen && (
                            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 z-50 py-2 max-h-[60vh] overflow-y-auto">
                                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-50 mb-1">
                                    Visible Columns
                                </div>
                                {AVAILABLE_COLUMNS.map(col => (
                                    <label key={col.key} className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700">
                                        <input 
                                            type="checkbox" 
                                            checked={visibleColumns.includes(col.key)}
                                            onChange={() => toggleColumn(col.key)}
                                            className="mr-3 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        {col.label}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        {hasActiveFilters && (
                            <Button 
                                variant="secondary" 
                                icon={X} 
                                onClick={handleClearFilters}
                                className="text-sm text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200 w-full sm:w-40 justify-center"
                            >
                                Clear Filters
                            </Button>
                        )}
                        <Button 
                            variant="secondary" 
                            icon={Download} 
                            onClick={handleExport}
                            className="text-sm w-full sm:w-40 justify-center"
                        >
                            Export XLSX
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200 sticky top-0 z-10">
                            <tr>
                                {AVAILABLE_COLUMNS.map(col => visibleColumns.includes(col.key) && (
                                    <th key={col.key} className="px-4 py-3 whitespace-nowrap">
                                        {col.label}
                                    </th>
                                ))}
                                <th className="px-4 py-3 whitespace-nowrap text-right sticky right-0 bg-gray-50">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredInstructions.map(inst => (
                                <tr key={inst.id} className="hover:bg-indigo-50/30 transition-colors group">
                                    {AVAILABLE_COLUMNS.map(col => visibleColumns.includes(col.key) && (
                                        <td key={col.key} className="px-4 py-3 align-middle whitespace-nowrap">
                                            {renderCell(inst, col.key)}
                                        </td>
                                    ))}
                                    <td className="px-4 py-3 text-right sticky right-0 bg-white group-hover:bg-indigo-50/30 transition-colors align-middle">
                                        <button 
                                            onClick={() => handleEdit(inst)}
                                            className="text-gray-400 hover:text-primary p-1 rounded-md hover:bg-gray-100"
                                            title="Edit Details"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredInstructions.length === 0 && (
                                <tr>
                                    <td colSpan={visibleColumns.length + 1} className="px-4 py-12 text-center text-gray-400">
                                        No instructions found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 text-xs text-gray-500 flex justify-between flex-none">
                    <span>Showing {filteredInstructions.length} records</span>
                    <span>Page 1 of 1</span>
                </div>
            </div>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title={`Edit Instruction: ${selectedInst?.referenceNumber}`}
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                    </>
                }
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg text-sm">
                        <div><span className="text-gray-500">Customer:</span> <span className="font-medium">{selectedInst?.customerCode}</span></div>
                        <div><span className="text-gray-500">Sales Order:</span> <span className="font-medium">{selectedInst?.salesOrder}</span></div>
                        <div><span className="text-gray-500">Prod Order:</span> <span className="font-medium">{selectedInst?.productionOrder || 'N/A'}</span></div>
                        <div><span className="text-gray-500">Location:</span> <span className="font-medium">{selectedInst?.location}</span></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Status Section - Commercial/Admin Only */}
                        <div className={`space-y-4 ${!canEditCommercial ? 'opacity-50 pointer-events-none' : ''}`}>
                             <h4 className="font-semibold text-gray-800 flex items-center gap-2">Commercial Controls</h4>
                             <Select 
                                label="Status"
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value as InstructionStatus)}
                                options={[
                                    { label: 'Pending', value: InstructionStatus.Pending },
                                    { label: 'Completed', value: InstructionStatus.Completed }
                                ]}
                             />
                             <Select 
                                label="Current Update"
                                value={editUpdate}
                                onChange={(e) => setEditUpdate(e.target.value)}
                                options={[
                                    { label: '- Select Update -', value: '' },
                                    ...QUICK_UPDATES.map(u => ({ label: u, value: u }))
                                ]}
                             />
                        </div>
                         
                         {/* Comments Section */}
                         <div className="space-y-4">
                            <h4 className="font-semibold text-gray-800">Comments</h4>
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Sales Comments</label>
                                <textarea 
                                    className="w-full text-sm p-2 border rounded-md"
                                    rows={3}
                                    value={editCommentsSales}
                                    onChange={e => setEditCommentsSales(e.target.value)}
                                    disabled={!canEditSales}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Commercial Comments</label>
                                <textarea 
                                    className="w-full text-sm p-2 border rounded-md"
                                    rows={3}
                                    value={editCommentsCommercial}
                                    onChange={e => setEditCommentsCommercial(e.target.value)}
                                    disabled={!canEditCommercial}
                                />
                            </div>
                         </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};