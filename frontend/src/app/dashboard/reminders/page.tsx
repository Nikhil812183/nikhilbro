'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { 
  Clock, 
  MessageSquare, 
  Mail, 
  Smartphone, 
  Eye, 
  Send, 
  RefreshCw,
  X,
  CheckCircle,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

interface Reminder {
  id: number;
  customer_id: string;
  customer_name: string;
  customer_company: string;
  customer_priority: string;
  product_id: string;
  product_name: string;
  product_category: string;
  reminder_date: string;
  cycle_type: string;
  status: string;
  response_log: string;
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Preview drawer states
  const [previewCustomer, setPreviewCustomer] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState('');
  const [previews, setPreviews] = useState<any[]>([]);
  const [activeChannel, setActiveChannel] = useState<'Email' | 'WhatsApp' | 'SMS'>('Email');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [notificationsLog, setNotificationsLog] = useState<any[]>([]);

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.getReminders();
      setReminders(res.reminders || []);
      
      const notifRes = await api.getNotifications();
      setNotificationsLog(notifRes.notifications || []);
    } catch (err: any) {
      showToast(`Error loading reminders: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenPreview = async (customerId: string, customerName: string) => {
    setPreviewCustomer(customerId);
    setPreviewName(customerName);
    setPreviewLoading(true);
    setPreviews([]);
    try {
      const res = await api.getNotificationPreviews(customerId);
      setPreviews(res.previews || []);
      if (res.previews?.length > 0) {
        setActiveChannel(res.previews[0].channel);
      }
    } catch (err: any) {
      showToast(`Failed loading previews: ${err.message}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSendSimulated = async (channel: string) => {
    // Find a pending notification in notification log for this customer & channel to update status
    const pendingNotif = notificationsLog.find(
      n => n.customer_id === previewCustomer && n.channel === channel && n.status === 'Pending'
    );

    try {
      if (pendingNotif) {
        const res = await api.sendSimulatedNotification(pendingNotif.id);
        showToast(res.message);
      } else {
        showToast(`Simulated ${channel} outreach dispatched directly. (Logged in audit history)`);
      }
      fetchData();
    } catch (err: any) {
      showToast(`Send failed: ${err.message}`);
    }
  };

  const handleRunManualCycle = async () => {
    try {
      showToast('Running automated reminder rules recalculations...');
      const res = await api.triggerReminderCheck();
      showToast(res.message);
      fetchData();
    } catch (err: any) {
      showToast(`Rule trigger failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 relative min-h-[85vh]">
      
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel border-l-4 border-l-blue-600 bg-white dark:bg-slate-900 px-5 py-3.5 shadow-2xl flex items-center gap-3 text-xs font-semibold animate-bounce">
          <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
          <span>{toast}</span>
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-black">Replenishment Reminders</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Audit auto-generated reminder cycles, preview omnichannel templates, and verify dispatched logs</p>
        </div>
        <button 
          onClick={handleRunManualCycle}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Trigger Auto Engine
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Reminders logs */}
        <div className="xl:col-span-2 space-y-4">
          
          <div className="glass-panel p-6 space-y-4">
            <h3 className="font-display font-black text-sm">Replenishment Audit Log</h3>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-200/40 dark:border-slate-800/40">
                      <th className="pb-3 font-semibold">Customer Account</th>
                      <th className="pb-3 font-semibold">Product Name</th>
                      <th className="pb-3 font-semibold">Exhaustion Date</th>
                      <th className="pb-3 font-semibold">Reminder status</th>
                      <th className="pb-3 font-semibold">Audit Feedback</th>
                      <th className="pb-3 font-semibold text-right">Outreach</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reminders.map((r) => {
                      let statusColor = 'bg-slate-500/10 text-slate-500 border-slate-500/20';
                      if (r.status === 'Completed') statusColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
                      if (r.status === 'Pending') statusColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
                      if (r.status === 'Sent') statusColor = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
                      if (r.status === 'Failed') statusColor = 'bg-rose-500/20 text-rose-400 border-rose-500/30';

                      return (
                        <tr key={r.id} className="border-b border-slate-200/20 dark:border-slate-800/20 hover:bg-slate-200/10 dark:hover:bg-slate-900/10 transition-colors">
                          <td className="py-4">
                            <span className="font-bold block">{r.customer_name}</span>
                            <span className="text-[10px] text-slate-400">{r.customer_company}</span>
                          </td>
                          <td className="py-4 font-semibold">{r.product_name}</td>
                          <td className="py-4 font-semibold text-slate-500 dark:text-slate-400">
                            {new Date(r.reminder_date).toLocaleDateString()}
                          </td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${statusColor}`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="py-4 text-slate-400 max-w-xs truncate font-medium">
                            {r.response_log || 'Awaiting customer response...'}
                          </td>
                          <td className="py-4 text-right">
                            <button 
                              onClick={() => handleOpenPreview(r.customer_id, r.customer_name)}
                              className="px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-600 hover:text-white transition-all text-xs font-bold inline-flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Preview
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {reminders.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-20 text-slate-500 font-bold">
                          No replenishment reminder runs logged.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

          </div>

        </div>

        {/* Right Column: Previews Drawer */}
        <div className="glass-panel p-6 space-y-6">
          <h2 className="font-display font-black text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
            Outreach Channels Preview
          </h2>

          {!previewCustomer ? (
            <div className="text-center py-20 text-slate-500 text-xs flex flex-col items-center gap-2">
              <MessageSquare className="w-8 h-8 text-slate-400" />
              <span>Select a customer's preview button to render formatted template contents and trigger simulated outreach logs.</span>
            </div>
          ) : previewLoading ? (
            <div className="text-center py-20 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Parsing Templates...</p>
            </div>
          ) : (
            <div className="space-y-6 text-xs animate-in fade-in duration-300">
              
              {/* Customer Title */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Previewing Client</span>
                <h3 className="font-bold text-sm text-blue-600 dark:text-blue-400 mt-0.5">{previewName}</h3>
              </div>

              {/* Tabs Select */}
              <div className="flex gap-2 p-1 bg-slate-200/50 dark:bg-slate-900/50 rounded-xl border border-slate-200/20 dark:border-slate-800/20">
                {previews.map((p) => {
                  const Icon = p.channel === 'Email' ? Mail : p.channel === 'WhatsApp' ? MessageSquare : Smartphone;
                  const isActive = activeChannel === p.channel;
                  return (
                    <button
                      key={p.channel}
                      onClick={() => setActiveChannel(p.channel)}
                      className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${isActive ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {p.channel}
                    </button>
                  );
                })}
              </div>

              {/* Channels Preview Display */}
              {previews
                .filter(p => p.channel === activeChannel)
                .map((p, idx) => (
                  <div key={idx} className="space-y-4">
                    
                    {/* Render specific layout based on channel */}
                    {p.channel === 'Email' ? (
                      <div className="space-y-3 bg-slate-200/20 dark:bg-slate-900/30 border border-slate-200/20 dark:border-slate-800/20 p-4 rounded-2xl">
                        <div>
                          <span className="font-bold text-slate-400 block uppercase text-[8px] tracking-wider">Email Subject</span>
                          <span className="font-bold block text-slate-700 dark:text-slate-300 mt-0.5">{p.subject}</span>
                        </div>
                        <hr className="border-slate-200/20 dark:border-slate-800/20" />
                        <div>
                          <span className="font-bold text-slate-400 block uppercase text-[8px] tracking-wider">Email Body</span>
                          <p className="whitespace-pre-wrap leading-relaxed text-slate-500 dark:text-slate-300 font-medium mt-1.5">{p.body}</p>
                        </div>
                      </div>
                    ) : p.channel === 'WhatsApp' ? (
                      /* WhatsApp mobile view mockup */
                      <div className="bg-[#E5DDD5] dark:bg-[#0b141a] p-4 rounded-2xl border border-slate-200/20 dark:border-slate-800/20 font-sans shadow-inner max-w-sm mx-auto">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-[#D4C3B3] dark:border-[#222e35] mb-3">
                          <div className="w-7 h-7 rounded-full bg-[#128C7E] flex items-center justify-center text-white font-bold text-xs">G</div>
                          <div>
                            <span className="font-bold block text-slate-800 dark:text-slate-200 text-[10px]">Ganga Maxx B2B</span>
                            <span className="text-[8px] text-slate-500 block -mt-0.5">Online</span>
                          </div>
                        </div>
                        <div className="bg-[#DCF8C6] dark:bg-[#005c4b] text-slate-800 dark:text-slate-200 p-3 rounded-xl rounded-tl-none shadow-sm text-[11px] leading-relaxed relative max-w-[85%]">
                          <p className="whitespace-pre-wrap font-medium">{p.body.replace(/\*/g, '')}</p>
                          <span className="block text-[8px] text-slate-400 text-right mt-1.5">12:00 PM</span>
                        </div>
                      </div>
                    ) : (
                      /* SMS View */
                      <div className="bg-slate-200/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200/20 dark:border-slate-800/20 max-w-sm mx-auto">
                        <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded-xl text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 font-medium border border-slate-200/30 dark:border-slate-800/30">
                          <p className="whitespace-pre-wrap">{p.body}</p>
                        </div>
                      </div>
                    )}

                    {/* Action send */}
                    <button 
                      onClick={() => handleSendSimulated(p.channel)}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Trigger Simulated outreach
                    </button>

                  </div>
                ))}

            </div>
          )}
        </div>

      </div>

    </div>
  );
}
