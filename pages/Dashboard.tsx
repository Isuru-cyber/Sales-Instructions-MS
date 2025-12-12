import React, { useEffect, useState } from 'react';
import { Card, StatusBadge } from '../components/Common';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { mockStore } from '../services/mockService';
import { FileText, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../App';

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [recentInstructions, setRecentInstructions] = useState<any[]>([]);

    useEffect(() => {
        if (!user) return;
        const data = mockStore.getKPIData();
        setStats(data);
        const instructions = mockStore.getInstructions(user).slice(-5).reverse();
        setRecentInstructions(instructions);
    }, [user]);

    if (!stats) return <div>Loading...</div>;

    // Mock chart data
    const lineData = [
        { name: 'Mon', submissions: 12 },
        { name: 'Tue', submissions: 19 },
        { name: 'Wed', submissions: 15 },
        { name: 'Thu', submissions: 22 },
        { name: 'Fri', submissions: 30 },
        { name: 'Sat', submissions: 10 },
        { name: 'Sun', submissions: 5 },
    ];

    return (
        <div className="h-full overflow-y-auto pr-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="flex items-center gap-4 border-l-4 border-l-blue-500">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Submissions</p>
                        <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 border-l-4 border-l-yellow-500">
                    <div className="p-3 bg-yellow-50 text-yellow-600 rounded-full">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Pending Review</p>
                        <h3 className="text-2xl font-bold text-gray-900">{stats.pending}</h3>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 border-l-4 border-l-green-500">
                    <div className="p-3 bg-green-50 text-green-600 rounded-full">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Completed</p>
                        <h3 className="text-2xl font-bold text-gray-900">{stats.completed}</h3>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 border-l-4 border-l-red-500">
                    <div className="p-3 bg-red-50 text-red-600 rounded-full">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Cutoff Status</p>
                        <h3 className="text-lg font-bold text-gray-900">Active (15:00)</h3>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card className="h-80">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Weekly Submissions</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={lineData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                            <Tooltip />
                            <Line type="monotone" dataKey="submissions" stroke="hsl(231, 48%, 48%)" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>

                <Card className="h-80">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Submissions by User</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.userStats}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{fill: '#f9fafb'}} />
                            <Bar dataKey="count" fill="hsl(174, 100%, 29%)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Recent Activity</h3>
                    <button className="text-sm text-primary hover:underline">View All</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-y border-gray-100 text-gray-500">
                            <tr>
                                <th className="px-4 py-3 font-medium">Reference</th>
                                <th className="px-4 py-3 font-medium">Customer</th>
                                <th className="px-4 py-3 font-medium">Sales Order</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {recentInstructions.map((inst) => (
                                <tr key={inst.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-mono text-gray-700">{inst.referenceNumber}</td>
                                    <td className="px-4 py-3 font-medium text-gray-900">{inst.customerCode}</td>
                                    <td className="px-4 py-3 text-gray-600">{inst.salesOrder}</td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={inst.status} />
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">{new Date(inst.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                            {recentInstructions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No recent submissions found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};