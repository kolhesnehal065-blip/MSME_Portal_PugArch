import React, { ReactNode, useState } from 'react';
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
  { value: 'Primary User (HOD)', label: 'Primary User (HOD)' },
  { value: 'Verifying Authority (VA)', label: 'Verifying Authority (VA)' },
  { value: 'Primary User (Co-operative)', label: 'Primary User (Co-operative)' },
];

const buyerBaseRequiredDocs = [
  { id: 'aadhaar-number', content: 'Aadhaar number' },
  { id: 'aadhaar-mobile', content: 'Active Mobile number to which your Aadhaar is linked - for OTP purpose' },
];

const getBuyerRequiredDocs = (selectedType: string) => [
  ...buyerBaseRequiredDocs,
  {
    id: 'active-email',
    content: selectedType === 'Primary User (Co-operative)' ? (
      <>
        Active Email Id:- Use E-mail ID, Company/ organisation E-mail ID and ID from whitelisted domains to verify the OTP. To view list of whitelisted domains (Accepted by GeM),{' '}
        <button type="button" className="font-bold text-indigo-600 hover:underline">Click Here</button>
      </>
    ) : (
      <>
        Government email id - preferably designation based. To view list of whitelisted domains (accepted at GeM),{' '}
        <button type="button" className="font-bold text-indigo-600 hover:underline">Click Here</button>
      </>
    ),
  },
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
  const buyerRequiredDocs = getBuyerRequiredDocs(selectedType);
  const allRequiredChecked = selectedType && (isBuyer 
    ? buyerRequiredDocs.every(item => checkedItems[item.id])
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
            <label className="text-xs font-bold text-slate-700 mb-2 block">{isBuyer ? 'User Type' : 'Business / Organisation Type'} * <Info className="inline h-3 w-3 text-slate-400" /></label>
            <div className="max-w-md">
              <Select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCheckedItems({});
                }}
                className="h-12 border-slate-200"
              >
                <option value="">{isBuyer ? 'Select type of User' : 'Select type'}</option>
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
                  <BuyerSection
                    items={buyerRequiredDocs}
                    onCheck={handleCheck} 
                    checkedItems={checkedItems} 
                  />
                  <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">
                    {selectedType} User Manual
                  </button>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-800">
                      If you want to register as the buyers/ users involved in procurement process please contact Primary user (HOD) of your organisation
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Note:- Only non buying roles i.e. Primary User (HOD)/ Verifying Authority can get registered from here.
                    </p>
                  </div>
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

function BuyerSection({
  items,
  onCheck,
  checkedItems
}: {
  items: { id: string, content: ReactNode }[],
  onCheck: (item: string) => void,
  checkedItems: Record<string, boolean>
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-3">
          <div
            onClick={() => onCheck(item.id)}
            className={cn(
              "w-5 h-5 rounded border-2 flex shrink-0 items-center justify-center transition-all cursor-pointer mt-0.5",
              checkedItems[item.id] ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-200"
            )}
          >
            {checkedItems[item.id] && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
          </div>
          <span className="text-xs font-medium text-slate-600 leading-tight">
            {item.content}
          </span>
        </div>
      ))}
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
