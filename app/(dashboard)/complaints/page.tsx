'use client';

import React, { useState, useMemo } from 'react';
import { useBillingSystem } from '@/lib/context';
import { Complaint, Customer } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import {
  AlertCircle,
  Plus,
  User,
  Wrench,
  Clock,
  CheckCircle,
  MessageSquare,
  Search,
  SlidersHorizontal,
  X,
  Send,
  Loader2,
  Calendar,
  AlertTriangle,
  Activity,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ComplaintsPage() {
  const {
    complaints,
    customers,
    addComplaint,
    updateComplaintStatus,
  } = useBillingSystem();

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Selected Ticket State
  const [selectedTicketId, setSelectedTicketId] = useState<string>(
    complaints.length > 0 ? complaints[0].id : ''
  );

  // File Ticket Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fileCustomerId, setFileCustomerId] = useState('');
  const [fileIssue, setFileIssue] = useState('');
  const [filePriority, setFilePriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [fileEngineer, setFileEngineer] = useState('Yasir Ahmed');
  const [formError, setFormError] = useState('');

  // Update Ticket State
  const [updateStatus, setUpdateStatus] = useState<Complaint['status']>('Open');
  const [updateEngineer, setUpdateEngineer] = useState('');
  const [resolutionComment, setResolutionComment] = useState('');

  // Engineers List
  const engineers = ['Yasir Ahmed', 'Naveed Akhtar', 'Kamran Khan', 'Imran Malik'];

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    let result = [...complaints];

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.customerName.toLowerCase().includes(term) ||
          t.ticketNumber.toLowerCase().includes(term) ||
          t.issue.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (priorityFilter !== 'All') {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    return result;
  }, [complaints, searchTerm, statusFilter, priorityFilter]);

  // Selected Ticket details
  const selectedTicket = useMemo(() => {
    return complaints.find((t) => t.id === selectedTicketId) || filteredTickets[0] || null;
  }, [complaints, selectedTicketId, filteredTickets]);

  // Handle open dialog
  const handleOpenDialog = () => {
    setFileCustomerId('');
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
      : `Ticket status updated to ${updateStatus} by admin.`;

    updateComplaintStatus(selectedTicket.id, updateStatus, comment, updateEngineer || undefined);
    setResolutionComment('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Support Ticket Desk</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track optical line cut outages, high latency complaints, router configurations, and engineer assignments.
          </p>
        </div>
        <button
          onClick={handleOpenDialog}
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 transition-all"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>File Support Ticket</span>
        </button>
      </div>

      {/* Main Workspace grid */}
      <div className="grid gap-6 lg:grid-cols-5 items-start">
        {/* Left Side: Ticket Lists */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters Card */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3.5">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search ticket, customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-secondary/35 pl-9 pr-4 text-xs outline-none transition-all focus:border-primary focus:bg-card"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8.5 rounded-lg border border-border bg-secondary/35 px-2.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="h-8.5 rounded-lg border border-border bg-secondary/35 px-2.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
              >
                <option value="All">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Tickets list */}
          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTicketId(t.id);
                    setUpdateStatus(t.status);
                    setUpdateEngineer(t.assignedEngineer);
                  }}
                  className={`border rounded-2xl p-4 cursor-pointer text-xs text-left transition-all duration-200 ${
                    selectedTicket?.id === t.id
                      ? 'bg-card border-primary shadow-sm shadow-primary/5'
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
                    <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5">
                      <Wrench className="h-3.5 w-3.5" />
                      <span>{t.assignedEngineer}</span>
                    </span>
                    <div className="flex gap-1.5">
                      <StatusBadge status={t.priority} />
                      <StatusBadge status={t.status} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-card border border-border rounded-2xl p-8 text-center text-xs text-muted-foreground">
                No active complaints tickets found.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Ticket Details Panel */}
        <div className="lg:col-span-3">
          {selectedTicket ? (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
              {/* Ticket Head */}
              <div className="border-b border-border pb-4 flex justify-between items-start flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500">
                      {selectedTicket.ticketNumber}
                    </span>
                    <StatusBadge status={selectedTicket.priority} />
                    <StatusBadge status={selectedTicket.status} />
                  </div>
                  <h3 className="font-extrabold text-base mt-2">{selectedTicket.customerName}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Account ID: {selectedTicket.customerId}</p>
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  <p className="flex items-center gap-1 justify-end"><Clock className="h-3.5 w-3.5" /> Opened: {selectedTicket.dateCreated}</p>
                  <p className="mt-1 font-semibold text-foreground">Field Eng: {selectedTicket.assignedEngineer}</p>
                </div>
              </div>

              {/* Issue Description */}
              <div className="bg-secondary/20 p-4 rounded-xl border border-border">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Outage Description</span>
                <p className="text-xs text-foreground font-medium mt-1 leading-relaxed">{selectedTicket.issue}</p>
              </div>

              {/* Timeline feed */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-primary" />
                  <span>Ticket Log Timeline</span>
                </h4>
                
                <div className="relative border-l border-border pl-5 space-y-4 ml-2.5 pt-1.5">
                  {selectedTicket.timeline.map((log, index) => (
                    <div key={index} className="relative text-[11px]">
                      <span className={`absolute -left-[28px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-card ${
                        log.status === 'Resolved' || log.status === 'Closed' ? 'bg-emerald-500' :
                        log.status === 'In Progress' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      <div className="space-y-1">
                        <div className="flex justify-between items-center font-bold">
                          <span>Status: {log.status}</span>
                          <span className="text-[9px] text-muted-foreground font-normal">{log.date}</span>
                        </div>
                        <p className="text-muted-foreground leading-normal">{log.comment}</p>
                      </div>
                    </div>
                  ))}
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
                        className="h-9.5 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>

                    {/* Engineer assignment */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Re-assign Field Engineer</label>
                      <select
                        value={updateEngineer}
                        onChange={(e) => setUpdateEngineer(e.target.value)}
                        className="h-9.5 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
                      >
                        {engineers.map((eng) => (
                          <option key={eng} value={eng}>
                            {eng}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Resolution comment */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Resolution Activity Comment</label>
                    <div className="relative">
                      <textarea
                        rows={2}
                        value={resolutionComment}
                        onChange={(e) => setResolutionComment(e.target.value)}
                        placeholder="Describe status updates, e.g. spliced optical fiber at node, replaced patch cord..."
                        className="w-full rounded-xl border border-border p-3 text-xs outline-none bg-secondary/30 transition-all focus:border-primary focus:bg-card"
                      />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 transition-all"
                    >
                      <Send className="h-4 w-4" />
                      <span>Post Resolution Update</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-16 text-center shadow-sm">
              <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-bold">Select a ticket</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Choose a support ticket from the list to view client details, assign engineers, and update status.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* File Ticket Dialog Modal */}
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

            {/* Form card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl z-10 space-y-4"
            >
              <button
                onClick={() => setDialogOpen(false)}
                className="absolute top-4 right-4 rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>

              <div>
                <h3 className="font-bold text-lg">File Support Outage Ticket</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Register telemetry or client complaints</p>
              </div>

              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4.5 w-4.5" />
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

                {/* Priority */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Ticket Priority</label>
                  <select
                    value={filePriority}
                    onChange={(e) => setFilePriority(e.target.value as any)}
                    className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                {/* Engineer */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Assign Field Engineer</label>
                  <select
                    value={fileEngineer}
                    onChange={(e) => setFileEngineer(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
                  >
                    {engineers.map((eng) => (
                      <option key={eng} value={eng}>
                        {eng}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Issue Details */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Issue Details *</label>
                  <textarea
                    rows={3}
                    required
                    value={fileIssue}
                    onChange={(e) => setFileIssue(e.target.value)}
                    placeholder="Describe speed issues, packet drops or fiber cut warnings..."
                    className="w-full rounded-xl border border-border p-3 text-xs outline-none bg-secondary/30 transition-all focus:border-primary focus:bg-card"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDialogOpen(false)}
                    className="h-9 px-4 rounded-xl border border-border text-xs font-semibold hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-9 px-5 rounded-xl bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-colors"
                  >
                    File Ticket
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
