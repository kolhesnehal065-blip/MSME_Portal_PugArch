import React, { useState } from 'react';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input, Select } from '../ui/input';
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
  Info,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { indiaStates, indiaStatesDistricts } from '../../data/indiaStatesDistricts';

interface RegistrationDetailsFlowProps {
  businessType: string;
  onBack: () => void;
  role: 'buyer' | 'seller';
}

const cooperativeOrganisationTypes = [
  'Multi-State Co-operative Societies (MSCS)',
  'Single-State Co-operative Societies (SSCS)'
];

const districtOrganisationOverrides: Record<string, string[]> = {
  'MAHARASHTRA:Mumbai': [
    'GS Mahanagar Co-operative Bank Ltd.',
    'Janakalyan Sahakari Bank Ltd.',
    'Maharashtra Rajya Machhimar Sahakari Sangh Ltd.',
    'Maharashtra Rajya Sahakari Dudh Mahasangh Maryadit'
  ],
  'MAHARASHTRA:Mumbai City': [
    'GS Mahanagar Co-operative Bank Ltd.',
    'Janakalyan Sahakari Bank Ltd.',
    'Maharashtra Rajya Machhimar Sahakari Sangh Ltd.',
    'Maharashtra Rajya Sahakari Dudh Mahasangh Maryadit'
  ],
  'MAHARASHTRA:Mumbai Suburban': [
    'GS Mahanagar Co-operative Bank Ltd.',
    'Janakalyan Sahakari Bank Ltd.',
    'Maharashtra Rajya Machhimar Sahakari Sangh Ltd.',
    'Maharashtra Rajya Sahakari Dudh Mahasangh Maryadit'
  ],
  'MAHARASHTRA:Pune': [
    'Maharashtra Rajya Sahakari Dudh Mahasangh Maryadit'
  ],
  'MAHARASHTRA:Latur': [
    'Maharashtra Rajya Sahakari Dudh Mahasangh Maryadit'
  ],
  'MAHARASHTRA:Nagpur': [
    'Maharashtra Rajya Sahakari Dudh Mahasangh Maryadit'
  ]
};

const getDistrictOrganisations = (state: string, district: string) => {
  if (!state || !district) return [];
  
  const overrides = districtOrganisationOverrides[`${state}:${district}`];
  if (overrides && overrides.length > 0) return overrides;

  // Fallback realistic dummy data for each district if no override exists
  return [
    `${district} District Central Co-operative Bank Ltd.`,
    `${district} Zilla Parishad Office`,
    `${district} Municipal Corporation / Nagar Palika`,
    `${state} State Electricity Distribution Co. Ltd - ${district} Division`,
    `${district} Sahakari Dudh Utpadak Sangh (Dairy)`,
    `Department of Agriculture - ${district} Unit`,
    `District Rural Development Agency (DRDA) - ${district}`,
    `Integrated Child Development Services (ICDS) - ${district} Project`
  ];
};

export default function RegistrationDetailsFlow({ businessType, onBack, role }: RegistrationDetailsFlowProps) {
  const [currentSubStep, setCurrentSubStep] = useState(1);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingGst, setIsFetchingGst] = useState(false);

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
    verifyEmail: '',
    userId: '',
    password: '',
    confirmPassword: '',
    organisationType: '',
    state: '',
    district: '',
    organisation: '',
    officeZoneName: ''
  });

  const fetchGstDetails = async () => {
    if (!formData.gstin || formData.gstin.length !== 15) {
      toast.error('Please enter a valid 15-digit GSTIN');
      return;
    }

    setIsFetchingGst(true);
    try {
      const res = await api.fetch(`/api/utils/gst-verify/${formData.gstin}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setFormData((prev: any) => ({
          ...prev,
          businessName: data.legalName || prev.businessName,
          orgPan: data.pan || prev.orgPan,
          state: data.state || prev.state,
          district: data.city || prev.district,
        }));
        toast.success('Organization details fetched from GSTIN');
      } else {
        toast.error('Could not fetch GST details');
      }
    } catch (err) {
      toast.error('Verification service unavailable');
    } finally {
      setIsFetchingGst(false);
    }
  };

  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [isAadhaarVerified, setIsAadhaarVerified] = useState(false);
  const [aadhaarOtpSent, setAadhaarOtpSent] = useState(false);
  const [simulatedAadhaarOtp, setSimulatedAadhaarOtp] = useState('');
  const [aadhaarConsent, setAadhaarConsent] = useState(false);

  const [emailOtp, setEmailOtp] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const steps = [
    { id: 1, title: 'Organisation Details', icon: Building2 },
    { id: 2, title: 'Personal Verification', icon: UserCheck },
    { id: 3, title: 'Email Verification', icon: Mail },
    { id: 4, title: 'User Credentials', icon: Lock }
  ];

  const isPrimaryBuyer = role === 'buyer' && businessType.startsWith('Primary User');
  const isPrimaryBuyerOrganisationComplete = Boolean(
    formData.organisationType &&
    formData.state &&
    formData.district &&
    formData.organisation &&
    formData.officeZoneName
  );
  const districtOptions = formData.state ? indiaStatesDistricts[formData.state] || [] : [];
  const organisationOptions = getDistrictOrganisations(formData.state, formData.district);
  const missingPrimaryBuyerFields = [
    !formData.organisationType && 'Organisation Type',
    !formData.state && 'State',
    !formData.district && 'District',
    !formData.organisation && 'Organisation',
    !formData.officeZoneName && 'Office/Zone Name'
  ].filter(Boolean);

  const handleSendAadhaarOtp = () => {
    if (formData.aadhaarNumber.length !== 12) return toast.error('Enter valid Aadhaar');
    if (formData.mobile.length !== 10) return toast.error('Enter linked mobile number');
    if (role === 'buyer' && !aadhaarConsent) return toast.error('Please provide Aadhaar consent');
    
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
      if (isPrimaryBuyer && !isPrimaryBuyerOrganisationComplete) {
        toast.error('Please complete Organisation Details');
        return;
      }
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
    if (role === 'buyer' && formData.email !== formData.verifyEmail) return toast.error('Email IDs do not match');
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
    if (role === 'buyer' && !formData.userId) {
      return toast.error('Please enter user id');
    }
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    
    setIsLoading(true);
    try {
      const accountName = formData.personalName.trim() || formData.userId.trim() || formData.businessName.trim();
      const res = await api.post('/api/auth/register', {
        name: accountName,
        email: formData.email || formData.userId,
        password: formData.password,
        role,
        mobile: formData.mobile,
        dob: formData.dob,
        registrationDetails: {
          businessType,
          businessName: formData.businessName,
          userId: formData.userId,
          verificationMethod: formData.personalVerificationMethod,
          isEmailVerified: true,
          state: formData.state,
          district: formData.district,
          officeZoneName: formData.officeZoneName,
          aadhaarNumber: formData.aadhaarNumber,
          isAadhaarVerified: isAadhaarVerified,
          pan: formData.panNumber,
          roleInOrg: formData.roleInOrg,
          accountName
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
  const isBuyerAadhaarReady = formData.aadhaarNumber.length === 12 && formData.mobile.length === 10 && aadhaarConsent;
  const isBuyerEmailReady = Boolean(formData.email && formData.verifyEmail && formData.email === formData.verifyEmail);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-0 sm:px-1 lg:flex-row lg:gap-8 lg:p-0">
      {/* Sidebar Navigation - Transitioned to horizontal on mobile */}
      <div className="no-scrollbar flex-shrink-0 overflow-x-auto lg:w-64">
        <div className="flex lg:flex-col gap-2 pb-4 lg:pb-0 min-w-max lg:min-w-0 sticky top-4 lg:top-8">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = currentSubStep === step.id;
            const isCompleted = currentSubStep > step.id;
            
            return (
              <div 
                key={step.id}
                className={`flex items-center gap-2 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl transition-all cursor-pointer ${
                  isActive ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 
                  isCompleted ? 'bg-green-50 text-green-700' : 'bg-white text-slate-400'
                }`}
                onClick={() => isCompleted && setCurrentSubStep(step.id)}
              >
                <div className={`p-1.5 md:p-2 rounded-lg md:rounded-xl ${
                  isActive ? 'bg-white/20' : 
                  isCompleted ? 'bg-green-100' : 'bg-slate-50'
                }`}>
                  {isCompleted ? <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" /> : <Icon className="h-4 w-4 md:h-5 md:w-5" />}
                </div>
                <span className="text-[10px] md:text-xs font-black uppercase tracking-tight italic whitespace-nowrap">{step.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        <Card className="overflow-hidden rounded-2xl border-none bg-white shadow-xl shadow-slate-200/70 md:rounded-3xl md:shadow-2xl">
          <CardHeader className="border-b border-white bg-slate-50 p-4 sm:p-6 md:p-8">
            <CardTitle className="text-lg md:text-xl font-black uppercase tracking-tight text-slate-900 italic">
              Step {currentSubStep}: {steps.find(s => s.id === currentSubStep)?.title}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-4 sm:p-6 md:p-10">
            {currentSubStep === 1 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                {isPrimaryBuyer ? (
                  <div className="space-y-6">
                    <h2 className="text-xl md:text-2xl font-black text-slate-800">Organisation Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Select
                        label="Organisation Type *"
                        value={formData.organisationType}
                        onChange={(e) => setFormData({
                          ...formData,
                          organisationType: e.target.value
                        })}
                        error={!formData.organisationType ? 'Please select Organisation Type.' : undefined}
                        className="h-14 rounded-lg border-slate-200 bg-white"
                      >
                        <option value="">Select Organisation type</option>
                        {cooperativeOrganisationTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </Select>

                      <Select
                        label="State *"
                        value={formData.state}
                        onChange={(e) => setFormData({
                          ...formData,
                          state: e.target.value,
                          district: '',
                          organisation: ''
                        })}
                        error={!formData.state ? 'Please select State.' : undefined}
                        className="h-14 rounded-lg border-slate-200 bg-white"
                      >
                        <option value="">Select State</option>
                        {indiaStates.map((state) => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </Select>

                      <Select
                        label="District *"
                        value={formData.district}
                        onChange={(e) => setFormData({
                          ...formData,
                          district: e.target.value,
                          organisation: ''
                        })}
                        disabled={!formData.state}
                        error={formData.state && !formData.district ? 'Please select District.' : undefined}
                        className="h-14 rounded-lg border-slate-200 bg-white"
                      >
                        <option value="">Select District</option>
                        {districtOptions.map((district) => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </Select>

                      <Select
                        label="Organisation *"
                        value={formData.organisation}
                        onChange={(e) => setFormData({
                          ...formData,
                          organisation: e.target.value,
                          businessName: e.target.value
                        })}
                        disabled={!formData.district}
                        className="h-14 rounded-lg border-slate-200 bg-white"
                      >
                        <option value="">Select Organisation</option>
                        {organisationOptions.map((organisation) => (
                          <option key={organisation} value={organisation}>{organisation}</option>
                        ))}
                      </Select>

                      <div>
                        <Input
                          label="Office/Zone Name *"
                          placeholder="Enter location"
                          value={formData.officeZoneName}
                          onChange={(e) => setFormData({...formData, officeZoneName: e.target.value})}
                          className="h-14 rounded-lg border-slate-200 bg-white"
                        />
                        <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                          Office / Zone is the location or a unit of your organisation requiring separate GeM account.
                        </p>
                      </div>
                    </div>
                    {missingPrimaryBuyerFields.length > 0 && (
                      <p className="text-[10px] text-amber-600">
                        Please complete: {missingPrimaryBuyerFields.join(', ')}.
                      </p>
                    )}
                  </div>
                ) : role === 'buyer' ? (
                  <>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <Input
                            label="GSTIN (Optional)"
                            placeholder="Enter GSTIN"
                            value={formData.gstin}
                            onChange={(e) => setFormData({...formData, gstin: e.target.value.toUpperCase()})}
                            className="h-14 rounded-2xl border-slate-200"
                          />
                        </div>
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={fetchGstDetails}
                          disabled={isFetchingGst || !formData.gstin}
                          className="h-14 px-4 rounded-xl border-indigo-200 text-indigo-600 font-bold uppercase text-[10px] italic hover:bg-indigo-50"
                        >
                          {isFetchingGst ? 'Fetching...' : 'Fetch'}
                        </Button>
                      </div>
                    </div>
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
                {role === 'buyer' ? (
                  <div className="space-y-7">
                    <h2 className="text-xl md:text-2xl font-black text-slate-800">Personal Verification</h2>
                    <div className="rounded-md bg-sky-100 px-5 py-4 text-sm font-medium text-slate-700">
                      We respect your Privacy, We do not share your personal details with anyone.
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          Aadhaar Number / Virtual ID* <Info className="inline h-3.5 w-3.5 text-slate-500" />
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            placeholder="Enter Aadhaar number / Virtual ID"
                            maxLength={12}
                            value={formData.aadhaarNumber}
                            onChange={(e) => setFormData({...formData, aadhaarNumber: e.target.value.replace(/\D/g, '')})}
                            disabled={isAadhaarVerified || aadhaarOtpSent}
                            className="h-14 w-full rounded-lg border border-slate-200 bg-white px-4 pr-11 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                          />
                          <EyeOff className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                        </div>
                      </div>

                      <Input
                        label="Mobile number linked with Aadhaar*"
                        placeholder="Enter mobile number linked with Aadhaar"
                        maxLength={10}
                        value={formData.mobile}
                        onChange={(e) => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '')})}
                        disabled={isAadhaarVerified || aadhaarOtpSent}
                        className="h-14 rounded-lg border-slate-200 bg-white"
                      />
                    </div>

                    {!aadhaarOtpSent && !isAadhaarVerified && (
                      <>
                        <div className="space-y-5">
                          <label className="flex items-start gap-3 text-sm leading-relaxed text-slate-700">
                            <input
                              type="checkbox"
                              checked={aadhaarConsent}
                              onChange={(e) => setAadhaarConsent(e.target.checked)}
                              className="mt-1 h-5 w-5 rounded border-slate-300 accent-indigo-600"
                            />
                            <span>
                              I, the holder of the above Aadhaar, hereby give my consent to GeM ( Government e Marketplace), for using my Aadhaar number as allotted by UIDAI for GeM Registration. GeM ( Government e Marketplace),have informed me that my aadhaar data will not be stored/shared.
                            </span>
                          </label>

                          <p className="pl-8 text-sm leading-relaxed text-slate-700">
                            मैं, उपर्युक्त आधार का धारक, भारतीय विशिष्ट पहचान प्राधिकरण द्वारा आवंटित अपने आधार नंबर को जेम पंजीकरण हेतु प्रयोग में लाने हेतु जेम (गवर्नमेंट ई-मार्केटप्लेस) को एतदद्वारा अपनी सहमति प्रदान करता हूं। जेम (गवर्नमेंट ई-मार्केटप्लेस) ने मुझे अवगत कराया है कि मेरे आधार डेटा को संग्रहीत/साझा नहीं किया जाएगा।
                          </p>

                          <div className="space-y-3">
                            <p className="text-sm text-slate-700">Click on the play button to listen consent/ सहमति सुनने के लिए प्ले बटन पर क्लिक करें।</p>
                            <audio controls className="w-full max-w-sm" />
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            onClick={handleSendAadhaarOtp}
                            disabled={!isBuyerAadhaarReady}
                            className={cn(
                              "h-14 w-full sm:w-64 rounded-lg font-black uppercase tracking-wide",
                              isBuyerAadhaarReady ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"
                            )}
                          >
                            Verify Aadhaar
                          </Button>
                        </div>
                      </>
                    )}

                    {aadhaarOtpSent && !isAadhaarVerified && (
                      <div className="space-y-4 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm sm:p-6">
                         <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black text-indigo-600 uppercase italic">Enter OTP sent to your Aadhaar-linked mobile</h4>
                            <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black animate-pulse">
                               SIMULATION OTP: {simulatedAadhaarOtp}
                            </div>
                         </div>
                         <div className="flex flex-col sm:flex-row gap-2">
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
                             Auto-fill Simulation
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
                      <div className="space-y-6">
                        <div className="max-w-md">
                          <Input
                            label="Mobile number linked with Aadhaar*"
                            value={formData.mobile}
                            disabled
                            className="h-14 rounded-lg border-slate-200 bg-slate-100 text-slate-700"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <Input
                            label="First Name*"
                            value={formData.personalName}
                            onChange={(e) => setFormData({...formData, personalName: e.target.value})}
                            disabled
                            className="h-14 rounded-lg border-slate-200 bg-slate-100 text-slate-700"
                          />
                          <Input
                            label="Last Name"
                            value={formData.roleInOrg}
                            onChange={(e) => setFormData({...formData, roleInOrg: e.target.value})}
                            disabled
                            className="h-14 rounded-lg border-slate-200 bg-slate-100 text-slate-700"
                          />
                        </div>

                        <div className="flex items-center gap-3 text-slate-800">
                          <CheckCircle2 className="h-5 w-5 rounded-full fill-green-600 text-green-600" />
                          <p className="text-sm font-bold">Aadhaar Details Verified Successfully.</p>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            onClick={handleNext}
                            className="h-14 w-full sm:w-40 rounded-lg bg-blue-600 text-white font-black uppercase tracking-wide hover:bg-blue-700"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                      <button 
                        onClick={() => setFormData({...formData, personalVerificationMethod: 'aadhaar'})}
                        className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 transition-all flex flex-col items-center gap-4 ${
                          formData.personalVerificationMethod === 'aadhaar' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 bg-slate-50'
                        }`}
                      >
                        <Fingerprint className={`h-8 w-8 md:h-10 md:w-10 ${formData.personalVerificationMethod === 'aadhaar' ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span className="font-black uppercase italic text-[10px] tracking-widest">Aadhaar Verification</span>
                      </button>
                    <button 
                      onClick={() => setFormData({...formData, personalVerificationMethod: 'pan'})}
                      className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 transition-all flex flex-col items-center gap-4 ${
                        formData.personalVerificationMethod === 'pan' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 bg-slate-50'
                      }`}
                    >
                      <FileText className={`h-8 w-8 md:h-10 md:w-10 ${formData.personalVerificationMethod === 'pan' ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span className="font-black uppercase italic text-[10px] tracking-widest">PAN Verification</span>
                    </button>
                    </div>

                {formData.personalVerificationMethod === 'aadhaar' ? (
                  <div className="animate-in space-y-5 rounded-2xl bg-slate-50 p-4 fade-in duration-300 sm:p-6 md:rounded-3xl">
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
                      <div className="space-y-4 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm sm:p-6">
                         <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black text-indigo-600 uppercase italic">Enter OTP sent to your Aadhaar-linked mobile</h4>
                            <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black animate-pulse">
                               SIMULATION OTP: {simulatedAadhaarOtp}
                            </div>
                         </div>
                         <div className="flex flex-col sm:flex-row gap-2">
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
                             Auto-fill Simulation
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
                  <div className="space-y-5 rounded-2xl bg-slate-50 p-4 sm:p-6 md:rounded-3xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </>
                )}
              </div>
            )}

            {currentSubStep === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                {role === 'buyer' ? (
                  <>
                    <h2 className="text-xl md:text-2xl font-black text-slate-800">Email Verification</h2>
                    <div className="rounded-md bg-sky-100 px-5 py-4 text-sm font-medium text-slate-700">
                      To view list of whitelisted domains (accepted at GeM),{' '}
                      <button type="button" className="font-bold text-blue-600 hover:underline">Click here</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Input
                        label="Official Email Id *"
                        type="email"
                        placeholder="Enter Official email id"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        disabled={isEmailVerified || otpSent}
                        className="h-14 rounded-lg border-slate-200 bg-white"
                      />
                      <Input
                        label="Verify Email Id*"
                        type="email"
                        placeholder="Verify Official email id"
                        value={formData.verifyEmail}
                        onChange={(e) => setFormData({...formData, verifyEmail: e.target.value})}
                        disabled={isEmailVerified || otpSent}
                        error={formData.verifyEmail && formData.email !== formData.verifyEmail ? 'Email does not match.' : undefined}
                        className="h-14 rounded-lg border-slate-200 bg-white"
                      />
                    </div>

                    {!otpSent && !isEmailVerified && (
                      <div className="flex justify-end">
                        <Button
                          onClick={handleSendOtp}
                          disabled={isSendingOtp || !isBuyerEmailReady}
                          className={cn(
                            "h-14 w-full sm:w-48 rounded-lg font-black uppercase tracking-wide",
                            isBuyerEmailReady ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"
                          )}
                        >
                          {isSendingOtp ? 'Sending...' : 'Send OTP'}
                        </Button>
                      </div>
                    )}

                    {isEmailVerified && (
                      <div className="h-14 flex items-center justify-center gap-2 px-6 bg-green-50 text-green-600 rounded-lg border border-green-100 font-black uppercase text-[10px]">
                        <ShieldCheck className="h-5 w-5" />
                        Verified
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest italic ml-1">Official Email ID</label>
                    <div className="flex flex-col sm:flex-row gap-2">
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
                        <Button onClick={handleSendOtp} disabled={isSendingOtp} className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-indigo-600 font-black uppercase italic text-[10px]">
                          {isSendingOtp ? 'Sending...' : 'Send OTP'}
                        </Button>
                      )}
                      {isEmailVerified && (
                        <div className="h-14 flex items-center justify-center gap-2 px-6 bg-green-50 text-green-600 rounded-2xl border border-green-100 font-black italic uppercase text-[10px]">
                          <ShieldCheck className="h-5 w-5" />
                          Verified
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {otpSent && !isEmailVerified && (
                  <div className="flex flex-col items-center gap-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:gap-6 sm:p-8 md:rounded-3xl">
                    <h4 className="text-sm font-black uppercase italic tracking-widest text-indigo-600">Enter Verification Code</h4>
                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                        <input
                          type="text"
                          maxLength={6}
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                          className="h-14 w-full rounded-2xl border-2 border-indigo-100 text-center text-xl font-black tracking-[0.25em] focus:border-indigo-500 sm:w-48 sm:text-2xl sm:tracking-[0.5em]"
                        />
                        <Button onClick={handleVerifyOtp} className="w-full sm:flex-1 h-14 px-8 rounded-2xl bg-slate-900 text-white font-black uppercase italic text-[10px]">
                           Verify Code
                        </Button>
                    </div>
                    <button onClick={handleSendOtp} className="text-xs font-bold text-slate-400 hover:text-indigo-600 italic underline">Didn't receive? Resend Code</button>
                  </div>
                )}
              </div>
            )}

            {currentSubStep === 4 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                {role === 'buyer' ? (
                  <>
                    <h2 className="text-xl md:text-2xl font-black text-slate-800">User Credentials</h2>
                    <div className="max-w-md">
                      <Input
                        label="User Id *"
                        placeholder="Enter User id"
                        value={formData.userId}
                        onChange={(e) => setFormData({...formData, userId: e.target.value})}
                        error={!formData.userId ? 'Please enter user id.' : undefined}
                        className="h-14 rounded-lg border-slate-200 bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Input
                        label="Password *"
                        type="password"
                        placeholder="Enter Password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="h-14 rounded-lg border-slate-200 bg-white"
                      />
                      <Input
                        label="Confirm Password*"
                        type="password"
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        className="h-14 rounded-lg border-slate-200 bg-white"
                      />
                    </div>

                    <div className="space-y-3 text-sm text-slate-400">
                      <p>Password must contain minimum of</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-3 max-w-xl">
                        <CredentialRule label="One Upper Case" valid={/[A-Z]/.test(formData.password)} />
                        <CredentialRule label="One Lower Case" valid={/[a-z]/.test(formData.password)} />
                        <CredentialRule label="One Numeric" valid={/[0-9]/.test(formData.password)} />
                        <CredentialRule label="One Special Character" valid={/[^A-Za-z0-9]/.test(formData.password)} />
                        <CredentialRule label="8 characters and maximum of 16 characters" valid={formData.password.length >= 8 && formData.password.length <= 16} />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleSubmit}
                        disabled={isLoading || !formData.userId || !isPasswordStrong(formData.password) || formData.password !== formData.confirmPassword}
                        className={cn(
                          "h-14 w-full sm:w-64 rounded-lg font-black uppercase tracking-wide",
                          !isLoading && formData.userId && isPasswordStrong(formData.password) && formData.password === formData.confirmPassword
                            ? "bg-slate-900 text-white"
                            : "bg-slate-200 text-slate-500"
                        )}
                      >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Input
                      label="User ID"
                      value={formData.email}
                      disabled
                      className="bg-slate-50 font-bold italic h-14 rounded-2xl"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    <div className="rounded-2xl bg-slate-50 p-4 sm:p-6 md:rounded-3xl">
                       <h4 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest italic">Password Security Checklist</h4>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <ValidationItem label="8-16 Characters" valid={formData.password.length >= 8 && formData.password.length <= 16} />
                          <ValidationItem label="Uppercase Letter" valid={/[A-Z]/.test(formData.password)} />
                          <ValidationItem label="Lowercase Letter" valid={/[a-z]/.test(formData.password)} />
                          <ValidationItem label="Numeric Value" valid={/[0-9]/.test(formData.password)} />
                          <ValidationItem label="Special Character" valid={/[^A-Za-z0-9]/.test(formData.password)} />
                          <ValidationItem label="Passwords Match" valid={formData.password !== '' && formData.password === formData.confirmPassword} />
                       </div>
                    </div>
                  </>
                )}
              </div>
        )}

        <div className="mt-8 flex flex-col items-stretch justify-between gap-3 border-t border-slate-50 pt-6 sm:flex-row sm:items-center sm:gap-4 md:mt-12 md:pt-8">
            <Button 
              variant="ghost" 
              onClick={handleBack}
              disabled={isLoading}
              className="w-full sm:w-auto h-12 rounded-xl text-slate-400 hover:text-slate-900 font-bold uppercase italic tracking-widest text-[10px]"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            
            {currentSubStep === 2 && role === 'buyer' && isAadhaarVerified ? null : currentSubStep === 4 && role === 'buyer' ? null : currentSubStep < 4 ? (
              <Button 
                onClick={handleNext}
                disabled={currentSubStep === 1 && isPrimaryBuyer && !isPrimaryBuyerOrganisationComplete}
                className={cn(
                  "w-full sm:w-auto h-14 px-10 rounded-2xl font-black uppercase italic tracking-widest group transition-all",
                  currentSubStep === 1 && isPrimaryBuyer && !isPrimaryBuyerOrganisationComplete
                    ? "bg-slate-200 text-slate-500 shadow-none"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-100"
                )}
              >
                {currentSubStep === 1 && isPrimaryBuyer && !isPrimaryBuyerOrganisationComplete ? 'Complete Details' : currentSubStep === 1 && isPrimaryBuyer ? 'Next' : 'Save & Continue'}
                <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={isLoading || !isPasswordStrong(formData.password) || formData.password !== formData.confirmPassword}
                className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase italic tracking-widest shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2"
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

function CredentialRule({ label, valid }: { label: string, valid: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn("h-3.5 w-3.5 rounded-full", valid ? "bg-green-500" : "bg-slate-300")} />
      <span className={cn("text-sm", valid ? "text-green-700" : "text-slate-400")}>{label}</span>
    </div>
  );
}
