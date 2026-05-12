import React from 'react';
import { Card, CardContent, Badge } from '../components/ui/card';
import { Truck, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ParcelTracking({ trackingNumber = "PKG-92837465-IN" }: { trackingNumber?: string }) {
  const steps = [
    { label: 'Order Confirmed', date: '04 May 2026, 10:30 AM', status: 'completed' },
    { label: 'Shipped from Warehouse', date: '05 May 2026, 02:15 PM', status: 'completed' },
    { label: 'Out for Delivery', date: '09 May 2026, 08:00 AM', status: 'current' },
    { label: 'Delivered', date: 'Expected today', status: 'pending' },
  ];

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
      <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Truck className="h-5 w-5 text-indigo-400" />
          <h3 className="font-black uppercase text-xs tracking-widest">Live Logistics Tracker</h3>
        </div>
        <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 text-[9px] font-black ">ON THE WAY</Badge>
      </div>
      
      <div className="p-6 bg-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Tracking Number</p>
            <p className="text-sm font-black text-slate-900">{trackingNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Est. Delivery</p>
            <p className="text-sm font-black text-slate-900">Today, 8 PM</p>
          </div>
        </div>

        <div className="relative space-y-6">
          {/* Vertical Line */}
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-100" />
          
          {steps.map((step, idx) => (
            <div key={idx} className="relative flex items-center gap-4">
              <div className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center z-10 shadow-sm transition-all",
                step.status === 'completed' ? "bg-teal-500 text-white" :
                step.status === 'current' ? "bg-indigo-600 text-white animate-pulse ring-4 ring-indigo-50" :
                "bg-white border border-slate-200 text-slate-300"
              )}>
                {step.status === 'completed' ? <CheckCircle2 className="h-3 w-3" /> :
                 step.status === 'current' ? <Truck className="h-3 w-3" /> :
                 <Clock className="h-3 w-3" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className={cn(
                    "text-[10px] font-black uppercase italic",
                    step.status === 'pending' ? "text-slate-400" : "text-slate-900"
                  )}>
                    {step.label}
                  </p>
                  <p className="text-[9px] font-medium text-slate-400 italic">{step.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
           <div className="flex -space-x-2">
              {[1,2,3].map(i => (
                <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-400">
                  {i}
                </div>
              ))}
           </div>
           <p className="text-[9px] font-black text-indigo-600 uppercase italic cursor-pointer hover:underline">View Transit Details</p>
        </div>
      </div>
    </Card>
  );
}
