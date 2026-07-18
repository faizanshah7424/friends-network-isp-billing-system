'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBillingSystem } from '@/lib/context';
import { Payment } from '@/types';
import {
  CreditCard,
  Search,
  DollarSign,
  Calendar,
  Layers,
  ArrowRight,
  TrendingDown,
  Printer,
  Download,
  CheckCircle,
  FileCode,
  Network,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import LogoLoader from '@/components/ui/LogoLoader';
import StatusBadge from '@/components/StatusBadge';

export default function PaymentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetCustomerId = searchParams.get('customerId');

  const { customers, addPayment, settings, payments, invoices, currentUser } = useBillingSystem();
  const isSubAdmin = currentUser.role === 'Sub Admin';

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [billingMonth, setBillingMonth] = useState('July 2026');
  const [amountReceived, setAmountReceived] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank' | 'JazzCash' | 'EasyPaisa'>('Cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentType, setPaymentType] = useState<'package' | 'custom'>('package');
  const [customReason, setCustomReason] = useState<'Partial Payment' | 'Advance Payment' | 'Previous Due Adjustment' | 'Manual Adjustment' | 'Discount' | 'Other'>('Partial Payment');

  // Smart Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Receipt Modal State
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [recentReceipt, setRecentReceipt] = useState<Payment | null>(null);

  // Submitting / Printing States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Set default payment date to current date/time on mount
  useEffect(() => {
    const now = new Date();
    setPaymentDate(now.toISOString().split('T')[0]);
  }, []);

  // Pre-select if redirected with customer ID
  useEffect(() => {
    if (targetCustomerId) {
      const exists = customers.some((c) => c.id === targetCustomerId);
      if (exists) {
        setSelectedCustomerId(targetCustomerId);
        const cust = customers.find((c) => c.id === targetCustomerId);
        if (cust) {
          setSearchQuery(`${cust.name} (${cust.id})`);
        }
      }
    }
  }, [targetCustomerId, customers]);

  // Click outside to close search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered search results
  const searchResults = useMemo(() => {
    if (searchQuery.trim() === '') return [];
    const term = searchQuery.toLowerCase();
    let list = [...customers];
    if (isSubAdmin) {
      list = list.filter((c) => c.outstandingBalance > 0 || c.paymentStatus === 'Unpaid' || c.paymentStatus === 'Pending');
    }
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.id.toLowerCase().includes(term) ||
        c.phone.includes(term)
    );
  }, [customers, searchQuery, isSubAdmin]);

  // Selected customer details
  const currentCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  // Receipt customer details
  const receiptCustomer = useMemo(() => {
    if (!recentReceipt) return null;
    return customers.find((c) => c.id === recentReceipt.customerId);
  }, [customers, recentReceipt]);

  // Receipt invoice details
  const receiptInvoice = useMemo(() => {
    if (!recentReceipt) return null;
    return invoices.find(
      (inv) =>
        inv.customerId === recentReceipt.customerId &&
        inv.billingMonth === recentReceipt.billingMonth
    );
  }, [invoices, recentReceipt]);

  const getNextExpiryDate = (connectionDate?: string) => {
    if (!connectionDate) return 'N/A';
    try {
      const conn = new Date(connectionDate);
      conn.setDate(conn.getDate() + 30);
      return conn.toISOString().split('T')[0];
    } catch {
      return 'N/A';
    }
  };

  // Auto-populate outstanding balance to amount received
  useEffect(() => {
    if (currentCustomer) {
      setAmountReceived(currentCustomer.outstandingBalance);
    }
  }, [currentCustomer]);

  const handleCollectPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || amountReceived <= 0) return;

    setIsSubmitting(true);

    const paymentData = {
      customerId: selectedCustomerId,
      customerName: currentCustomer ? currentCustomer.name : 'Unknown Customer',
      amountReceived,
      paymentMethod,
      referenceNumber: referenceNumber || undefined,
      paymentDate: `${paymentDate} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      billingMonth,
      notes: notes || undefined,
      paymentType,
      customReason: paymentType === 'custom' ? customReason : undefined,
      packagePrice: currentCustomer ? currentCustomer.monthlyCharges : undefined,
    };

    setTimeout(() => {
      const { payment } = addPayment(paymentData);
      setRecentReceipt(payment);
      setShowReceiptModal(true);

      // Reset Form
      setReferenceNumber('');
      setNotes('');
      setPaymentType('package');
      setCustomReason('Partial Payment');
      setIsSubmitting(false);
    }, 1200);
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 1000);
  };

  const handleDownloadFakePDF = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {isSubmitting && (
        <LogoLoader
          overlay
          text="Recording Payment..."
          subtext="Friends Network ISP Billing System"
          loadingText="Posting credit adjustments to customer ledger..."
        />
      )}
      {isPrinting && (
        <LogoLoader
          overlay
          text="Generating PDF Receipt..."
          subtext="Friends Network ISP Billing System"
          loadingText="Preparing print layouts and page margins..."
        />
      )}
      <div className="space-y-6 print:hidden">
        {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Record Payment</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Record digital cash receipts from EasyPaisa, JazzCash, Bank Transfers, or physical cash collections.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Form panel */}
        <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-border pb-3 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-base">Record Payment Form</h3>
          </div>

          <form onSubmit={handleCollectPayment} className="space-y-5">
            {/* Customer Smart Search */}
            <div ref={searchRef} className="space-y-1.5 relative">
              <label className="text-xs font-semibold text-muted-foreground">Select Customer *</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search customer by ID, Name, or Mobile..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedCustomerId('');
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  required
                  className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
                />
                {selectedCustomerId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomerId('');
                      setSearchQuery('');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              {showSearchDropdown && searchResults.length > 0 && (
                <div className="absolute top-16 z-50 w-full rounded-xl border border-border bg-card p-2 shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCustomerId(c.id);
                        setSearchQuery(`${c.name} (${c.id})`);
                        setShowSearchDropdown(false);
                      }}
                      className="flex w-full items-center justify-between rounded-lg p-2 text-left hover:bg-secondary transition-colors"
                    >
                      <div>
                        <p className="text-xs font-semibold text-foreground">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground">{c.id} • {c.phone} • Bal: PKR {c.outstandingBalance}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        c.connectionStatus === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}>
                        {c.connectionStatus}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {showSearchDropdown && searchQuery.trim() !== '' && searchResults.length === 0 && (
                <div className="absolute top-16 z-50 w-full rounded-xl border border-border bg-card p-4 text-center shadow-lg">
                  <p className="text-xs text-muted-foreground">No customers found matching &ldquo;{searchQuery}&rdquo;</p>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Current Due indicator */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Current Due Balance</label>
                <div className="h-10 w-full rounded-xl border border-border bg-secondary/20 px-3.5 text-xs flex items-center font-bold text-rose-500">
                  PKR {currentCustomer ? currentCustomer.outstandingBalance : 0}
                </div>
              </div>

              {/* Billing Month */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Bill Month *</label>
                <select
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value)}
                  required
                  className="h-10 w-full rounded-xl border border-border bg-card px-3.5 text-xs text-foreground outline-none transition-all focus:border-primary"
                >
                  <option value="July 2026">July 2026</option>
                  <option value="June 2026">June 2026</option>
                  <option value="May 2026">May 2026</option>
                </select>
              </div>

              {/* Payment Type Toggle */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground">Payment Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentType('package');
                      if (currentCustomer) {
                        setAmountReceived(currentCustomer.outstandingBalance > 0 ? currentCustomer.outstandingBalance : currentCustomer.monthlyCharges);
                      }
                    }}
                    className={`h-10 rounded-xl border text-xs font-semibold transition-all ${
                      paymentType === 'package'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:bg-secondary/30'
                    }`}
                  >
                    Package Amount
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('custom')}
                    className={`h-10 rounded-xl border text-xs font-semibold transition-all ${
                      paymentType === 'custom'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:bg-secondary/30'
                    }`}
                  >
                    Custom Amount
                  </button>
                </div>
              </div>

              {/* Amount Received or Custom Amount */}
              {paymentType === 'package' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Package Rate / Outstanding Balance (PKR) *</label>
                  <input
                    type="number"
                    disabled
                    value={amountReceived || 0}
                    className="h-10 w-full rounded-xl border border-border bg-slate-100 dark:bg-secondary/10 px-3.5 text-xs outline-none cursor-not-allowed font-semibold text-slate-600"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Custom Amount Received (PKR) *</label>
                  <input
                    type="number"
                    required
                    value={amountReceived || ''}
                    onChange={(e) => setAmountReceived(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="e.g. 1500"
                    className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
                  />
                </div>
              )}

              {/* Custom Reason (only when Custom Payment is selected) */}
              {paymentType === 'custom' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Custom Reason *</label>
                  <select
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value as any)}
                    required
                    className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
                  >
                    <option value="Partial Payment">Partial Payment</option>
                    <option value="Advance Payment">Advance Payment</option>
                    <option value="Previous Due Adjustment">Previous Due Adjustment</option>
                    <option value="Manual Adjustment">Manual Adjustment</option>
                    <option value="Discount">Discount</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5" />
              )}

              {/* Payment Method */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  required
                  className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank Transfer</option>
                  <option value="JazzCash">JazzCash</option>
                  <option value="EasyPaisa">EasyPaisa</option>
                </select>
              </div>

              {/* Reference Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Reference / Transaction ID {paymentMethod !== 'Cash' && '*'}
                </label>
                <input
                  type="text"
                  required={paymentMethod !== 'Cash'}
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. TRX-9988221"
                  className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
                />
              </div>

              {/* Payment Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Payment Date *</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-card px-3.5 text-xs text-foreground outline-none transition-all focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Payment Remarks / Staff Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Received by rider Sohail, late fee waive request accepted"
                className="w-full rounded-xl border border-border p-3 text-xs outline-none bg-card text-foreground transition-all focus:border-primary"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={!selectedCustomerId || amountReceived <= 0}
                className="flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-6 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 disabled:opacity-50 transition-all"
              >
                <span>Record Payment &amp; Print Receipt</span>
              </button>
            </div>
          </form>
        </div>

        {/* History Ledger (Super Admin) or Pending Collections Ledger (Sub Admin) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 text-left">
          {isSubAdmin ? (
            <>
              <div>
                <h3 className="font-bold text-base">Pending Collections Ledger</h3>
                <p className="text-xs text-muted-foreground">Select customer with unpaid dues to clear balance</p>
              </div>

              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {customers
                  .filter((c) => c.outstandingBalance > 0 || c.paymentStatus === 'Unpaid' || c.paymentStatus === 'Pending')
                  .map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedCustomerId(c.id);
                        setSearchQuery(`${c.name} (${c.id})`);
                      }}
                      className="p-3.5 rounded-xl border border-border bg-rose-500/[0.02] hover:bg-secondary/40 cursor-pointer transition-colors space-y-2.5"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-bold text-slate-800 hover:underline">{c.name}</span>
                          <span className="text-[10px] text-indigo-500 font-mono block mt-0.5">{c.id} • {c.phone}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-rose-500">PKR {c.outstandingBalance}</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">Due: July 10, 2026</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-border/40 pt-2">
                        <span className="truncate max-w-[120px]">Plan: {c.packageName}</span>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <StatusBadge status={c.connectionStatus} />
                          <StatusBadge status={c.paymentStatus} />
                        </div>
                      </div>
                    </div>
                  ))}
                {customers.filter((c) => c.outstandingBalance > 0 || c.paymentStatus === 'Unpaid' || c.paymentStatus === 'Pending').length === 0 && (
                  <div className="text-center p-8 text-xs text-muted-foreground">
                    All customer accounts are fully cleared! No pending collections.
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="font-bold text-base">Recent Payments Log</h3>
                <p className="text-xs text-muted-foreground">Last recorded receipts at the billing desk</p>
              </div>

              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {payments.map((p) => (
                  <div key={p.id} className="flex justify-between items-center p-3.5 rounded-xl border border-border hover:bg-secondary/40 transition-colors">
                    <div>
                      <span className="text-xs font-bold text-foreground block">
                        {p.customerName}
                      </span>
                      <div className="text-[10px] text-muted-foreground mt-0.5 block font-mono">
                        <Link href={`/customers/${p.customerId}`} className="text-indigo-500 hover:underline font-semibold">
                          {p.customerId}
                        </Link>{' '}
                        • {p.paymentMethod} • {p.paymentDate.split(' ')[0]}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-500">PKR {p.amountReceived}</span>
                      <button
                        onClick={() => {
                          setRecentReceipt(p);
                          setShowReceiptModal(true);
                        }}
                        className="text-[10px] text-primary font-bold hover:underline block mt-1"
                      >
                        Print PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      </div>

      {/* Printable Receipt Modal */}
      <AnimatePresence>
        {showReceiptModal && recentReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center print:static print:h-auto print:w-auto">
            {/* Backdrop (hidden on print) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReceiptModal(false)}
              className="absolute inset-0 bg-black print:hidden"
            />

            {/* Receipt Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl z-10 space-y-6 print:border-none print:shadow-none print:bg-white print:p-0 print:m-0"
            >
              {/* Close icon (hidden on print) */}
              <button
                onClick={() => setShowReceiptModal(false)}
                className="absolute top-4 right-4 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors print:hidden"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Printable Area Wrapper */}
              <div className="space-y-6 text-xs text-foreground bg-card p-4 rounded-xl border border-border print:border-none print:bg-white print:p-0">
                {/* Receipt Header */}
                <div className="flex justify-between items-start border-b border-border pb-4">
                  <div className="flex items-center gap-2.5">
                    <img src="/friends-logo.png" alt="Friends Network Logo" className="h-8 w-8 object-contain" />
                    <div className="text-left">
                      <p className="font-bold text-sm leading-none">{settings.companyName}</p>
                      <p className="text-[9px] text-slate-400 font-semibold mt-1">Internet Service Provider</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm tracking-tight text-emerald-500">PAYMENT RECEIPT</p>
                    <p className="text-[9px] text-muted-foreground mt-1">Receipt No: <span className="font-bold font-mono">{recentReceipt.id}</span></p>
                  </div>
                </div>

                {/* Metadata details */}
                <div className="grid grid-cols-2 gap-4 border-b border-border pb-4 text-[10px]">
                  <div>
                    <span className="text-muted-foreground font-semibold uppercase text-[8px] block">Received From</span>
                    <p className="font-bold mt-1 text-sm">{recentReceipt.customerName}</p>
                    <p className="text-muted-foreground mt-0.5">Customer ID: <span className="font-semibold text-foreground">{recentReceipt.customerId}</span></p>
                    <p className="text-muted-foreground mt-0.5">Package: <span className="font-semibold text-foreground">{receiptCustomer?.packageName || 'N/A'}</span></p>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground font-semibold uppercase text-[8px] block">Receipt Info</span>
                    <p className="text-muted-foreground mt-0.5">Payment Date: <span className="font-semibold text-foreground">{recentReceipt.paymentDate}</span></p>
                    <p className="text-muted-foreground mt-0.5">Expiry Date: <span className="font-semibold text-foreground">{getNextExpiryDate(receiptCustomer?.connectionDate)}</span></p>
                    <p className="text-muted-foreground mt-0.5">Billing Month: <span className="font-semibold text-foreground">{recentReceipt.billingMonth}</span></p>
                  </div>
                </div>

                               {/* Ledger Details Table */}
                <div className="space-y-2 border-b border-border pb-4 text-[10px]">
                  <div className="flex justify-between font-semibold text-muted-foreground uppercase text-[8px]">
                    <span>Description</span>
                    <span>Amount</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Plan (Package Price)</span>
                    <span>PKR {recentReceipt.packagePrice !== undefined ? recentReceipt.packagePrice : (receiptCustomer ? receiptCustomer.monthlyCharges : 0)}</span>
                  </div>
                  {recentReceipt.paymentType === 'custom' ? (
                    <>
                      <div className="flex justify-between text-indigo-600 font-semibold">
                        <span className="text-muted-foreground">Custom Payment</span>
                        <span>PKR {recentReceipt.amountReceived}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span className="text-muted-foreground">Reason</span>
                        <span className="font-semibold">{recentReceipt.customReason || 'Other'}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Previous Arrears Due</span>
                        <span>PKR {receiptInvoice ? receiptInvoice.previousDue : 0}</span>
                      </div>
                      <div className="flex justify-between text-rose-500/90">
                        <span className="text-muted-foreground">Additional Surcharges</span>
                        <span>PKR {receiptInvoice ? receiptInvoice.additionalCharges : 0}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600">
                        <span className="text-muted-foreground">Promotional Discount</span>
                        <span>-PKR {receiptInvoice ? receiptInvoice.discount : 0}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between border-t border-border pt-1.5 font-bold text-foreground">
                    <span>Grand Total Due</span>
                    <span>PKR {recentReceipt.paymentType === 'custom' ? recentReceipt.amountReceived : (receiptInvoice ? receiptInvoice.grandTotal : (receiptCustomer ? receiptCustomer.monthlyCharges : 0))}</span>
                  </div>
                </div>

                {/* Amount segment */}
                <div className="bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <span className="text-[8px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Total Net Amount Cleared</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Remaining Balance: PKR {receiptCustomer ? receiptCustomer.outstandingBalance : 0}</p>
                  </div>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">PKR {recentReceipt.amountReceived}</span>
                </div>

                {/* Signatures Area */}
                <div className="grid grid-cols-2 gap-8 pt-8 text-[9px]">
                  <div className="border-t border-border pt-2 text-center text-muted-foreground font-medium">
                    Customer Signature
                  </div>
                  <div className="border-t border-border pt-2 text-center text-muted-foreground font-medium">
                    Authorized Agent Signature
                    <span className="block text-[8px] text-muted-foreground/60 mt-1">Staff: {recentReceipt.receivedBy}</span>
                  </div>
                </div>

                {/* Receipt Footer */}
                <p className="text-[9px] text-muted-foreground text-center border-t border-border pt-3 leading-normal">
                  {settings.receiptFooter}
                </p>
              </div>

              {/* Action buttons (hidden on print) */}
              <div className="flex justify-end gap-3 border-t border-border pt-4 print:hidden">
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="h-9 px-4 rounded-xl border border-border text-xs font-semibold hover:bg-secondary transition-colors"
                >
                  Close Receipt
                </button>
                <button
                  onClick={handleDownloadFakePDF}
                  className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 text-xs font-semibold hover:bg-secondary transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 transition-all"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
