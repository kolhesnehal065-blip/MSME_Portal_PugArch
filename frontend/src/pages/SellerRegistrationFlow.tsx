import React, { useState } from 'react';
import Prerequisites from '../components/registration/Prerequisites';
import TermsConditions from '../components/registration/TermsConditions';
import RegistrationDetailsFlow from '../components/registration/RegistrationDetailsFlow';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SellerRegistrationFlow() {
  const [step, setStep] = useState(1); // 1: Pre-req, 2: T&C, 3: Reg Details
  const [businessType, setBusinessType] = useState('');

  const handlePrerequisitesProceed = (type: string) => {
    setBusinessType(type);
    setStep(2);
  };

  const handleTermsAccept = () => {
    setStep(3);
  };

  const handleBackToPrerequisites = () => {
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs / Progress Bar */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <Link to="/" className="p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-indigo-600 transition-colors">
            <Home className="h-5 w-5" />
          </Link>
          <ChevronRight className="h-4 w-4 text-slate-300" />
          <div className="flex items-center gap-8 bg-white px-8 py-3 rounded-2xl shadow-sm">
            <StepIndicator number={1} label="Pre-requisites" active={step === 1} completed={step > 1} />
            <div className="w-8 h-px bg-slate-100" />
            <StepIndicator number={2} label="Terms & Conditions" active={step === 2} completed={step > 2} />
            <div className="w-8 h-px bg-slate-100" />
            <StepIndicator number={3} label="Registration" active={step === 3} completed={step > 3} />
          </div>
        </div>

        <div className="animate-in fade-in duration-700">
          {step === 1 && <Prerequisites onProceed={handlePrerequisitesProceed} role="seller" />}
          {step === 2 && <TermsConditions onAccept={handleTermsAccept} onBack={handleBackToPrerequisites} role="seller" />}
          {step === 3 && <RegistrationDetailsFlow businessType={businessType} onBack={() => setStep(2)} role="seller" />}
        </div>

        <div className="mt-12 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 italic">
          Professional Procurement Portal | Secure & Verified
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ number, label, active, completed }: { number: number, label: string, active: boolean, completed: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
        active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110' : 
        completed ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'
      }`}>
        {completed ? '✓' : number}
      </div>
      <span className={`text-[10px] font-black uppercase tracking-widest italic ${
        active ? 'text-slate-900' : 'text-slate-400'
      }`}>
        {label}
      </span>
    </div>
  );
}
