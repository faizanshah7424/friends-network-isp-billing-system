'use client';

import React, { useState, useMemo } from 'react';
import { Customer, Invoice, Payment, Complaint } from '@/types';
import { useBillingSystem } from '@/lib/context';
import StatusBadge from '@/components/StatusBadge';
import {
  X,
  Phone,
  MessageCircle,
  MapPin,
  Wifi,
  Zap,
  Receipt,
  CreditCard,
  AlertCircle,
  ExternalLink,
  UserCheck,
  UserX,
  Calendar,
  DollarSign,
  Cpu,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface CustomerQuickModalProps {
  customer: Customer | null;
  onClose: () => void;
}

export default function CustomerQuickModal({ customer, onClose }: CustomerQuickModalProps) {
  const { invoices, payments, complaints, openRecharge, suspendCustomer, activateCustomer } = useBillingSystem();
  const [activeTab, setActiveTab] = useState<'details' | 'invoices' | 'payments' | 'complaints'>('details');

  const customerInvoices = useMemo(() => {
    if (!customer) return [];
    return invoices.filter(
      (inv) => inv.customerId === customer.id || inv.customerId === customer.customerId
    );
  }, [invoices, customer]);

  const customerPayments = useMemo(() => {
    if (!customer) return [];
    return payments.filter(
      (pay) => pay.customerId === customer.id || pay.customerId === customer.customerId
    );
  }, [payments, customer]);

  const customerComplaints = useMemo(() => {
    if (!customer) return [];
    return complaints.filter(
      (comp) => comp.customerId === customer.id || comp.customerId === customer.customerId
    );
  }, [complaints, customer]);

  if (!customer) return null;

  const cleanPhone = customer.phone.replace(/[^0-9+]/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone.replace(/^0/, '92')}`;
  const telUrl = `tel:${cleanPhone}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="relative w-full max-w-3xl rounded-3xl border border-border bg-card p-6 shadow-2xl z-10 text-left space-y-5 my-auto max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b border-border pb-4 flex-shrink-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg border border-primary/20">
                  {customer.customerId || customer.id}
                </span>
                <StatusBadge status={customer.connectionStatus} />
                <StatusBadge status={customer.paymentStatus} />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">{customer.name}</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Action Buttons Header Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-shrink-0">
            <a
              href={telUrl}
              className="h-9 px-3.5 rounded-xl border border-border bg-card hover:bg-secondary text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Phone className="h-3.5 w-3.5 text-primary" />
              <span>Call</span>
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </a>
            <button
              onClick={() => {
                openRecharge(customer.id);
                onClose();
              }}
              className="h-9 px-3.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Recharge</span>
            </button>
            {customer.connectionStatus === 'Active' ? (
              <button
                onClick={() => {
                  suspendCustomer(customer.id);
                }}
                className="h-9 px-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
              >
                <UserX className="h-3.5 w-3.5" />
                <span>Suspend</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  activateCustomer(customer.id);
                }}
                className="h-9 px-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Activate</span>
              </button>
            )}
            <Link
              href={`/customers/${customer.id}`}
              onClick={onClose}
              className="h-9 px-3.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-1.5 hover:bg-primary/90 transition-colors whitespace-nowrap ml-auto"
            >
              <span>Full Profile</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-border bg-secondary/30 p-1 rounded-xl flex-shrink-0">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-1.5 text-center text-xs font-bold transition-all rounded-lg cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Customer Details
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex-1 py-1.5 text-center text-xs font-bold transition-all rounded-lg cursor-pointer ${
                activeTab === 'invoices'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Invoices ({customerInvoices.length})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex-1 py-1.5 text-center text-xs font-bold transition-all rounded-lg cursor-pointer ${
                activeTab === 'payments'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Payments ({customerPayments.length})
            </button>
            <button
              onClick={() => setActiveTab('complaints')}
              className={`flex-1 py-1.5 text-center text-xs font-bold transition-all rounded-lg cursor-pointer ${
                activeTab === 'complaints'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Complaints ({customerComplaints.length})
            </button>
          </div>

          {/* Tab Content (Scrollable area) */}
          <div className="overflow-y-auto pr-1 flex-1 space-y-4 min-h-[260px]">
            {activeTab === 'details' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3 bg-secondary/20 p-4 rounded-2xl border border-border/60">
                  <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Subscriber Info</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mobile:</span>
                      <span className="font-bold text-foreground font-mono">{customer.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">WhatsApp:</span>
                      <span className="font-semibold text-foreground font-mono">{customer.whatsapp || customer.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Area / Hub:</span>
                      <span className="font-semibold text-foreground">{customer.area}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Address:</span>
                      <span className="font-medium text-foreground text-[11px] block leading-normal">{customer.address}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 bg-secondary/20 p-4 rounded-2xl border border-border/60">
                  <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Package &amp; Hardware</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Package:</span>
                      <span className="font-bold text-primary">{customer.packageName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly Charges:</span>
                      <span className="font-bold text-foreground">PKR {customer.monthlyCharges.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Outstanding Balance:</span>
                      <span className={`font-black ${customer.outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        PKR {customer.outstandingBalance.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Activation Date:</span>
                      <span className="font-semibold text-foreground">{customer.connectionDate}</span>
                    </div>
                    {customer.routerMac && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Router MAC:</span>
                        <span className="font-mono text-[11px] text-foreground">{customer.routerMac}</span>
                      </div>
                    )}
                    {customer.onuNumber && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ONU Serial:</span>
                        <span className="font-mono text-[11px] text-foreground">{customer.onuNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'invoices' && (
              <div className="space-y-2">
                {customerInvoices.length > 0 ? (
                  customerInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-3.5 bg-card border border-border rounded-xl text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-indigo-500">{inv.id}</span>
                        <p className="font-medium text-muted-foreground text-[11px]">{inv.billingMonth} • Due: {inv.dueDate}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <span className="font-bold text-foreground block">PKR {inv.grandTotal.toLocaleString()}</span>
                        <StatusBadge status={inv.paymentStatus} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No billing invoices recorded for this customer.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-2">
                {customerPayments.length > 0 ? (
                  customerPayments.map((pay) => (
                    <div
                      key={pay.id}
                      className="flex items-center justify-between p-3.5 bg-card border border-border rounded-xl text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-emerald-600">{pay.id}</span>
                        <p className="font-medium text-muted-foreground text-[11px]">{pay.paymentDate} • via {pay.paymentMethod}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-emerald-600 text-sm">PKR {pay.amountReceived.toLocaleString()}</span>
                        <span className="text-[10px] text-muted-foreground block">Received by {pay.receivedBy}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No payment receipts recorded for this customer.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'complaints' && (
              <div className="space-y-2">
                {customerComplaints.length > 0 ? (
                  customerComplaints.map((comp) => (
                    <div
                      key={comp.id}
                      className="p-3.5 bg-card border border-border rounded-xl text-xs space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-mono font-bold text-indigo-500">{comp.ticketNumber}</span>
                        <div className="flex gap-1.5">
                          <StatusBadge status={comp.priority} />
                          <StatusBadge status={comp.status} />
                        </div>
                      </div>
                      <p className="font-medium text-foreground">{comp.issue}</p>
                      <div className="flex justify-between text-[10px] text-muted-foreground border-t border-border/50 pt-1.5">
                        <span>Created: {comp.dateCreated}</span>
                        <span>Engineer: {comp.assignedEngineer}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No support complaints filed for this customer.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
