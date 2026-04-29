import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { FileText, Maximize2, ShieldCheck, ArrowLeft, ArrowRight } from 'lucide-react';

interface TermsConditionsProps {
  onAccept: () => void;
  onBack: () => void;
  role: 'buyer' | 'seller';
}

export default function TermsConditions({ onAccept, onBack, role }: TermsConditionsProps) {
  const [accepted, setAccepted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className={`max-w-4xl mx-auto transition-all duration-500 ${isFullscreen ? 'fixed inset-0 z-50 p-0 max-w-none' : ''}`}>
      <Card className={`border-none shadow-2xl rounded-3xl overflow-hidden bg-white ${isFullscreen ? 'h-full rounded-none' : ''}`}>
        <CardHeader className="bg-slate-900 text-white p-6 md:p-8 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 rounded-xl backdrop-blur-md">
              <ShieldCheck className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-black uppercase tracking-tight italic">Terms & Conditions</CardTitle>
              {!isFullscreen && <p className="text-slate-400 text-[10px] font-bold italic tracking-widest uppercase">Version 2.4 | May 2024</p>}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-slate-400 hover:text-white hover:bg-white/10"
          >
            <Maximize2 className="h-5 w-5" />
          </Button>
        </CardHeader>
        
        <CardContent className={`p-0 flex flex-col ${isFullscreen ? 'h-[calc(100vh-80px)]' : 'h-[600px]'}`}>
          <div className="w-full h-full bg-slate-100 p-4 md:p-8 overflow-auto flex-1">
            {/* Embedded PDF Viewer Placeholder */}
            <div className="max-w-3xl mx-auto bg-white shadow-lg min-h-full p-6 md:p-16 border border-slate-200">
              <div className="flex justify-center mb-10">
                <div className="w-16 h-1 bg-slate-200 rounded-full" />
              </div>
              <h1 className="text-xl md:text-2xl font-black text-center mb-6 md:mb-10 text-slate-900 border-b-4 border-slate-900 pb-4 italic uppercase">Portal Terms of Service</h1>
              
              <div className="space-y-8 text-slate-600 font-medium leading-relaxed text-sm md:text-base italic">
                <section>
                  <h3 className="text-lg font-black text-slate-900 mb-4 uppercase tracking-tighter italic">1. Scope of Agreement</h3>
                  <p>This Terms & Conditions (T&C) governs the use of the PugArch MSME Marketplace Procurement Portal for the purposes of {role === 'seller' ? 'Seller and Service Provider' : 'Buyer and Procurement Entity'} registration, onboarding, and subsequent participation in procurement activities.</p>
                </section>
                
                <section>
                  <h3 className="text-lg font-black text-slate-900 mb-4 uppercase tracking-tighter italic">2. {role === 'seller' ? 'Seller' : 'Buyer'} Eligibility</h3>
                  <p>{role === 'seller' ? 'Sellers' : 'Buyers'} must be legally registered entities in their respective jurisdictions. Registration as a Proprietorship, Partnership, Pvt Ltd, or LLP requires valid documentary proof including but not limited to PAN, GST, and MSME/Udyam certificates.</p>
                </section>

                <section>
                   <h3 className="text-lg font-black text-slate-900 mb-4 uppercase tracking-tighter italic">3. Data Privacy & Verification</h3>
                   <p>By proceeding, the user consents to the verification of Aadhaar and PAN details through official Government of India (GoI) APIs or authorized third-party bridges. Data is handled under strict encryption standards.</p>
                </section>

                <div className="p-8 bg-slate-50 border-l-4 border-indigo-500 rounded-r-2xl italic">
                   <p className="font-bold text-slate-800">Note: Misrepresentation of facts or submission of forged documents will lead to immediate blacklisting and legal action under the appropriate statutes.</p>
                </div>

                <section>
                  <h3 className="text-lg font-black text-slate-900 mb-4 uppercase tracking-tighter italic">4. Code of Conduct</h3>
                  <p>Users are expected to maintain professional integrity. Use of automated scripts, unauthorized access attempts, or malicious uploads are strictly prohibited and will result in permanent suspension of credentials.</p>
                </section>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 border-t border-slate-100 bg-white">
            <div className="flex items-start gap-3 mb-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <div 
                className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-all cursor-pointer ${accepted ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-indigo-200'}`}
                onClick={() => setAccepted(!accepted)}
              >
                {accepted && <ShieldCheck className="h-4 w-4 text-white" />}
              </div>
              <p className="text-sm font-black text-slate-900 italic cursor-pointer" onClick={() => setAccepted(!accepted)}>
                I have read and agree to the Terms & Conditions of the GeM-style Registration Portal.
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {!isFullscreen && (
                <Button variant="ghost" onClick={onBack} className="w-full md:w-auto h-12 rounded-xl text-slate-500 font-bold uppercase italic tracking-widest text-[10px]">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Pre-requisites
                </Button>
              )}
              <Button 
                onClick={onAccept}
                disabled={!accepted}
                className="w-full md:w-auto h-14 px-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase italic tracking-widest shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:grayscale transition-all group"
              >
                Accept and Proceed
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
