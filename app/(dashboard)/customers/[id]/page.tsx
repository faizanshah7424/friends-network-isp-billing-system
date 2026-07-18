'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBillingSystem } from '@/lib/context';
import StatusBadge from '@/components/StatusBadge';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Layers,
  Network,
  Activity,
  FileText,
  MessageSquare,
  Plus,
  ArrowLeft,
  DollarSign,
  Cpu,
  UserCheck,
  UserX,
  PlusCircle,
  Receipt,
  FileCode,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function CustomerDetailsPage() {
  const router = useRouter();
  const { id } = useParams();
  const {
    customers,
    invoices,
    payments,
    addCustomerNote,
    suspendCustomer,
    activateCustomer,
    openRecharge,
    currentUser,
    packages,
  } = useBillingSystem();

  const [activeTab, setActiveTab] = useState<'overview' | 'billing' | 'notes'>('overview');
  const [newNote, setNewNote] = useState('');

  // Find customer
  const customer = useMemo(() => {
    return customers.find((c) => c.id === id);
  }, [customers, id]);

  // Find customer's package details
  const customerPkg = useMemo(() => {
    if (!customer) return null;
    return packages.find((p) => p.id === customer.packageId || p.name === customer.packageName) || null;
  }, [packages, customer]);

  // Find related invoices
  const customerInvoices = useMemo(() => {
    return invoices.filter((inv) => inv.customerId === id);
  }, [invoices, id]);

  // Find related payments
  const customerPayments = useMemo(() => {
    return payments.filter((p) => p.customerId === id);
  }, [payments, id]);

  // Next Expiry calculation (30 days from installation date)
  const nextExpiryDate = useMemo(() => {
    if (!customer?.connectionDate) return 'N/A';
    try {
      const conn = new Date(customer.connectionDate);
      conn.setDate(conn.getDate() + 30);
      return conn.toISOString().split('T')[0];
    } catch {
      return 'N/A';
    }
  }, [customer?.connectionDate]);

  if (!customer) {
    return (
      <div className="text-center py-16 bg-card border border-border rounded-2xl">
        <h2 className="text-xl font-bold">Customer Not Found</h2>
        <p className="text-sm text-muted-foreground mt-2">
          The customer record with ID &ldquo;{id}&rdquo; does not exist or has been deleted.
        </p>
        <Link href="/customers" className="mt-4 text-xs font-semibold text-primary hover:underline inline-block">
          Return to directory
        </Link>
      </div>
    );
  }

  // Enforce Sub Admin payment recovery restriction
  if (currentUser.role === 'Sub Admin' && customer.paymentStatus === 'Paid') {
    return (
      <div className="text-center py-16 bg-card border border-border rounded-2xl space-y-4">
        <h2 className="text-xl font-bold text-rose-500">Access Denied</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          As a Sub Administrator, you only have access to unpaid customer profiles for recovery. This customer is fully paid.
        </p>
        <Link href="/customers" className="mt-4 text-xs font-semibold text-primary hover:underline inline-block">
          Return to directory
        </Link>
      </div>
    );
  }

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNote.trim() === '') return;
    addCustomerNote(customer.id, newNote);
    setNewNote('');
  };

  return (
    <div className="space-y-6">
      {/* Header and Back navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/customers"
            className="rounded-xl border border-border bg-card p-2 text-muted-foreground hover:text-foreground transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{customer.name}</h1>
            <p className="text-slate-600 dark:text-slate-300 font-medium text-sm mt-1">
              Customer Account: <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">{customer.customerId || customer.id}</span>
            </p>
          </div>
        </div>

        {/* Action Toggles */}
        <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
          {customer.connectionStatus === 'Active' ? (
            <button
              onClick={() => suspendCustomer(customer.id)}
              className="flex items-center justify-center gap-1.5 h-9 rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all"
            >
              <UserX className="h-4 w-4" />
              <span>Suspend</span>
            </button>
          ) : (
            <button
              onClick={() => activateCustomer(customer.id)}
              className="flex items-center justify-center gap-1.5 h-9 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-all"
            >
              <UserCheck className="h-4 w-4" />
              <span>Activate</span>
            </button>
          )}

          <button
            onClick={() => openRecharge(customer.id)}
            className="flex items-center justify-center gap-1.5 h-9 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/95 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Recharge &amp; Update Bill</span>
          </button>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Profile Card */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              {/* Photo Avatar */}
              <div className="h-20 w-20 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                <User className="h-10 w-10" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">{customer.name}</h3>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold font-mono">ID: {customer.customerId || customer.id}</span>
              </div>
              <div className="flex gap-2">
                <StatusBadge status={customer.connectionStatus} />
                <StatusBadge status={customer.paymentStatus} />
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 border-y border-border py-4 text-center">
              <div>
                <span className="text-[9px] text-muted-foreground font-bold uppercase">Outstanding</span>
                <p className="text-sm font-black text-rose-500 mt-0.5">PKR {customer.outstandingBalance}</p>
              </div>
              <div className="border-l border-border">
                <span className="text-[9px] text-muted-foreground font-bold uppercase">Monthly Bill</span>
                <p className="text-sm font-black text-indigo-500 mt-0.5">PKR {customer.monthlyCharges}</p>
              </div>
              <div className="border-l border-border">
                <span className="text-[9px] text-muted-foreground font-bold uppercase">Installation</span>
                <p className="text-sm font-black text-slate-700 dark:text-slate-350 mt-0.5">PKR {customer.installationCharges || 0}</p>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <span className="text-muted-foreground block text-[10px] font-semibold">Mobile Number</span>
                  <span className="font-medium text-foreground">{customer.phone}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="h-4 w-4 text-emerald-500 flex-shrink-0 font-bold">W</span>
                <div>
                  <span className="text-muted-foreground block text-[10px] font-semibold">WhatsApp</span>
                  <span className="font-medium text-foreground">{customer.whatsapp || 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted-foreground block text-[10px] font-semibold">Installation Area</span>
                  <span className="font-medium text-foreground leading-normal">{customer.area}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted-foreground block text-[10px] font-semibold">Installation Address</span>
                  <span className="font-medium text-foreground leading-normal">{customer.address}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Network details card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-sm flex items-center gap-2">
              <Cpu className="h-4.5 w-4.5 text-primary" />
              <span>Provisioning &amp; Hardware</span>
            </h4>
            <div className="space-y-3 text-xs border-t border-border pt-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Plan</span>
                <span className="font-semibold text-foreground text-right max-w-[150px] truncate">{customer.packageName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Package Category</span>
                <span className="font-semibold text-foreground">{customerPkg ? customerPkg.category : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Internet Speed</span>
                <span className="font-semibold text-foreground">{customerPkg ? customerPkg.speed : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Charges</span>
                <span className="font-semibold text-foreground">PKR {customer.monthlyCharges}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Installation Charges</span>
                <span className="font-semibold text-foreground">PKR {customer.installationCharges || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ONT Serial</span>
                <span className="font-mono font-semibold text-foreground">{customer.onuNumber || 'Not Configured'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Router MAC</span>
                <span className="font-mono font-semibold text-foreground">{customer.routerMac || 'Not Configured'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Installation Date</span>
                <span className="font-semibold text-foreground">{customer.connectionDate}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-3">
                <span className="text-emerald-600 font-bold">Next Expiry Date</span>
                <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg text-[10px]">{nextExpiryDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Tabs (Timeline, Notes, Invoices) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Navigation Tabs */}
          <div className="flex border-b border-border bg-card p-1 rounded-xl shadow-sm">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'overview'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Overview &amp; Log</span>
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'billing'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Invoices ({customerInvoices.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'notes'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Client Notes ({customer.notes.length})</span>
            </button>
          </div>

          {/* Tab Content Canvas */}
          <div className="min-h-[400px]">
            {activeTab === 'overview' && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="font-bold text-base">Account Timeline</h3>
                  <p className="text-xs text-muted-foreground">Historical records of line configuration, billing status and restorations</p>
                </div>

                <div className="relative border-l border-border pl-6 space-y-6 ml-2 pt-2">
                  {customer.timeline.map((event) => (
                    <div key={event.id} className="relative">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[31px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 border-card ${
                        event.type === 'success' ? 'bg-emerald-500' :
                        event.type === 'error' ? 'bg-rose-500' :
                        event.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                      
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-foreground">{event.title}</h4>
                          <span className="text-[10px] text-muted-foreground font-medium">{event.date}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-normal">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-6">
                {/* Invoices List */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-base">Generated Invoices</h3>
                    <p className="text-xs text-muted-foreground">Invoiced billing history for the client</p>
                  </div>
                  
                  {customerInvoices.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-border bg-secondary/10 text-muted-foreground uppercase font-semibold">
                            <th className="p-3">Invoice ID</th>
                            <th className="p-3">Billing Month</th>
                            <th className="p-3">Generated Date</th>
                            <th className="p-3 text-right">Grand Total</th>
                            <th className="p-3">Payment Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {customerInvoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-secondary/20">
                              <td className="p-3 font-semibold text-indigo-500">{inv.id}</td>
                              <td className="p-3 font-medium">{inv.billingMonth}</td>
                              <td className="p-3 text-muted-foreground">{inv.billingDate}</td>
                              <td className="p-3 text-right font-bold text-foreground">PKR {inv.grandTotal}</td>
                              <td className="p-3">
                                <StatusBadge status={inv.paymentStatus} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No invoices have been generated for this customer.
                    </div>
                  )}
                </div>

                {/* Payments List */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-base">Payment Receipts</h3>
                    <p className="text-xs text-muted-foreground">History of payments cleared by the customer</p>
                  </div>

                  {customerPayments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-border bg-secondary/10 text-muted-foreground uppercase font-semibold">
                            <th className="p-3">Receipt ID</th>
                            <th className="p-3">Cleared Date</th>
                            <th className="p-3">Method</th>
                            <th className="p-3">Reference No.</th>
                            <th className="p-3 text-right">Amount Paid</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {customerPayments.map((p) => (
                            <tr key={p.id} className="hover:bg-secondary/20">
                              <td className="p-3 font-semibold text-emerald-600">{p.id}</td>
                              <td className="p-3 text-muted-foreground">{p.paymentDate}</td>
                              <td className="p-3 font-medium">{p.paymentMethod}</td>
                              <td className="p-3 font-mono">{p.referenceNumber || 'N/A'}</td>
                              <td className="p-3 text-right font-bold text-emerald-500">PKR {p.amountReceived}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No payments have been received for this customer.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="font-bold text-base">Administrative Notes</h3>
                  <p className="text-xs text-muted-foreground">Internal records and instructions regarding support or custom contracts</p>
                </div>

                {/* Add note Form */}
                <form onSubmit={handleAddNote} className="space-y-3">
                  <textarea
                    rows={3}
                    placeholder="Write a new internal staff note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="w-full rounded-xl border border-border p-3 text-xs outline-none bg-secondary/20 transition-all focus:border-primary focus:bg-card"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 transition-all"
                    >
                      <Plus className="h-4.5 w-4.5" />
                      <span>Post Note</span>
                    </button>
                  </div>
                </form>

                {/* Notes List */}
                <div className="space-y-3.5 border-t border-border pt-4 mt-2">
                  {customer.notes.length > 0 ? (
                    customer.notes.map((note) => (
                      <div key={note.id} className="rounded-xl border border-border p-3.5 bg-secondary/10 space-y-1.5">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-foreground">{note.author}</span>
                          <span className="text-muted-foreground">{note.date}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-normal">{note.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No staff notes recorded. Use the form above to add a note.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
