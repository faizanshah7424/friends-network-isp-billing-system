'use client';

import React, { useState, useMemo } from 'react';
import { useBillingSystem } from '@/lib/context';
import { Package } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import {
  Wifi,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  X,
  TrendingUp,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PackagesPage() {
  const { packages, addPackage, updatePackage, deletePackage, customers } = useBillingSystem();

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);

  // Delete Confirm State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pkgToDelete, setPkgToDelete] = useState<Package | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [speed, setSpeed] = useState('');
  const [monthlyCharges, setMonthlyCharges] = useState(0);
  const [installationCharges, setInstallationCharges] = useState(0);
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  const [formError, setFormError] = useState('');

  // Count active customers per package
  const customerCounts = useMemo(() => {
    return customers.reduce((acc: Record<string, number>, c) => {
      acc[c.packageId] = (acc[c.packageId] || 0) + 1;
      return acc;
    }, {});
  }, [customers]);

  const handleOpenAdd = () => {
    setDialogMode('add');
    setName('');
    setSpeed('');
    setMonthlyCharges(1000);
    setInstallationCharges(2000);
    setStatus('Active');
    setFormError('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (pkg: Package) => {
    setSelectedPkg(pkg);
    setDialogMode('edit');
    setName(pkg.name);
    setSpeed(pkg.speed);
    setMonthlyCharges(pkg.monthlyCharges);
    setInstallationCharges(pkg.installationCharges);
    setStatus(pkg.status);
    setFormError('');
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !speed.trim() || monthlyCharges <= 0) {
      setFormError('Please fill out all required fields with valid positive numbers.');
      return;
    }

    if (dialogMode === 'add') {
      addPackage({ name, speed, monthlyCharges, installationCharges, status });
    } else if (dialogMode === 'edit' && selectedPkg) {
      updatePackage({ ...selectedPkg, name, speed, monthlyCharges, installationCharges, status });
    }

    setDialogOpen(false);
  };

  const handleOpenDelete = (pkg: Package) => {
    setPkgToDelete(pkg);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (pkgToDelete) {
      deletePackage(pkgToDelete.id);
      setDeleteConfirmOpen(false);
      setPkgToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">ISP Service Packages</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Define internet plans, configure bandwidth speeds, setup setup costs, and manage active status.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 transition-all"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add Service Package</span>
        </button>
      </div>

      {/* Grid of Packages */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => {
          const userCount = customerCounts[pkg.id] || 0;

          return (
            <motion.div
              key={pkg.id}
              whileHover={{ y: -4 }}
              className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden transition-all duration-300"
            >
              {/* Card Header */}
              <div className="space-y-3.5">
                <div className="flex justify-between items-start">
                  <div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-500">
                    <Wifi className="h-5 w-5" />
                  </div>
                  <div className="flex gap-2">
                    <StatusBadge status={pkg.status} />
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-base leading-snug">{pkg.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium">Speed: {pkg.speed}</p>
                </div>
              </div>

              {/* Price Details */}
              <div className="mt-6 border-y border-border py-4 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Monthly Plan</span>
                  <p className="font-black text-sm text-foreground mt-0.5">PKR {pkg.monthlyCharges}</p>
                </div>
                <div className="border-l border-border pl-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Setup Fee</span>
                  <p className="font-bold text-sm text-foreground/75 mt-0.5">PKR {pkg.installationCharges}</p>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 pt-1.5 flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-semibold">
                  {userCount} Active {userCount === 1 ? 'Subscriber' : 'Subscribers'}
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(pkg)}
                    className="rounded-lg p-2 border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                    title="Edit Package"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleOpenDelete(pkg)}
                    className="rounded-lg p-2 border border-border text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all"
                    title="Delete Package"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* CRUD dialog */}
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

            {/* Form Modal */}
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
                <h3 className="font-bold text-lg capitalize">{dialogMode} Service Package</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Setup bandwidth specifications and cost rates</p>
              </div>

              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs flex items-center gap-2">
                  <Info className="h-4.5 w-4.5" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Package Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Package Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. FN Home Starter - 15 Mbps"
                    className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
                  />
                </div>

                {/* Speed */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Bandwidth Speed *</label>
                  <input
                    type="text"
                    required
                    value={speed}
                    onChange={(e) => setSpeed(e.target.value)}
                    placeholder="e.g. 15 Mbps, 50 Mbps (Dedicated)"
                    className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Monthly rate */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Monthly Charges *</label>
                    <input
                      type="number"
                      required
                      value={monthlyCharges || ''}
                      onChange={(e) => setMonthlyCharges(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="1200"
                      className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
                    />
                  </div>

                  {/* Installation */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Installation charges</label>
                    <input
                      type="number"
                      value={installationCharges || ''}
                      onChange={(e) => setInstallationCharges(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="2500"
                      className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Plan Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none transition-all focus:border-primary focus:bg-card"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
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
                    Save Plan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete confirmation Dialog */}
      <AnimatePresence>
        {deleteConfirmOpen && pkgToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmOpen(false)}
              className="absolute inset-0 bg-black"
            />

            {/* Dialog Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-start gap-3 text-rose-500">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Remove Service Plan</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-normal">
                    Are you sure you want to permanently delete plan{' '}
                    <span className="font-semibold text-foreground">{pkgToDelete.name}</span>? This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="h-9 px-4 rounded-xl border border-border text-xs font-semibold hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="h-9 px-5 rounded-xl bg-rose-600 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition-all"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
