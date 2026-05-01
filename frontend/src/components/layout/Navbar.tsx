import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { 
  AlertTriangle,
  Building2, 
  Store, 
  LayoutDashboard, 
  LogOut, 
  ShieldCheck, 
  ShoppingCart,
  Menu,
  X,
  ChevronRight,
  Bell,
  Search,
  Users,
  FileText,
  User as UserIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
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
    { label: 'Vendors', path: '/buyer/vendors', icon: Users, roles: ['buyer'] },
    { label: 'Tenders', path: '/buyer/tenders', icon: FileText, roles: ['buyer'] },
    { label: 'Profile', path: '/buyer/profile', icon: UserIcon, roles: ['buyer'] },
    { label: 'Admin Console', path: '/admin/onboarding', icon: ShieldCheck, roles: ['admin'] },
  ];

  const filteredNav = navItems.filter(item => !user || item.roles.includes(user.role));

  if (!user) return null;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "w-64 bg-slate-900 text-white flex flex-col shrink-0 h-full fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3" onClick={onClose}>
          <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center font-bold text-lg italic shadow-lg shadow-indigo-500/20">P</div>
          <span className="font-bold tracking-tight text-xl">PugArch</span>
        </Link>
        <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:text-white" aria-label="Close sidebar">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest px-3 mb-4">Navigation</div>
        {filteredNav.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            onClick={onClose}
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
      </>
    );
}

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const sectionLabels: Record<string, string> = {
    basic: 'Basic Details',
    business: 'Business Details',
    compliance: 'Compliance',
    bank: 'Bank Details',
    documents: 'Documents',
  };

  const sectionRouteMap: Record<string, { seller: string; buyer: string }> = {
    basic: { seller: '/seller/onboarding?section=basic', buyer: '/buyer/onboarding?section=basic' },
    business: { seller: '/seller/onboarding?section=business', buyer: '/buyer/onboarding?section=business' },
    compliance: { seller: '/seller/onboarding?section=compliance', buyer: '/buyer/onboarding?section=compliance' },
    bank: { seller: '/seller/onboarding?section=bank', buyer: '/buyer/onboarding?section=bank' },
    documents: { seller: '/seller/onboarding?section=documents', buyer: '/buyer/onboarding?section=documents' },
  };

  const rejectionNotifications = useMemo(() => {
    if (!user?.sectionStatus || !['seller', 'buyer'].includes(user.role)) return [];

    return Object.entries(user.sectionStatus)
      .filter(([, status]) => ['rejected', 'resubmission_required'].includes(String(status)))
      .map(([section, status]) => ({
        section,
        status: String(status),
        label: sectionLabels[section] || section,
        message: `Your ${sectionLabels[section] || section} section has been rejected by Admin. Please review and update.`,
      }));
  }, [user]);

  if (!user) return null;

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard': return 'Dashboard Overview';
      case '/seller/onboarding': return 'Seller Onboarding';
      case '/buyer/onboarding': return 'Buyer Onboarding';
      case '/buyer/vendors': return 'Vendor Discovery';
      case '/admin/onboarding': return 'Onboarding Verification';
      default: return 'Procurement ERP';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0 sticky top-0 z-40 lg:ml-64 transition-all duration-300">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-lg lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-sm md:text-lg font-bold truncate max-w-[150px] md:max-w-none">{getPageTitle()}</h1>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute inset-y-0 left-3 flex items-center h-full w-4 text-slate-400 pointer-events-none" />
          <input 
            type="text" 
            placeholder="Search entities..." 
            className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-xs w-64 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
          />
        </div>
        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(prev => !prev)}
            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center cursor-pointer text-slate-400 hover:bg-slate-50 transition-colors relative"
            aria-label="Open notifications"
          >
            <Bell className="h-4 w-4" />
            {rejectionNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white border-2 border-white text-[10px] font-black flex items-center justify-center">
                {rejectionNotifications.length}
              </span>
            )}
          </button>
          {isNotificationsOpen && (
            <div className="absolute right-0 top-12 w-80 md:w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/70 overflow-hidden z-50">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-900">Notifications</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Seller portal alerts</p>
                </div>
                {rejectionNotifications.length > 0 && (
                  <span className="rounded-full bg-red-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-red-600">
                    Action Required
                  </span>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto p-3">
                {rejectionNotifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm font-bold text-slate-700">No new alerts</p>
                    <p className="mt-1 text-xs text-slate-400">Important onboarding updates will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rejectionNotifications.map((item) => (
                      <button
                        key={item.section}
                        type="button"
                        onClick={() => {
                          setIsNotificationsOpen(false);
                          navigate(sectionRouteMap[item.section]?.[user.role as 'seller' | 'buyer'] || '/dashboard');
                        }}
                        className="w-full rounded-xl border border-red-100 bg-red-50/70 p-4 text-left transition-all hover:border-red-200 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-red-500 shadow-sm">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{item.label}</p>
                            <p className="mt-1 text-sm font-semibold leading-relaxed text-red-950">{item.message}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
