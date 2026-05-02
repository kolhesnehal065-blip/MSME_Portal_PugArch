import React from 'react';
import { cn } from '../lib/utils';
import { CheckCircle2, Circle, Lock } from 'lucide-react';

interface SidebarItemProps {
  id: string;
  label: string;
  status: 'completed' | 'pending' | 'locked';
  isActive: boolean;
  onClick: (id: string) => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ id, label, status, isActive, onClick }) => {
  return (
    <button
      onClick={() => status !== 'locked' && onClick(id)}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left transition-all",
        isActive ? "bg-blue-50 border-r-4 border-blue-600" : "hover:bg-gray-50",
        status === 'locked' ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      )}
    >
      <div className="flex-shrink-0">
        {status === 'completed' ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : status === 'locked' ? (
          <Lock className="h-5 w-5 text-gray-400" />
        ) : (
          <Circle className={cn("h-5 w-5", isActive ? "text-blue-600" : "text-gray-300")} />
        )}
      </div>
      <span className={cn(
        "text-sm font-semibold",
        isActive ? "text-blue-700" : "text-gray-600",
        status === 'completed' && !isActive && "text-gray-800"
      )}>
        {label}
      </span>
    </button>
  );
};

interface GeMSellerSidebarProps {
  currentSection: string;
  onSectionChange: (id: string) => void;
  sectionStatus: Record<string, 'completed' | 'pending' | 'locked'>;
}

export const GeMSellerSidebar: React.FC<GeMSellerSidebarProps> = ({ 
  currentSection, 
  onSectionChange,
  sectionStatus 
}) => {
  const mandatoryItems = [
    { id: 'pan', label: '1. Business PAN Validation' },
    { id: 'details', label: '2. Business Details' },
    { id: 'additional', label: '3. Additional Details' },
    { id: 'offices', label: '4. Office Locations' },
    { id: 'bank', label: '5. Bank Accounts' },
    { id: 'einvoicing', label: '6. e-Invoicing' },
    { id: 'ownership', label: '7. Beneficial Ownership' },
  ];

  const optionalItems = [
    { id: 'tax', label: '8. Tax Assessment' },
    { id: 'logistics', label: '9. Logistics' },
    { id: 'tan', label: '10. TAN Validation' },
  ];

  return (
    <div className="w-72 flex-shrink-0 bg-white border-r border-gray-200 min-h-screen shadow-sm overflow-y-auto">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Business Profile</h3>
      </div>
      
      <div className="py-2">
        <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase">Mandatory</div>
        {mandatoryItems.map(item => (
          <SidebarItem
            key={item.id}
            id={item.id}
            label={item.label}
            status={sectionStatus[item.id] || 'pending'}
            isActive={currentSection === item.id}
            onClick={onSectionChange}
          />
        ))}
      </div>

      <div className="py-2 border-t border-gray-100">
        <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase">Optional</div>
        {optionalItems.map(item => (
          <SidebarItem
            key={item.id}
            id={item.id}
            label={item.label}
            status={sectionStatus[item.id] || 'pending'}
            isActive={currentSection === item.id}
            onClick={onSectionChange}
          />
        ))}
      </div>

      <div className="py-2 border-t border-gray-100 text-gray-500">
        <div className="px-4 py-3 flex items-center gap-3 text-sm font-semibold opacity-60">
           <Circle className="h-5 w-5" /> 11. Vendor Assessment
        </div>
        <div className="px-4 py-3 flex items-center gap-3 text-sm font-semibold opacity-60">
           <Circle className="h-5 w-5" /> 12. Account Settings
        </div>
        <div className="px-4 py-3 flex items-center gap-3 text-sm font-semibold opacity-60">
           <Circle className="h-5 w-5" /> 13. User Management
        </div>
      </div>
    </div>
  );
};
