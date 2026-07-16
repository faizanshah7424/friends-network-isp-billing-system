'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  ShoppingCart,
  Plus,
  RefreshCw,
  Truck,
  Users,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  outstanding: number;
}

interface PurchaseOrder {
  id: string;
  supplierName: string;
  date: string;
  totalAmount: number;
  status: string;
}

interface LedgerItem {
  id: string;
  supplierName: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export default function ProcurementPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [ledger, setLedger] = useState<LedgerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form states
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [supplierContact, setSupplierContact] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');

  const [showCreatePOModal, setShowCreatePOModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [poAmount, setPoAmount] = useState(0);

  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedPoId, setSelectedPoId] = useState('');
  const [receiveItemName, setReceiveItemName] = useState('GPON ONU');
  const [receiveQuantity, setReceiveQuantity] = useState(50);
  const [receivePrice, setReceivePrice] = useState(1800);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [supRes, poRes, ledRes] = await Promise.all([
        api.get('/procurement/suppliers'),
        api.get('/procurement/purchase-orders'),
        api.get('/procurement/vendor-ledger')
      ]);
      setSuppliers(supRes.data);
      setPurchaseOrders(poRes.data);
      setLedger(ledRes.data);
      if (supRes.data.length > 0) {
        setSelectedSupplierId(supRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load procurement details:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/procurement/suppliers', {
        name: supplierName,
        contact: supplierContact,
        email: supplierEmail
      });
      setShowAddSupplierModal(false);
      setSupplierName('');
      setSupplierContact('');
      setSupplierEmail('');
      loadData();
    } catch (err) {
      alert('Failed to register supplier');
    }
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/procurement/purchase-orders', {
        supplierId: selectedSupplierId,
        items: [],
        totalAmount: poAmount
      });
      setShowCreatePOModal(false);
      setPoAmount(0);
      loadData();
    } catch (err) {
      alert('Failed to create purchase order');
    }
  };

  const handleReceiveGoods = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/procurement/goods-receiving', {
        poId: selectedPoId,
        items: [{
          name: receiveItemName,
          quantity: receiveQuantity,
          price: receivePrice,
          category: receiveItemName.includes('Cable') ? 'Fiber Cable' : 'ONUs'
        }]
      });
      setShowReceiveModal(false);
      alert('Goods received successfully! Inventory stock levels updated.');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Goods receiving failed');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground font-semibold">Loading procurement logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <ShoppingCart className="h-8 w-8 text-primary" />
            <span>Procurement &amp; Supply Chain Portal</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage hardware suppliers, generate purchase orders, ledger entries, and receive items directly into distribution stock.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddSupplierModal(true)}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 text-xs font-semibold hover:bg-secondary transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Register Supplier</span>
          </button>
          <button
            onClick={() => setShowCreatePOModal(true)}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/95 shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Create Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Grid: Suppliers & Purchase Orders */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Suppliers List */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span>Registered Hardware Suppliers</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-slate-500/5 text-xs text-muted-foreground border-b border-border">
                  <th className="p-3">Vendor Name</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3 text-right">Outstanding Dues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-secondary/10">
                    <td className="p-3 font-semibold">{s.name}</td>
                    <td className="p-3">{s.contact}</td>
                    <td className="p-3 text-right font-bold text-rose-500">{s.outstanding.toLocaleString()} PKR</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Purchase Orders List */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex justify-between items-center">
            <h3 className="font-bold text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span>Purchase Orders</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-slate-500/5 text-xs text-muted-foreground border-b border-border">
                  <th className="p-3">PO Number</th>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-secondary/10">
                    <td className="p-3 font-mono font-bold">{po.id}</td>
                    <td className="p-3 font-semibold">{po.supplierName}</td>
                    <td className="p-3 font-bold">{po.totalAmount.toLocaleString()} PKR</td>
                    <td className="p-3 text-right">
                      {po.status === 'Pending' ? (
                        <button
                          onClick={() => {
                            setSelectedPoId(po.id);
                            setShowReceiveModal(true);
                          }}
                          className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold text-[10px]"
                        >
                          Receive Goods
                        </button>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-secondary text-muted-foreground font-bold text-[10px]">
                          Received
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Vendor Ledger accounts */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <span>Vendor Payment Ledger &amp; Audits</span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-500/5 text-xs text-muted-foreground border-b border-border">
                <th className="p-3">Date</th>
                <th className="p-3">Vendor</th>
                <th className="p-3">Description</th>
                <th className="p-3 text-right">Debit</th>
                <th className="p-3 text-right">Credit</th>
                <th className="p-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {ledger.map((tx) => (
                <tr key={tx.id} className="hover:bg-secondary/10">
                  <td className="p-3">{tx.date}</td>
                  <td className="p-3 font-semibold">{tx.supplierName}</td>
                  <td className="p-3 text-slate-500">{tx.description}</td>
                  <td className="p-3 text-right text-rose-500 font-bold">{tx.debit > 0 ? `${tx.debit.toLocaleString()} PKR` : '-'}</td>
                  <td className="p-3 text-right text-emerald-500 font-bold">{tx.credit > 0 ? `${tx.credit.toLocaleString()} PKR` : '-'}</td>
                  <td className="p-3 text-right font-black">{tx.balance.toLocaleString()} PKR</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Supplier */}
      <AnimatePresence>
        {showAddSupplierModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={() => setShowAddSupplierModal(false)} className="fixed inset-0 z-50 bg-black" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 m-auto z-50 w-full max-w-sm h-fit bg-card border border-border rounded-[24px] p-6 shadow-2xl space-y-4">
              <h3 className="font-extrabold text-base">Register Vendor</h3>
              <form onSubmit={handleAddSupplier} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Supplier/Business Name *</label>
                  <input type="text" required value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="e.g. Optics Karachi" className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Contact Helpline *</label>
                  <input type="text" required value={supplierContact} onChange={(e) => setSupplierContact(e.target.value)} placeholder="021-3456789" className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Email address *</label>
                  <input type="email" required value={supplierEmail} onChange={(e) => setSupplierEmail(e.target.value)} placeholder="sales@optics.pk" className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 outline-none" />
                </div>
                <button type="submit" className="w-full h-10 bg-primary text-primary-foreground font-semibold rounded-xl mt-2">Save Supplier</button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal: Create PO */}
      <AnimatePresence>
        {showCreatePOModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={() => setShowCreatePOModal(false)} className="fixed inset-0 z-50 bg-black" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 m-auto z-50 w-full max-w-sm h-fit bg-card border border-border rounded-[24px] p-6 shadow-2xl space-y-4">
              <h3 className="font-extrabold text-base">Generate Purchase Order</h3>
              <form onSubmit={handleCreatePO} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Select Vendor *</label>
                  <select value={selectedSupplierId} onChange={(e) => setSelectedSupplierId(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 outline-none">
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Est. Total Order Value (PKR) *</label>
                  <input type="number" required value={poAmount} onChange={(e) => setPoAmount(parseInt(e.target.value))} placeholder="Amount" className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 outline-none" />
                </div>
                <button type="submit" className="w-full h-10 bg-primary text-primary-foreground font-semibold rounded-xl mt-2">Dispatch PO</button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal: Receive Goods */}
      <AnimatePresence>
        {showReceiveModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={() => setShowReceiveModal(false)} className="fixed inset-0 z-50 bg-black" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 m-auto z-50 w-full max-w-sm h-fit bg-card border border-border rounded-[24px] p-6 shadow-2xl space-y-4">
              <h3 className="font-extrabold text-base">Goods Receipt Verification</h3>
              <form onSubmit={handleReceiveGoods} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Item Name *</label>
                  <input type="text" required value={receiveItemName} onChange={(e) => setReceiveItemName(e.target.value)} placeholder="GPON ONU" className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground">Quantity *</label>
                    <input type="number" required value={receiveQuantity} onChange={(e) => setReceiveQuantity(parseInt(e.target.value))} className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground">Unit Price (PKR) *</label>
                    <input type="number" required value={receivePrice} onChange={(e) => setReceivePrice(parseInt(e.target.value))} className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 outline-none" />
                  </div>
                </div>
                <button type="submit" className="w-full h-10 bg-primary text-primary-foreground font-semibold rounded-xl mt-2">Log Receipt &amp; Stock Up</button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
