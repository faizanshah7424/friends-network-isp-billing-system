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

// Mobile pattern: 03XX-XXXXXXX or simple digits
const phoneRegex = /^(03\d{2}-\d{7})|(\d{11})$/;

const customerSchema = z.object({
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
  const { packages, addCustomer } = useBillingSystem();
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);

  const activePackages = packages.filter((p) => p.status === 'Active');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      connectionDate: new Date().toISOString().split('T')[0],
      connectionStatus: 'Active',
      paymentStatus: 'Unpaid',
      monthlyCharges: 0,
      installationCharges: 0,
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
        setValue('installationCharges', pkg.installationCharges);
      }
    }
  }, [selectedPackageId, activePackages, setValue]);

  const onSubmit = (data: CustomerFormValues) => {
    setIsSubmitting(true);
    
    // Simulate API delay
    setTimeout(() => {
      addCustomer(data);
      setIsSubmitting(false);
      setShowSuccess(true);
      
      // Redirect after success screen
      setTimeout(() => {
        router.push('/customers');
      }, 1500);
    }, 1000);
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
            {/* Card: Personal Details */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
              <div className="border-b border-border pb-3">
                <h3 className="font-bold text-base text-slate-800">Personal &amp; Contact Information</h3>
                <p className="text-xs text-slate-500">Standard identification credentials for the client</p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
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
                    placeholder="e.g. 0300-1234567"
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
                    placeholder="e.g. 0300-1234567"
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
                <div className="space-y-1.5 md:col-span-2">
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
                    {activePackages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} (PKR {pkg.monthlyCharges}/mo)
                      </option>
                    ))}
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
                  <label className="text-xs font-semibold text-muted-foreground">Installation Charges (PKR) *</label>
                  <input
                    type="number"
                    placeholder="2000"
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
