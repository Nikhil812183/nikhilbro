'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Sparkles, 
  ArrowRight,
  TrendingUp, 
  Eye, 
  RefreshCw,
  X,
  PlusCircle,
  AlertTriangle,
  FileText
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  company: string;
  contact: string;
  email: string;
  address: string;
  type: string;
  purchase_frequency: string;
  last_order_date: string;
  next_reminder_date: string;
  status: string;
}

export default function CustomersCRMPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal states
  const [formOpen, setFormOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    id: '', name: '', company: '', contact: '', email: '', 
    address: '', type: 'Hotel', purchaseFrequency: 'Weekly'
  });
  
  // Detail sidebar drawer states
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [aiData, setAiData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.getCustomers({
        search,
        type: typeFilter,
        status: statusFilter,
        page: page.toString(),
        limit: '6'
      });
      setCustomers(res.customers || []);
      setTotalPages(res.pagination.totalPages || 1);
    } catch (err: any) {
      showToast(`Error loading customers: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, typeFilter, statusFilter, page]);

  const handleOpenCreate = () => {
    setIsEdit(false);
    setFormData({
      id: `CUST-${Math.floor(10 + Math.random() * 90)}`,
      name: '', company: '', contact: '', email: '', 
      address: '', type: 'Hotel', purchaseFrequency: 'Weekly'
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setIsEdit(true);
    setFormData({
      id: c.id,
      name: c.name,
      company: c.company || '',
      contact: c.contact || '',
      email: c.email,
      address: c.address || '',
      type: c.type,
      purchaseFrequency: c.purchase_frequency
    });
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await api.updateCustomer(formData.id, formData);
        showToast('Customer account updated successfully.');
      } else {
        await api.createCustomer(formData);
        showToast('New customer registered.');
      }
      setFormOpen(false);
      fetchCustomers();
    } catch (err: any) {
      showToast(`Action failed: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this B2B customer and purge all reminder rules?')) return;
    try {
      await api.deleteCustomer(id);
      showToast('Customer purged from database.');
      fetchCustomers();
      if (detailCustomer?.id === id) setDetailCustomer(null);
    } catch (err: any) {
      showToast(`Delete failed: ${err.message}`);
    }
  };

  const handleOpenDetails = async (c: Customer) => {
    setDetailCustomer(c);
    setDetailLoading(true);
    setAiData(null);
    setDetailData(null);
    try {
      const details = await api.getCustomerById(c.id);
      setDetailData(details);
      
      const recommendations = await api.getAiRecommendations(c.id);
      setAiData(recommendations);
    } catch (err: any) {
      showToast(`AI engine failed: ${err.message}`);
    } finally {
      setDetailLoading(false);
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
          <h1 className="text-2xl font-display font-black">Customer CRM Directory</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage B2B contracts, check safety stock requirements, and view AI recommendations</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Register Customer
        </button>
      </div>

      {/* Main Grid: Directory + Sidebar details */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* Left Columns: Directory */}
        <div className="xl:col-span-2 space-y-4">
          
          {/* Filters Bar */}
          <div className="glass-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, company, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-200/20 dark:bg-slate-900/30 border border-slate-200/30 dark:border-slate-800/30 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-slate-200/20 dark:bg-slate-900/30 border border-slate-200/30 dark:border-slate-800/30 rounded-xl text-xs outline-none"
              >
                <option value="">All Types</option>
                <option value="Hotel">Hotel</option>
                <option value="Clinic">Clinic</option>
                <option value="Office">Office</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-200/20 dark:bg-slate-900/30 border border-slate-200/30 dark:border-slate-800/30 rounded-xl text-xs outline-none"
              >
                <option value="">All Priorities</option>
                <option value="Urgent">Urgent</option>
                <option value="Predicted">Predicted</option>
                <option value="Stable">Stable</option>
              </select>
            </div>

          </div>

          {/* Customer Cards Roster */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customers.map((c) => {
                let statusColor = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
                if (c.status === 'Urgent') statusColor = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
                if (c.status === 'Predicted') statusColor = 'bg-amber-500/10 text-amber-500 border-amber-500/20';

                return (
                  <div key={c.id} className="glass-card p-5 space-y-4 relative flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase font-bold text-slate-400">{c.type} • {c.purchase_frequency} restocks</span>
                          <h3 className="font-bold text-sm truncate mt-0.5">{c.name}</h3>
                          <span className="block text-[11px] text-slate-400 font-semibold">{c.company}</span>
                        </div>
                        
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${statusColor}`}>
                          {c.status}
                        </span>
                      </div>

                      <hr className="border-slate-200/20 dark:border-slate-800/20 my-3.5" />

                      <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        <p>📞 {c.contact}</p>
                        <p>✉️ {c.email}</p>
                        <p>📅 Next check: {c.next_reminder_date ? new Date(c.next_reminder_date).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-200/20 dark:border-slate-800/20 mt-2">
                      <button 
                        onClick={() => handleOpenDetails(c)}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-600 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        AI Insights
                      </button>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleOpenEdit(c)}
                          className="p-2 rounded-xl bg-slate-200/30 dark:bg-slate-900/30 border border-slate-200/30 dark:border-slate-800/30 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-slate-500"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(c.id)}
                          className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {customers.length === 0 && (
                <div className="col-span-2 text-center py-20 glass-panel text-slate-500 font-bold">
                  No B2B customer accounts matches these filters.
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200/20 dark:border-slate-800/20 text-xs font-bold text-slate-400">
              <span>Page {page} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-xl border border-slate-200/30 dark:border-slate-800/30 hover:bg-slate-200/30 dark:hover:bg-slate-900/30 disabled:opacity-50"
                >
                  Prev
                </button>
                <button 
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-xl border border-slate-200/30 dark:border-slate-800/30 hover:bg-slate-200/30 dark:hover:bg-slate-900/30 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: AI Detail Insights Sidebar Drawer */}
        <div className="glass-panel p-6 space-y-6">
          <h2 className="font-display font-black text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
            B2B AI Recommendation Hub
          </h2>

          {!detailCustomer ? (
            <div className="text-center py-20 text-slate-500 text-xs flex flex-col items-center gap-2">
              <Eye className="w-8 h-8 text-slate-400" />
              <span>Select a customer account in the directory to audit logs and load heuristic restock predictions.</span>
            </div>
          ) : detailLoading ? (
            <div className="text-center py-20 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Loading predictions...</p>
            </div>
          ) : (
            <div className="space-y-6 text-xs animate-in fade-in duration-300">
              
              {/* Account summary */}
              <div>
                <h3 className="font-bold text-sm text-blue-600 dark:text-blue-400">{detailCustomer.name}</h3>
                <span className="block text-[10px] text-slate-400 font-semibold">{detailCustomer.company}</span>
                <span className="block text-[10px] text-slate-500 mt-1">📍 Address: {detailCustomer.address}</span>
              </div>

              <hr className="border-slate-200/20 dark:border-slate-800/20" />

              {/* Consumption summary */}
              {aiData?.consumptionSummary && (
                <div className="space-y-3.5">
                  <h4 className="font-bold text-[10px] uppercase text-slate-400 tracking-wider">Consumption Cycle Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between font-semibold">
                      <span>Restock Cycle Completion</span>
                      <span>{aiData.consumptionSummary.cycleCompletedPercentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200/40 dark:bg-slate-800/40 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600"
                        style={{ width: `${aiData.consumptionSummary.cycleCompletedPercentage}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed italic">{aiData.consumptionSummary.consumptionInsight}</p>
                  </div>
                </div>
              )}

              {/* Product recommendations */}
              {aiData?.recommendedProducts && (
                <div className="space-y-3">
                  <h4 className="font-bold text-[10px] uppercase text-slate-400 tracking-wider">Products To Reorder</h4>
                  <div className="space-y-2">
                    {aiData.recommendedProducts.map((p: any) => (
                      <div key={p.id} className="flex justify-between items-center p-2.5 bg-slate-200/20 dark:bg-slate-900/30 border border-slate-200/20 dark:border-slate-800/20 rounded-xl">
                        <div>
                          <span className="font-bold block">{p.name}</span>
                          <span className="text-[9px] text-slate-400 font-semibold">SKU: {p.sku} | WH Stock: {p.stock}</span>
                        </div>
                        <span className="font-black text-blue-600 dark:text-blue-400">Rs. {p.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cleaning Kits Suggested */}
              {aiData?.suggestedKits && (
                <div className="space-y-3">
                  <h4 className="font-bold text-[10px] uppercase text-slate-400 tracking-wider">Suggested Cleaning Kits</h4>
                  <div className="space-y-2.5">
                    {aiData.suggestedKits.map((k: any, idx: number) => (
                      <div key={idx} className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-2">
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-[11px] text-indigo-400">{k.name}</span>
                          <span className="text-indigo-400">Rs. {k.price}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">{k.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {k.items.map((i: string, iidx: number) => (
                            <span key={iidx} className="text-[8px] bg-slate-200/40 dark:bg-slate-800/40 px-2 py-0.5 rounded font-medium">{i}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sales Insights */}
              {aiData?.salesInsights && (
                <div className="space-y-2">
                  <h4 className="font-bold text-[10px] uppercase text-slate-400 tracking-wider">AI Regional Insights</h4>
                  <div className="space-y-2">
                    {aiData.salesInsights.map((insight: string, idx: number) => (
                      <div key={idx} className="p-2.5 bg-slate-200/10 border border-slate-200/20 dark:border-slate-800/20 rounded-xl text-slate-400 italic">
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order history */}
              {detailData?.orders && detailData.orders.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200/20 dark:border-slate-800/20">
                  <h4 className="font-bold text-[10px] uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    B2B Invoice logs
                  </h4>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {detailData.orders.map((o: any) => (
                      <div key={o.id} className="flex justify-between items-center text-[10px] text-slate-500 py-1 border-b border-slate-200/20 dark:border-slate-800/20">
                        <span>{o.id} ({new Date(o.order_date).toLocaleDateString()})</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">Rs. {o.total_amount} ({o.status})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

      </div>

      {/* Add / Edit Customer Form Dialog Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-panel p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <button 
              onClick={() => setFormOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/40"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-display font-black mb-6">
              {isEdit ? 'Modify Contract Details' : 'Register New B2B Contract'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Customer ID</label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    disabled={isEdit}
                    placeholder="CUST-01"
                    required
                    className="w-full glass-input p-3 rounded-xl disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Contract Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Novotel Hyderabad"
                    required
                    className="w-full glass-input p-3 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">B2B Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Novotel India"
                    required
                    className="w-full glass-input p-3 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Procurement Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="purchase@novotel.com"
                    required
                    className="w-full glass-input p-3 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="+91 98765 43210"
                    required
                    className="w-full glass-input p-3 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Corporate Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Jubilee Hills, Hyderabad"
                    required
                    className="w-full glass-input p-3 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Sector Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full glass-input p-3 rounded-xl focus:bg-[#FFF] dark:focus:bg-[#0f172a]"
                  >
                    <option value="Hotel">Hotel</option>
                    <option value="Clinic">Clinic</option>
                    <option value="Office">Office</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Replenishment Frequency</label>
                  <select
                    value={formData.purchaseFrequency}
                    onChange={(e) => setFormData({ ...formData, purchaseFrequency: e.target.value })}
                    className="w-full glass-input p-3 rounded-xl focus:bg-[#FFF] dark:focus:bg-[#0f172a]"
                  >
                    <option value="Weekly">Weekly Cycle (14 Days)</option>
                    <option value="Monthly">Monthly Cycle (30 Days)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/10"
                >
                  Save Contract
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
