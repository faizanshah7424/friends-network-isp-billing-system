'use client';

import React, { useState, useMemo } from 'react';
import { useBillingSystem } from '@/lib/context';
import { Customer } from '@/types';
import {
  Search,
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
  Check,
  UserX,
  UserCheck,
  PackageCheck,
  MapPin,
  FileText,
  Send,
  MessageSquare,
  Download,
  AlertTriangle,
  RotateCcw,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StatusBadge from '@/components/StatusBadge';

type BulkActionType =
  | 'payment'
  | 'active'
  | 'inactive'
  | 'package'
  | 'area'
  | 'expiry'
  | 'note'
  | 'whatsapp'
  | 'sms'
  | 'export'
  | 'delete';

export default function BulkActionsPage() {
  const { customers, packages, updateCustomer, deleteCustomer, addBulkPayments } = useBillingSystem();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');

  // Selected customer IDs
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Active bulk action tab
  const [activeAction, setActiveAction] = useState<BulkActionType>('payment');

  // Action Form Configurations
  // 1. Payment Action States
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank' | 'JazzCash' | 'EasyPaisa'>('Cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, number>>({});

  // 2. Package Change States
  const [selectedPackageId, setSelectedPackageId] = useState('');

  // 3. Area Assignment States
  const [newArea, setNewArea] = useState('');

  // 4. Expiry / Connection Date States
  const [newExpiryDate, setNewExpiryDate] = useState(() => new Date().toISOString().split('T')[0]);

  // 5. Custom Note States
  const [customNote, setCustomNote] = useState('');

  // Pagination state for Left Table
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal execution & Undo states
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    step: 'confirm' | 'progress' | 'success' | 'undoing';
    progress: number;
    currentUserIndex: number;
    currentCustomerName: string;
    successMessage: string;
  }>({
    isOpen: false,
    step: 'confirm',
    progress: 0,
    currentUserIndex: 0,
    currentCustomerName: '',
    successMessage: '',
  });

  const [originalCustomersBackup, setOriginalCustomersBackup] = useState<Customer[]>([]);

  // Unique areas for filter dropdown
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

    if (statusFilter !== 'All') {
      result = result.filter((c) => c.connectionStatus === statusFilter);
    }

    if (paymentFilter !== 'All') {
      result = result.filter((c) => c.paymentStatus === paymentFilter);
    }

    return result;
  }, [customers, searchTerm, areaFilter, statusFilter, paymentFilter]);

  // Paginated customer list
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  // Check if all filtered customers are selected
  const isAllFilteredSelected = useMemo(() => {
    if (filteredCustomers.length === 0) return false;
    return filteredCustomers.every((c) => selectedIds.includes(c.id));
  }, [filteredCustomers, selectedIds]);

  // Select/Deselect all filtered customers (manages selectedIds and paymentAmounts inline)
  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      // Remove all filtered IDs from selected list
      const filteredIds = filteredCustomers.map((c) => c.id);
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
      
      // Also remove them from paymentAmounts
      setPaymentAmounts((prev) => {
        const updated = { ...prev };
        filteredIds.forEach((id) => {
          delete updated[id];
        });
        return updated;
      });
    } else {
      // Add all filtered IDs to selected list
      const toAdd = filteredCustomers.map((c) => c.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...toAdd])));

      // Also add their default amounts to paymentAmounts
      setPaymentAmounts((prev) => {
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

  // Toggle single selection (manages selectedIds and paymentAmounts inline)
  const handleToggleSelect = (customerId: string) => {
    setSelectedIds((prev) => {
      const isSelected = prev.includes(customerId);
      if (isSelected) {
        setPaymentAmounts((prevAmt) => {
          const updated = { ...prevAmt };
          delete updated[customerId];
          return updated;
        });
        return prev.filter((id) => id !== customerId);
      } else {
        const cust = customers.find((c) => c.id === customerId);
        if (cust) {
          setPaymentAmounts((prevAmt) => ({
            ...prevAmt,
            [customerId]: cust.outstandingBalance > 0 ? cust.outstandingBalance : cust.monthlyCharges,
          }));
        }
        return [...prev, customerId];
      }
    });
  };

  // Payment amount change
  const handleAmountChange = (customerId: string, amount: number) => {
    setPaymentAmounts((prev) => ({
      ...prev,
      [customerId]: Math.max(0, amount),
    }));
  };

  // Selection list converted to details
  const selectedDetails = useMemo(() => {
    return selectedIds
      .map((id) => {
        const customer = customers.find((c) => c.id === id);
        return customer ? { customer } : null;
      })
      .filter((item): item is { customer: Customer } => item !== null);
  }, [selectedIds, customers]);

  // Total calculated payment received
  const totalAmountReceived = useMemo(() => {
    return Object.values(paymentAmounts).reduce((sum, amt) => sum + amt, 0);
  }, [paymentAmounts]);

  // Execute Action triggered from the configurations panel
  const triggerActionModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;

    // Open confirm state first
    setModalState({
      isOpen: true,
      step: 'confirm',
      progress: 0,
      currentUserIndex: 0,
      currentCustomerName: '',
      successMessage: '',
    });
  };

  // Sequentially process each customer and apply modifications
  const handleConfirmAndExecute = () => {
    // 1. Make a deep backup copy of selected customers' original states before applying any update
    if (activeAction !== 'delete' && activeAction !== 'export') {
      const backup = customers
        .filter((c) => selectedIds.includes(c.id))
        .map((c) => JSON.parse(JSON.stringify(c)));
      setOriginalCustomersBackup(backup);
    }

    // Special quick exit for export
    if (activeAction === 'export') {
      handleExportSelectedCSV();
      setModalState({
        isOpen: true,
        step: 'success',
        progress: 100,
        currentUserIndex: selectedIds.length,
        currentCustomerName: '',
        successMessage: `Successfully exported ${selectedIds.length} customer records to CSV.`,
      });
      setSelectedIds([]);
      return;
    }

    // 2. Set progress state
    setModalState((prev) => ({
      ...prev,
      step: 'progress',
      progress: 0,
      currentUserIndex: 0,
    }));

    const total = selectedIds.length;
    let index = 0;

    // Action A: Payments (recorded in batch using addBulkPayments)
    if (activeAction === 'payment') {
      const paymentsData = selectedIds.map((id) => {
        const cust = customers.find((c) => c.id === id)!;
        const amount = paymentAmounts[id] !== undefined ? paymentAmounts[id] : (cust.outstandingBalance > 0 ? cust.outstandingBalance : cust.monthlyCharges);
        const defaultAmount = cust.outstandingBalance > 0 ? cust.outstandingBalance : cust.monthlyCharges;
        const isCustom = amount !== defaultAmount;
        return {
          customerId: cust.id,
          customerName: cust.name,
          amountReceived: amount,
          paymentMethod,
          referenceNumber: referenceNumber || undefined,
          paymentDate: `${paymentDate} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          billingMonth: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
          notes: remarks || undefined,
          paymentType: (isCustom ? 'custom' : 'package') as 'package' | 'custom',
          customReason: isCustom ? 'Partial Payment' as const : undefined,
          packagePrice: cust.monthlyCharges,
        };
      });

      // Visual simulation of progressive updates
      const interval = setInterval(() => {
        if (index >= total) {
          clearInterval(interval);
          // Apply bulk payments to context
          addBulkPayments(paymentsData);
          setModalState((prev) => ({
            ...prev,
            step: 'success',
            progress: 100,
            successMessage: `Successfully recorded payments for ${total} customers. Total PKR ${totalAmountReceived.toLocaleString()} received and invoices updated.`,
          }));
          setSelectedIds([]);
          setRemarks('');
          setReferenceNumber('');
          return;
        }

        const currentId = selectedIds[index];
        const cust = customers.find((c) => c.id === currentId);
        setModalState((prev) => ({
          ...prev,
          progress: Math.round(((index + 1) / total) * 100),
          currentUserIndex: index + 1,
          currentCustomerName: cust?.name || '',
        }));
        index++;
      }, 200);
      return;
    }

    // Action B: Other updates (updates customers sequentially in a simulated loop)
    const interval = setInterval(() => {
      if (index >= total) {
        clearInterval(interval);
        setModalState((prev) => ({
          ...prev,
          step: 'success',
          progress: 100,
          successMessage: getSuccessMessageText(total),
        }));
        setSelectedIds([]);
        return;
      }

      const currentId = selectedIds[index];
      const cust = customers.find((c) => c.id === currentId);
      if (cust) {
        setModalState((prev) => ({
          ...prev,
          progress: Math.round(((index + 1) / total) * 100),
          currentUserIndex: index + 1,
          currentCustomerName: cust.name,
        }));

        // Call helper to apply change
        applyActionToCustomer(cust);
      }
      index++;
    }, 200);
  };

  // Helper: Apply action logic per customer
  const applyActionToCustomer = (customer: Customer) => {
    switch (activeAction) {
      case 'active':
        updateCustomer({
          ...customer,
          connectionStatus: 'Active',
          timeline: [
            {
              id: `t-${Date.now()}`,
              title: 'Bulk Status Updated',
              description: 'Connection manually activated via Bulk Actions Hub.',
              date: new Date().toISOString().split('T')[0],
              type: 'success',
            },
            ...customer.timeline,
          ],
        });
        break;
      case 'inactive':
        updateCustomer({
          ...customer,
          connectionStatus: 'Inactive',
          timeline: [
            {
              id: `t-${Date.now()}`,
              title: 'Bulk Status Suspended',
              description: 'Connection manually suspended/deactivated via Bulk Actions Hub.',
              date: new Date().toISOString().split('T')[0],
              type: 'error',
            },
            ...customer.timeline,
          ],
        });
        break;
      case 'package': {
        const pkg = packages.find((p) => p.id === (selectedPackageId || (packages[0]?.id ?? '')));
        if (pkg) {
          updateCustomer({
            ...customer,
            packageId: pkg.id,
            packageName: pkg.name,
            monthlyCharges: pkg.monthlyCharges,
            timeline: [
              {
                id: `t-${Date.now()}`,
                title: 'Bulk Package Changed',
                description: `Package changed to ${pkg.name} (${pkg.speed}) with monthly charges PKR ${pkg.monthlyCharges} via Bulk Actions Hub.`,
                date: new Date().toISOString().split('T')[0],
                type: 'info',
              },
              ...customer.timeline,
            ],
          });
        }
        break;
      }
      case 'area':
        updateCustomer({
          ...customer,
          area: newArea,
          timeline: [
            {
              id: `t-${Date.now()}`,
              title: 'Bulk Area Reassigned',
              description: `Area updated to "${newArea}" via Bulk Actions Hub.`,
              date: new Date().toISOString().split('T')[0],
              type: 'info',
            },
            ...customer.timeline,
          ],
        });
        break;
      case 'expiry':
        updateCustomer({
          ...customer,
          connectionDate: newExpiryDate,
          timeline: [
            {
              id: `t-${Date.now()}`,
              title: 'Bulk Billing Date Reset',
              description: `Connection start date reset to ${newExpiryDate} via Bulk Actions Hub.`,
              date: new Date().toISOString().split('T')[0],
              type: 'info',
            },
            ...customer.timeline,
          ],
        });
        break;
      case 'note':
        const noteId = `note-${Date.now()}`;
        const newNoteItem = {
          id: noteId,
          text: customNote,
          date: new Date().toISOString().split('T')[0],
          author: 'Muhammad Shahid',
        };
        updateCustomer({
          ...customer,
          notes: [newNoteItem, ...customer.notes],
          timeline: [
            {
              id: `t-${Date.now()}`,
              title: 'Bulk Note Added',
              description: `Added client note: "${customNote}" via Bulk Actions Hub.`,
              date: new Date().toISOString().split('T')[0],
              type: 'info',
            },
            ...customer.timeline,
          ],
        });
        break;
      case 'delete':
        deleteCustomer(customer.id);
        break;
      default:
        break;
    }
  };

  // Undo operation (fully restores updated customers to backup states)
  const handleUndoAction = () => {
    setModalState((prev) => ({
      ...prev,
      step: 'undoing',
      progress: 0,
    }));

    const total = originalCustomersBackup.length;
    if (total === 0) return;
    let index = 0;

    const interval = setInterval(() => {
      if (index >= total) {
        clearInterval(interval);
        setModalState((prev) => ({
          ...prev,
          isOpen: false,
        }));
        // Reset backup
        setOriginalCustomersBackup([]);
        return;
      }

      const backupCust = originalCustomersBackup[index];
      updateCustomer(backupCust);

      setModalState((prev) => ({
        ...prev,
        progress: Math.round(((index + 1) / total) * 100),
        currentCustomerName: backupCust.name,
      }));
      index++;
    }, 200);
  };

  // Success summary text generator
  const getSuccessMessageText = (total: number) => {
    switch (activeAction) {
      case 'active':
        return `Successfully activated connection status for ${total} customers.`;
      case 'inactive':
        return `Successfully suspended connection status for ${total} customers.`;
      case 'package': {
        const pkg = packages.find((p) => p.id === (selectedPackageId || (packages[0]?.id ?? '')));
        return `Successfully assigned the package "${pkg?.name || 'New Package'}" to ${total} customers.`;
      }
      case 'area':
        return `Successfully assigned area "${newArea}" to ${total} customers.`;
      case 'expiry':
        return `Successfully reset billing/connection date to ${newExpiryDate} for ${total} customers.`;
      case 'note':
        return `Successfully appended a note and logged a timeline event for ${total} customers.`;
      case 'delete':
        return `Permanently deleted profile details for ${total} customers.`;
      case 'whatsapp':
        return `WhatsApp reminders successfully queued for ${total} customers (UI simulation).`;
      case 'sms':
        return `SMS billing reminders successfully queued for ${total} customers (UI simulation).`;
      default:
        return `Bulk action completed successfully for ${total} customers.`;
    }
  };

  // Instant export function
  const handleExportSelectedCSV = () => {
    if (selectedIds.length === 0) return;
    const exportCusts = customers.filter((c) => selectedIds.includes(c.id));
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

    const rows = exportCusts.map((c) => [
      c.customerId || c.id,
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
    link.setAttribute('download', `FN_BulkExport_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const actionList: { type: BulkActionType; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
    { type: 'payment', label: 'Record Payment', icon: CreditCard, color: 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10' },
    { type: 'package', label: 'Change Package', icon: PackageCheck, color: 'text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/10' },
    { type: 'active', label: 'Mark Active', icon: UserCheck, color: 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10' },
    { type: 'inactive', label: 'Mark Inactive', icon: UserX, color: 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10' },
    { type: 'area', label: 'Assign Area', icon: MapPin, color: 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10' },
    { type: 'expiry', label: 'Update Expiry Date', icon: Calendar, color: 'text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-500/10' },
    { type: 'note', label: 'Add Note', icon: FileText, color: 'text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-500/10' },
    { type: 'whatsapp', label: 'WhatsApp Reminder', icon: MessageSquare, color: 'text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10' },
    { type: 'sms', label: 'SMS Reminder', icon: Send, color: 'text-blue-450 hover:bg-blue-50 dark:hover:bg-blue-500/10' },
    { type: 'export', label: 'Export Selected', icon: Download, color: 'text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-500/10' },
    { type: 'delete', label: 'Delete Selected', icon: Trash2, color: 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 border-t border-border mt-2 pt-2' },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Title */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
          <span>Payments</span>
          <span>/</span>
          <span className="text-foreground">Bulk Actions</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">Bulk Actions Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1 max-w-3xl">
          Evolve from simple collections to enterprise-grade operations. Select multiple customers and apply connection updates, billing payments, packages, and notes in batch.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5 items-start">
        {/* Left Column: Customer Selection Grid */}
        <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-5 shadow-sm space-y-5">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <h3 className="font-bold text-base flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <User className="h-5 w-5 text-primary" />
              <span>Select Customers</span>
            </h3>
            <span className="text-xs text-muted-foreground font-bold bg-secondary px-2.5 py-1 rounded-full">
              {filteredCustomers.length} Records Found
            </span>
          </div>

          {/* Filters Dashboard */}
          <div className="bg-secondary/10 rounded-xl p-3.5 border border-border/50 space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
              <span>Search &amp; Filter Columns</span>
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search name, ID, phone..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-xs outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>

              {/* Area select */}
              <div>
                <select
                  value={areaFilter}
                  onChange={(e) => {
                    setAreaFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 w-full rounded-lg border border-border bg-card px-2 text-xs outline-none transition-all focus:border-primary"
                >
                  <option value="All">All Areas</option>
                  {areas.filter((a) => a !== 'All').map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              {/* Connection Status select */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 w-full rounded-lg border border-border bg-card px-2 text-xs outline-none transition-all focus:border-primary"
                >
                  <option value="All">All Connections</option>
                  <option value="Active">Active Only</option>
                  <option value="Inactive">Inactive Only</option>
                </select>
              </div>

              {/* Payment status select */}
              <div className="sm:col-span-2 lg:col-span-3">
                <select
                  value={paymentFilter}
                  onChange={(e) => {
                    setPaymentFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 w-full rounded-lg border border-border bg-card px-2 text-xs outline-none transition-all focus:border-primary"
                >
                  <option value="All">All Payment States</option>
                  <option value="Paid">Paid Only</option>
                  <option value="Unpaid">Unpaid Only</option>
                  <option value="Pending">Pending Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Toggle All Selection bar */}
          {filteredCustomers.length > 0 && (
            <div className="flex items-center justify-between bg-slate-55 border border-slate-100 dark:bg-secondary/20 dark:border-border p-3 rounded-xl select-none">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                {selectedIds.length} Customers Selected
              </span>
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline hover:scale-105 active:scale-95 transition-all"
              >
                {isAllFilteredSelected ? (
                  <>
                    <CheckSquare className="h-4.5 w-4.5" />
                    <span>Deselect All Filtered</span>
                  </>
                ) : (
                  <>
                    <Square className="h-4.5 w-4.5" />
                    <span>Select All Filtered</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Customer directory table */}
          {paginatedCustomers.length > 0 ? (
            <div className="overflow-hidden border border-border rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/10 text-muted-foreground uppercase font-bold">
                    <th className="p-3 text-center w-12">Select</th>
                    <th className="p-3">Customer Details</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Outstanding</th>
                    <th className="p-3 text-right">Monthly rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedCustomers.map((c) => {
                    const isSelected = selectedIds.includes(c.id);
                    return (
                      <tr
                        key={c.id}
                        onClick={() => handleToggleSelect(c.id)}
                        className={`cursor-pointer hover:bg-secondary/15 transition-all select-none ${
                          isSelected ? 'bg-primary/5 dark:bg-primary/10' : ''
                        }`}
                      >
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(c.id)}
                            className="h-4.5 w-4.5 rounded border-slate-350 dark:border-border text-primary focus:ring-primary"
                          />
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-slate-800 dark:text-slate-200">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground font-semibold">
                            {c.customerId || c.id} • {c.area} • {c.packageName}
                          </p>
                        </td>
                        <td className="p-3 space-y-1">
                          <div className="flex flex-col gap-0.5 scale-90 origin-left">
                            <StatusBadge status={c.connectionStatus} />
                            <StatusBadge status={c.paymentStatus} />
                          </div>
                        </td>
                        <td className="p-3 text-right font-bold text-rose-500">
                          PKR {c.outstandingBalance}
                        </td>
                        <td className="p-3 text-right font-semibold text-slate-600 dark:text-slate-400">
                          PKR {c.monthlyCharges}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 border border-dashed border-border rounded-xl text-center text-xs text-muted-foreground">
              No customers match your search criteria.
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

        {/* Right Column: Actions Workspace */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-5">
            <div className="border-b border-border pb-3 flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <Layers className="h-5 w-5 text-primary" />
                <span>Bulk Action Hub ({selectedIds.length})</span>
              </h3>
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="text-xs font-bold text-rose-500 hover:underline hover:scale-105 transition-all"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Actions Grid Selector */}
            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                Choose Operation
              </span>
              
              <div className="grid grid-cols-1 gap-1">
                {actionList.map((act) => {
                  const Icon = act.icon;
                  const isActive = activeAction === act.type;
                  return (
                    <button
                      key={act.type}
                      type="button"
                      onClick={() => setActiveAction(act.type)}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                          : act.color
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5 flex-shrink-0" />
                      <span>{act.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom configurations forms based on activeAction */}
            {selectedIds.length > 0 ? (
              <form onSubmit={triggerActionModal} className="space-y-4 border-t border-border pt-4 text-left">
                
                {/* 1. Record Payments Form */}
                {activeAction === 'payment' && (
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Record Batch Payments Worksheet
                    </span>

                    {/* Quick Selected Customers Payments rates list */}
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1 bg-slate-50 dark:bg-secondary/30 p-2.5 rounded-xl border border-border/50">
                      {selectedDetails.map(({ customer }) => {
                        const amt = paymentAmounts[customer.id] !== undefined ? paymentAmounts[customer.id] : (customer.outstandingBalance > 0 ? customer.outstandingBalance : customer.monthlyCharges);
                        return (
                          <div key={customer.id} className="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5 last:border-0 last:pb-0">
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-[11px] text-slate-800 dark:text-slate-350 truncate">{customer.name}</p>
                              <p className="text-[9px] text-muted-foreground font-semibold">Bal: PKR {customer.outstandingBalance}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] text-slate-400 font-bold uppercase">PKR</span>
                              <input
                                type="number"
                                required
                                value={amt || ''}
                                onChange={(e) => handleAmountChange(customer.id, parseInt(e.target.value) || 0)}
                                className="h-7 w-20 rounded border border-border bg-card text-right font-bold text-[11px] px-1 focus:border-primary outline-none"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          Payment Method *
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as 'Cash' | 'Bank' | 'JazzCash' | 'EasyPaisa')}
                          required
                          className="h-9 w-full rounded-lg border border-border bg-card px-2 text-xs outline-none focus:border-primary"
                        >
                          <option value="Cash">Cash</option>
                          <option value="Bank">Bank Transfer</option>
                          <option value="JazzCash">JazzCash</option>
                          <option value="EasyPaisa">EasyPaisa</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          Payment Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                          className="h-9 w-full rounded-lg border border-border bg-card px-2 text-xs outline-none focus:border-primary"
                        />
                      </div>

                      {paymentMethod !== 'Cash' && (
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                            Reference Number / ID *
                          </label>
                          <input
                            type="text"
                            required
                            value={referenceNumber}
                            onChange={(e) => setReferenceNumber(e.target.value)}
                            placeholder="e.g. Bank slip or transaction ID"
                            className="h-9 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none focus:border-primary"
                          />
                        </div>
                      )}

                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          Audit Remarks
                        </label>
                        <textarea
                          rows={2}
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="Audit description..."
                          className="w-full rounded-lg border border-border bg-card p-2 text-xs outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="bg-emerald-500/[0.04] border border-emerald-100 dark:border-emerald-500/10 rounded-xl p-3 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[9px] font-bold uppercase text-emerald-600">Bulk Collection Total</span>
                        <p className="text-[9px] text-slate-400 mt-0.5">Staff: Muhammad Shahid</p>
                      </div>
                      <span className="text-base font-black text-emerald-600">
                        PKR {totalAmountReceived.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* 2. Change ISP Package Form */}
                {activeAction === 'package' && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Change ISP Connection Package
                    </span>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        Select New Package *
                      </label>
                      <select
                        value={selectedPackageId || (packages[0]?.id ?? '')}
                        onChange={(e) => setSelectedPackageId(e.target.value)}
                        required
                        className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs outline-none focus:border-primary"
                      >
                        <optgroup label="Social Media Packages">
                          {packages.filter((p) => p.category === 'Social Media').map((pkg) => (
                            <option key={pkg.id} value={pkg.id}>
                              {pkg.name} ({pkg.speed}) - PKR {pkg.monthlyCharges}/mo
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Standard Packages">
                          {packages.filter((p) => p.category === 'Standard').map((pkg) => (
                            <option key={pkg.id} value={pkg.id}>
                              {pkg.name} ({pkg.speed}) - PKR {pkg.monthlyCharges}/mo
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Static IP Packages">
                          {packages.filter((p) => p.category === 'Static IP').map((pkg) => (
                            <option key={pkg.id} value={pkg.id}>
                              {pkg.name} ({pkg.speed}) - PKR {pkg.monthlyCharges}/mo
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      Applying this change will update the package name and monthly rate for all selected customer accounts. Note events will be added to customer timelines.
                    </p>
                  </div>
                )}

                {/* 3. Mark Active Info */}
                {activeAction === 'active' && (
                  <div className="space-y-2 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                    <h4 className="text-xs font-bold text-emerald-700">Activate Connection Accounts</h4>
                    <p className="text-[11px] text-emerald-600/90 leading-normal">
                      This will manually activate the connection status for {selectedIds.length} selected customers and record activation entries in their timelines.
                    </p>
                  </div>
                )}

                {/* 4. Mark Inactive Info */}
                {activeAction === 'inactive' && (
                  <div className="space-y-2 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                    <h4 className="text-xs font-bold text-amber-700">Suspend Connection Accounts</h4>
                    <p className="text-[11px] text-amber-600/90 leading-normal">
                      This will manually deactivate/suspend connection services for the {selectedIds.length} selected customers.
                    </p>
                  </div>
                )}

                {/* 5. Assign Area Form */}
                {activeAction === 'area' && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Assign New Distribution Area
                    </span>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        New Area Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newArea}
                        onChange={(e) => setNewArea(e.target.value)}
                        placeholder="e.g. Sector G-11, Block-D"
                        className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                )}

                {/* 6. Expiry / Billing Date Form */}
                {activeAction === 'expiry' && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Reset Billing Date Cycle
                    </span>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        Billing Start Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={newExpiryDate}
                        onChange={(e) => setNewExpiryDate(e.target.value)}
                        className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      Updates connection start cycle. Expiry calculations are relative to this date.
                    </p>
                  </div>
                )}

                {/* 7. Add Custom Note Form */}
                {activeAction === 'note' && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Add Custom Note
                    </span>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        Note Content *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={customNote}
                        onChange={(e) => setCustomNote(e.target.value)}
                        placeholder="Type customer account notes..."
                        className="w-full rounded-xl border border-border bg-card p-3 text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                )}

                {/* 8. WhatsApp Placeholder */}
                {activeAction === 'whatsapp' && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Send WhatsApp Billing Reminder
                    </span>
                    <div className="p-3 bg-secondary/20 rounded-xl border border-border/50 text-[11px] font-mono text-slate-600 dark:text-slate-400 leading-normal">
                      <p className="font-bold text-slate-800 dark:text-slate-200 border-b border-border/50 pb-1.5 mb-1.5 uppercase text-[9px] tracking-wider">
                        Template Preview
                      </p>
                      Dear Customer, this is a friendly reminder from Friends Network. Your ISP internet service payment is due. Please settle your bill promptly to avoid automatic connection deactivation. Thank you.
                    </div>
                    <p className="text-[11px] text-slate-400">
                      * Integration placeholder. Sends a batch notification queue.
                    </p>
                  </div>
                )}

                {/* 9. SMS Reminder Placeholder */}
                {activeAction === 'sms' && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Send SMS Billing Reminder
                    </span>
                    <div className="p-3 bg-secondary/20 rounded-xl border border-border/50 text-[11px] font-mono text-slate-600 dark:text-slate-400 leading-normal">
                      <p className="font-bold text-slate-800 dark:text-slate-200 border-b border-border/50 pb-1.5 mb-1.5 uppercase text-[9px] tracking-wider">
                        Template Preview
                      </p>
                      Friends Network Alert: Your internet bill is outstanding. Settle billing due now to continue enjoying uninterrupted high-speed fiber services.
                    </div>
                    <p className="text-[11px] text-slate-400">
                      * Integration placeholder. Broadcasts network SMS reminders.
                    </p>
                  </div>
                )}

                {/* 10. Export Selected */}
                {activeAction === 'export' && (
                  <div className="space-y-2 p-3 bg-teal-500/5 border border-teal-500/10 rounded-xl">
                    <h4 className="text-xs font-bold text-teal-700">Export Customer Profiles</h4>
                    <p className="text-[11px] text-teal-600 leading-normal">
                      Instantly generate and download a comprehensive CSV spreadsheet containing demographic, contact, package, and billing ledger details for the {selectedIds.length} selected customers.
                    </p>
                  </div>
                )}

                {/* 11. Delete Warning */}
                {activeAction === 'delete' && (
                  <div className="space-y-2 p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                    <h4 className="text-xs font-bold text-rose-700 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      <span>CRITICAL WARNING</span>
                    </h4>
                    <p className="text-[11px] text-rose-600/90 leading-normal font-semibold">
                      This will permanently delete the accounts and billing history for the {selectedIds.length} selected customers. Deletion cannot be undone from the frontend dashboard.
                    </p>
                  </div>
                )}

                {/* CTA Action button */}
                <button
                  type="submit"
                  className={`w-full h-10 rounded-xl text-xs font-bold text-white shadow-md transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-1.5 ${
                    activeAction === 'delete'
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                      : 'bg-primary hover:bg-primary/95 shadow-primary/20'
                  }`}
                >
                  <span>Apply Bulk Action ({selectedIds.length})</span>
                </button>
              </form>
            ) : (
              <div className="py-10 border border-dashed border-border rounded-xl text-center text-xs text-muted-foreground space-y-1.5">
                <AlertCircle className="h-6 w-6 text-muted-foreground/60 mx-auto" />
                <p className="font-semibold">No customers selected</p>
                <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-normal">
                  Check customer accounts in the list on the left to activate bulk configuration panel features.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Progressive Execution Modal */}
      <AnimatePresence>
        {modalState.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (modalState.step === 'confirm' || modalState.step === 'success') {
                  setModalState(prev => ({ ...prev, isOpen: false }));
                }
              }}
              className="absolute inset-0 bg-black"
            />

            {/* Modal Dialog Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl z-10 space-y-5 text-left"
            >
              
              {/* STEP A: Confirmation */}
              {modalState.step === 'confirm' && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${
                      activeAction === 'delete'
                        ? 'bg-rose-500/10 text-rose-600'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                        Confirm Bulk Operation
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Are you sure you want to execute <span className="font-bold text-slate-700 dark:text-slate-350 uppercase">{activeAction}</span> on{' '}
                        <span className="font-bold text-primary">{selectedIds.length} selected customers</span>?
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setModalState(prev => ({ ...prev, isOpen: false }))}
                      className="h-9 px-4 rounded-xl border border-border text-xs font-semibold hover:bg-secondary transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmAndExecute}
                      className={`h-9 px-4 rounded-xl text-xs font-bold text-white shadow-sm transition-all ${
                        activeAction === 'delete'
                          ? 'bg-rose-600 hover:bg-rose-700'
                          : 'bg-primary hover:bg-primary/95'
                      }`}
                    >
                      Confirm &amp; Run
                    </button>
                  </div>
                </div>
              )}

              {/* STEP B: Progressive execution progress */}
              {modalState.step === 'progress' && (
                <div className="space-y-5 text-center py-4">
                  <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Processing Customer updates
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-semibold">
                      {modalState.currentUserIndex} / {selectedIds.length} • {modalState.currentCustomerName}
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="relative w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-primary rounded-full"
                      style={{ width: `${modalState.progress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-primary font-mono">
                    {modalState.progress}% Completed
                  </span>
                </div>
              )}

              {/* STEP C: Success state with Undo */}
              {modalState.step === 'success' && (
                <div className="space-y-5 text-center py-2">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                    <Check className="h-6 w-6 animate-bounce" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                      Bulk Action Completed!
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      {modalState.successMessage}
                    </p>
                  </div>

                  <div className="flex gap-3 pt-3">
                    {/* Undo option, only shown if action is undoable */}
                    {activeAction !== 'delete' && activeAction !== 'export' && originalCustomersBackup.length > 0 && (
                      <button
                        onClick={handleUndoAction}
                        className="flex-1 flex h-9 items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold transition-all"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span>Undo Actions</span>
                      </button>
                    )}
                    <button
                      onClick={() => setModalState(prev => ({ ...prev, isOpen: false }))}
                      className="flex-1 h-9 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold transition-all"
                    >
                      Close Panel
                    </button>
                  </div>
                </div>
              )}

              {/* STEP D: Undoing changes progress */}
              {modalState.step === 'undoing' && (
                <div className="space-y-5 text-center py-4">
                  <Loader2 className="h-10 w-10 text-rose-500 animate-spin mx-auto" />
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-rose-600">
                      Undoing Bulk updates...
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-semibold">
                      Restoring {modalState.currentCustomerName}
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="relative w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-rose-500 rounded-full transition-all duration-100"
                      style={{ width: `${modalState.progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-rose-600 font-mono">
                    {modalState.progress}% Restored
                  </span>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
