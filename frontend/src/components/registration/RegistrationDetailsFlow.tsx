import React, { useState } from 'react';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { toast } from 'sonner';
import { 
  Building2, 
  UserCheck, 
  Mail, 
  Lock, 
  CheckCircle2, 
  ShieldCheck, 
  Fingerprint, 
  FileText,
  Key,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Info
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface RegistrationDetailsFlowProps {
  businessType: string;
  onBack: () => void;
  role: 'buyer' | 'seller';
}

export default function RegistrationDetailsFlow({ businessType, onBack, role }: RegistrationDetailsFlowProps) {
  const [currentSubStep, setCurrentSubStep] = useState(1);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    businessName: '',
    industry: '',
    cin: '',
    gstin: '',
    website: '',
    orgPan: '',
    personalVerificationMethod: 'aadhaar', // 'aadhaar' | 'pan'
    aadhaarNumber: '',
    panNumber: '',
    personalName: '',
    dob: '',
    mobile: '',
    roleInOrg: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [isAadhaarVerified, setIsAadhaarVerified] = useState(false);
  const [aadhaarOtpSent, setAadhaarOtpSent] = useState(false);
  const [simulatedAadhaarOtp, setSimulatedAadhaarOtp] = useState('');

  const [emailOtp, setEmailOtp] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const steps = [
    { id: 1, title: 'Org Details', icon: Building2 },
    { id: 2, title: 'Personal Verification', icon: UserCheck },
    { id: 3, title: 'Email Verification', icon: Mail },
    { id: 4, title: 'Credentials', icon: Lock }
  ];

  const handleSendAadhaarOtp = () => {
    if (formData.aadhaarNumber.length !== 12) return toast.error('Enter valid Aadhaar');
    if (formData.mobile.length !== 10) return toast.error('Enter linked mobile number');
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedAadhaarOtp(otp);
    setAadhaarOtpSent(true);
    toast.success('Simulation: Aadhaar OTP Generated');
  };

  const handleVerifyAadhaarOtp = () => {
    if (aadhaarOtp === simulatedAadhaarOtp) {
      setIsAadhaarVerified(true);
      toast.success('Aadhaar Verified Successfully');
    } else {
      toast.error('Invalid OTP');
    }
  };

  const handleNext = () => {
    if (currentSubStep === 1) {
      if (!formData.businessName) {
        toast.error('Please enter Organization Name');
        return;
      }
    }
    if (currentSubStep === 2) {
      if (formData.personalVerificationMethod === 'aadhaar') {
        if (!isAadhaarVerified) {
          toast.error('Please verify Aadhaar first');
          return;
        }
      } else {
         if (!formData.panNumber) {
          toast.error('Please enter valid PAN Number');
          return;
        }
      }
    }
    if (currentSubStep === 3 && !isEmailVerified) {
      toast.error('Please verify your email address first');
      return;
    }
    
    if (currentSubStep < 4) setCurrentSubStep(currentSubStep + 1);
  };

  const handleBack = () => {
    if (currentSubStep > 1) setCurrentSubStep(currentSubStep - 1);
    else onBack();
  };

  const handleSendOtp = async () => {
    if (!formData.email) return toast.error('Email is required');
    setIsSendingOtp(true);
    try {
      const res = await api.post('/api/auth/send-email-otp', { email: formData.email });
      if (res.ok) {
        setOtpSent(true);
        toast.success('OTP sent successfully');
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!emailOtp) return toast.error('Enter OTP');
    try {
      const res = await api.post('/api/auth/verify-email-otp', { email: formData.email, otp: emailOtp });
      if (res.ok) {
        setIsEmailVerified(true);
        toast.success('Email verified!');
      } else {
        const data = await res.json();
        toast.error(data.message || 'Invalid OTP');
      }
    } catch (err) {
      toast.error('Verification failed');
    }
  };

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    
    setIsLoading(true);
    try {
      const res = await api.post('/api/auth/register', {
        name: formData.personalName || formData.businessName,
        email: formData.email,
        password: formData.password,
        role,
        registrationDetails: {
          businessType,
          businessName: formData.businessName,
          verificationMethod: formData.personalVerificationMethod,
          isEmailVerified: true
        }
      });
      
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        toast.success(`Registration completed! Proceeding to ${role} onboarding.`);
        navigate(`/${role}/onboarding`);
      } else {
        toast.error(data.message || 'Registration failed');
      }
    } catch (err) {
      toast.error('Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const isPasswordStrong = (pw: string) => {
    return pw.length >= 8 && pw.length <= 16 && 
           /[A-Z]/.test(pw) && /[a-z]/.test(pw) && 
           /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw);
  };

  return (
    <div className="max-w-5xl mx-auto flex gap-8">
      {/* Left Sidebar Navigation */}
      <div className="w-64 flex-shrink-0">
        <div className="sticky top-8 space-y-2">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = currentSubStep === step.id;
            const isCompleted = currentSubStep > step.id;
            
            return (
              <div 
                key={step.id}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                  isActive ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 
                  isCompleted ? 'bg-green-50 text-green-700' : 'bg-white text-slate-400'
                }`}
              >
                <div className={`p-2 rounded-xl ${
                  isActive ? 'bg-white/20' : 
                  isCompleted ? 'bg-green-100' : 'bg-slate-50'
                }`}>
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className="text-xs font-black uppercase tracking-tight italic">{step.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
          <CardHeader className="bg-slate-50 p-8 border-b border-white">
            <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-900 italic">
              Step {currentSubStep}: {steps.find(s => s.id === currentSubStep)?.title}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-10">
            {currentSubStep === 1 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                {role === 'buyer' ? (
                  <>
                    <Input
                      label="Organization / Company Name *"
                      placeholder="Enter Registered Business Name"
                      value={formData.businessName}
                      onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                      className="h-14 rounded-2xl border-slate-200"
                    />
                    <Input
                      label="Business Type"
                      value={businessType}
                      disabled
                      className="bg-slate-50 font-bold italic h-14 rounded-2xl"
                    />

                  </>
                ) : (
                  <>
                    <Input
                      label="Organisation Type"
                      value={businessType}
                      disabled
                      className="bg-slate-50 font-bold italic"
                    />
                    <Input
                      label="Organisation Name"
                      placeholder="Enter Registered Business Name"
                      value={formData.businessName}
                      onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                      className="h-14 rounded-2xl border-slate-200"
                    />
                    <div className="p-4 bg-indigo-50 rounded-2xl flex gap-3 text-indigo-700 border border-indigo-100 italic text-sm">
                       <Info className="h-5 w-5 flex-shrink-0" />
                       <p>Please ensure the name matches your legal registration documents (PAN/COI).</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {currentSubStep === 2 && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div className={`grid gap-4 ${role === 'buyer' ? 'grid-cols-1 max-w-sm mx-auto' : 'grid-cols-2'}`}>
                  <button 
                    onClick={() => setFormData({...formData, personalVerificationMethod: 'aadhaar'})}
                    className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 ${
                      formData.personalVerificationMethod === 'aadhaar' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 bg-slate-50'
                    }`}
                  >
                    <Fingerprint className={`h-10 w-10 ${formData.personalVerificationMethod === 'aadhaar' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="font-black uppercase italic text-[10px] tracking-widest">Aadhaar Verification</span>
                  </button>
                  {role !== 'buyer' && (
                    <button 
                      onClick={() => setFormData({...formData, personalVerificationMethod: 'pan'})}
                      className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 ${
                        formData.personalVerificationMethod === 'pan' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 bg-slate-50'
                      }`}
                    >
                      <FileText className={`h-10 w-10 ${formData.personalVerificationMethod === 'pan' ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span className="font-black uppercase italic text-[10px] tracking-widest">PAN Verification</span>
                    </button>
                  )}
                </div>

                {formData.personalVerificationMethod === 'aadhaar' ? (
                  <div className="space-y-5 p-6 bg-slate-50 rounded-3xl animate-in fade-in duration-300">
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        label="Aadhaar Number / Virtual ID"
                        placeholder="12 digit number"
                        maxLength={12}
                        value={formData.aadhaarNumber}
                        onChange={(e) => setFormData({...formData, aadhaarNumber: e.target.value.replace(/\D/g, '')})}
                        disabled={isAadhaarVerified || aadhaarOtpSent}
                      />
                      <Input
                        label="Mobile Number (Aadhaar Linked)"
                        placeholder="10 digit mobile"
                        maxLength={10}
                        value={formData.mobile}
                        onChange={(e) => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '')})}
                        disabled={isAadhaarVerified || aadhaarOtpSent}
                      />
                    </div>
                    
                    {!aadhaarOtpSent && !isAadhaarVerified && (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                           <input type="checkbox" className="w-5 h-5 rounded accent-indigo-600" />
                           <p className="text-[10px] font-bold text-slate-500 italic uppercase">I hereby give my consent for Aadhaar verification via DigiLocker/UIDAI.</p>
                        </div>
                        <Button 
                          onClick={handleSendAadhaarOtp}
                          className="w-full h-12 rounded-2xl bg-indigo-600 text-white font-black uppercase italic tracking-widest text-[10px]"
                        >
                            Verify Aadhaar (Get OTP)
                        </Button>
                      </div>
                    )}

                    {aadhaarOtpSent && !isAadhaarVerified && (
                      <div className="p-6 bg-white rounded-2xl border border-indigo-100 space-y-4 shadow-sm">
                         <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black text-indigo-600 uppercase italic">Enter OTP sent to your Aadhaar-linked mobile</h4>
                            <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black animate-pulse">
                               SIMULATION OTP: {simulatedAadhaarOtp}
                            </div>
                         </div>
                         <div className="flex gap-2">
                           <input 
                             placeholder="6 Digit OTP"
                             maxLength={6}
                             value={aadhaarOtp}
                             onChange={(e) => setAadhaarOtp(e.target.value.replace(/\D/g, ''))}
                             className="flex-1 h-12 px-4 rounded-xl border border-slate-200 text-center font-black tracking-widest"
                           />
                           <Button 
                             onClick={() => setAadhaarOtp(simulatedAadhaarOtp)}
                             className="h-12 px-4 rounded-xl border border-indigo-200 text-indigo-600 font-bold uppercase text-[10px] italic"
                           >
                             Auto-fill
                           </Button>
                         </div>
                         <Button 
                           onClick={handleVerifyAadhaarOtp}
                           className="w-full h-12 rounded-xl bg-slate-900 text-white font-black uppercase italic text-[10px]"
                         >
                           Validate Aadhaar
                         </Button>
                      </div>
                    )}

                    {isAadhaarVerified && (
                      <div className="p-6 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-4 text-green-700">
                         <CheckCircle2 className="h-8 w-8" />
                         <div>
                            <p className="font-black uppercase italic text-xs">Aadhaar Verified</p>
                            <p className="text-[10px] font-medium opacity-80">Identity successfully validated through UIDAI simulation.</p>
                         </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-5 p-6 bg-slate-50 rounded-3xl">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="PAN Number"
                        placeholder="ABCDE1234F"
                        value={formData.panNumber}
                        onChange={(e) => setFormData({...formData, panNumber: e.target.value.toUpperCase()})}
                      />
                      <Input
                        label="Name as per PAN"
                        placeholder="John Doe"
                        value={formData.personalName}
                        onChange={(e) => setFormData({...formData, personalName: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <Input
                         label="Date of Birth"
                         type="date"
                         value={formData.dob}
                         onChange={(e) => setFormData({...formData, dob: e.target.value})}
                       />
                       <Input
                         label="Role in Organization"
                         placeholder="Director / Proprietor"
                         value={formData.roleInOrg}
                         onChange={(e) => setFormData({...formData, roleInOrg: e.target.value})}
                       />
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentSubStep === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest italic ml-1">Official Email ID</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        placeholder="name@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        disabled={isEmailVerified || otpSent}
                        className="w-full h-14 pl-10 pr-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 italic font-bold"
                      />
                    </div>
                    {!isEmailVerified && !otpSent && (
                      <Button onClick={handleSendOtp} disabled={isSendingOtp} className="h-14 px-8 rounded-2xl bg-indigo-600 font-black uppercase italic text-[10px]">
                        {isSendingOtp ? 'Sending...' : 'Send OTP'}
                      </Button>
                    )}
                    {isEmailVerified && (
                      <div className="h-14 flex items-center gap-2 px-6 bg-green-50 text-green-600 rounded-2xl border border-green-100 font-black italic uppercase text-[10px]">
                        <ShieldCheck className="h-5 w-5" />
                        Verified
                      </div>
                    )}
                  </div>
                </div>

                {otpSent && !isEmailVerified && (
                  <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center gap-6">
                    <h4 className="text-sm font-black uppercase italic tracking-widest text-indigo-600">Enter Verification Code</h4>
                    <div className="flex gap-4">
                        <input
                          type="text"
                          maxLength={6}
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                          className="w-48 h-14 text-center text-2xl font-black tracking-[0.5em] rounded-2xl border-2 border-indigo-100 focus:border-indigo-500"
                        />
                        <Button onClick={handleVerifyOtp} className="h-14 px-8 rounded-2xl bg-slate-900 text-white font-black uppercase italic text-[10px]">
                           Verify
                        </Button>
                    </div>
                    <button onClick={handleSendOtp} className="text-xs font-bold text-slate-400 hover:text-indigo-600 italic underline">Didn't receive? Resend Code</button>
                  </div>
                )}
              </div>
            )}

            {currentSubStep === 4 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <Input
                  label="User ID"
                  value={formData.email}
                  disabled
                  className="bg-slate-50 font-bold italic h-14 rounded-2xl"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="h-14 rounded-2xl border-slate-200"
                  />
                  <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className="h-14 rounded-2xl border-slate-200"
                  />
                </div>

                <div className="p-6 bg-slate-50 rounded-3xl">
                   <h4 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest italic">Password Security Checklist</h4>
                   <div className="grid grid-cols-2 gap-3">
                      <ValidationItem label="8-16 Characters" valid={formData.password.length >= 8 && formData.password.length <= 16} />
                      <ValidationItem label="Uppercase Letter" valid={/[A-Z]/.test(formData.password)} />
                      <ValidationItem label="Lowercase Letter" valid={/[a-z]/.test(formData.password)} />
                      <ValidationItem label="Numeric Value" valid={/[0-9]/.test(formData.password)} />
                      <ValidationItem label="Special Character" valid={/[^A-Za-z0-9]/.test(formData.password)} />
                      <ValidationItem label="Passwords Match" valid={formData.password !== '' && formData.password === formData.confirmPassword} />
                   </div>
                </div>
              </div>
            )}

            <div className="mt-12 flex items-center justify-between pt-8 border-t border-slate-50">
              <Button 
                variant="ghost" 
                onClick={handleBack}
                disabled={isLoading}
                className="h-12 rounded-xl text-slate-400 hover:text-slate-900 font-bold uppercase italic tracking-widest text-[10px]"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              
              {currentSubStep < 4 ? (
                <Button 
                  onClick={handleNext}
                  className="h-14 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase italic tracking-widest shadow-xl shadow-indigo-100 group transition-all"
                >
                  Save & Continue
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={isLoading || !isPasswordStrong(formData.password) || formData.password !== formData.confirmPassword}
                  className="h-14 px-10 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase italic tracking-widest shadow-xl shadow-slate-200 transition-all flex items-center gap-2"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ValidationItem({ label, valid }: { label: string, valid: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${valid ? 'bg-green-500' : 'bg-slate-200'}`}>
         {valid && <CheckCircle2 className="h-3 w-3 text-white" />}
      </div>
      <span className={`text-[10px] font-bold italic uppercase ${valid ? 'text-green-600' : 'text-slate-400'}`}>{label}</span>
    </div>
  );
}
