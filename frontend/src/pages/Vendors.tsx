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
  ChevronDown
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
    <div className="min-h-screen bg-[#0B0F17] text-white p-4 md:p-8">
      {/* Header Section */}
      <div className="mb-12">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-2">Vendor Discovery</p>
        <h1 className="text-4xl font-black tracking-tight italic mb-4">Find verified vendors</h1>
        <p className="text-sm text-slate-400 font-medium italic max-w-2xl">
          Browse empanelled vendors across India. Filter by category, MSME status, and verification.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Search by name, city, or category..."
            className="pl-11 bg-[#161B22] border-slate-800 h-12 rounded-xl focus:ring-indigo-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-4">
          <div className="relative group">
            <select 
              className="appearance-none bg-[#161B22] border border-slate-800 h-12 px-6 pr-12 rounded-xl text-sm font-bold tracking-wide focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-all hover:border-slate-700"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none group-hover:text-indigo-400 transition-colors" />
          </div>

          <div className="relative group">
            <select 
              className="appearance-none bg-[#161B22] border border-slate-800 h-12 px-6 pr-12 rounded-xl text-sm font-bold tracking-wide focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-all hover:border-slate-700"
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
            >
              {sizes.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none group-hover:text-indigo-400 transition-colors" />
          </div>

          <Button className="h-12 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl px-6 gap-2 font-bold hover:bg-indigo-500/20 transition-all">
            <ShieldCheck className="h-4 w-4" />
            <span>Verified only</span>
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6 text-sm font-bold text-slate-500 uppercase tracking-widest">
        {filteredVendors.length} vendors
      </div>

      {/* Vendors Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-64 bg-[#161B22] border border-slate-800 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <div key={vendor._id} className="group relative bg-[#161B22] border border-slate-800 rounded-3xl p-6 transition-all hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-black text-xl">
                    {vendor.profile.businessName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-black italic text-lg">{vendor.profile.businessName}</h3>
                      <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-black uppercase">
                        <BadgeCheck className="h-3 w-3" />
                        Verified
                      </span>
                    </div>
                    <p className="flex items-center gap-1 text-xs text-slate-500 font-bold">
                      <MapPin className="h-3 w-3" />
                      {vendor.profile.city}, {vendor.profile.state}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-400 mb-6 font-medium italic line-clamp-2">
                Specialized in {vendor.profile.productCategories?.join(', ') || 'multiple categories'}. Providing high-quality services to enterprise buyers since 2018.
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {(vendor.profile.productCategories || []).slice(0, 2).map(cat => (
                  <span key={cat} className="text-[10px] bg-slate-800 text-slate-300 px-3 py-1 rounded-lg font-bold uppercase tracking-wider">
                    {cat}
                  </span>
                ))}
                {vendor.profile.productCategories?.length > 2 && (
                  <span className="text-[10px] bg-slate-800 text-slate-500 px-3 py-1 rounded-lg font-bold uppercase tracking-wider">
                    +{vendor.profile.productCategories.length - 2}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-800/50 mb-6">
                <div className="text-[10px] font-black tracking-widest text-slate-600 uppercase">
                  {vendor.profile.gst || 'GST PENDING'}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-500">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span>4.8</span>
                  <span className="text-slate-600 ml-1">• 124 reviews</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-10 border-slate-800 bg-[#161B22] rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800">
                  View profile
                </Button>
                <Button className="h-10 bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B0F17] rounded-xl font-black text-xs uppercase tracking-widest transition-all">
                  Request quote
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && filteredVendors.length === 0 && (
        <div className="text-center py-24">
          <div className="h-16 w-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 className="h-8 w-8 text-slate-600" />
          </div>
          <h3 className="text-xl font-black italic mb-2">No vendors found</h3>
          <p className="text-slate-500 font-medium italic">Try adjusting your filters or search terms.</p>
        </div>
      )}
    </div>
  );
};

export default Vendors;
