'use client';

import React, { useState } from 'react';
import { useBillingSystem } from '@/lib/context';
import {
  Settings,
  Building,
  Phone,
  Mail,
  MapPin,
  HelpCircle,
  CheckCircle,
  Loader2,
  DollarSign,
  FileCode,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsPage() {
  const { settings, updateSettings } = useBillingSystem();

  const [companyName, setCompanyName] = useState(settings.companyName);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [address, setAddress] = useState(settings.address);
  const [currency, setCurrency] = useState(settings.currency);
  const [invoiceFooter, setInvoiceFooter] = useState(settings.invoiceFooter);
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter);

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      updateSettings({
        companyName,
        phone,
        email,
        address,
        currency,
        invoiceFooter,
        receiptFooter,
        logo: '/friends-logo.png', // static logo path
      });
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure ISP company details, customer helpline numbers, invoice templates, and receipts footer text.
        </p>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-3"
          >
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">Company configurations updated successfully! Changes applied to all printable templates.</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Card: Company Details */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
          <div className="border-b border-border pb-3 flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-base">ISP Business Information</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Company Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground">ISP Company Name *</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Friends Network Broadband"
                className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
              />
            </div>

            {/* Helpline */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Customer Support Helpline *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="021-111-362-362"
                className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Billing Support Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="billing@friendsnetwork.net"
                className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
              />
            </div>

            {/* Address */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground">Head Office Address *</label>
              <textarea
                rows={2}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Suite 201, Clifton, Karachi"
                className="w-full rounded-xl border border-border p-3 text-xs outline-none bg-secondary/30 transition-all focus:border-primary focus:bg-card"
              />
            </div>

            {/* Currency Symbol */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Currency Symbol</label>
              <input
                type="text"
                required
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="PKR"
                className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
              />
            </div>
          </div>
        </div>

        {/* Card: Invoice / Receipt footer templates */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
          <div className="border-b border-border pb-3 flex items-center gap-2">
            <FileCode className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-base">Billing Template Customization</h3>
          </div>

          <div className="space-y-4">
            {/* Invoice Footer */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Invoice Footer Disclaimer Text</label>
              <textarea
                rows={3}
                value={invoiceFooter}
                onChange={(e) => setInvoiceFooter(e.target.value)}
                placeholder="e.g. This is computer-generated bill..."
                className="w-full rounded-xl border border-border p-3 text-xs outline-none bg-secondary/30 transition-all focus:border-primary focus:bg-card"
              />
            </div>

            {/* Receipt Footer */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Receipt Footer Acknowledgement Text</label>
              <textarea
                rows={3}
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                placeholder="e.g. Thank you for your payment..."
                className="w-full rounded-xl border border-border p-3 text-xs outline-none bg-secondary/30 transition-all focus:border-primary focus:bg-card"
              />
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-6 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 disabled:opacity-50 transition-all"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving configurations...</span>
              </>
            ) : (
              <span>Save System Settings</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
