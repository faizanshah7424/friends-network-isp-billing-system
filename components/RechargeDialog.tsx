'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useBillingSystem } from '@/lib/context';
import { Customer, Package, Payment } from '@/types';
import {
  X,
  CreditCard,
  Network,
  Calendar,
  DollarSign,
  Printer,
  Download,
  Info,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Building,
  Coins,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LogoLoader from '@/components/ui/LogoLoader';

export default function RechargeDialog() {
  const {
    rechargeCustomerId,
    closeRecharge,
    customers,
    packages,
    addPayment,
    settings,
  } = useBillingSystem();

  // Find customer
  const customer = useMemo(() => {
    return customers.find((c) => c.id === rechargeCustomerId) || null;
  }, [customers, rechargeCustomerId]);

  // Form states
  const [selectedPkgId, setSelectedPkgId] = useState('');
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank' | 'JazzCash' | 'EasyPaisa'>('Cash');
  const [bankName, setBankName] = useState('Meezan Bank');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [amountReceived, setAmountReceived] = useState(0);

  // Recharge Step: 'form' | 'receipt'
  const [step, setStep] = useState<'form' | 'receipt'>('form');
  const [recentReceipt, setRecentReceipt] = useState<Payment | null>(null);
  const [invoicePreview, setInvoicePreview] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync customer package when dialog opens
  useEffect(() => {
    if (customer) {
      setSelectedPkgId(customer.packageId);
      setAmountReceived(customer.monthlyCharges + customer.outstandingBalance);
      const now = new Date();
      setPaymentDate(now.toISOString().split('T')[0]);
      setStep('form');
    }
  }, [customer]);

  // Calculations
  const currentPkg = useMemo(() => {
    return packages.find((p) => p.id === selectedPkgId) || null;
  }, [packages, selectedPkgId]);

  const packagePrice = currentPkg ? currentPkg.monthlyCharges : 0;
  const previousDue = customer ? customer.outstandingBalance : 0;
  
  const subtotal = packagePrice + previousDue + additionalCharges;
  const grandTotal = Math.max(0, subtotal - discount);

  // Next Expiry calculation (30 days from today)
  const nextExpiryDate = useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate() + 30);
    return today.toISOString().split('T')[0];
  }, [rechargeCustomerId]);

  // Auto-fill amount received when grand total shifts
  useEffect(() => {
    setAmountReceived(grandTotal);
  }, [grandTotal]);

  if (!rechargeCustomerId || !customer) return null;

  const handleReceivePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const paymentData = {
      customerId: customer.id,
      customerName: customer.name,
      amountReceived,
      paymentMethod,
      referenceNumber: paymentMethod === 'Cash' 
        ? undefined 
        : paymentMethod === 'Bank' 
        ? `${bankName} - Ref: ${referenceNumber}` 
        : referenceNumber,
      paymentDate: `${paymentDate} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      billingMonth: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      notes: remarks || undefined,
    };

    setTimeout(() => {
      // Clears the payment in context ledger
      const { payment } = addPayment(paymentData);
      
      // Set the details to render receipt
      setRecentReceipt(payment);
      setStep('receipt');
      setIsSubmitting(false);
    }, 1200);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto print:static print:h-auto print:w-auto">
        {isSubmitting && (
          <LogoLoader
            overlay
            text="Recharging Account..."
            subtext="Friends Network ISP Billing System"
            loadingText="Processing invoice settlement and generating receipt voucher..."
          />
        )}
        {/* Blurred Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          onClick={closeRecharge}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md print:hidden"
        />

        {/* Dialog Box (~720px wide) */}
        <motion.div
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 20, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full max-w-[720px] rounded-3xl border border-slate-200 bg-white shadow-2xl z-10 overflow-hidden print:border-none print:shadow-none print:bg-white print:p-0 print:m-0"
        >
          {step === 'form' ? (
            /* Recharge Entry Form */
            <form onSubmit={handleReceivePayment} className="flex flex-col h-full max-h-[90vh]">
              {/* Header: Gradient Blue -> Green */}
              <div className="bg-gradient-to-r from-blue-600 to-emerald-500 p-6 text-white flex justify-between items-center">
                <div className="space-y-0.5 text-left">
                  <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                    <Coins className="h-5.5 w-5.5 text-emerald-200 animate-pulse" />
                    <span>Recharge Customer</span>
                  </h2>
                  <p className="text-xs text-blue-50 font-medium">
                    {customer.name} • Account: <span className="font-bold font-mono">{customer.id}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeRecharge}
                  className="rounded-xl p-2 bg-white/10 hover:bg-white/20 text-white transition-all outline-none"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Scrollable Contents */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
                {/* Package Card Grid */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Package Info Card */}
                  <div className="border border-slate-100 rounded-2xl p-5 bg-gradient-to-b from-slate-50/50 to-slate-50/10 space-y-3.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Selected Package</span>
                    
                    <select
                      value={selectedPkgId}
                      onChange={(e) => setSelectedPkgId(e.target.value)}
                      className="w-full text-sm font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-primary"
                    >
                      {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} ({pkg.speed})
                        </option>
                      ))}
                    </select>

                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
                      <div>
                        <span className="text-[9px] text-slate-400 font-semibold block uppercase">Download / Upload</span>
                        <span className="font-bold text-slate-700">{currentPkg?.speed}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-semibold block uppercase">Validity Duration</span>
                        <span className="font-bold text-slate-700">1 Month</span>
                      </div>
                    </div>
                  </div>

                  {/* Green Highlighted Expiry Card */}
                  <div className="border border-emerald-100 rounded-2xl p-5 bg-emerald-500/[0.04] space-y-3.5 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider block">Expiry &amp; Arrears</span>
                      <div className="flex items-center gap-2 mt-2">
                        <Calendar className="h-4.5 w-4.5 text-emerald-500" />
                        <span className="text-sm font-extrabold text-slate-700">{nextExpiryDate}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-emerald-100/60 pt-3">
                      <div>
                        <span className="text-[9px] text-emerald-600 font-semibold block uppercase">Plan Price</span>
                        <span className="font-bold text-slate-700">PKR {packagePrice}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-emerald-600 font-semibold block uppercase">Arrears Due</span>
                        <span className="font-extrabold text-rose-500">PKR {previousDue}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Form Fields Layout */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Payment Method Option buttons */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Payment Method *</label>
                    <div className="grid grid-cols-4 gap-3">
                      {(['Cash', 'Bank', 'JazzCash', 'EasyPaisa'] as const).map((method) => (
                        <label
                          key={method}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer text-xs font-bold transition-all ${
                            paymentMethod === method
                              ? 'bg-blue-50 border-blue-500 text-blue-600 ring-2 ring-blue-500/20'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <input
                            type="radio"
                            name="payMethod"
                            checked={paymentMethod === method}
                            onChange={() => {
                              setPaymentMethod(method);
                              setReferenceNumber('');
                            }}
                            className="sr-only"
                          />
                          <span>{method === 'Bank' ? 'Bank Transfer' : method}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Bank detail selections */}
                  {paymentMethod === 'Bank' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">Select Bank *</label>
                      <select
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs outline-none focus:border-primary focus:bg-white"
                      >
                        <option value="Meezan Bank">Meezan Bank</option>
                        <option value="Habib Bank Ltd (HBL)">Habib Bank Ltd (HBL)</option>
                        <option value="Bank Alfalah">Bank Alfalah</option>
                        <option value="Standard Chartered">Standard Chartered</option>
                      </select>
                    </div>
                  )}

                  {/* Transaction / Reference ID */}
                  {paymentMethod !== 'Cash' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">
                        {paymentMethod === 'Bank' ? 'Reference Number *' : 'Transaction ID *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        placeholder="e.g. TRX-99882211"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs outline-none focus:border-primary focus:bg-white"
                      />
                    </div>
                  )}

                  {/* Additional charges */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Additional Charges (PKR)</label>
                    <input
                      type="number"
                      value={additionalCharges || ''}
                      onChange={(e) => setAdditionalCharges(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="e.g. Late restoration fee"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs outline-none focus:border-primary focus:bg-white"
                    />
                  </div>

                  {/* Discount */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Discount Credit (PKR)</label>
                    <input
                      type="number"
                      value={discount || ''}
                      onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="e.g. Special client discount"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs outline-none focus:border-primary focus:bg-white"
                    />
                  </div>

                  {/* Amount Received input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Amount Received (PKR) *</label>
                    <input
                      type="number"
                      required
                      value={amountReceived || ''}
                      onChange={(e) => setAmountReceived(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="Grand total amount"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs outline-none focus:border-primary focus:bg-white font-bold text-blue-600"
                    />
                  </div>

                  {/* Date selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Payment Date *</label>
                    <input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs outline-none focus:border-primary focus:bg-white"
                    />
                  </div>

                  {/* Received By: Muhammad Shahid */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 font-medium">Received By</label>
                    <div className="h-10 w-full rounded-xl border border-slate-100 bg-slate-50 px-3.5 text-xs flex items-center font-bold text-slate-600">
                      Muhammad Shahid
                    </div>
                  </div>

                  {/* Remarks */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-500">Recharge Remarks / Notes</label>
                    <input
                      type="text"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="e.g. Account renewed successfully for July 2026."
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs outline-none focus:border-primary focus:bg-white"
                    />
                  </div>
                </div>

                {/* Price Breakdown Invoice View */}
                <div className="border-t border-slate-100 pt-5 space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Price Invoice Breakdown</span>
                  <div className="space-y-2 border border-slate-100 rounded-2xl p-4 bg-slate-50/30 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Plan Rate ({currentPkg?.name})</span>
                      <span className="font-semibold text-slate-700">PKR {packagePrice}</span>
                    </div>
                    {previousDue > 0 && (
                      <div className="flex justify-between text-rose-500/80">
                        <span>Previous Arrears Outstanding</span>
                        <span className="font-semibold">PKR {previousDue}</span>
                      </div>
                    )}
                    {additionalCharges > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Additional Surcharges</span>
                        <span className="font-semibold text-slate-700">PKR {additionalCharges}</span>
                      </div>
                    )}
                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount Credit Applied</span>
                        <span className="font-semibold">-PKR {discount}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-black text-slate-800">
                      <span>Grand Total Amount</span>
                      <span className="text-blue-600">PKR {grandTotal}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeRecharge}
                  className="h-10 px-5 rounded-xl border border-slate-200 text-xs font-bold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:opacity-95 transition-all"
                >
                  Receive Payment &amp; Generate Receipt
                </button>
              </div>
            </form>
          ) : (
            /* AFTER PAYMENT: Receipt Preview */
            <div className="flex flex-col h-full max-h-[90vh]">
              {/* Header: Success gradient */}
              <div className="bg-emerald-500 p-6 text-white flex justify-between items-center">
                <div className="space-y-0.5 text-left">
                  <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                    <CheckCircle className="h-5.5 w-5.5 text-emerald-200" />
                    <span>Transaction Completed</span>
                  </h2>
                  <p className="text-xs text-emerald-100 font-medium">
                    Payment recorded under Receipt: <span className="font-bold font-mono">{recentReceipt?.id}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeRecharge}
                  className="rounded-xl p-2 bg-white/10 hover:bg-white/20 text-white transition-all outline-none"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Printable Receipt Paper Sheet */}
              <div className="flex-1 overflow-y-auto p-6 text-left space-y-6">
                <div className="border border-slate-200 rounded-3xl p-6 shadow-sm bg-white space-y-6 text-xs text-slate-800 print-visible">
                  {/* Brand Block */}
                  <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-emerald-500 p-px">
                        <div className="h-full w-full bg-white rounded-[11px] flex items-center justify-center text-blue-600 font-black">
                          FN
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-black text-sm tracking-tight">{settings.companyName}</p>
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Internet Service Provider</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600">
                        RECEIPT CLEARED
                      </span>
                      <p className="text-[10px] text-slate-400 font-bold font-mono mt-1">{recentReceipt?.id}</p>
                    </div>
                  </div>

                  {/* Customer Information detail grid */}
                  <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4 text-[10px]">
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[8px] block">Customer Details</span>
                      <p className="font-extrabold text-slate-700 mt-1 text-sm">{customer.name}</p>
                      <p className="text-slate-500 mt-0.5">Customer ID: {customer.id}</p>
                      <p className="text-slate-500 mt-0.5">Helpline: {customer.phone}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 font-bold uppercase text-[8px] block">Payment Metadata</span>
                      <p className="font-bold text-slate-700 mt-1">Cleared: {recentReceipt?.paymentDate}</p>
                      <p className="text-slate-500 mt-0.5">Method: {recentReceipt?.paymentMethod}</p>
                      <p className="text-slate-500 mt-0.5">Next Expiry: <span className="font-bold text-emerald-600">{nextExpiryDate}</span></p>
                    </div>
                  </div>

                  {/* Items Description */}
                  <div className="space-y-3.5 border-b border-slate-100 pb-4">
                    <div className="flex justify-between font-bold text-slate-400 uppercase text-[8px]">
                      <span>Item Description</span>
                      <span className="text-right">Transaction amount</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-600 font-medium">
                        Internet Subscription Package recharge — <span className="font-bold">{currentPkg?.name} ({currentPkg?.speed})</span>
                      </span>
                      <span className="font-bold text-slate-700">PKR {packagePrice}</span>
                    </div>

                    {previousDue > 0 && (
                      <div className="flex justify-between text-rose-500/80">
                        <span>Previous Outstanding arrears cleared</span>
                        <span className="font-bold">PKR {previousDue}</span>
                      </div>
                    )}

                    {additionalCharges > 0 && (
                      <div className="flex justify-between">
                        <span>Additional Surcharges / Restoration / Setup fee</span>
                        <span className="font-bold text-slate-700">PKR {additionalCharges}</span>
                      </div>
                    )}

                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Ledger credit adjustment / Discount voucher</span>
                        <span className="font-bold">-PKR {discount}</span>
                      </div>
                    )}
                  </div>

                  {/* Totals Summary */}
                  <div className="flex justify-between items-center bg-emerald-500/[0.04] border border-emerald-100 rounded-2xl p-4">
                    <div className="text-left">
                      <span className="text-[8px] font-bold uppercase text-emerald-600">Amount Cleared</span>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                        Received by: <span className="font-bold text-slate-600">Muhammad Shahid</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-emerald-600">PKR {recentReceipt?.amountReceived}</span>
                    </div>
                  </div>

                  {/* Signatures block */}
                  <div className="grid grid-cols-2 gap-8 pt-6 text-[9px] border-t border-slate-100">
                    <div className="border-t border-slate-200 pt-2 text-center text-slate-400 font-bold uppercase">
                      Client Seal
                    </div>
                    <div className="border-t border-slate-200 pt-2 text-center text-slate-400 font-bold uppercase">
                      Authorized Agent Sign
                      <span className="block text-[7px] text-slate-350 mt-0.5">Admin Desk: Muhammad Shahid</span>
                    </div>
                  </div>

                  {/* Branding Footer */}
                  <div className="text-center space-y-1 pt-2">
                    <p className="text-[9px] text-slate-400 leading-normal">
                      {settings.receiptFooter}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400">{settings.address}</p>
                    <p className="text-[10px] font-extrabold text-blue-600/70 tracking-wide mt-2">Thank you for choosing Friends Network!</p>
                  </div>
                </div>
              </div>

              {/* Bottom Actions (hidden on print) */}
              <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-200 print:hidden">
                <button
                  type="button"
                  onClick={closeRecharge}
                  className="h-10 px-5 rounded-xl border border-slate-200 text-xs font-bold hover:bg-slate-100 transition-colors"
                >
                  Close Desk
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold hover:bg-slate-100 transition-all"
                >
                  <Printer className="h-4 w-4 text-slate-500" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-6 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 hover:opacity-95 transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
