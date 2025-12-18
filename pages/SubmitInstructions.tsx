import React, { useState } from 'react';
import { Card, Button, Input, Modal } from '../components/Common';
import { Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../App';
import { mockStore } from '../services/mockService';

interface RowData {
  id: number;
  salesOrder: string;
  productionOrder: string;
}

export const SubmitInstructions: React.FC = () => {
    const { user } = useAuth();
    const [customerCode, setCustomerCode] = useState('');
    const [location, setLocation] = useState('');
    const [globalComments, setGlobalComments] = useState('');
    const [rows, setRows] = useState<RowData[]>([{ id: 1, salesOrder: '', productionOrder: '' }]);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const addRow = () => {
        setRows([...rows, { id: Date.now(), salesOrder: '', productionOrder: '' }]);
    };

    const removeRow = (id: number) => {
        if (rows.length > 1) {
            setRows(rows.filter(r => r.id !== id));
        }
    };

    const updateRow = (id: number, field: keyof RowData, value: string) => {
        const upperValue = value.toUpperCase();
        setRows(rows.map(r => r.id === id ? { ...r, [field]: upperValue } : r));
    };

    const validate = () => {
        setError('');
        if (!customerCode || !location) {
            setError('Customer Code and Location are required.');
            return false;
        }
        for (const row of rows) {
            if (!row.salesOrder) {
                setError('Sales Order is required for all rows.');
                return false;
            }
        }
        const combos = rows.map(r => `${r.salesOrder}-${r.productionOrder}`);
        const uniqueCombos = new Set(combos);
        if (uniqueCombos.size !== combos.length) {
            setError('Duplicate Sales Order + Production Order combinations in current form.');
            return false;
        }
        return true;
    };

    const handlePreview = () => {
        if (validate()) setIsPreviewOpen(true);
    };

    const handleSubmit = async () => {
        if (!user) return;
        setIsSubmitting(true);
        setError('');

        try {
            const payload = rows.map(r => ({
                customerCode,
                location,
                salesOrder: r.salesOrder,
                productionOrder: r.productionOrder,
                commentsSales: globalComments,
            }));

            await new Promise(resolve => setTimeout(resolve, 800));
            await mockStore.submitInstructions(payload, user);
            
            setSuccessMessage(`Successfully submitted ${rows.length} instructions.`);
            setRows([{ id: Date.now(), salesOrder: '', productionOrder: '' }]);
            setCustomerCode('');
            setLocation('');
            setGlobalComments('');
            setIsPreviewOpen(false);

            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Submission failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="h-full overflow-y-auto pr-2">
            <div className="max-w-5xl mx-auto space-y-6 pb-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">New Submission</h2>
                    <div className="text-sm text-gray-500 font-mono">
                        CRE: {user?.shortName}
                    </div>
                </div>

                {successMessage && (
                    <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg flex items-center gap-2">
                        <Save size={18} /> {successMessage}
                    </div>
                )}
                
                {error && (
                    <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-2">
                        <AlertCircle size={18} /> {error}
                    </div>
                )}

                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Shared Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <Input 
                            label="Customer Code" 
                            placeholder="Start typing..." 
                            value={customerCode}
                            onChange={(e) => setCustomerCode(e.target.value.toUpperCase())}
                        />
                        <Input 
                            label="Location" 
                            placeholder="e.g. Warehouse A"
                            value={location}
                            onChange={(e) => setLocation(e.target.value.toUpperCase())}
                        />
                    </div>
                    <div className="w-full relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Global Comments (Optional)</label>
                        <textarea 
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] transition-all"
                            placeholder="e.g. Special loading required for sensitive goods..."
                            value={globalComments}
                            onChange={(e) => setGlobalComments(e.target.value)}
                        />
                    </div>
                </Card>

                <Card className="p-6">
                     <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h3 className="text-lg font-semibold text-gray-800">Instruction Lines</h3>
                        <Button variant="secondary" onClick={addRow} icon={Plus} size="sm">Add Row</Button>
                    </div>
                    
                    <div className="space-y-4">
                        {rows.map((row, index) => (
                            <div key={row.id} className="flex flex-col md:flex-row gap-4 items-end p-4 bg-gray-50 rounded-lg border border-gray-200">
                                 <div className="w-8 font-bold text-gray-400 mb-2 md:mb-0">{index + 1}</div>
                                 <Input 
                                    label="Sales Order *" 
                                    value={row.salesOrder}
                                    onChange={(e) => updateRow(row.id, 'salesOrder', e.target.value)}
                                    className="flex-1"
                                 />
                                 <Input 
                                    label="Production Order" 
                                    value={row.productionOrder}
                                    onChange={(e) => updateRow(row.id, 'productionOrder', e.target.value)}
                                    className="flex-1"
                                 />
                                 <div className="md:pb-1">
                                    <Button 
                                        variant="ghost" 
                                        onClick={() => removeRow(row.id)} 
                                        disabled={rows.length === 1}
                                        className="text-red-500 hover:bg-red-50 hover:text-red-700"
                                    >
                                        <Trash2 size={18} />
                                    </Button>
                                 </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <div className="flex justify-end pt-4">
                    <Button onClick={handlePreview} size="lg" className="w-full md:w-auto px-8">
                        Review & Submit
                    </Button>
                </div>

                <Modal
                    isOpen={isPreviewOpen}
                    onClose={() => setIsPreviewOpen(false)}
                    title="Confirm Submission"
                    size="lg"
                    footer={
                        <>
                            <Button variant="secondary" onClick={() => setIsPreviewOpen(false)}>Cancel</Button>
                            <Button onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? 'Submitting...' : 'Confirm Submission'}
                            </Button>
                        </>
                    }
                >
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                            <p><strong>Customer:</strong> {customerCode}</p>
                            <p><strong>Location:</strong> {location}</p>
                            {globalComments && <p className="mt-2 italic font-medium">"{globalComments}"</p>}
                        </div>

                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-600">
                                <tr>
                                    <th className="px-3 py-2">#</th>
                                    <th className="px-3 py-2">Sales Order</th>
                                    <th className="px-3 py-2">Prod Order</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rows.map((row, idx) => (
                                    <tr key={row.id}>
                                        <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                                        <td className="px-3 py-2 font-medium">{row.salesOrder}</td>
                                        <td className="px-3 py-2 text-gray-600">{row.productionOrder || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Modal>
            </div>
        </div>
    );
};