'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer, Package, Invoice, Payment, Complaint, Notification, SystemSettings, UserSession } from '@/types';
import StartupSplash from '@/components/ui/StartupSplash';
import {
  initialCustomers,
  initialPackages,
  initialInvoices,
  initialPayments,
  initialComplaints,
  initialNotifications,
  defaultSettings,
} from '@/data/customerDb';

interface BillingSystemContextType {
  customers: Customer[];
  packages: Package[];
  invoices: Invoice[];
  payments: Payment[];
  complaints: Complaint[];
  notifications: Notification[];
  settings: SystemSettings;
  rechargeCustomerId: string | null;
  currentUser: UserSession;
  setCurrentUser: (user: UserSession) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  isLoaded: boolean;
  openRecharge: (customerId: string) => void;
  closeRecharge: () => void;
  addCustomer: (customer: Omit<Customer, 'outstandingBalance' | 'timeline' | 'notes' | 'packageName'>) => Customer;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  suspendCustomer: (id: string) => void;
  activateCustomer: (id: string) => void;
  addPackage: (pkg: Omit<Package, 'id'>) => void;
  updatePackage: (pkg: Package) => void;
  deletePackage: (id: string) => void;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'grandTotal' | 'amountPaid' | 'outstandingBalance' | 'paymentStatus' | 'customerName'>) => Invoice;
  addPayment: (payment: Omit<Payment, 'id' | 'receivedBy'>) => { payment: Payment; invoice: Invoice | undefined };
  addComplaint: (complaint: Omit<Complaint, 'id' | 'ticketNumber' | 'status' | 'dateCreated' | 'timeline'>) => void;
  updateComplaintStatus: (id: string, status: Complaint['status'], comment: string, engineer?: string, engineerNotes?: string) => void;
  updateSettings: (settings: SystemSettings) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addCustomerNote: (customerId: string, text: string) => void;
  addBulkPayments: (payments: Omit<Payment, 'id' | 'receivedBy'>[]) => void;
}


const BillingSystemContext = createContext<BillingSystemContextType | undefined>(undefined);

export function BillingSystemProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);
  const [rechargeCustomerId, setRechargeCustomerId] = useState<string | null>(null);
  const [currentUser, setCurrentUserState] = useState<UserSession>({
    name: 'Muhammad Shahid',
    role: 'Super Admin',
    email: 'shahid@friendsnetwork.net',
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (typeof window !== 'undefined') {
      const dbImported = localStorage.getItem('fnb_db_imported_v3');
      if (!dbImported) {
        localStorage.removeItem('fnb_customers');
        localStorage.removeItem('fnb_packages');
        localStorage.removeItem('fnb_invoices');
        localStorage.removeItem('fnb_payments');
        localStorage.removeItem('fnb_complaints');
        localStorage.removeItem('fnb_notifications');
        localStorage.setItem('fnb_db_imported_v3', 'true');
      }

      const storedCustomers = localStorage.getItem('fnb_customers');
      const storedPackages = localStorage.getItem('fnb_packages');
      const storedInvoices = localStorage.getItem('fnb_invoices');
      const storedPayments = localStorage.getItem('fnb_payments');
      const storedComplaints = localStorage.getItem('fnb_complaints');
      const storedNotifications = localStorage.getItem('fnb_notifications');
      const storedSettings = localStorage.getItem('fnb_settings');
      const storedUser = localStorage.getItem('fnb_current_user');

      setTimeout(() => {
        setCustomers(storedCustomers && dbImported ? JSON.parse(storedCustomers) : initialCustomers);
        setPackages(storedPackages && dbImported ? JSON.parse(storedPackages) : initialPackages);
        setInvoices(storedInvoices && dbImported ? JSON.parse(storedInvoices) : initialInvoices);
        setPayments(storedPayments && dbImported ? JSON.parse(storedPayments) : initialPayments);
        setComplaints(storedComplaints && dbImported ? JSON.parse(storedComplaints) : initialComplaints);
        setNotifications(storedNotifications && dbImported ? JSON.parse(storedNotifications) : initialNotifications);
        setSettings(storedSettings && dbImported ? JSON.parse(storedSettings) : defaultSettings);
        
        if (storedUser) {
          try {
            setCurrentUserState(JSON.parse(storedUser));
            setIsAuthenticated(true);
          } catch (e) {
            console.error('Failed to parse stored user', e);
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      }, 0);
      
      timer = setTimeout(() => {
        setIsLoaded(true);
      }, 2200);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  const saveToLocalStorage = (key: string, data: unknown) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
  };

  const setCurrentUser = (user: UserSession) => {
    setCurrentUserState(user);
    saveToLocalStorage('fnb_current_user', user);
    if (user && user.name) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  };


  const openRecharge = (customerId: string) => {
    setRechargeCustomerId(customerId);
  };

  const closeRecharge = () => {
    setRechargeCustomerId(null);
  };

  const addCustomer = (customerData: Omit<Customer, 'outstandingBalance' | 'timeline' | 'notes' | 'packageName'>) => {
    const pkg = packages.find((p) => p.id === customerData.packageId);
    const packageName = pkg ? pkg.name : 'Unknown Package';
    
    const newCustomer: Customer = {
      ...customerData,
      packageName,
      outstandingBalance: 0,
      timeline: [
        {
          id: `t-${Date.now()}`,
          title: 'Customer Added',
          description: `Customer account registered under plan ${packageName}.`,
          date: new Date().toISOString().split('T')[0],
          type: 'success',
        },
      ],
      notes: [],
    };

    const updated = [newCustomer, ...customers];
    setCustomers(updated);
    saveToLocalStorage('fnb_customers', updated);

    // Create a notification
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      type: 'new_customer',
      title: 'New Customer Registered',
      message: `${newCustomer.name} (${newCustomer.id}) has been added under package ${packageName}.`,
      date: new Date().toLocaleString(),
      isRead: false,
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);
    saveToLocalStorage('fnb_notifications', updatedNotifs);

    return newCustomer;
  };

  const updateCustomer = (updatedCustomer: Customer) => {
    const updated = customers.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c));
    setCustomers(updated);
    saveToLocalStorage('fnb_customers', updated);
  };

  const deleteCustomer = (id: string) => {
    const updated = customers.filter((c) => c.id !== id);
    setCustomers(updated);
    saveToLocalStorage('fnb_customers', updated);
  };

  const suspendCustomer = (id: string) => {
    const updated = customers.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          connectionStatus: 'Inactive' as const,
          timeline: [
            {
              id: `t-${Date.now()}`,
              title: 'Connection Suspended',
              description: 'Connection manually deactivated by admin.',
              date: new Date().toISOString().split('T')[0],
              type: 'error' as const,
            },
            ...c.timeline,
          ],
        };
      }
      return c;
    });
    setCustomers(updated);
    saveToLocalStorage('fnb_customers', updated);
  };

  const activateCustomer = (id: string) => {
    const updated = customers.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          connectionStatus: 'Active' as const,
          timeline: [
            {
              id: `t-${Date.now()}`,
              title: 'Connection Activated',
              description: 'Connection manually re-activated by admin.',
              date: new Date().toISOString().split('T')[0],
              type: 'success' as const,
            },
            ...c.timeline,
          ],
        };
      }
      return c;
    });
    setCustomers(updated);
    saveToLocalStorage('fnb_customers', updated);
  };

  const addPackage = (packageData: Omit<Package, 'id'>) => {
    const newPkg: Package = {
      ...packageData,
      id: `pkg-${packages.length + 1}`,
    };
    const updated = [...packages, newPkg];
    setPackages(updated);
    saveToLocalStorage('fnb_packages', updated);
  };

  const updatePackage = (updatedPkg: Package) => {
    const updated = packages.map((p) => (p.id === updatedPkg.id ? updatedPkg : p));
    setPackages(updated);
    saveToLocalStorage('fnb_packages', updated);
  };

  const deletePackage = (id: string) => {
    const updated = packages.filter((p) => p.id !== id);
    setPackages(updated);
    saveToLocalStorage('fnb_packages', updated);
  };

  const addInvoice = (invoiceData: Omit<Invoice, 'id' | 'grandTotal' | 'amountPaid' | 'outstandingBalance' | 'paymentStatus' | 'customerName'>) => {
    const customer = customers.find((c) => c.id === invoiceData.customerId);
    const customerName = customer ? customer.name : 'Unknown Customer';
    
    const subtotal = invoiceData.monthlyCharges + invoiceData.previousDue + invoiceData.additionalCharges;
    const discount = invoiceData.discount;
    const grandTotal = Math.max(0, subtotal - discount);

    const newInvoice: Invoice = {
      ...invoiceData,
      id: `INV-2026-${1000 + invoices.length + 1}`,
      customerName,
      grandTotal,
      amountPaid: 0,
      outstandingBalance: grandTotal,
      paymentStatus: 'Unpaid',
    };

    const updatedInvoices = [newInvoice, ...invoices];
    setInvoices(updatedInvoices);
    saveToLocalStorage('fnb_invoices', updatedInvoices);

    // Update customer outstanding balance and status
    const updatedCustomers = customers.map((c) => {
      if (c.id === invoiceData.customerId) {
        return {
          ...c,
          outstandingBalance: c.outstandingBalance + grandTotal,
          paymentStatus: 'Unpaid' as const,
          timeline: [
            {
              id: `t-${Date.now()}`,
              title: 'Invoice Generated',
              description: `Invoice ${newInvoice.id} generated for ${invoiceData.billingMonth} for PKR ${grandTotal}.`,
              date: new Date().toISOString().split('T')[0],
              type: 'info' as const,
            },
            ...c.timeline,
          ],
        };
      }
      return c;
    });
    setCustomers(updatedCustomers);
    saveToLocalStorage('fnb_customers', updatedCustomers);

    // Notification
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      type: 'payment_pending',
      title: 'Invoice Generated',
      message: `Invoice ${newInvoice.id} generated for ${customerName} - PKR ${grandTotal}.`,
      date: new Date().toLocaleString(),
      isRead: false,
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);
    saveToLocalStorage('fnb_notifications', updatedNotifs);

    return newInvoice;
  };

  const addPayment = (paymentData: Omit<Payment, 'id' | 'receivedBy'>) => {
    const newPaymentId = `REC-2026-${1000 + payments.length + 1}`;
    const newPayment: Payment = {
      ...paymentData,
      id: newPaymentId,
      receivedBy: 'Muhammad Shahid',
    };

    const updatedPayments = [newPayment, ...payments];
    setPayments(updatedPayments);
    saveToLocalStorage('fnb_payments', updatedPayments);

    // Find unpaid invoices for this customer and mark them paid
    let remainingPayment = paymentData.amountReceived;
    let customerInvoice: Invoice | undefined;

    const updatedInvoices = invoices.map((inv) => {
      if (inv.customerId === paymentData.customerId && inv.paymentStatus !== 'Paid') {
        customerInvoice = inv;
        const canPay = Math.min(inv.outstandingBalance, remainingPayment);
        const newOutstanding = inv.outstandingBalance - canPay;
        const newPaid = inv.amountPaid + canPay;
        remainingPayment -= canPay;
        
        return {
          ...inv,
          amountPaid: newPaid,
          outstandingBalance: newOutstanding,
          paymentStatus: newOutstanding === 0 ? ('Paid' as const) : ('Pending' as const),
        };
      }
      return inv;
    });

    setInvoices(updatedInvoices);
    saveToLocalStorage('fnb_invoices', updatedInvoices);

    // Update customer status and outstanding balance
    const updatedCustomers = customers.map((c) => {
      if (c.id === paymentData.customerId) {
        const newOutstanding = Math.max(0, c.outstandingBalance - paymentData.amountReceived);
        return {
          ...c,
          outstandingBalance: newOutstanding,
          paymentStatus: newOutstanding === 0 ? ('Paid' as const) : ('Pending' as const),
          timeline: [
            {
              id: `t-${Date.now()}`,
              title: 'Payment Received',
              description: `Received PKR ${paymentData.amountReceived} via ${paymentData.paymentMethod}. Ref: ${paymentData.referenceNumber || 'N/A'}.`,
              date: new Date().toISOString().split('T')[0],
              type: 'success' as const,
            },
            ...c.timeline,
          ],
        };
      }
      return c;
    });
    setCustomers(updatedCustomers);
    saveToLocalStorage('fnb_customers', updatedCustomers);

    // Notification
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      type: 'payment_received',
      title: 'Payment Received',
      message: `${paymentData.customerName} paid PKR ${paymentData.amountReceived} via ${paymentData.paymentMethod}.`,
      date: new Date().toLocaleString(),
      isRead: false,
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);
    saveToLocalStorage('fnb_notifications', updatedNotifs);

    return { payment: newPayment, invoice: customerInvoice };
  };

  const addBulkPayments = (paymentsData: Omit<Payment, 'id' | 'receivedBy'>[]) => {
    let tempPayments = [...payments];
    let tempInvoices = [...invoices];
    let tempCustomers = [...customers];
    let tempNotifications = [...notifications];

    paymentsData.forEach((payData, idx) => {
      const newPaymentId = `REC-2026-${1000 + tempPayments.length + 1}`;
      const newPayment: Payment = {
        ...payData,
        id: newPaymentId,
        receivedBy: 'Muhammad Shahid',
      };

      tempPayments = [newPayment, ...tempPayments];

      // Find unpaid invoices for this customer and mark them paid
      let remainingPayment = payData.amountReceived;
      tempInvoices = tempInvoices.map((inv) => {
        if (inv.customerId === payData.customerId && inv.paymentStatus !== 'Paid') {
          const canPay = Math.min(inv.outstandingBalance, remainingPayment);
          const newOutstanding = inv.outstandingBalance - canPay;
          const newPaid = inv.amountPaid + canPay;
          remainingPayment -= canPay;
          
          return {
            ...inv,
            amountPaid: newPaid,
            outstandingBalance: newOutstanding,
            paymentStatus: newOutstanding === 0 ? ('Paid' as const) : ('Pending' as const),
          };
        }
        return inv;
      });

      // Update customer status and outstanding balance
      tempCustomers = tempCustomers.map((c) => {
        if (c.id === payData.customerId) {
          const newOutstanding = Math.max(0, c.outstandingBalance - payData.amountReceived);
          return {
            ...c,
            outstandingBalance: newOutstanding,
            paymentStatus: newOutstanding === 0 ? ('Paid' as const) : ('Pending' as const),
            timeline: [
              {
                id: `t-${Date.now()}-${idx}`,
                title: 'Payment Received (Bulk)',
                description: `Received PKR ${payData.amountReceived} via ${payData.paymentMethod} in bulk update.`,
                date: new Date().toISOString().split('T')[0],
                type: 'success' as const,
              },
              ...c.timeline,
            ],
          };
        }
        return c;
      });

      // Create notification
      const newNotif: Notification = {
        id: `notif-${Date.now()}-${idx}`,
        type: 'payment_received',
        title: 'Payment Received (Bulk)',
        message: `${payData.customerName} paid PKR ${payData.amountReceived} via ${payData.paymentMethod} (Bulk).`,
        date: new Date().toLocaleString(),
        isRead: false,
      };
      tempNotifications = [newNotif, ...tempNotifications];
    });

    setPayments(tempPayments);
    saveToLocalStorage('fnb_payments', tempPayments);

    setInvoices(tempInvoices);
    saveToLocalStorage('fnb_invoices', tempInvoices);

    setCustomers(tempCustomers);
    saveToLocalStorage('fnb_customers', tempCustomers);

    setNotifications(tempNotifications);
    saveToLocalStorage('fnb_notifications', tempNotifications);
  };

  const addComplaint = (complaintData: Omit<Complaint, 'id' | 'ticketNumber' | 'status' | 'dateCreated' | 'timeline'>) => {
    const nextTicket = `TIC-${1000 + complaints.length + 1}`;
    
    const timeline = [
      {
        status: 'Pending',
        date: new Date().toLocaleString(),
        comment: 'Complaint Created.',
      },
    ];
    let initialStatus: Complaint['status'] = 'Pending';
    if (complaintData.assignedEngineer && complaintData.assignedEngineer !== 'None') {
      timeline.push({
        status: 'Assigned',
        date: new Date().toLocaleString(),
        comment: `Assigned to ${complaintData.assignedEngineer}.`,
      });
      initialStatus = 'Assigned';
    }

    const newComplaint: Complaint = {
      ...complaintData,
      id: `comp-${complaints.length + 1}`,
      ticketNumber: nextTicket,
      status: initialStatus,
      dateCreated: new Date().toISOString().split('T')[0],
      timeline,
    };

    const updatedComplaints = [newComplaint, ...complaints];
    setComplaints(updatedComplaints);
    saveToLocalStorage('fnb_complaints', updatedComplaints);

    // Update customer timeline
    const updatedCustomers = customers.map((c) => {
      if (c.id === complaintData.customerId) {
        return {
          ...c,
          timeline: [
            {
              id: `t-${Date.now()}`,
              title: 'Complaint Logged',
              description: `Logged complaint ticket ${nextTicket}: ${complaintData.issue}`,
              date: new Date().toISOString().split('T')[0],
              type: 'warning' as const,
            },
            ...c.timeline,
          ],
        };
      }
      return c;
    });
    setCustomers(updatedCustomers);
    saveToLocalStorage('fnb_customers', updatedCustomers);

    // Notification
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      type: 'complaint_created',
      title: 'Complaint Logged',
      message: `Ticket ${nextTicket} registered for ${complaintData.customerName}: "${complaintData.issue.substring(0, 40)}..."`,
      date: new Date().toLocaleString(),
      isRead: false,
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);
    saveToLocalStorage('fnb_notifications', updatedNotifs);
  };

  const updateComplaintStatus = (id: string, status: Complaint['status'], comment: string, engineer?: string, engineerNotes?: string) => {
    const updated = complaints.map((c) => {
      if (c.id === id) {
        const isResolved = status === 'Resolved';
        const newTimeline = [
          ...c.timeline,
          {
            status,
            date: new Date().toLocaleString(),
            comment,
          },
        ];
        return {
          ...c,
          status,
          assignedEngineer: engineer || c.assignedEngineer,
          timeline: newTimeline,
          engineerNotes: engineerNotes || c.engineerNotes,
          resolvedDate: isResolved ? new Date().toISOString().split('T')[0] : c.resolvedDate,
        };
      }
      return c;
    });

    const targetComp = complaints.find((c) => c.id === id);
    if (targetComp) {
      const isResolved = status === 'Resolved';
      const newNotif: Notification = {
        id: `notif-${Date.now()}`,
        type: isResolved ? 'complaint_resolved' : 'complaint_updated',
        title: isResolved ? 'Complaint Resolved' : 'Complaint Status Updated',
        message: `Ticket ${targetComp.ticketNumber} status updated to "${status}" by ${currentUser?.name || 'Staff'}. Notes: "${engineerNotes || 'None'}"`,
        date: new Date().toLocaleString(),
        isRead: false,
      };
      const updatedNotifs = [newNotif, ...notifications];
      setNotifications(updatedNotifs);
      saveToLocalStorage('fnb_notifications', updatedNotifs);
    }

    setComplaints(updated);
    saveToLocalStorage('fnb_complaints', updated);
  };

  const updateSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
    saveToLocalStorage('fnb_settings', newSettings);
  };

  const markNotificationAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    setNotifications(updated);
    saveToLocalStorage('fnb_notifications', updated);
  };

  const markAllNotificationsAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    saveToLocalStorage('fnb_notifications', updated);
  };

  const addCustomerNote = (customerId: string, text: string) => {
    const updated = customers.map((c) => {
      if (c.id === customerId) {
        return {
          ...c,
          notes: [
            {
              id: `n-${Date.now()}`,
              text,
              date: new Date().toISOString().split('T')[0],
              author: 'Muhammad Shahid (Admin)',
            },
            ...c.notes,
          ],
        };
      }
      return c;
    });
    setCustomers(updated);
    saveToLocalStorage('fnb_customers', updated);
  };

  return (
    <BillingSystemContext.Provider
      value={{
        customers,
        packages,
        invoices,
        payments,
        complaints,
        notifications,
        settings,
        rechargeCustomerId,
        currentUser,
        setCurrentUser,
        isAuthenticated,
        setIsAuthenticated,
        isLoaded,
        openRecharge,
        closeRecharge,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        suspendCustomer,
        activateCustomer,
        addPackage,
        updatePackage,
        deletePackage,
        addInvoice,
        addPayment,
        addComplaint,
        updateComplaintStatus,
        updateSettings,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addCustomerNote,
        addBulkPayments,
      }}
    >
      {isLoaded ? children : <StartupSplash />}
    </BillingSystemContext.Provider>
  );
}

export function useBillingSystem() {
  const context = useContext(BillingSystemContext);
  if (!context) {
    throw new Error('useBillingSystem must be used within a BillingSystemProvider');
  }
  return context;
}
