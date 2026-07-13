'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBillingSystem } from '@/lib/context';
import { Invoice } from '@/types';
import {
  Receipt,
  PlusCircle,
  FileText,
  Calculator,
  User,
  ArrowRight,
  TrendingDown,
  Percent,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetCustomerId = searchParams.get('customerId');

  const { customers, addInvoice, settings } = useBillingSystem();

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [billingMonth, setBillingMonth] = useState('July 2026');
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedInvoiceId, setGeneratedInvoiceId] = useState('');

  // Months list for dropdown
  const months = ['January 2026', 'February 2026', 'March 2026', 'April 2026', 'May 2026', 'June 2026', 'July 2026', 'August 2026', 'September 2026', 'October 2026', 'November 2026', 'December 2026'];

  // Handle redirect target pre-select
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

  // Calculated Fields
  const monthlyCharges = currentCustomer ? currentCustomer.monthlyCharges : 0;
  const previousDue = currentCustomer ? currentCustomer.outstandingBalance : 0;
  
  const subtotal = monthlyCharges + previousDue + additionalCharges;
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = Math.round(taxableAmount * 0.15); // 15% SST
  const grandTotal = Math.max(0, taxableAmount + tax);

  const handleGenerateBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;

    setIsSubmitting(true);

    // Simulate API delay
    setTimeout(() => {
      const invoiceData = {
        customerId: selectedCustomerId,
        billingMonth,
        monthlyCharges,
        previousDue,
        additionalCharges,
        discount,
        tax,
        billingDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days due
      };

      const newInv = addInvoice(invoiceData);
      setGeneratedInvoiceId(newInv.id);
      setIsSubmitting(false);
      setShowSuccess(true);

      setTimeout(() => {
        router.push('/invoices');
      }, 2000);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Billing &amp; Invoicing</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generate monthly internet subscription invoices, adjust installation fees, or issue custom credits.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {showSuccess ? (
          /* Success Screen */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-border p-12 rounded-3xl text-center shadow-sm space-y-4"
          >
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle className="h-10 w-10 animate-bounce" />
            </div>
            <h2 className="text-2xl font-bold">Invoice Generated!</h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Invoice <span className="font-semibold text-primary">{generatedInvoiceId}</span> has been issued successfully.
              The client outstanding balance has been updated. Redirecting to invoices...
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Form Section */}
            <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
              <div className="border-b border-border pb-3 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-base">Generate Bill Form</h3>
              </div>

              <form onSubmit={handleGenerateBill} className="space-y-5">
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
                        {c.name} ({c.id}) • {c.area}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Bill Month */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Billing Month *</label>
                    <select
                      value={billingMonth}
                      onChange={(e) => setBillingMonth(e.target.value)}
                      required
                      className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
                    >
                      {months.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Monthly Charges (read-only indicator) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Package Rate (PKR)</label>
                    <div className="h-10 w-full rounded-xl border border-border bg-secondary/20 px-3.5 text-xs flex items-center font-bold text-foreground/70">
                      PKR {monthlyCharges}
                    </div>
                  </div>

                  {/* Previous Due (read-only indicator) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Previous Outstanding (PKR)</label>
                    <div className="h-10 w-full rounded-xl border border-border bg-secondary/20 px-3.5 text-xs flex items-center font-bold text-rose-500/80">
                      PKR {previousDue}
                    </div>
                  </div>

                  {/* Additional charges */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <PlusCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Additional Charges (PKR)</span>
                    </label>
                    <input
                      type="number"
                      value={additionalCharges || ''}
                      onChange={(e) => setAdditionalCharges(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="e.g. Installation, hardware"
                      className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
                    />
                  </div>

                  {/* Discount */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Discount / Credit (PKR)</span>
                    </label>
                    <input
                      type="number"
                      value={discount || ''}
                      onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="e.g. Promotional offer"
                      className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
                    />
                  </div>

                  {/* Calculated Tax */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Sales Tax (15% SST)</span>
                    </label>
                    <div className="h-10 w-full rounded-xl border border-border bg-secondary/20 px-3.5 text-xs flex items-center font-bold text-foreground/70">
                      PKR {tax}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Internal Notes / Ledger Remarks</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Late fee adjustments, special customer request discount"
                    className="w-full rounded-xl border border-border p-3 text-xs outline-none bg-secondary/30 transition-all focus:border-primary focus:bg-card"
                  />
                </div>

                {/* Submit button */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedCustomerId}
                    className="flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-6 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 disabled:opacity-50 transition-all"
                  >
                    {isSubmitting ? (
                      <span>Generating invoice...</span>
                    ) : (
                      <span>Generate Bill &amp; Post to Ledger</span>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Preview Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5 relative overflow-hidden">
                {/* Fine pattern overlay */}
                <div className="absolute top-0 right-0 h-28 w-28 bg-primary/5 rounded-full blur-2xl" />

                <div className="border-b border-border pb-3 flex justify-between items-center">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <FileText className="h-4.5 w-4.5 text-primary" />
                    <span>Real-time Invoice Preview</span>
                  </h3>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                    Draft
                  </span>
                </div>

                {/* Mock Invoice Sheet */}
                <div className="border border-border rounded-xl p-4 bg-secondary/15 space-y-4 text-xs">
                  {/* Header */}
                  <div className="flex justify-between items-start border-b border-border pb-3">
                    <div>
                      <p className="font-bold text-sm leading-none">{settings.companyName}</p>
                      <p className="text-[9px] text-muted-foreground mt-1 max-w-[150px] leading-relaxed">
                        {settings.address}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-muted-foreground">INVOICE</p>
                      <p className="text-[9px] text-muted-foreground mt-1">INV-2026-XXXX</p>
                    </div>
                  </div>

                  {/* Customer Block */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] border-b border-border pb-3">
                    <div>
                      <span className="text-muted-foreground block font-semibold uppercase text-[8px]">Bill To</span>
                      <p className="font-bold text-foreground mt-0.5">{currentCustomer ? currentCustomer.name : 'Choose Customer'}</p>
                      <p className="text-muted-foreground mt-0.5">{currentCustomer ? currentCustomer.id : 'FNB-XXXX'}</p>
                      <p className="text-muted-foreground truncate max-w-[120px]">{currentCustomer ? currentCustomer.address : ''}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground block font-semibold uppercase text-[8px]">Billing Details</span>
                      <p className="font-bold text-foreground mt-0.5">{billingMonth}</p>
                      <p className="text-muted-foreground mt-0.5">Due: {new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}</p>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="space-y-2 border-b border-border pb-3">
                    <div className="flex justify-between font-semibold text-muted-foreground uppercase text-[8px]">
                      <span>Description</span>
                      <span>Amount</span>
                    </div>

                    {/* Monthly plan charges */}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{currentCustomer ? currentCustomer.packageName : 'Subscription package rate'}</span>
                      <span className="font-medium">PKR {monthlyCharges}</span>
                    </div>

                    {/* Previous outstanding */}
                    {previousDue > 0 && (
                      <div className="flex justify-between text-rose-500/80">
                        <span>Previous Outstanding balance</span>
                        <span className="font-medium">PKR {previousDue}</span>
                      </div>
                    )}

                    {/* Additional charges */}
                    {additionalCharges > 0 && (
                      <div className="flex justify-between">
                        <span>Restoration / Installation / Hardware fee</span>
                        <span className="font-medium">PKR {additionalCharges}</span>
                      </div>
                    )}

                    {/* Discount */}
                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-500">
                        <span>Ledger Promotional Discount</span>
                        <span className="font-medium">-PKR {discount}</span>
                      </div>
                    )}
                  </div>

                  {/* Total Calculations */}
                  <div className="space-y-1.5 text-right font-medium">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>PKR {subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sindh Sales Tax (15% SST)</span>
                      <span>PKR {tax}</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-1.5 text-sm font-black text-foreground">
                      <span>Grand Total Due</span>
                      <span className="text-indigo-500">PKR {grandTotal}</span>
                    </div>
                  </div>
                </div>

                {/* Footer notes indicator */}
                <p className="text-[10px] text-muted-foreground leading-relaxed text-center font-medium bg-secondary/50 p-2.5 rounded-xl border border-border">
                  {settings.invoiceFooter}
                </p>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
