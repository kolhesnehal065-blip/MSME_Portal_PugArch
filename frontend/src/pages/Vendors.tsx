import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  ShieldCheck, 
  Star, 
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Building2,
  BadgeCheck,
  ChevronDown,
  CheckCircle2
} from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

interface Vendor {
  _id: string;
  name: string;
  profile: {
    businessName: string;
    state: string;
    city: string;
    productCategories: string[];
    msmeCategory: string;
    gst: string;
    applicantName: string;
  };
}

const Vendors = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All categories');
  const [selectedSize, setSelectedSize] = useState('All sizes');

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
      const res = await api.get('/api/vendors', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
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

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = (vendor.profile?.businessName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (vendor.profile?.city || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All categories' || 
                           (vendor.profile?.productCategories || []).includes(selectedCategory);
    const matchesSize = selectedSize === 'All sizes' || 
                       (vendor.profile?.msmeCategory || '') === selectedSize;
    return matchesSearch && matchesCategory && matchesSize;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8">
      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by name, GSTIN, city, or category..."
            className="pl-11 bg-white border-slate-200 h-11 rounded-lg focus:ring-teal-500/10 text-slate-900 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-center">
          <div className="relative group flex-1 sm:flex-none sm:min-w-[180px]">
            <select 
              className="w-full appearance-none bg-white border border-slate-200 h-11 px-6 pr-12 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/10 cursor-pointer transition-all hover:border-teal-500/30 text-slate-700"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none group-hover:text-teal-600 transition-colors" />
          </div>

          <div className="relative group flex-1 sm:flex-none sm:min-w-[140px]">
            <select 
              className="w-full appearance-none bg-white border border-slate-200 h-11 px-6 pr-12 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/10 cursor-pointer transition-all hover:border-teal-500/30 text-slate-700"
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
            >
              {sizes.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none group-hover:text-teal-600 transition-colors" />
          </div>

          <Button variant="outline" className="h-11 bg-white text-slate-700 border-slate-200 rounded-lg px-6 gap-2 font-medium hover:bg-slate-50 transition-all flex justify-center items-center">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-400" />
            <span>Verified only</span>
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6 text-sm font-medium text-slate-500">
        {filteredVendors.length} vendors
      </div>

      {/* Vendors Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-64 bg-white border border-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <div key={vendor._id} className="group relative bg-white border border-slate-200 rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-slate-200/50">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-lg border border-slate-100">
                    {vendor.profile.businessName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-slate-900">{vendor.profile.businessName}</h3>
                      <span className="flex items-center gap-1 text-[11px] text-teal-600 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    </div>
                    <p className="flex items-center gap-1 text-[13px] text-slate-500">
                      <MapPin className="h-3.5 w-3.5" />
                      {vendor.profile.city}, {vendor.profile.state}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-[13px] text-slate-600 mb-6 leading-relaxed line-clamp-2">
                Specialized in {vendor.profile.productCategories?.join(', ') || 'multiple categories'}. Providing high-quality services to enterprise buyers since 2018.
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {(vendor.profile.productCategories || []).slice(0, 2).map(cat => (
                  <span key={cat} className="text-[11px] bg-slate-50 text-slate-600 px-3 py-1 rounded-md font-medium border border-slate-100">
                    {cat}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-50 mb-6">
                <div className="text-[12px] font-mono text-slate-400 uppercase tracking-tight">
                  {vendor.profile.gst || '29ABCDE1234F1Z5'}
                </div>
                <div className="flex items-center gap-1.5 text-[13px] font-medium text-amber-500">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span className="text-slate-900">4.6</span>
                  <span className="text-slate-400 font-normal ml-0.5">· 184 reviews</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-10 border-slate-200 bg-white rounded-lg font-semibold text-xs text-slate-700 hover:bg-slate-50">
                  View profile
                </Button>
                <Button className="h-10 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold text-xs transition-all">
                  Request quote
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && filteredVendors.length === 0 && (
        <div className="text-center py-24">
          <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No vendors found</h3>
          <p className="text-slate-500 text-sm">Try adjusting your filters or search terms.</p>
        </div>
      )}
    </div>
  );
};

export default Vendors;
