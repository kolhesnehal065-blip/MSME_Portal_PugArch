import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ShoppingCart, Building2, Store, ArrowRight, ShieldCheck, CheckCircle2, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="space-y-10 px-3 py-8 sm:space-y-14 sm:px-4 sm:py-12">
      {/* Hero Section */}
      <div className="mx-auto max-w-3xl space-y-5 text-center sm:space-y-6">
        <h1 className="px-1 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
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
      <div className="grid gap-4 sm:gap-6 md:grid-cols-3 md:gap-8">
        <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8 sm:space-y-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold">Secure Verification</h3>
          <p className="text-slate-600">Enterprise-grade document verification and KYB checks for all participants.</p>
        </div>
        <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8 sm:space-y-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-xl font-bold">Fast Approval</h3>
          <p className="text-slate-600">Dedicated admin workflow ensures onboarding is processed within 48 hours.</p>
        </div>
        <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8 sm:space-y-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <ArrowRight className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold">Direct Integration</h3>
          <p className="text-slate-600">Connect directly into our ERP system once your profile is approved.</p>
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
