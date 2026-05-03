import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ShoppingCart, Building2, Store, ArrowRight, ShieldCheck, CheckCircle2, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="space-y-12 px-4 py-10 sm:space-y-16 sm:px-6 sm:py-16">
      {/* Hero Section */}
      <div className="mx-auto max-w-4xl space-y-6 text-center sm:space-y-8">
        <h1 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight text-slate-900">
          Streamline Your Procurement Onboarding with <span className="text-blue-600">PugArch MSME</span>
        </h1>
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600 sm:text-xl">
          The unified portal for buyers and sellers to connect, register, and manage procurement lifecycle with simplicity and transparency.
        </p>
        <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row sm:gap-4 sm:pt-4">
          {!user ? (
            <>
              <Link to="/seller/register">
                <Button size="lg" className="h-14 w-full gap-2 px-6 text-base sm:h-16 sm:w-auto sm:px-8 sm:text-lg">
                  <Store className="h-6 w-6" />
                  <span>Join as Seller</span>
                </Button>
              </Link>
              <Link to="/buyer/register">
                <Button variant="outline" size="lg" className="h-14 w-full gap-2 border-2 px-6 text-base sm:h-16 sm:w-auto sm:px-8 sm:text-lg">
                  <Building2 className="h-6 w-6" />
                  <span>Join as Buyer</span>
                </Button>
              </Link>
            </>
          ) : (
            <Link to="/dashboard">
              <Button size="lg" className="h-14 w-full gap-2 px-6 text-base sm:h-16 sm:w-auto sm:px-8 sm:text-lg">
                <LayoutDashboard className="h-6 w-6" />
                <span>Go to Dashboard</span>
              </Button>
            </Link>
          )}
        </div>
        {!user && (
          <div className="pt-6">
            <p className="text-slate-500 text-sm">
              Already have an account? {' '}
              <Link to="/login" className="text-blue-600 font-bold hover:underline">
                Login here
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="group space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md sm:p-8">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShieldCheck className="h-7 w-7 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Secure Verification</h3>
          <p className="text-slate-600 leading-relaxed">Enterprise-grade document verification and KYB checks for all participants.</p>
        </div>
        <div className="group space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md sm:p-8">
          <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Fast Approval</h3>
          <p className="text-slate-600 leading-relaxed">Dedicated admin workflow ensures onboarding is processed within 48 hours.</p>
        </div>
        <div className="group space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md sm:p-8">
          <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <ArrowRight className="h-7 w-7 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Direct Integration</h3>
          <p className="text-slate-600 leading-relaxed">Connect directly into our ERP system once your profile is approved.</p>
        </div>
      </div>
      
      <div className="flex justify-center border-t border-slate-100 pt-8 sm:pt-12">
        <Link to="/admin/register" className="text-sm font-medium text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest italic">
          Admin Control Center
        </Link>
      </div>
    </div>
  );
}
