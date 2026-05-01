import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Building2, 
  ShieldCheck, 
  FileText, 
  MapPin, 
  User, 
  Edit3, 
  Globe, 
  ChevronRight,
  Briefcase,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  FileCheck,
  History,
  Activity
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function BuyerProfile() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
           setLoading(false);
           return;
        }

        const res = await api.fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent shadow-lg shadow-indigo-500/20"></div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 animate-pulse italic">Synchronizing Procurement Vault...</p>
      </div>
    );
  }

  const sections = [
    {
      id: 'org',
      title: 'Organisation Details',
      icon: Building2,
      onEdit: () => navigate('/buyer/onboarding?section=basic'),
      fields: [
        { label: 'LEGAL NAME', value: profile?.organizationName },
        { label: 'ENTITY TYPE', value: profile?.businessType },
        { label: 'INDUSTRY', value: profile?.industry },
        { label: 'CIN', value: profile?.cin || 'Not Provided' },
        { label: 'PAN', value: profile?.pan },
        { label: 'GSTIN', value: profile?.gst || 'Not Provided' },
        { label: 'WEBSITE', value: profile?.website || 'Not Provided' },
      ]
    },
    {
      id: 'rep',
      title: 'Authorized Representative',
      icon: UserCheck,
      onEdit: () => navigate('/buyer/onboarding?section=business'),
      fields: [
        { label: 'NAME', value: profile?.representativeName },
        { label: 'DESIGNATION', value: profile?.designation },
        { label: 'DEPARTMENT', value: profile?.department },
        { label: 'EMAIL', value: profile?.email || user?.email },
        { label: 'MOBILE', value: profile?.mobile },
        { label: 'ALTERNATE MOBILE', value: profile?.alternateMobile || 'Not Provided' },
      ]
    },
    {
      id: 'address',
      title: 'Address Details',
      icon: MapPin,
      onEdit: () => navigate('/buyer/onboarding?section=compliance'),
      fields: [
        { label: 'STATE', value: profile?.state },
        { label: 'CITY', value: profile?.city },
        { label: 'PINCODE', value: profile?.pincode },
        { label: 'REGISTERED ADDRESS', value: profile?.registeredAddress },
        { label: 'CORPORATE ADDRESS', value: profile?.corporateAddress || 'Same as Registered' },
      ]
    },
    {
      id: 'procurement',
      title: 'Procurement Profile',
      icon: Briefcase,
      onEdit: () => navigate('/buyer/onboarding?section=bank'),
      fields: [
        { label: 'CATEGORIES', value: profile?.procurementCategories?.join(', ') || 'Not Provided' },
        { label: 'ANNUAL BUDGET', value: profile?.annualBudget },
        { label: 'PREFERRED METHODS', value: profile?.preferredMethods?.join(', ') || 'Not Provided' },
      ]
    },
    {
      id: 'docs',
      title: 'Compliance Documents',
      icon: FileCheck,
      onEdit: () => navigate('/buyer/onboarding?section=documents'),
      fields: [
        { label: 'PAN CARD', value: profile?.documents?.panCard ? 'Verified Document' : 'Pending Upload' },
        { label: 'REGISTRATION CERT', value: profile?.documents?.regCert ? 'Verified Document' : 'Pending Upload' },
        { label: 'GST CERTIFICATE', value: profile?.documents?.gstCert ? 'Verified Document' : 'Pending Upload' },
        { label: 'ADDRESS PROOF', value: profile?.documents?.addressProof ? 'Verified Document' : 'Pending Upload' },
        { label: 'AUTHORITY LETTER', value: profile?.documents?.authLetter ? 'Verified Document' : 'Pending Upload' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white p-4 md:p-8 font-sans selection:bg-indigo-500/30">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-10 overflow-x-auto whitespace-nowrap pb-2 md:pb-0 italic">
        <span className="hover:text-indigo-400 cursor-pointer transition-colors">Home</span>
        <ChevronRight className="h-3 w-3 shrink-0 text-slate-800" />
        <span className="hover:text-indigo-400 cursor-pointer transition-colors">Buyer Hub</span>
        <ChevronRight className="h-3 w-3 shrink-0 text-slate-800" />
        <span className="text-indigo-500">Identity Vault</span>
      </div>

      {/* Main Container */}
      <div className="max-w-[1400px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 mb-16 relative">
          <div className="absolute -left-12 -top-12 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] -z-10"></div>
          <div className="space-y-4">
             <div className="flex items-center gap-3">
               <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest italic">
                 Identity Verified
               </span>
               <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 italic">
                 <Activity className="h-3 w-3 text-green-500" />
                 Active Session
               </span>
             </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white italic">
              Profile & <span className="text-indigo-500">Compliance</span>
            </h1>
            <p className="text-base text-slate-400 font-medium max-w-3xl leading-relaxed">
              Managing your procurement persona and statutory documents for GeM-aligned transactions and vendor credibility.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
             <Button 
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="bg-transparent border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-white h-14 px-8 rounded-2xl font-black uppercase text-xs tracking-widest italic transition-all"
              >
                <History className="h-4 w-4 mr-2" />
                Audit Logs
              </Button>
              <Button 
                onClick={() => navigate('/buyer/onboarding')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white border-0 h-14 px-10 rounded-2xl font-black uppercase text-xs tracking-widest italic transition-all shadow-2xl shadow-indigo-600/20 active:scale-95"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Update Profile
              </Button>
          </div>
        </div>

        {/* Profile Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          {sections.map((section) => (
            <Card key={section.id} className="bg-[#151B28]/40 border-slate-800/50 rounded-[2.5rem] overflow-hidden group hover:border-indigo-500/40 transition-all duration-700 backdrop-blur-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/50 p-8 sm:p-10 bg-slate-900/40">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-[#0B0F17] flex items-center justify-center border border-slate-800 group-hover:bg-indigo-600 group-hover:border-indigo-500 transition-all duration-700 group-hover:shadow-2xl group-hover:shadow-indigo-600/30 group-hover:-translate-y-1">
                    <section.icon className="h-7 w-7 text-indigo-400 group-hover:text-white transition-all duration-500" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-black text-white tracking-tight italic uppercase">{section.title}</CardTitle>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Section Verified: 2024</p>
                  </div>
                </div>
                <button 
                  onClick={section.onEdit}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-all py-3 px-6 rounded-2xl border border-slate-800 hover:bg-indigo-600/10 hover:border-indigo-500/30 italic"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit
                </button>
              </CardHeader>
              <CardContent className="p-8 sm:p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-12 gap-x-12">
                  {section.fields.map((field, idx) => (
                    <div key={idx} className={cn("space-y-3", (field.label === 'REGISTERED ADDRESS' || field.label === 'CORPORATE ADDRESS' || field.label === 'CATEGORIES' || field.label === 'PREFERRED METHODS') ? "md:col-span-2" : "")}>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 italic flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/30"></span>
                        {field.label}
                      </p>
                      <div className="relative group/field">
                        <p className={cn(
                          "text-base font-bold tracking-wide leading-relaxed transition-colors",
                          field.value ? "text-slate-100" : "text-slate-700 italic font-medium"
                        )}>
                          {field.value || "Field pending data entry"}
                        </p>
                        {field.label.includes('CERT') || field.label.includes('CARD') || field.label.includes('PROOF') ? (
                           <div className="mt-3 flex items-center gap-2">
                             <div className={cn(
                               "h-2 w-2 rounded-full",
                               field.value === 'Verified Document' ? "bg-green-500 shadow-lg shadow-green-500/20" : "bg-yellow-500/50"
                             )}></div>
                             <span className={cn(
                               "text-[10px] font-black uppercase italic tracking-widest",
                               field.value === 'Verified Document' ? "text-green-500" : "text-slate-600"
                             )}>
                               {field.value === 'Verified Document' ? "Digitally Attested" : "Awaiting Submission"}
                             </span>
                           </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Status Footer */}
        <div className="mt-20 relative p-1 md:p-1.5 rounded-[3rem] bg-gradient-to-r from-indigo-500/20 via-transparent to-slate-800/20">
          <div className="flex flex-col lg:flex-row items-center gap-8 p-10 md:p-16 rounded-[2.8rem] bg-[#0B0F17] border border-slate-800 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-[80px] -z-10"></div>
            <div className="w-20 h-20 rounded-3xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 shrink-0 border border-indigo-500/20">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <div className="flex-1 text-center lg:text-left space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <p className="text-sm font-black text-indigo-400 uppercase tracking-[0.2em] italic">Verification Status: Level 2 Audit</p>
                <span className="hidden lg:block w-1.5 h-1.5 rounded-full bg-slate-800"></span>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest italic">Updated 2 hours ago</p>
              </div>
              <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-4xl">
                Your organizational identity is currently undergoing deep compliance auditing. You can continue with procurement workflows while Level 2 verification is in progress.
              </p>
            </div>
            <div className="shrink-0 flex flex-col items-center gap-3">
               <div className="flex -space-x-3">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0B0F17] bg-slate-800 flex items-center justify-center text-[10px] font-black text-indigo-400">
                     {String.fromCharCode(64+i)}
                   </div>
                 ))}
               </div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Audited by GeM Panel</p>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Background Elements */}
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[150px] -z-50 pointer-events-none"></div>
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[150px] -z-50 pointer-events-none"></div>
    </div>
  );
}
