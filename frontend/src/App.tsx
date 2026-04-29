import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Toaster } from 'sonner';
import { cn } from './lib/utils';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SellerOnboarding from './pages/SellerOnboarding';
import BuyerOnboarding from './pages/BuyerOnboarding';
import AdminOnboarding from './pages/AdminOnboarding';
import SellerRegistrationFlow from './pages/SellerRegistrationFlow';
import BuyerRegistrationFlow from './pages/BuyerRegistrationFlow';
import Sidebar, { Header } from './components/layout/Navbar';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) return <div className="flex h-screen items-center justify-center font-bold text-indigo-600 italic">PugArch MSME Marketplace...</div>;
  if (!user) return <Navigate to="/" state={{ from: location }} replace />;
  if (user && allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" />;
  
  return <>{children}</>;
};

function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const fixedAuthRoutes = ['/', '/login', '/seller/register', '/buyer/register', '/admin/register'];
  const isFixedAuthRoute = !user && fixedAuthRoutes.includes(location.pathname);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className={cn("flex-1 flex flex-col min-w-0 transition-all duration-300", user && "lg:pl-64")}>
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className={cn(
          "flex-1",
          isFixedAuthRoute ? "h-screen overflow-hidden p-0" : "p-4 md:p-8 overflow-y-auto"
        )}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
            <Route path="/seller/register" element={<SellerRegistrationFlow />} />
            <Route path="/buyer/register" element={<BuyerRegistrationFlow />} />
            <Route path="/admin/register" element={<Register type="admin" />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/seller/onboarding" element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerOnboarding />
              </ProtectedRoute>
            } />
            
            <Route path="/buyer/onboarding" element={
              <ProtectedRoute allowedRoles={['buyer']}>
                <BuyerOnboarding />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/onboarding" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminOnboarding />
              </ProtectedRoute>
            } />
            


            <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
          </Routes>
        </main>
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
