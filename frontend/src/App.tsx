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
import BuyerProfile from './pages/BuyerProfile';
import Tenders from './pages/Tenders';
import Vendors from './pages/Vendors';
import Sidebar, { Header } from './components/layout/Navbar';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) return <div className="flex min-h-dvh items-center justify-center px-4 text-center font-bold italic text-indigo-600">PugArch MSME Marketplace...</div>;
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
    <div className="flex min-h-dvh bg-slate-50 font-sans text-slate-900">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className={cn("flex-1 flex flex-col min-w-0 transition-all duration-300", user && "lg:pl-64")}>
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className={cn(
          "flex-1",
          isFixedAuthRoute ? "min-h-dvh overflow-y-auto p-0" : "overflow-y-auto p-3 sm:p-4 md:p-8"
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

            <Route path="/buyer/profile" element={
              <ProtectedRoute allowedRoles={['buyer']}>
                <BuyerProfile />
              </ProtectedRoute>
            } />

            <Route path="/buyer/tenders" element={
              <ProtectedRoute allowedRoles={['buyer']}>
                <Tenders />
              </ProtectedRoute>
            } />

            <Route path="/buyer/vendors" element={
              <ProtectedRoute allowedRoles={['buyer']}>
                <Vendors />
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
