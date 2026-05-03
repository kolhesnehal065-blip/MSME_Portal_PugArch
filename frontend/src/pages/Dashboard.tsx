import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '../components/ui/card';
import { AlertTriangle, CheckCircle2, Clock, XCircle, FileText, ArrowRight, ShieldCheck, Bell, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminStats, setAdminStats] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setIsLoading(false);
        navigate('/', { replace: true });
        return;
      }

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const profileRes = await api.fetch('/api/auth/me', { headers });
        if (profileRes.status === 401) {
          logout();
          navigate('/', { replace: true });
          return;
        }

        const profileData = await profileRes.json();
        setProfile(profileData.profile);

        if (profileData.user?.role === 'admin') {
          const statsRes = await api.fetch('/api/admin/stats', { headers });
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            setAdminStats(statsData);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [token, navigate, logout]);

  if (isLoading) return <div className="flex h-screen items-center justify-center font-black italic text-blue-600 animate-pulse text-xl">Loading MSME Portal...</div>;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved_for_procurement': return <CheckCircle2 className="h-10 w-10 text-emerald-500" />;
      case 'rejected': return <XCircle className="h-10 w-10 text-red-500" />;
      case 'under_compliance_review': return <Clock className="h-10 w-10 text-amber-500" />;
      case 'resubmission_required': return <AlertTriangle className="h-10 w-10 text-amber-500" />;
      default: return <Clock className="h-10 w-10 text-blue-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  if (user?.role === 'admin') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tight">Admin Control Center</h1>
            <p className="text-slate-500 font-medium italic">Manage the MSME Procurement Network</p>
          </div>
          <Link to="/admin/onboarding">
            <Button className="bg-slate-900 hover:bg-black text-white h-12 px-6 rounded-xl space-x-2 font-black uppercase italic tracking-widest text-xs">
              <ShieldCheck className="h-4 w-4" />
              <span>Review Submissions</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Pending Approval', value: adminStats?.pendingApproval, color: 'amber' },
            { label: 'Active Sellers', value: adminStats?.activeSellers, color: 'emerald' },
            { label: 'Active Buyers', value: adminStats?.activeBuyers, color: 'blue' }
          ].map(stat => (
            <div key={stat.label} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 italic">{stat.label}</div>
              <div className="text-4xl font-black tracking-tight text-slate-900">{stat.value ?? '0'}</div>
            </div>
          ))}
        </div>

        <Card className="rounded-3xl border-none shadow-2xl shadow-slate-200/50 overflow-hidden">
          <CardContent className="py-16 text-center space-y-6">
             <div className="mx-auto w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center rotate-3 transition-transform hover:rotate-0">
                <ShieldCheck className="h-10 w-10 text-blue-600" />
             </div>
             <h2 className="text-2xl font-black text-slate-900 uppercase italic">Welcome back, Administrator</h2>
             <p className="text-slate-500 font-medium italic max-w-md mx-auto leading-relaxed">
               Verified stakeholders are currently awaiting your review. Please ensure all document compliance before granting marketplace access.
             </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sectionMessages = Object.entries(user?.sectionRejectionReasons || {}).filter(([section, reason]) => {
    const status = user?.sectionStatus?.[section as keyof typeof user.sectionStatus];
    return reason && ['rejected', 'resubmission_required'].includes(status || '');
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 border-b border-slate-100 pb-8">
        <div>
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] italic mb-1">MSME Procurement Portal</p>
          <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Dashboard</h1>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
           <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-lg italic">
             {user?.name?.charAt(0)}
           </div>
           <div className="pr-4">
             <p className="text-xs font-black text-slate-900 uppercase italic">{user?.name}</p>
             <div className="flex flex-col gap-0.5 mt-0.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.role} Tier Account</p>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest italic">
                  ID: {user?.registrationDetails?.userId || `MSME-${user?.role?.charAt(0).toUpperCase()}-${String(user?.id).padStart(5, '0')}`}
                </p>
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Onboarding Status Tracker */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-3xl border-none shadow-xl shadow-slate-100/50 overflow-hidden bg-white">
            <div className="bg-slate-50 border-b border-white px-8 py-6 flex items-center justify-between">
               <h3 className="text-sm font-black uppercase text-slate-900 italic tracking-tight flex items-center gap-2">
                 <ShieldCheck className="h-5 w-5 text-indigo-600" />
                 Verification Status Tracker
               </h3>
               <Badge className="bg-white text-indigo-600 border border-indigo-100 px-4 py-1 rounded-full text-[10px] font-black uppercase italic">
                 Live Monitoring
               </Badge>
            </div>
            <CardContent className="p-8">
               <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="relative h-32 w-32 shrink-0">
                    <div className="absolute inset-0 bg-blue-50 rounded-full animate-pulse opacity-50" />
                    <div className="absolute inset-0 flex items-center justify-center">
                       {getStatusIcon(user?.onboardingStatus || 'pending')}
                    </div>
                  </div>
                  <div className="space-y-4 text-center md:text-left">
                     <div>
                        <h4 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">
                          {getStatusLabel(user?.onboardingStatus || 'pending')}
                        </h4>
                        <p className="text-slate-500 font-medium italic text-sm mt-1">
                          {user?.onboardingStatus === 'approved_for_procurement' 
                            ? "Your profile is fully verified. You can now participate in all procurement activities."
                            : "Your profile is currently being reviewed by the MSME compliance department."}
                        </p>
                     </div>
                     <Link to={user?.role === 'seller' ? '/seller/onboarding' : '/buyer/onboarding'}>
                       <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 px-8 font-black uppercase italic text-xs tracking-widest shadow-lg shadow-indigo-100 transition-all hover:scale-105 active:scale-95">
                          {user?.onboardingStatus === 'approved_for_procurement' ? 'View Full Profile' : 'Complete Profile'}
                          <ArrowRight className="ml-2 h-4 w-4" />
                       </Button>
                     </Link>
                  </div>
               </div>
            </CardContent>
          </Card>

          {/* Quick Actions / Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                   <Info className="h-5 w-5" />
                </div>
                <h5 className="font-black text-slate-900 uppercase italic text-sm">Need Help?</h5>
                <p className="text-xs font-medium text-slate-500 italic leading-relaxed">Our support team is available 24/7 to help you with the GeM-style onboarding process.</p>
                <Button variant="ghost" className="text-blue-600 font-black uppercase italic text-[10px] p-0 h-auto hover:bg-transparent">Contact Support</Button>
             </div>
             <div className="bg-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-200 space-y-4 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                   <ShieldCheck className="h-20 w-20" />
                </div>
                <h5 className="font-black uppercase italic text-sm">Trust & Security</h5>
                <p className="text-xs font-medium text-slate-400 italic leading-relaxed">Your data is encrypted and stored in compliance with MSME data sovereignty rules.</p>
                <Badge className="bg-white/10 text-white border-none rounded-lg px-3 py-1 font-black italic text-[9px]">AES-256 SECURED</Badge>
             </div>
          </div>
        </div>

        {/* Notification Panel */}
        <div className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest italic flex items-center gap-2">
                 <Bell className="h-4 w-4" />
                 Notifications
              </h3>
              {sectionMessages.length > 0 && (
                <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
              )}
           </div>

           <div className="space-y-4">
              {user?.adminFeedback && (
                <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl space-y-3 animate-in slide-in-from-right-4 duration-500">
                   <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Admin Remark</p>
                   </div>
                   <p className="text-sm font-semibold text-amber-900 italic leading-relaxed">"{user.adminFeedback}"</p>
                </div>
              )}

              {sectionMessages.length > 0 ? (
                sectionMessages.map(([section, reason]) => (
                  <Link 
                    key={section} 
                    to={user?.role === 'seller' ? '/seller/onboarding' : '/buyer/onboarding'}
                    className="block bg-red-50 border border-red-100 p-6 rounded-3xl space-y-3 transition-all hover:shadow-md group animate-in slide-in-from-right-4 duration-500"
                  >
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <AlertTriangle className="h-4 w-4 text-red-500" />
                           <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Rejection Alert</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-red-300 group-hover:translate-x-1 transition-transform" />
                     </div>
                     <p className="text-[11px] font-black text-slate-900 uppercase italic">Section: {section}</p>
                     <p className="text-sm font-semibold text-red-900 italic leading-relaxed">"{reason}"</p>
                  </Link>
                ))
              ) : !user?.adminFeedback ? (
                <div className="bg-white border border-slate-100 p-12 rounded-3xl text-center space-y-3 italic opacity-60">
                   <Bell className="h-8 w-8 text-slate-300 mx-auto" />
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No New Notifications</p>
                </div>
              ) : null}
           </div>
        </div>
      </div>
    </div>
  );
}
