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
                <tr className="border-b border-border bg-secondary/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
                  <tr key={inv.id} className="hover:bg-secondary/20 transition-all duration-150">
                    <td className="p-4 font-semibold text-indigo-500">{inv.id}</td>
                    <td className="p-4">
                      <div className="font-semibold text-foreground">{inv.customerName}</div>
                      <div className="text-xs text-muted-foreground">ID: {inv.customerId}</div>
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
              <div className="space-y-6 text-xs text-foreground bg-card p-6 rounded-xl border border-border print:border-none print:bg-white print:p-0">
                {/* Company Header */}
                <div className="flex justify-between items-start border-b border-border pb-5">
                  <div className="flex items-center gap-3">
                    <img src="/friends-logo.png" alt="Friends Network Logo" className="h-10 w-10 object-contain" />
                    <div className="text-left">
                      <h2 className="font-bold text-base leading-none text-slate-800">{settings.companyName}</h2>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1.5">{settings.phone} • {settings.email}</p>
                      <p className="text-[9px] text-slate-400 font-semibold mt-0.5 max-w-[280px] leading-relaxed">{settings.address}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h3 className="font-black text-xl tracking-tight text-primary">INVOICE</h3>
                    <p className="font-semibold text-muted-foreground mt-1.5">No: <span className="font-bold font-mono">{selectedInvoice.id}</span></p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Date: {selectedInvoice.billingDate}</p>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="grid grid-cols-2 gap-6 border-b border-border pb-5 text-[10px]">
                  <div>
                    <span className="text-muted-foreground font-semibold uppercase text-[8px] block">Invoiced To</span>
                    <p className="font-bold text-sm mt-1">{selectedInvoice.customerName}</p>
                    <p className="text-muted-foreground mt-1 font-semibold">Customer ID: {selectedInvoice.customerId}</p>
                    <p className="text-muted-foreground mt-0.5 max-w-[220px] leading-normal">{getCustomerAddress(selectedInvoice.customerId)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground font-semibold uppercase text-[8px] block">Billing Month</span>
                    <p className="font-bold text-sm mt-1">{selectedInvoice.billingMonth}</p>
                    <p className="text-muted-foreground mt-1">Due Date: <span className="font-semibold">{selectedInvoice.dueDate}</span></p>
                    <p className="text-muted-foreground mt-0.5">Payment Status: <span className="font-bold">{selectedInvoice.paymentStatus}</span></p>
                  </div>
                </div>

                {/* Invoice Charges List */}
                <div className="space-y-3.5 border-b border-border pb-5">
                  <div className="flex justify-between font-bold text-muted-foreground uppercase text-[8px]">
                    <span>Billing Breakdown Item</span>
                    <span className="text-right">Charge Amount</span>
                  </div>

                  {/* Charges */}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Bandwidth Plan Subscription Charges</span>
                    <span className="font-semibold text-foreground">PKR {selectedInvoice.monthlyCharges}</span>
                  </div>

                  {/* Previous Due */}
                  {selectedInvoice.previousDue > 0 && (
                    <div className="flex justify-between text-rose-500/80">
                      <span>Previous Arrears / Outstanding Ledger Balance</span>
                      <span className="font-semibold">PKR {selectedInvoice.previousDue}</span>
                    </div>
                  )}

                  {/* Additional Charges */}
                  {selectedInvoice.additionalCharges > 0 && (
                    <div className="flex justify-between">
                      <span>Installation, Fiber splicing, or ONT Hardware Fee</span>
                      <span className="font-semibold text-foreground">PKR {selectedInvoice.additionalCharges}</span>
                    </div>
                  )}

                  {/* Discount */}
                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between text-emerald-500">
                      <span>Ledger Credit Adjustment / Discount Voucher Applied</span>
                      <span className="font-semibold">-PKR {selectedInvoice.discount}</span>
                    </div>
                  )}

                  {/* Tax */}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sindh Sales Tax on ISP Services (15% SST)</span>
                    <span className="font-semibold text-foreground">PKR {selectedInvoice.tax}</span>
                  </div>
                </div>

                {/* Invoice Reconciliation Ledger */}
                <div className="flex justify-end pt-2">
                  <div className="w-full max-w-[280px] space-y-2 text-[10px] text-right font-medium">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Invoiced Amount:</span>
                      <span className="font-semibold">PKR {selectedInvoice.grandTotal}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span className="font-semibold">Cleared Payments:</span>
                      <span className="font-semibold">-PKR {selectedInvoice.amountPaid}</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2 text-sm font-black text-foreground">
                      <span>Remaining Balance:</span>
                      <span className={selectedInvoice.outstandingBalance > 0 ? 'text-rose-500' : 'text-emerald-500'}>
                        PKR {selectedInvoice.outstandingBalance}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer notes */}
                <p className="text-[10px] text-muted-foreground text-center border-t border-border pt-4 leading-normal bg-secondary/30 p-2.5 rounded-xl border border-border">
                  {settings.invoiceFooter}
                </p>
              </div>

              {/* Action Drawer */}
              <div className="flex justify-end gap-3 border-t border-border pt-4 print:hidden">
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="h-9 px-4 rounded-xl border border-border text-xs font-semibold hover:bg-secondary transition-colors"
                >
                  Close Bill
                </button>
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
