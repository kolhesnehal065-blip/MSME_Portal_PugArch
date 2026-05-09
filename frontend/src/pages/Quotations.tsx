import React, { useState } from 'react';
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
  ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface Quotation {
  id: string;
  vendorName: string;
  city: string;
  category: string;
  tenderId: string;
  tenderTitle: string;
  unitPrice: number;
  quantity: number;
  deliveryDays: number;
  warranty: string;
  validTill: string;
  isLowest?: boolean;
  status: 'received' | 'accepted' | 'rejected';
  note?: string;
}

const SAMPLE_QUOTES: Quotation[] = [
  {
    id: 'Q-2026-0411',
    vendorName: 'Bharat Office Solutions',
    city: 'Bengaluru',
    category: 'Furniture',
    tenderId: 'T-2026-0142',
    tenderTitle: 'Supply of 500 ergonomic office chairs',
    unitPrice: 4800,
    quantity: 500,
    deliveryDays: 21,
    warranty: '36 mo',
    validTill: '20 May',
    isLowest: true,
    status: 'received',
    note: 'Includes on-site assembly and 3-year warranty.'
  },
  {
    id: 'Q-2026-0412',
    vendorName: 'Heritage Furniture Co.',
    city: 'Jaipur',
    category: 'Furniture',
    tenderId: 'T-2026-0142',
    tenderTitle: 'Supply of 500 ergonomic office chairs',
    unitPrice: 5200,
    quantity: 500,
    deliveryDays: 18,
    warranty: '24 mo',
    validTill: '17 May',
    status: 'received'
  }
];

export default function Quotations() {
  const [quotes, setQuotes] = useState<Quotation[]>(SAMPLE_QUOTES);

  const handleAccept = (id: string) => {
    toast.success(`Quotation ${id} accepted. Purchase Order generated.`);
    setQuotes(quotes.map(q => 
      q.id === id ? { ...q, status: 'accepted' } : { ...q, status: 'rejected' }
    ));
  };

  const handleReject = (id: string) => {
    toast.error(`Quotation ${id} rejected.`);
    setQuotes(quotes.map(q => 
      q.id === id ? { ...q, status: 'rejected' } : q
    ));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bid Evaluation</p>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Quotations</h1>
            <p className="text-sm text-slate-500 font-medium">
              Compare vendor bids side-by-side and award the tender to the best fit.
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <select className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 pr-10 text-sm font-semibold text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all">
                <option>All tenders</option>
                <option>T-2026-0142 - Office Chairs</option>
                <option>T-2026-0145 - Cloud Hosting</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
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
                        <h3 className="text-xl font-bold text-slate-900">{quote.vendorName}</h3>
                        <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-1">
                          {quote.city} <span className="text-slate-300">•</span> {quote.category}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                      quote.status === 'received' ? "bg-slate-50 text-slate-500 border-slate-100" :
                      quote.status === 'accepted' ? "bg-teal-50 text-teal-600 border-teal-100" :
                      "bg-red-50 text-red-600 border-red-100"
                    )}>
                      {quote.status}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
                    For {quote.tenderId} <span className="text-slate-300 mx-1">·</span> {quote.tenderTitle}
                  </p>

                  {/* Details Grid */}
                  <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-6 grid grid-cols-2 gap-y-6 gap-x-12 mb-8">
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
                      <p className="text-lg font-bold text-slate-900">{quote.validTill}</p>
                    </div>
                  </div>

                  {quote.note && (
                    <p className="text-xs italic text-slate-500 mb-8 flex items-start gap-2">
                      <span className="text-teal-500 text-lg leading-none">"</span>
                      {quote.note}
                    </p>
                  )}

                  {/* Actions */}
                  {quote.status === 'received' ? (
                    <div className="grid grid-cols-2 gap-4">
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
