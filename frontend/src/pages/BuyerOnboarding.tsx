import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Card, CardContent, Badge } from '../components/ui/Card';
import { Stepper, Step } from '../components/ui/Stepper';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Save, Upload, CheckCircle2, AlertTriangle, Clock, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { validateField, FieldType } from '../lib/validation';


const SIDEBAR_SECTIONS = [
  { id: 'org', label: 'Organisation Details' },
  { id: 'rep', label: 'Authorized Representative' },
  { id: 'address', label: 'Address Details' },
  { id: 'procurement', label: 'Procurement Profile' },
  { id: 'docs', label: 'Document Upload' },
  { id: 'account', label: 'Account Setup' },
];

export default function BuyerOnboarding() {
  const { user, refreshUser } = useAuth();
  const [activeSection, setActiveSection] = useState('org');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<any>({
    // Organisation Details
    organizationName: '',
    businessType: 'Private Limited Company',
    industry: '',
    cin: '',
    pan: '',
    gst: '',
    website: '',
    
    // Authorized Representative
    representativeName: '',
    designation: '',
    department: 'Procurement',
    email: '',
    mobile: '',
    alternateMobile: '',
    
    // Address Details
    country: 'India',
    state: '',
    city: '',
    pincode: '',
    registeredAddress: '',
    corporateAddress: '',
    
    // Procurement Profile
    procurementCategories: [],
    otherCategoryDetails: '',
    annualBudget: '< ₹10 Lakh',
    preferredMethods: [],
    
    // Document Upload
    documents: {
      panCard: '',
      regCert: '',
      gstCert: '',
      addressProof: '',
      authLetter: ''
    },

    // Account Setup
    password: '',
    confirmPassword: '',
    declaration: false,
    agreeTerms: false,
  });

  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        await refreshUser();
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        setFormData((prev: any) => ({
          ...prev,
          ...(data.profile || {}),
          email: data.user?.email || prev.email
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
    if (name === 'pan') fieldType = 'pan';
    if (name === 'gst') fieldType = 'gst';
    if (name === 'cin') fieldType = 'cin';
    if (name === 'mobile' || name === 'alternateMobile') fieldType = 'mobile';
    if (name === 'email') fieldType = 'email';
    if (name === 'pincode') fieldType = 'pincode';
    if (name === 'representativeName') fieldType = 'name';

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
    if (['mobile', 'alternateMobile', 'pincode'].includes(name)) {
      newValue = value.replace(/[^0-9]/g, '');
      if (name === 'mobile' || name === 'alternateMobile') newValue = newValue.slice(0, 10);
      if (name === 'pincode') newValue = newValue.slice(0, 6);
    }

    if (['pan', 'gst', 'cin'].includes(name)) {
      newValue = value.toUpperCase().trim();
      if (name === 'pan') newValue = newValue.slice(0, 10);
      if (name === 'gst') newValue = newValue.slice(0, 15);
      if (name === 'cin') newValue = newValue.slice(0, 21);
    }

    if (name === 'representativeName') {
      newValue = value.replace(/[^A-Za-z ]/g, '');
    }

    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: newValue });
      if (touched[name]) validate(name, newValue);
    }
  };

  const toggleTag = (field: string, value: string) => {
    const values = [...formData[field]];
    if (values.includes(value)) {
      setFormData({ ...formData, [field]: values.filter(v => v !== value) });
    } else {
      setFormData({ ...formData, [field]: [...values, value] });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(fieldName);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const res = await fetch('/api/upload', {
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

  const validateSection = (sectionId: string) => {
    let fields: string[] = [];
    if (sectionId === 'org') fields = ['organizationName'];
    if (sectionId === 'rep') fields = ['representativeName', 'email', 'mobile'];
    if (sectionId === 'address') fields = ['state', 'city', 'pincode', 'registeredAddress'];
    if (sectionId === 'account') fields = ['password', 'confirmPassword'];

    let isValid = true;
    fields.forEach(field => {
      const isFieldValid = validate(field, formData[field] || '');
      if (!isFieldValid) isValid = false;
    });

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final Submission Logic
    if (activeSection === 'account') {
      if (!validateSection('account')) return;
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      if (!formData.declaration || !formData.agreeTerms) {
        toast.error('Please accept both declarations');
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch('/api/buyer/register', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(formData)
        });
        
        if (res.ok) {
          toast.success('Registration finished successfully');
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
    } else {
      // Move to next sidebar section
      const currentIndex = SIDEBAR_SECTIONS.findIndex(s => s.id === activeSection);
      if (validateSection(activeSection)) {
        setActiveSection(SIDEBAR_SECTIONS[currentIndex + 1].id);
      } else {
        toast.error('Please fix validation errors');
      }
    }
  };

  if (isFetching) return <div className="flex h-screen items-center justify-center font-bold text-indigo-600 italic">Loading form...</div>;

  const categories = ['IT Equipment', 'Office Supplies', 'Machinery', 'Services', 'Construction', 'Consulting', 'Others'];
  const methods = ['Direct Purchase', 'Quotation Based', 'Tender / Bidding', 'Reverse Auction'];

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20">
      {/* HEADER SECTION */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
               <ShieldCheck className="text-white h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight italic">Buyer Onboarding</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Compliance & Procurement Module</p>
            </div>
          </div>

          <div></div>

          <div className="flex items-center space-x-4">
             <div className="text-right">
               <p className="text-[9px] font-bold text-slate-400 uppercase italic">Support ID</p>
               <p className="text-xs font-black text-slate-900">GEM-BUY-2024</p>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-10">
        <form onSubmit={handleSubmit}>
          {/* REGISTRATION */}
          <div className="max-w-7xl mx-auto animate-in fade-in zoom-in-95 duration-700">
             <div className="grid grid-cols-12 gap-8">
                  {/* SIDEBAR NAVIGATION */}
                  <div className="col-span-3 space-y-4">
                    <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 sticky top-28">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic px-4 mb-6">Onboarding Flow</p>
                      <div className="space-y-1">
                        {SIDEBAR_SECTIONS.map((section, idx) => {
                          const isCompleted = SIDEBAR_SECTIONS.findIndex(s => s.id === activeSection) > idx;
                          const isActive = activeSection === section.id;
                          return (
                            <button
                              key={section.id}
                              type="button"
                              onClick={() => {
                                // Only allow clicking back to previous sections or if already completed
                                const targetIdx = SIDEBAR_SECTIONS.findIndex(s => s.id === section.id);
                                const currentIdx = SIDEBAR_SECTIONS.findIndex(s => s.id === activeSection);
                                if (targetIdx < currentIdx || isCompleted) {
                                  setActiveSection(section.id);
                                }
                              }}
                              className={cn(
                                "w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group",
                                isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-200" :
                                isCompleted ? "text-green-600 hover:bg-green-50" : "text-slate-400 hover:bg-slate-50"
                              )}
                            >
                              <div className="flex items-center space-x-3">
                                <span className={cn(
                                  "text-[10px] font-black italic",
                                  isActive ? "text-blue-100" : "text-slate-300"
                                )}>0{idx + 1}</span>
                                <span className="text-[11px] font-black uppercase italic tracking-wider">{section.label}</span>
                              </div>
                              {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : isActive ? <ArrowRight className="h-4 w-4 animate-bounce-x" /> : null}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-10 p-5 bg-slate-900 rounded-3xl text-white">
                         <div className="flex items-center space-x-3 mb-3">
                           <ShieldCheck className="h-4 w-4 text-blue-400" />
                           <span className="text-[9px] font-black uppercase italic tracking-widest">Compliance Level</span>
                         </div>
                         <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-blue-500 transition-all duration-1000" 
                             style={{ width: `${(SIDEBAR_SECTIONS.findIndex(s => s.id === activeSection) / (SIDEBAR_SECTIONS.length - 1)) * 100}%` }}
                           />
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* FORM CONTENT */}
                  <div className="col-span-9">
                    <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden min-h-[600px]">
                      <div className="bg-white px-10 py-8 border-b border-slate-50 flex items-center justify-between">
                         <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                               {activeSection === 'org' && <CheckCircle2 className="text-blue-600 h-6 w-6" />}
                               {activeSection === 'rep' && <ShieldCheck className="text-blue-600 h-6 w-6" />}
                               {activeSection === 'address' && <ArrowRight className="text-blue-600 h-6 w-6" />}
                               {activeSection === 'procurement' && <Save className="text-blue-600 h-6 w-6" />}
                               {activeSection === 'docs' && <Upload className="text-blue-600 h-6 w-6" />}
                               {activeSection === 'account' && <CheckCircle2 className="text-blue-600 h-6 w-6" />}
                            </div>
                            <div>
                               <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">
                                 {SIDEBAR_SECTIONS.find(s => s.id === activeSection)?.label}
                               </h3>
                               <p className="text-[10px] font-bold text-slate-400 uppercase italic tracking-widest mt-0.5">Section Verification In-Progress</p>
                            </div>
                         </div>
                         <Badge variant="default" className="px-4 py-2 rounded-xl border border-slate-100 text-slate-400 text-[10px] font-black italic bg-transparent hover:bg-transparent">
                           Draft ID: #PK-991
                         </Badge>
                      </div>

                      <CardContent className="p-12">
                        {/* SECTION: Organisation Details */}
                        {activeSection === 'org' && (
                          <div className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-8 duration-500">
                            <Input label="Organization / Company Name" name="organizationName" value={formData.organizationName} onChange={handleChange} onBlur={handleBlur} error={touched.organizationName ? errors.organizationName : ''} required className="rounded-2xl h-14" />
                            <Select label="Business Type" name="businessType" value={formData.businessType} onChange={handleChange} required className="rounded-2xl h-14">
                              <option value="Private Limited Company">Private Limited Company</option>
                              <option value="Public Limited Company">Public Limited Company</option>
                              <option value="Partnership Firm">Partnership Firm</option>
                              <option value="LLP">LLP</option>
                              <option value="Proprietorship">Proprietorship</option>
                              <option value="Startup">Startup</option>
                              <option value="NGO / Trust">NGO / Trust</option>
                              <option value="Educational Institution">Educational Institution</option>
                            </Select>

                          </div>
                        )}

                        {/* SECTION: Authorized Representative */}
                        {activeSection === 'rep' && (
                          <div className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-8 duration-500">
                            <Input label="Full Name" name="representativeName" value={formData.representativeName} onChange={handleChange} onBlur={handleBlur} error={touched.representativeName ? errors.representativeName : ''} required className="rounded-2xl h-14" />
                            <Input label="Designation" name="designation" value={formData.designation} placeholder="e.g. Director" className="rounded-2xl h-14" />
                            <Select label="Department" name="department" value={formData.department} onChange={handleChange} className="rounded-2xl h-14">
                              <option value="Procurement">Procurement</option>
                              <option value="Finance">Finance</option>
                              <option value="Admin">Admin</option>
                              <option value="Operations">Operations</option>
                              <option value="Management">Management</option>
                              <option value="Others">Others</option>
                            </Select>
                            <Input label="Official Email ID" name="email" value={formData.email} onChange={handleChange} readOnly className="rounded-2xl h-14 bg-slate-50" />
                            <div className="relative">
                              <Input label="Mobile Number" name="mobile" value={formData.mobile} onChange={handleChange} onBlur={handleBlur} error={touched.mobile ? errors.mobile : ''} required className="rounded-2xl h-14" />
                              <button type="button" className="absolute right-2 bottom-2 px-4 py-2 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all">Verify</button>
                            </div>
                            <Input label="Alternate Number (Optional)" name="alternateMobile" value={formData.alternateMobile} onChange={handleChange} className="rounded-2xl h-14" />
                          </div>
                        )}

                        {/* SECTION: Address Details */}
                        {activeSection === 'address' && (
                          <div className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-8 duration-500">
                            <Input label="Country" name="country" value={formData.country} readOnly className="rounded-2xl h-14 bg-slate-50" />
                            <Input label="State" name="state" value={formData.state} onChange={handleChange} onBlur={handleBlur} error={touched.state ? errors.state : ''} required className="rounded-2xl h-14" />
                            <Input label="City" name="city" value={formData.city} onChange={handleChange} onBlur={handleBlur} error={touched.city ? errors.city : ''} required className="rounded-2xl h-14" />
                            <Input label="PIN Code" name="pincode" value={formData.pincode} onChange={handleChange} onBlur={handleBlur} error={touched.pincode ? errors.pincode : ''} required className="rounded-2xl h-14" />
                            <div className="md:col-span-2">
                              <Input label="Registered Office Address" name="registeredAddress" value={formData.registeredAddress} onChange={handleChange} onBlur={handleBlur} error={touched.registeredAddress ? errors.registeredAddress : ''} required className="rounded-2xl h-14" />
                            </div>
                            <div className="md:col-span-2">
                              <Input label="Corporate Office Address (Optional)" name="corporateAddress" value={formData.corporateAddress} onChange={handleChange} placeholder="Leave blank if same as registered" className="rounded-2xl h-14" />
                            </div>
                          </div>
                        )}

                        {/* SECTION: Procurement Profile */}
                        {activeSection === 'procurement' && (
                          <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
                            <div className="space-y-4">
                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Procurement Categories (Multi-select)</h4>
                              <div className="flex flex-wrap gap-3">
                                {['IT Equipment', 'Office Supplies', 'Machinery', 'Services', 'Construction', 'Consulting', 'Others'].map(cat => (
                                  <button
                                    key={cat}
                                    type="button"
                                    onClick={() => toggleTag('procurementCategories', cat)}
                                    className={cn(
                                      "px-6 py-3 rounded-2xl border-2 text-xs font-black uppercase italic transition-all",
                                      formData.procurementCategories.includes(cat)
                                        ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200"
                                        : "bg-white text-slate-500 border-slate-100 hover:border-blue-200"
                                    )}
                                  >
                                    {cat}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <Select label="Annual Procurement Budget" name="annualBudget" value={formData.annualBudget} onChange={handleChange} className="rounded-2xl h-14">
                              <option value="< ₹10 Lakh">&lt; ₹10 Lakh</option>
                              <option value="₹10 Lakh – ₹1 Crore">₹10 Lakh – ₹1 Crore</option>
                              <option value="₹1 Crore – ₹10 Crore">₹1 Crore – ₹10 Crore</option>
                              <option value="₹10 Crore+">₹10 Crore+</option>
                            </Select>

                            <div className="space-y-4">
                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Preferred Procurement Methods</h4>
                              <div className="grid grid-cols-2 gap-4">
                                {['Direct Purchase', 'Quotation Based', 'Tender / Bidding', 'Reverse Auction'].map(method => (
                                  <button
                                    key={method}
                                    type="button"
                                    onClick={() => toggleTag('preferredMethods', method)}
                                    className={cn(
                                      "p-5 rounded-2xl border-2 text-left transition-all",
                                      formData.preferredMethods.includes(method)
                                        ? "bg-blue-50 border-blue-500 text-blue-700"
                                        : "bg-white border-slate-100 hover:border-slate-200"
                                    )}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-black uppercase italic tracking-tight">{method}</span>
                                      {formData.preferredMethods.includes(method) && <CheckCircle2 className="h-5 w-5" />}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* SECTION: Document Upload */}
                        {activeSection === 'docs' && (
                          <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-8 duration-500">
                             {[
                               { label: 'PAN Card (Organization)', name: 'documents.panCard', field: 'panCard' },
                               { label: 'Company Registration Certificate', name: 'documents.regCert', field: 'regCert' },
                               { label: 'GST Certificate (if applicable)', name: 'documents.gstCert', field: 'gstCert' },
                               { label: 'Address Proof', name: 'documents.addressProof', field: 'addressProof' },
                               { label: 'Authorization Letter (Optional)', name: 'documents.authLetter', field: 'authLetter' },
                             ].map(doc => (
                               <div key={doc.label} className="p-6 rounded-3xl border-2 border-dashed border-slate-100 bg-slate-50/50 flex flex-col gap-4 group hover:border-blue-300 transition-all">
                                 <span className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">{doc.label}</span>
                                 <div className="relative">
                                    <input type="file" onChange={(e) => handleFileUpload(e, doc.name)} id={`upload-${doc.field}`} className="hidden" />
                                    <label htmlFor={`upload-${doc.field}`} className="w-full h-14 flex items-center justify-center bg-white rounded-2xl border border-slate-100 text-blue-600 font-black uppercase text-[10px] italic cursor-pointer hover:bg-blue-50 transition-all shadow-sm">
                                       {isUploading === doc.name ? 'Uploading...' : formData.documents[doc.field as keyof typeof formData.documents] ? 'Change File' : 'Choose File'}
                                    </label>
                                 </div>
                                 {formData.documents[doc.field as keyof typeof formData.documents] && (
                                   <div className="flex items-center space-x-2 text-[9px] font-bold text-green-600 italic">
                                      <CheckCircle2 className="h-3 w-3" />
                                      <span>Document Uploaded Correctly</span>
                                   </div>
                                 )}
                                 </div>
                               ))}
                             </div>
                           )}
 
                         {/* SECTION: Account Setup */}
                         {activeSection === 'account' && (
                           <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
                             <div className="p-10 bg-slate-900 rounded-[2.5rem] text-white space-y-8 relative overflow-hidden shadow-2xl">
                               <div className="absolute top-0 right-0 p-10 opacity-10">
                                 <ShieldCheck className="h-40 w-40" />
                               </div>
                               <h4 className="text-xl font-black uppercase italic tracking-tight border-b border-white/10 pb-6">Security Credentials</h4>
                               <div className="grid gap-8">
                                  <Input label="Email ID (Username)" name="email" value={formData.email} readOnly className="bg-slate-800 border-slate-700 text-slate-400 rounded-2xl h-14" />
                                  <div className="grid md:grid-cols-2 gap-8">
                                    <Input label="Password" name="password" type="password" value={formData.password} onChange={handleChange} onBlur={handleBlur} error={touched.password ? errors.password : ''} className="bg-slate-800 border-slate-700 text-white rounded-2xl h-14" />
                                    <Input label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur} error={touched.confirmPassword ? (formData.password !== formData.confirmPassword ? 'Passwords do not match' : '') : ''} className="bg-slate-800 border-slate-700 text-white rounded-2xl h-14" />
                                  </div>
                               </div>

                               <div className="pt-6 space-y-4">
                                  <div className="flex items-center space-x-4">
                                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center font-black italic">OTP</div>
                                    <div>
                                      <p className="text-xs font-black uppercase tracking-widest italic">Mobile Verification</p>
                                      <p className="text-[10px] text-slate-400 italic">OTP will be sent to +91 {formData.mobile || 'XXXXXX'}</p>
                                    </div>
                                  </div>
                                  <Button type="button" className="w-full h-14 rounded-2xl bg-slate-800 hover:bg-blue-600 text-white font-black uppercase italic tracking-widest transition-all">Send Verification Code</Button>
                               </div>
                             </div>

                             <div className="space-y-4">
                               <label className={cn(
                                  "flex items-start gap-4 p-8 rounded-[2rem] border-2 transition-all cursor-pointer group",
                                  formData.declaration ? "bg-green-50 border-green-500/20" : "bg-white border-slate-100"
                               )}>
                                  <input 
                                    type="checkbox" 
                                    checked={formData.declaration} 
                                    onChange={(e) => setFormData({ ...formData, declaration: e.target.checked })}
                                    className="mt-1 w-6 h-6 rounded accent-blue-500" 
                                  />
                                  <span className="text-xs font-bold text-slate-600 italic leading-relaxed">
                                     I confirm that the information provided is accurate and I am authorized to register this organization on the PugArch Unified Digital Procurement Portal.
                                  </span>
                               </label>

                               <label className={cn(
                                  "flex items-start gap-4 p-8 rounded-[2rem] border-2 transition-all cursor-pointer group",
                                  formData.agreeTerms ? "bg-green-50 border-green-500/20" : "bg-white border-slate-100"
                               )}>
                                  <input 
                                    type="checkbox" 
                                    checked={formData.agreeTerms} 
                                    onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                                    className="mt-1 w-6 h-6 rounded accent-blue-500" 
                                  />
                                  <span className="text-xs font-bold text-slate-600 italic leading-relaxed">
                                     I agree to the platform Terms & Conditions.
                                  </span>
                               </label>
                             </div>
                          </div>
                        )}

                        {/* BUTTONS */}
                        <div className="mt-12 flex items-center justify-between border-t border-slate-50 pt-10">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => {
                              const currentIndex = SIDEBAR_SECTIONS.findIndex(s => s.id === activeSection);
                              if (currentIndex === 0) setOnboardingPhase(2);
                              else setActiveSection(SIDEBAR_SECTIONS[currentIndex - 1].id);
                            }}
                            className="px-10 h-16 rounded-2xl font-black uppercase italic text-slate-400 hover:text-slate-900 transition-all"
                          >
                            Previous Section
                          </Button>
                          <Button 
                            type="submit"
                            className="px-16 h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic tracking-widest shadow-xl shadow-blue-200 active:scale-[0.98] transition-all"
                            disabled={isLoading}
                          >
                            {isLoading ? 'Processing...' : activeSection === 'account' ? 'Finalize Registration' : 'Save & Continue'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
               </div>
             </div>
        </form>
    </div>
  </div>
  );
}
