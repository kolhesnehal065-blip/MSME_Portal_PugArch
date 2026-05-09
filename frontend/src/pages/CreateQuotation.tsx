import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input, Select } from '../components/ui/input';
import { 
  ChevronLeft, 
  Send, 
  IndianRupee, 
  Package, 
  Truck, 
  ShieldCheck, 
  Calendar,
  Building2,
  FileText,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface Tender {
  id: number;
  tenderId: string;
  title: string;
  category: string;
  budget: number;
  description: string;
  buyer: {
    name: string;
    buyerProfile?: {
      organizationName: string;
    }
  }
}

export default function CreateQuotation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tender, setTender] = useState<Tender | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    unitPrice: '',
    quantity: '',
    deliveryDays: '',
    warranty: '',
    validTill: '',
    note: ''
  });

  useEffect(() => {
    fetchTenderDetails();
  }, [id]);

  const fetchTenderDetails = async () => {
    try {
      // We'll fetch from public tenders list for simplicity, or add a specific endpoint
      const res = await api.get('/api/tenders/public', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        const found = data.find((t: any) => t.id === Number(id));
        if (found) setTender(found);
        else {
          toast.error('Tender not found');
          navigate('/seller/tenders');
        }
      }
    } catch (err) {
      toast.error('Failed to load tender details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.unitPrice || !formData.quantity || !formData.deliveryDays) {
      return toast.error('Please fill in all required fields');
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/api/tenders/${id}/bids`, {
        unitPrice: Number(formData.unitPrice),
        quantity: Number(formData.quantity),
        deliveryDays: Number(formData.deliveryDays),
        warranty: formData.warranty,
        validTill: formData.validTill ? new Date(formData.validTill).toISOString() : null,
        note: formData.note
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.ok) {
        toast.success('Quotation submitted successfully!');
        navigate('/seller/tenders');
      } else {
        const data = await res.json();
        toast.error(data.message || 'Submission failed');
      }
    } catch (err) {
      toast.error('Network error during submission');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading tender details...</div>;
  if (!tender) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate('/seller/tenders')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-xs uppercase tracking-widest mb-8 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Tenders
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Tender Summary */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden rounded-3xl">
              <div className="bg-indigo-600 p-6 text-white">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Target Tender</p>
                <h2 className="text-xl font-black leading-tight italic">{tender.title}</h2>
              </div>
              <CardContent className="p-6 space-y-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tender ID</p>
                  <p className="text-sm font-mono font-bold text-indigo-600">{tender.tenderId}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Budget Allocation</p>
                  <p className="text-xl font-black text-slate-900 italic">₹{tender.budget.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Buyer Organization</p>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-slate-500" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">
                      {tender.buyer.buyerProfile?.organizationName || tender.buyer.name}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Requirements</p>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {tender.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex gap-4">
              <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-900 mb-1">Participation Note</p>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Your bid will be visible only to the buyer. Ensure your pricing is competitive and includes all applicable taxes.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Bid Form */}
          <div className="lg:col-span-2">
            <Card className="border-none shadow-2xl shadow-slate-200/60 rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">
                  Create Quotation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit Price (₹) *</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input 
                          type="number"
                          placeholder="0.00"
                          value={formData.unitPrice}
                          onChange={(e) => setFormData({...formData, unitPrice: e.target.value})}
                          className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity *</label>
                      <div className="relative">
                        <Package className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input 
                          type="number"
                          placeholder="e.g. 500"
                          value={formData.quantity}
                          onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                          className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Delivery Time (Days) *</label>
                      <div className="relative">
                        <Truck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input 
                          type="number"
                          placeholder="e.g. 15"
                          value={formData.deliveryDays}
                          onChange={(e) => setFormData({...formData, deliveryDays: e.target.value})}
                          className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Warranty (Optional)</label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input 
                          type="text"
                          placeholder="e.g. 1 Year onsite"
                          value={formData.warranty}
                          onChange={(e) => setFormData({...formData, warranty: e.target.value})}
                          className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Validity Date (Optional)</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input 
                          type="date"
                          value={formData.validTill}
                          onChange={(e) => setFormData({...formData, validTill: e.target.value})}
                          className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Additional Notes</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
                      <textarea 
                        rows={4}
                        placeholder="Mention any special conditions, terms, or specifications..."
                        value={formData.note}
                        onChange={(e) => setFormData({...formData, note: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row gap-4">
                    <Button 
                      type="button" 
                      variant="ghost"
                      onClick={() => navigate('/seller/tenders')}
                      className="flex-1 h-14 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-400 hover:text-slate-900"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={submitting}
                      className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      {submitting ? 'Submitting...' : 'Submit Quotation'}
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
