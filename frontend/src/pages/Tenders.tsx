import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
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
    <div className="min-h-screen bg-[#0B0F17] text-white p-4 md:p-8">


      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Procurement</p>
          <h1 className="text-4xl font-black tracking-tight italic">Tenders</h1>
          <p className="text-sm text-slate-400 font-medium italic">Manage drafts, monitor live bids, and review closed tenders.</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B0F17] border-0 h-12 px-6 rounded-xl font-black uppercase text-xs tracking-widest italic transition-all shadow-xl shadow-[#00D1C1]/10"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Tender
        </Button>
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-2 p-1 bg-[#151B28] rounded-xl border border-slate-800/50">
          {(['draft', 'active', 'closed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest italic transition-all",
                activeTab === tab 
                  ? "bg-slate-800 text-white shadow-lg" 
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              {tab} <span className="ml-1 opacity-50">{tenders.filter(t => t.status === tab).length}</span>
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search GSTIN, vendors, tenders.." 
            className="w-full bg-[#151B28] border-slate-800/50 border rounded-xl py-3 pl-12 pr-4 text-sm font-bold placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all italic"
          />
        </div>
      </div>

      {/* Tenders Table */}
      <div className="bg-[#151B28]/40 border border-slate-800/50 rounded-3xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/50 bg-slate-900/20">
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Tender ID</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Title</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Category</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic text-right">Budget</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic text-center">Bids</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic text-center">Closes</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {filteredTenders.length > 0 ? filteredTenders.map((tender) => (
                <tr key={tender._id} className="group hover:bg-white/5 transition-colors">
                  <td className="p-6 text-xs font-bold text-slate-500 font-mono tracking-tight">{tender.tenderId}</td>
                  <td className="p-6">
                    <p className="text-sm font-bold text-slate-200 tracking-wide">{tender.title}</p>
                  </td>
                  <td className="p-6">
                    <span className="px-3 py-1 rounded-full bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                      {tender.category}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <p className="text-sm font-black text-slate-100 italic">₹{tender.budget.toLocaleString()}</p>
                  </td>
                  <td className="p-6 text-center">
                    <p className="text-xs font-bold text-slate-400">{tender.bidsCount}</p>
                  </td>
                  <td className="p-6 text-center">
                    <p className="text-xs font-bold text-slate-400 italic">{getDaysLeft(tender.closesAt)}</p>
                  </td>
                  <td className="p-6 text-center">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest italic",
                      tender.status === 'active' ? "bg-green-500/10 text-green-500" :
                      tender.status === 'draft' ? "bg-yellow-500/10 text-yellow-500" :
                      "bg-slate-700 text-slate-400"
                    )}>
                      {tender.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                       <FileText className="h-12 w-12 text-slate-800" />
                       <p className="text-slate-500 font-black uppercase tracking-widest text-xs italic">No {activeTab} tenders found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Tender Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-xl bg-[#151B28] rounded-[2.5rem] border border-slate-800/50 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>

            <form onSubmit={handleCreateTender} className="p-10 space-y-8">
              <div className="space-y-2">
                <h2 className="text-2xl font-black italic tracking-tight">New tender</h2>
                <p className="text-xs text-slate-400 font-bold italic">Save as draft now. You can add line items and publish from the draft list.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic ml-1">Title</label>
                  <input 
                    required
                    value={newTender.title}
                    onChange={(e) => setNewTender({...newTender, title: e.target.value})}
                    placeholder="Supply of 500 ergonomic office chairs"
                    className="w-full bg-[#0B0F17] border-slate-800/50 border rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:border-indigo-500/50 transition-all italic"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic ml-1">Category</label>
                    <select 
                      required
                      value={newTender.category}
                      onChange={(e) => setNewTender({...newTender, category: e.target.value})}
                      className="w-full bg-[#0B0F17] border-slate-800/50 border rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:border-indigo-500/50 transition-all italic appearance-none"
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
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic ml-1">Budget (₹)</label>
                    <input 
                      required
                      type="number"
                      value={newTender.budget}
                      onChange={(e) => setNewTender({...newTender, budget: e.target.value})}
                      placeholder="2500000"
                      className="w-full bg-[#0B0F17] border-slate-800/50 border rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:border-indigo-500/50 transition-all italic"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic ml-1">Brief Description</label>
                  <textarea 
                    required
                    value={newTender.description}
                    onChange={(e) => setNewTender({...newTender, description: e.target.value})}
                    placeholder="Specifications, delivery timelines, etc."
                    rows={4}
                    className="w-full bg-[#0B0F17] border-slate-800/50 border rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:border-indigo-500/50 transition-all italic resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors italic"
                >
                  Cancel
                </button>
                <Button 
                  disabled={submitting}
                  className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B0F17] border-0 h-14 px-10 rounded-2xl font-black uppercase text-xs tracking-widest italic transition-all shadow-xl shadow-[#00D1C1]/10"
                >
                  {submitting ? 'Saving...' : 'Save as draft'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
