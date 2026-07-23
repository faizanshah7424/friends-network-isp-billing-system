'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBillingSystem } from '@/lib/context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  UserPlus,
  ArrowLeft,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const customerSchema = z.object({
  id: z.string().min(3, 'Customer ID must be at least 3 characters').regex(/^[A-Za-z0-9-]+$/, 'Only letters, numbers, and hyphens are allowed'),
  name: z.string().min(3, 'Name must be at least 3 characters'),
  phone: z.string().min(11, 'Phone must be at least 11 digits'),
  whatsapp: z.string().optional(),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  area: z.string().min(2, 'Area is required'),
  packageId: z.string().min(1, 'Please select a package'),
  monthlyCharges: z.number().min(0, 'Monthly charges must be positive'),
  installationCharges: z.number().min(0, 'Installation charges must be positive'),
  routerMac: z.string().optional(),
  onuNumber: z.string().optional(),
  connectionDate: z.string().min(10, 'Please select a valid date'),
  connectionStatus: z.enum(['Active', 'Inactive']),
  paymentStatus: z.enum(['Paid', 'Unpaid', 'Pending']),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export default function AddCustomerPage() {
  const router = useRouter();
  const { packages, addCustomer, customers } = useBillingSystem();
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);

  const activePackages = packages.filter((p) => p.status === 'Active');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      connectionDate: new Date().toISOString().split('T')[0],
      connectionStatus: 'Active',
      paymentStatus: 'Unpaid',
      monthlyCharges: 0,
      installationCharges: 0,
      id: '',
      name: '',
      phone: '',
      whatsapp: '',
      address: '',
      area: '',
      packageId: '',
      routerMac: '',
      onuNumber: '',
    },
  });

  const selectedPackageId = watch('packageId');

  // Auto-fill charges when package changes
  useEffect(() => {
    if (selectedPackageId) {
      const pkg = activePackages.find((p) => p.id === selectedPackageId);
      if (pkg) {
        setValue('monthlyCharges', pkg.monthlyCharges);
      }
    }
  }, [selectedPackageId, activePackages, setValue]);

  const onSubmit = async (data: CustomerFormValues) => {
    // Validate unique Customer ID
    const duplicate = customers.some(
      (c) => c.id.trim().toLowerCase() === data.id.trim().toLowerCase() ||
             (c.customerId && c.customerId.trim().toLowerCase() === data.id.trim().toLowerCase())
    );
    if (duplicate) {
      setError('id', {
        type: 'manual',
        message: 'Customer ID already exists in the system',
      });
      return;
    }

    // Validate unique Phone Number
    const duplicatePhone = customers.some(
      (c) => c.phone.trim() === data.phone.trim()
    );
    if (duplicatePhone) {
      setError('phone', {
        type: 'manual',
        message: 'Mobile number already registered in the system',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await addCustomer({
        ...data,
        id: data.id.trim(),
      });
      setIsSubmitting(false);
      setShowSuccess(true);
      
      // Redirect after success screen
      setTimeout(() => {
        router.push('/customers');
      }, 1500);
    } catch (err: any) {
      setIsSubmitting(false);
      const detail = err?.response?.data?.detail;
      if (detail && typeof detail === 'string') {
        if (detail.toLowerCase().includes('customer id')) {
          setError('id', { type: 'manual', message: detail });
        } else if (detail.toLowerCase().includes('mobile') || detail.toLowerCase().includes('phone')) {
          setError('phone', { type: 'manual', message: detail });
        } else {
          setError('root', { type: 'manual', message: detail });
        }
      } else {
        setError('root', { type: 'manual', message: 'Failed to create customer account. Please try again.' });
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-left">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/customers"
          className="rounded-xl border border-border bg-card p-2 text-muted-foreground hover:text-foreground transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Register Customer</h1>
          <p className="text-slate-500 text-sm mt-1">
            Fill out personal details, network configuration, and billing packages.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showSuccess ? (
          /* Success Screen */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-border p-12 rounded-3xl text-center shadow-sm space-y-4"
          >
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle className="h-10 w-10 animate-bounce" />
            </div>
            <h2 className="text-2xl font-bold">Registration Successful!</h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              The customer account has been registered and initialized in the database. Redirecting to directory...
            </p>
          </motion.div>
        ) : (
          /* Add Form */
          <motion.form
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {errors.root && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs p-4 rounded-2xl font-bold flex items-center gap-2">
                <span>{errors.root.message}</span>
              </div>
            )}
            {/* Card: Personal Details */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
              <div className="border-b border-border pb-3">
                <h3 className="font-bold text-base text-slate-800">Personal &amp; Contact Information</h3>
                <p className="text-xs text-slate-500">Standard identification credentials for the client</p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {/* Customer ID */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Customer ID *</label>
                  <input
                    type="text"
                    placeholder="e.g. FN-1001"
                    {...register('id')}
                    className={`h-10 w-full rounded-xl border px-3.5 text-xs outline-none bg-secondary/20 transition-all focus:border-primary focus:bg-white ${
                      errors.id ? 'border-rose-500' : 'border-border'
                    }`}
                  />
                  {errors.id && <p className="text-[10px] text-rose-500 font-medium">{errors.id.message}</p>}
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Customer Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Muhammad Ali"
                    {...register('name')}
                    className={`h-10 w-full rounded-xl border px-3.5 text-xs outline-none bg-secondary/20 transition-all focus:border-primary focus:bg-white ${
                      errors.name ? 'border-rose-500' : 'border-border'
                    }`}
                  />
                  {errors.name && <p className="text-[10px] text-rose-500 font-medium">{errors.name.message}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Mobile Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. 03001234567"
                    {...register('phone')}
                    className={`h-10 w-full rounded-xl border px-3.5 text-xs outline-none bg-secondary/20 transition-all focus:border-primary focus:bg-white ${
                      errors.phone ? 'border-rose-500' : 'border-border'
                    }`}
                  />
                  {errors.phone && <p className="text-[10px] text-rose-500 font-medium">{errors.phone.message}</p>}
                </div>

                {/* WhatsApp */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">WhatsApp Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 03001234567"
                    {...register('whatsapp')}
                    className="h-10 w-full rounded-xl border border-border px-3.5 text-xs outline-none bg-secondary/20 transition-all focus:border-primary focus:bg-white"
                  />
                </div>

                {/* Area Dropdown/Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Billing Area / Hub Zone *</label>
                  <input
                    type="text"
                    placeholder="e.g. Clifton, DHA, Gulshan"
                    {...register('area')}
                    className={`h-10 w-full rounded-xl border px-3.5 text-xs outline-none bg-secondary/20 transition-all focus:border-primary focus:bg-white ${
                      errors.area ? 'border-rose-500' : 'border-border'
                    }`}
                  />
                  {errors.area && <p className="text-[10px] text-rose-500 font-medium">{errors.area.message}</p>}
                </div>

                {/* Address */}
                <div className="space-y-1.5 md:col-span-2 border-t border-border/20 pt-4">
                  <label className="text-xs font-semibold text-muted-foreground">Installation Address *</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Flat A-104, Block 5, Clifton, Karachi"
                    {...register('address')}
                    className={`w-full rounded-xl border p-3 text-xs outline-none bg-secondary/20 transition-all focus:border-primary focus:bg-white ${
                      errors.address ? 'border-rose-500' : 'border-border'
                    }`}
                  />
                  {errors.address && <p className="text-[10px] text-rose-500 font-medium">{errors.address.message}</p>}
                </div>
              </div>
            </div>

            {/* Card: Billing & Network Configurations */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
              <div className="border-b border-border pb-3">
                <h3 className="font-bold text-base text-slate-800">Billing &amp; Network Provisioning</h3>
                <p className="text-xs text-slate-500">Select internet speed package, hardware credentials, and status</p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {/* Package Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Internet Service Package *</label>
                  <select
                    {...register('packageId')}
                    className={`h-10 w-full rounded-xl border px-3.5 text-xs outline-none bg-secondary/20 transition-all focus:border-primary focus:bg-white ${
                      errors.packageId ? 'border-rose-500' : 'border-border'
                    }`}
                  >
                    <option value="">Select Package</option>
                    <optgroup label="Social Media Packages">
                      {activePackages.filter((p) => p.category === 'Social Media').map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} — {pkg.speed} (PKR {pkg.monthlyCharges}/mo)
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Standard Packages">
                      {activePackages.filter((p) => p.category === 'Standard').map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} — {pkg.speed} (PKR {pkg.monthlyCharges}/mo)
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Static IP Packages">
                      {activePackages.filter((p) => p.category === 'Static IP').map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} — {pkg.speed} (PKR {pkg.monthlyCharges}/mo)
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  {errors.packageId && <p className="text-[10px] text-rose-500 font-medium">{errors.packageId.message}</p>}
                </div>

                {/* Connection Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Activation / Installation Date *</label>
                  <input
                    type="date"
                    {...register('connectionDate')}
                    className={`h-10 w-full rounded-xl border px-3.5 text-xs outline-none bg-secondary/20 transition-all focus:border-primary focus:bg-white ${
                      errors.connectionDate ? 'border-rose-500' : 'border-border'
                    }`}
                  />
                  {errors.connectionDate && <p className="text-[10px] text-rose-500 font-medium">{errors.connectionDate.message}</p>}
                </div>

                {/* Monthly Charges */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Monthly Charges (PKR) *</label>
                  <input
                    type="number"
                    placeholder="2500"
                    {...register('monthlyCharges', { valueAsNumber: true })}
                    className={`h-10 w-full rounded-xl border px-3.5 text-xs outline-none bg-secondary/20 transition-all focus:border-primary focus:bg-white ${
                      errors.monthlyCharges ? 'border-rose-500' : 'border-border'
                    }`}
                  />
                  {errors.monthlyCharges && <p className="text-[10px] text-rose-500 font-medium">{errors.monthlyCharges.message}</p>}
                </div>

                {/* Installation Charges */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Installation Charges (PKR)</label>
                  <input
                    type="number"
                    placeholder="0"
                    {...register('installationCharges', { valueAsNumber: true })}
                    className={`h-10 w-full rounded-xl border px-3.5 text-xs outline-none bg-secondary/20 transition-all focus:border-primary focus:bg-white ${
                      errors.installationCharges ? 'border-rose-500' : 'border-border'
                    }`}
                  />
                  {errors.installationCharges && <p className="text-[10px] text-rose-500 font-medium">{errors.installationCharges.message}</p>}
                </div>

                {/* Router MAC */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Router MAC Address (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. AA:BB:CC:DD:EE:FF"
                    {...register('routerMac')}
                    className="h-10 w-full rounded-xl border border-border px-3.5 text-xs outline-none bg-secondary/20 transition-all focus:border-primary focus:bg-white"
                  />
                </div>

                {/* ONU Serial */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">ONU Serial Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. ONUM-998822"
                    {...register('onuNumber')}
                    className="h-10 w-full rounded-xl border border-border px-3.5 text-xs outline-none bg-secondary/20 transition-all focus:border-primary focus:bg-white"
                  />
                </div>

                {/* Initial Connection Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Connection Status *</label>
                  <select
                    {...register('connectionStatus')}
                    className="h-10 w-full rounded-xl border border-border px-3.5 text-xs outline-none bg-secondary/20 transition-all focus:border-primary focus:bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Initial Payment Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Initial Payment Status *</label>
                  <select
                    {...register('paymentStatus')}
                    className="h-10 w-full rounded-xl border border-border px-3.5 text-xs outline-none bg-secondary/20 transition-all focus:border-primary focus:bg-white"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end gap-3.5">
              <Link
                href="/customers"
                className="h-10 px-5 rounded-xl border border-border text-xs font-bold hover:bg-slate-100 flex items-center transition-colors bg-white"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-6 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 hover:opacity-95 disabled:opacity-50 flex items-center gap-1.5 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 animate-spin" />
                    <span>Registering Client...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Confirm Registration</span>
                  </>
                )}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
