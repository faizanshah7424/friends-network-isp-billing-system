'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useBillingSystem } from '@/lib/context';
import { Complaint } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import {
  AlertCircle,
  Plus,
  Wrench,
  Search,
  X,
  Phone,
  MapPin,
  Tag,
  Clipboard,
  CheckCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import EmptyState from '@/components/ui/EmptyState';

export default function ComplaintsPage() {
  const {
    complaints,
    customers,
    addComplaint,
    updateComplaintStatus,
    currentUser,
  } = useBillingSystem();

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'Active' | 'Resolved' | 'Closed' | 'All'>('Active');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Selected Ticket State
  const [selectedTicketId, setSelectedTicketId] = useState<string>('');

  // File Ticket Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fileCustomerId, setFileCustomerId] = useState('');
  const [fileCategory, setFileCategory] = useState('Slow Speed');
  const [fileIssue, setFileIssue] = useState('');
  const [filePriority, setFilePriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [fileEngineer, setFileEngineer] = useState('Yasir Ahmed');
  const [formError, setFormError] = useState('');

  // Update Ticket State
  const [updateStatus, setUpdateStatus] = useState<Complaint['status']>('Pending');
  const [updateEngineer, setUpdateEngineer] = useState('');
  const [resolutionComment, setResolutionComment] = useState('');
  const [engineerNotesState, setEngineerNotesState] = useState('');

  // Engineers List
  const engineers = ['Yasir Ahmed', 'Naveed Akhtar', 'Kamran Khan', 'Imran Malik', 'Noor Jamal'];
  const categories = ['Slow Speed', 'Fiber Outage', 'ONU Offline (Red Light)', 'Router Configuration', 'Billing Query', 'Hardware Fault'];

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    let result = [...complaints];

    // Tab-based status filter
    if (activeTab === 'Active') {
      result = result.filter(
        (t) => t.status === 'Pending' || t.status === 'Assigned' || t.status === 'In Progress'
      );
    } else if (activeTab === 'Resolved') {
      result = result.filter((t) => t.status === 'Resolved');
    } else if (activeTab === 'Closed') {
      result = result.filter((t) => t.status === 'Closed');
    }

    // Text search
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter((t) => {
        const cust = customers.find((c) => c.id === t.customerId);
        const mobile = cust?.phone || '';
        const area = cust?.area || '';
        return (
          t.customerName.toLowerCase().includes(term) ||
          t.ticketNumber.toLowerCase().includes(term) ||
          t.customerId.toLowerCase().includes(term) ||
          mobile.includes(term) ||
          area.toLowerCase().includes(term) ||
          t.issue.toLowerCase().includes(term)
        );
      });
    }

    if (priorityFilter !== 'All') {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    return result;
  }, [complaints, customers, searchTerm, activeTab, priorityFilter]);

  // Default selection on load
  useEffect(() => {
    if (filteredTickets.length > 0 && !selectedTicketId) {
      const timer = setTimeout(() => {
        setSelectedTicketId(filteredTickets[0].id);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [filteredTickets, selectedTicketId]);

  // Selected Ticket details
  const selectedTicket = useMemo(() => {
    return complaints.find((t) => t.id === selectedTicketId) || filteredTickets[0] || null;
  }, [complaints, selectedTicketId, filteredTickets]);

  // Sync update states when ticket selection changes
  useEffect(() => {
    if (selectedTicket) {
      const timer = setTimeout(() => {
        setUpdateStatus(selectedTicket.status);
        setUpdateEngineer(selectedTicket.assignedEngineer);
        setEngineerNotesState(selectedTicket.engineerNotes || '');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedTicket]);

  // Selected customer for preview in create dialog
  const selectedCustomerInfo = useMemo(() => {
    return customers.find((c) => c.id === fileCustomerId);
  }, [customers, fileCustomerId]);

  // Handle open dialog
  const handleOpenDialog = () => {
    setFileCustomerId('');
    setFileCategory('Slow Speed');
    setFileIssue('');
    setFilePriority('Medium');
    setFileEngineer('Yasir Ahmed');
    setFormError('');
    setDialogOpen(true);
  };

  // Handle file complaint
  const handleFileComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileCustomerId || !fileIssue.trim()) {
      setFormError('Please select a customer and write the issue details.');
      return;
    }

    const customer = customers.find((c) => c.id === fileCustomerId);
    if (!customer) return;

    addComplaint({
      customerId: fileCustomerId,
      customerName: customer.name,
      mobileNumber: customer.phone,
      area: customer.area,
      category: fileCategory,
      issue: fileIssue,
      priority: filePriority,
      assignedEngineer: fileEngineer,
    });

    setDialogOpen(false);
  };

  // Handle status update
  const handleUpdateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    const comment = resolutionComment.trim() !== '' 
      ? resolutionComment 
      : `Ticket status updated to ${updateStatus} by ${currentUser.name}.`;

    updateComplaintStatus(
      selectedTicket.id, 
      updateStatus, 
      comment, 
      updateEngineer || undefined, 
      engineerNotesState || undefined
    );
    setResolutionComment('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Support Ticket Desk</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track optical fiber outages, latency issues, ONT configuration requests, and engineer resolution logs.
          </p>
        </div>

        <button
          onClick={handleOpenDialog}
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 transition-all w-full sm:w-auto cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>File Support Ticket</span>
        </button>
      </div>

      {/* Main Workspace grid */}
      <div className="grid gap-6 lg:grid-cols-5 items-start">
        {/* Left Side: Ticket Lists */}
        <div className="lg:col-span-2 space-y-4 text-left">
          {/* Filters Card */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3.5">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search (ID, Name, Mobile, Issue)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9.5 w-full rounded-xl border border-border bg-secondary/35 pl-9 pr-4 text-xs outline-none transition-all focus:border-primary focus:bg-card"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Filter Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="h-8.5 w-full rounded-lg border border-border bg-secondary/35 px-2.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
              >
                <option value="All">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-border bg-card p-1 rounded-xl border">
            <button
              onClick={() => setActiveTab('Active')}
              className={`flex-1 py-1.5 text-center text-xs font-bold transition-all rounded-lg ${
                activeTab === 'Active'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveTab('Resolved')}
              className={`flex-1 py-1.5 text-center text-xs font-bold transition-all rounded-lg ${
                activeTab === 'Resolved'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Resolved
            </button>
            {currentUser.role === 'Super Admin' && (
              <button
                onClick={() => setActiveTab('Closed')}
                className={`flex-1 py-1.5 text-center text-xs font-bold transition-all rounded-lg ${
                  activeTab === 'Closed'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Closed
              </button>
            )}
            <button
              onClick={() => setActiveTab('All')}
              className={`flex-1 py-1.5 text-center text-xs font-bold transition-all rounded-lg ${
                activeTab === 'All'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
          </div>

          {/* Tickets list */}
          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((t) => {
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTicketId(t.id);
                    }}
                    className={`border rounded-2xl p-4 cursor-pointer text-xs text-left transition-all duration-200 ${
                      selectedTicket?.id === t.id
                        ? 'bg-card border-primary shadow-sm shadow-primary/5 ring-2 ring-primary/10'
                        : 'bg-card border-border hover:bg-secondary/35'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono font-bold text-indigo-500">{t.ticketNumber}</span>
                      <span className="text-[10px] text-muted-foreground">{t.dateCreated}</span>
                    </div>
                    <h4 className="font-bold text-foreground mt-2 truncate">{t.customerName}</h4>
                    <p className="text-muted-foreground mt-1 truncate leading-relaxed">{t.issue}</p>
                    
                    <div className="flex justify-between items-center mt-3 border-t border-border/60 pt-2.5">
                      <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                        <Wrench className="h-3 w-3" />
                        <span className="truncate max-w-[100px]">{t.assignedEngineer}</span>
                      </span>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <StatusBadge status={t.priority} />
                        <StatusBadge status={t.status} />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                icon={AlertCircle}
                title="No support tickets found"
                description="No support tickets match your active filter criteria or search query."
              />
            )}
          </div>
        </div>

        {/* Right Side: Ticket Details Panel */}
        <div className="lg:col-span-3 text-left">
          {selectedTicket ? (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
              {/* Ticket Head */}
              <div className="border-b border-border pb-4 flex justify-between items-start flex-wrap gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-lg text-slate-700">{selectedTicket.ticketNumber}</span>
                    <StatusBadge status={selectedTicket.priority} />
                    <StatusBadge status={selectedTicket.status} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{selectedTicket.customerName}</h3>
                </div>
                <div className="flex flex-col text-right text-[10px] text-muted-foreground">
                  <span>Created: <strong>{selectedTicket.dateCreated}</strong></span>
                  {selectedTicket.resolvedDate && (
                    <span className="text-emerald-500 mt-0.5">Resolved: <strong>{selectedTicket.resolvedDate}</strong></span>
                  )}
                </div>
              </div>

              {/* Customer Contact Details Block */}
              <div className="grid gap-3.5 sm:grid-cols-3 bg-secondary/35 p-4 rounded-2xl border border-border/60 text-xs">
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted-foreground block">Phone</span>
                    <a href={`tel:${selectedTicket.mobileNumber || ''}`} className="font-semibold hover:underline text-foreground">
                      {selectedTicket.mobileNumber || 'N/A'}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted-foreground block">Installation Zone</span>
                    <span className="font-semibold text-foreground">{selectedTicket.area || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Tag className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted-foreground block">Issue Category</span>
                    <span className="font-semibold text-foreground">{selectedTicket.category || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Issue Description */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Complaint Details</h4>
                <div className="bg-secondary/20 p-4 rounded-xl border border-border/40 text-xs text-slate-700 leading-normal font-medium">
                  {selectedTicket.issue}
                </div>
              </div>

              {/* Technical Engineer Notes */}
              {selectedTicket.engineerNotes && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Field Engineer Technical Notes</h4>
                  <div className="bg-emerald-500/[0.03] border border-emerald-500/20 p-4 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed font-semibold">
                    {selectedTicket.engineerNotes}
                  </div>
                </div>
              )}

              {/* Timeline Logs */}
              <div className="space-y-4">
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Complaint Lifecycle Audit</h4>
                
                <div className="relative pl-6 border-l border-border space-y-5 ml-3.5">
                  {selectedTicket.timeline.map((log, index) => {
                    const isResolved = log.status === 'Resolved';
                    const isClosed = log.status === 'Closed';
                    const isInProgress = log.status === 'In Progress';
                    const isAssigned = log.status === 'Assigned';
                    
                    return (
                      <div key={index} className="relative group text-left">
                        {/* Status timeline node dot */}
                        <div className={`absolute -left-[31px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 border-card shadow-sm ${
                          isResolved ? 'bg-emerald-500 text-white' :
                          isClosed ? 'bg-slate-500 text-white' :
                          isInProgress ? 'bg-amber-500 text-white' :
                          isAssigned ? 'bg-indigo-500 text-white' : 'bg-rose-500 text-white'
                        }`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        </div>
                        
                        <div className="bg-secondary/40 border border-border/80 rounded-xl p-3 space-y-1.5 hover:bg-secondary/60 transition-colors">
                          <div className="flex justify-between items-center">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              isResolved ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                              isClosed ? 'bg-slate-500/10 text-slate-600' :
                              isInProgress ? 'bg-amber-500/10 text-amber-600' :
                              isAssigned ? 'bg-indigo-500/10 text-indigo-600' : 'bg-rose-500/10 text-rose-600'
                            }`}>
                              {log.status}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-semibold">{log.date}</span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed font-medium">
                            {log.comment}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Update Status form */}
              <div className="border-t border-border pt-5 space-y-4">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <Wrench className="h-4.5 w-4.5 text-primary" />
                  <span>Update Resolution Status</span>
                </h4>

                <form onSubmit={handleUpdateTicket} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Status selection */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Ticket Status</label>
                      <select
                        value={updateStatus}
                        onChange={(e) => setUpdateStatus(e.target.value as any)}
                        className="h-9.5 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none transition-all focus:border-primary focus:bg-card animate-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Assigned">Assigned</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        {currentUser.role === 'Super Admin' && (
                          <option value="Closed">Closed</option>
                        )}
                      </select>
                    </div>

                    {/* Engineer assignment */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Re-assign Field Engineer</label>
                      <select
                        value={updateEngineer}
                        onChange={(e) => setUpdateEngineer(e.target.value)}
                        disabled={currentUser.role === 'Sub Admin'}
                        className="h-9.5 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none transition-all focus:border-primary focus:bg-card disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {engineers.map((eng) => (
                          <option key={eng} value={eng}>
                            {eng}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Engineer Notes Textarea */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Engineer Notes (Signal levels, fiber splice details)</label>
                    <textarea
                      rows={2}
                      value={engineerNotesState}
                      onChange={(e) => setEngineerNotesState(e.target.value)}
                      placeholder="Enter technical details, e.g. spliced optical line in Clifton box, signal level: -18dBm"
                      className="w-full rounded-xl border border-border p-3 text-xs outline-none bg-secondary/30 transition-all focus:border-primary focus:bg-card"
                    />
                  </div>

                  {/* Resolution comment */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Timeline Remarks (Internal Comment)</label>
                    <textarea
                      rows={2}
                      value={resolutionComment}
                      onChange={(e) => setResolutionComment(e.target.value)}
                      placeholder="Enter a comment describing actions taken for audit history..."
                      className="w-full rounded-xl border border-border p-3 text-xs outline-none bg-secondary/30 transition-all focus:border-primary focus:bg-card"
                    />
                  </div>

                  {/* Submit */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="h-9.5 rounded-xl bg-primary px-6 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 transition-all w-full sm:w-auto"
                    >
                      Record Resolution Action
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-16 text-center text-xs text-muted-foreground">
              <Clipboard className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold">No Ticket Selected</p>
              <p className="text-[11px] mt-1 text-slate-400">Select a ticket from the sidebar to inspect its history log.</p>
            </div>
          )}
        </div>
      </div>

      {/* File Support Ticket Dialog */}
      <AnimatePresence>
        {dialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setDialogOpen(false)}
              className="absolute inset-0 bg-black"
            />

            {/* Dialog Panel */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl z-10 text-left space-y-5"
            >
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h3 className="text-base font-extrabold text-slate-800">File Support Outage Complaint</h3>
                <button
                  onClick={() => setDialogOpen(false)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {formError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleFileComplaint} className="space-y-4">
                {/* Select Customer */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Select Customer *</label>
                  <select
                    value={fileCustomerId}
                    onChange={(e) => setFileCustomerId(e.target.value)}
                    required
                    className="h-9.5 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
                  >
                    <option value="">Select subscriber...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.customerId || c.id})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Customer Info Preview */}
                {selectedCustomerInfo && (
                  <div className="bg-secondary/40 border border-border/80 p-3 rounded-xl text-[10px] text-muted-foreground space-y-1 animate-fade-in">
                    <p>Phone: <span className="font-semibold text-foreground">{selectedCustomerInfo.phone}</span></p>
                    <p>Area: <span className="font-semibold text-foreground">{selectedCustomerInfo.area}</span></p>
                    <p>Current Package: <span className="font-semibold text-foreground">{selectedCustomerInfo.packageName}</span></p>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Complaint Category</label>
                    <select
                      value={fileCategory}
                      onChange={(e) => setFileCategory(e.target.value)}
                      className="h-9.5 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Priority Level</label>
                    <select
                      value={filePriority}
                      onChange={(e) => setFilePriority(e.target.value as any)}
                      className="h-9.5 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>

                {/* Engineer Assignment */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Assign Field Engineer</label>
                  <select
                    value={fileEngineer}
                    onChange={(e) => setFileEngineer(e.target.value)}
                    className="h-9.5 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
                  >
                    {engineers.map((eng) => (
                      <option key={eng} value={eng}>
                        {eng}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Issue details */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Issue Description *</label>
                  <textarea
                    rows={3}
                    value={fileIssue}
                    onChange={(e) => setFileIssue(e.target.value)}
                    placeholder="Enter detailed outage symptoms, ONU indicators, or customer latency report..."
                    required
                    className="w-full rounded-xl border border-border p-3.5 text-xs outline-none bg-secondary/30 transition-all focus:border-primary focus:bg-card"
                  />
                </div>

                {/* Submit buttons */}
                <div className="flex justify-end gap-3 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => setDialogOpen(false)}
                    className="h-9.5 px-4 rounded-xl border border-border text-xs font-semibold hover:bg-secondary transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-9.5 rounded-xl bg-primary px-5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 transition-all"
                  >
                    File Outage Complaint
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
