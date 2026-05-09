import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  FileText, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ArrowUpRight,
  Download,
  Eye,
  MoreVertical,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface PurchaseOrder {
  id: string;
  vendorName: string;
  itemDescription: string;
  value: number;
  expectedDate: string;
  status: 'In transit' | 'Pending approval' | 'Out for delivery' | 'Delivered' | 'Cancelled';
}

const SAMPLE_ORDERS: PurchaseOrder[] = [
  {
    id: 'PO-2026-0091',
    vendorName: 'Bharat Office Solutions',
    itemDescription: 'Supply of 500 ergonomic office chairs',
    value: 2400000,
    expectedDate: '14 May',
    status: 'In transit'
  },
  {
    id: 'PO-2026-0089',
    vendorName: 'Green Earth Catering',
    itemDescription: 'Quarterly catering services — HQ campus',
    value: 4200000,
    expectedDate: '11 May',
    status: 'Pending approval'
  },
  {
    id: 'PO-2026-0088',
    vendorName: 'Heritage Furniture Co.',
    itemDescription: 'Modular workstations — Phase II',
    value: 11400000,
    expectedDate: '5 May',
    status: 'Out for delivery'
  }
];

export default function PurchaseOrders() {
  const [orders, setOrders] = useState<PurchaseOrder[]>(SAMPLE_ORDERS);
  const [activeTab, setActiveTab] = useState<'Open' | 'Delivered' | 'Cancelled' | 'All'>('Open');

  const handleApprove = (id: string) => {
    toast.success(`Purchase Order ${id} approved.`);
    setOrders(orders.map(o => o.id === id ? { ...o, status: 'In transit' } : o));
  };

  const stats = [
    { label: 'OPEN POS', value: '3', icon: Clock, color: 'text-amber-500' },
    { label: 'DELIVERED', value: '1', icon: CheckCircle2, color: 'text-teal-500' },
    { label: 'TOTAL SPEND', value: '₹3,60,00,000', icon: ArrowUpRight, color: 'text-indigo-500' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Procurement</p>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Purchase Orders</h1>
            <p className="text-sm text-slate-500 font-medium">
              Once a quotation is accepted, a draft PO is created here for approval and fulfilment.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-8 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                </div>
                <div className={cn("p-4 rounded-2xl bg-slate-50", stat.color)}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters & Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
          <div className="flex items-center gap-2 bg-slate-100/50 p-1.5 rounded-xl w-full md:w-fit">
            {['Open', 'Delivered', 'Cancelled', 'All'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all",
                  activeTab === tab 
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute inset-y-0 left-3 flex items-center h-full w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search POs, vendors..." 
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
        </div>

        {/* PO Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">PO #</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor / Item</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Value</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Expected</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6 text-xs font-mono text-slate-400">{order.id}</td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900">{order.vendorName}</p>
                      <p className="text-[10px] font-semibold text-slate-500">{order.itemDescription}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm font-black text-slate-900 text-right">₹{order.value.toLocaleString()}</td>
                  <td className="px-8 py-6 text-sm font-semibold text-slate-500">{order.expectedDate}</td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border",
                        order.status === 'In transit' ? "bg-[#E6F3F2] text-[#008080] border-[#CCE7E6]" :
                        order.status === 'Pending approval' ? "bg-[#FFF8E6] text-[#B28900] border-[#FFEBB3]" :
                        order.status === 'Out for delivery' ? "bg-[#E6F3F2] text-[#008080] border-[#CCE7E6]" :
                        "bg-slate-50 text-slate-500 border-slate-100"
                      )}>
                        {order.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-end gap-2">
                      {order.status === 'Pending approval' ? (
                        <>
                          <Button 
                            onClick={() => handleApprove(order.id)}
                            className="bg-[#008080] hover:bg-[#006666] text-white text-[10px] font-black uppercase tracking-wider h-9 px-6 rounded-xl"
                          >
                            Approve
                          </Button>
                          <Button variant="outline" className="border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-wider h-9 px-4 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2">
                            <Download className="h-3.5 w-3.5" />
                            PDF
                          </Button>
                          <Button variant="outline" className="border-slate-200 text-red-500 text-[10px] font-black uppercase tracking-wider h-9 px-4 rounded-xl hover:bg-red-50 hover:border-red-100 transition-all flex items-center gap-2">
                            <XCircle className="h-3.5 w-3.5" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="outline" className="border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-wider h-9 px-4 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 group/btn">
                            <Truck className="h-4 w-4 text-slate-400 group-hover/btn:text-indigo-600 transition-colors" />
                            Track
                            <ChevronRight className="h-3.5 w-3.5 ml-1 opacity-50 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 transition-all" />
                          </Button>
                          <Button variant="outline" className="border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-wider h-9 px-4 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2">
                            <Download className="h-3.5 w-3.5" />
                            PDF
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
