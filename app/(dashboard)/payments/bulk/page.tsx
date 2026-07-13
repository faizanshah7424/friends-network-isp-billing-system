'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useBillingSystem } from '@/lib/context';
import { Customer } from '@/types';
import {
  Search,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Calendar,
  Layers,
  Trash2,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LogoLoader from '@/components/ui/LogoLoader';

export default function BulkPaymentsPage() {
  const { customers, addBulkPayments } = useBillingSystem();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState('All');

  // Selection state (dictionary of customerId -> amountToPay)
  const [selectedCustomers, setSelectedCustomers] = useState<Record<string, number>>({});

  // Payment Form States
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank' | 'JazzCash' | 'EasyPaisa'>('Cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');

  // Pagination state for left table
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Feedback State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successCount, setSuccessCount] = useState(0);

  // Set default payment date on mount
  useEffect(() => {
    const now = new Date();
    setPaymentDate(now.toISOString().split('T')[0]);
  }, []);

  // Unique areas for area filter dropdown
  const areas = useMemo(() => {
    const allAreas = customers.map((c) => c.area);
    return ['All', ...Array.from(new Set(allAreas))];
  }, [customers]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.id.toLowerCase().includes(term) ||
          c.phone.includes(term)
      );
    }

    if (areaFilter !== 'All') {
      result = result.filter((c) => c.area === areaFilter);
    }

    return result;
  }, [customers, searchTerm, areaFilter]);

  // Paginated list
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, areaFilter]);

  // Handle individual selection toggle
  const handleToggleSelect = (customer: Customer) => {
    setSelectedCustomers((prev) => {
      const updated = { ...prev };
      if (customer.id in updated) {
        delete updated[customer.id];
      } else {
        // Default to outstanding balance (or monthlyCharges if outstanding is 0)
        updated[customer.id] = customer.outstandingBalance > 0 ? customer.outstandingBalance : customer.monthlyCharges;
      }
      return updated;
    });
  };

  // Check if all filtered customers are selected
  const isAllFilteredSelected = useMemo(() => {
    if (filteredCustomers.length === 0) return false;
    return filteredCustomers.every((c) => c.id in selectedCustomers);
  }, [filteredCustomers, selectedCustomers]);

  // Handle select all filtered customers toggle
  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      // Deselect all filtered
      setSelectedCustomers((prev) => {
        const updated = { ...prev };
        filteredCustomers.forEach((c) => {
          delete updated[c.id];
        });
        return updated;
      });
    } else {
      // Select all filtered
      setSelectedCustomers((prev) => {
        const updated = { ...prev };
        filteredCustomers.forEach((c) => {
          if (!(c.id in updated)) {
            updated[c.id] = c.outstandingBalance > 0 ? c.outstandingBalance : c.monthlyCharges;
          }
        });
        return updated;
      });
    }
  };

  // Remove customer from selected side panel
  const handleRemoveSelection = (customerId: string) => {
    setSelectedCustomers((prev) => {
      const updated = { ...prev };
      delete updated[customerId];
      return updated;
    });
  };

  // Update amount for a specific selected customer
  const handleAmountChange = (customerId: string, amount: number) => {
    setSelectedCustomers((prev) => ({
      ...prev,
      [customerId]: Math.max(0, amount),
    }));
  };

  // Convert selected map to full customer detail array
  const selectedDetails = useMemo(() => {
    return Object.entries(selectedCustomers)
      .map(([id, amount]) => {
        const customer = customers.find((c) => c.id === id);
        return customer ? { customer, amount } : null;
      })
      .filter((item): item is { customer: Customer; amount: number } => item !== null);
  }, [selectedCustomers, customers]);

  // Sum of total amount to receive
  const totalAmountReceived = useMemo(() => {
    return Object.values(selectedCustomers).reduce((sum, amt) => sum + amt, 0);
  }, [selectedCustomers]);

  // Process bulk payment submit
  const handleSubmitBulkPayments = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDetails.length === 0) return;

    setIsSubmitting(true);

    setTimeout(() => {
      // Map selection details into Omit<Payment, 'id' | 'receivedBy'> format
      const paymentsData = selectedDetails.map(({ customer, amount }) => ({
        customerId: customer.id,
        customerName: customer.name,
        amountReceived: amount,
        paymentMethod,
        referenceNumber: referenceNumber || undefined,
        paymentDate: `${paymentDate} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        billingMonth: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
        notes: remarks || undefined,
      }));

      // Call context handler
      addBulkPayments(paymentsData);

      setSuccessCount(paymentsData.length);
      setIsSubmitting(false);
      setShowSuccess(true);
      setSelectedCustomers({});
      setRemarks('');
      setReferenceNumber('');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {isSubmitting && (
        <LogoLoader
          overlay
          text="Recording Bulk Payments..."
          subtext="Friends Network ISP Billing System"
          loadingText="Posting batch payments and updating dashboard stats..."
        />
      )}
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Bulk Payments Update</h1>
        <p className="text-slate-500 text-sm mt-1">
          Receive and record payments from multiple customers simultaneously. Ideal for daily collection sheet updates.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {showSuccess ? (
          /* Success Screen */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-border p-12 rounded-3xl text-center shadow-sm space-y-4 max-w-2xl mx-auto"
          >
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle className="h-10 w-10 animate-bounce" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Bulk Payments Recorded!</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Successfully processed <span className="font-extrabold text-emerald-600">{successCount} payments</span>.
              All customer ledger details, remaining balances, and system stats have been updated in real-time.
            </p>
            <button
              onClick={() => setShowSuccess(false)}
              className="mt-4 h-9 px-6 rounded-xl bg-primary text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 transition-all"
            >
              Continue Recording
            </button>
          </motion.div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-5 items-start">
            {/* Left Column: Customer Selection directory */}
            <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <span>Select Customers</span>
                </h3>
                <span className="text-xs text-muted-foreground font-semibold">
                  {filteredCustomers.length} matching records
                </span>
              </div>

              {/* Filters */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by ID, Name, or Mobile..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-secondary/30 pl-10 pr-4 text-xs outline-none transition-all focus:border-primary focus:bg-card"
                  />
                </div>
                <div>
                  <select
                    value={areaFilter}
                    onChange={(e) => setAreaFilter(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 text-xs outline-none transition-all focus:border-primary focus:bg-card"
                  >
                    <option value="All">All Areas</option>
                    {areas.filter((a) => a !== 'All').map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Check All Filtered Toggle */}
              {filteredCustomers.length > 0 && (
                <div className="flex items-center justify-between bg-slate-500/5 p-3 rounded-xl">
                  <span className="text-xs font-bold text-slate-600">Select All Filtered Customers</span>
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                  >
                    {isAllFilteredSelected ? (
                      <>
                        <CheckSquare className="h-4 w-4" />
                        <span>Deselect All</span>
                      </>
                    ) : (
                      <>
                        <Square className="h-4 w-4" />
                        <span>Select All</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Customers Table */}
              {paginatedCustomers.length > 0 ? (
                <div className="overflow-hidden border border-border rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-secondary/10 text-muted-foreground uppercase font-semibold">
                        <th className="p-3 text-center w-12">Select</th>
                        <th className="p-3">Customer Details</th>
                        <th className="p-3 text-right">Outstanding</th>
                        <th className="p-3 text-right">Monthly rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {paginatedCustomers.map((c) => {
                        const isSelected = c.id in selectedCustomers;
                        return (
                          <tr
                            key={c.id}
                            onClick={() => handleToggleSelect(c)}
                            className={`cursor-pointer hover:bg-secondary/15 transition-all ${
                              isSelected ? 'bg-primary/5' : ''
                            }`}
                          >
                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelect(c)}
                                className="h-4.5 w-4.5 rounded border-slate-350 text-primary focus:ring-primary"
                              />
                            </td>
                            <td className="p-3">
                              <p className="font-semibold text-slate-800">{c.name}</p>
                              <p className="text-[10px] text-muted-foreground font-semibold">
                                {c.id} • {c.area} • {c.phone}
                              </p>
                            </td>
                            <td className="p-3 text-right font-bold text-rose-500">
                              PKR {c.outstandingBalance}
                            </td>
                            <td className="p-3 text-right font-semibold text-slate-600">
                              PKR {c.monthlyCharges}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No customers found matching search filters.
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center justify-center h-8 w-8 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center justify-center h-8 w-8 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Selections & Payment Panel */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
                <div className="border-b border-border pb-3 flex justify-between items-center">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    <span>Selected Customers ({selectedDetails.length})</span>
                  </h3>
                  {selectedDetails.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedCustomers({})}
                      className="text-xs font-bold text-rose-500 hover:underline"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                {/* Selected List */}
                {selectedDetails.length > 0 ? (
                  <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                    {selectedDetails.map(({ customer, amount }) => (
                      <div
                        key={customer.id}
                        className="flex justify-between items-center p-3 rounded-xl border border-border bg-slate-550/5 hover:bg-slate-550/10 transition-colors"
                      >
                        <div className="space-y-0.5 text-left">
                          <p className="text-xs font-semibold text-slate-800">{customer.name}</p>
                          <p className="text-[10px] text-muted-foreground font-semibold">
                            {customer.id} • Bal: PKR {customer.outstandingBalance}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="space-y-1">
                            <span className="text-[8px] font-bold text-slate-400 block text-right uppercase">
                              Amount (PKR)
                            </span>
                            <input
                              type="number"
                              required
                              value={amount || ''}
                              onChange={(e) =>
                                handleAmountChange(customer.id, parseInt(e.target.value) || 0)
                              }
                              className="h-8 w-24 rounded-lg border border-border bg-white text-right px-2 text-xs outline-none focus:border-primary font-bold text-slate-700"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSelection(customer.id)}
                            className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors mt-4"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 border border-dashed border-border rounded-xl text-center text-xs text-muted-foreground space-y-1.5">
                    <AlertCircle className="h-6 w-6 text-muted-foreground/60 mx-auto" />
                    <p className="font-semibold">No customers selected</p>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-normal">
                      Check client records in the list on the left to add them to this bulk payment worksheet.
                    </p>
                  </div>
                )}

                {/* Bulk Payment Input fields */}
                {selectedDetails.length > 0 && (
                  <form onSubmit={handleSubmitBulkPayments} className="space-y-4 border-t border-border pt-4">
                    <div className="grid gap-3.5 sm:grid-cols-2">
                      {/* Payment Method */}
                      <div className="space-y-1 text-left">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                          Payment Method *
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as any)}
                          required
                          className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 text-xs outline-none focus:border-primary focus:bg-card"
                        >
                          <option value="Cash">Cash</option>
                          <option value="Bank">Bank Transfer</option>
                          <option value="JazzCash">JazzCash</option>
                          <option value="EasyPaisa">EasyPaisa</option>
                        </select>
                      </div>

                      {/* Payment Date */}
                      <div className="space-y-1 text-left">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                          Payment Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                          className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 text-xs outline-none focus:border-primary focus:bg-card"
                        />
                      </div>

                      {/* Transaction ID */}
                      {paymentMethod !== 'Cash' && (
                        <div className="space-y-1 text-left sm:col-span-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                            Reference Number / Transaction ID *
                          </label>
                          <input
                            type="text"
                            required
                            value={referenceNumber}
                            onChange={(e) => setReferenceNumber(e.target.value)}
                            placeholder="e.g. Bank receipt or wallet transaction code"
                            className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 text-xs outline-none focus:border-primary focus:bg-card"
                          />
                        </div>
                      )}

                      {/* Remarks */}
                      <div className="space-y-1 text-left sm:col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                          Remarks / Staff Notes
                        </label>
                        <textarea
                          rows={2}
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="Internal audit notes..."
                          className="w-full rounded-xl border border-border p-3 text-xs outline-none bg-secondary/30 focus:border-primary focus:bg-card"
                        />
                      </div>
                    </div>

                    {/* Calculations Summary */}
                    <div className="bg-emerald-500/[0.04] border border-emerald-100 rounded-xl p-4 flex justify-between items-center text-xs">
                      <div className="text-left">
                        <span className="text-[9px] font-bold uppercase text-emerald-600">Total Bulk Collected</span>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-none">
                          Staff Desk: Muhammad Shahid
                        </p>
                      </div>
                      <span className="text-lg font-black text-emerald-600">
                        PKR {totalAmountReceived.toLocaleString()}
                      </span>
                    </div>

                    {/* Receive Bulk Payment */}
                    <button
                      type="submit"
                      disabled={isSubmitting || selectedDetails.length === 0}
                      className="w-full h-10 rounded-xl bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-1.5"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-4.5 w-4.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                          <span>Updating ledger...</span>
                        </>
                      ) : (
                        <span>Receive Bulk Payment ({selectedDetails.length})</span>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
