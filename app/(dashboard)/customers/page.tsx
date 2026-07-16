'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useBillingSystem } from '@/lib/context';
import { Customer } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import {
  Search,
  Plus,
  Download,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  ArrowUpDown,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomersPage() {
  const router = useRouter();
  const { customers, suspendCustomer, activateCustomer, deleteCustomer, openRecharge, currentUser } = useBillingSystem();
  const [activeMenuRowId, setActiveMenuRowId] = useState<string | null>(null);
  
  // Simulated Loading State
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  
  // Sorting state
  const [sortField, setSortField] = useState<keyof Customer>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Dialog / Action confirm states
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'suspend' | 'activate' | 'delete';
    customerId: string;
    customerName: string;
  } | null>(null);

  // Simulate dashboard loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);



  // Extract unique areas for filtering
  const areas = useMemo(() => {
    const allAreas = customers.map((c) => c.area);
    return ['All', ...Array.from(new Set(allAreas))];
  }, [customers]);

  // Handle sorting trigger
  const handleSort = (field: keyof Customer) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtered & Sorted Customers
  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    if (currentUser.role === 'Sub Admin') {
      result = result.filter((c) => c.paymentStatus === 'Unpaid' || c.paymentStatus === 'Pending');
    }

    // Search term match
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.id.toLowerCase().includes(term) ||
          c.phone.includes(term) ||
          (c.address && c.address.toLowerCase().includes(term))
      );
    }

    // Area filter
    if (areaFilter !== 'All') {
      result = result.filter((c) => c.area === areaFilter);
    }

    // Status filter
    if (statusFilter !== 'All') {
      result = result.filter((c) => c.connectionStatus === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'All') {
      result = result.filter((c) => c.paymentStatus === paymentFilter);
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField] ?? '';
      let bVal = b[sortField] ?? '';

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [customers, searchTerm, areaFilter, statusFilter, paymentFilter, sortField, sortDirection, currentUser]);

  // Paginated Customers
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Customer ID',
      'Name',
      'Phone',
      'Address',
      'Area',
      'Package',
      'Monthly Charges (PKR)',
      'Connection Date',
      'Connection Status',
      'Payment Status',
      'Outstanding Balance (PKR)',
    ];

    const rows = filteredCustomers.map((c) => [
      c.id,
      c.name,
      c.phone,
      `"${c.address.replace(/"/g, '""')}"`,
      c.area,
      c.packageName,
      c.monthlyCharges,
      c.connectionDate,
      c.connectionStatus,
      c.paymentStatus,
      c.outstandingBalance,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FN_Customers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Perform dialog action
  const handleConfirmAction = () => {
    if (!confirmDialog) return;
    const { type, customerId } = confirmDialog;

    if (type === 'suspend') {
      suspendCustomer(customerId);
    } else if (type === 'activate') {
      activateCustomer(customerId);
    } else if (type === 'delete') {
      deleteCustomer(customerId);
    }

    setConfirmDialog(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Customer Directory</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage client connections, active packages, billing details, and optical line status.
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex flex-1 sm:flex-none h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 text-xs font-semibold text-foreground hover:bg-secondary transition-all"
          >
            <Download className="h-4 w-4 text-muted-foreground" />
            <span>Export CSV</span>
          </button>
          <Link
            href="/customers/add"
            className="flex flex-1 sm:flex-none h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Customer</span>
          </Link>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <SlidersHorizontal className="h-4.5 w-4.5 text-primary" />
          <span>Filters &amp; Search</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, ID, phone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 w-full rounded-xl border border-border bg-secondary/30 pl-10 pr-4 text-xs outline-none transition-all focus:border-primary focus:bg-card"
            />
          </div>

          {/* Area Select */}
          <div>
            <select
              value={areaFilter}
              onChange={(e) => {
                setAreaFilter(e.target.value);
                setCurrentPage(1);
              }}
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

          {/* Connection Status Select */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 text-xs outline-none transition-all focus:border-primary focus:bg-card"
            >
              <option value="All">All Connections</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Payment Status Select */}
          {currentUser.role !== 'Sub Admin' && (
            <div>
              <select
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 text-xs outline-none transition-all focus:border-primary focus:bg-card"
              >
                <option value="All">All Payments</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Customers Data Grid */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          /* Loading Skeletor State */
          <div className="p-8 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground font-medium">Fetching customer directory...</span>
          </div>
        ) : paginatedCustomers.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto max-h-[580px] overflow-y-auto scrollbar-thin">
              <table className="w-full text-left border-collapse relative">
                <thead>
                  <tr className="border-b border-border bg-secondary/15 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th onClick={() => handleSort('id')} className="p-4 cursor-pointer hover:bg-secondary/40 select-none sticky top-0 bg-card/90 backdrop-blur-md z-15 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.07)] transition-all">
                      <div className="flex items-center gap-1">
                        <span>Customer ID</span>
                        <ArrowUpDown className={`h-3 w-3 ${sortField === 'id' ? 'text-primary font-bold' : 'text-slate-400'}`} />
                      </div>
                    </th>
                    <th onClick={() => handleSort('name')} className="p-4 cursor-pointer hover:bg-secondary/40 select-none sticky top-0 bg-card/90 backdrop-blur-md z-15 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.07)] transition-all">
                      <div className="flex items-center gap-1">
                        <span>Customer Name</span>
                        <ArrowUpDown className={`h-3 w-3 ${sortField === 'name' ? 'text-primary font-bold' : 'text-slate-400'}`} />
                      </div>
                    </th>
                    <th className="p-4 sticky top-0 bg-card/90 backdrop-blur-md z-15 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.07)]">Package</th>
                    <th onClick={() => handleSort('monthlyCharges')} className="p-4 cursor-pointer hover:bg-secondary/40 select-none text-right sticky top-0 bg-card/90 backdrop-blur-md z-15 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.07)] transition-all">
                      <div className="flex items-center justify-end gap-1">
                        <span>Charges</span>
                        <ArrowUpDown className={`h-3 w-3 ${sortField === 'monthlyCharges' ? 'text-primary font-bold' : 'text-slate-400'}`} />
                      </div>
                    </th>
                    <th className="p-4 sticky top-0 bg-card/90 backdrop-blur-md z-15 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.07)]">Area &amp; Contact</th>
                    <th onClick={() => handleSort('connectionDate')} className="p-4 cursor-pointer hover:bg-secondary/40 select-none sticky top-0 bg-card/90 backdrop-blur-md z-15 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.07)] transition-all">
                      <div className="flex items-center gap-1">
                        <span>Joined Date</span>
                        <ArrowUpDown className={`h-3 w-3 ${sortField === 'connectionDate' ? 'text-primary font-bold' : 'text-slate-400'}`} />
                      </div>
                    </th>
                    <th className="p-4 sticky top-0 bg-card/90 backdrop-blur-md z-15 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.07)]">Payment</th>
                    <th className="p-4 sticky top-0 bg-card/90 backdrop-blur-md z-15 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.07)]">Status</th>
                    <th className="p-4 text-center sticky top-0 bg-card/90 backdrop-blur-md z-15 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.07)]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {paginatedCustomers.map((c) => (
                    <motion.tr 
                      key={c.id} 
                      className="hover:bg-secondary/15 transition-all duration-200"
                      whileHover={{ y: -0.5 }}
                    >
                      <td className="p-4 font-semibold text-indigo-500">
                        <Link href={`/customers/${c.id}`} className="hover:underline hover:text-indigo-600 transition-colors">
                          {c.id}
                        </Link>
                      </td>
                      <td className="p-4">
                        <Link href={`/customers/${c.id}`} className="font-semibold text-foreground hover:underline hover:text-primary transition-colors">
                          {c.name}
                        </Link>
                      </td>
                      <td className="p-4 text-xs font-medium max-w-[150px] truncate">{c.packageName}</td>
                      <td className="p-4 text-right font-bold text-slate-700 dark:text-slate-300">PKR {c.monthlyCharges}</td>
                      <td className="p-4">
                        <div className="text-xs font-semibold text-foreground">{c.phone}</div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-[160px]">{c.address}</div>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">{c.connectionDate}</td>
                      <td className="p-4">
                        <StatusBadge status={c.paymentStatus} />
                      </td>
                      <td className="p-4">
                        <StatusBadge status={c.connectionStatus} />
                      </td>
                      <td className="p-4 relative text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuRowId(activeMenuRowId === c.id ? null : c.id);
                          }}
                          className="mx-auto h-8 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-border dark:hover:bg-secondary text-xs font-semibold flex items-center justify-center gap-1 transition-all hover:scale-105 active:scale-95"
                        >
                          <span>Actions</span>
                          <span className="text-[9px] text-slate-400">▼</span>
                        </button>

                        <AnimatePresence>
                          {activeMenuRowId === c.id && (
                            <>
                              {/* Close menu overlay */}
                              <div className="fixed inset-0 z-30" onClick={() => setActiveMenuRowId(null)} />
                              
                              {/* Dropdown Card */}
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                className="absolute right-4 mt-1 z-40 w-44 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card p-1 shadow-lg text-left"
                              >
                                <button
                                  onClick={() => {
                                    router.push(`/customers/${c.id}`);
                                    setActiveMenuRowId(null);
                                  }}
                                  className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-secondary transition-colors"
                                >
                                  View Profile
                                </button>
                                <button
                                  onClick={() => {
                                    router.push(`/customers/${c.id}?tab=notes`);
                                    setActiveMenuRowId(null);
                                  }}
                                  className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-secondary transition-colors"
                                >
                                  Edit Details
                                </button>
                                <button
                                  onClick={() => {
                                    openRecharge(c.id);
                                    setActiveMenuRowId(null);
                                  }}
                                  className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                >
                                  Update Bill
                                </button>
                                <button
                                  onClick={() => {
                                    router.push(`/payments?customerId=${c.id}`);
                                    setActiveMenuRowId(null);
                                  }}
                                  className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-secondary transition-colors"
                                >
                                  Payment History
                                </button>
                                {c.connectionStatus === 'Active' ? (
                                  <button
                                    onClick={() => {
                                      setConfirmDialog({
                                        isOpen: true,
                                        type: 'suspend',
                                        customerId: c.id,
                                        customerName: c.name,
                                      });
                                      setActiveMenuRowId(null);
                                    }}
                                    className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-450 hover:bg-amber-50/50 dark:hover:bg-amber-500/10 transition-colors"
                                  >
                                    Suspend Connection
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setConfirmDialog({
                                        isOpen: true,
                                        type: 'activate',
                                        customerId: c.id,
                                        customerName: c.name,
                                      });
                                      setActiveMenuRowId(null);
                                    }}
                                    className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-450 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10 transition-colors"
                                  >
                                    Activate Connection
                                  </button>
                                )}
                                <div className="h-px bg-slate-100 dark:bg-border my-1" />
                                <button
                                  onClick={() => {
                                    setConfirmDialog({
                                      isOpen: true,
                                      type: 'delete',
                                      customerId: c.id,
                                      customerName: c.name,
                                    });
                                    setActiveMenuRowId(null);
                                  }}
                                  className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                >
                                  Delete Client
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View: Compact vertical list layout, no large cards */}
            <div className="md:hidden divide-y divide-border overflow-y-auto scrollbar-none">
              {paginatedCustomers.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3.5 hover:bg-secondary/15 transition-all duration-150 gap-3">
                  {/* Left part: ID & Name, Package & Contact info */}
                  <div className="flex-1 min-w-0 space-y-1 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-1 rounded">
                        {c.id}
                      </span>
                      <Link href={`/customers/${c.id}`} className="font-semibold text-foreground hover:underline text-xs truncate block">
                        {c.name}
                      </Link>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                      <span className="truncate max-w-[100px]">{c.packageName}</span>
                      <span>•</span>
                      <span>{c.phone}</span>
                    </div>
                  </div>

                  {/* Middle part: Status Badges (Payment Status & Connection Status) */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <StatusBadge status={c.paymentStatus} />
                    <StatusBadge status={c.connectionStatus} />
                  </div>

                  {/* Right part: Actions Trigger */}
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuRowId(activeMenuRowId === c.id ? null : c.id);
                      }}
                      className="h-8 w-8 rounded-lg border border-border flex items-center justify-center bg-card hover:bg-secondary text-xs transition-colors hover:scale-105 active:scale-95"
                    >
                      <span className="text-[9px]">▼</span>
                    </button>

                    <AnimatePresence>
                      {activeMenuRowId === c.id && (
                        <>
                          <div className="fixed inset-0 z-35" onClick={() => setActiveMenuRowId(null)} />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -8 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className="absolute right-0 bottom-10 z-40 w-44 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card p-1 shadow-lg text-left"
                          >
                            <button
                              onClick={() => {
                                router.push(`/customers/${c.id}`);
                                setActiveMenuRowId(null);
                              }}
                              className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-secondary transition-colors"
                            >
                              View Profile
                            </button>
                            <button
                              onClick={() => {
                                router.push(`/customers/${c.id}?tab=notes`);
                                setActiveMenuRowId(null);
                              }}
                              className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-secondary transition-colors"
                            >
                              Edit Details
                            </button>
                            <button
                              onClick={() => {
                                openRecharge(c.id);
                                setActiveMenuRowId(null);
                              }}
                              className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                            >
                              Update Bill
                            </button>
                            <button
                              onClick={() => {
                                router.push(`/payments?customerId=${c.id}`);
                                setActiveMenuRowId(null);
                              }}
                              className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-secondary transition-colors"
                            >
                              Payment History
                            </button>
                            {c.connectionStatus === 'Active' ? (
                              <button
                                onClick={() => {
                                  setConfirmDialog({
                                    isOpen: true,
                                    type: 'suspend',
                                    customerId: c.id,
                                    customerName: c.name,
                                  });
                                  setActiveMenuRowId(null);
                                }}
                                className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-455 hover:bg-amber-50/50 dark:hover:bg-amber-500/10 transition-colors"
                              >
                                Suspend Connection
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setConfirmDialog({
                                    isOpen: true,
                                    type: 'activate',
                                    customerId: c.id,
                                    customerName: c.name,
                                  });
                                  setActiveMenuRowId(null);
                                }}
                                className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-455 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10 transition-colors"
                              >
                                Activate Connection
                              </button>
                            )}
                            <div className="h-px bg-slate-100 dark:bg-border my-1" />
                            <button
                              onClick={() => {
                                  setConfirmDialog({
                                    isOpen: true,
                                    type: 'delete',
                                    customerId: c.id,
                                    customerName: c.name,
                                  });
                                  setActiveMenuRowId(null);
                              }}
                              className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                            >
                              Delete Client
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="p-12 text-center">
            <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-bold">No customers found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              We couldn&apos;t find any records matching your search queries or filter requirements.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setAreaFilter('All');
                setStatusFilter('All');
                setPaymentFilter('All');
              }}
              className="mt-4 text-xs font-semibold text-primary hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Pagination bar */}
        {!loading && filteredCustomers.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3.5 bg-secondary/10">
            <span className="text-xs text-muted-foreground font-medium">
              Showing <span className="font-semibold text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-semibold text-foreground">
                {Math.min(currentPage * itemsPerPage, filteredCustomers.length)}
              </span>{' '}
              of <span className="font-semibold text-foreground">{filteredCustomers.length}</span> clients
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center justify-center h-8 w-8 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="flex items-center justify-center px-3 text-xs font-semibold">
                Page {currentPage} of {totalPages}
              </span>
              <button
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

      {/* Confirmation Modals / Dialogs */}
      <AnimatePresence>
        {confirmDialog?.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDialog(null)}
              className="absolute inset-0 bg-black"
            />
            {/* Dialog Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl z-10 space-y-4"
            >
              <div className="flex items-start gap-3 text-rose-500">
                <div className={`p-2 rounded-xl ${
                  confirmDialog.type === 'suspend' ? 'bg-amber-500/10 text-amber-500' :
                  confirmDialog.type === 'activate' ? 'bg-emerald-500/10 text-emerald-500' :
                  'bg-rose-500/10 text-rose-500'
                }`}>
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground capitalize">
                    {confirmDialog.type} Customer Account
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-normal">
                    Are you sure you want to {confirmDialog.type} connection and billing details for{' '}
                    <span className="font-semibold text-foreground">{confirmDialog.customerName}</span> (
                    {confirmDialog.customerId})?
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="h-9 px-4 rounded-xl border border-border text-xs font-semibold hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  className={`h-9 px-4 rounded-xl text-xs font-semibold text-white shadow-sm transition-all ${
                    confirmDialog.type === 'suspend' ? 'bg-amber-500 hover:bg-amber-600' :
                    confirmDialog.type === 'activate' ? 'bg-emerald-600 hover:bg-emerald-700' :
                    'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
