'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  Users, 
  TrendingUp, 
  Zap, 
  Truck, 
  MessageSquareCode, 
  Layers, 
  HelpCircle,
  Mail,
  Building,
  Menu,
  X,
  Check
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    // Apply dark class by default
    document.documentElement.classList.add('dark');
  }, []);

  const toggleTheme = () => {
    if (theme === 'dark') {
      document.documentElement.classList.remove('dark');
      setTheme('light');
    } else {
      document.documentElement.classList.add('dark');
      setTheme('dark');
    }
  };

  const fadeInUp: any = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: custom * 0.1, duration: 0.6, ease: 'easeOut' }
    })
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Navigation Header */}
      <nav className="fixed top-0 w-full z-50 glass-panel border-b border-slate-200/40 dark:border-slate-800/40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
            G
          </div>
          <div>
            <span className="font-display font-extrabold text-sm uppercase tracking-wider block">Ganga Maxx</span>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block -mt-1">Reminder Engine</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</a>
          <a href="#workflow" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">How It Works</a>
          <a href="#pricing" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">FAQ</a>
          <a href="#contact" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact</a>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/20 dark:bg-slate-900/30 text-xs font-semibold"
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
          
          <Link href="/login">
            <button className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              Sign In
            </button>
          </Link>
          
          <Link href="/register">
            <button className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 transition-all">
              Start Free Trial
            </button>
          </Link>
        </div>

        <button className="md:hidden p-2 rounded-xl" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="absolute top-20 left-0 w-full glass-panel border-b border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4 text-center md:hidden animate-in fade-in slide-in-from-top-5 duration-200">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="py-2 text-sm">Features</a>
            <a href="#workflow" onClick={() => setMobileMenuOpen(false)} className="py-2 text-sm">How It Works</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="py-2 text-sm">Pricing</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="py-2 text-sm">FAQ</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="py-2 text-sm">Contact</a>
            <hr className="border-slate-200 dark:border-slate-800" />
            <div className="flex flex-col gap-3">
              <Link href="/login">
                <button className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold">Sign In</button>
              </Link>
              <Link href="/register">
                <button className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-md shadow-blue-500/10">Start Free Trial</button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Background Decorative Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-20 dark:opacity-40">
          <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600 blur-[130px]" />
          <div className="absolute top-[20%] right-[-10%] w-[450px] h-[450px] rounded-full bg-violet-600 blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-white/50 dark:border-slate-800 dark:bg-slate-900/50 text-xs font-semibold mb-6 shadow-sm backdrop-blur"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
            Milestone: Ganga Maxx 2026 Core Platform
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="text-4xl sm:text-5xl md:text-6xl font-display font-black tracking-tight leading-none max-w-4xl mx-auto"
          >
            Predictive Reorder Automation for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-400">
              Bulk Supply Chains
            </span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={3}
            className="mt-6 text-base sm:text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium"
          >
            Transition bulk facility supply logistics in Telangana from manual spreadsheets to real-time, automated predictive B2B restock lifecycles.
          </motion.p>

          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={4}
            className="mt-10 flex flex-wrap justify-center gap-4"
          >
            <Link href="/register">
              <button className="px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 flex items-center gap-2 group transition-all">
                Launch Platform
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <a href="#features">
              <button className="px-6 py-3.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-800/50 backdrop-blur transition-all">
                Explore Solution
              </button>
            </a>
          </motion.div>

          {/* Floating UI Mock Preview */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 max-w-5xl mx-auto rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-950/40 p-4 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-3 mb-4">
              <div className="flex space-x-1.5">
                <div className="w-3.5 h-3.5 rounded-full bg-red-500/80" />
                <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/80" />
                <div className="w-3.5 h-3.5 rounded-full bg-green-500/80" />
              </div>
              <div className="text-xs font-mono text-slate-400">ganga-maxx-reorder-dashboard.in</div>
              <div className="w-6" />
            </div>

            {/* Mock Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="bg-slate-100/60 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-200/30 dark:border-slate-800/30">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-medium uppercase tracking-wider">Predictive Status</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                </div>
                <h3 className="text-lg font-bold mt-2">4 Urgent Accounts</h3>
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">Requires coordinator contact today</p>
              </div>

              <div className="bg-slate-100/60 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-200/30 dark:border-slate-800/30">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-medium uppercase tracking-wider">Active Dispatches</span>
                  <Truck className="w-4 h-4 text-blue-500" />
                </div>
                <h3 className="text-lg font-bold mt-2">2 in Transit</h3>
                <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">Hyderabad & Warangal routes</p>
              </div>

              <div className="bg-slate-100/60 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-200/30 dark:border-slate-800/30">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-medium uppercase tracking-wider">CRM Input Latency</span>
                  <Activity className="w-4 h-4 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold mt-2">&lt; 150ms Latency</h3>
                <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-1">Guaranteed SLA trigger times</p>
              </div>
            </div>

            {/* Bottom table mock */}
            <div className="mt-4 bg-slate-100/40 dark:bg-slate-900/40 rounded-xl p-4 border border-slate-200/30 dark:border-slate-800/30 text-left overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-200/30 dark:border-slate-800/30">
                    <th className="pb-2 font-semibold">Customer Account</th>
                    <th className="pb-2 font-semibold">Primary Product</th>
                    <th className="pb-2 font-semibold">Cycle Status</th>
                    <th className="pb-2 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200/20 dark:border-slate-800/20">
                    <td className="py-2.5 font-bold">Novotel Convention Centre</td>
                    <td className="py-2.5">Floor Detergent 20L</td>
                    <td className="py-2.5 text-red-500 font-bold">Overdue (2 Days)</td>
                    <td className="py-2.5"><span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-semibold">Notify</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold">Apollo Hospitals, Jubilee Hills</td>
                    <td className="py-2.5">Sanitizer Concentrate 5L</td>
                    <td className="py-2.5 text-yellow-500 font-bold">Predicted (1 Day Left)</td>
                    <td className="py-2.5"><span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-semibold">Notify</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-100/50 dark:bg-slate-950/20 border-y border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-display font-black">Designed for B2B Operations</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-3">Enterprise-grade capabilities to manage facility supply lifecycles in real-time.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-8">
              <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Reminder Engine</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 leading-relaxed">
                Calculates inventory exhaustion dates using purchase history, product consumption rules, and customizable cycles (weekly, monthly, custom).
              </p>
            </div>

            <div className="glass-card p-8">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center mb-6">
                <MessageSquareCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Omnichannel Previews</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 leading-relaxed">
                Directly preview and trigger WhatsApp blasts, Email templates, and SMS alerts to coordinators. Includes full edit controls and manual resends.
              </p>
            </div>

            <div className="glass-card p-8">
              <div className="w-12 h-12 rounded-xl bg-violet-600/10 text-violet-600 flex items-center justify-center mb-6">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Local AI Recommendation</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 leading-relaxed">
                Recommends products to reorder, creates safety cleaning kits dynamically by business sector, and provides regional consumption growth insights.
              </p>
            </div>

            <div className="glass-card p-8">
              <div className="w-12 h-12 rounded-xl bg-amber-600/10 text-amber-600 flex items-center justify-center mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Role-Based Workflows</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 leading-relaxed">
                Distinct panels for Admin, Coordinator, Salesperson, and Dispatcher roles. Ensures security, audit trail compliance, and clear task assignment.
              </p>
            </div>

            <div className="glass-card p-8">
              <div className="w-12 h-12 rounded-xl bg-rose-600/10 text-rose-600 flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Deep B2B Reports</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 leading-relaxed">
                Download formatted Excel sheets, streamable flat CSV files, and print-ready PDF audit logs for sales, products, and reminder cycles.
              </p>
            </div>

            <div className="glass-card p-8">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Audit Trail & Security</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 leading-relaxed">
                100% unified digital logging. Automatically captures system changes, logins, snoozed reminders, and restock order dispatches.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="workflow" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-display font-black">How It Works</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-3">The automated replenishment pipeline is streamlined into four clear steps.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-blue-600/10 dark:bg-slate-800 -translate-y-1/2 z-0 hidden md:block" />
          
          {[
            { step: '1', title: 'Connect Customer', desc: 'Register customer, assign staff, and choose replenishment frequency (e.g. Weekly Novotel chemicals).' },
            { step: '2', title: 'Engine Evaluates', desc: 'Automatic background calculations predict exhaustion based on category rules and days remaining.' },
            { step: '3', title: 'Approve & Preview', desc: 'Coordinator reviews draft reminders, previews WhatsApp/Email formatting, and triggers outreach.' },
            { step: '4', title: 'Restock Placed', desc: 'When the reminder is validated, a B2B order logs, stock decrements, and the cycle resets.' }
          ].map((item, index) => (
            <div key={index} className="glass-card p-6 text-center relative z-10">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto mb-4 border-4 border-slate-50 dark:border-[#0F172A]">
                {item.step}
              </div>
              <h3 className="font-bold text-sm">{item.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-slate-100/50 dark:bg-slate-950/20 border-y border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-display font-black">B2B Coordinator Testimonials</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-3">Trusted by operations managers across hospitality and clinical sectors.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "Before this reminder system, our housekeeping staff frequently ran out of industrial cleaning chemicals. Now, restocks are completely automated based on our cycle predictions. Highly recommend!",
                name: "Anusha Reddy",
                role: "Facilities Director, Novotel Hyderabad"
              },
              {
                quote: "In a medical environment, sanitation stock levels are non-negotiable. This tool tracks our sanitizer consumption rates and warns our manager when stocks are low. Setup took less than an hour.",
                name: "Dr. K. Srinivas",
                role: "Operations Head, Apollo Hospitals"
              },
              {
                quote: "Managing washroom supplies for 12 corporate floors used to require daily spreadsheet checks. Now, the system sends an email draft directly to our warehouse coordinator. True time-saver.",
                name: "M. A. Rahman",
                role: "Workplace Operations Manager, Wipro Gachibowli"
              }
            ].map((item, index) => (
              <div key={index} className="glass-panel p-8 flex flex-col justify-between">
                <p className="text-slate-600 dark:text-slate-400 text-xs italic leading-relaxed">"{item.quote}"</p>
                <div className="mt-6 border-t border-slate-200/40 dark:border-slate-800/40 pt-4">
                  <h4 className="font-bold text-xs">{item.name}</h4>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">{item.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-display font-black">Predictive Supply Plans</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-3">Simple pricing to scale logistics across facility counts.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { plan: "Starter", price: "Rs. 2,999", desc: "Perfect for single facilities managing core items.", features: ["Up to 50 B2B Customers", "Standard Cycle Calculations", "Email & SMS Previews", "Basic Reports Download"] },
            { plan: "Professional", price: "Rs. 7,999", desc: "For scaling facility supply chains in regional zones.", features: ["Up to 250 B2B Customers", "Predictive ML-Heuristics", "WhatsApp Channel Previews", "Excel, CSV & PDF Exports", "Role-Based Permissions", "Audit Logging API"], recommended: true },
            { plan: "Enterprise", price: "Custom Pricing", desc: "For multinational supply networks with ERP integrations.", features: ["Unlimited Customers", "Full PostgreSQL Server Sync", "Dedicated Node.js Engine Instance", "Custom WhatsApp Gateway", "AI Stock Multipliers", "24/7 SLA Support"] }
          ].map((tier, index) => (
            <div 
              key={index} 
              className={`glass-panel p-8 flex flex-col justify-between relative ${tier.recommended ? 'border-blue-600 dark:border-blue-500 border-2 shadow-xl shadow-blue-500/5' : ''}`}
            >
              {tier.recommended && (
                <span className="absolute top-0 right-6 -translate-y-1/2 bg-blue-600 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full">
                  Recommended
                </span>
              )}
              
              <div>
                <h3 className="text-lg font-bold font-display">{tier.plan}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-2">{tier.desc}</p>
                <div className="my-6">
                  <span className="text-3xl font-black">{tier.price}</span>
                  {tier.price !== "Custom Pricing" && <span className="text-slate-400 text-xs font-semibold"> / month</span>}
                </div>
                
                <hr className="border-slate-200/40 dark:border-slate-800/40 mb-6" />
                
                <ul className="space-y-3">
                  {tier.features.map((feat, fidx) => (
                    <li key={fidx} className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <Link href="/register">
                  <button className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${tier.recommended ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/10' : 'border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}>
                    Choose {tier.plan}
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-slate-100/50 dark:bg-slate-950/20 border-y border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-black">Frequently Asked Questions</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-3">Clear up details about calculations and notification setups.</p>
          </div>

          <div className="space-y-6">
            {[
              { q: "How does the reminder cycle calculation work?", a: "The system monitors customer purchases. Based on the selected cycle (Weekly, Monthly, Custom) and category consumption settings (e.g. 1.2x demand multiplier for chemicals), it estimates the depletion date. Once that date is reached, a reminder logs." },
              { q: "Are notification previews interactive?", a: "Yes. From the reminders panel, coordinators can open direct preview windows showing SMS, Email, and WhatsApp templates with fields (customer name, category, product, price) pre-filled. They can trigger a simulated dispatch, logging the send in history." },
              { q: "What database does this SaaS use?", a: "For developer convenience, it runs a dual-mode database driver. Locally, it boots an SQLite database automatically. For enterprise deployment (Vercel/Render), it seamlessly switches to a PostgreSQL pool using the connection string." },
              { q: "Can we manage roles and system permissions?", a: "Yes. The Admin panel enables managing users, deactivating accounts, editing notification templates, adjusting threshold rules, and viewing complete system audit logs." }
            ].map((faq, index) => (
              <div key={index} className="glass-panel p-6">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  {faq.q}
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-2.5 leading-relaxed pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Panel */}
      <section id="contact" className="py-24 max-w-4xl mx-auto px-6">
        <div className="glass-panel p-10 flex flex-col md:flex-row gap-10 items-center">
          <div className="flex-1 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-display font-black">Get in Touch with B2B Sales</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Have questions about integrating the Repeat Order Reminder System with your active warehouse tools? Write to us and a regional coordinator will get back to you.
            </p>
            <div className="space-y-2 text-xs font-semibold">
              <p className="flex items-center gap-2">📍 Hyderabad Office: Jeedimetla Industrial Area, Telangana</p>
              <p className="flex items-center gap-2">✉️ support@gangamaxx.in</p>
            </div>
          </div>
          
          <div className="flex-1 w-full space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Company Email</label>
              <input type="email" placeholder="you@company.com" className="w-full glass-input p-3 rounded-xl text-xs focus:ring-2" />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Message Detail</label>
              <textarea rows={3} placeholder="Tell us about your facility counts..." className="w-full glass-input p-3 rounded-xl text-xs" />
            </div>
            <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 transition-colors">
              Send Message
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-panel rounded-t-3xl border-t border-slate-200/40 dark:border-slate-800/40 py-12 px-6 mt-12 bg-slate-100/60 dark:bg-slate-950/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">G</div>
            <span className="font-display font-extrabold text-xs uppercase tracking-wider">Ganga Maxx B2B</span>
          </div>
          <p className="text-slate-400 text-[10px]">© 2026 Ganga Maxx Marketplace. Strictly Confidential Logistics System.</p>
          <div className="flex gap-4 text-xs font-semibold text-slate-400">
            <a href="#" className="hover:text-blue-500">Privacy Policy</a>
            <a href="#" className="hover:text-blue-500">Terms of Use</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
