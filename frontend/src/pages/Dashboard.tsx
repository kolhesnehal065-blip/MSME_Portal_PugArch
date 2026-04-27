import { useEffect, useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '../components/ui/Card';
import { CheckCircle2, Clock, XCircle, FileText, ArrowRight, ShieldCheck } from 'lucide-react';

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
        
        // Fetch profile (for both roles)
        const profileRes = await fetch('/api/auth/me', { headers });
        if (profileRes.status === 401) {
          logout();
          navigate('/', { replace: true });
          return;
        }

        const profileData = await profileRes.json();
        setProfile(profileData.profile);

        // Fetch stats if admin
        const currentUser = profileData.user;
        if (currentUser?.role === 'admin') {
          const statsRes = await fetch('/api/admin/stats', { headers });
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

  if (isLoading) return <div className="flex justify-center py-12">Loading portal...</div>;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved_for_procurement': return <CheckCircle2 className="h-12 w-12 text-green-500" />;
      case 'rejected': return <XCircle className="h-12 w-12 text-red-500" />;
      case 'verified': return <ShieldCheck className="h-12 w-12 text-indigo-500" />;
      default: return <Clock className="h-12 w-12 text-amber-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved_for_procurement': return 'success';
      case 'rejected': return 'error';
      case 'verified': return 'success';
      case 'resubmission_required': return 'warning';
      case 'under_compliance_review': return 'warning';
      default: return 'warning';
    }
  };

  if (user?.role === 'admin') {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">System Overview</h1>
          <Link to="/admin/onboarding">
            <Button className="space-x-2">
              <ShieldCheck className="h-4 w-4" />
              <span>Review Onboarding</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1 italic">Pending Approval</div>
            <div className="text-3xl font-bold tracking-tight">{adminStats?.pendingApproval ?? '...'}</div>
            <div className="mt-2 text-[10px] uppercase font-bold text-amber-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
              Requires Review
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1 italic">Active Sellers</div>
            <div className="text-3xl font-bold tracking-tight">{adminStats?.activeSellers ?? '...'}</div>
            <div className="mt-2 text-[10px] uppercase font-bold text-emerald-600">Verified & Validated</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1 italic">Active Buyers</div>
            <div className="text-3xl font-bold tracking-tight">{adminStats?.activeBuyers ?? '...'}</div>
            <div className="mt-2 text-[10px] uppercase font-bold text-indigo-600">Enterprise Tier</div>
          </div>
        </div>

        <Card>
          <CardContent className="py-12 text-center space-y-6">
             <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <ShieldCheck className="h-8 w-8 text-blue-600" />
             </div>
             <h2 className="text-xl font-semibold">Welcome, Administrator</h2>
             <p className="text-slate-600 max-w-md mx-auto">Manage buyer and seller registrations, review document details and approve access to the procurement network.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onboardingComplete = !!profile;



  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
          <p className="text-slate-500 mt-1">Role: <span className="capitalize font-semibold text-slate-700">{user?.role}</span></p>
        </div>
        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-slate-200">
          <span className="text-sm font-medium text-slate-500">Account Status:</span>
          <Badge variant={getStatusColor(user?.onboardingStatus || 'pending') as any}>{user?.onboardingStatus || 'pending'}</Badge>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Onboarding Progress */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span>Onboarding Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className={onboardingComplete ? "text-green-500" : "text-yellow-500"}>
                {onboardingComplete ? <CheckCircle2 className="h-10 w-10" /> : <Clock className="h-10 w-10" />}
              </div>
              <div>
                <h4 className="font-bold text-lg">{onboardingComplete ? 'Profile Submitted' : 'Profile Pending'}</h4>
                <p className="text-sm text-slate-500">{onboardingComplete ? 'Your registration details are active and under review.' : 'Complete your registration to start using the platform.'}</p>
              </div>
            </div>

            {!onboardingComplete ? (
              <Link to={user?.role === 'seller' ? '/seller/onboarding' : '/buyer/onboarding'}>
                <Button className="w-full space-x-2 h-11" variant="primary">
                  <span>Complete Onboarding</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link to={user?.role === 'seller' ? '/seller/onboarding' : '/buyer/onboarding'}>
                <Button className="w-full" variant="outline">View/Edit Profile</Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Status Illustration */}
        <Card className="h-full bg-slate-50 border-dashed border-2 flex items-center justify-center p-8">
          <div className="text-center space-y-4">
             <div className="mx-auto bg-white p-4 rounded-full shadow-sm w-max">
                {getStatusIcon(user?.status || 'pending')}
             </div>
             <h3 className="text-xl font-bold capitalize">{user?.status || 'pending'}</h3>
             <p className="text-sm text-slate-500 max-w-xs mx-auto">
               {user?.status === 'pending' && "Your account is currently under review by our admin team. You will be notified once approved."}
               {user?.status === 'approved' && "Congratulations! Your account is approved. You can now access full procurement features."}
               {user?.status === 'rejected' && "Unfortunately, your application was not approved at this time. Please contact support for more information."}
             </p>
          </div>
        </Card>
      </div>

      {user?.adminFeedback && (
        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-100 space-y-4 mb-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Important: Message from Administrator</p>
          </div>
          <p className="text-sm font-medium text-amber-900 italic border-l-4 border-amber-200 pl-4 py-1">"{user.adminFeedback}"</p>
        </div>
      )}

      {user?.status !== 'approved' && user?.sectionStatus && (
        <Card className="border-indigo-100 bg-indigo-50/10 mb-6">
          <CardHeader>
            <CardTitle className="text-indigo-950 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              <span>Verification Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(user.sectionStatus).map(([section, status]: [string, any]) => (
                <div key={section} className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm flex flex-col items-center text-center gap-2">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{section}</p>
                   <Badge variant={status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'warning'} className="w-full justify-center capitalize">
                      {status}
                   </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {onboardingComplete && profile && (
        <Card>
          <CardHeader>
            <CardTitle>Business Overview</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Company Name</p>
                  <p className="text-sm font-medium text-slate-900 mt-1">{profile.businessName || profile.organizationName}</p>
                </div>
                <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tax ID (GST)</p>
                   <p className="text-sm font-medium text-slate-900 mt-1">{profile.gst}</p>
                </div>
                <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">City/State</p>
                   <p className="text-sm font-medium text-slate-900 mt-1">{profile.city}, {profile.state}</p>
                </div>
                <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Submitted On</p>
                   <p className="text-sm font-medium text-slate-900 mt-1">{profile.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : 'N/A'}</p>
                </div>
             </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
