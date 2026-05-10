import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  ClipboardCheck, 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Trophy,
  ChevronDown,
  ArrowRight,
  Building2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface Quotation {
  id: number;
  sellerId: number;
  tenderId: number;
  unitPrice: number;
  quantity: number;
  deliveryDays: number;
  warranty: string;
  validTill: string;
  status: 'pending' | 'accepted' | 'rejected';
  note?: string;
  isLowest?: boolean;
  tender: {
    tenderId: string;
    title: string;
  };
  seller: {
    name: string;
    sellerProfile?: {
      businessName: string;
      offices: Array<{ city: string }>;
    }
  }
}

import { useAuth } from '../hooks/useAuth';

export default function Quotations() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenders, setTenders] = useState<any[]>([]);
  const [selectedTenderId, setSelectedTenderId] = useState<string>('all');

  useEffect(() => {
    if (user?.role === 'buyer') {
      fetchMyTenders();
    } else if (user?.role === 'seller') {
      fetchMyBids();
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'buyer' && tenders.length > 0) {
      fetchAllBidsForBuyer();
    }
  }, [tenders, selectedTenderId, user]);

  const fetchMyTenders = async () => {
    try {
      const res = await api.get('/api/tenders', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTenders(data);
      }
    } catch (err) {
      toast.error('Failed to load your tenders');
    }
  };

  const fetchMyBids = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/bids/my', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQuotes(data);
      }
    } catch (err) {
      toast.error('Failed to load your bids');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllBidsForBuyer = async () => {
    setLoading(true);
    try {
      let allBids: Quotation[] = [];
      
      const tenderIdsToFetch = selectedTenderId === 'all' 
        ? tenders.map(t => t.id) 
        : [Number(selectedTenderId)];

      for (const id of tenderIdsToFetch) {
        const res = await api.get(`/api/tenders/${id}/bids`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Find lowest unit price in this tender
          const lowestPrice = Math.min(...data.map((b: any) => b.unitPrice));
          const bidsWithMetadata = data.map((b: any) => ({
            ...b,
            isLowest: b.unitPrice === lowestPrice && data.length > 1,
            tender: tenders.find(t => t.id === id)
          }));
          allBids = [...allBids, ...bidsWithMetadata];
        }
      }
      setQuotes(allBids);
    } catch (err) {
      toast.error('Failed to load quotations');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: 'accepted' | 'rejected') => {
    try {
      const res = await api.post(`/api/bids/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        toast.success(`Quotation ${status === 'accepted' ? 'accepted' : 'rejected'} successfully`);
        fetchAllBidsForBuyer(); // Refresh
      } else {
        const data = await res.json();
        toast.error(data.message || 'Update failed');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const handleAccept = (id: number) => handleStatusUpdate(id, 'accepted');
  const handleReject = (id: number) => handleStatusUpdate(id, 'rejected');

  if (loading && quotes.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center px-4 text-center">
        <div className="space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="text-sm font-bold text-slate-500 italic">Syncing market data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {user?.role === 'buyer' ? 'Bid Evaluation' : 'Market Participation'}
            </p>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {user?.role === 'buyer' ? 'Quotations' : 'My Bids'}
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              {user?.role === 'buyer' 
                ? 'Compare vendor bids side-by-side and award the tender to the best fit.'
                : 'Track the status and performance of your submitted tender quotations.'}
            </p>
          </div>
          
          {user?.role === 'buyer' && (
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <select 
                  value={selectedTenderId}
                  onChange={(e) => setSelectedTenderId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 pr-10 text-sm font-semibold text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all shadow-sm"
                >
                  <option value="all">All active tenders</option>
                  {tenders.map(t => (
                    <option key={t.id} value={t.id}>{t.tenderId} - {t.title}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Quotes Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {quotes.map((quote) => (
            <Card key={quote.id} className={cn(
              "border-slate-200 shadow-sm overflow-hidden transition-all duration-300",
              quote.status === 'accepted' ? "ring-2 ring-teal-500 border-transparent shadow-teal-100" : "hover:shadow-md"
            )}>
              <CardContent className="p-0">
                <div className="p-6 md:p-8">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400">{quote.id}</span>
                        {quote.isLowest && (
                          <span className="flex items-center gap-1 bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-teal-100">
                            <Trophy className="h-3 w-3" />
                            Lowest bid
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">
                          {quote.seller.sellerProfile?.businessName || quote.seller.name}
                        </h3>
                        <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-1">
                          {quote.seller.sellerProfile?.offices?.[0]?.city || 'N/A'} 
                          <span className="text-slate-300">•</span> 
                          {quote.tender.category}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                      quote.status === 'pending' ? "bg-slate-50 text-slate-500 border-slate-100" :
                      quote.status === 'accepted' ? "bg-teal-50 text-teal-600 border-teal-100" :
                      "bg-red-50 text-red-600 border-red-100"
                    )}>
                      {quote.status}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
                    For {quote.tender.tenderId} <span className="text-slate-300 mx-1">·</span> {quote.tender.title}
                  </p>

                  {/* Details Grid */}
                  <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-y-4 sm:gap-y-6 gap-x-4 sm:gap-x-12 mb-8">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unit Price</p>
                      <p className="text-lg font-bold text-slate-900">₹{quote.unitPrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quantity</p>
                      <p className="text-lg font-bold text-slate-900">{quote.quantity}</p>
                    </div>
                    <div className="col-span-2 h-px bg-slate-200/50" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                      <p className="text-xl font-black text-slate-900">₹{(quote.unitPrice * quote.quantity).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Delivery</p>
                      <p className="text-lg font-bold text-slate-900">{quote.deliveryDays} days</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Warranty</p>
                      <p className="text-lg font-bold text-slate-900">{quote.warranty}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valid Till</p>
                      <p className="text-lg font-bold text-slate-900">
                        {quote.validTill ? new Date(quote.validTill).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {quote.note && (
                    <p className="text-xs italic text-slate-500 mb-8 flex items-start gap-2">
                      <span className="text-teal-500 text-lg leading-none">"</span>
                      {quote.note}
                    </p>
                  )}

                  {/* Actions */}
                  {user?.role === 'buyer' ? (
                    <>
                      {quote.status === 'pending' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <Button 
                            variant="outline" 
                            onClick={() => handleReject(quote.id)}
                            className="border-slate-200 text-slate-600 font-bold h-12 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                          <Button 
                            onClick={() => handleAccept(quote.id)}
                            className="bg-teal-700 hover:bg-teal-800 text-white font-bold h-12 rounded-xl shadow-lg shadow-teal-700/10 transition-all"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Accept
                          </Button>
                        </div>
                      ) : quote.status === 'accepted' ? (
                        <Button 
                          disabled
                          className="w-full bg-teal-50 text-teal-700 border border-teal-200 font-bold h-12 rounded-xl flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="h-5 w-5" />
                          Accepted
                          <ArrowRight className="h-4 w-4 ml-auto" />
                        </Button>
                      ) : (
                        <Button 
                          disabled
                          className="w-full bg-slate-100 text-slate-400 border border-slate-200 font-bold h-12 rounded-xl flex items-center justify-center gap-2"
                        >
                          <XCircle className="h-5 w-5" />
                          Rejected
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className={cn(
                      "w-full h-12 rounded-xl flex items-center justify-center gap-2 font-bold",
                      quote.status === 'pending' ? "bg-amber-50 text-amber-600 border border-amber-100" :
                      quote.status === 'accepted' ? "bg-teal-50 text-teal-700 border border-teal-100" :
                      "bg-slate-100 text-slate-400 border border-slate-200"
                    )}>
                      {quote.status === 'pending' && <Clock className="h-4 w-4" />}
                      {quote.status === 'accepted' && <CheckCircle2 className="h-4 w-4" />}
                      {quote.status === 'rejected' && <XCircle className="h-4 w-4" />}
                      {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
