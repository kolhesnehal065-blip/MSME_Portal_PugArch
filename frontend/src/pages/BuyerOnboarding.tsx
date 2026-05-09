import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input, Select } from '../components/ui/input';
import { Card, CardContent, Badge } from '../components/ui/card';
import { Stepper, Step } from '../components/ui/stepper';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Save, Upload, CheckCircle2, AlertTriangle, Clock, ShieldCheck, X, ExternalLink, Plus, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';
import { validateField, FieldType } from '../lib/validation';


const SIDEBAR_SECTIONS = [
  { id: 'org', label: 'Organisation Details' },
  { id: 'rep', label: 'Authorized Representative' },
  { id: 'procurement', label: 'Procurement Profile' },
  { id: 'docs', label: 'Document Upload' },
  { id: 'account', label: 'Account Setup' },
];

const DEPARTMENT_OPTIONS = ['Procurement', 'Finance', 'Admin', 'Operations', 'Management', 'Others'];
const PROCUREMENT_CATEGORY_OPTIONS = ['IT Equipment', 'Office Supplies', 'Machinery', 'Services', 'Construction', 'Consulting', 'Others'];
const ANNUAL_BUDGET_OPTIONS = ['< ₹10 Lakh', '₹10 Lakh – ₹1 Crore', '₹1 Crore – ₹10 Crore', '₹10 Crore+'];
const PROCUREMENT_METHOD_OPTIONS = ['Direct Purchase', 'Quotation Based', 'Tender / Bidding', 'Reverse Auction', 'Others'];
const BUYER_ONBOARDING_DRAFT_KEY = 'buyer-onboarding-draft';
const DASHBOARD_SECTION_TO_BUYER_SECTION: Record<string, string> = {
  basic: 'org',
  business: 'rep',
  compliance: 'org',
  bank: 'procurement',
  documents: 'docs',
};

const getDocumentPreviewUrl = (url: string) => {
  if (!url) return url;

  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('.png') || lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg') || lowerUrl.includes('.gif') || lowerUrl.includes('.webp') || lowerUrl.includes('.pdf')) {
    return url;
  }

  return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`;
};

const getOfficePreviewUrl = (url: string) =>
  `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;

const getDocumentExtension = (url: string) => {
  const cleanedUrl = url.split('?')[0].toLowerCase();
  const match = cleanedUrl.match(/\.([a-z0-9]+)$/);
  return match?.[1] || '';
};

const getDocumentPreviewMode = (url: string) => {
  const extension = getDocumentExtension(url);

  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
  if (extension === 'pdf') return 'pdf';
  if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(extension)) return 'office';
  return 'google';
};

export default function BuyerOnboarding() {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('org');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<any>({
    // Organisation Details
    organizationName: '',
    businessType: 'Private Limited Company',
    industry: '',
    cin: '',
    pan: '',
    gst: '',
    website: '',

    // Authorized Representative
    representativeName: '',
    designation: '',
    department: 'Procurement',
    customDepartment: '',
    email: '',
    mobile: '',
    alternateMobile: '',

    // Address Details
    country: 'India',
    state: '',
    city: '',
    pincode: '',
    registeredAddress: '',
    corporateAddress: '',

    // Procurement Profile
    procurementCategories: [],
    otherCategoryDetails: '',
    customProcurementCategoryInput: '',
    customProcurementCategories: [],
    annualBudget: '< ₹10 Lakh',
    preferredMethods: [],
    otherMethodDetails: '',
    customProcurementMethodInput: '',
    customPreferredMethods: [],

    // Document Upload
    documents: {
      panCard: '',
      regCert: '',
      gstCert: '',
      addressProof: '',
      authLetter: ''
    },

    // Account Setup
    password: '',
    confirmPassword: '',
    declaration: false,
    agreeTerms: false,
  });

  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isProfileLocked, setIsProfileLocked] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<{ label: string; url: string; mode: 'image' | 'pdf' | 'office' | 'google' } | null>(null);
  const [isFetchingGst, setIsFetchingGst] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    const mappedSection = section ? DASHBOARD_SECTION_TO_BUYER_SECTION[section] : null;
    if (mappedSection) {
      setActiveSection(mappedSection);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        await refreshUser();
        const res = await api.fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        const regDetails = data.user?.registrationDetails || {};
        const profileLocked = data.user?.onboardingStatus === 'approved_for_procurement';
        setIsProfileLocked(profileLocked);
        const profileDepartment = data.profile?.department || '';
        const hasPresetDepartment = DEPARTMENT_OPTIONS.includes(profileDepartment) && profileDepartment !== 'Others';
        const profileProcurementCategories = Array.isArray(data.profile?.procurementCategories) ? data.profile.procurementCategories : [];
        const savedPresetProcurementCategories = profileProcurementCategories.filter((category: string) => PROCUREMENT_CATEGORY_OPTIONS.includes(category) && category !== 'Others');
        const savedCustomProcurementCategories = profileProcurementCategories.filter((category: string) => !PROCUREMENT_CATEGORY_OPTIONS.includes(category));
        const normalizedProcurementCategories = savedCustomProcurementCategories.length > 0
          ? [...savedPresetProcurementCategories, 'Others']
          : savedPresetProcurementCategories;
        const storedDraftRaw = localStorage.getItem(BUYER_ONBOARDING_DRAFT_KEY);
        const storedDraft = !profileLocked && storedDraftRaw ? JSON.parse(storedDraftRaw) : null;
        const draftDepartment = storedDraft?.formData?.department || '';
        const hasDraftPresetDepartment = DEPARTMENT_OPTIONS.includes(draftDepartment) && draftDepartment !== 'Others';

        const profilePreferredMethods = Array.isArray(data.profile?.preferredMethods) ? data.profile.preferredMethods : [];
        const savedPresetMethods = profilePreferredMethods.filter((method: string) => PROCUREMENT_METHOD_OPTIONS.includes(method) && method !== 'Others');
        const savedCustomMethods = profilePreferredMethods.filter((method: string) => !PROCUREMENT_METHOD_OPTIONS.includes(method));
        const normalizedMethods = savedCustomMethods.length > 0
          ? [...savedPresetMethods, 'Others']
          : savedPresetMethods;

        setFormData((prev: any) => ({
          ...prev,
          ...(data.profile || {}),
          procurementCategories: normalizedProcurementCategories.length > 0 ? normalizedProcurementCategories : prev.procurementCategories,
          customProcurementCategories: savedCustomProcurementCategories,
          otherCategoryDetails: savedCustomProcurementCategories.join(', '),
          customProcurementCategoryInput: '',
          preferredMethods: normalizedMethods.length > 0 ? normalizedMethods : prev.preferredMethods,
          customPreferredMethods: savedCustomMethods,
          otherMethodDetails: savedCustomMethods.join(', '),
          customProcurementMethodInput: '',
          ...(storedDraft?.formData || {}),
          department: profileDepartment ? (hasPresetDepartment ? profileDepartment : 'Others') : prev.department,
          customDepartment: profileDepartment && !hasPresetDepartment ? profileDepartment : (prev.customDepartment || ''),
          ...(storedDraft?.formData?.department ? {
            department: hasDraftPresetDepartment ? storedDraft.formData.department : 'Others',
            customDepartment: !hasDraftPresetDepartment ? storedDraft.formData.department : (storedDraft.formData.customDepartment || '')
          } : {}),
          email: storedDraft?.formData?.email || data.user?.email || prev.email,
          organizationName: data.profile?.organizationName || regDetails.businessName || data.user?.name || prev.organizationName,
          mobile: data.profile?.mobile || data.user?.mobile || prev.mobile,
          representativeName: data.profile?.representativeName || data.user?.name || prev.representativeName,
          state: data.profile?.state || regDetails.state || prev.state,
          district: data.profile?.district || regDetails.district || prev.district,
          officeZoneName: data.profile?.officeZoneName || regDetails.officeZoneName || prev.officeZoneName,
          aadhaarNumber: data.profile?.aadhaarNumber || regDetails.aadhaarNumber || prev.aadhaarNumber,
          aadhaarVerified: data.profile?.aadhaarVerified || regDetails.isAadhaarVerified || prev.aadhaarVerified
        }));
        if (storedDraft?.activeSection && SIDEBAR_SECTIONS.some(section => section.id === storedDraft.activeSection)) {
          setActiveSection(storedDraft.activeSection);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsFetching(false);
      }
    };
    fetchProfile();
  }, []);

  const fetchGstDetails = async () => {
    if (!formData.gst || formData.gst.length !== 15) {
      toast.error('Please enter a valid 15-digit GSTIN');
      return;
    }

    setIsFetchingGst(true);
    try {
      const res = await api.fetch(`/api/utils/gst-verify/${formData.gst}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setFormData((prev: any) => ({
          ...prev,
          organizationName: data.legalName || prev.organizationName,
          registeredAddress: data.address || prev.registeredAddress,
          state: data.state || prev.state,
          city: data.city || prev.city,
          pincode: data.pincode || prev.pincode,
          pan: data.pan || prev.pan,
        }));
        toast.success('Organization details fetched successfully');
      } else {
        toast.error('Could not fetch GST details. Please enter manually.');
      }
    } catch (err) {
      toast.error('Verification service unavailable');
    } finally {
      setIsFetchingGst(false);
    }
  };

  useEffect(() => {
    if (isFetching || isProfileLocked) return;

    localStorage.setItem(BUYER_ONBOARDING_DRAFT_KEY, JSON.stringify({
      activeSection,
      formData
    }));
  }, [activeSection, formData, isFetching, isProfileLocked]);

  const validate = (name: string, value: string) => {
    let fieldType: FieldType | null = null;
    if (name === 'pan') fieldType = 'pan';
    if (name === 'gst') fieldType = 'gst';
    if (name === 'cin') fieldType = 'cin';
    if (name === 'mobile' || name === 'alternateMobile') fieldType = 'mobile';
    if (name === 'email') fieldType = 'email';
    if (name === 'pincode') fieldType = 'pincode';
    if (name === 'representativeName') fieldType = 'name';

    if (fieldType) {
      const error = validateField(fieldType, value);
      setErrors(prev => ({ ...prev, [name]: error || '' }));
      return !error;
    }
    return true;
  };

  const validateWebsite = (value: string) => {
    if (!value.trim()) return true;
    try {
      const normalizedValue = value.startsWith('http://') || value.startsWith('https://')
        ? value
        : `https://${value}`;
      new URL(normalizedValue);
      setErrors(prev => ({ ...prev, website: '' }));
      return true;
    } catch {
      setErrors(prev => ({ ...prev, website: 'Invalid Website URL' }));
      return false;
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    if (name === 'website') {
      validateWebsite(value);
      return;
    }
    validate(name, value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (isProfileLocked) return;
    const { name, value, type } = (e.target as any);
    let newValue = value;

    // Character Blocking & Auto Formatting
    if (['mobile', 'alternateMobile', 'pincode'].includes(name)) {
      newValue = value.replace(/[^0-9]/g, '');
      if (name === 'mobile' || name === 'alternateMobile') newValue = newValue.slice(0, 10);
      if (name === 'pincode') newValue = newValue.slice(0, 6);
    }

    if (['pan', 'gst', 'cin'].includes(name)) {
      newValue = value.toUpperCase().trim();
      if (name === 'pan') newValue = newValue.slice(0, 10);
      if (name === 'gst') newValue = newValue.slice(0, 15);
      if (name === 'cin') newValue = newValue.slice(0, 21);
    }

    if (name === 'representativeName') {
      newValue = value.replace(/[^A-Za-z ]/g, '');
    }

    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else if (name === 'department') {
      setFormData({
        ...formData,
        department: newValue,
        customDepartment: newValue === 'Others' ? formData.customDepartment : ''
      });
    } else if (name === 'website') {
      setFormData({ ...formData, [name]: newValue.trim() });
      if (touched[name]) validateWebsite(newValue);
    } else {
      setFormData({ ...formData, [name]: newValue });
      if (touched[name]) validate(name, newValue);
    }
  };

  const toggleTag = (field: string, value: string) => {
    if (isProfileLocked) return;
    const values = [...formData[field]];
    if (values.includes(value)) {
      setFormData({
        ...formData,
        [field]: values.filter(v => v !== value),
        ...(field === 'procurementCategories' && value === 'Others'
          ? { otherCategoryDetails: '', customProcurementCategoryInput: '', customProcurementCategories: [] }
          : {}),
        ...(field === 'preferredMethods' && value === 'Others'
          ? { otherMethodDetails: '', customProcurementMethodInput: '', customPreferredMethods: [] }
          : {})
      });
    } else {
      setFormData({ ...formData, [field]: [...values, value] });
    }
  };

  const handleProcurementCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (isProfileLocked) return;
    const { value } = e.target;
    if (!value) return;

    if (!formData.procurementCategories.includes(value)) {
      setFormData({
        ...formData,
        procurementCategories: [...formData.procurementCategories, value]
      });
    }
  };

  const addCustomProcurementCategory = () => {
    if (isProfileLocked) return;
    const category = formData.customProcurementCategoryInput.trim();
    if (!category) return;

    const existsInPreset = formData.procurementCategories.some((item: string) => item.toLowerCase() === category.toLowerCase());
    const existsInCustom = formData.customProcurementCategories.some((item: string) => item.toLowerCase() === category.toLowerCase());

    if (existsInPreset || existsInCustom) {
      toast.error('This procurement category is already added');
      return;
    }

    const updatedCustomProcurementCategories = [...formData.customProcurementCategories, category];
    setFormData({
      ...formData,
      procurementCategories: formData.procurementCategories.includes('Others')
        ? formData.procurementCategories
        : [...formData.procurementCategories, 'Others'],
      customProcurementCategoryInput: '',
      customProcurementCategories: updatedCustomProcurementCategories,
      otherCategoryDetails: updatedCustomProcurementCategories.join(', ')
    });
  };

  const removeCustomProcurementCategory = (categoryToRemove: string) => {
    if (isProfileLocked) return;
    const updatedCustomProcurementCategories = formData.customProcurementCategories.filter((item: string) => item !== categoryToRemove);
    setFormData({
      ...formData,
      customProcurementCategories: updatedCustomProcurementCategories,
      otherCategoryDetails: updatedCustomProcurementCategories.join(', '),
      procurementCategories: updatedCustomProcurementCategories.length === 0
        ? formData.procurementCategories.filter((item: string) => item !== 'Others')
        : formData.procurementCategories
    });
  };

  const handleProcurementMethodSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (isProfileLocked) return;
    const { value } = e.target;
    if (!value) return;

    if (!formData.preferredMethods.includes(value)) {
      setFormData({
        ...formData,
        preferredMethods: [...formData.preferredMethods, value]
      });
    }
  };

  const addCustomPreferredMethod = () => {
    if (isProfileLocked) return;
    const method = formData.customProcurementMethodInput.trim();
    if (!method) return;

    const existsInPreset = formData.preferredMethods.some((item: string) => item.toLowerCase() === method.toLowerCase());
    const existsInCustom = formData.customPreferredMethods.some((item: string) => item.toLowerCase() === method.toLowerCase());

    if (existsInPreset || existsInCustom) {
      toast.error('This procurement method is already added');
      return;
    }

    const updatedCustomPreferredMethods = [...formData.customPreferredMethods, method];
    setFormData({
      ...formData,
      preferredMethods: formData.preferredMethods.includes('Others')
        ? formData.preferredMethods
        : [...formData.preferredMethods, 'Others'],
      customProcurementMethodInput: '',
      customPreferredMethods: updatedCustomPreferredMethods,
      otherMethodDetails: updatedCustomPreferredMethods.join(', ')
    });
  };

  const removeCustomPreferredMethod = (methodToRemove: string) => {
    if (isProfileLocked) return;
    const updatedCustomPreferredMethods = formData.customPreferredMethods.filter((item: string) => item !== methodToRemove);
    setFormData({
      ...formData,
      customPreferredMethods: updatedCustomPreferredMethods,
      otherMethodDetails: updatedCustomPreferredMethods.join(', '),
      preferredMethods: updatedCustomPreferredMethods.length === 0
        ? formData.preferredMethods.filter((item: string) => item !== 'Others')
        : formData.preferredMethods
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (isProfileLocked) return;
    const file = e.target.files?.[0];
    if (!file) return;

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File is too large. Max limit is 10MB.');
      e.target.value = '';
      return;
    }

    console.log(`--- Starting upload for ${fieldName}: ${file.name} (${file.size} bytes) ---`);
    setIsUploading(fieldName);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const res = await api.fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataUpload
      });

      if (res.ok) {
        const data = await res.json();
        const fieldPath = fieldName.split('.');
        if (fieldPath.length > 1) {
          setFormData({
            ...formData,
            [fieldPath[0]]: {
              ...formData[fieldPath[0]],
              [fieldPath[1]]: data.url
            }
          });
        } else {
          setFormData({ ...formData, [fieldName]: data.url });
        }
        toast.success('Document uploaded successfully');
      } else {
        const errData = await res.json();
        console.error('Upload failed:', errData);
        toast.error(errData.message || 'Upload failed');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(`Upload error: ${err.message || 'Check network'}`);
    } finally {
      setIsUploading(null);
      // Reset the file input so the same file can be selected again if needed
      e.target.value = '';
    }
  };

  const validateSection = (sectionId: string) => {
    let fields: string[] = [];
    if (sectionId === 'org') fields = ['organizationName', 'pan', 'state', 'city', 'pincode', 'registeredAddress'];
    if (sectionId === 'rep') fields = ['representativeName', 'email', 'mobile'];

    if (sectionId === 'account') fields = ['password', 'confirmPassword'];

    let isValid = true;
    fields.forEach(field => {
      const isFieldValid = validate(field, formData[field] || '');
      if (!isFieldValid) isValid = false;
    });

    return isValid;
  };

  const hasValue = (value: unknown) => typeof value === 'string' ? value.trim().length > 0 : Boolean(value);

  const getSectionCompletion = (sectionId: string) => {
    if (sectionId === 'org') {
      const hasRequiredOrganizationFields =
        hasValue(formData.organizationName) &&
        hasValue(formData.businessType) &&
        hasValue(formData.industry) &&
        hasValue(formData.pan) &&
        hasValue(formData.country) &&
        hasValue(formData.state) &&
        hasValue(formData.city) &&
        !validateField('pincode', formData.pincode || '') &&
        hasValue(formData.registeredAddress);

      const cinValid = !hasValue(formData.cin) || !validateField('cin', formData.cin);
      const gstValid = !hasValue(formData.gst) || !validateField('gst', formData.gst);
      const websiteValid = !hasValue(formData.website) || validateWebsite(formData.website);

      return hasRequiredOrganizationFields && cinValid && gstValid && websiteValid;
    }

    if (sectionId === 'rep') {
      const departmentValue = formData.department === 'Others' ? formData.customDepartment : formData.department;
      return (
        hasValue(formData.representativeName) &&
        hasValue(formData.designation) &&
        hasValue(departmentValue) &&
        !validateField('email', formData.email || '') &&
        !validateField('mobile', formData.mobile || '')
      );
    }

    if (sectionId === 'address') {
      return (
        hasValue(formData.country) &&
        hasValue(formData.state) &&
        hasValue(formData.city) &&
        !validateField('pincode', formData.pincode || '') &&
        hasValue(formData.registeredAddress)
      );
    }

    if (sectionId === 'procurement') {
      const selectedCategories = formData.procurementCategories.filter((category: string) => category !== 'Others');
      const hasCustomCategories = formData.customProcurementCategories.length > 0;
      return (
        (selectedCategories.length > 0 || hasCustomCategories) &&
        hasValue(formData.annualBudget) &&
        formData.preferredMethods.length > 0
      );
    }

    if (sectionId === 'docs') {
      return (
        hasValue(formData.documents?.panCard) &&
        hasValue(formData.documents?.regCert) &&
        hasValue(formData.documents?.addressProof)
      );
    }

    if (sectionId === 'account') {
      return (
        hasValue(formData.password) &&
        hasValue(formData.confirmPassword) &&
        formData.password === formData.confirmPassword &&
        Boolean(formData.declaration) &&
        Boolean(formData.agreeTerms)
      );
    }

    return false;
  };

  const completedSectionCount = SIDEBAR_SECTIONS.filter(section => getSectionCompletion(section.id)).length;
  const complianceProgress = Math.round((completedSectionCount / SIDEBAR_SECTIONS.length) * 100);

  const openDocumentPreview = (label: string, url: string) => {
    setPreviewDocument({
      label,
      url,
      mode: getDocumentPreviewMode(url) as 'image' | 'pdf' | 'office' | 'google'
    });
  };

  const saveDraft = () => {
    if (isProfileLocked) {
      toast.info('Approved profiles are locked');
      return;
    }
    localStorage.setItem(BUYER_ONBOARDING_DRAFT_KEY, JSON.stringify({
      activeSection,
      formData
    }));
    toast.success('Draft saved');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProfileLocked) {
      toast.info('Approved profiles are locked');
      return;
    }

    // Final Submission Logic
    if (activeSection === 'account') {
      if (!validateSection('account')) return;
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      if (!formData.declaration || !formData.agreeTerms) {
        toast.error('Please accept both declarations');
        return;
      }

      setIsLoading(true);
      try {
        const normalizedProcurementCategories = formData.procurementCategories.filter((category: string) => category !== 'Others');
        const normalizedPreferredMethods = formData.preferredMethods.filter((method: string) => method !== 'Others');
        const submissionData = {
          ...formData,
          department: formData.department === 'Others' ? formData.customDepartment.trim() || 'Others' : formData.department,
          procurementCategories: [
            ...normalizedProcurementCategories,
            ...formData.customProcurementCategories
          ],
          otherCategoryDetails: formData.customProcurementCategories.join(', '),
          preferredMethods: [
            ...normalizedPreferredMethods,
            ...formData.customPreferredMethods
          ],
          otherMethodDetails: formData.customPreferredMethods.join(', ')
        };

        const res = await api.post('/api/buyer/register', submissionData, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (res.ok) {
          localStorage.removeItem(BUYER_ONBOARDING_DRAFT_KEY);
          toast.success('Registration finished successfully');
          navigate('/dashboard');
        } else {
          const data = await res.json();
          toast.error(data.message || 'Submission failed');
        }
      } catch (err: any) {
        toast.error(err?.message || 'Network error');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Move to next sidebar section
      const currentIndex = SIDEBAR_SECTIONS.findIndex(s => s.id === activeSection);
      if (validateSection(activeSection)) {
        setActiveSection(SIDEBAR_SECTIONS[currentIndex + 1].id);
      } else {
        toast.error('Please fix validation errors');
      }
    }
  };

  if (isFetching) return <div className="buyer-font flex min-h-dvh items-center justify-center px-4 text-center font-bold italic text-indigo-600">Loading form...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-3 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 md:mb-10">
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Buyer Registration</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Onboarding</h1>
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-500 font-medium">
              Step {SIDEBAR_SECTIONS.findIndex(s => s.id === activeSection) + 1} of {SIDEBAR_SECTIONS.length} — {SIDEBAR_SECTIONS.find(s => s.id === activeSection)?.label}
            </p>
          </div>
          <div className="mt-4 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-600 transition-all duration-500"
              style={{ width: `${((SIDEBAR_SECTIONS.findIndex(s => s.id === activeSection) + 1) / SIDEBAR_SECTIONS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Stepper Navigation */}
        <div className="flex flex-wrap items-center gap-2 mb-10 overflow-x-auto pb-2 no-scrollbar">
          {SIDEBAR_SECTIONS.map((section, idx) => {
            const isActive = activeSection === section.id;
            const isCompleted = getSectionCompletion(section.id);
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border",
                  isActive
                    ? "bg-teal-50 text-teal-700 border-teal-200 shadow-sm"
                    : isCompleted
                      ? "bg-white text-slate-900 border-slate-200 shadow-sm"
                      : "bg-transparent text-slate-400 border-transparent hover:text-slate-600"
                )}
              >
                <span className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px]",
                  isActive ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-500"
                )}>
                  {idx + 1}
                </span>
                {section.label}
              </button>
            );
          })}
        </div>

        {/* Form Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
          <div className="p-5 sm:p-8 md:p-10">
            <div className="mb-8 md:mb-10">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
                {SIDEBAR_SECTIONS.find(s => s.id === activeSection)?.label}
              </h2>
              <p className="text-sm text-slate-500">
                {activeSection === 'org' ? 'Tell us about your organization.' :
                  activeSection === 'rep' ? 'Contact details of the authorized person.' :
                    activeSection === 'address' ? 'Registered and corporate office locations.' :
                      activeSection === 'procurement' ? 'Define your procurement requirements.' :
                        activeSection === 'docs' ? 'Upload verification documents.' :
                          'Secure your account with a password.'}
              </p>
              {isProfileLocked && (
                <p className="mt-3 inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                  Approved profile locked
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <fieldset disabled={isProfileLocked} className={cn("min-h-[400px]", isProfileLocked && "opacity-70")}>
                {/* Section Content */}
                {activeSection === 'org' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Input label="Organization / Company Name" name="organizationName" value={formData.organizationName} onChange={handleChange} onBlur={handleBlur} error={touched.organizationName ? errors.organizationName : ''} required className="h-12" />
                    <Select label="Business Type" name="businessType" value={formData.businessType} onChange={handleChange} required className="h-12">
                      <option value="Private Limited Company">Private Limited Company</option>
                      <option value="Public Limited Company">Public Limited Company</option>
                      <option value="Partnership Firm">Partnership Firm</option>
                      <option value="LLP">LLP</option>
                      <option value="Proprietorship">Proprietorship</option>
                      <option value="Startup">Startup</option>
                      <option value="NGO / Trust">NGO / Trust</option>
                      <option value="Educational Institution">Educational Institution</option>
                    </Select>
                    <Input label="Industry / Sector" name="industry" value={formData.industry} onChange={handleChange} onBlur={handleBlur} error={touched.industry ? errors.industry : ''} placeholder="e.g. Construction, IT, Healthcare" required className="h-12" />
                    <Input label="CIN / Registration Number (if applicable)" name="cin" value={formData.cin} onChange={handleChange} onBlur={handleBlur} error={touched.cin ? errors.cin : ''} placeholder="U12345KA2023PTC123456" className="h-12" />
                    <Input label="PAN of Organization" name="pan" value={formData.pan} onChange={handleChange} onBlur={handleBlur} error={touched.pan ? errors.pan : ''} placeholder="ABCDE1234F" required className="h-12" />
                    <div className="flex flex-col gap-1">
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <Input 
                            label="GSTIN (Optional)" 
                            name="gst" 
                            value={formData.gst} 
                            onChange={handleChange} 
                            onBlur={handleBlur} 
                            error={touched.gst ? errors.gst : ''} 
                            placeholder="22ABCDE1234F1Z5" 
                            className="h-12" 
                          />
                        </div>
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={fetchGstDetails}
                          disabled={isFetchingGst || !formData.gst}
                          className="h-12 px-4 rounded-xl border-indigo-200 text-indigo-600 font-bold uppercase text-[10px] italic hover:bg-indigo-50"
                        >
                          {isFetchingGst ? 'Fetching...' : 'Fetch Details'}
                        </Button>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <Input label="Website URL (Optional)" name="website" value={formData.website} onChange={handleChange} onBlur={handleBlur} error={touched.website ? errors.website : ''} placeholder="https://www.company.com" className="h-12" />
                    </div>

                    {/* Organization Address Fields */}
                    <div className="md:col-span-2 pt-6 mt-2 border-t border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-teal-600" />
                        Organization Address
                      </h3>
                    </div>
                    <Input label="COUNTRY" name="country" value={formData.country} onChange={handleChange} onBlur={handleBlur} required className="h-12" />
                    <Input label="STATE" name="state" value={formData.state} onChange={handleChange} onBlur={handleBlur} error={touched.state ? errors.state : ''} required className="h-12" />
                    <Input label="CITY" name="city" value={formData.city} onChange={handleChange} onBlur={handleBlur} error={touched.city ? errors.city : ''} required className="h-12" />
                    <Input label="PIN CODE" name="pincode" value={formData.pincode} onChange={handleChange} onBlur={handleBlur} error={touched.pincode ? errors.pincode : ''} required className="h-12" />
                    <div className="md:col-span-2">
                      <Input label="REGISTERED OFFICE ADDRESS" name="registeredAddress" value={formData.registeredAddress} onChange={handleChange} onBlur={handleBlur} error={touched.registeredAddress ? errors.registeredAddress : ''} required className="h-12" />
                    </div>
                    <div className="md:col-span-2">
                      <Input label="CORPORATE OFFICE ADDRESS (Optional - if different)" name="corporateAddress" value={formData.corporateAddress} onChange={handleChange} onBlur={handleBlur} placeholder="Enter corporate address if different from registered address" className="h-12" />
                    </div>
                  </div>
                )}

                {activeSection === 'rep' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Input label="FULL NAME" name="representativeName" value={formData.representativeName} onChange={handleChange} onBlur={handleBlur} error={touched.representativeName ? errors.representativeName : ''} required className="h-12" />
                    <Input label="DESIGNATION" name="designation" value={formData.designation} onChange={handleChange} placeholder="e.g. Director" className="h-12" />
                    <div className="space-y-4">
                      <Select label="DEPARTMENT" name="department" value={formData.department} onChange={handleChange} className="h-12">
                        {DEPARTMENT_OPTIONS.map((department) => (
                          <option key={department} value={department}>{department}</option>
                        ))}
                      </Select>
                      {formData.department === 'Others' && (
                        <Input
                          placeholder="Please specify your department"
                          name="customDepartment"
                          value={formData.customDepartment}
                          onChange={handleChange}
                          required
                          className="h-10 animate-in slide-in-from-top-2 duration-300"
                        />
                      )}
                    </div>
                    <Input label="OFFICIAL EMAIL ID" name="email" value={formData.email} onChange={handleChange} className="h-12" />
                    <Input label="MOBILE NUMBER" name="mobile" value={formData.mobile} onChange={handleChange} onBlur={handleBlur} error={touched.mobile ? errors.mobile : ''} required className="h-12" />
                    <Input label="ALTERNATE NUMBER" name="alternateMobile" value={formData.alternateMobile} onChange={handleChange} className="h-12" />
                  </div>
                )}



                {activeSection === 'procurement' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <Select
                          label="PROCUREMENT CATEGORY (Multiple)"
                          name="procurementCategoryPicker"
                          value=""
                          onChange={handleProcurementCategorySelect}
                          className="h-12"
                        >
                          <option value="" disabled>Select a category</option>
                          {PROCUREMENT_CATEGORY_OPTIONS.map((cat) => (
                            <option key={cat} value={cat} disabled={formData.procurementCategories.includes(cat)}>
                              {cat}
                            </option>
                          ))}
                        </Select>

                        <div className="flex flex-wrap gap-2">
                          {formData.procurementCategories.map((cat: string) => (
                            <span key={cat} className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200">
                              {cat}
                              <button type="button" onClick={() => toggleTag('procurementCategories', cat)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>

                        {formData.procurementCategories.includes('Others') && (
                          <div className="space-y-4 pt-2">
                            <div className="flex gap-2">
                              <Input
                                placeholder="Enter custom category"
                                name="customProcurementCategoryInput"
                                value={formData.customProcurementCategoryInput}
                                onChange={handleChange}
                                className="h-10"
                              />
                              <Button
                                type="button"
                                onClick={addCustomProcurementCategory}
                                className="bg-slate-900 text-white h-10 px-4 rounded-lg"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {formData.customProcurementCategories.map((cat: string) => (
                                <span key={cat} className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase italic border border-teal-100">
                                  {cat}
                                  <button type="button" onClick={() => removeCustomProcurementCategory(cat)} className="text-teal-400 hover:text-teal-600">
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-8">
                        <Select label="ANNUAL PROCUREMENT BUDGET (Optional)" name="annualBudget" value={formData.annualBudget} onChange={handleChange} className="h-12">
                          <option value="">Select Budget Range</option>
                          {ANNUAL_BUDGET_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </Select>

                        <div className="space-y-4">
                          <Select
                            label="PREFERRED PROCUREMENT METHODS (Multiple)"
                            name="preferredMethodPicker"
                            value=""
                            onChange={handleProcurementMethodSelect}
                            className="h-12"
                          >
                            <option value="" disabled>Select a method</option>
                            {PROCUREMENT_METHOD_OPTIONS.map((method) => (
                              <option key={method} value={method} disabled={formData.preferredMethods.includes(method)}>
                                {method}
                              </option>
                            ))}
                          </Select>

                          <div className="flex flex-wrap gap-2">
                            {formData.preferredMethods.map((method: string) => (
                              <span key={method} className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200">
                                {method}
                                <button type="button" onClick={() => toggleTag('preferredMethods', method)} className="text-slate-400 hover:text-slate-600">
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>

                          {formData.preferredMethods.includes('Others') && (
                            <div className="space-y-4 pt-2">
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Enter custom method"
                                  name="customProcurementMethodInput"
                                  value={formData.customProcurementMethodInput}
                                  onChange={handleChange}
                                  className="h-10"
                                />
                                <Button
                                  type="button"
                                  onClick={addCustomPreferredMethod}
                                  className="bg-slate-900 text-white h-10 px-4 rounded-lg"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {formData.customPreferredMethods.map((method: string) => (
                                  <span key={method} className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase italic border border-indigo-100">
                                    {method}
                                    <button type="button" onClick={() => removeCustomPreferredMethod(method)} className="text-indigo-400 hover:text-indigo-600">
                                      <X className="h-3 w-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'docs' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-slate-100 p-4 rounded-xl text-xs text-slate-600 mb-6 border border-slate-200">
                      <p className="font-bold mb-2">Required documents for verification:</p>
                      <ul className="list-disc list-inside mb-2 space-y-1">
                        <li>PAN Card of Organization</li>
                        <li>Company Registration Certificate (CIN / Partnership Deed / Shop Act / Trust Registration)</li>
                        <li>GST Certificate (if applicable)</li>
                        <li>Address Proof</li>
                        <li>Authorization Letter of Representative (Optional)</li>
                      </ul>
                      <p className="font-bold text-teal-700">Allowed formats: PDF / JPG / PNG</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { label: 'PAN Card of Organization', field: 'panCard' },
                        { label: 'Company Registration Certificate (CIN / Partnership Deed / Shop Act / Trust Registration)', field: 'regCert' },
                        { label: 'GST Certificate (if applicable)', field: 'gstCert' },
                        { label: 'Address Proof', field: 'addressProof' },
                        { label: 'Authorization Letter of Representative (Optional)', field: 'authLetter' }
                      ].map(doc => (
                        <div key={doc.field} className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col gap-4">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{doc.label}</span>
                          <div className="flex items-center justify-between gap-4">
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileUpload(e, `documents.${doc.field}`)} id={`upload-${doc.field}`} className="hidden" />
                            <label htmlFor={`upload-${doc.field}`} className="cursor-pointer text-xs font-bold text-teal-600 hover:text-teal-700 underline">
                              {isUploading === `documents.${doc.field}` ? 'Uploading...' : formData.documents[doc.field] ? 'Change File' : 'Upload File'}
                            </label>
                            {formData.documents[doc.field] && (
                              <button type="button" onClick={() => openDocumentPreview(doc.label, formData.documents[doc.field])} className="text-xs font-bold text-slate-500 hover:text-slate-700">
                                View
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSection === 'account' && (
                  <div className="max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Input label="PASSWORD" name="password" type="password" value={formData.password} onChange={handleChange} onBlur={handleBlur} error={touched.password ? errors.password : ''} className="h-12" />
                    <Input label="CONFIRM PASSWORD" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur} error={touched.confirmPassword ? (formData.password !== formData.confirmPassword ? 'Passwords do not match' : '') : ''} className="h-12" />
                    <div className="space-y-4">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input type="checkbox" checked={formData.declaration} onChange={(e) => setFormData({ ...formData, declaration: e.target.checked })} className="mt-1 w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                        <span className="text-xs text-slate-600 font-medium">I confirm that the information provided is accurate.</span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input type="checkbox" checked={formData.agreeTerms} onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })} className="mt-1 w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                        <span className="text-xs text-slate-600 font-medium">I agree to the platform Terms & Conditions.</span>
                      </label>
                    </div>
                  </div>
                )}
              </fieldset>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-10 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = SIDEBAR_SECTIONS.findIndex(s => s.id === activeSection);
                    if (currentIndex > 0) setActiveSection(SIDEBAR_SECTIONS[currentIndex - 1].id);
                  }}
                  className="text-sm font-bold text-slate-400 hover:text-slate-600 flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous Section
                </button>
                <div className="flex items-center gap-4">
                  <Button type="button" variant="ghost" onClick={saveDraft} disabled={isProfileLocked} className="text-slate-600 font-bold border border-slate-200 px-6 rounded-lg h-10 text-sm">
                    Save Draft
                  </Button>
                  <Button type="submit" disabled={isLoading || isProfileLocked} className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-8 rounded-lg h-10 text-sm flex items-center gap-2">
                    {isProfileLocked ? 'Locked' : isLoading ? 'Processing...' : activeSection === 'account' ? 'Finish Registration' : 'Continue'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Bottom Footer Notice */}
        <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
          <ShieldCheck className="h-4 w-4" />
          <p className="text-[10px] font-medium tracking-wide">Your information is encrypted and reviewed by our compliance team within 24-48 business hours.</p>
        </div>
      </div>

      {previewDocument && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-4">
          <div className="flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-[2rem]">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-black uppercase text-slate-900 italic sm:text-lg">{previewDocument.label}</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Document Preview</p>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <a
                  href={previewDocument.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden h-10 items-center justify-center rounded-xl border border-slate-200 px-4 text-[10px] font-black uppercase italic text-slate-600 transition-all hover:bg-slate-50 sm:inline-flex"
                >
                  Open Original
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDocument(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-all hover:bg-slate-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100">
              {previewDocument.mode === 'image' && (
                <div className="flex h-full items-center justify-center p-4">
                  <img
                    src={previewDocument.url}
                    alt={previewDocument.label}
                    className="max-h-full max-w-full rounded-2xl bg-white object-contain shadow-lg"
                  />
                </div>
              )}
              {previewDocument.mode === 'pdf' && (
                <iframe
                  src={previewDocument.url}
                  title={previewDocument.label}
                  className="h-full w-full"
                />
              )}
              {previewDocument.mode === 'office' && (
                <iframe
                  src={getOfficePreviewUrl(previewDocument.url)}
                  title={previewDocument.label}
                  className="h-full w-full"
                />
              )}
              {previewDocument.mode === 'google' && (
                <iframe
                  src={getDocumentPreviewUrl(previewDocument.url)}
                  title={previewDocument.label}
                  className="h-full w-full"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
