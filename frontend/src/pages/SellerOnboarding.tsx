import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Card, CardContent, Badge } from '../components/ui/Card';
import { Stepper, Step } from '../components/ui/Stepper';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Save, Upload, CheckCircle2, AlertTriangle, Clock, ShieldCheck, Loader2, ChevronDown, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { validateField, FieldType } from '../lib/validation';

const STEPS: Step[] = [
  { id: 1, label: 'Business Profile' },
  { id: 2, label: 'Contact Details' },
  { id: 3, label: 'Tax & Compliance' },
  { id: 4, label: 'Product/Service' },
  { id: 5, label: 'Documents Upload' },
  { id: 6, label: 'Final Declaration' },
  { id: 7, label: 'Submit Approval' },
];

const SECTION_TO_STEP: Record<string, number> = {
  basic: 1,
  business: 2,
  compliance: 3,
  bank: 3,
  documents: 5,
};

const SECTION_LABELS: Record<string, string> = {
  basic: 'Basic Information',
  business: 'Business Details',
  compliance: 'Compliance',
  bank: 'Bank Details',
  documents: 'Documents',
};

export default function SellerOnboarding() {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<any>({
    // Step 1: Business Profile
    applicantName: '',
    businessName: '',
    businessType: 'Proprietorship',
    businessPanName: '',
    pan: '',
    aadhaarNumber: '',
    legalEntityType: '',
    dateOfIncorporation: '',
    turnover: '',
    
    // Step 2: Contact Information
    email: '',
    mobile: '',
    country: 'India',
    state: '',
    city: '',
    pincode: '',
    fullAddress: '',
    
    // Step 3: Tax & Compliance
    gst: '',
    udyam: '',
    msmeCategory: 'Micro',
    authorizedPersonPan: '',
    bankAccount: '',
    ifsc: '',
    branchName: '',
    
    // Step 4: Product / Service Details
    productCategories: [],
    otherCategoryDetails: '',
    productList: '',
    detailedProductName: '',
    hsnCode: '',
    brand: '',
    specifications: '',
    
    // Step 5: Credentials (handled via User registration mostly, but fields here for UI)
    username: '',
    password: '',
    confirmPassword: '',
    declaration: false,
    documents: {
      panCard: '',
      gstCert: '',
      aadhaar: '',
      addressProof: '',
      udyamCert: '',
      bankPassbook: '',
      regProof: '',
      statutoryCert: ''
    }
  });
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    if (section && SECTION_TO_STEP[section]) {
      setCurrentStep(SECTION_TO_STEP[section]);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        await refreshUser();
        const res = await api.fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        setFormData((prev: any) => ({
          ...prev,
          ...(data.profile || {}),
          email: data.user?.email || prev.email,
          username: data.user?.email || prev.username,
          dateOfIncorporation: data.profile?.dateOfIncorporation ? new Date(data.profile.dateOfIncorporation).toISOString().split('T')[0] : (prev.dateOfIncorporation || '')
        }));
      } catch (err) {
        console.error(err);
      } finally {
        setIsFetching(false);
      }
    };
    fetchProfile();
  }, []);

  const validate = (name: string, value: string) => {
    let fieldType: FieldType | null = null;
    if (name === 'aadhaarNumber') fieldType = 'aadhaar';
    if (name === 'pan' || name === 'authorizedPersonPan') fieldType = 'pan';
    if (name === 'gst') fieldType = 'gst';
    if (name === 'mobile') fieldType = 'mobile';
    if (name === 'email') fieldType = 'email';
    if (name === 'pincode') fieldType = 'pincode';
    if (name === 'applicantName') fieldType = 'name';
    if (name === 'bankAccount') fieldType = 'bankAccount';
    if (name === 'ifsc') fieldType = 'ifsc';
    if (name === 'udyam') fieldType = 'udyam';

    if (fieldType) {
      const error = validateField(fieldType, value);
      setErrors(prev => ({ ...prev, [name]: error || '' }));
      return !error;
    }
    return true;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validate(name, value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = (e.target as any);
    let newValue = value;

    // Character Blocking & Auto Formatting
    if (['aadhaarNumber', 'mobile', 'pincode', 'bankAccount'].includes(name)) {
      newValue = value.replace(/[^0-9]/g, '');
      if (name === 'aadhaarNumber') newValue = newValue.slice(0, 12);
      if (name === 'mobile') newValue = newValue.slice(0, 10);
      if (name === 'pincode') newValue = newValue.slice(0, 6);
      if (name === 'bankAccount') newValue = newValue.slice(0, 18);
    }

    if (['pan', 'authorizedPersonPan', 'gst', 'ifsc', 'udyam'].includes(name)) {
      newValue = value.toUpperCase().trim();
      if (name === 'pan' || name === 'authorizedPersonPan') newValue = newValue.slice(0, 10);
      if (name === 'gst') newValue = newValue.slice(0, 15);
      if (name === 'ifsc') newValue = newValue.slice(0, 11);
      if (name === 'udyam') newValue = newValue.slice(0, 19);
    }

    if (name === 'applicantName') {
      newValue = value.replace(/[^A-Za-z ]/g, '');
    }

    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: newValue });
      if (touched[name]) validate(name, newValue);
    }
  };

  const toggleCategory = (category: string) => {
    const categories = [...formData.productCategories];
    if (categories.includes(category)) {
      setFormData({ ...formData, productCategories: categories.filter(c => c !== category) });
    } else {
      setFormData({ ...formData, productCategories: [...categories, category] });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(fieldName);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const res = await api.fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataUpload
      });
      
      if (res.ok) {
        const data = await res.json();
        const fieldPath = fieldName.split('.');
        if (fieldPath.length > 1) {
          setFormData({
            ...formData,
            [fieldPath[0]]: {
              ...formData[fieldPath[0]],
              [fieldPath[1]]: data.url
            }
          });
        } else {
          setFormData({ ...formData, [fieldName]: data.url });
        }
        toast.success('Document uploaded successfully');
      } else {
        toast.error('Upload failed');
      }
    } catch (err) {
      toast.error('Upload error');
    } finally {
      setIsUploading(null);
    }
  };

  const validateStep = (step: number) => {
    let stepFields: string[] = [];
    if (step === 1) stepFields = ['applicantName', 'pan', 'aadhaarNumber'];
    if (step === 2) stepFields = ['email', 'mobile', 'state', 'city', 'pincode', 'fullAddress'];
    if (step === 3) stepFields = ['gst', 'udyam', 'authorizedPersonPan', 'bankAccount', 'ifsc'];
    if (step === 4) stepFields = ['detailedProductName', 'hsnCode'];
    if (step === 5) stepFields = ['password', 'confirmPassword'];

    let isStepValid = true;
    stepFields.forEach(field => {
      const isFieldValid = validate(field, formData[field] || '');
      if (!isFieldValid) isStepValid = false;
    });

    return isStepValid;
  };

  const nextStep = () => {
    if (currentStep < 7) {
      setCurrentStep(prev => prev + 1);
    }
  };
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  const goToStep = (step: number) => setCurrentStep(Math.min(Math.max(step, 1), STEPS.length));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < 7) {
      nextStep();
      return;
    }
    
    if (!formData.declaration) {
      toast.error('Please accept the final declaration');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/api/seller/register', formData, {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (res.ok) {
        // Update onboarding status to 'pending_validation'
        await api.post('/api/admin/onboarding/submit', {}, {
          headers: { 
             'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        toast.success('Onboarding documents submitted for review!');
        navigate('/dashboard');
      } else {
        const data = await res.json();
        toast.error(data.message || 'Submission failed');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) return <div className="flex h-screen items-center justify-center font-bold text-indigo-600 italic">Loading profile...</div>;

  const categories = ['Electronics', 'Office Supplies', 'Industrial Tools', 'Furniture', 'Software', 'Logistics', 'Textiles', 'Chemicals', 'Others'];
  const sectionMessages = Object.entries(user?.sectionRejectionReasons || {}).filter(([section, reason]) => {
    const status = user?.sectionStatus?.[section as keyof typeof user.sectionStatus];
    return reason && ['rejected', 'resubmission_required'].includes(status || '');
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">Onboarding Module</h1>
          <p className="text-slate-500 font-medium italic text-sm opacity-70">Complete your business profile for procurement eligibility</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
           <div className="text-right">
             <p className="text-[10px] font-black text-slate-400 uppercase italic">Registration Status</p>
             <p className="text-xs font-black text-green-600 uppercase italic capitalize">{user?.registrationStatus || 'completed'}</p>
           </div>
           <div className="w-px h-8 bg-slate-100" />
           <div className="text-right">
             <p className="text-[10px] font-black text-slate-400 uppercase italic">Onboarding Status</p>
             <p className="text-xs font-black text-amber-500 uppercase italic capitalize">{user?.status || 'Pending'}</p>
           </div>
        </div>
      </div>

      {user?.adminFeedback && (
        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 flex gap-4 animate-in slide-in-from-top duration-500 shadow-sm">
           <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0" />
           <div className="space-y-1">
             <p className="text-xs font-black text-amber-700 uppercase tracking-widest">Message from Administrator</p>
             <p className="text-sm font-medium text-amber-900 italic">"{user.adminFeedback}"</p>
           </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {['basic', 'business', 'compliance', 'bank', 'documents'].map((section) => {
            const status = user?.sectionStatus?.[section as keyof typeof user.sectionStatus] || 'pending';
            const linkedStep = SECTION_TO_STEP[section];
            const isActive = currentStep === linkedStep;
            const hasFeedback = !!user?.sectionRejectionReasons?.[section as keyof typeof user.sectionRejectionReasons];
            const needsCorrection = ['rejected', 'resubmission_required'].includes(status);
            return (
              <button
                 key={section}
                 type="button"
                 onClick={() => goToStep(linkedStep)}
                 className={cn(
                   "p-4 rounded-2xl bg-white border shadow-sm flex flex-col items-center gap-1 transition-all hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2",
                   isActive ? "border-indigo-300 shadow-md shadow-indigo-100" : "border-slate-100",
                   needsCorrection && "border-red-200 bg-red-50/60 shadow-red-100"
                 )}
              >
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight italic">{section}</p>
                 <Badge variant={status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'warning' as any} className="text-[9px] py-0.5 px-3 capitalize rounded-full font-black italic">
                    {status}
                 </Badge>
                 {needsCorrection && hasFeedback && (
                   <span className="text-[9px] font-black uppercase tracking-tight text-red-500">Feedback</span>
                 )}
              </button>
            );
          })}
      </div>

      {sectionMessages.length > 0 && (
        <div className="rounded-3xl border border-red-100 bg-red-50/80 p-6 space-y-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-red-500 shadow-sm">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-red-700">SECTION FEEDBACK FROM ADMINISTRATOR</p>
                <p className="text-[11px] font-bold italic text-red-900/70">Review the rejected sections, update the details below, and resubmit for approval.</p>
              </div>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {sectionMessages.map(([section, reason]) => (
              <button
                key={section}
                type="button"
                onClick={() => goToStep(SECTION_TO_STEP[section] || 1)}
                className="w-full rounded-2xl border border-red-100 bg-white p-5 text-left transition-all hover:border-red-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 focus:ring-offset-red-50"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-500">{SECTION_LABELS[section] || section}</p>
                  <Badge variant="error" className="rounded-full px-3 py-0.5 text-[8px] font-black uppercase italic">
                    {user?.sectionStatus?.[section as keyof typeof user.sectionStatus]}
                  </Badge>
                </div>
                <p className="text-sm font-medium italic leading-relaxed text-red-950">"{reason}"</p>
                <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-red-500">Open this section to correct</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <Stepper steps={STEPS} currentStep={currentStep} onStepChange={goToStep} className="pt-8" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden rounded-3xl">
          <div className="bg-slate-50 px-8 py-5 border-b border-white flex items-center justify-between">
             <div className="flex items-center space-x-3">
               <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm italic">
                 {currentStep}
               </div>
               <h2 className="font-black uppercase tracking-tight text-slate-900 italic">
                 {STEPS[currentStep-1].label}
               </h2>
             </div>
             <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-white px-3 py-1.5 rounded-xl border border-indigo-50 shadow-sm">
               Completion: {Math.round((currentStep / 7) * 100)}%
             </div>
          </div>
          
          <CardContent className="p-10">
            {/* STEP 1: Business Profile */}
            {currentStep === 1 && (
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <Input label="Applicant's Full Name" name="applicantName" value={formData.applicantName} onChange={handleChange} onBlur={handleBlur} error={touched.applicantName ? errors.applicantName : ''} isValid={!!formData.applicantName && !errors.applicantName} required className="rounded-xl h-12" />
                <Input label="Organization / Business Name" name="businessName" value={formData.businessName} onChange={handleChange} required className="rounded-xl h-12" />
                <Select label="Business Type" name="businessType" value={formData.businessType} onChange={handleChange} required className="rounded-xl h-12">
                  <option value="Proprietorship">Proprietorship</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Pvt Ltd">Pvt Ltd</option>
                  <option value="LLP">LLP</option>
                  <option value="MSME">MSME</option>
                </Select>
                <Input label="Business PAN (Organisation)" name="pan" value={formData.pan} onChange={handleChange} onBlur={handleBlur} error={touched.pan ? errors.pan : ''} isValid={!!formData.pan && !errors.pan} placeholder="ABCDE1234F" required className="rounded-xl h-12" />
                <Input label="Date of Incorporation" name="dateOfIncorporation" type="date" value={formData.dateOfIncorporation} onChange={handleChange} className="rounded-xl h-12" />
                <Input label="Aggregate Turnover" name="turnover" value={formData.turnover} onChange={handleChange} placeholder="e.g. 1.2 Crores" className="rounded-xl h-12" />
              </div>
            )}

            {/* STEP 2: Contact Details */}
            {currentStep === 2 && (
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <Input label="Official Email ID" name="email" value={formData.email} onChange={handleChange} readOnly className="bg-slate-50 italic rounded-xl h-12" />
                <Input label="Mobile Number" name="mobile" value={formData.mobile} onChange={handleChange} required className="rounded-xl h-12" />
                <Input label="State" name="state" value={formData.state} onChange={handleChange} required className="rounded-xl h-12" />
                <Input label="City" name="city" value={formData.city} onChange={handleChange} required className="rounded-xl h-12" />
                <Input label="Pin Code" name="pincode" value={formData.pincode} onChange={handleChange} required className="rounded-xl h-12" />
                <div className="md:col-span-2">
                  <Input label="Registered Business Address" name="fullAddress" value={formData.fullAddress} onChange={handleChange} required className="rounded-xl h-12" />
                </div>
              </div>
            )}

            {/* STEP 3: Tax & Compliance */}
            {currentStep === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                  <Input label="GSTIN" name="gst" value={formData.gst} onChange={handleChange} placeholder="Optional for exemptions" className="rounded-xl h-12" />
                  <Input label="Udyam Number" name="udyam" value={formData.udyam} onChange={handleChange} placeholder="UDYAM-XX-..." className="rounded-xl h-12" />
                  <Input label="Bank Account Number" name="bankAccount" value={formData.bankAccount} onChange={handleChange} className="rounded-xl h-12" />
                  <Input label="IFSC Code" name="ifsc" value={formData.ifsc} onChange={handleChange} className="rounded-xl h-12" />
                </div>
              </div>
            )}

            {/* STEP 4: Product/Service Details */}
            {currentStep === 4 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                 <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest italic">Categories Offered</h3>
                  <div className="relative group">
                    <button type="button" className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-left flex items-center justify-between font-bold text-sm text-slate-700 hover:border-slate-300 transition-colors">
                      <span>{formData.productCategories.length > 0 ? `${formData.productCategories.length} Categories Selected` : 'Select Categories...'}</span>
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    </button>
                    <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col max-h-60 overflow-y-auto">
                      {categories.map(cat => (
                        <label key={cat} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                          <input 
                            type="checkbox" 
                            checked={formData.productCategories.includes(cat)} 
                            onChange={() => toggleCategory(cat)}
                            className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                          />
                          <span className="text-sm font-bold text-slate-700">{cat}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* Selected Pills Area */}
                  {formData.productCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {formData.productCategories.map((cat: string) => (
                        <span key={cat} className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase italic flex items-center gap-2 shadow-sm animate-in zoom-in-95 duration-200">
                          {cat}
                          <button type="button" onClick={() => toggleCategory(cat)} className="hover:text-red-400 transition-colors"><X className="h-3 w-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <Input label="Service / Product Name" name="detailedProductName" value={formData.detailedProductName} onChange={handleChange} className="rounded-xl h-12" />
                <Input label="HSN/SAC Code" name="hsnCode" value={formData.hsnCode} onChange={handleChange} className="rounded-xl h-12" />
              </div>
            )}

            {/* STEP 5: Documents Upload */}
            {currentStep === 5 && (
              <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
                 {[
                   { label: 'PAN Card Copy', name: 'documents.panCard', field: 'panCard' },
                   { label: 'Udyam Certificate', name: 'documents.udyamCert', field: 'udyamCert' },
                   { label: 'GST Certificate', name: 'documents.gstCert', field: 'gstCert' },
                   { label: 'Bank Passbook / Cheque', name: 'documents.bankPassbook', field: 'bankPassbook' },
                   { label: 'Aadhaar of Authorized Person', name: 'documents.aadhaar', field: 'aadhaar' },
                   { label: 'Business Reg. Proof', name: 'documents.regProof', field: 'regProof' },
                 ].map(doc => (
                   <div key={doc.label} className="p-5 rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50 flex flex-col gap-3 group hover:border-indigo-200 transition-all">
                      <span className="text-[10px] font-black text-slate-400 uppercase italic">{doc.label}</span>
                      <div className="flex items-center gap-4">
                         <input type="file" onChange={(e) => handleFileUpload(e, doc.name)} id={`onb-${doc.field}`} className="hidden" />
                         <label htmlFor={`onb-${doc.field}`} className="flex-1 h-12 flex items-center justify-center bg-white rounded-xl border border-slate-200 text-indigo-600 font-black uppercase text-[10px] italic cursor-pointer hover:bg-indigo-50 transition-colors">
                            {isUploading === doc.name ? 'Uploading...' : 'Choose File'}
                         </label>
                         {formData.documents[doc.field as keyof typeof formData.documents] && (
                           <CheckCircle2 className="h-6 w-6 text-green-500" />
                         )}
                      </div>
                   </div>
                 ))}
              </div>
            )}

            {/* STEP 6: Final Declaration */}
            {currentStep === 6 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                 <div className="p-10 bg-slate-900 rounded-3xl text-white space-y-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                       <ShieldCheck className="h-32 w-32" />
                    </div>
                    <h3 className="text-xl font-black uppercase italic tracking-tight border-b border-white/10 pb-4">Onboarding Declaration</h3>
                    <p className="text-slate-400 text-sm leading-relaxed font-medium italic">
                       I, the authorized representative of <span className="text-white underline">{formData.businessName || 'the Organization'}</span>, hereby solemnly affirm that the information provided in this onboarding flow is true, complete, and correct to the best of my knowledge and belief. I understand that any false statement or omission may result in rejection of the application and potential legal consequences.
                    </p>
                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                       <input 
                         type="checkbox" 
                         name="declaration" 
                         checked={formData.declaration} 
                         onChange={handleChange}
                         className="w-6 h-6 rounded accent-indigo-500" 
                       />
                       <span className="text-xs font-black uppercase italic text-indigo-400">I Agree and Accept the Declaration</span>
                    </div>
                 </div>
              </div>
            )}

            {/* STEP 7: Submit Approval */}
            {currentStep === 7 && (
              <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="mx-auto w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                 </div>
                 <h2 className="text-2xl font-black text-slate-900 uppercase italic">Review & Submit</h2>
                 <p className="text-slate-500 font-medium italic max-w-lg mx-auto">
                    Your profile is ready for submission. Once submitted, our compliance team will review your documents and verify your business details.
                 </p>
                 <div className="p-8 bg-indigo-50 rounded-3xl border border-indigo-100 italic space-y-2">
                    <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">Expected Review Time</p>
                    <p className="font-bold text-slate-700">48 - 72 Business Hours</p>
                 </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between pt-6">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={prevStep} 
            disabled={currentStep === 1 || isLoading}
            className={cn("h-14 px-8 rounded-2xl text-slate-400 hover:text-slate-900 font-black uppercase italic tracking-widest text-[10px]", currentStep === 1 && "opacity-0")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          
          <Button 
            type="submit" 
            disabled={isLoading}
            className="h-14 px-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase italic tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-2 group transition-all"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : currentStep === 7 ? <Save className="h-5 w-5" /> : null}
            <span>{isLoading ? 'Submitting...' : currentStep === 7 ? 'Submit for Approval' : `Continue to ${STEPS[currentStep].label}`}</span>
            {currentStep < 7 && !isLoading && <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />}
          </Button>
        </div>
      </form>
    </div>
  );
}
