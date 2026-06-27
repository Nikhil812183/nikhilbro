'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { 
  ShieldAlert, 
  Settings, 
  Users, 
  FileText, 
  RefreshCw, 
  Sparkles,
  Save,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export default function AdminPanelPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'settings' | 'users' | 'audit'>('settings');
  const [loading, setLoading] = useState(true);
  
  // Settings tab states
  const [settings, setSettings] = useState<any[]>([]);
  const [urgentDays, setUrgentDays] = useState('3');
  const [alarmLatency, setAlarmLatency] = useState('150');
  const [autoDispatch, setAutoDispatch] = useState('true');
  const [emailTemplate, setEmailTemplate] = useState('');
  const [whatsappTemplate, setWhatsappTemplate] = useState('');
  const [smsTemplate, setSmsTemplate] = useState('');

  // Users tab states
  const [users, setUsers] = useState<any[]>([]);
  
  // Audit logs tab states
  const [logs, setLogs] = useState<any[]>([]);

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'settings') {
        const res = await api.getAdminSettings();
        setSettings(res.settings || []);
        
        // Map values
        const map = new Map<string, string>(res.settings.map((s: any) => [s.key, s.value]));
        setUrgentDays(map.get('urgentThresholdDays') || '3');
        setAlarmLatency(map.get('criticalAlarmLatencyMs') || '150');
        setAutoDispatch(map.get('enableAutoDispatch') || 'true');
        setEmailTemplate(map.get('emailTemplate') || '');
        setWhatsappTemplate(map.get('whatsappTemplate') || '');
        setSmsTemplate(map.get('smsTemplate') || '');
      } else if (activeTab === 'users') {
        const res = await api.getAdminUsers();
        setUsers(res.users || []);
      } else {
        const res = await api.getAdminAuditLogs();
        setLogs(res.logs || []);
      }
    } catch (err: any) {
      showToast(`Error loading data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = [
        { key: 'urgentThresholdDays', value: urgentDays },
        { key: 'criticalAlarmLatencyMs', value: alarmLatency },
        { key: 'enableAutoDispatch', value: autoDispatch },
        { key: 'emailTemplate', value: emailTemplate },
        { key: 'whatsappTemplate', value: whatsappTemplate },
        { key: 'smsTemplate', value: smsTemplate }
      ];
      await api.updateAdminSettings(payload);
      showToast('Global settings and message templates saved.');
      loadData();
    } catch (err: any) {
      showToast(`Save settings failed: ${err.message}`);
    }
  };

  const handleUpdateUserStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Deactivated' : 'Active';
    try {
      await api.updateAdminUserRole(id, { status: newStatus });
      showToast(`User status updated to ${newStatus}.`);
      loadData();
    } catch (err: any) {
      showToast(`Update status failed: ${err.message}`);
    }
  };

  const handleUpdateUserRole = async (id: number, role: string) => {
    try {
      await api.updateAdminUserRole(id, { role });
      showToast(`Staff role reassigned to ${role}.`);
      loadData();
    } catch (err: any) {
      showToast(`Role change failed: ${err.message}`);
    }
  };

  if (user?.role !== 'Admin') {
    return (
      <div className="glass-panel p-8 text-center text-rose-500 font-bold max-w-md mx-auto my-20">
        <ShieldAlert className="w-12 h-12 mx-auto mb-4" />
        <span>ACCESS RESTRICTED. This dashboard contains sensitive administrative controls.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel border-l-4 border-l-blue-600 bg-white dark:bg-slate-900 px-5 py-3.5 shadow-2xl flex items-center gap-3 text-xs font-semibold animate-bounce">
          <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
          <span>{toast}</span>
        </div>
      )}

      {/* Title */}
      <div>
        <h1 className="text-2xl font-display font-black">Admin Management Controls</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure automated rules thresholds, templates overrides, and audit log tracking</p>
      </div>

      {/* Tab select bar */}
      <div className="flex gap-2 p-1 bg-slate-200/50 dark:bg-slate-900/50 rounded-xl border border-slate-200/20 dark:border-slate-800/20 w-fit">
        {[
          { tab: 'settings', name: 'Global Settings', icon: Settings },
          { tab: 'users', name: 'User Management', icon: Users },
          { tab: 'audit', name: 'System Audit Logs', icon: FileText }
        ].map((t) => (
          <button
            key={t.tab}
            onClick={() => setActiveTab(t.tab as any)}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${activeTab === t.tab ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.name}
          </button>
        ))}
      </div>

      {/* Loader */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="glass-panel p-6">
          
          {/* TAB 1: SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-6 text-xs font-semibold">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Urgency Alert Threshold (Days)</label>
                  <input
                    type="number"
                    value={urgentDays}
                    onChange={(e) => setUrgentDays(e.target.value)}
                    required
                    className="w-full glass-input p-3 rounded-xl"
                  />
                  <span className="block text-[9px] text-slate-500 mt-1">Generates reminders if cycle predicted date is within this day count.</span>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Rule SLA Engine Delay (MS)</label>
                  <input
                    type="number"
                    value={alarmLatency}
                    onChange={(e) => setAlarmLatency(e.target.value)}
                    required
                    className="w-full glass-input p-3 rounded-xl"
                  />
                  <span className="block text-[9px] text-slate-500 mt-1">Simulated latency multiplier for safety alarm computations.</span>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Automated Dispatch Approval</label>
                  <button
                    type="button"
                    onClick={() => setAutoDispatch(autoDispatch === 'true' ? 'false' : 'true')}
                    className="flex items-center gap-2 mt-1.5 focus:outline-none"
                  >
                    {autoDispatch === 'true' ? (
                      <ToggleRight className="w-10 h-10 text-blue-600" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-slate-400" />
                    )}
                    <span className="text-[10px] text-slate-400">Trigger active dispatch when order validates</span>
                  </button>
                </div>
              </div>

              <hr className="border-slate-200/20 dark:border-slate-800/20" />

              {/* Templates */}
              <div className="space-y-4">
                <h3 className="font-display font-black text-sm text-blue-600 dark:text-blue-400">Omnichannel Notification Templates</h3>
                <p className="text-[10px] text-slate-400 -mt-2">Use double brackets as variable binders: <code>{"{{customerName}}"}</code>, <code>{"{{category}}"}</code>, <code>{"{{productName}}"}</code>, <code>{"{{lastOrderDate}}"}</code>.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Email Outreach Template</label>
                    <textarea
                      rows={6}
                      value={emailTemplate}
                      onChange={(e) => setEmailTemplate(e.target.value)}
                      className="w-full glass-input p-3.5 rounded-xl font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">WhatsApp Chat Bubble Template</label>
                    <textarea
                      rows={6}
                      value={whatsappTemplate}
                      onChange={(e) => setWhatsappTemplate(e.target.value)}
                      className="w-full glass-input p-3.5 rounded-xl font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">SMS Alert Template</label>
                    <textarea
                      rows={6}
                      value={smsTemplate}
                      onChange={(e) => setSmsTemplate(e.target.value)}
                      className="w-full glass-input p-3.5 rounded-xl font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save configurations
                </button>
              </div>

            </form>
          )}

          {/* TAB 2: USERS */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <h3 className="font-display font-black text-sm">Staff User Directory</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-200/40 dark:border-slate-800/40">
                      <th className="pb-3 font-semibold">Staff Name</th>
                      <th className="pb-3 font-semibold">Email Address</th>
                      <th className="pb-3 font-semibold">Role Tier</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Update Permissions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-slate-200/20 dark:border-slate-800/20">
                        <td className="py-3.5 font-bold flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                            {u.name.charAt(0)}
                          </div>
                          {u.name}
                        </td>
                        <td className="py-3.5 text-slate-500 dark:text-slate-300 font-semibold">{u.email}</td>
                        <td className="py-3.5">
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                            className="bg-transparent border border-slate-200/30 dark:border-slate-800/30 px-2 py-1 rounded outline-none focus:border-blue-500 font-semibold text-slate-600 dark:text-slate-300"
                          >
                            <option value="Admin">Admin</option>
                            <option value="Coordinator">Coordinator</option>
                            <option value="Salesperson">Salesperson</option>
                            <option value="Dispatcher">Dispatcher</option>
                          </select>
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${u.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => handleUpdateUserStatus(u.id, u.status)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${u.status === 'Active' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-white'}`}
                          >
                            {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <h3 className="font-display font-black text-sm">System Operations Audit Trail</h3>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {logs.map((log) => {
                  let roleColor = 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
                  if (log.user_role === 'Admin') roleColor = 'bg-blue-500/10 text-blue-500 border-blue-500/20 border';
                  if (log.user_role === 'System Decider') roleColor = 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 border';
                  if (log.user_role === 'Salesperson') roleColor = 'bg-violet-500/10 text-violet-500 border-violet-500/20 border';
                  if (log.user_role === 'Coordinator') roleColor = 'bg-amber-500/10 text-amber-500 border-amber-500/20 border';

                  return (
                    <div key={log.id} className="p-3 bg-slate-200/20 dark:bg-slate-900/30 border border-slate-200/20 dark:border-slate-800/20 rounded-xl flex items-center justify-between gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${roleColor}`}>
                            {log.user_role}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="font-semibold text-slate-600 dark:text-slate-300 leading-relaxed mt-1">{log.event}</p>
                      </div>
                      <ShieldCheck className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    </div>
                  );
                })}

                {logs.length === 0 && (
                  <div className="text-center py-20 text-slate-500 font-bold">
                    No system audit logs found.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
