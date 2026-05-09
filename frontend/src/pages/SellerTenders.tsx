import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Search, 
  Filter, 
  Clock, 
  MapPin,
  Building2,
  ChevronRight,
  FileText,
  BadgeInfo
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface PublicTender {
  id: number;
  tenderId: string;
  title: string;
  category: string;
  budget: number;
  status: string;
  closesAt: string;
  description: string;
  buyer: {
    name: string;
    buyerProfile?: {
      organizationName: string;
      city: string;
      state: string;
    }
  }
}

export default function SellerTenders() {
  const [tenders, setTenders] = useState<PublicTender[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPublicTenders();
  }, []);

  const fetchPublicTenders = async () => {
    try {
      const res = await api.get('/api/tenders/public', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTenders(data);
      }
    } catch (err: any) {
      console.error('Failed to fetch public tenders', err);
      toast.error(`Could not load tenders: ${err.message || 'Network error'}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredTenders = tenders.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.tenderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDaysLeft = (date: string) => {
    const diff = new Date(date).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days}d` : 'Closing soon';
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
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Marketplace</p>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Active Tenders</h1>
            <p className="text-sm text-slate-500 font-medium">
              Discover and participate in active procurement opportunities.
            </p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute inset-y-0 left-4 flex items-center h-full w-4 text-slate-400 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Search by ID, title, or category..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none shadow-sm"
            />
          </div>
        </div>

        {/* Tenders Grid */}
        <div className="grid grid-cols-1 gap-6">
          {filteredTenders.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-20 text-center">
              <FileText className="h-12 w-12 text-slate-200 mx-auto mb-4" />
              <p className="text-lg font-bold text-slate-900">No active tenders found</p>
              <p className="text-sm text-slate-500 mt-1">Check back later for new opportunities.</p>
            </div>
          ) : (
            filteredTenders.map((tender) => (
              <Card key={tender.id} className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-1 p-8">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-tighter bg-slate-50 px-2 py-0.5 rounded">
                          {tender.tenderId}
                        </span>
                        <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg border border-indigo-100 uppercase tracking-wider">
                          {tender.category}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                          <Clock className="h-3.5 w-3.5" />
                          {getDaysLeft(tender.closesAt)} left
                        </span>
                      </div>

                      <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                        {tender.title}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-2 mb-6 font-medium leading-relaxed max-w-3xl">
                        {tender.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center">
                            <Building2 className="h-4.5 w-4.5 text-slate-500" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Buyer</p>
                            <p className="text-xs font-bold text-slate-900">
                              {tender.buyer.buyerProfile?.organizationName || tender.buyer.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center">
                            <MapPin className="h-4.5 w-4.5 text-slate-500" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                            <p className="text-xs font-bold text-slate-900">
                              {tender.buyer.buyerProfile?.city}, {tender.buyer.buyerProfile?.state}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full md:w-72 bg-slate-50/50 border-t md:border-t-0 md:border-l border-slate-100 p-8 flex flex-col justify-between items-center md:items-end">
                      <div className="text-center md:text-right w-full mb-8">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tender Budget</p>
                        <p className="text-2xl font-black text-slate-900">₹{tender.budget?.toLocaleString()}</p>
                      </div>
                      <Button 
                        onClick={() => navigate(`/seller/tenders/${tender.id}/bid`)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-600/10 transition-all flex items-center justify-center gap-2"
                      >
                        Participate
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
