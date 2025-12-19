import React, { useEffect, useState, useMemo } from 'react';
import { Card, Input, Select, Button } from '../components/Common';
import { mockStore } from '../services/mockService';
import { useAuth } from '../App';
import { Role, ActivityLog } from '../types';
import { Search, Filter, X, Calendar } from 'lucide-react';

export const ActivityLogs: React.FC = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filter states
    const [userFilter, setUserFilter] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [detailsFilter, setDetailsFilter] = useState('');

    useEffect(() => {
        const load = async () => {
            if (user?.role === Role.Admin) {
                setLoading(true);
                const data = await mockStore.getLogs();
                setLogs(data);
                setLoading(false);
            }
        };
        load();
    }, [user]);

    // Compute unique actions for the filter dropdown
    const uniqueActions = useMemo(() => {
        const actions = Array.from(new Set(logs.map(l => l.action))).sort();
        return [{ label: 'All Actions', value: '' }, ...actions.map(a => ({ label: a, value: a }))];
    }, [logs]);

    // Apply filtering
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchUser = log.userName.toLowerCase().includes(userFilter.toLowerCase());
            const matchAction = !actionFilter || log.action === actionFilter;
            const matchDetails = log.details.toLowerCase().includes(detailsFilter.toLowerCase());
            return matchUser && matchAction && matchDetails;
        });
    }, [logs, userFilter, actionFilter, detailsFilter]);

    const handleClearFilters = () => {
        setUserFilter('');
        setActionFilter('');
        setDetailsFilter('');
    };

    if (user?.role !== Role.Admin) {
        return <div className="text-center p-10 text-gray-500">Access Denied</div>;
    }

    if (loading) return <div className="text-center p-10 text-gray-500">Loading Logs...</div>;

    const hasFilters = userFilter || actionFilter || detailsFilter;

    return (
        <div className="h-full overflow-y-auto pr-2">
            <div className="space-y-6 pb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">System Activity Logs</h2>
                    <div className="text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700 flex items-center gap-2">
                        <Calendar size={14} />
                        Showing last 100 entries
                    </div>
                </div>

                {/* Filter Toolbar */}
                <Card className="p-4 border-none shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                        <Input 
                            label="Filter by User" 
                            placeholder="Type username..." 
                            value={userFilter}
                            onChange={(e) => setUserFilter(e.target.value)}
                            icon={<Search size={16} />}
                            className="text-sm"
                        />
                        <Select 
                            label="Filter by Action"
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                            options={uniqueActions}
                            className="text-sm"
                        />
                        <Input 
                            label="Filter Details" 
                            placeholder="Keyword in details..." 
                            value={detailsFilter}
                            onChange={(e) => setDetailsFilter(e.target.value)}
                            icon={<Filter size={16} />}
                            className="text-sm"
                        />
                        {hasFilters && (
                            <Button 
                                variant="ghost" 
                                onClick={handleClearFilters}
                                icon={X}
                                size="sm"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 mb-1"
                            >
                                Reset Filters
                            </Button>
                        )}
                    </div>
                </Card>

                <Card className="overflow-hidden p-0 border-none shadow-md">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold border-b dark:border-gray-600">
                                <tr>
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Action</th>
                                    <th className="px-6 py-4 w-1/3">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-3 font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            {new Date(log.timestamp).toLocaleString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-3 font-medium text-gray-900 dark:text-gray-100">{log.userName}</td>
                                        <td className="px-6 py-3">
                                            <span className="inline-block px-2 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 rounded text-xs font-semibold border border-indigo-100 dark:border-indigo-800">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-gray-600 dark:text-gray-400 truncate max-w-xs md:max-w-md lg:max-w-xl" title={log.details}>
                                            {log.details}
                                        </td>
                                    </tr>
                                ))}
                                {filteredLogs.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-12 text-center text-gray-400 dark:text-gray-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <X size={32} className="opacity-20" />
                                                <p>No activity logs match your filters.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};