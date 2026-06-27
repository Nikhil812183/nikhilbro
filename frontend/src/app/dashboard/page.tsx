'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  Users, 
  Clock, 
  ShoppingBag, 
  DollarSign, 
  AlertCircle, 
  CheckCircle,
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  MoreVertical,
  ChevronDown,
  Play,
  Calendar,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface KPIStats {
  totalCustomers: number;
  dueReminders: number;
  ordersToday: number;
  revenue: number;
  pendingFollowups: number;
  completedReminders: number;
  todayRevenue: number;
}

export default function DashboardOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [reminders, setReminders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('reminder_date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<string | null>(null);

  // Fetch all necessary data
  const fetchData = async () => {
    try {
      const statsRes = await api.getDashboardStats();
      setStats(statsRes);
      
      const remindersRes = await api.getReminders();
      setReminders(remindersRes.reminders || []);
    } catch (err: any) {
      showToast(`Error loading dashboard: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
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

  const handleAction = async (id: number, action: 'Completed' | 'Sent' | 'Failed' | 'Snooze') => {
    try {
      if (action === 'Snooze') {
        const res = await api.snoozeReminder(id, 3);
        showToast(res.message);
      } else {
        const res = await api.updateReminderStatus(id, action, action === 'Completed' ? 'Manually processed reorder' : undefined);
        showToast(res.message);
      }
      fetchData();
    } catch (err: any) {
      showToast(`Action failed: ${err.message}`);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Compiling B2B Analytics...</p>
        </div>
      </div>
    );
  }

  const { kpis, charts } = stats;

  // Render ChartJS configs
  const barChartData = {
    labels: charts.monthlyOrders.map((d: any) => d.month),
    datasets: [
      {
        label: 'Revenue (INR)',
        data: charts.monthlyOrders.map((d: any) => d.revenue),
        backgroundColor: 'rgba(37, 99, 235, 0.75)',
        borderRadius: 8,
        borderWidth: 0
      }
    ]
  };

  const lineChartData = {
    labels: charts.repeatOrderTrend.map((d: any) => d.month),
    datasets: [
      {
        label: 'Repeat Purchase Rate (%)',
        data: charts.repeatOrderTrend.map((d: any) => d.rate),
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#8B5CF6'
      }
    ]
  };

  const doughnutChartData = {
    labels: charts.reminderStatusDistribution.map((d: any) => d.name),
    datasets: [
      {
        data: charts.reminderStatusDistribution.map((d: any) => d.value),
        backgroundColor: ['#F59E0B', '#4F46E5', '#22C55E', '#EF4444'],
        borderWidth: 0
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { borderDash: [4, 4] } }
    }
  };

  // Filter reminders client-side for dynamic search experience
  const filteredReminders = reminders.filter(rem => {
    const matchesSearch = rem.customer_name.toLowerCase().includes(search.toLowerCase()) || 
                          rem.product_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? rem.status === statusFilter : true;
    const matchesPriority = priorityFilter ? rem.customer_priority === priorityFilter : true;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Client side pagination
  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredReminders.length / itemsPerPage);
  const paginatedReminders = filteredReminders.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel border-l-4 border-l-blue-600 bg-white dark:bg-slate-900 px-5 py-3.5 shadow-2xl flex items-center gap-3 text-xs font-semibold animate-bounce">
          <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
          <span>{toast}</span>
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-black">B2B Core Overview</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Real-time restock lifecycles and cycle indicators</p>
        </div>

        <button 
          onClick={handleRunManualCycle}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Recalculate Reminders
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        <div className="glass-panel p-4 flex items-center gap-3 border-l-4 border-l-blue-500">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[9px] uppercase font-bold text-slate-400">Total B2B Accounts</span>
            <h3 className="text-lg font-black mt-0.5">{kpis.totalCustomers}</h3>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-3 border-l-4 border-l-amber-500">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[9px] uppercase font-bold text-slate-400">Due Reminders</span>
            <h3 className="text-lg font-black mt-0.5">{kpis.dueReminders}</h3>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-3 border-l-4 border-l-indigo-500">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[9px] uppercase font-bold text-slate-400">Orders Today</span>
            <h3 className="text-lg font-black mt-0.5">{kpis.ordersToday}</h3>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-3 border-l-4 border-l-emerald-500">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="block text-[9px] uppercase font-bold text-slate-400">Total Revenue</span>
            <h3 className="text-base font-black truncate mt-0.5">Rs. {Math.round(kpis.revenue).toLocaleString()}</h3>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-3 border-l-4 border-l-rose-500">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[9px] uppercase font-bold text-slate-400">Urgent Alerts</span>
            <h3 className="text-lg font-black mt-0.5 text-rose-500">{kpis.pendingFollowups}</h3>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-3 border-l-4 border-l-teal-500">
          <div className="w-10 h-10 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[9px] uppercase font-bold text-slate-400">Completed Reminders</span>
            <h3 className="text-lg font-black mt-0.5">{kpis.completedReminders}</h3>
          </div>
        </div>

      </div>

      {/* Charts Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Revenue Bar Chart */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Monthly Sales (INR)</h3>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-56">
            <Bar data={barChartData} options={chartOptions as any} />
          </div>
        </div>

        {/* Repeat Order Trend */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Repeat Order Retention Rate</h3>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-56">
            <Line data={lineChartData} options={chartOptions as any} />
          </div>
        </div>

        {/* Reminder Success rates */}
        <div className="glass-panel p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">Reminder Status Distribution</h3>
            <div className="h-44 relative flex items-center justify-center">
              <Doughnut data={doughnutChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
              <div className="absolute text-center">
                <span className="block text-2xl font-black text-blue-600 dark:text-blue-400">{charts.reminderSuccessRate}%</span>
                <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-400">Success Rate</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-[9px] font-bold text-slate-400 pt-2 border-t border-slate-200/20 dark:border-slate-800/20">
            <div>
              <span className="block w-2.5 h-2.5 rounded-full bg-amber-500 mx-auto mb-1" />
              <span>Pending</span>
            </div>
            <div>
              <span className="block w-2.5 h-2.5 rounded-full bg-indigo-600 mx-auto mb-1" />
              <span>Outbound</span>
            </div>
            <div>
              <span className="block w-2.5 h-2.5 rounded-full bg-emerald-500 mx-auto mb-1" />
              <span>Completed</span>
            </div>
            <div>
              <span className="block w-2.5 h-2.5 rounded-full bg-rose-500 mx-auto mb-1" />
              <span>Failed</span>
            </div>
          </div>
        </div>

      </div>

      {/* Core Interactive Reminders Table */}
      <div className="glass-panel p-6 space-y-4">
        
        {/* Table Filters Top */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-display font-black text-sm">Replenishment Priority Queue</h3>
          
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Account / Product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-200/20 dark:bg-slate-900/30 border border-slate-200/30 dark:border-slate-800/30 rounded-xl text-xs w-48 focus:w-60 focus:outline-none transition-all"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-200/20 dark:bg-slate-900/30 border border-slate-200/30 dark:border-slate-800/30 rounded-xl text-xs outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Sent">Sent</option>
              <option value="Completed">Completed</option>
              <option value="Failed">Failed</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-200/20 dark:bg-slate-900/30 border border-slate-200/30 dark:border-slate-800/30 rounded-xl text-xs outline-none focus:border-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="Predicted">Predicted</option>
              <option value="Stable">Stable</option>
            </select>

          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-slate-400 border-b border-slate-200/40 dark:border-slate-800/40">
                <th className="pb-3 font-semibold">Customer Account</th>
                <th className="pb-3 font-semibold">Primary Product Category</th>
                <th className="pb-3 font-semibold">Exhaustion Date</th>
                <th className="pb-3 font-semibold">Replenishment Priority</th>
                <th className="pb-3 font-semibold">Reminder Status</th>
                <th className="pb-3 font-semibold">Assigned Owner</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedReminders.map((rem) => {
                
                // Priority color badges
                let priorityColor = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
                if (rem.customer_priority === 'Urgent') priorityColor = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
                if (rem.customer_priority === 'Predicted') priorityColor = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
                
                // Status color badges
                let statusColor = 'bg-slate-500/10 text-slate-500 border-slate-500/20';
                if (rem.status === 'Completed') statusColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
                if (rem.status === 'Pending') statusColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
                if (rem.status === 'Sent') statusColor = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
                if (rem.status === 'Failed') statusColor = 'bg-rose-500/20 text-rose-400 border-rose-500/30';

                return (
                  <tr key={rem.id} className="border-b border-slate-200/20 dark:border-slate-800/20 hover:bg-slate-200/10 dark:hover:bg-slate-900/10 transition-colors">
                    <td className="py-4">
                      <span className="block font-bold">{rem.customer_name}</span>
                      <span className="block text-[10px] text-slate-400">{rem.customer_company}</span>
                    </td>
                    <td className="py-4">
                      <span className="font-medium">{rem.product_name}</span>
                      <span className="block text-[10px] text-slate-400">{rem.product_category}</span>
                    </td>
                    <td className="py-4 font-semibold text-slate-500 dark:text-slate-400">
                      {new Date(rem.reminder_date).toLocaleDateString()}
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${priorityColor}`}>
                        {rem.customer_priority}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusColor}`}>
                        {rem.status}
                      </span>
                    </td>
                    <td className="py-4 font-semibold text-slate-500 dark:text-slate-300">
                      {rem.staff_name || 'System Unassigned'}
                    </td>
                    <td className="py-4 text-right space-x-2">
                      {rem.status === 'Pending' && (
                        <>
                          {/* Send simulated alert */}
                          <button 
                            onClick={() => handleAction(rem.id, 'Sent')}
                            title="Trigger Simulated Outreach Alert"
                            className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all inline-flex items-center justify-center"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          
                          {/* Snooze alert */}
                          <button 
                            onClick={() => handleAction(rem.id, 'Snooze')}
                            title="Snooze Reminder (3 days)"
                            className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white transition-all inline-flex items-center justify-center"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {rem.status !== 'Completed' && (
                        /* Complete Order restock */
                        <button 
                          onClick={() => handleAction(rem.id, 'Completed')}
                          title="Verify Restock Order Placed"
                          className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all inline-flex items-center justify-center"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredReminders.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500 font-semibold">
                    No matching B2B replenishment reminders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200/20 dark:border-slate-800/20 pt-4 text-xs font-bold text-slate-400">
            <span>Showing Page {page} of {totalPages} ({filteredReminders.length} items)</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200/30 dark:border-slate-800/30 hover:bg-slate-200/30 dark:hover:bg-slate-900/30 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200/30 dark:border-slate-800/30 hover:bg-slate-200/30 dark:hover:bg-slate-900/30 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
