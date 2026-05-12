import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Star, 
  Building2, 
  ChevronDown, 
  CheckCircle2,
  X,
  Phone,
  Mail,
  Globe,
  Briefcase,
  FileText,
  Send,
  Loader2,
  Info,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

interface Vendor {
  _id: string;
  id: number;
  name: string;
  email: string;
  sellerProfile: {
    businessName: string;
    state: string;
    city: string;
    productCategories: string[];
    msmeCategory: string;
    gst: string;
    organizationType: string;
    dateOfIncorporation: string;
    pan: string;
    offices?: any[];
    bankAccounts?: any[];
  };
}

const Vendors = () => {
  const authOptions = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
  const cachedVendors = api.peek('/api/vendors', authOptions);
  const [vendors, setVendors] = useState<Vendor[]>(cachedVendors || []);
  const [loading, setLoading] = useState(!cachedVendors);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All categories');
  const [selectedSize, setSelectedSize] = useState('All sizes');
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  
  // Modal states
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  
  // Quote form state
  const [quoteForm, setQuoteForm] = useState({
    subject: '',
    message: ''
  });
  const [submittingQuote, setSubmittingQuote] = useState(false);

  const categories = [
    'All categories',
    'IT Hardware',
    'Software & Cloud',
    'Office Supplies',
    'Furniture',
    'Industrial Equipment',
    'Medical Supplies',
    'Construction',
    'Logistics',
    'Consulting',
    'Catering'
  ];

  const sizes = [
    'All sizes',
    'Micro',
    'Small',
    'Medium',
    'Large'
  ];

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await api.get('/api/vendors', authOptions);
      if (res.ok) {
        const data = await res.json();
        setVendors(data);
      } else {
        toast.error('Failed to fetch vendors');
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast.error('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = async (vendor: Vendor) => {
    setFetchingDetails(true);
    try {
      const res = await api.get(`/api/vendors/${vendor.id || vendor._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const detailedVendor = await res.json();
        setSelectedVendor(detailedVendor);
        setIsProfileModalOpen(true);
      } else {
        toast.error('Could not load profile details');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleOpenQuoteModal = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsQuoteModalOpen(true);
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) return;
    
    setSubmittingQuote(true);
    try {
      const res = await api.post('/api/quotes', {
        sellerId: selectedVendor.id || selectedVendor._id,
        ...quoteForm
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (res.ok) {
        toast.success(`Quote request sent to ${selectedVendor.sellerProfile?.businessName || selectedVendor.name}`);
        setIsQuoteModalOpen(false);
        setQuoteForm({ subject: '', message: '' });
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to send request');
      }
    } catch (error) {
      toast.error('Server error');
    } finally {
      setSubmittingQuote(false);
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const profile = vendor.sellerProfile || {};
    const matchesSearch = (profile.businessName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (profile.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (vendor.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All categories' || 
                           (profile.productCategories || []).includes(selectedCategory);
    
    const matchesSize = selectedSize === 'All sizes' || 
                       (profile.msmeCategory || '') === selectedSize;
    
    const matchesVerification = !verifiedOnly || Boolean(profile.gst || profile.pan);
    return matchesSearch && matchesCategory && matchesSize && matchesVerification;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8">
      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by name, city, or category..."
            className="pl-11 bg-white border-slate-200 h-11 rounded-lg focus:ring-[#12335f]/10 text-slate-900 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-center">
          <div className="relative group flex-1 sm:flex-none sm:min-w-[180px]">
            <select 
              className="w-full appearance-none bg-white border border-slate-200 h-11 px-6 pr-12 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#12335f]/10 cursor-pointer transition-all hover:border-teal-500/30 text-slate-700"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none group-hover:text-[#12335f] transition-colors" />
          </div>

          <div className="relative group flex-1 sm:flex-none sm:min-w-[140px]">
            <select 
              className="w-full appearance-none bg-white border border-slate-200 h-11 px-6 pr-12 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#12335f]/10 cursor-pointer transition-all hover:border-teal-500/30 text-slate-700"
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
            >
              {sizes.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none group-hover:text-[#12335f] transition-colors" />
          </div>

          <Button
            variant="outline"
            onClick={() => setVerifiedOnly(prev => !prev)}
            className={`h-11 bg-white border-slate-200 rounded-lg px-6 gap-2 font-medium hover:bg-slate-50 transition-all flex justify-center items-center ${verifiedOnly ? 'text-[#12335f] border-[#12335f]/40' : 'text-slate-700'}`}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-400" />
            <span>{verifiedOnly ? 'Verified only' : 'All vendors'}</span>
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6 text-sm font-medium text-slate-500 flex items-center gap-2">
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <span>{filteredVendors.length} vendors found</span>}
      </div>

      {/* Vendors Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-64 bg-white border border-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map((vendor) => (
              <div key={vendor._id} className="group relative bg-white border border-slate-200 rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-slate-200/50">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-lg border border-slate-100 group-hover:border-slate-200 group-hover:bg-slate-50 group-hover:text-[#12335f] transition-all">
                      {vendor.sellerProfile?.businessName?.charAt(0) || vendor.name?.charAt(0) || 'V'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-slate-900 group-hover:text-teal-900 transition-colors">{vendor.sellerProfile?.businessName || vendor.name}</h3>
                        <span className="flex items-center gap-1 text-[11px] text-[#12335f] font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Verified
                        </span>
                      </div>
                      <p className="flex items-center gap-1 text-[13px] text-slate-500">
                        <MapPin className="h-3.5 w-3.5" />
                        {vendor.sellerProfile?.city || 'India'}, {vendor.sellerProfile?.state || 'Verified'}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-[13px] text-slate-600 mb-6 leading-relaxed line-clamp-2">
                  Specialized in {vendor.sellerProfile?.productCategories?.join(', ') || 'multiple categories'}. Providing high-quality services to enterprise buyers since 2018.
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {(vendor.sellerProfile?.productCategories || []).slice(0, 2).map(cat => (
                    <span key={cat} className="text-[11px] bg-slate-50 text-slate-600 px-3 py-1 rounded-md font-medium border border-slate-100">
                      {cat}
                    </span>
                  ))}
                  {vendor.sellerProfile?.productCategories?.length > 2 && (
                    <span className="text-[11px] bg-slate-50 text-slate-400 px-2 py-1 rounded-md font-medium border border-slate-100">
                      +{vendor.sellerProfile.productCategories.length - 2} more
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-50 mb-6">
                  <div className="text-[12px] font-mono text-slate-400 uppercase tracking-tight">
                    {vendor.sellerProfile?.gst || '29ABCDE1234F1Z5'}
                  </div>
                  <div className="flex items-center gap-1.5 text-[13px] font-medium text-amber-500">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span className="text-slate-900">4.6</span>
                    <span className="text-slate-400 font-normal ml-0.5">· 184 reviews</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => handleViewProfile(vendor)}
                    disabled={fetchingDetails}
                    className="h-10 border-slate-200 bg-white rounded-lg font-semibold text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {fetchingDetails && selectedVendor?._id === vendor._id ? <Loader2 className="h-3 w-3 animate-spin" /> : "View profile"}
                  </Button>
                  <Button 
                    onClick={() => handleOpenQuoteModal(vendor)}
                    className="h-10 bg-[#12335f] hover:bg-[#0b2445] text-white rounded-lg font-semibold text-xs transition-all"
                  >
                    Request quote
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredVendors.length === 0 && (
            <div className="text-center py-24">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No vendors found</h3>
              <p className="text-slate-500 text-sm">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </>
      )}

      {/* Vendor Profile Modal */}
      {isProfileModalOpen && selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                 <div className="h-11 w-11 rounded-xl bg-[#12335f] flex items-center justify-center text-white font-black text-xl shadow shadow-slate-900/10">
                   {selectedVendor.sellerProfile?.businessName?.charAt(0) || selectedVendor.name?.charAt(0)}
                 </div>
                 <div>
                   <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                     {selectedVendor.sellerProfile?.businessName || selectedVendor.name}
                     <CheckCircle2 className="h-4 w-4 text-[#12335f]" />
                   </h2>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{selectedVendor.sellerProfile?.organizationType || 'Private Limited'} · {selectedVendor.sellerProfile?.msmeCategory || 'Medium'} Enterprise</p>
                 </div>
              </div>
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="h-6 w-6 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
               {/* Quick Stats */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Rating', value: '4.6 / 5', icon: Star, color: 'text-amber-500' },
                    { label: 'City', value: selectedVendor.sellerProfile?.city || 'Bangalore', icon: MapPin, color: 'text-blue-500' },
                    { label: 'Established', value: selectedVendor.sellerProfile?.dateOfIncorporation ? new Date(selectedVendor.sellerProfile.dateOfIncorporation).getFullYear() : '2018', icon: Building2, color: 'text-teal-500' },
                    { label: 'PAN Verified', value: 'Yes', icon: ShieldCheck, color: 'text-emerald-500' }
                  ].map(stat => (
                    <div key={stat.label} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2 mb-1">
                        <stat.icon className={`h-3 w-3 ${stat.color}`} />
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">{stat.label}</span>
                      </div>
                      <div className="text-xs font-black text-slate-900 uppercase">{stat.value}</div>
                    </div>
                  ))}
               </div>

               {/* Bio/Info */}
               <div className="space-y-2">
                  <h3 className="text-[10px] font-black uppercase text-[#12335f] tracking-[0.1em] flex items-center gap-2">
                    <Info className="h-3.5 w-3.5" />
                    Business Overview
                  </h3>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed border-l-2 border-slate-200 pl-4 py-0.5">
                    {selectedVendor.sellerProfile?.businessName || selectedVendor.name} is a leading provider in the {selectedVendor.sellerProfile?.productCategories?.[0] || 'MSME'} sector, specializing in high-quality deliverables for enterprise-grade procurement. With a focus on compliance and efficiency, we ensure seamless supply chain integration for our buyer partners.
                  </p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Business Details */}
                  <div className="space-y-4">
                     <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.1em]">Business Details</h3>
                     <div className="space-y-3">
                        {[
                          { label: 'GST Number', value: selectedVendor.sellerProfile?.gst, icon: FileText },
                          { label: 'Business PAN', value: selectedVendor.sellerProfile?.pan, icon: Briefcase },
                          { label: 'Email Address', value: selectedVendor.email, icon: Mail },
                          { label: 'Incorporation', value: selectedVendor.sellerProfile?.dateOfIncorporation ? new Date(selectedVendor.sellerProfile.dateOfIncorporation).toLocaleDateString() : 'N/A', icon: Clock }
                        ].map(item => (
                          <div key={item.label} className="flex items-center gap-3 group">
                             <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-[#12335f] transition-colors">
                                <item.icon className="h-3.5 w-3.5" />
                             </div>
                             <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{item.label}</p>
                                <p className="text-xs font-bold text-slate-800">{item.value || 'Verified'}</p>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>

                  {/* Right Column: Categories & Offices */}
                  <div className="space-y-4">
                     <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.1em]">Categories & Reach</h3>
                     <div className="space-y-3">
                        <div className="flex flex-wrap gap-1.5">
                           {selectedVendor.sellerProfile?.productCategories?.map(cat => (
                             <span key={cat} className="px-2 py-1 rounded-md bg-slate-50 text-[#12335f] text-[10px] font-black uppercase border border-slate-200">
                               {cat}
                             </span>
                           ))}
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-slate-100">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Registered Offices</p>
                           {selectedVendor.sellerProfile?.offices && selectedVendor.sellerProfile.offices.length > 0 ? (
                             <div className="space-y-2">
                                {selectedVendor.sellerProfile.offices.map((office: any) => (
                                  <div key={office.id} className="flex gap-2">
                                     <MapPin className="h-3.5 w-3.5 text-[#12335f] mt-0.5 shrink-0" />
                                     <div>
                                        <p className="text-xs font-bold text-slate-800">{office.name}</p>
                                        <p className="text-[10px] text-slate-500">{office.address}, {office.city}, {office.state}</p>
                                     </div>
                                  </div>
                                ))}
                             </div>
                           ) : (
                             <div className="flex items-center gap-2 text-slate-400">
                                <MapPin className="h-3.5 w-3.5" />
                                <span className="text-[11px] font-medium">{selectedVendor.sellerProfile?.city}, {selectedVendor.sellerProfile?.state}</span>
                             </div>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
               <Button 
                variant="outline" 
                onClick={() => setIsProfileModalOpen(false)}
                className="rounded-lg h-9 px-5 font-bold uppercase text-[11px] tracking-wider text-slate-600 hover:text-slate-900 border-slate-200"
               >
                 Close
               </Button>
               <Button 
                onClick={() => {
                  setIsProfileModalOpen(false);
                  setIsQuoteModalOpen(true);
                }}
                className="bg-[#12335f] hover:bg-[#0b2445] text-white rounded-lg h-9 px-5 font-bold uppercase text-[11px] tracking-wider shadow shadow-slate-200"
               >
                 Request Quote
               </Button>
            </div>
          </div>
        </div>
      )}

      {/* Request Quote Modal */}
      {isQuoteModalOpen && selectedVendor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 space-y-5">
              <div className="space-y-1">
                 <div className="h-9 w-9 rounded-lg bg-slate-50 text-[#12335f] flex items-center justify-center mb-2">
                    <Send className="h-4 w-4" />
                 </div>
                 <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">Send Request</h2>
                 <p className="text-[11px] text-slate-500 font-bold">Requesting a quote from <span className="text-[#12335f]">{selectedVendor.sellerProfile?.businessName || selectedVendor.name}</span></p>
              </div>

              <form onSubmit={handleSubmitQuote} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 ml-1">Subject</label>
                  <input 
                    required
                    value={quoteForm.subject}
                    onChange={(e) => setQuoteForm({...quoteForm, subject: e.target.value})}
                    placeholder="e.g. Bulk Procurement for IT Hardware"
                    className="w-full bg-slate-50 border-slate-200 border rounded-lg py-2 px-3 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-[#12335f] transition-all text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 ml-1">Message Details</label>
                  <textarea 
                    required
                    value={quoteForm.message}
                    onChange={(e) => setQuoteForm({...quoteForm, message: e.target.value})}
                    placeholder="Describe your requirements..."
                    rows={3}
                    className="w-full bg-slate-50 border-slate-200 border rounded-lg py-2 px-3 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-[#12335f] transition-all resize-none text-slate-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsQuoteModalOpen(false)}
                    className="px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <Button 
                    disabled={submittingQuote}
                    className="bg-[#12335f] hover:bg-[#0b2445] text-white border-0 h-9 px-6 rounded-lg font-bold uppercase text-[11px] tracking-wide transition-all shadow shadow-slate-200"
                  >
                    {submittingQuote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Send Request'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendors;
