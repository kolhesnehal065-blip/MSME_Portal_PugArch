import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ShoppingCart, Building2, Store, ArrowRight, ShieldCheck, CheckCircle2, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="space-y-16 py-12">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 px-4 md:px-0">
          Streamline Your Procurement Onboarding with <span className="text-blue-600">PugArch MSME</span>
        </h1>
        <p className="text-xl text-slate-600 leading-relaxed">
          The unified portal for buyers and sellers to connect, register, and manage procurement lifecycle with simplicity and transparency.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          {!user ? (
            <>
              <Link to="/seller/register">
                <Button size="lg" className="w-full sm:w-auto h-16 text-lg px-8 space-x-2">
                  <Store className="h-6 w-6" />
                  <span>Join as Seller</span>
                </Button>
              </Link>
              <Link to="/buyer/register">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-16 text-lg px-8 space-x-2 border-2">
                  <Building2 className="h-6 w-6" />
                  <span>Join as Buyer</span>
                </Button>
              </Link>
            </>
          ) : (
            <Link to="/dashboard">
              <Button size="lg" className="w-full sm:w-auto h-16 text-lg px-8 space-x-2">
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
      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold">Secure Verification</h3>
          <p className="text-slate-600">Enterprise-grade document verification and KYB checks for all participants.</p>
        </div>
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-xl font-bold">Fast Approval</h3>
          <p className="text-slate-600">Dedicated admin workflow ensures onboarding is processed within 48 hours.</p>
        </div>
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <ArrowRight className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold">Direct Integration</h3>
          <p className="text-slate-600">Connect directly into our ERP system once your profile is approved.</p>
        </div>
      </div>
      
      <div className="pt-12 border-t border-slate-100 flex justify-center">
        <Link to="/admin/register" className="text-sm font-medium text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest italic">
          Admin Control Center
        </Link>
      </div>
    </div>
  );
}
