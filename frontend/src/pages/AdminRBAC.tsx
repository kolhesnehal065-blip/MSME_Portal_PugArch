import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  ShieldAlert, 
  CheckSquare, 
  Square, 
  Plus, 
  Loader2, 
  Lock, 
  UserCog,
  Table
} from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

interface RbacPermission {
  id: number;
  code: string;
  name: string;
  group: string;
}

interface RbacRole {
  id: number;
  name: string;
  description: string;
  userCount: number;
  permissionCodes: string[];
}

interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: string; // Enum legacy role
  rbacRole: { id: number; name: string } | null;
}

export default function AdminRBAC() {
  const [roles, setRoles] = useState<RbacRole[]>([]);
  const [permissions, setPermissions] = useState<RbacPermission[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<RbacRole | null>(null);
  const [savingMatrix, setSavingMatrix] = useState(false);

  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [creatingRole, setCreatingRole] = useState(false);

  const token = localStorage.getItem('token');
  const authOptions = { headers: { Authorization: `Bearer ${token}` }, skipCache: true };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, rRes, uRes] = await Promise.all([
        api.fetch('/api/rbac/permissions', authOptions),
        api.fetch('/api/rbac/roles', authOptions),
        api.fetch('/api/rbac/users', authOptions),
      ]);

      if (pRes.ok) setPermissions(await pRes.json());
      if (rRes.ok) {
        const data = await rRes.json();
        setRoles(data);
        if (data.length > 0 && !activeRole) setActiveRole(data[0]);
      }
      if (uRes.ok) setUsers(await uRes.json());

    } catch (err) {
      toast.error('Failed to retrieve access configurations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Group permissions by category for beautiful display
  const groupedPerms = permissions.reduce((acc, p) => {
    const groupName = p.group || 'System Core';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(p);
    return acc;
  }, {} as Record<string, RbacPermission[]>);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName) return;
    setCreatingRole(true);
    try {
      const res = await api.fetch('/api/rbac/roles', {
        ...authOptions,
        method: 'POST',
        headers: { ...authOptions.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoleName, description: newRoleDesc })
      });
      if (res.ok) {
        toast.success('Role generated successfully.');
        setNewRoleName('');
        setNewRoleDesc('');
        fetchData();
      } else {
        toast.error('Creation failed. Possible duplicate name.');
      }
    } catch {
      toast.error('Network error creating role.');
    } finally {
      setCreatingRole(false);
    }
  };

  const togglePermission = async (code: string) => {
    if (!activeRole) return;
    setSavingMatrix(true);

    const isCurrentlySelected = activeRole.permissionCodes.includes(code);
    let newCodes = [];
    if (isCurrentlySelected) {
      newCodes = activeRole.permissionCodes.filter(c => c !== code);
    } else {
      newCodes = [...activeRole.permissionCodes, code];
    }

    try {
      const res = await api.fetch(`/api/rbac/roles/${activeRole.id}/permissions`, {
        ...authOptions,
        method: 'PUT',
        headers: { ...authOptions.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionCodes: newCodes })
      });
      
      if (res.ok) {
        // Optimistic Local update
        setRoles(roles.map(r => r.id === activeRole.id ? { ...r, permissionCodes: newCodes } : r));
        setActiveRole({ ...activeRole, permissionCodes: newCodes });
        toast.success('Matrix updated.');
      } else {
        toast.error('Modification failed on server.');
      }
    } catch {
      toast.error('Network glitch syncing permission.');
    } finally {
      setSavingMatrix(false);
    }
  };

  const changeUserRole = async (userId: number, newRoleId: string) => {
    try {
      const res = await api.fetch(`/api/rbac/users/${userId}/role`, {
        ...authOptions,
        method: 'PUT',
        headers: { ...authOptions.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rbacRoleId: newRoleId === 'none' ? null : newRoleId })
      });
      if (res.ok) {
        toast.success('User authorization updated.');
        fetchData();
      }
    } catch {
      toast.error('Failed to apply user role.');
    }
  };

  if (loading && roles.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-6 animate-in fade-in">
      {/* Header */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">System Security Configuration</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#12335f] uppercase">Role-Based Access Control</h1>
        <p className="mt-1 text-sm text-slate-500 font-medium">
          Design custom operational scopes, maintain static access hierarchy, and direct atomic permissions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
        
        {/* LEFT SIDEBAR: ROLE LIST & CREATION */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-[#12335f]" /> Defined Roles
              </h3>
            </div>
            <div className="p-2 space-y-1">
              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => setActiveRole(role)}
                  className={`w-full text-left p-3 rounded-md transition-all duration-200 ${
                    activeRole?.id === role.id 
                      ? 'bg-[#12335f] text-white shadow-sm' 
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">{role.name}</span>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                      activeRole?.id === role.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {role.userCount} Active
                    </span>
                  </div>
                  <p className={`text-[11px] mt-0.5 font-medium truncate ${
                    activeRole?.id === role.id ? 'text-blue-200' : 'text-slate-400'
                  }`}>
                    {role.description || 'No description'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleCreateRole} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2 mb-3">
              <Plus className="h-3.5 w-3.5" /> Draft New Role
            </h4>
            <div className="space-y-3">
              <Input 
                placeholder="e.g. Procurement Auditor"
                value={newRoleName}
                onChange={e => setNewRoleName(e.target.value)}
                className="h-9 text-xs font-bold border-slate-200"
              />
              <Input 
                placeholder="Description"
                value={newRoleDesc}
                onChange={e => setNewRoleDesc(e.target.value)}
                className="h-9 text-xs border-slate-200"
              />
              <Button 
                disabled={creatingRole || !newRoleName} 
                className="w-full h-9 bg-[#12335f] hover:bg-[#0b2445] text-xs font-bold uppercase"
              >
                {creatingRole ? 'Processing...' : 'Deploy Role'}
              </Button>
            </div>
          </form>
        </div>

        {/* RIGHT CONTENT: PERMISSION MATRIX TAB */}
        <div className="space-y-6">
          
          {activeRole ? (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden relative">
              {savingMatrix && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 backdrop-blur-[1px]">
                  <Loader2 className="h-6 w-6 animate-spin text-[#12335f]" />
                </div>
              )}

              <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black bg-blue-100 text-[#12335f] px-2 py-0.5 rounded uppercase">Configuring Range</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-950 uppercase">{activeRole.name}</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-1">{activeRole.description || 'Configure scope by toggling flags below.'}</p>
                </div>
                <div className="bg-white border border-slate-200 p-3 rounded-md flex gap-6">
                   <div className="text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase">Assignments</p>
                      <p className="font-black text-xl text-[#12335f]">{activeRole.userCount}</p>
                   </div>
                   <div className="text-center border-l border-slate-100 pl-6">
                      <p className="text-[9px] font-black text-slate-400 uppercase">Capabilities</p>
                      <p className="font-black text-xl text-slate-950">{activeRole.permissionCodes.length} / {permissions.length}</p>
                   </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Table className="h-4 w-4 text-slate-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Capabilities Matrix</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {(Object.entries(groupedPerms) as [string, RbacPermission[]][]).map(([group, perms]) => (
                    <div key={group} className="border border-slate-100 rounded-lg bg-slate-50/30 p-4">
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-blue-700 mb-3 border-b border-slate-200 pb-1">{group}</h4>
                      <div className="space-y-2">
                        {perms.map(perm => {
                          const active = activeRole.permissionCodes.includes(perm.code);
                          return (
                            <label 
                              key={perm.id} 
                              className={`flex items-start gap-3 p-2 rounded-md border cursor-pointer transition-all ${
                                active ? 'bg-blue-50 border-blue-200 hover:bg-blue-100/50' : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={active} 
                                onChange={() => togglePermission(perm.code)}
                              />
                              <div className="mt-0.5">
                                {active 
                                  ? <CheckSquare className="h-4 w-4 text-[#12335f] fill-blue-50" /> 
                                  : <Square className="h-4 w-4 text-slate-300" />
                                }
                              </div>
                              <div>
                                <p className={`text-xs font-bold leading-none ${active ? 'text-[#12335f]' : 'text-slate-800'}`}>
                                  {perm.name}
                                </p>
                                <code className="text-[9px] font-semibold text-slate-400 block mt-1 uppercase tracking-wider">
                                  {perm.code}
                                </code>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
             <div className="h-full flex items-center justify-center border border-dashed border-slate-200 rounded-lg p-10 text-slate-400 font-medium">
               Select or draft a role to establish scope matrix.
             </div>
          )}

          {/* USER ASSIGNMENT GRID */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center gap-2">
              <UserCog className="h-4 w-4 text-[#12335f]" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">User Bindings</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3">User Identity</th>
                    <th className="px-4 py-3">Enum Group</th>
                    <th className="px-4 py-3">Active Dynamic Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.slice(0, 10).map(usr => (
                    <tr key={usr.id} className="hover:bg-slate-50 text-xs">
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {usr.name} <span className="block font-normal text-slate-500 text-[10px]">{usr.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">
                          {usr.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select 
                          value={usr.rbacRole?.id || 'none'}
                          onChange={(e) => changeUserRole(usr.id, e.target.value)}
                          className="bg-white border border-slate-200 rounded h-8 px-2 text-xs font-bold w-full max-w-[200px]"
                        >
                          <option value="none">No Assigned Role</option>
                          {roles.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length > 10 && (
                <div className="p-2 text-center text-[10px] font-bold text-slate-400 border-t border-slate-100">
                  Listing first 10 stakeholders. Audit log tracks legacy records.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
