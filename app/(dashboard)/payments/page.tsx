'use client';

import React, { useState, useEffect, useMemo } from 'react';
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

export default function PaymentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetCustomerId = searchParams.get('customerId');

  const { customers, addPayment, settings, payments } = useBillingSystem();

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [billingMonth, setBillingMonth] = useState('July 2026');
  const [amountReceived, setAmountReceived] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank' | 'JazzCash' | 'EasyPaisa'>('Cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [notes, setNotes] = useState('');

  // Receipt Modal State
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [recentReceipt, setRecentReceipt] = useState<Payment | null>(null);

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
      }
    }
  }, [targetCustomerId, customers]);

  // Selected customer details
  const currentCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  // Auto-populate outstanding balance to amount received
  useEffect(() => {
    if (currentCustomer) {
      setAmountReceived(currentCustomer.outstandingBalance);
    }
  }, [currentCustomer]);

  const handleCollectPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || amountReceived <= 0) return;

    const paymentData = {
      customerId: selectedCustomerId,
      customerName: currentCustomer ? currentCustomer.name : 'Unknown Customer',
      amountReceived,
      paymentMethod,
      referenceNumber: referenceNumber || undefined,
      paymentDate: `${paymentDate} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      billingMonth,
      notes: notes || undefined,
    };

    const { payment } = addPayment(paymentData);
    setRecentReceipt(payment);
    setShowReceiptModal(true);

    // Reset Form
    setReferenceNumber('');
    setNotes('');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadFakePDF = () => {
    // Standard print styling opens native PDF converter on most browsers
    window.print();
  };

  return (
    <div className="space-y-6">
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
            {/* Customer Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Select Customer *</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
                className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
              >
                <option value="">-- Choose Client --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.id}) • Bal: PKR {c.outstandingBalance}
                  </option>
                ))}
              </select>
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
                  className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
                >
                  <option value="July 2026">July 2026</option>
                  <option value="June 2026">June 2026</option>
                  <option value="May 2026">May 2026</option>
                </select>
              </div>

              {/* Amount Received */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Amount Received (PKR) *</label>
                <input
                  type="number"
                  required
                  value={amountReceived || ''}
                  onChange={(e) => setAmountReceived(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="e.g. 2500"
                  className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
                />
              </div>

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
                  className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
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
                className="w-full rounded-xl border border-border p-3 text-xs outline-none bg-secondary/30 transition-all focus:border-primary focus:bg-card"
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

        {/* History / Recent Payments list on the right */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-base">Recent Payments Log</h3>
            <p className="text-xs text-muted-foreground">Last recorded receipts at the billing desk</p>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {payments.map((p) => (
              <div key={p.id} className="flex justify-between items-center p-3.5 rounded-xl border border-border hover:bg-secondary/40 transition-colors">
                <div>
                  <p className="text-xs font-bold text-foreground">{p.customerName}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{p.id} • {p.paymentMethod} • {p.paymentDate.split(' ')[0]}</p>
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
                    <p className="text-muted-foreground mt-0.5">Account ID: {recentReceipt.customerId}</p>
                    <p className="text-muted-foreground mt-0.5">Plan Rate: PKR {currentCustomer ? currentCustomer.monthlyCharges : ''}/mo</p>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground font-semibold uppercase text-[8px] block">Payment Info</span>
                    <p className="font-bold mt-1">Method: {recentReceipt.paymentMethod}</p>
                    <p className="text-muted-foreground mt-0.5">Ref No: {recentReceipt.referenceNumber || 'N/A'}</p>
                    <p className="text-muted-foreground mt-0.5">Billing Month: {recentReceipt.billingMonth}</p>
                    <p className="text-muted-foreground mt-0.5">Date: {recentReceipt.paymentDate}</p>
                  </div>
                </div>

                {/* Amount segment */}
                <div className="bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <span className="text-[8px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Total Net Amount Cleared</span>
                    <p className="text-xs text-muted-foreground mt-0.5">No outstanding taxes remaining for {recentReceipt.billingMonth}</p>
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
