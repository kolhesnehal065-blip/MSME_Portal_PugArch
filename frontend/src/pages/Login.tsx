import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
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
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-slate-50 px-3 py-6 sm:px-4">
      {/* BACKGROUND DECORATIONS */}
      <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-indigo-200/40 blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-violet-200/40 blur-[120px] animate-pulse" />
      
      <Card className="animate-in relative z-10 w-full max-w-[400px] overflow-hidden rounded-[2.5rem] border border-white/40 bg-white/70 backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] fade-in zoom-in duration-700">
        <CardHeader className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 pb-6 pt-6 text-center text-white">
          <div className="absolute top-0 right-0 p-6 opacity-5">
             <ShieldCheck className="h-32 w-32" />
          </div>
          <div className="relative mx-auto w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[1.25rem] flex items-center justify-center mb-4 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
            <Lock className="h-5 w-5 text-indigo-300" />
          </div>
          <CardTitle className="text-2xl font-black uppercase tracking-tight sm:text-3xl lg:text-4xl text-white">
            <span className="block text-indigo-400 text-xs tracking-[0.3em] mb-1 text-center">Secure Portal</span>
            Stakeholder Access
          </CardTitle>
          <p className="text-[10px] font-bold text-slate-400 mt-3 uppercase tracking-[0.2em] italic opacity-80 text-center">PugArch Procurement Network</p>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] italic ml-1">Official Email</label>
               <div className="group relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-12 pl-12 pr-4 rounded-2xl border border-slate-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                  />
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] italic ml-1">Secure Password</label>
               <div className="group relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-12 pl-12 pr-4 rounded-2xl border border-slate-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                  />
               </div>
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full h-12 rounded-[1.25rem] bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black uppercase tracking-[0.2em] italic shadow-[0_20px_40px_-10px_rgba(79,70,229,0.3)] transition-all hover:translate-y-[-2px] active:scale-[0.98] disabled:opacity-50" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    Authenticating...
                  </span>
                ) : 'Sign In Now'}
              </Button>
            </div>

            <div className="text-center py-2">
              <p className="text-xs font-bold text-slate-500">
                New to the platform?{' '}
                <Link to="/seller/register" className="text-indigo-600 font-black uppercase hover:text-indigo-700 transition-colors underline decoration-indigo-200 underline-offset-4 decoration-2">Create Profile</Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
