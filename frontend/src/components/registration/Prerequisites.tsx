import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Select } from '../ui/Input';
import { CheckCircle2, FileText, ArrowRight, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

const sellerBusinessTypes = [
  { value: 'Proprietorship', label: 'Proprietorship' },
  { value: 'Partnership', label: 'Partnership Firm' },
  { value: 'Company', label: 'Company (Pvt Ltd / Ltd)' },
  { value: 'LLP', label: 'LLP' },
  { value: 'MSME', label: 'MSME' },
  { value: 'Startup', label: 'Startup' },
];

const buyerBusinessTypes = [
  { value: 'Private Limited Company', label: 'Private Limited Company' },
  { value: 'Public Limited Company', label: 'Public Limited Company' },
  { value: 'Partnership Firm', label: 'Partnership Firm' },
  { value: 'LLP', label: 'LLP' },
  { value: 'Proprietorship', label: 'Proprietorship' },
  { value: 'Startup', label: 'Startup' },
  { value: 'NGO / Trust', label: 'NGO / Trust' },
  { value: 'Educational Institution', label: 'Educational Institution' },
];

const prerequisiteDocs: Record<string, { personal: string[], business: string[], optional: string[] }> = {
  'Proprietorship': {
    personal: [
      'Aadhaar/Virtual ID and Aadhaar linked mobile number OR Personal PAN details with mobile number',
      'Active Email ID - Personal E-mail Id or Company / Organisation allotted Email-Id (to verify OTP)'
    ],
    business: [
      'Business PAN details (4th character of your PAN number should be P or H)',
      'Bank account number and IFSC (Not mandatory for Vivad se Vishwas)',
      'Income tax returns of last 3 years (It is required for BID participation if your business is older than 24 months) (Not mandatory for Vivad se Vishwas)',
      'Registered Address (Not mandatory for Vivad se Vishwas)'
    ],
    optional: [
      'Udyam number for MSME (EMD exemption in BID) (Required for Vivad se Vishwas)',
      'DIPP number for startup (EMD exemption for eligible start ups)',
      'GST number for inter state business'
    ]
  },
  'default': {
    personal: [
      'Aadhaar/Virtual ID and Aadhaar linked mobile number OR Personal PAN details with mobile number',
      'Active Email ID - Personal E-mail Id or Company / Organisation allotted Email-Id (to verify OTP)'
    ],
    business: [
      'Business PAN details',
      'Bank account number and IFSC',
      'Income tax returns of last 3 years',
      'Registered Address'
    ],
    optional: [
      'Udyam number',
      'DIPP number',
      'GST number'
    ]
  }
};

interface PrerequisitesProps {
  onProceed: (type: string) => void;
  role: 'buyer' | 'seller';
}

export default function Prerequisites({ onProceed, role }: PrerequisitesProps) {
  const [selectedType, setSelectedType] = useState('');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  
  const docs = prerequisiteDocs[selectedType] || prerequisiteDocs['default'];

  const handleCheck = (item: string) => {
    setCheckedItems(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const buyerDocs = {
    required: [
      'Aadhaar number',
      'Active Mobile number to which your Aadhaar is linked – for OTP purpose'
    ]
  };

  const isBuyer = role === 'buyer';
  const allRequiredChecked = selectedType && (isBuyer 
    ? buyerDocs.required.every(item => checkedItems[item])
    : [
      ...docs.personal,
      ...docs.business
    ].every(item => checkedItems[item])
  );

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white">
        <div className="p-6 md:p-8 pb-4 text-center md:text-left">
           <h2 className="text-xl font-bold text-slate-800">Pre-requisites</h2>
           <p className="text-xs text-slate-500 mt-1">Registration on PugArch should be done by an authorized person (Director of the organisation or a Key Person/Proprietor).</p>
        </div>
        
        <CardContent className="p-6 md:p-8 pt-0">
          <div className="mb-8">
            <label className="text-xs font-bold text-slate-700 mb-2 block">Business / Organisation Type * <Info className="inline h-3 w-3 text-slate-400" /></label>
            <div className="max-w-md">
              <Select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCheckedItems({});
                }}
                className="h-12 border-slate-200"
              >
                <option value="">Select type</option>
                {(role === 'buyer' ? buyerBusinessTypes : sellerBusinessTypes).map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
            </div>
          </div>

          {selectedType && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {isBuyer ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                     <h3 className="text-sm font-bold text-slate-800">For User registration – you require the following before you can proceed.</h3>
                  </div>
                  <Section 
                    title="" 
                    items={buyerDocs.required} 
                    onCheck={handleCheck} 
                    checkedItems={checkedItems} 
                  />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                     <h3 className="text-sm font-bold text-slate-800">Required *</h3>
                  </div>
                  <Section 
                    title="Personal Details" 
                    items={docs.personal} 
                    onCheck={handleCheck} 
                    checkedItems={checkedItems} 
                  />
                  <Section 
                    title="Business Details" 
                    items={docs.business} 
                    onCheck={handleCheck} 
                    checkedItems={checkedItems} 
                  />
                  <Section 
                    title="Optional" 
                    items={docs.optional} 
                    onCheck={handleCheck} 
                    checkedItems={checkedItems} 
                    isOptional 
                  />
                </>
              )}
              
              <div className="pt-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline italic">
                  View Pre-requisites Document
                </button>
                <Button 
                  onClick={() => onProceed(selectedType)}
                  disabled={!allRequiredChecked}
                  className={cn(
                    "w-full md:w-auto h-12 px-12 rounded-lg font-black uppercase tracking-widest transition-all",
                    allRequiredChecked ? "bg-slate-900 text-white shadow-lg" : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  )}
                >
                  PROCEED
                </Button>
              </div>
            </div>
          )}

          {!selectedType && (
            <div className="pt-4">
               <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline italic">
                  View Pre-requisites Document
               </button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-4 px-2">
         <p className="text-xs text-slate-500 font-medium italic">
            Already registered with PugArch? <Link to="/login" className="text-indigo-600 font-bold hover:underline">CLICK HERE TO LOGIN</Link>
         </p>
      </div>
    </div>
  );
}

function Section({ 
  title, 
  items, 
  isOptional, 
  onCheck, 
  checkedItems 
}: { 
  title: string, 
  items: string[], 
  isOptional?: boolean,
  onCheck: (item: string) => void,
  checkedItems: Record<string, boolean>
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-tight">{title}</h4>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div 
              onClick={() => onCheck(item)}
              className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer mt-0.5",
                checkedItems[item] ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-200"
              )}
            >
              {checkedItems[item] && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
            </div>
            <span className="text-xs font-medium text-slate-600 leading-tight">
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
