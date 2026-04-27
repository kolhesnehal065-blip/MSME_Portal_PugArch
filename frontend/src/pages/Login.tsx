import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { toast } from 'sonner';
import { ShieldCheck, Lock, Mail, Key } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;

    const destination =
      (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/dashboard';

    navigate(destination, { replace: true });
  }, [user, navigate, location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await api.post('/api/auth/login', { email, password });
      const data = await res.json();
      
      if (res.ok) {
        login(data.token, data.user);
        toast.success(`Welcome back, ${data.user.name}!`);
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-12 px-4">
      <Card className="w-full max-w-md border-none shadow-2xl shadow-indigo-100 rounded-3xl overflow-hidden animate-in fade-in zoom-in duration-500">
        <CardHeader className="text-center bg-slate-900 pb-10 pt-12 text-white relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <ShieldCheck className="h-24 w-24" />
          </div>
          <div className="mx-auto w-16 h-16 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center mb-6">
            <Lock className="h-8 w-8 text-indigo-400" />
          </div>
          <CardTitle className="text-3xl font-black italic tracking-tight uppercase">Stakeholder Access</CardTitle>
          <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest italic">PugArch Procurement Network</p>
        </CardHeader>
        <CardContent className="p-8 bg-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
               <label className="text-xs font-black uppercase text-slate-400 tracking-widest italic ml-1">Official Email</label>
               <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium italic"
                  />
               </div>
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-black uppercase text-slate-400 tracking-widest italic ml-1">Secure Password</label>
               <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium italic"
                  />
               </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[0.2em] italic shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50" 
              disabled={isLoading}
            >
              {isLoading ? 'Authenticating...' : 'Sign In Now'}
            </Button>

            <div className="text-center mt-8">
              <p className="text-sm font-medium text-slate-500 italic">
                New to the platform?{' '}
                <Link to="/seller/register" className="text-indigo-600 font-black uppercase text-[10px] hover:underline underline-offset-4 tracking-widest">Create Profile</Link>
              </p>
            </div>

            <div className="pt-8 border-t border-slate-100 mt-6 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-black italic mb-3">Developer Preview Credentials</p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[10px] space-y-1">
                 <p className="text-slate-600 font-bold">Buyer: <span className="text-indigo-600">suresh@buildcon.com</span> / password123</p>
                 <p className="text-slate-600 font-bold">Seller: <span className="text-indigo-600">rajesh@texcorp.com</span> / password123</p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
