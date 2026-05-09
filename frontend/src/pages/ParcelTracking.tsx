import React from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Truck, MapPin, Package, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ParcelTracking() {
  const steps = [
    { label: 'Order Confirmed', date: '04 May 2026, 10:30 AM', status: 'completed' },
    { label: 'Shipped from Warehouse', date: '05 May 2026, 02:15 PM', status: 'completed' },
    { label: 'Out for Delivery', date: '09 May 2026, 08:00 AM', status: 'current' },
    { label: 'Delivered', date: 'Expected today', status: 'pending' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Logistics</p>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Parcel Tracking</h1>
        </div>

        <Card className="border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="bg-slate-900 p-8 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tracking Number</p>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black">PKG-92837465-IN</h2>
                  <span className="bg-teal-500/20 text-teal-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-teal-500/30">
                    On the way
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Delivery</p>
                <p className="text-xl font-bold">Today, by 8:00 PM</p>
              </div>
            </div>
          </div>

          <CardContent className="p-10">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100 hidden md:block" />

              <div className="space-y-12">
                {steps.map((step, idx) => (
                  <div key={idx} className="relative flex items-start gap-6">
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full z-10 transition-all shadow-sm",
                      step.status === 'completed' ? "bg-teal-600 text-white" :
                      step.status === 'current' ? "bg-indigo-600 text-white animate-pulse ring-4 ring-indigo-100" :
                      "bg-white border-2 border-slate-200 text-slate-300"
                    )}>
                      {step.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> :
                       step.status === 'current' ? <Truck className="h-4 w-4" /> :
                       <Clock className="h-4 w-4" />}
                    </div>
                    <div>
                      <h3 className={cn(
                        "text-sm font-bold",
                        step.status === 'pending' ? "text-slate-400" : "text-slate-900"
                      )}>
                        {step.label}
                      </h3>
                      <p className="text-[11px] font-semibold text-slate-500 mt-1">{step.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-slate-200 shadow-sm p-6 flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Shipping Address</p>
              <p className="text-sm font-bold text-slate-900 leading-relaxed">
                45, Tech Center, MG Road<br />
                Bengaluru, Karnataka 560001
              </p>
            </div>
          </Card>
          <Card className="border-slate-200 shadow-sm p-6 flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Package Info</p>
              <p className="text-sm font-bold text-slate-900 leading-relaxed">
                Weight: 450kg<br />
                Dimensions: 500 x 500 x 1200 mm
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
