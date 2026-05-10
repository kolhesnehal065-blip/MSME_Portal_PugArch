import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input, Select } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';
import { Save, Plus, Trash2, ShieldCheck, ArrowRight, Loader2, Info } from 'lucide-react';
import { GeMSellerSidebar } from '../components/GeMSellerSidebar';
import { GeMProfileHeader } from '../components/GeMProfileHeader';

export default function SellerOnboarding() {
  const { user, refreshUser } = useAuth();
  const [currentSection, setCurrentSection] = useState('pan');
  const [bankTab, setBankTab] = useState<'manage' | 'add'>('manage');
  const [officeTab, setOfficeTab] = useState<'manage' | 'add'>('manage');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [savedSections, setSavedSections] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileLocked, setIsProfileLocked] = useState(false);
  
  const [formData, setFormData] = useState<any>({
    organizationType: 'Proprietorship',
    pan: '',
    nameAsInPan: '',
    dateAsInPan: '',
    panVerified: false,
    
    businessName: '',
    dateOfIncorporation: '',
    detailsUpdated: false,
    
    isStartup: false,
    isUdyamCertified: false,
    participateInBid: false,
    optForSahay: false,
    
    turnoverMax3Yrs: '',
    eInvoicingExcluded: false,
    
    ownershipDeclarationAccepted: false,
    ownershipVerified: false,
    
    offices: [],
    bankAccounts: [],
    mobile: '',
    dob: '',
    roleInOrg: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        await refreshUser();
        const res = await api.fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        
        const regDetails = data.user?.registrationDetails || {};
        const profile = data.profile || {};
        setIsProfileLocked(data.user?.onboardingStatus === 'approved_for_procurement');
        
        setFormData((prev: any) => ({
          ...prev,
          ...profile,
          organizationType: profile.organizationType || regDetails.businessType || prev.organizationType,
          businessName: profile.businessName || regDetails.businessName || data.user?.name || prev.businessName,
          nameAsInPan: profile.nameAsInPan || regDetails.businessName || data.user?.name || prev.nameAsInPan,
          dateAsInPan: profile.dateAsInPan ? new Date(profile.dateAsInPan).toISOString().split('T')[0] : '',
          dateOfIncorporation: profile.dateOfIncorporation ? new Date(profile.dateOfIncorporation).toISOString().split('T')[0] : '',
          mobile: profile.mobile || data.user?.mobile || prev.mobile,
          dob: profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : (data.user?.dob ? new Date(data.user.dob).toISOString().split('T')[0] : prev.dob),
          roleInOrg: profile.roleInOrg || regDetails.roleInOrg || prev.roleInOrg,
          pan: profile.pan || regDetails.pan || prev.pan,
          offices: profile.offices || [],
          bankAccounts: profile.bankAccounts || []
        }));
      } catch (err) {
        console.error(err);
      } finally {
        setIsFetching(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (isProfileLocked) return;
    const { name, value, type } = e.target as any;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev: any) => ({ ...prev, [name]: val }));
  };

  const handleSaveSection = async (nextSection?: string | React.MouseEvent) => {
    if (isProfileLocked) {
      toast.info('Approved profiles are locked');
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.post('/api/seller/register', formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        toast.success('Section saved successfully');
        setSavedSections(prev => Array.from(new Set([...prev, currentSection])));
        if (typeof nextSection === 'string') {
          setCurrentSection(nextSection);
        }
      } else {
        toast.error('Failed to save section');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOffice = async (officeData: any) => {
    if (isProfileLocked) {
      toast.info('Approved profiles are locked');
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.post('/api/seller/profile/offices', officeData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFormData((prev: any) => ({ ...prev, offices: [...prev.offices, data.office] }));
        toast.success('Office added');
      }
    } catch (err) {
      toast.error('Error adding office');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOffice = async (id: number) => {
    if (isProfileLocked) {
      toast.info('Approved profiles are locked');
      return;
    }
    try {
      await api.delete(`/api/seller/profile/offices/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setFormData((prev: any) => ({ ...prev, offices: prev.offices.filter((o: any) => o.id !== id) }));
      toast.success('Office deleted');
    } catch (err) {
      toast.error('Error deleting office');
    }
  };

  const handleAddBank = async (bankData: any) => {
    if (isProfileLocked) {
      toast.info('Approved profiles are locked');
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.post('/api/seller/profile/bank', bankData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFormData((prev: any) => ({ ...prev, bankAccounts: [...prev.bankAccounts, data.bank] }));
        toast.success('Bank account added');
      }
    } catch (err) {
      toast.error('Error adding bank account');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCompletion = () => {
    let completed = 0;
    if (formData.panVerified) completed += 1;
    if (formData.businessName && formData.dateOfIncorporation) completed += 1;
    if (formData.isStartup || formData.isUdyamCertified) completed += 1; // Simplification
    if (formData.offices.length > 0) completed += 1;
    if (formData.bankAccounts.length > 0) completed += 1;
    if (formData.turnoverMax3Yrs) completed += 1;
    if (formData.ownershipDeclarationAccepted) completed += 1;
    return Math.round((completed / 7) * 100);
  };

  const getSectionStatus = () => {
    const status: any = {};
    status.pan = formData.panVerified || savedSections.includes('pan') ? 'completed' : 'pending';
    status.details = (formData.businessName && formData.dateOfIncorporation) || savedSections.includes('details') ? 'completed' : 'pending';
    status.additional = savedSections.includes('additional') || formData.isStartup || formData.isUdyamCertified || formData.participateInBid || formData.optForSahay ? 'completed' : 'pending';
    status.offices = formData.offices.length > 0 ? 'completed' : 'pending';
    status.bank = formData.bankAccounts.length > 0 ? 'completed' : 'pending';
    status.einvoicing = formData.turnoverMax3Yrs || savedSections.includes('einvoicing') ? 'completed' : 'pending';
    status.ownership = formData.ownershipDeclarationAccepted || savedSections.includes('ownership') ? 'completed' : 'pending';
    return status;
  };

  const warnings = [];
  if (!formData.panVerified) warnings.push("Kindly verify Business PAN");
  if (formData.offices.length === 0) warnings.push("Registered Address details missing");
  if (!formData.ownershipDeclarationAccepted) warnings.push("Please complete Beneficial Ownership Compliance");

  if (isFetching) return <div className="flex h-screen items-center justify-center font-black italic text-blue-600 animate-pulse">Initializing GeM-Style Profile...</div>;

  return (
    <div className="flex flex-col lg:flex-row bg-gray-50 min-h-screen">
      <GeMSellerSidebar 
        currentSection={currentSection} 
        onSectionChange={setCurrentSection} 
        sectionStatus={getSectionStatus()} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <GeMProfileHeader 
          companyName={formData.businessName} 
          completionPercentage={calculateCompletion()} 
          warnings={warnings} 
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        
        <main className="p-4 sm:p-8 max-w-4xl mx-auto w-full">
          <Card className="rounded-2xl border-none shadow-xl shadow-gray-200/50 bg-white overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50/50 px-4 sm:px-8 py-5">
               <h3 className="text-sm font-black uppercase tracking-tight text-gray-800 italic">
                 {currentSection.replace(/([A-Z])/g, ' $1').toUpperCase()}
               </h3>
               {isProfileLocked && (
                 <p className="mt-3 inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                   Approved profile locked
                 </p>
               )}
            </div>
            
            <CardContent className="p-4 sm:p-8">
              <fieldset disabled={isProfileLocked} className={isProfileLocked ? 'opacity-70' : ''}>
              {currentSection === 'pan' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select label="Business / Organisation Type" name="organizationType" value={formData.organizationType} onChange={handleChange}>
                      <option value="Proprietorship">Proprietorship</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Pvt Ltd">Private Limited Company</option>
                      <option value="Public Ltd">Public Limited Company</option>
                      <option value="LLP">Limited Liability Partnership</option>
                    </Select>
                    <Input label="Business PAN Number" name="pan" value={formData.pan} onChange={handleChange} placeholder="ABCDE1234F" />
                    <Input label="Name (As in PAN)" name="nameAsInPan" value={formData.nameAsInPan} onChange={handleChange} />
                    <Input label="Date (As in PAN)" name="dateAsInPan" type="date" value={formData.dateAsInPan} onChange={handleChange} />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button onClick={() => setFormData((prev: any) => ({ ...prev, panVerified: true }))} className="bg-blue-600 hover:bg-blue-700 rounded-xl px-8 h-12 font-black uppercase text-xs italic tracking-widest shadow-lg shadow-blue-100">
                       Verify Business PAN
                    </Button>
                    <Button onClick={() => handleSaveSection('details')} disabled={isLoading} className="bg-gray-900 hover:bg-black rounded-xl px-8 h-12 font-black uppercase text-xs italic tracking-widest text-white">
                       {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                       Save & Continue
                    </Button>
                  </div>
                </div>
              )}

              {currentSection === 'details' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Business / Organisation Name" name="businessName" value={formData.businessName} onChange={handleChange} />
                    <Input label="Date of Incorporation" name="dateOfIncorporation" type="date" value={formData.dateOfIncorporation} onChange={handleChange} />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button onClick={() => handleSaveSection('additional')} className="bg-blue-600 hover:bg-blue-700 rounded-xl px-10 h-12 font-black uppercase text-xs italic tracking-widest text-white shadow-lg shadow-blue-100">
                       Save & Continue
                    </Button>
                  </div>
                </div>
              )}

              {currentSection === 'additional' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                   {[
                     { label: 'Are you registered with DPIIT as Startup?', name: 'isStartup' },
                     { label: 'Do you have Udyam Registration certified by MSME?', name: 'isUdyamCertified' },
                     { label: 'Do you want to participate in Bid?', name: 'participateInBid' },
                     { label: 'Do you want to Opt for SAHAY?', name: 'optForSahay' },
                   ].map(item => (
                     <div key={item.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 italic font-bold text-gray-700">
                        <span className="text-sm">{item.label}</span>
                        <div className="flex gap-4">
                           <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" checked={formData[item.name]} onChange={() => setFormData((prev: any) => ({ ...prev, [item.name]: true }))} className="accent-blue-600 h-4 w-4" />
                              <span className="text-xs uppercase">Yes</span>
                           </label>
                           <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" checked={!formData[item.name]} onChange={() => setFormData((prev: any) => ({ ...prev, [item.name]: false }))} className="accent-blue-600 h-4 w-4" />
                              <span className="text-xs uppercase">No</span>
                           </label>
                        </div>
                     </div>
                   ))}
                   <div className="flex justify-end pt-4">
                    <Button onClick={() => handleSaveSection('offices')} className="bg-gray-900 text-white rounded-xl px-10 h-12 font-black uppercase text-xs italic tracking-widest">
                       Save & Continue
                    </Button>
                  </div>
                </div>
              )}

              {currentSection === 'offices' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                   <p className="text-sm text-gray-600">You can add multiple office locations as per their function/type for your Business</p>
                   
                   <div className="flex border-b border-gray-200">
                     <button onClick={() => setOfficeTab('manage')} className={`px-6 py-3 text-sm font-semibold ${officeTab === 'manage' ? 'text-blue-600 border-t-2 border-l-2 border-r-2 border-gray-200 rounded-t-lg bg-white -mb-px' : 'text-gray-500 hover:text-gray-700'}`}>Manage Offices</button>
                     <button onClick={() => setOfficeTab('add')} className={`px-6 py-3 text-sm font-semibold ${officeTab === 'add' ? 'text-blue-600 border-t-2 border-l-2 border-r-2 border-gray-200 rounded-t-lg bg-white -mb-px' : 'text-gray-500 hover:text-gray-700'}`}>Add New Office</button>
                   </div>

                    {officeTab === 'manage' && (
                      <div className="pt-4 space-y-6 animate-in fade-in">
                         <p className="text-sm text-gray-700">You need to update your GSTIN for getting the order above 40 lakhs.</p>
                         
                         <div className="overflow-x-auto border border-gray-200 bg-white rounded-xl">
                            <table className="w-full text-left text-sm min-w-[600px]">
                              <thead className="bg-gray-50 border-b border-gray-200">
                                 <tr>
                                    <th className="px-4 py-4 font-semibold text-gray-800 w-1/4">Office</th>
                                    <th className="px-4 py-4 font-semibold text-gray-800 w-1/2">Address</th>
                                    <th className="px-4 py-4 font-semibold text-gray-800">GSTIN</th>
                                    <th className="px-4 py-4 font-semibold text-gray-800">ACTION</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {formData.offices.length === 0 ? (
                                    <tr>
                                       <td colSpan={4} className="py-6 px-0 text-gray-500">
                                          <div className="flex justify-between items-center px-6">
                                            <span>No offices added.</span>
                                            <button onClick={() => setOfficeTab('add')} className="text-blue-600 font-bold hover:underline uppercase text-xs">ADD NEW OFFICE</button>
                                          </div>
                                       </td>
                                    </tr>
                                 ) : (
                                    formData.offices.map((office: any) => (
                                       <tr key={office.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                                          <td className="px-4 py-4 text-gray-600">
                                            <div className="font-semibold">{office.name}</div>
                                            <div className="text-xs text-gray-400">{office.type}</div>
                                          </td>
                                          <td className="px-4 py-4 text-gray-600 whitespace-normal">
                                            {office.address}, {office.city}, {office.state} - {office.pincode}
                                          </td>
                                          <td className="px-4 py-4 text-gray-600">-</td>
                                          <td className="px-4 py-4">
                                             <button onClick={() => handleDeleteOffice(office.id)} className="text-blue-600 hover:text-blue-800 font-bold text-xs uppercase mr-4">EDIT</button>
                                             <button onClick={() => handleDeleteOffice(office.id)} className="text-red-500 hover:text-red-700 font-bold text-xs uppercase">DELETE</button>
                                          </td>
                                       </tr>
                                    ))
                                 )}
                              </tbody>
                           </table>
                           {formData.offices.length > 0 && (
                             <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-t border-gray-200">
                               <span className="text-sm text-gray-600">{formData.offices.length} of {formData.offices.length} Office Location displayed.</span>
                               <button onClick={() => setOfficeTab('add')} className="text-blue-600 font-bold hover:underline uppercase text-xs">ADD NEW OFFICE</button>
                             </div>
                           )}
                        </div>
                     </div>
                   )}

                   {officeTab === 'add' && (
                     <div className="pt-4 space-y-6 animate-in fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                           <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">Office Name*</label>
                              <input id="new-office-name" placeholder="Enter Office Name" className="w-full h-12 px-4 rounded border border-gray-300 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">Type Of Office*</label>
                              <select id="new-office-type" className="w-full h-12 px-4 rounded border border-gray-300 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-500">
                                 <option value="Registered">Select type of address</option>
                                 <option value="Registered">Registered Office</option>
                                 <option value="Branch">Branch</option>
                                 <option value="Warehouse">Warehouse</option>
                              </select>
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">Pincode*</label>
                              <input id="new-office-pincode" placeholder="Enter 6 digit pincode" className="w-full h-12 px-4 rounded border border-gray-300 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">State*</label>
                              <input id="new-office-state" placeholder="State" className="w-full h-12 px-4 rounded border border-gray-300 bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">Town/City/District*</label>
                              <input id="new-office-city" placeholder="Town/City/District" className="w-full h-12 px-4 rounded border border-gray-300 bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">Flat/Door/Block No*</label>
                              <input id="new-office-flat" placeholder="Enter Flat/Door/Block number" className="w-full h-12 px-4 rounded border border-gray-300 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">Name of Premises/ Building/ Village</label>
                              <input id="new-office-premises" placeholder="Enter Building/Premises/Village" className="w-full h-12 px-4 rounded border border-gray-300 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">Road/Street/Post Office</label>
                              <input id="new-office-road" placeholder="Enter Road/Street/Post Office" className="w-full h-12 px-4 rounded border border-gray-300 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">Area/Locality*</label>
                              <input id="new-office-area" placeholder="Enter Area/Locality" className="w-full h-12 px-4 rounded border border-gray-300 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">Contact Number* <span className="text-gray-400 font-normal ml-1">ⓘ</span></label>
                              <input id="new-office-contact" placeholder="Enter Contact Number" className="w-full h-12 px-4 rounded border border-gray-300 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                              <p className="text-[10px] text-gray-500 mt-1 leading-tight">This number will be published on GeM Artifacts (such as Contract and Invoice) for helping the Buyer communicate with the Sellers post contract</p>
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">Office Email Address*</label>
                              <select id="new-office-email" className="w-full h-12 px-4 rounded border border-gray-300 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-500">
                                 <option value={user?.email || "registered@example.com"}>{user?.email || "registered@example.com"}</option>
                              </select>
                           </div>
                        </div>
                        <div className="flex justify-end mt-6 pt-6 border-t border-gray-100">
                           <Button onClick={() => {
                             const name = (document.getElementById('new-office-name') as HTMLInputElement).value;
                             const type = (document.getElementById('new-office-type') as HTMLSelectElement).value;
                             const flat = (document.getElementById('new-office-flat') as HTMLInputElement).value;
                             const premises = (document.getElementById('new-office-premises') as HTMLInputElement).value;
                             const road = (document.getElementById('new-office-road') as HTMLInputElement).value;
                             const area = (document.getElementById('new-office-area') as HTMLInputElement).value;
                             const contact = (document.getElementById('new-office-contact') as HTMLInputElement).value;
                             
                             if (!name) { toast.error("Please enter Office Name"); return; }
                             
                             const fullAddress = [flat, premises, road, area, `Contact: ${contact}`].filter(Boolean).join(', ');
                             
                             handleAddOffice({
                               name,
                               type: type === 'Registered' ? 'Registered' : type,
                               pincode: (document.getElementById('new-office-pincode') as HTMLInputElement).value,
                               state: (document.getElementById('new-office-state') as HTMLInputElement).value,
                               city: (document.getElementById('new-office-city') as HTMLInputElement).value,
                               address: fullAddress,
                               contactNumber: contact,
                               isMandatory: type === 'Registered'
                             });
                             setOfficeTab('manage');
                           }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 h-12 rounded transition-colors uppercase tracking-widest text-xs italic shadow-lg shadow-blue-100">
                              <Plus className="mr-2 h-4 w-4" /> ADD OFFICE
                           </Button>
                        </div>
                     </div>
                   )}
                   <div className="flex justify-end pt-4">
                     <Button onClick={() => handleSaveSection('bank')} className="bg-gray-900 text-white rounded-xl px-10 h-12 font-black uppercase text-xs italic tracking-widest">
                        Save & Continue
                     </Button>
                   </div>
                </div>
              )}

              {currentSection === 'bank' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                   <p className="text-sm text-gray-600">You can add multiple Bank accounts for your Business. One account must be selected as Primary account</p>
                   
                   <div className="flex border-b border-gray-200">
                     <button onClick={() => setBankTab('manage')} className={`px-6 py-3 text-sm font-semibold ${bankTab === 'manage' ? 'text-blue-600 border-t-2 border-l-2 border-r-2 border-gray-200 rounded-t-lg bg-white -mb-px' : 'text-gray-500 hover:text-gray-700'}`}>Manage Bank Account</button>
                     <button onClick={() => setBankTab('add')} className={`px-6 py-3 text-sm font-semibold ${bankTab === 'add' ? 'text-blue-600 border-t-2 border-l-2 border-r-2 border-gray-200 rounded-t-lg bg-white -mb-px' : 'text-gray-500 hover:text-gray-700'}`}>Add new Bank Account</button>
                   </div>

                    {bankTab === 'manage' && (
                      <div className="pt-4 space-y-6 animate-in fade-in">
                         <div className="bg-blue-50/50 text-slate-700 p-5 rounded text-sm border border-blue-100">
                            <p>Public Finance Management System (PFMS) verification is mandatory to receive payments from buyers using PFMS method of payment. Enter your PFMS verified account for better experience.</p>
                            <p className="mt-4">Don't have a PFMS verification yet? Don't worry, you can proceed with a non-PFMS verified account now and come back to this section later.</p>
                         </div>
                         
                         <div className="overflow-x-auto border border-gray-200 bg-white rounded-xl">
                            <table className="w-full text-left text-sm min-w-[800px]">
                              <thead className="bg-gray-50 border-b border-gray-200">
                                 <tr>
                                    <th className="px-4 py-4 font-semibold text-gray-800">IFSC</th>
                                    <th className="px-4 py-4 font-semibold text-gray-800">Bank Name</th>
                                    <th className="px-4 py-4 font-semibold text-gray-800">Bank Account Number</th>
                                    <th className="px-4 py-4 font-semibold text-gray-800">Account Holder Name</th>
                                    <th className="px-4 py-4 font-semibold text-gray-800">PFMS Code</th>
                                    <th className="px-4 py-4 font-semibold text-gray-800">Is Primary?</th>
                                    <th className="px-4 py-4 font-semibold text-gray-800">ACTION</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {formData.bankAccounts.length === 0 ? (
                                    <tr>
                                       <td colSpan={7} className="py-6 px-0 text-gray-500">
                                          <div className="flex justify-between items-center px-6">
                                            <span>No accounts added.</span>
                                            <button onClick={() => setBankTab('add')} className="text-blue-600 font-bold hover:underline uppercase text-xs">ADD NEW BANK ACCOUNT</button>
                                          </div>
                                       </td>
                                    </tr>
                                 ) : (
                                    formData.bankAccounts.map((bank: any) => (
                                       <tr key={bank.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                                          <td className="px-4 py-4 text-gray-600">{bank.ifsc}</td>
                                          <td className="px-4 py-4 text-gray-600">{bank.bankName}</td>
                                          <td className="px-4 py-4 text-gray-600">{bank.accountNumber}</td>
                                          <td className="px-4 py-4 text-gray-600">{bank.holderName || '-'}</td>
                                          <td className="px-4 py-4 text-gray-600">-</td>
                                          <td className="px-4 py-4 text-gray-600">{bank.isPrimary ? 'Yes' : 'No'}</td>
                                          <td className="px-4 py-4">
                                             <button onClick={() => setFormData((prev: any) => ({ ...prev, bankAccounts: prev.bankAccounts.filter((b: any) => b.id !== bank.id) }))} className="text-red-500 hover:text-red-700 font-bold text-xs uppercase">Delete</button>
                                          </td>
                                       </tr>
                                    ))
                                 )}
                              </tbody>
                           </table>
                        </div>
                     </div>
                   )}

                   {bankTab === 'add' && (
                     <div className="pt-4 space-y-6 animate-in fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                           <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">IFSC Code*</label>
                              <input id="new-bank-ifsc" placeholder="Enter IFSC Code" className="w-full h-12 px-4 rounded border border-gray-300 bg-gray-50/50 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">Bank Name*</label>
                              <input id="new-bank-name" placeholder="Bank Name" className="w-full h-12 px-4 rounded border border-gray-300 bg-gray-100 text-sm" />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">Bank Address*</label>
                              <textarea id="new-bank-address" placeholder="Bank Address" className="w-full h-24 p-4 rounded border border-gray-300 bg-gray-100 text-sm resize-none"></textarea>
                           </div>
                           <div className="space-y-6">
                              <div>
                                 <label className="block text-xs font-bold text-gray-700 mb-1">Account Holder Name*</label>
                                 <input id="new-bank-holder" placeholder="Enter Account Holder's Name" className="w-full h-12 px-4 rounded border border-gray-300 bg-gray-50/50 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                              </div>
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">Bank Account No*</label>
                              <input id="new-bank-number" placeholder="Enter Bank account number" className="w-full h-12 px-4 rounded border border-gray-300 bg-gray-50/50 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">Confirm Bank Account No*</label>
                              <input id="new-bank-confirm" placeholder="Confirm Bank account number" className="w-full h-12 px-4 rounded border border-gray-300 bg-gray-50/50 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                           </div>
                        </div>

                        <label className="flex items-center gap-2 mt-4 cursor-pointer">
                           <input id="new-bank-primary" type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                           <span className="text-sm font-medium text-gray-700">Is Primary Account?</span>
                        </label>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-8 pt-6 border-t border-gray-100">
                           <p className="text-sm font-medium text-gray-800 mb-4 sm:mb-0">Please complete OTP verification to add a new bank account</p>
                           <Button onClick={() => {
                             const accNo = (document.getElementById('new-bank-number') as HTMLInputElement).value;
                             const confirmAccNo = (document.getElementById('new-bank-confirm') as HTMLInputElement).value;
                             if (!accNo || !confirmAccNo) {
                               toast.error("Please fill account numbers");
                               return;
                             }
                             if (accNo !== confirmAccNo) {
                               toast.error("Account numbers do not match!");
                               return;
                             }
                             toast.success("OTP Verified Successfully!");
                             handleAddBank({
                               ifsc: (document.getElementById('new-bank-ifsc') as HTMLInputElement).value,
                               bankName: (document.getElementById('new-bank-name') as HTMLInputElement).value,
                               bankAddress: (document.getElementById('new-bank-address') as HTMLTextAreaElement).value,
                               holderName: (document.getElementById('new-bank-holder') as HTMLInputElement).value,
                               accountNumber: accNo,
                               isPrimary: (document.getElementById('new-bank-primary') as HTMLInputElement).checked
                             });
                             setBankTab('manage');
                           }} className="bg-gray-200 hover:bg-gray-300 text-gray-500 font-bold px-8 h-10 rounded transition-colors">
                              VERIFY OTP & ADD
                           </Button>
                        </div>
                     </div>
                   )}

                   <div className="flex justify-end pt-8">
                     <Button onClick={() => handleSaveSection('einvoicing')} className="bg-gray-900 text-white rounded-xl px-10 h-12 font-black uppercase text-xs italic tracking-widest">
                        Save & Continue
                     </Button>
                   </div>
                </div>
              )}

              {currentSection === 'einvoicing' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                   <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl space-y-2 italic">
                      <p className="text-[10px] font-black uppercase text-blue-700">e-Invoice Information</p>
                      <p className="text-xs font-medium text-blue-900 leading-relaxed opacity-80">
                        As per Government regulations, taxpayers with turnover exceeding specific limits must generate e-invoices. Please declare your status below.
                      </p>
                   </div>
                   <div className="grid grid-cols-1 gap-6">
                      <Input label="Turnover (Max in last 3 years)" name="turnoverMax3Yrs" value={formData.turnoverMax3Yrs} onChange={handleChange} placeholder="e.g. 10 Crores" />
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 italic font-bold">
                        <span className="text-sm">Specific category excluded from e-invoicing?</span>
                        <div className="flex gap-4">
                           <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" checked={formData.eInvoicingExcluded} onChange={() => setFormData((prev: any) => ({ ...prev, eInvoicingExcluded: true }))} className="accent-blue-600 h-4 w-4" />
                              <span className="text-xs uppercase">Yes</span>
                           </label>
                           <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" checked={!formData.eInvoicingExcluded} onChange={() => setFormData((prev: any) => ({ ...prev, eInvoicingExcluded: false }))} className="accent-blue-600 h-4 w-4" />
                              <span className="text-xs uppercase">No</span>
                           </label>
                        </div>
                      </div>
                   </div>
                   <div className="flex justify-end pt-4">
                    <Button onClick={() => handleSaveSection('ownership')} className="bg-gray-900 text-white rounded-xl px-10 h-12 font-black uppercase text-xs italic tracking-widest">
                       Save & Continue
                    </Button>
                  </div>
                </div>
              )}

              {currentSection === 'ownership' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                   <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-4 sm:p-8 text-white shadow-2xl">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                         <ShieldCheck className="h-32 w-32" />
                      </div>
                      <h3 className="border-b border-white/10 pb-4 text-xl font-black uppercase tracking-tight italic">Beneficial Ownership Declaration</h3>
                      <p className="mt-4 text-slate-400 text-sm leading-relaxed font-medium italic">
                         I hereby solemnly affirm and declare that I have read and understood Rule 144(xi) of GFR 2017 and subsequent orders issued by the Ministry of Finance. I declare that our organization is compliant with the beneficial ownership rules as prescribed.
                      </p>
                      <label className="mt-8 flex cursor-pointer items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10">
                         <input 
                           type="checkbox" 
                           name="ownershipDeclarationAccepted" 
                           checked={formData.ownershipDeclarationAccepted} 
                           onChange={handleChange}
                           className="mt-0.5 h-6 w-6 shrink-0 rounded accent-blue-500" 
                         />
                         <span className="text-xs font-black uppercase leading-relaxed text-blue-400 italic">I Accept and Affirm Compliance</span>
                      </label>
                   </div>
                   
                   <div className="flex flex-col items-center gap-6 py-6 italic">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Verification Required via OTP</p>
                      <div className="flex gap-4">
                         <Button onClick={() => setFormData((prev: any) => ({ ...prev, ownershipVerified: true }))} className="bg-blue-600 text-white rounded-xl px-8 h-12 font-black uppercase text-xs italic tracking-widest">
                            Send OTP
                         </Button>
                         <Button onClick={() => handleSaveSection()} className="bg-gray-900 text-white rounded-xl px-10 h-12 font-black uppercase text-xs italic tracking-widest">
                            {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Final Submission'}
                         </Button>
                      </div>
                   </div>
                </div>
              )}
              </fieldset>
            </CardContent>
          </Card>

          <div className="mt-12 flex items-center justify-between p-6 bg-blue-600 rounded-3xl shadow-xl shadow-blue-100 italic animate-in slide-in-from-bottom-4 duration-500">
             <div className="text-white">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Next Step Recommendation</p>
                <p className="text-sm font-bold uppercase">Proceed to Next Mandatory Section</p>
             </div>
             <button 
               onClick={() => {
                 const sections = ['pan', 'details', 'additional', 'offices', 'bank', 'einvoicing', 'ownership'];
                 const nextIdx = sections.indexOf(currentSection) + 1;
                 if (nextIdx < sections.length) setCurrentSection(sections[nextIdx]);
               }}
               className="bg-white text-blue-600 h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg hover:-translate-x-1 transition-transform"
             >
                <ArrowRight className="h-6 w-6" />
             </button>
          </div>
        </main>
      </div>
    </div>
  );
}
