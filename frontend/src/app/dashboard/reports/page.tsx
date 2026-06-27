'use client';

import React, { useState } from 'react';
import { api } from '../../../services/api';
import { 
  FileDown, 
  FileText, 
  Table, 
  FileSpreadsheet, 
  Sparkles, 
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('reminder');
  const [format, setFormat] = useState('pdf');
  const [dateRange, setDateRange] = useState('all');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleDownload = () => {
    try {
      showToast(`Generating ${reportType.toUpperCase()} report in ${format.toUpperCase()} format...`);
      const downloadUrl = api.getReportDownloadUrl(reportType, format);
      
      // Open in a new tab to trigger browser download prompt
      window.open(downloadUrl, '_blank');
    } catch (err: any) {
      showToast(`Generation failed: ${err.message}`);
    }
  };

  const reportOptions = [
    { type: 'reminder', name: 'Reminder Success Report', desc: 'Audit generated restock cycles, snoozes, completions, and SMS/WhatsApp channels feedback logs.' },
    { type: 'customer', name: 'B2B Customer CRM Directory', desc: 'Complete listings of active customer contracts, emails, types, intervals, and assigned owners.' },
    { type: 'sales', name: 'Sales Order Invoices History', desc: 'Log of processed restock orders, totals, dispatch delivery status, and invoice parameters.' },
    { type: 'product', name: 'Product SKU Inventory Status', desc: 'Log of stock levels, category listings, pricing, SKU codes, and low stock indicators.' }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel border-l-4 border-l-blue-600 bg-white dark:bg-slate-900 px-5 py-3.5 shadow-2xl flex items-center gap-3 text-xs font-semibold animate-bounce">
          <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
          <span>{toast}</span>
        </div>
      )}

      {/* Title */}
      <div>
        <h1 className="text-2xl font-display font-black">Exports & Document Reports</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Compile structured transaction histories, contracts registries, and inventories audits</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Left Columns: Config choices */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Card 1: Select Type */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">1. Select Report Category</h3>
            <div className="space-y-3">
              {reportOptions.map((opt) => (
                <label 
                  key={opt.type}
                  className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${reportType === opt.type ? 'border-blue-600 bg-blue-500/5 dark:border-blue-500 dark:bg-blue-500/10' : 'border-slate-200/40 dark:border-slate-800/40 hover:bg-slate-200/30 dark:hover:bg-slate-800/30'}`}
                >
                  <input
                    type="radio"
                    name="reportType"
                    value={opt.type}
                    checked={reportType === opt.type}
                    onChange={() => setReportType(opt.type)}
                    className="mt-1 border-slate-300 text-blue-600 focus:ring-0"
                  />
                  <div className="text-xs">
                    <span className="font-bold block">{opt.name}</span>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Download Card */}
        <div className="glass-panel p-6 space-y-6">
          
          {/* Formats Choice */}
          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">2. Document Format</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { format: 'pdf', name: 'PDF', icon: FileText, desc: 'Print Ready' },
                { format: 'xlsx', name: 'Excel', icon: FileSpreadsheet, desc: 'Spreadsheet' },
                { format: 'csv', name: 'CSV', icon: Table, desc: 'Flat Data' }
              ].map((fmt) => {
                const isActive = format === fmt.format;
                return (
                  <button
                    key={fmt.format}
                    onClick={() => setFormat(fmt.format)}
                    className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all ${isActive ? 'border-blue-600 bg-blue-500/5 dark:border-blue-500 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold' : 'border-slate-200/40 dark:border-slate-800/40 hover:bg-slate-200/30 dark:hover:bg-slate-800/30 text-slate-400'}`}
                  >
                    <fmt.icon className="w-5 h-5" />
                    <span className="text-[10px] block">{fmt.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date range filter mock */}
          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">3. Date Range</h3>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full p-3 bg-slate-200/20 dark:bg-slate-900/30 border border-slate-200/30 dark:border-slate-800/30 rounded-xl text-xs outline-none focus:border-blue-500"
            >
              <option value="all">Full Audit Ledger</option>
              <option value="today">Today Only</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Current Month</option>
            </select>
          </div>

          <hr className="border-slate-200/20 dark:border-slate-800/20" />

          {/* Download CTA */}
          <button
            onClick={handleDownload}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            Generate & Download
            <ArrowRight className="w-4 h-4" />
          </button>

        </div>

      </div>

    </div>
  );
}
