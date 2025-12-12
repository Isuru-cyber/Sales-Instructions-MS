import React from 'react';
import { Card } from '../components/Common';
import { mockStore } from '../services/mockService';
import { useAuth } from '../App';
import { Role } from '../types';

export const ActivityLogs: React.FC = () => {
    const { user } = useAuth();
    // In a real app, this would be a paginated API call
    const logs = mockStore.logs;

    if (user?.role !== Role.Admin) {
        return <div className="text-center p-10 text-gray-500">Access Denied</div>;
    }

    return (
        <div className="h-full overflow-y-auto pr-2">
            <div className="space-y-6 pb-6">
                <h2 className="text-2xl font-bold text-gray-800">System Activity Logs</h2>
                <Card className="overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-600 font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Action</th>
                                    <th className="px-6 py-4 w-1/3">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 font-mono text-gray-500 whitespace-nowrap">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-3 font-medium text-gray-900">{log.userName}</td>
                                        <td className="px-6 py-3">
                                            <span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-gray-600 truncate max-w-xs" title={log.details}>
                                            {log.details}
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr><td colSpan={4} className="p-6 text-center text-gray-400">No logs recorded yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};