import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from '../components/ui/card';
import { Tabs } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { Search, Eye, CheckCircle, XCircle, Users, ShoppingBag, X, FileText, Check, ShieldCheck, MapPin, Building2, Briefcase, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminOnboarding() {
  const authOptions = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
  const cachedData = api.peek('/api/admin/onboarding', authOptions);
  const [sellers, setSellers] = useState<any[]>(cachedData?.sellers || []);
  const [buyers, setBuyers] = useState<any[]>(cachedData?.buyers || []);
  const [activeTab, setActiveTab] = useState('sellers');
  const [isLoading, setIsLoading] = useState(!cachedData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [feedback, setFeedback] = useState('');

  // Rejection Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [activeSectionForRejection, setActiveSectionForRejection] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchData = async () => {
    if (!cachedData) setIsLoading(true);
    try {
      const res = await api.fetch('/api/admin/onboarding', authOptions);
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
            pan: 'approved',
            details: 'approved',
            additional: 'approved',
            offices: 'approved',
            bank: 'approved',
            einvoicing: 'approved',
            ownership: 'approved'
          } : status === 'rejected' ? {
            pan: 'rejected',
            details: 'rejected',
            additional: 'rejected',
            offices: 'rejected',
            bank: 'rejected',
            einvoicing: 'rejected',
            ownership: 'rejected'
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
            ...(selectedItem.sectionStatus || { pan: 'pending', details: 'pending', additional: 'pending', offices: 'pending', bank: 'pending', einvoicing: 'pending', ownership: 'pending' }), 
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
        return <Badge variant="success" className="rounded-full px-4 border-2 border-green-100 shadow-sm font-black uppercase text-[9px] tracking-widest">Approved for Procurement</Badge>;
      case 'rejected': 
        return <Badge variant="error" className="rounded-full px-4 border-2 border-red-100 shadow-sm font-black uppercase text-[9px] tracking-widest">Rejected</Badge>;
      case 'resubmission_required':
        return <Badge variant="warning" className="rounded-full px-4 border-2 border-amber-100 shadow-sm font-black uppercase text-[9px] tracking-widest text-amber-700 bg-amber-50">Resubmission Required</Badge>;
      case 'under_compliance_review':
        return <Badge variant="warning" className="rounded-full px-4 border-2 border-blue-100 shadow-sm font-black uppercase text-[9px] tracking-widest text-blue-700 bg-blue-50">Under Compliance Review</Badge>;
      case 'verified':
        return <Badge variant="success" className="rounded-full px-4 border-2 border-indigo-100 shadow-sm font-black uppercase text-[9px] tracking-widest text-indigo-700 bg-indigo-50">Verified</Badge>;
      case 'pending_validation':
        return <Badge variant="warning" className="rounded-full px-4 border-2 border-slate-100 shadow-sm font-black uppercase text-[9px] tracking-widest text-slate-700 bg-slate-50">Pending Validation</Badge>;
      default: 
        return <Badge variant="warning" className="rounded-full px-4 border-2 border-slate-100 shadow-sm font-black uppercase text-[9px] tracking-widest text-slate-700 bg-slate-50">{onboardingStatus || 'Pending'}</Badge>;
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
    const sections = item.role === 'buyer' 
      ? ['org', 'rep', 'address', 'procurement', 'docs']
      : ['pan', 'details', 'additional', 'offices', 'bank', 'einvoicing', 'ownership'];
    const count = Object.values(item.sectionStatus).filter(s => s === 'approved').length;
    return Math.round((count / sections.length) * 100);
  };

  return (
    <div className="relative min-h-[calc(100vh-100px)]">
      <div className={cn("space-y-6 pb-20 transition-all duration-300", selectedItem && "blur-sm pointer-events-none")}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-indigo-950 uppercase">Registration Management</h1>
            <p className="text-slate-500 font-medium">Review and approve new stakeholder registrations.</p>
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
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                <p className="text-base font-black text-slate-900 tracking-tighter">{stat.value}</p>
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
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="rounded-xl border-slate-200 bg-white font-bold uppercase tracking-tighter text-[10px]">Filter: All Status</Button>
            </div>

            {isLoading ? (
              <div className="py-20 text-center text-slate-400 animate-pulse">Scanning database registrations...</div>
            ) : currentData.length === 0 ? (
              <div className="py-20 text-center text-slate-400 border-2 border-dashed border-slate-100 m-6 rounded-2xl">
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
                           <div className="font-bold text-slate-800 text-xs tracking-tight">{item.name}</div>
                        </TableCell>
                        <TableCell className="px-6 py-8">
                          <div className="font-bold text-slate-600 text-xs underline decoration-indigo-200 underline-offset-4">{item.profile?.businessName || item.profile?.organizationName || 'N/A'}</div>
                        </TableCell>
                        <TableCell className="px-6 py-8">
                          <div className="space-y-1">
                            <div className="text-[10px] font-black text-indigo-600 uppercase">
                              {item.role === 'buyer' ? (item.profile?.annualBudget || 'N/A') : (Array.isArray(item.profile?.productCategories) ? item.profile.productCategories[0] : 'N/A')}
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                              {item.role === 'buyer' ? (item.profile?.procurementCategories?.[0] || 'IT Equipment') : (item.profile?.industry || 'Manufacturing')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-8">
                          <div className="text-xs font-bold text-slate-500 font-mono">{new Date(item.createdAt || Date.now()).toISOString().split('T')[0]}</div>
                        </TableCell>
                        <TableCell className="px-6 py-8">
                          <div className="space-y-2">
                            {getStatusBadge(item.onboardingStatus)}
                            <div className="flex space-x-0.5">
                              {['pan', 'details', 'additional', 'offices', 'bank', 'einvoicing', 'ownership'].map(section => (
                                <div 
                                  key={section} 
                                  className={cn(
                                    "h-1.5 w-3 rounded-full",
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
                              className="text-[10px] font-black text-indigo-600 uppercase hover:underline hover:text-indigo-800 transition-all decoration-2 underline-offset-4"
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
                        <div className="font-bold text-slate-800 text-xs tracking-tight">{item.name}</div>
                        <div className="font-bold text-slate-500 text-[10px] underline decoration-indigo-200 underline-offset-2">{item.profile?.businessName || item.profile?.organizationName || 'N/A'}</div>
                      </div>
                      {getStatusBadge(item.onboardingStatus)}
                    </div>
                    
                    <div className="flex justify-between items-end">
                      <div className="space-y-2">
                        <div className="text-[10px] font-black text-indigo-600 uppercase">
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
                        className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1f3a]/80 p-2 animate-in fade-in duration-300 md:p-4">
          <div className="flex h-[95dvh] w-full max-w-[1300px] flex-col overflow-hidden rounded-lg border border-slate-300 bg-white shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="relative z-10 flex items-center justify-between border-b border-slate-200 bg-[#12335f] px-6 py-4 text-white md:px-8">
               <div className="space-y-1">
                 <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100">Registration Scrutiny Desk</p>
                 <h2 className="text-lg font-extrabold uppercase leading-none tracking-tight md:text-xl">Application Review</h2>
                 <p className="text-xs font-medium text-blue-100">Detailed participant verification and compliance decision module</p>
               </div>
               <button 
                onClick={() => {
                  setSelectedItem(null);
                  setFeedback('');
                }}
                className="flex h-10 w-10 items-center justify-center rounded-md border border-white/20 bg-white/10 text-white transition-all hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-[#f9a825]"
                aria-label="Close application review"
               >
                 <X className="h-5 w-5" />
               </button>
            </div>

            {/* Content Area */}
            <div className="relative flex-1 space-y-8 overflow-y-auto bg-slate-50 p-4 md:p-6 lg:p-8">
              <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                {/* Left Column: Identity Baseline */}
                <div className="space-y-5 lg:sticky lg:top-0 lg:col-span-4">
                   <div className="space-y-3">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#12335f]">Identity Baseline</h3>
                        <div className="h-0.5 w-20 rounded-full bg-[#f9a825]" />
                      </div>
                      <div className="relative space-y-6 overflow-hidden rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-start gap-5">
                           <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-[#12335f] text-base font-extrabold text-white shadow-sm">
                             {selectedItem.name.charAt(0).toUpperCase()}
                           </div>
                           <div className="space-y-1 min-w-0 pt-1">
                              <div className="truncate text-base font-extrabold leading-none tracking-tight text-slate-900">{selectedItem.name}</div>
                              <div className="truncate text-xs font-semibold lowercase text-slate-500">{selectedItem.email}</div>
                              <div className="mt-3 inline-flex rounded border border-blue-100 bg-blue-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#12335f]">
                                ID: {selectedItem.registrationDetails?.userId || selectedItem.name.toUpperCase().replace(/\s+/g, '-')}
                              </div>
                           </div>
                        </div>
                        <div className="flex pt-3 border-t border-slate-200/50">
                           <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
                             Under Compliance Review
                           </div>
                        </div>
                      </div>
                   </div>

                   <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                         <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Verification Progress</h3>
                         <span className="text-xs font-extrabold text-[#12335f]">{getProgress(selectedItem)}%</span>
                      </div>
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                         <div className="h-full rounded-full bg-[#0f766e] transition-all duration-700" style={{ width: `${getProgress(selectedItem)}%` }} />
                      </div>
                   </div>

                   {/* Quick Status Buttons */}
                   <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                      <Button 
                        onClick={() => handleUpdateStatus(selectedItem._id, 'approved_for_procurement')}
                        disabled={selectedItem.status === 'approved_for_procurement'}
                        className="h-12 w-full rounded-md bg-[#0f766e] font-bold uppercase tracking-wide text-white hover:bg-[#0b5f59]"
                      >
                         <CheckCircle className="h-5 w-5" />
                         <span>Approve Organization</span>
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleUpdateStatus(selectedItem._id, 'resubmission_required')}
                        disabled={selectedItem.status === 'resubmission_required'}
                        className="h-12 w-full rounded-md border-amber-300 bg-white font-bold uppercase tracking-wide text-amber-700 hover:bg-amber-50"
                      >
                         <AlertTriangle className="h-5 w-5" />
                         <span>Request Correction</span>
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleUpdateStatus(selectedItem._id, 'rejected')}
                        disabled={selectedItem.onboardingStatus === 'rejected'}
                        className="h-12 w-full rounded-md border-red-300 bg-white font-bold uppercase tracking-wide text-red-700 hover:bg-red-50"
                      >
                         <XCircle className="h-5 w-5" />
                         <span>Reject Application</span>
                      </Button>
                   </div>

                   {/* Admin Feedback Section */}
                   <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                      <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Admin Feedback / Query</h3>
                      <div className="space-y-4">
                         <textarea 
                           value={feedback}
                           onChange={(e) => setFeedback(e.target.value)}
                           placeholder="Type feedback..."
                           className="h-24 w-full resize-none rounded-md border border-slate-300 bg-white p-3 text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#12335f]"
                         />
                         <Button 
                           onClick={handleSendFeedback}
                           className="h-10 w-full rounded-md bg-[#12335f] text-[10px] font-bold uppercase tracking-wide text-white hover:bg-[#0b2445]"
                         >
                            Send Message
                         </Button>
                      </div>
                   </div>
                </div>

                {/* Right Area: Structured Sections */}
                <div className="lg:col-span-8 space-y-6">
                    {selectedItem.role === 'buyer' ? (
                      <>
                        {/* Buyer Section 1: Org */}
                         <div className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm animate-in slide-in-from-bottom-4 duration-300">
                           <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100 relative">
                             <div className="flex items-center space-x-3">
                                <div className="w-9 h-9 rounded-md bg-blue-50 text-[#12335f] flex items-center justify-center shadow-sm">
                                  <Building2 className="h-4 w-4" />
                                </div>
                                <h4 className="text-xs font-extrabold text-[#12335f] uppercase tracking-wide">1. Organization Details</h4>
                             </div>
                             <div className="flex items-center space-x-2">
                                <button onClick={() => handleUpdateSectionStatus(selectedItem._id, 'org', 'approved')} className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-sm", selectedItem.sectionStatus?.org === 'approved' ? "bg-green-500 border-green-600 text-white" : "bg-white border-slate-200 text-slate-300 hover:bg-green-50 hover:text-green-600 hover:border-green-300")}><Check className="h-4 w-4" /></button>
                                <button onClick={() => openRejectionModal('org')} className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-sm", selectedItem.sectionStatus?.org === 'rejected' ? "bg-red-500 border-red-600 text-white" : "bg-white border-slate-200 text-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300")}><X className="h-4 w-4" /></button>
                             </div>
                           </div>
                           <div className="grid md:grid-cols-2 gap-8">
                              <InfoItem label="Organization Name" value={selectedItem.profile?.organizationName} highlight />
                              <InfoItem label="Business Type" value={selectedItem.profile?.businessType} />
                              <InfoItem label="Industry" value={selectedItem.profile?.industry} />
                              <InfoItem label="PAN" value={selectedItem.profile?.pan} mono highlight />
                              <InfoItem label="CIN" value={selectedItem.profile?.cin} />
                              <InfoItem label="GST" value={selectedItem.profile?.gst} />
                              <InfoItem label="Website" value={selectedItem.profile?.website} />
                              <InfoItem label="State" value={selectedItem.profile?.state} highlight />
                              <InfoItem label="District" value={selectedItem.profile?.district} highlight />
                              <InfoItem label="Office/Zone" value={selectedItem.profile?.officeZoneName} />
                           </div>
                        </div>

                        {/* Buyer Section 2: Rep */}
                         <div className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm animate-in slide-in-from-bottom-4 duration-300 delay-75">
                           <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100 relative">
                             <div className="flex items-center space-x-3">
                                <div className="w-9 h-9 rounded-md bg-blue-50 text-[#12335f] flex items-center justify-center shadow-sm">
                                  <Users className="h-4 w-4" />
                                </div>
                                <h4 className="text-xs font-extrabold text-[#12335f] uppercase tracking-wide">2. Authorized Representative</h4>
                             </div>
                             <div className="flex items-center space-x-2">
                                <button onClick={() => handleUpdateSectionStatus(selectedItem._id, 'rep', 'approved')} className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-sm", selectedItem.sectionStatus?.rep === 'approved' ? "bg-green-500 border-green-600 text-white" : "bg-white border-slate-200 text-slate-300 hover:bg-green-50 hover:text-green-600 hover:border-green-300")}><Check className="h-4 w-4" /></button>
                                <button onClick={() => openRejectionModal('rep')} className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-sm", selectedItem.sectionStatus?.rep === 'rejected' ? "bg-red-500 border-red-600 text-white" : "bg-white border-slate-200 text-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300")}><X className="h-4 w-4" /></button>
                             </div>
                           </div>
                           <div className="grid md:grid-cols-2 gap-8">
                              <InfoItem label="Representative Name" value={selectedItem.profile?.representativeName} highlight />
                              <InfoItem label="Designation" value={selectedItem.profile?.designation} />
                              <InfoItem label="Department" value={selectedItem.profile?.department} />
                              <InfoItem label="Official Email" value={selectedItem.profile?.email} />
                              <InfoItem label="Mobile Number" value={selectedItem.profile?.mobile} highlight />
                              <InfoItem label="Alternate Mobile" value={selectedItem.profile?.alternateMobile} />
                           </div>
                        </div>

                        {/* Buyer Section 3: Address */}
                         <div className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm animate-in slide-in-from-bottom-4 duration-300">
                           <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100 relative">
                             <div className="flex items-center space-x-3">
                                <div className="w-9 h-9 rounded-md bg-blue-50 text-[#12335f] flex items-center justify-center shadow-sm">
                                  <MapPin className="h-4 w-4" />
                                </div>
                                <h4 className="text-xs font-extrabold text-[#12335f] uppercase tracking-wide">3. Address Details</h4>
                             </div>
                             <div className="flex items-center space-x-2">
                                <button onClick={() => handleUpdateSectionStatus(selectedItem._id, 'address', 'approved')} className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-sm", selectedItem.sectionStatus?.address === 'approved' ? "bg-green-500 border-green-600 text-white" : "bg-white border-slate-200 text-slate-300 hover:bg-green-50 hover:text-green-600 hover:border-green-300")}><Check className="h-4 w-4" /></button>
                                <button onClick={() => openRejectionModal('address')} className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-sm", selectedItem.sectionStatus?.address === 'rejected' ? "bg-red-500 border-red-600 text-white" : "bg-white border-slate-200 text-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300")}><X className="h-4 w-4" /></button>
                             </div>
                           </div>
                           <div className="grid md:grid-cols-2 gap-8">
                              <InfoItem label="Country" value={selectedItem.profile?.country} />
                              <InfoItem label="State" value={selectedItem.profile?.state} />
                              <InfoItem label="City" value={selectedItem.profile?.city} />
                              <InfoItem label="Pincode" value={selectedItem.profile?.pincode} />
                              <div className="md:col-span-2">
                                 <InfoItem label="Registered Address" value={selectedItem.profile?.registeredAddress} />
                              </div>
                           </div>
                        </div>

                        {/* Buyer Section 4: Procurement */}
                         <div className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm animate-in slide-in-from-bottom-4 duration-300">
                           <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100 relative">
                             <div className="flex items-center space-x-3">
                                <div className="w-9 h-9 rounded-md bg-blue-50 text-[#12335f] flex items-center justify-center shadow-sm">
                                  <ShoppingBag className="h-4 w-4" />
                                </div>
                                <h4 className="text-xs font-extrabold text-[#12335f] uppercase tracking-wide">4. Procurement Profile</h4>
                             </div>
                             <div className="flex items-center space-x-2">
                                <button onClick={() => handleUpdateSectionStatus(selectedItem._id, 'procurement', 'approved')} className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-sm", selectedItem.sectionStatus?.procurement === 'approved' ? "bg-green-500 border-green-600 text-white" : "bg-white border-slate-200 text-slate-300 hover:bg-green-50 hover:text-green-600 hover:border-green-300")}><Check className="h-4 w-4" /></button>
                                <button onClick={() => openRejectionModal('procurement')} className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-sm", selectedItem.sectionStatus?.procurement === 'rejected' ? "bg-red-500 border-red-600 text-white" : "bg-white border-slate-200 text-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300")}><X className="h-4 w-4" /></button>
                             </div>
                           </div>
                           <div className="grid md:grid-cols-2 gap-8">
                              <InfoItem label="Annual Budget" value={selectedItem.profile?.annualBudget} highlight />
                              <div className="md:col-span-2">
                                 <InfoItem label="Procurement Categories" value={selectedItem.profile?.procurementCategories?.join(', ')} highlight />
                              </div>
                              <div className="md:col-span-2">
                                 <InfoItem label="Preferred Methods" value={selectedItem.profile?.preferredMethods?.join(', ')} />
                              </div>
                           </div>
                        </div>

                        {/* Buyer Section 5: Documents */}
                         <div className="group rounded-lg border border-slate-200 bg-white p-5 pb-6 shadow-sm animate-in slide-in-from-bottom-4 duration-300">
                           <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100 relative">
                             <div className="flex items-center space-x-3">
                                <div className="w-9 h-9 rounded-md bg-blue-50 text-[#12335f] flex items-center justify-center shadow-sm">
                                  <FileText className="h-4 w-4" />
                                </div>
                                <h4 className="text-xs font-extrabold text-[#12335f] uppercase tracking-wide">5. Verification Documents</h4>
                             </div>
                             <div className="flex items-center space-x-2">
                                <button onClick={() => handleUpdateSectionStatus(selectedItem._id, 'docs', 'approved')} className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-sm", selectedItem.sectionStatus?.docs === 'approved' ? "bg-green-500 border-green-600 text-white" : "bg-white border-slate-200 text-slate-300 hover:bg-green-50 hover:text-green-600 hover:border-green-300")}><Check className="h-4 w-4" /></button>
                                <button onClick={() => openRejectionModal('docs')} className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-sm", selectedItem.sectionStatus?.docs === 'rejected' ? "bg-red-500 border-red-600 text-white" : "bg-white border-slate-200 text-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300")}><X className="h-4 w-4" /></button>
                             </div>
                           </div>
                           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {selectedItem.profile?.documents && Object.entries(selectedItem.profile.documents).map(([key, url]: [string, any]) => (
                                url && (
                                  <div key={key} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                                     <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{key}</p>
                                     <a href={url} target="_blank" rel="noreferrer" className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1">
                                       <Eye className="h-3 w-3" /> View Document
                                     </a>
                                  </div>
                                )
                              ))}
                           </div>
                        </div>
                      </>
                    ) : (
                      <>

                   {/* Section 1: PAN */}
                   <div className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm animate-in slide-in-from-bottom-4 duration-300">
                      <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100 relative">
                        <div className="flex items-center space-x-3">
                           <div className="w-9 h-9 rounded-md bg-blue-50 text-[#12335f] flex items-center justify-center shadow-sm">
                             <ShieldCheck className="h-4 w-4" />
                           </div>
                           <h4 className="text-xs font-extrabold text-[#12335f] uppercase tracking-wide">1. Business PAN Validation</h4>
                        </div>
                        <div className="flex items-center space-x-2">
                           <button onClick={() => handleUpdateSectionStatus(selectedItem._id, 'pan', 'approved')} className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-sm", selectedItem.sectionStatus?.pan === 'approved' ? "bg-green-500 border-green-600 text-white" : "bg-white border-slate-200 text-slate-300 hover:bg-green-50 hover:text-green-600 hover:border-green-300")}><Check className="h-4 w-4" /></button>
                           <button onClick={() => openRejectionModal('pan')} className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-sm", selectedItem.sectionStatus?.pan === 'rejected' ? "bg-red-500 border-red-600 text-white" : "bg-white border-slate-200 text-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300")}><X className="h-4 w-4" /></button>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-8">
                         <InfoItem label="PAN Number" value={selectedItem.profile?.pan} mono highlight />
                         <InfoItem label="Name in PAN" value={selectedItem.profile?.nameAsInPan} />
                         <InfoItem label="Date in PAN" value={selectedItem.profile?.dateAsInPan ? new Date(selectedItem.profile.dateAsInPan).toLocaleDateString() : 'N/A'} />
                         <InfoItem label="Verification Status" value={selectedItem.profile?.panVerified ? 'VERIFIED' : 'PENDING'} highlight />
                      </div>
                   </div>

                   {/* Section 2: Details */}
                   <div className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm animate-in slide-in-from-bottom-4 duration-300 delay-75">
                      <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100 relative">
                        <div className="flex items-center space-x-3">
                           <div className="w-9 h-9 rounded-md bg-blue-50 text-[#12335f] flex items-center justify-center shadow-sm">
                             <Building2 className="h-4 w-4" />
                           </div>
                           <h4 className="text-xs font-extrabold text-[#12335f] uppercase tracking-wide">2. Business Details</h4>
                        </div>
                        <div className="flex items-center space-x-2">
                           <button onClick={() => handleUpdateSectionStatus(selectedItem._id, 'details', 'approved')} className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-sm", selectedItem.sectionStatus?.details === 'approved' ? "bg-green-500 border-green-600 text-white" : "bg-white border-slate-200 text-slate-300 hover:bg-green-50 hover:text-green-600 hover:border-green-300")}><Check className="h-4 w-4" /></button>
                           <button onClick={() => openRejectionModal('details')} className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-sm", selectedItem.sectionStatus?.details === 'rejected' ? "bg-red-500 border-red-600 text-white" : "bg-white border-slate-200 text-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300")}><X className="h-4 w-4" /></button>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-8">
                         <InfoItem label="Organization Name" value={selectedItem.profile?.businessName} highlight />
                         <InfoItem label="Date of Incorporation" value={selectedItem.profile?.dateOfIncorporation ? new Date(selectedItem.profile.dateOfIncorporation).toLocaleDateString() : 'N/A'} />
                      </div>
                   </div>

                   {/* Section 3: Additional */}
                   <div className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm animate-in slide-in-from-bottom-4 duration-300">
                      <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100 relative">
                        <div className="flex items-center space-x-3">
                           <div className="w-9 h-9 rounded-md bg-blue-50 text-[#12335f] flex items-center justify-center shadow-sm">
                             <Briefcase className="h-4 w-4" />
                           </div>
                           <h4 className="text-xs font-extrabold text-[#12335f] uppercase tracking-wide">3. Additional Details</h4>
                        </div>
                        <div className="flex items-center space-x-2">
                           <button onClick={() => handleUpdateSectionStatus(selectedItem._id, 'additional', 'approved')} className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-sm", selectedItem.sectionStatus?.additional === 'approved' ? "bg-green-500 border-green-600 text-white" : "bg-white border-slate-200 text-slate-300 hover:bg-green-50 hover:text-green-600 hover:border-green-300")}><Check className="h-4 w-4" /></button>
                           <button onClick={() => openRejectionModal('additional')} className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-sm", selectedItem.sectionStatus?.additional === 'rejected' ? "bg-red-500 border-red-600 text-white" : "bg-white border-slate-200 text-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300")}><X className="h-4 w-4" /></button>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-8">
                         <InfoItem label="Startup Status" value={selectedItem.profile?.isStartup ? 'YES' : 'NO'} />
                         <InfoItem label="Udyam Certified" value={selectedItem.profile?.isUdyamCertified ? 'YES' : 'NO'} />
                         <InfoItem label="Bid Participation" value={selectedItem.profile?.participateInBid ? 'YES' : 'NO'} />
                      </div>
                   </div>

                   {/* Section 4: Offices */}
                   <div className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm animate-in slide-in-from-bottom-4 duration-300">
                      <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100 relative">
                        <div className="flex items-center space-x-3">
                           <div className="w-9 h-9 rounded-md bg-blue-50 text-[#12335f] flex items-center justify-center shadow-sm">
                             <MapPin className="h-4 w-4" />
                           </div>
                           <h4 className="text-xs font-extrabold text-[#12335f] uppercase tracking-wide">4. Office Locations</h4>
                        </div>
                        <div className="flex items-center space-x-2">
                           <button onClick={() => handleUpdateSectionStatus(selectedItem._id, 'offices', 'approved')} className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-sm", selectedItem.sectionStatus?.offices === 'approved' ? "bg-green-500 border-green-600 text-white" : "bg-white border-slate-200 text-slate-300 hover:bg-green-50 hover:text-green-600 hover:border-green-300")}><Check className="h-4 w-4" /></button>
                           <button onClick={() => openRejectionModal('offices')} className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-sm", selectedItem.sectionStatus?.offices === 'rejected' ? "bg-red-500 border-red-600 text-white" : "bg-white border-slate-200 text-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300")}><X className="h-4 w-4" /></button>
                        </div>
                      </div>
                      <div className="space-y-4">
                         {selectedItem.profile?.offices?.map((office: any) => (
                           <div key={office.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-start">
                              <div className="space-y-1">
                                 <p className="text-xs font-extrabold text-slate-900 uppercase">{office.name} <span className="text-[10px] font-bold text-[#12335f] bg-blue-50 px-2 py-0.5 rounded-full ml-2">{office.type}</span></p>
                                 <p className="text-[11px] font-medium text-slate-600 uppercase">{office.address}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{office.city}, {office.state} - {office.pincode}</p>
                              </div>
                              {office.gstRegistered && <Badge variant="success" className="text-[8px]">GST REG</Badge>}
                           </div>
                         ))}
                         {(!selectedItem.profile?.offices || selectedItem.profile.offices.length === 0) && <p className="text-[10px] font-bold text-slate-400">No offices registered.</p>}
                      </div>
                   </div>

                   {/* Section 5: Bank */}
                   <div className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm animate-in slide-in-from-bottom-4 duration-300">
                      <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100 relative">
                        <div className="flex items-center space-x-3">
                           <div className="w-9 h-9 rounded-md bg-blue-50 text-[#12335f] flex items-center justify-center shadow-sm">
                             <Building2 className="h-4 w-4" />
                           </div>
                           <h4 className="text-xs font-extrabold text-[#12335f] uppercase tracking-wide">5. Bank Accounts</h4>
                        </div>
                        <div className="flex items-center space-x-2">
                           <button onClick={() => handleUpdateSectionStatus(selectedItem._id, 'bank', 'approved')} className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-sm", selectedItem.sectionStatus?.bank === 'approved' ? "bg-green-500 border-green-600 text-white" : "bg-white border-slate-200 text-slate-300 hover:bg-green-50 hover:text-green-600 hover:border-green-300")}><Check className="h-4 w-4" /></button>
                           <button onClick={() => openRejectionModal('bank')} className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-sm", selectedItem.sectionStatus?.bank === 'rejected' ? "bg-red-500 border-red-600 text-white" : "bg-white border-slate-200 text-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300")}><X className="h-4 w-4" /></button>
                        </div>
                      </div>
                      <div className="space-y-4">
                         {selectedItem.profile?.bankAccounts?.map((bank: any) => (
                           <div key={bank.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-start">
                              <div className="space-y-1">
                                 <p className="text-xs font-extrabold text-slate-900 uppercase">{bank.bankName} {bank.isPrimary && <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full ml-2">PRIMARY</span>}</p>
                                 <p className="text-[11px] font-bold text-slate-700 uppercase">A/C: <span className="text-slate-900">{bank.accountNumber}</span> | IFSC: <span className="text-slate-900">{bank.ifsc}</span></p>
                                 <p className="text-[10px] font-medium text-slate-500 uppercase">Holder: {bank.holderName}</p>
                                 <p className="text-[10px] font-medium text-slate-400 uppercase">{bank.bankAddress}</p>
                              </div>
                              {bank.isVerified && <Badge variant="success" className="text-[8px] h-5">VERIFIED</Badge>}
                           </div>
                         ))}
                      </div>
                   </div>

                   {/* Section 6: e-Invoicing */}
                   <div className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm animate-in slide-in-from-bottom-4 duration-300">
                      <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100 relative">
                        <div className="flex items-center space-x-3">
                           <div className="w-9 h-9 rounded-md bg-blue-50 text-[#12335f] flex items-center justify-center shadow-sm">
                             <FileText className="h-4 w-4" />
                           </div>
                           <h4 className="text-xs font-extrabold text-[#12335f] uppercase tracking-wide">6. e-Invoicing</h4>
                        </div>
                        <div className="flex items-center space-x-2">
                           <button onClick={() => handleUpdateSectionStatus(selectedItem._id, 'einvoicing', 'approved')} className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-sm", selectedItem.sectionStatus?.einvoicing === 'approved' ? "bg-green-500 border-green-600 text-white" : "bg-white border-slate-200 text-slate-300 hover:bg-green-50 hover:text-green-600 hover:border-green-300")}><Check className="h-4 w-4" /></button>
                           <button onClick={() => openRejectionModal('einvoicing')} className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-sm", selectedItem.sectionStatus?.einvoicing === 'rejected' ? "bg-red-500 border-red-600 text-white" : "bg-white border-slate-200 text-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300")}><X className="h-4 w-4" /></button>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-8">
                         <InfoItem label="Turnover (Last 3 yrs)" value={selectedItem.profile?.turnoverMax3Yrs} highlight />
                         <InfoItem label="Excluded Status" value={selectedItem.profile?.eInvoicingExcluded ? 'EXEMPT' : 'APPLICABLE'} />
                      </div>
                   </div>

                   {/* Section 7: Ownership */}
                   <div className="group rounded-lg border border-slate-200 bg-white p-5 pb-6 shadow-sm animate-in slide-in-from-bottom-4 duration-300">
                      <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100 relative">
                        <div className="flex items-center space-x-3">
                           <div className="w-9 h-9 rounded-md bg-blue-50 text-[#12335f] flex items-center justify-center shadow-sm">
                             <ShieldCheck className="h-4 w-4" />
                           </div>
                           <h4 className="text-xs font-extrabold text-[#12335f] uppercase tracking-wide">7. Beneficial Ownership</h4>
                        </div>
                        <div className="flex items-center space-x-2">
                           <button onClick={() => handleUpdateSectionStatus(selectedItem._id, 'ownership', 'approved')} className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-sm", selectedItem.sectionStatus?.ownership === 'approved' ? "bg-green-500 border-green-600 text-white" : "bg-white border-slate-200 text-slate-300 hover:bg-green-50 hover:text-green-600 hover:border-green-300")}><Check className="h-4 w-4" /></button>
                           <button onClick={() => openRejectionModal('ownership')} className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-sm", selectedItem.sectionStatus?.ownership === 'rejected' ? "bg-red-500 border-red-600 text-white" : "bg-white border-slate-200 text-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300")}><X className="h-4 w-4" /></button>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-8">
                         <InfoItem label="Declaration Accepted" value={selectedItem.profile?.ownershipDeclarationAccepted ? 'YES' : 'NO'} highlight />
                         <InfoItem label="Verification Status" value={selectedItem.profile?.ownershipVerified ? 'VERIFIED' : 'PENDING'} />
                      </div>
                   </div>
                      </>
                    )}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex justify-center border-t border-slate-200 bg-white px-8 py-3">
               <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">End of application record for verification</p>
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
          <div className="relative w-full max-w-md overflow-hidden rounded-lg border border-slate-300 bg-white shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between border-b border-slate-200 bg-[#12335f] px-6 py-4 text-white">
              <div className="space-y-1">
                <h3 className="text-base font-extrabold uppercase tracking-tight">Provide Rejection Reason</h3>
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-100">Section: {activeSectionForRejection}</p>
              </div>
              <button 
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setRejectionReason('');
                }}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-[#f9a825]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="space-y-3">
                <p className="text-xs font-medium leading-relaxed text-slate-600">
                  Please specify why this section is being rejected. This feedback will be visible to the {selectedItem?.role}.
                </p>
                <textarea 
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Uploaded documents are incorrect or unreadable..."
                  className="h-32 w-full resize-none rounded-md border border-slate-300 bg-white p-3 text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-red-600"
                  autoFocus
                />
              </div>

              <div className="flex flex-col space-y-3">
                <Button 
                  onClick={handleConfirmRejection}
                  disabled={!rejectionReason.trim()}
                  className="h-11 w-full rounded-md bg-red-700 font-bold uppercase tracking-wide text-white hover:bg-red-800"
                >
                  Confirm Rejection
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsRejectModalOpen(false);
                    setRejectionReason('');
                  }}
                  className="h-11 w-full rounded-md border-slate-300 font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value, mono = false, highlight = false }: { label: string, value?: string, mono?: boolean, highlight?: boolean }) {
  return (
    <div className="min-w-0 space-y-1 rounded-md border border-slate-100 bg-slate-50/70 px-3 py-2">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={cn(
        "break-words text-xs font-semibold tracking-tight transition-all",
        highlight ? "text-[#12335f]" : "text-slate-800",
        mono && "font-mono"
      )}>
        {value || 'Not Provided'}
      </p>
    </div>
  );
}

