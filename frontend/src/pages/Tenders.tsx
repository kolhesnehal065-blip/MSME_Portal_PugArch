import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  id: number;
  tenderId: string;
  title: string;
  category: string;
  budget: number;
  status: 'draft' | 'approved' | 'published' | 'bid_submission' | 'tech_bid_opening' | 'tech_evaluation' | 'financial_bid_opening' | 'financial_opening' | 'financial_evaluation' | 'awarded' | 'po_generated' | 'closed';
  bidsCount: number;
  closesAt: string;
  description: string;
}

const TENDER_STAGES = [
  { id: 'draft', label: 'Tender Draft' },
  { id: 'approved', label: 'Approve' },
  { id: 'published', label: 'Publish' },
  { id: 'bid_submission', label: 'Bid Submission' },
  { id: 'tech_bid_opening', label: 'Tech Bid Opening' },
  { id: 'tech_evaluation', label: 'Technical Evaluation' },
  { id: 'financial_bid_opening', label: 'Financial Bid Opening' },
  { id: 'financial_opening', label: 'Financial Opening' },
  { id: 'financial_evaluation', label: 'Financial Evaluation' },
  { id: 'awarded', label: 'Award' },
  { id: 'po_generated', label: 'PO Generation' }
];

export default function Tenders() {
  const navigate = useNavigate();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('published');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTender, setNewTender] = useState({
    title: '',
    category: '',
    budget: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [publishingId, setPublishingId] = useState<number | null>(null);

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

  const handlePublish = async (tenderId: number) => {
    setPublishingId(tenderId);
    try {
      const res = await api.put(`/api/tenders/${tenderId}/status`, {
        status: 'published'
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.ok) {
        toast.success('Tender published successfully');
        await fetchTenders();
        setActiveTab('published');
      } else {
        const errorData = await res.json();
        console.error('Publish Failed:', errorData);
        toast.error(errorData.message || 'Failed to publish tender');
      }
    } catch (err: any) {
      console.error('Network Error during Publish:', err);
      toast.error(`Network error: ${err.message || 'Check connection'}`);
    } finally {
      setPublishingId(null);
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

  const getDaysLeft = (date: string) => {
    const diff = new Date(date).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days}d` : 'Expired';
  };

  const currentTenders = activeTab === 'published' 
    ? tenders.filter(t => t.status === 'published' || t.status === 'bid_submission' || t.status.startsWith('tech') || t.status.startsWith('fin'))
    : activeTab === 'closed'
    ? tenders.filter(t => t.status === 'closed' || t.status === 'awarded' || t.status === 'po_generated')
    : tenders.filter(t => t.status === activeTab);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 p-4 md:p-12">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Create Tender Button */}
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-[#00695c] hover:bg-[#004d40] text-white h-14 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Plus className="h-5 w-5" />
          Create Tender
        </Button>

        {/* Tab Selection */}
        <div className="flex justify-start">
          <div className="flex items-center gap-1 bg-[#f1f3f4] p-1.5 rounded-xl border border-[#e8eaed]">
            {[
              { id: 'draft', label: 'Draft', count: tenders.filter(t => t.status === 'draft').length },
              { id: 'published', label: 'Active', count: tenders.filter(t => t.status === 'published' || t.status === 'bid_submission' || t.status.startsWith('tech') || t.status.startsWith('fin')).length },
              { id: 'closed', label: 'Closed', count: tenders.filter(t => t.status === 'closed' || t.status === 'awarded' || t.status === 'po_generated').length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-8 py-3 rounded-xl text-sm font-bold transition-all",
                  activeTab === tab.id 
                    ? "bg-white text-slate-900 shadow-sm border border-[#dadce0]" 
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {tab.label}
                <span className="text-slate-400 font-medium ml-4">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tenders Table */}
        <div className="border border-[#dadce0] rounded-2xl overflow-hidden bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white border-b border-[#dadce0]">
              <tr>
                <th className="px-8 py-5 text-sm font-medium text-slate-500 w-32">Tender ID</th>
                <th className="px-8 py-5 text-sm font-medium text-slate-500">Title</th>
                <th className="px-8 py-5 text-sm font-medium text-slate-500">Category</th>
                <th className="px-8 py-5 text-sm font-medium text-slate-500 text-right">Budget</th>
                <th className="px-8 py-5 text-sm font-medium text-slate-500 text-center">Bids</th>
                <th className="px-8 py-5 text-sm font-medium text-slate-500">Closes</th>
                <th className="px-8 py-5 text-sm font-medium text-slate-500">Status</th>
                <th className="px-8 py-5 text-sm font-medium text-slate-500 text-right pr-12">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dadce0]">
              {loading ? (
                [1,2,3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="px-8 py-10"><div className="h-4 bg-slate-50 rounded w-full"></div></td>
                  </tr>
                ))
              ) : currentTenders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <FileText className="h-12 w-12" />
                      <p className="text-sm font-bold uppercase tracking-widest">No Tenders Found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentTenders.map((tender) => (
                  <tr key={tender.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-8 text-xs font-mono text-slate-400">
                      {tender.tenderId || `T-2026-01${tender.id}`}
                    </td>
                    <td className="px-8 py-8 w-64">
                      <p className="text-[15px] font-bold text-slate-900 leading-snug">{tender.title}</p>
                    </td>
                    <td className="px-8 py-8">
                      <span className="text-xs font-bold text-slate-900 px-4 py-2 rounded-xl border border-[#dadce0] whitespace-nowrap">
                        {tender.category}
                      </span>
                    </td>
                    <td className="px-8 py-8 text-[15px] font-bold text-slate-900 text-right">
                      ₹{tender.budget?.toLocaleString()}
                    </td>
                    <td className="px-8 py-8 text-base font-medium text-slate-900 text-center">
                      {tender.bidsCount || 0}
                    </td>
                    <td className="px-8 py-8 text-[15px] font-medium text-slate-500">
                      {getDaysLeft(tender.closesAt)}
                    </td>
                    <td className="px-8 py-8">
                      <span className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-bold",
                        tender.status === 'draft' ? "bg-slate-100 text-slate-600" :
                        "bg-[#e6f4ea] text-[#1e8e3e]"
                      )}>
                        {tender.status === 'draft' ? 'Draft' : 'Active'}
                      </span>
                    </td>
                    <td className="px-8 py-8 text-right pr-10">
                      {tender.status === 'draft' ? (
                        <Button 
                          className="bg-[#00695c] hover:bg-[#004d40] text-white text-sm font-bold h-11 px-8 rounded-xl shadow-md transition-all flex items-center gap-2 ml-auto"
                          onClick={() => handlePublish(tender.id)}
                          disabled={publishingId === tender.id}
                        >
                          {publishingId === tender.id ? 'Publishing...' : 'Publish Now'}
                          <Plus className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          variant="outline"
                          className="bg-white border border-[#dadce0] text-slate-900 text-sm font-bold h-11 px-6 rounded-xl hover:bg-slate-50 flex items-center gap-2 ml-auto"
                          onClick={() => navigate('/buyer/quotations')}
                        >
                          View bids
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      )}
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
          <div className="relative w-full max-w-xl max-h-[calc(100vh-2rem)] bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-y-auto animate-in zoom-in-95 duration-300">
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
