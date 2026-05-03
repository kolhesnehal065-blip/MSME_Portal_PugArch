import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Building2,
  MapPin,
  Briefcase,
  FileCheck,
  UserCheck,
  Edit3,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function BuyerProfile() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
           setLoading(false);
           return;
        }

        const res = await api.fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent shadow-lg shadow-indigo-500/20"></div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 animate-pulse italic">Synchronizing Procurement Vault...</p>
      </div>
    );
  }

  const sections = [
    {
      id: 'org',
      title: 'Organisation Details',
      icon: Building2,
      onEdit: () => navigate('/buyer/onboarding?section=basic'),
      fields: [
        { label: 'Organization / Company Name', value: profile?.organizationName },
        { label: 'Business Type', value: profile?.businessType },
        { label: 'Industry / Sector', value: profile?.industry },
        { label: 'CIN / Registration Number (if applicable)', value: profile?.cin || 'Not Provided' },
        { label: 'PAN of Organization', value: profile?.pan },
        { label: 'GSTIN (Optional)', value: profile?.gst || 'Not Provided' },
        { label: 'Website URL (Optional)', value: profile?.website || 'Not Provided' },
      ]
    },
    {
      id: 'rep',
      title: 'Authorized Representative',
      icon: UserCheck,
      onEdit: () => navigate('/buyer/onboarding?section=business'),
      fields: [
        { label: 'NAME', value: profile?.representativeName },
        { label: 'DESIGNATION', value: profile?.designation },
        { label: 'DEPARTMENT', value: profile?.department },
        { label: 'EMAIL', value: profile?.email || user?.email },
        { label: 'MOBILE', value: profile?.mobile },
        { label: 'ALTERNATE MOBILE', value: profile?.alternateMobile || 'Not Provided' },
      ]
    },
    {
      id: 'address',
      title: 'Address Details',
      icon: MapPin,
      onEdit: () => navigate('/buyer/onboarding?section=compliance'),
      fields: [
        { label: 'STATE', value: profile?.state },
        { label: 'CITY', value: profile?.city },
        { label: 'PINCODE', value: profile?.pincode },
        { label: 'REGISTERED ADDRESS', value: profile?.registeredAddress },
        { label: 'CORPORATE ADDRESS', value: profile?.corporateAddress || 'Same as Registered' },
      ]
    },
    {
      id: 'procurement',
      title: 'Procurement Profile',
      icon: Briefcase,
      onEdit: () => navigate('/buyer/onboarding?section=bank'),
      fields: [
        { label: 'PROCUREMENT CATEGORIES', value: profile?.procurementCategories?.join(', ') || 'Not Provided' },
        { label: 'ANNUAL PROCUREMENT BUDGET', value: profile?.annualBudget || 'Not Provided' },
        { label: 'PREFERRED PROCUREMENT METHODS', value: profile?.preferredMethods?.join(', ') || 'Not Provided' },
      ]
    },
    {
      id: 'docs',
      title: 'Compliance Documents',
      icon: FileCheck,
      onEdit: () => navigate('/buyer/onboarding?section=documents'),
      fields: [
        { label: 'PAN CARD', value: profile?.documents?.panCard ? 'Verified Document' : 'Pending Upload' },
        { label: 'REGISTRATION CERT', value: profile?.documents?.regCert ? 'Verified Document' : 'Pending Upload' },
        { label: 'GST CERTIFICATE', value: profile?.documents?.gstCert ? 'Verified Document' : 'Pending Upload' },
        { label: 'ADDRESS PROOF', value: profile?.documents?.addressProof ? 'Verified Document' : 'Pending Upload' },
        { label: 'AUTHORITY LETTER', value: profile?.documents?.authLetter ? 'Verified Document' : 'Pending Upload' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Account</p>
            <h1 className="text-3xl font-bold text-slate-900">Profile & Compliance</h1>
            <p className="text-sm text-slate-500">
              Submitted information visible to vendors and the GeM compliance team.
            </p>
          </div>
          <Button 
            onClick={() => navigate('/buyer/onboarding')}
            variant="outline"
            className="bg-white border-slate-200 text-slate-700 h-10 px-6 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-slate-50"
          >
            <Edit3 className="h-4 w-4" />
            Edit profile
          </Button>
        </div>

        {/* Profile Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sections.map((section) => (
            <Card key={section.id} className="bg-white border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
                <CardTitle className="text-lg font-bold text-slate-900">{section.title === 'Organisation Details' ? 'Company Basics' : section.title === 'Compliance Documents' ? 'Tax & Compliance' : section.title}</CardTitle>
                <button 
                  onClick={section.onEdit}
                  className="text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-1.5 text-sm font-medium"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit
                </button>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                  {section.fields.map((field, idx) => (
                    <div key={idx} className={cn("space-y-1", (field.label === 'REGISTERED ADDRESS' || field.label === 'CORPORATE ADDRESS' || field.label === 'CATEGORIES' || field.label === 'PREFERRED METHODS') ? "sm:col-span-2" : "")}>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                        {field.label}
                      </p>
                      <p className={cn(
                        "text-sm font-bold tracking-tight",
                        field.value ? "text-slate-900" : "text-slate-300 italic"
                      )}>
                        {field.value || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Decorative Background Elements */}
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/[0.03] rounded-full blur-[150px] -z-50 pointer-events-none"></div>
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-blue-600/[0.03] rounded-full blur-[150px] -z-50 pointer-events-none"></div>
    </div>
  );
}
