import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import { Input } from '../components/ui/Input';
import { toast } from 'sonner';
import { Search, Eye, CheckCircle, XCircle, Users, ShoppingBag, X, FileText, Check, ShieldCheck, MapPin, Building2, Briefcase, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminOnboarding() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('sellers');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [feedback, setFeedback] = useState('');

  // Rejection Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [activeSectionForRejection, setActiveSectionForRejection] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.fetch('/api/admin/onboarding', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setSellers(data.sellers || []);
      setBuyers(data.buyers || []);
    } catch (err) {
      toast.error('Failed to load registrations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (userId: string, status: string) => {
    try {
      const res = await api.post('/api/admin/status', { userId, status }, {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        toast.success(`Complete application ${status}`);
        if (selectedItem && selectedItem._id === userId) {
          const sectionStatus = status === 'approved' ? {
            basic: 'approved',
            business: 'approved',
            compliance: 'approved',
            bank: 'approved',
            documents: 'approved'
          } : status === 'rejected' ? {
            basic: 'rejected',
            business: 'rejected',
            compliance: 'rejected',
            bank: 'rejected',
            documents: 'rejected'
          } : selectedItem.sectionStatus;

          setSelectedItem({ ...selectedItem, status, sectionStatus });
        }
        fetchData();
      } else {
        toast.error('Failed to update status');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const handleUpdateSectionStatus = async (userId: string, section: string, status: string, reason?: string) => {
    try {
      const res = await api.post('/api/admin/section-status', { userId, section, status, rejectionReason: reason }, {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        toast.success(`${section} status updated to ${status}`);
        if (selectedItem && selectedItem._id === userId) {
          const updatedSectionStatus = { 
            ...(selectedItem.sectionStatus || { basic: 'pending', business: 'pending', compliance: 'pending', bank: 'pending', documents: 'pending' }), 
            [section]: status 
          };
          setSelectedItem({ ...selectedItem, sectionStatus: updatedSectionStatus });
          
          // Status logic is now handled more strictly by the backend, 
          // but we update the local state for immediate feedback
          const statuses = Object.values(updatedSectionStatus);
          let newStatus = 'under_compliance_review';
          if (statuses.every(s => s === 'approved')) newStatus = 'approved_for_procurement';
          else if (statuses.some(s => s === 'rejected')) newStatus = 'rejected';
          else if (statuses.some(s => s === 'resubmission_required')) newStatus = 'resubmission_required';
          
          setSelectedItem({ ...selectedItem, onboardingStatus: newStatus, sectionStatus: updatedSectionStatus });
        }
        fetchData();
      } else {
        toast.error('Failed to update section status');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const handleConfirmRejection = async () => {
    if (!selectedItem || !activeSectionForRejection) return;
    
    await handleUpdateSectionStatus(
      selectedItem._id, 
      activeSectionForRejection, 
      'rejected', 
      rejectionReason
    );
    
    // Reset and close modal
    setIsRejectModalOpen(false);
    setActiveSectionForRejection('');
    setRejectionReason('');
  };

  const openRejectionModal = (section: string) => {
    setActiveSectionForRejection(section);
    setIsRejectModalOpen(true);
  };

  const handleSendFeedback = async () => {
    if (!selectedItem || !feedback.trim()) return;
    try {
      const res = await api.post('/api/admin/feedback', { userId: selectedItem._id, feedback }, {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        toast.success('Feedback sent to stakeholder');
        setSelectedItem({ ...selectedItem, adminFeedback: feedback });
      } else {
        toast.error('Failed to send feedback');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const getStatusBadge = (onboardingStatus: string) => {
    switch (onboardingStatus) {
      case 'approved_for_procurement': 
        return <Badge variant="success" className="rounded-full px-4 border-2 border-green-100 shadow-sm font-black italic uppercase text-[9px] tracking-widest">Approved for Procurement</Badge>;
      case 'rejected': 
        return <Badge variant="error" className="rounded-full px-4 border-2 border-red-100 shadow-sm font-black italic uppercase text-[9px] tracking-widest">Rejected</Badge>;
      case 'resubmission_required':
        return <Badge variant="warning" className="rounded-full px-4 border-2 border-amber-100 shadow-sm font-black italic uppercase text-[9px] tracking-widest text-amber-700 bg-amber-50">Resubmission Required</Badge>;
      case 'under_compliance_review':
        return <Badge variant="warning" className="rounded-full px-4 border-2 border-blue-100 shadow-sm font-black italic uppercase text-[9px] tracking-widest text-blue-700 bg-blue-50">Under Compliance Review</Badge>;
      case 'verified':
        return <Badge variant="success" className="rounded-full px-4 border-2 border-indigo-100 shadow-sm font-black italic uppercase text-[9px] tracking-widest text-indigo-700 bg-indigo-50">Verified</Badge>;
      case 'pending_validation':
        return <Badge variant="warning" className="rounded-full px-4 border-2 border-slate-100 shadow-sm font-black italic uppercase text-[9px] tracking-widest text-slate-700 bg-slate-50">Pending Validation</Badge>;
      default: 
        return <Badge variant="warning" className="rounded-full px-4 border-2 border-slate-100 shadow-sm font-black italic uppercase text-[9px] tracking-widest text-slate-700 bg-slate-50">{onboardingStatus || 'Pending'}</Badge>;
    }
  };

  const filterData = (data: any[]) => {
    if (!searchTerm) return data;
    return data.filter(item => {
      const name = (item.name || '').toLowerCase();
      const company = (item.profile?.businessName || item.profile?.organizationName || '').toLowerCase();
      const gst = (item.profile?.gst || '').toLowerCase();
      return name.includes(searchTerm.toLowerCase()) || company.includes(searchTerm.toLowerCase()) || gst.includes(searchTerm.toLowerCase());
    });
  };

  const currentData = activeTab === 'sellers' ? filterData(sellers) : filterData(buyers);
  
  const pendingTotal = sellers.filter(s => ['pending', 'pending_validation', 'under_compliance_review'].includes(s.onboardingStatus)).length + 
    buyers.filter(b => ['pending', 'pending_validation', 'under_compliance_review'].includes(b.onboardingStatus)).length;
  const activeSellers = sellers.filter(s => s.onboardingStatus === 'approved_for_procurement').length;
  const activeBuyers = buyers.filter(b => b.onboardingStatus === 'approved_for_procurement').length;
  const totalNetwork = sellers.length + buyers.length;

  const getProgress = (item: any) => {
    if (!item?.sectionStatus) return 0;
    const count = Object.values(item.sectionStatus).filter(s => s === 'approved').length;
    return Math.round((count / 5) * 100);
  };

  return (
    <div className="relative min-h-[calc(100vh-100px)]">
      <div className={cn("space-y-6 pb-20 transition-all duration-300", selectedItem && "blur-sm pointer-events-none")}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-indigo-950 uppercase italic">Registration Management</h1>
            <p className="text-slate-500 font-medium italic">Review and approve new stakeholder registrations.</p>
          </div>
          <div className="flex items-center space-x-3">
              <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600 font-bold uppercase tracking-widest text-[10px]">Export CSV</Button>
              <Button className="rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/20 font-bold uppercase tracking-widest text-[10px]">+ New Entry</Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Pending Approval', value: pendingTotal, color: 'amber' },
            { label: 'Active Sellers', value: activeSellers, color: 'indigo' },
            { label: 'Active Buyers', value: activeBuyers, color: 'blue' },
            { label: 'Total Network', value: totalNetwork, color: 'slate' },
          ].map((stat) => (
            <Card key={stat.label} className="border-none shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 italic">{stat.label}</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
          <CardHeader className="bg-white p-0 border-b border-slate-100">
            <Tabs
              tabs={[
                { id: 'sellers', label: 'Seller Onboarding' },
                { id: 'buyers', label: 'Buyer Onboarding' }
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
              className="px-6 pt-4 space-x-8"
            />
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-6 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50">
              <div className="relative w-full max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  placeholder="Search by Company, GST, or Proprietor Name..." 
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium italic"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="rounded-xl border-slate-200 bg-white font-bold uppercase tracking-tighter text-[10px]">Filter: All Status</Button>
            </div>

            {isLoading ? (
              <div className="py-20 text-center text-slate-400 italic animate-pulse">Scanning database registrations...</div>
            ) : currentData.length === 0 ? (
              <div className="py-20 text-center text-slate-400 border-2 border-dashed border-slate-100 m-6 rounded-2xl italic">
                 No {activeTab} registrations in record.
              </div>
            ) : (
            <>
              {/* Responsive Table for Desktop */}
              <div className="hidden md:block overflow-x-auto no-scrollbar">
                <Table>
                  <TableHeader className="bg-slate-50/80 border-y border-slate-100">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-6 py-4">Full Name</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-6 py-4">Entity Name</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-6 py-4">Budget / Category</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-6 py-4">Submitted At</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-6 py-4">Status</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-6 py-4 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.map((item) => (
                      <TableRow key={item._id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                        <TableCell className="px-6 py-8">
                           <div className="font-bold text-slate-800 text-sm tracking-tight">{item.name}</div>
                        </TableCell>
                        <TableCell className="px-6 py-8">
                          <div className="font-bold text-slate-600 text-sm italic underline decoration-indigo-200 underline-offset-4">{item.profile?.businessName || item.profile?.organizationName || 'N/A'}</div>
                        </TableCell>
                        <TableCell className="px-6 py-8">
                          <div className="space-y-1">
                            <div className="text-[10px] font-black text-indigo-600 uppercase italic">
                              {item.role === 'buyer' ? (item.profile?.annualBudget || 'N/A') : (Array.isArray(item.profile?.productCategories) ? item.profile.productCategories[0] : 'N/A')}
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                              {item.role === 'buyer' ? (item.profile?.procurementCategories?.[0] || 'IT Equipment') : (item.profile?.industry || 'Manufacturing')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-8">
                          <div className="text-xs font-bold text-slate-500 font-mono italic">{new Date(item.createdAt || Date.now()).toISOString().split('T')[0]}</div>
                        </TableCell>
                        <TableCell className="px-6 py-8">
                          <div className="space-y-2">
                            {getStatusBadge(item.onboardingStatus)}
                            <div className="flex space-x-0.5">
                              {['basic', 'business', 'compliance', 'bank', 'documents'].map(section => (
                                <div 
                                  key={section} 
                                  className={cn(
                                    "h-1.5 w-4 rounded-full",
                                    item.sectionStatus?.[section] === 'approved' ? "bg-green-500" : 
                                    item.sectionStatus?.[section] === 'rejected' ? "bg-red-500" : "bg-slate-200"
                                  ) || ""} 
                                  title={`${section}: ${item.sectionStatus?.[section] || 'pending'}`}
                                />
                              ))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-8 text-right">
                           <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItem(item);
                                setFeedback(item.adminFeedback || '');
                              }}
                              className="text-[10px] font-black text-indigo-600 uppercase italic hover:underline hover:text-indigo-800 transition-all decoration-2 underline-offset-4"
                            >
                              Review
                            </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Responsive Card Grid for Mobile */}
              <div className="md:hidden divide-y divide-slate-100">
                {currentData.map((item) => (
                  <div key={item._id} className="p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="font-bold text-slate-800 text-sm tracking-tight">{item.name}</div>
                        <div className="font-bold text-slate-500 text-[10px] italic underline decoration-indigo-200 underline-offset-2">{item.profile?.businessName || item.profile?.organizationName || 'N/A'}</div>
                      </div>
                      {getStatusBadge(item.onboardingStatus)}
                    </div>
                    
                    <div className="flex justify-between items-end">
                      <div className="space-y-2">
                        <div className="text-[10px] font-black text-indigo-600 uppercase italic">
                          {item.role === 'buyer' ? (item.profile?.annualBudget || 'N/A') : (Array.isArray(item.profile?.productCategories) ? item.profile.productCategories[0] : 'N/A')}
                        </div>
                        <div className="flex space-x-0.5">
                          {['basic', 'business', 'compliance', 'bank', 'documents'].map(section => (
                            <div 
                              key={section} 
                              className={cn(
                                "h-1 w-4 rounded-full",
                                item.sectionStatus?.[section] === 'approved' ? "bg-green-500" : 
                                item.sectionStatus?.[section] === 'rejected' ? "bg-red-500" : "bg-slate-200"
                              ) || ""} 
                            />
                          ))}
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedItem(item);
                          setFeedback(item.adminFeedback || '');
                        }}
                        className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase italic"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* FULL SCREEN REVIEW OVERLAY */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 flex items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-7xl h-full bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white z-10 sticky top-0">
               <div>
                 <h2 className="text-xl md:text-2xl font-black text-slate-950 uppercase italic tracking-tight">Application Review</h2>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Detailed Participant Verification Module</p>
               </div>
               <button 
                onClick={() => {
                  setSelectedItem(null);
                  setFeedback('');
                }}
                className="p-3 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-950 transition-all active:scale-90"
               >
                 <X className="h-6 w-6" />
               </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                {/* Left Column: Identity Baseline */}
                <div className="space-y-8">
                   <div className="space-y-4">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic decoration-indigo-400 underline underline-offset-8 decoration-4">Identity Baseline</h3>
                      <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 space-y-6">
                        <div className="flex items-center space-x-4">
                           <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl font-black shadow-xl shadow-indigo-200">
                             {selectedItem.name.charAt(0)}
                           </div>
                           <div>
                              <div className="text-xl font-black text-slate-950 tracking-tight">{selectedItem.name}</div>
                              <div className="text-sm font-bold text-slate-400 italic">{selectedItem.email}</div>
                           </div>
                        </div>
                        <div className="pt-6 border-t border-slate-200">
                          {getStatusBadge(selectedItem.onboardingStatus)}
                        </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Verification Progress</h3>
                         <span className="text-xs font-black text-indigo-600">{getProgress(selectedItem)}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                         <div className={cn("h-full bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/30 transition-all duration-500")} style={{ width: `${getProgress(selectedItem)}%` }} />
                      </div>
                   </div>

                   {/* Quick Status Buttons */}
                   <div className="pt-8 space-y-3">
                      <Button 
                        onClick={() => handleUpdateStatus(selectedItem._id, 'approved_for_procurement')}
                        disabled={selectedItem.status === 'approved_for_procurement'}
                        className="w-full py-8 rounded-2xl bg-green-600 hover:bg-green-700 shadow-xl shadow-green-600/20 font-black uppercase tracking-widest italic space-x-3 transition-all"
                      >
                         <CheckCircle className="h-5 w-5" />
                         <span>Approve Organization</span>
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleUpdateStatus(selectedItem._id, 'resubmission_required')}
                        disabled={selectedItem.status === 'resubmission_required'}
                        className="w-full py-8 rounded-2xl border-2 border-amber-100 text-amber-600 hover:bg-amber-50 hover:border-amber-200 font-black uppercase tracking-widest italic space-x-3 shadow-sm transition-all"
                      >
                         <AlertTriangle className="h-5 w-5" />
                         <span>Request Correction</span>
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleUpdateStatus(selectedItem._id, 'rejected')}
                        disabled={selectedItem.onboardingStatus === 'rejected'}
                        className="w-full py-8 rounded-2xl border-2 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 font-black uppercase tracking-widest italic space-x-3 shadow-sm transition-all"
                      >
                         <XCircle className="h-5 w-5" />
                         <span>Reject Application</span>
                      </Button>
                   </div>

                   {/* Admin Feedback Section */}
                   <div className="pt-8 space-y-4">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic tracking-tight underline underline-offset-8 decoration-indigo-200 decoration-2">Admin Feedback / Query</h3>
                      <div className="p-6 rounded-3xl bg-indigo-50/50 border border-indigo-100 space-y-4 shadow-inner">
                         <textarea 
                           value={feedback}
                           onChange={(e) => setFeedback(e.target.value)}
                           placeholder="Type what is wrong or additional requirements..."
                           className="w-full h-32 p-4 rounded-xl border border-indigo-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium italic resize-none"
                         />
                         <Button 
                           onClick={handleSendFeedback}
                           className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest text-[10px] py-4 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                         >
                            Send Feedback / Message
                         </Button>
                      </div>
                   </div>
                </div>

                {/* Right Area: Structured Sections (Grid col-span-2) */}
                <div className="lg:col-span-2 space-y-12">
                   {/* Section 1: Basic Information */}
                   <div className="group">
                      <div className="flex items-center justify-between mb-6 pb-2 border-b-2 border-slate-100 group-hover:border-indigo-200 transition-colors">
                        <div className="flex items-center space-x-3">
                           <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                             <ShieldCheck className="h-4 w-4" />
                           </div>
                           <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest italic">1. Basic Information</h4>
                        </div>
                        <div className="flex space-x-2">
                           <button 
                            onClick={() => handleUpdateSectionStatus(selectedItem._id, 'basic', 'approved')}
                            className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-all", 
                              selectedItem.sectionStatus?.basic === 'approved' ? "bg-green-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-green-500 hover:text-white"
                            )}
                           >
                             <Check className="h-3 w-3" />
                           </button>
                           <button 
                            onClick={() => openRejectionModal('basic')}
                            className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-all", 
                              selectedItem.sectionStatus?.basic === 'rejected' ? "bg-red-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-red-500 hover:text-white"
                            )}
                           >
                             <X className="h-3 w-3" />
                           </button>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-8">
                         <InfoItem label="Business Name" value={selectedItem.profile?.businessName || selectedItem.profile?.organizationName} highlight />
                         <InfoItem label="Business Type" value={selectedItem.profile?.businessType} />
                         <InfoItem label="Incorporation Date" value={selectedItem.profile?.dateOfIncorporation ? new Date(selectedItem.profile.dateOfIncorporation).toLocaleDateString() : 'N/A'} />
                         <InfoItem label="Legal Entity" value={selectedItem.profile?.legalEntityType || 'N/A'} />
                      </div>
                   </div>

                   {/* Section 2: Business Details */}
                   <div className="group">
                      <div className="flex items-center justify-between mb-6 pb-2 border-b-2 border-slate-100 group-hover:border-indigo-200 transition-colors">
                        <div className="flex items-center space-x-3">
                           <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                             <MapPin className="h-4 w-4" />
                           </div>
                           <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest italic">2. Business Details</h4>
                        </div>
                        <div className="flex space-x-2">
                           <button 
                            onClick={() => handleUpdateSectionStatus(selectedItem._id, 'business', 'approved')}
                            className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-all", 
                              selectedItem.sectionStatus?.business === 'approved' ? "bg-green-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-green-500 hover:text-white"
                            )}
                           >
                             <Check className="h-3 w-3" />
                           </button>
                           <button 
                            onClick={() => openRejectionModal('business')}
                            className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-all", 
                              selectedItem.sectionStatus?.business === 'rejected' ? "bg-red-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-red-500 hover:text-white"
                            )}
                           >
                             <X className="h-3 w-3" />
                           </button>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-8">
                         <div className="md:col-span-2">
                           <InfoItem label="Registered Address" value={selectedItem.profile?.fullAddress || selectedItem.profile?.registeredAddress} />
                         </div>
                         <InfoItem label="City" value={selectedItem.profile?.city} />
                         <InfoItem label="State" value={selectedItem.profile?.state} />
                         <InfoItem label="Pincode" value={selectedItem.profile?.pincode} />
                         <InfoItem label="Aggregate Turnover" value={selectedItem.profile?.turnover || selectedItem.profile?.annualBudget || 'N/A'} highlight />
                      </div>
                   </div>

                   {/* Section 3: Compliance */}
                   <div className="group">
                      <div className="flex items-center justify-between mb-6 pb-2 border-b-2 border-slate-100 group-hover:border-indigo-200 transition-colors">
                        <div className="flex items-center space-x-3">
                           <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                             <Briefcase className="h-4 w-4" />
                           </div>
                           <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest italic">3. Compliance (GST/PAN)</h4>
                        </div>
                        <div className="flex space-x-2">
                           <button 
                            onClick={() => handleUpdateSectionStatus(selectedItem._id, 'compliance', 'approved')}
                            className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-all", 
                              selectedItem.sectionStatus?.compliance === 'approved' ? "bg-green-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-green-500 hover:text-white"
                            )}
                           >
                             <Check className="h-3 w-3" />
                           </button>
                           <button 
                            onClick={() => openRejectionModal('compliance')}
                            className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-all", 
                              selectedItem.sectionStatus?.compliance === 'rejected' ? "bg-red-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-red-500 hover:text-white"
                            )}
                           >
                             <X className="h-3 w-3" />
                           </button>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-8">
                         <InfoItem label="PAN Number" value={selectedItem.profile?.pan} mono highlight />
                         <InfoItem label="GST Number" value={selectedItem.profile?.gst || 'N/A'} mono highlight />
                         <InfoItem label="Aadhaar Number" value={selectedItem.profile?.aadhaarNumber || 'N/A'} mono />
                         <InfoItem label="Udyam Number" value={selectedItem.profile?.udyam || 'N/A'} mono />
                      </div>
                   </div>

                   {/* Section 4: Bank Details */}
                   <div className="group">
                      <div className="flex items-center justify-between mb-6 pb-2 border-b-2 border-slate-100 group-hover:border-indigo-200 transition-colors">
                        <div className="flex items-center space-x-3">
                           <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                             <Building2 className="h-4 w-4" />
                           </div>
                           <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest italic">4. Bank Details</h4>
                        </div>
                        <div className="flex space-x-2">
                           <button 
                            onClick={() => handleUpdateSectionStatus(selectedItem._id, 'bank', 'approved')}
                            className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-all", 
                              selectedItem.sectionStatus?.bank === 'approved' ? "bg-green-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-green-500 hover:text-white"
                            )}
                           >
                             <Check className="h-3 w-3" />
                           </button>
                           <button 
                            onClick={() => openRejectionModal('bank')}
                            className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-all", 
                              selectedItem.sectionStatus?.bank === 'rejected' ? "bg-red-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-red-500 hover:text-white"
                            )}
                           >
                             <X className="h-3 w-3" />
                           </button>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-8">
                         <InfoItem label="Bank Account" value={selectedItem.profile?.bankAccount || 'N/A'} mono />
                         <InfoItem label="IFSC Code" value={selectedItem.profile?.ifsc || 'N/A'} mono />
                         <div className="md:col-span-2">
                           <InfoItem label="Branch Name" value={selectedItem.profile?.branchName || 'N/A'} />
                         </div>
                      </div>
                   </div>

                   {/* Section 5: Documents */}
                   <div className="group pb-12">
                      <div className="flex items-center justify-between mb-6 pb-2 border-b-2 border-slate-100 group-hover:border-indigo-200 transition-colors">
                        <div className="flex items-center space-x-3">
                           <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                             <FileText className="h-4 w-4" />
                           </div>
                           <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest italic">5. Documents</h4>
                        </div>
                        <div className="flex space-x-2">
                           <button 
                            onClick={() => handleUpdateSectionStatus(selectedItem._id, 'documents', 'approved')}
                            className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-all", 
                              selectedItem.sectionStatus?.documents === 'approved' ? "bg-green-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-green-500 hover:text-white"
                            )}
                           >
                             <Check className="h-3 w-3" />
                           </button>
                           <button 
                            onClick={() => openRejectionModal('documents')}
                            className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-all", 
                              selectedItem.sectionStatus?.documents === 'rejected' ? "bg-red-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-red-500 hover:text-white"
                            )}
                           >
                             <X className="h-3 w-3" />
                           </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         {selectedItem.profile?.documents ? (
                           Object.entries(selectedItem.profile.documents).map(([key, url]: [string, any]) => (
                             url ? (
                               <a 
                                 key={key} 
                                 href={url} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 onClick={(e) => e.stopPropagation()}
                                 className="group/doc flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-400 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/10 transition-all text-left"
                               >
                                 <span className="text-[10px] font-black text-slate-500 group-hover/doc:text-indigo-600 uppercase tracking-tighter">
                                   {key.replace(/([A-Z])/g, ' $1').trim()}
                                 </span>
                                 <div className="flex items-center gap-2">
                                   <Badge variant="success" className="text-[8px] px-1 py-0 rounded">VIEW</Badge>
                                   <FileText className="h-3 w-3 text-slate-300 group-hover/doc:text-indigo-400" />
                                 </div>
                               </a>
                             ) : null
                           ))
                         ) : (
                           <p className="text-[10px] font-bold text-slate-400 italic col-span-2">No documents uploaded yet.</p>
                         )}
                      </div>
                   </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-center">
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">End of application record for verification</p>
            </div>
          </div>
        </div>
      )}
      {/* REJECTION REASON MODAL */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => {
              setIsRejectModalOpen(false);
              setRejectionReason('');
            }}
          />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">Provide Rejection Reason</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Section: {activeSectionForRejection}</p>
              </div>
              <button 
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setRejectionReason('');
                }}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-medium text-slate-500 italic">
                Please specify why this section is being rejected. This feedback will be visible to the {selectedItem?.role}.
              </p>
              <textarea 
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Uploaded documents are incorrect or unreadable..."
                className="w-full h-32 p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all font-medium italic resize-none shadow-inner"
                autoFocus
              />
            </div>

            <div className="flex flex-col space-y-3">
              <Button 
                onClick={handleConfirmRejection}
                disabled={!rejectionReason.trim()}
                className="w-full py-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest italic shadow-lg shadow-red-600/20 active:scale-95 transition-all"
              >
                Confirm Rejection
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setRejectionReason('');
                }}
                className="w-full py-6 rounded-xl border-2 border-slate-100 text-slate-400 hover:bg-slate-50 font-black uppercase tracking-widest italic transition-all"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value, mono = false, highlight = false }: { label: string, value?: string, mono?: boolean, highlight?: boolean }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{label}</p>
      <p className={cn(
        "text-sm font-bold tracking-tight transition-all",
        highlight ? "text-indigo-900" : "text-slate-700",
        mono && "font-mono"
      )}>
        {value || 'Not Provided'}
      </p>
    </div>
  );
}
