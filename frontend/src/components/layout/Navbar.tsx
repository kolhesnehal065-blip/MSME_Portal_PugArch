import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { 
  Building2, 
  Store, 
  LayoutDashboard, 
  LogOut, 
  ShieldCheck, 
  ShoppingCart,
  Menu,
  ChevronRight,
  Bell,
  Search
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['seller', 'buyer', 'admin'] },
    { label: 'Seller Portal', path: '/seller/onboarding', icon: Store, roles: ['seller'] },
    { label: 'Buyer Hub', path: '/buyer/onboarding', icon: Building2, roles: ['buyer'] },
    { label: 'Admin Console', path: '/admin/onboarding', icon: ShieldCheck, roles: ['admin'] },
  ];

  const filteredNav = navItems.filter(item => !user || item.roles.includes(user.role));

  if (!user) return null;

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 h-full fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-slate-800">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center font-bold text-lg italic shadow-lg shadow-indigo-500/20">P</div>
          <span className="font-bold tracking-tight text-xl">PugArch</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest px-3 mb-4">Navigation</div>
        {filteredNav.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
              location.pathname === item.path
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            )}
          >
            <item.icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-110", location.pathname === item.path ? "text-white" : "text-slate-500")} />
            <span className="text-sm font-medium">{item.label}</span>
            {location.pathname === item.path && <ChevronRight className="ml-auto h-3 w-3 opacity-50" />}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center text-xs font-bold text-white shadow-inner">
            {user.name.charAt(0)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">{user.name}</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-tighter font-bold">{user.role} Account</span>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleLogout} 
          className="w-full bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white border-0 py-5"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </aside>
  );
}

export function Header() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard': return 'Dashboard Overview';
      case '/seller/onboarding': return 'Seller Onboarding';
      case '/buyer/onboarding': return 'Buyer Onboarding';
      case '/admin/onboarding': return 'Onboarding Verification';
      default: return 'Procurement ERP';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 sticky top-0 z-40 ml-64">
      <h1 className="text-lg font-bold">{getPageTitle()}</h1>
      
      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute inset-y-0 left-3 flex items-center h-full w-4 text-slate-400 pointer-events-none" />
          <input 
            type="text" 
            placeholder="Search entities..." 
            className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-xs w-64 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center cursor-pointer text-slate-400 hover:bg-slate-50 transition-colors relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
