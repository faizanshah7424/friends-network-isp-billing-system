'use client';

import React, { useState, useMemo } from 'react';
import { useBillingSystem } from '@/lib/context';
import { Invoice } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import {
  FileText,
  Search,
  SlidersHorizontal,
  Printer,
  Eye,
  X,
  Network,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';


export default function InvoicesPage() {
  const { invoices, settings, customers } = useBillingSystem();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Detailed Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    let result = [...invoices];

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.customerName.toLowerCase().includes(term) ||
          inv.customerId.toLowerCase().includes(term) ||
          inv.id.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter((inv) => inv.paymentStatus === statusFilter);
    }

    return result;
  }, [invoices, searchTerm, statusFilter]);

  const handlePrint = () => {
    window.print();
  };

  // Find customer billing address for the detailed invoice view
  const getCustomerAddress = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer ? `${customer.address}, ${customer.area}` : '';
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6 print:hidden">
        {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Billing Invoices</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Browse invoice history, check remaining balances, and print customer bills.
          </p>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <SlidersHorizontal className="h-4.5 w-4.5 text-primary" />
          <span>Search Invoices</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by client, ID, invoice no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-secondary/30 pl-10 pr-4 text-xs outline-none transition-all focus:border-primary focus:bg-card"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 text-xs outline-none transition-all focus:border-primary focus:bg-card"
            >
              <option value="All">All Invoices</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoice Table Grid */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {filteredInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/60 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <th className="p-4">Invoice No</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Billing Month</th>
                  <th className="p-4 text-right">Grand Total</th>
                  <th className="p-4 text-right">Paid</th>
                  <th className="p-4 text-right">Remaining</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/40 transition-all duration-150">
                    <td className="p-4 font-semibold text-indigo-500">{inv.id}</td>
                    <td className="p-4">
                      <span className="font-semibold text-foreground block">
                        {inv.customerName}
                      </span>
                      <Link href={`/customers/${inv.customerId}`} className="text-xs text-indigo-500 hover:underline transition-colors block font-mono">
                        ID: {inv.customerId}
                      </Link>
                    </td>
                    <td className="p-4 font-medium text-xs">{inv.billingMonth}</td>
                    <td className="p-4 text-right font-bold">PKR {inv.grandTotal}</td>
                    <td className="p-4 text-right font-semibold text-emerald-500">PKR {inv.amountPaid}</td>
                    <td className="p-4 text-right font-semibold text-rose-500">PKR {inv.outstandingBalance}</td>
                    <td className="p-4 text-xs text-muted-foreground">{inv.dueDate}</td>
                    <td className="p-4">
                      <StatusBadge status={inv.paymentStatus} />
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors flex items-center justify-center mx-auto"
                        title="View Detailed Invoice"
                      >
                        <Eye className="h-4.5 w-4.5 text-primary" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-bold">No invoices found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              We couldn&apos;t find any records matching your search query or filter.
            </p>
          </div>
        )}
      </div>
      </div>

      {/* Invoice Detail Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center print:static print:h-auto print:w-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedInvoice(null)}
              className="absolute inset-0 bg-black print:hidden"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl rounded-2xl border border-border bg-card p-8 shadow-2xl z-10 space-y-6 print:border-none print:shadow-none print:bg-white print:p-0 print:m-0"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedInvoice(null)}
                className="absolute top-4 right-4 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors print:hidden"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Printable Invoice Page Layout */}
              <div className="space-y-6 text-xs text-slate-800 bg-white p-8 rounded-xl border border-slate-200 print:border-none print:p-0">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">Friends Network</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">INTERNET SERVICE PROVIDER</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold text-slate-800"><span className="text-slate-500">Bill No#</span> {selectedInvoice.id}</p>
                    <p className="text-slate-600 mt-1"><span className="font-semibold text-slate-700">Invoice Date:</span> {selectedInvoice.billingDate}</p>
                    <p className="text-slate-600 mt-0.5"><span className="font-semibold text-slate-700">Due Date:</span> {selectedInvoice.dueDate}</p>
                  </div>
                </div>

                {/* Billed By / Billed To */}
                <div className="grid grid-cols-2 gap-8 text-xs border-b border-slate-200 pb-5">
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Billed By</h4>
                    <p className="font-semibold text-slate-800">Friends Network</p>
                    <p className="text-slate-600">Pakistan</p>
                    <p className="text-slate-600 font-mono text-[11px] mt-1">Phone: +92 346 2523505</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Billed To</h4>
                    <p className="font-bold text-slate-900">{selectedInvoice.customerName}</p>
                    <p className="text-slate-600 leading-relaxed max-w-[240px]">{getCustomerAddress(selectedInvoice.customerId) || 'Karachi, Pakistan'}</p>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-800 font-bold">
                      <tr>
                        <th className="p-3">Service's</th>
                        <th className="p-3 text-center">Quantity</th>
                        <th className="p-3 text-right">Rate</th>
                        <th className="p-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      <tr>
                        <td className="p-3">
                          <span className="font-medium text-slate-900 block">Monthly Subscription of Internet</span>
                          <span className="text-[11px] text-slate-500">Standard High-Speed Line</span>
                        </td>
                        <td className="p-3 text-center font-medium">1</td>
                        <td className="p-3 text-right font-medium">PKR {selectedInvoice.monthlyCharges.toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-slate-900">PKR {selectedInvoice.monthlyCharges.toLocaleString()}.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Totals & Bank Details */}
                <div className="grid grid-cols-2 gap-6 text-xs border-b border-slate-200 pb-5 pt-2">
                  <div className="space-y-3">
                    <div>
                      <p className="font-bold text-slate-900">Total (in words) :</p>
                      <p className="font-bold text-indigo-700 uppercase tracking-wide mt-0.5">
                        PKR {selectedInvoice.grandTotal.toLocaleString()} RUPEES ONLY
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                      <p className="font-bold text-slate-900">Bank Details</p>
                      <p className="text-slate-600 mt-1"><span className="font-medium text-slate-700">Account Name:</span> Muhammad Shahid</p>
                      <p className="text-slate-600 font-mono text-[11px]"><span className="font-medium text-slate-700 font-sans">Account Number:</span> PK45BAHL5011008100779001</p>
                      <p className="text-slate-600"><span className="font-medium text-slate-700">Bank:</span> Bank Al Habib</p>
                    </div>
                  </div>

                  <div className="text-right space-y-2 self-start bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex justify-between text-slate-600">
                      <span>Discount:</span>
                      <span>PKR {selectedInvoice.discount.toLocaleString()}.00</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-sm text-slate-900 border-t border-slate-200 pt-2">
                      <span>Total (PKR):</span>
                      <span className="text-indigo-600">PKR {selectedInvoice.grandTotal.toLocaleString()}.00</span>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-1.5 text-[11px] text-slate-600">
                  <p className="font-bold text-slate-900 text-xs">Terms and Conditions</p>
                  <ol className="list-decimal list-inside space-y-1 leading-relaxed">
                    <li>Internet subscription period is from the 10th of each month to the 10th of the following month.</li>
                    <li>Billing cycle is from the 1st to the 10th of every month.</li>
                    <li>Subscription charges must be paid in advance to avoid service interruption.</li>
                    <li>If a new client joins mid-month, subscription charges will still be payable in advance for the full cycle (10th to 10th).</li>
                    <li>One-time charges (OTC) apply at the time of installation and are non-refundable.</li>
                  </ol>
                </div>
              </div>

              {/* Action Drawer */}
              <div className="flex justify-end gap-3 border-t border-border pt-4 print:hidden">
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="h-9 px-4 rounded-xl border border-border text-xs font-semibold hover:bg-secondary transition-colors"
                >
                  Close Bill
                </button>
                <a
                  href={`https://friends-network-isp-billing-system-production.up.railway.app/api/v1/billing/invoices/${selectedInvoice.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/80 px-4 text-xs font-semibold text-foreground hover:bg-secondary transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PDF</span>
                </a>
                <button
                  onClick={handlePrint}
                  className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 transition-all"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Invoice</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
