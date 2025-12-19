import React, { useEffect, useState, useMemo } from 'react';
import { Card, StatusBadge } from '../components/Common';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { mockStore } from '../services/mockService';
import { FileText, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../App';
import { AppSettings, Role, Instruction } from '../types';

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [instructions, setInstructions] = useState<Instruction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [kpiData, appSettings, allInstructions] = await Promise.all([
                mockStore.getKPIData(user),
                mockStore.getSettings(),
                mockStore.getInstructions(user)
            ]);
            
            setStats(kpiData);
            setSettings(appSettings);
            setInstructions(allInstructions);
        } catch (error) {
            console.error("Failed to load dashboard data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user]);

    // Calculate dynamic weekly trend data
    const weeklyTrendData = useMemo(() => {
        if (!instructions.length) return [];

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const last7Days = [];
        const now = new Date();

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const dayName = days[d.getDay()];
            const dateString = d.toISOString().split('T')[0];

            const count = instructions.filter(inst => {
                const instDate = new Date(inst.createdAt).toISOString().split('T')[0];
                return instDate === dateString;
            }).length;

            last7Days.push({ name: dayName, submissions: count });
        }
        return last7Days;
    }, [instructions]);

    const recentInstructions = useMemo(() => instructions.slice(0, 5), [instructions]);

    if (isLoading || !stats || !user) {
        return <div className="p-8 text-center text-gray-500 animate-pulse">Loading dashboard insights...</div>;
    }

    const isSales = user.role === Role.Sales;

    return (
        <div className="h-full overflow-y-auto pr-2 space-y-6 pb-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="flex items-center gap-4 border-l-4 border-l-blue-500">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">{isSales ? 'My Total Submissions' : 'Total Submissions'}</p>
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
                <Card className={`flex items-center gap-4 border-l-4 ${settings?.cutoffEnabled ? 'border-l-red-500' : 'border-l-gray-400'}`}>
                    <div className={`p-3 rounded-full ${settings?.cutoffEnabled ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Cutoff Status</p>
                        {settings?.cutoffEnabled ? (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Enabled</h3>
                                <p className="text-xs text-red-500 font-medium">{settings.cutoffStart} - {settings.cutoffEnd}</p>
                            </div>
                        ) : (
                            <h3 className="text-lg font-bold text-gray-400">No Cutoff</h3>
                        )}
                    </div>
                </Card>
            </div>

            {/* Charts Section */}
            <div className={`grid grid-cols-1 ${isSales ? 'lg:grid-cols-1' : 'lg:grid-cols-2'} gap-6`}>
                 <Card className="h-96 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800">
                            {isSales ? 'My Weekly Submission Trend' : 'Weekly Submission Volume'}
                        </h3>
                        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Last 7 Days</span>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={weeklyTrendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                <XAxis 
                                    dataKey="name" 
                                    stroke="#888888" 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false} 
                                />
                                <YAxis 
                                    stroke="#888888" 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="submissions" 
                                    stroke="hsl(231, 48%, 48%)" 
                                    strokeWidth={3} 
                                    dot={{ r: 4, fill: 'hsl(231, 48%, 48%)', strokeWidth: 2, stroke: '#fff' }} 
                                    activeDot={{ r: 6, strokeWidth: 0 }} 
                                    animationDuration={1500}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {!isSales && (
                    <Card className="h-96 flex flex-col">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Submissions by User</h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.userStats} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="count" fill="hsl(174, 100%, 29%)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                )}
            </div>

            {/* Recent Activity Table */}
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800">{isSales ? 'My Recent Activity' : 'Recent System Activity'}</h3>
                    <button onClick={() => window.location.hash = '#/instructions'} className="text-sm text-primary font-medium hover:underline">View All Records</button>
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
                                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{inst.referenceNumber}</td>
                                    <td className="px-4 py-3 font-semibold text-gray-900">{inst.customerCode}</td>
                                    <td className="px-4 py-3 text-gray-600">{inst.salesOrder}</td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={inst.status} />
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">{new Date(inst.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td>
                                </tr>
                            ))}
                            {recentInstructions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <FileText size={32} className="opacity-20" />
                                            <p>No recent submissions found.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};