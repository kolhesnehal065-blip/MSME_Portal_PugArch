import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MoreVertical,
  ChevronRight,
  FileText,
  AlertCircle,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface Tender {
  _id: string;
  tenderId: string;
  title: string;
  category: string;
  budget: number;
  status: 'draft' | 'active' | 'closed';
  bidsCount: number;
  closesAt: string;
  description: string;
}

export default function Tenders() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'draft' | 'active' | 'closed'>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTender, setNewTender] = useState({
    title: '',
    category: '',
    budget: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTenders();
  }, []);

  const fetchTenders = async () => {
    try {
      const res = await api.get('/api/tenders', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTenders(data);
      }
    } catch (err) {
      console.error('Failed to fetch tenders', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTender = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/api/tenders', {
        ...newTender,
        budget: Number(newTender.budget),
        status: 'draft' // Initial status as per screenshot "Save as draft"
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.ok) {
        toast.success('Tender created successfully');
        setIsModalOpen(false);
        setNewTender({ title: '', category: '', budget: '', description: '' });
        fetchTenders();
      } else {
        toast.error('Failed to create tender');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTenders = tenders.filter(t => t.status === activeTab);

  const getDaysLeft = (date: string) => {
    const diff = new Date(date).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days}d` : 'Expired';
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Procurement</p>
            <h1 className="text-3xl font-bold text-slate-900">Tenders</h1>
            <p className="text-sm text-slate-500">
              Manage drafts, monitor live bids, and review closed tenders.
            </p>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-teal-700 hover:bg-teal-800 text-white h-10 px-6 rounded-lg font-semibold text-sm flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Tender
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 bg-slate-100/50 p-1.5 rounded-xl w-fit">
          {['Draft', 'Active', 'Closed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase() as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all",
                activeTab === tab.toLowerCase() 
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tab}
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold",
                activeTab === tab.toLowerCase() ? "bg-slate-100 text-slate-600" : "bg-slate-200/50 text-slate-400"
              )}>
                {tab === 'Draft' ? '2' : tab === 'Active' ? '3' : '2'}
              </span>
            </button>
          ))}
        </div>

        {/* Tenders Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tender ID</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Title</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Budget</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Bids</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Closes</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [1,2,3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-6 py-8"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                  </tr>
                ))
              ) : filteredTenders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="h-8 w-8 text-slate-200" />
                      <p className="text-sm font-medium text-slate-400">No tenders found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTenders.map((tender) => (
                  <tr key={tender._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5 text-sm font-mono text-slate-400">
                      {tender.tenderId || 'T-2026-0128'}
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-slate-900 line-clamp-1">{tender.title}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-bold bg-slate-50 text-slate-600 px-2.5 py-1 rounded-md border border-slate-100 uppercase">
                        {tender.category || 'IT Hardware'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-slate-900 text-right">
                      ₹{tender.budget?.toLocaleString() || '8,40,00,000'}
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-900 text-center">
                      {tender.bidsCount || 0}
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-500">
                      {tender.closesAt ? new Date(tender.closesAt).toLocaleDateString() : '21d'}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-400 px-2.5 py-1 rounded-md uppercase">
                        {tender.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* New Tender Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-xl bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <X className="h-5 w-5 text-slate-400" />
            </button>

            <form onSubmit={handleCreateTender} className="p-10 space-y-8">
              <div className="space-y-2">
                <h2 className="text-2xl font-black italic tracking-tight text-slate-900">New tender</h2>
                <p className="text-xs text-slate-500 font-bold italic">Save as draft now. You can add line items and publish from the draft list.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic ml-1">Title</label>
                  <input 
                    required
                    value={newTender.title}
                    onChange={(e) => setNewTender({...newTender, title: e.target.value})}
                    placeholder="Supply of 500 ergonomic office chairs"
                    className="w-full bg-slate-50 border-slate-200 border rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:border-indigo-500/20 transition-all italic text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic ml-1">Category</label>
                    <select 
                      required
                      value={newTender.category}
                      onChange={(e) => setNewTender({...newTender, category: e.target.value})}
                      className="w-full bg-slate-50 border-slate-200 border rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:border-indigo-500/20 transition-all italic appearance-none text-slate-900"
                    >
                      <option value="">Select Category</option>
                      <option value="Furniture">Furniture</option>
                      <option value="Software & Cloud">Software & Cloud</option>
                      <option value="Catering">Catering</option>
                      <option value="Construction">Construction</option>
                      <option value="Services">Services</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic ml-1">Budget (₹)</label>
                    <input 
                      required
                      type="number"
                      value={newTender.budget}
                      onChange={(e) => setNewTender({...newTender, budget: e.target.value})}
                      placeholder="2500000"
                      className="w-full bg-slate-50 border-slate-200 border rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:border-indigo-500/20 transition-all italic text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic ml-1">Brief Description</label>
                  <textarea 
                    required
                    value={newTender.description}
                    onChange={(e) => setNewTender({...newTender, description: e.target.value})}
                    placeholder="Specifications, delivery timelines, etc."
                    rows={4}
                    className="w-full bg-slate-50 border-slate-200 border rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:border-indigo-500/20 transition-all italic resize-none text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors italic"
                >
                  Cancel
                </button>
                <Button 
                  disabled={submitting}
                  className="bg-[#00D1C1] hover:bg-[#00B8A9] text-white border-0 h-14 px-10 rounded-2xl font-black uppercase text-xs tracking-widest italic transition-all shadow-xl shadow-[#00D1C1]/10"
                >
                  {submitting ? 'Saving...' : 'Save as draft'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
