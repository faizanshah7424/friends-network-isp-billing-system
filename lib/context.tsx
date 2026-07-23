'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer, Package, Invoice, Payment, Complaint, Notification, SystemSettings, UserSession } from '@/types';
import StartupSplash from '@/components/ui/StartupSplash';
import { authService } from '@/services/auth';
import { customerService } from '@/services/customers';
import { packageService } from '@/services/packages';
import { paymentService } from '@/services/payments';
import { billingService } from '@/services/billing';
import { complaintService } from '@/services/complaints';
import { notificationService } from '@/services/notifications';
import { settingsService } from '@/services/settings';

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
  setCurrentUser: (user: UserSession | null) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  isLoaded: boolean;
  openRecharge: (customerId: string) => void;
  closeRecharge: () => void;
  addCustomer: (customer: Omit<Customer, 'outstandingBalance' | 'timeline' | 'notes' | 'packageName'>) => any;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  suspendCustomer: (id: string) => void;
  activateCustomer: (id: string) => void;
  addPackage: (pkg: Omit<Package, 'id'>) => void;
  updatePackage: (pkg: Package) => void;
  deletePackage: (id: string) => void;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'grandTotal' | 'amountPaid' | 'outstandingBalance' | 'paymentStatus' | 'customerName'>) => any;
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
  const [settings, setSettings] = useState<SystemSettings>({
    companyName: 'Friends Network',
    logo: '/friends-logo.png',
    phone: '021-111-362-362',
    email: 'support@friendsnetwork.net',
    address: 'Karachi, Pakistan',
    currency: 'PKR',
    invoiceFooter: 'This is a computer-generated invoice.',
    receiptFooter: 'Thank you for your payment.',
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const [rechargeCustomerId, setRechargeCustomerId] = useState<string | null>(null);
  const [currentUser, setCurrentUserState] = useState<UserSession>({
    name: 'Muhammad Shahid',
    role: 'Super Admin',
    email: 'shahid@friendsnetwork.net',
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Synchronize data from backend
  const fetchData = async () => {
    try {
      const [pkgs, custs, invs, pays, comps, notifs, sets] = await Promise.all([
        packageService.getPackages(),
        customerService.getCustomers(),
        billingService.getInvoices(),
        paymentService.getPayments(),
        complaintService.getComplaints(),
        notificationService.getNotifications(),
        settingsService.getSettings(),
      ]);
      
      setPackages(pkgs);
      setCustomers(custs.map((c) => ({ ...c, customerId: c.customerId || c.id })));
      setInvoices(invs);
      setPayments(pays);
      setComplaints(comps);
      setNotifications(notifs);
      setSettings(sets);
    } catch (err) {
      console.error('Error fetching database lists from REST API:', err);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    const initAuthAndData = async () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('fnb_access_token');
        if (token) {
          try {
            const me = await authService.getMe();
            const sessionUser: UserSession = {
              name: me.fullName,
              role: me.role.name as 'Super Admin' | 'Sub Admin',
              email: me.username + '@friendsnetwork.net',
            };
            setCurrentUserState(sessionUser);
            setIsAuthenticated(true);
            await fetchData();
          } catch (err) {
            console.error('Session validation failed, clearing token:', err);
            localStorage.removeItem('fnb_access_token');
            localStorage.removeItem('fnb_current_user');
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      }
      
      // Enforce premium loader timing
      timer = setTimeout(() => {
        setIsLoaded(true);
      }, 2200);
    };

    initAuthAndData();
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      fetchData();
    }, 45000); // Poll every 45 seconds
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const setCurrentUser = (user: UserSession | null) => {
    if (user) {
      setCurrentUserState(user);
      setIsAuthenticated(true);
      fetchData();
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fnb_access_token');
        localStorage.removeItem('fnb_current_user');
      }
      setIsAuthenticated(false);
    }
  };

  const openRecharge = (customerId: string) => {
    setRechargeCustomerId(customerId);
  };

  const closeRecharge = () => {
    setRechargeCustomerId(null);
  };

  const addCustomer = async (customerData: Omit<Customer, 'outstandingBalance' | 'timeline' | 'notes' | 'packageName'>) => {
    const pkg = packages.find((p) => p.id === customerData.packageId);
    const packageName = pkg ? pkg.name : 'Unknown Package';
    const monthlyCharges = customerData.monthlyCharges || (pkg ? pkg.monthlyCharges : 0);
    
    const newCustomer: Customer = {
      ...customerData,
      customerId: customerData.id,
      packageName,
      monthlyCharges,
      outstandingBalance: customerData.installationCharges || 0,
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

    // Optimistic state update
    setCustomers((prev) => [newCustomer, ...prev]);

    try {
      await customerService.createCustomer({
        customerId: customerData.id,
        name: customerData.name,
        phone: customerData.phone,
        whatsapp: customerData.whatsapp,
        address: customerData.address,
        area: customerData.area,
        packageId: customerData.packageId,
        packageName: packageName,
        monthlyCharges: monthlyCharges,
        installationCharges: customerData.installationCharges || 0,
        routerMac: customerData.routerMac,
        onuNumber: customerData.onuNumber,
        connectionDate: customerData.connectionDate,
        connectionStatus: customerData.connectionStatus || 'Active',
        paymentStatus: customerData.paymentStatus || 'Unpaid',
      });
      await fetchData();
      return newCustomer;
    } catch (err) {
      console.error('Failed to create customer record on backend:', err);
      setCustomers((prev) => prev.filter((c) => c.id !== customerData.id));
      throw err;
    }
  };

  const updateCustomer = (updatedCustomer: Customer) => {
    // Optimistic Update
    setCustomers((prev) => prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c)));

    // Compare connectionStatus changes to fire specific endpoints
    const old = customers.find((c) => c.id === updatedCustomer.id);
    if (old) {
      if (old.connectionStatus !== updatedCustomer.connectionStatus) {
        if (updatedCustomer.connectionStatus === 'Active') {
          customerService.activateCustomer(updatedCustomer.id)
            .then(() => fetchData())
            .catch((err) => console.error(err));
        } else {
          customerService.suspendCustomer(updatedCustomer.id)
            .then(() => fetchData())
            .catch((err) => console.error(err));
        }
      }
      
      // Update metadata details
      if (old.name !== updatedCustomer.name || old.phone !== updatedCustomer.phone || old.address !== updatedCustomer.address || old.packageId !== updatedCustomer.packageId) {
        customerService.updateCustomer(updatedCustomer.id, {
          name: updatedCustomer.name,
          phone: updatedCustomer.phone,
          whatsapp: updatedCustomer.whatsapp,
          address: updatedCustomer.address,
          area: updatedCustomer.area,
          packageId: updatedCustomer.packageId,
          routerMac: updatedCustomer.routerMac,
          onuNumber: updatedCustomer.onuNumber,
        }).then(() => fetchData())
          .catch((err) => console.error(err));
      }
    }
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    customerService.deleteCustomer(id)
      .then(() => fetchData())
      .catch((err) => console.error('Failed to delete customer:', err));
  };

  const suspendCustomer = (id: string) => {
    setCustomers((prev) => prev.map((c) => {
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
    }));

    customerService.suspendCustomer(id)
      .then(() => fetchData())
      .catch((err) => console.error(err));
  };

  const activateCustomer = (id: string) => {
    setCustomers((prev) => prev.map((c) => {
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
    }));

    customerService.activateCustomer(id)
      .then(() => fetchData())
      .catch((err) => console.error(err));
  };

  const addPackage = (packageData: Omit<Package, 'id'>) => {
    const mockId = `pkg-${packages.length + 1}`;
    const newPkg: Package = {
      ...packageData,
      id: mockId,
    };
    setPackages((prev) => [...prev, newPkg]);

    packageService.createPackage(packageData)
      .then(() => fetchData())
      .catch((err) => console.error(err));
  };

  const updatePackage = (updatedPkg: Package) => {
    setPackages((prev) => prev.map((p) => (p.id === updatedPkg.id ? updatedPkg : p)));
    packageService.updatePackage(updatedPkg)
      .then(() => fetchData())
      .catch((err) => console.error(err));
  };

  const deletePackage = (id: string) => {
    setPackages((prev) => prev.filter((p) => p.id !== id));
    packageService.deletePackage(id)
      .then(() => fetchData())
      .catch((err) => console.error(err));
  };

  const addInvoice = (invoiceData: Omit<Invoice, 'id' | 'grandTotal' | 'amountPaid' | 'outstandingBalance' | 'paymentStatus' | 'customerName'>) => {
    const customer = customers.find((c) => c.id === invoiceData.customerId);
    const customerName = customer ? customer.name : 'Unknown Customer';
    
    const subtotal = invoiceData.monthlyCharges + invoiceData.previousDue + invoiceData.additionalCharges;
    const grandTotal = Math.max(0, subtotal - invoiceData.discount);
    const mockId = `INV-2026-${1000 + invoices.length + 1}`;

    const newInvoice: Invoice = {
      ...invoiceData,
      id: mockId,
      customerName,
      grandTotal,
      amountPaid: 0,
      outstandingBalance: grandTotal,
      paymentStatus: 'Unpaid',
    };

    setInvoices((prev) => [newInvoice, ...prev]);

    // Backend save
    billingService.createInvoice({
      customerId: invoiceData.customerId,
      billingMonth: invoiceData.billingMonth,
      monthlyCharges: invoiceData.monthlyCharges,
      previousDue: invoiceData.previousDue,
      additionalCharges: invoiceData.additionalCharges,
      discount: invoiceData.discount,
      billingDate: invoiceData.billingDate,
      dueDate: invoiceData.dueDate,
    }).then(() => {
      fetchData();
    }).catch((err) => {
      console.error(err);
    });

    return newInvoice;
  };

  const addPayment = (paymentData: Omit<Payment, 'id' | 'receivedBy'>) => {
    const newPaymentId = `REC-2026-${1000 + payments.length + 1}`;
    const newPayment: Payment = {
      ...paymentData,
      id: newPaymentId,
      receivedBy: currentUser?.name || 'Muhammad Shahid',
    };

    // Optimistic states update
    setPayments((prev) => [newPayment, ...prev]);

    let customerInvoice: Invoice | undefined;
    const updatedInvoices = invoices.map((inv) => {
      if (inv.customerId === paymentData.customerId && inv.paymentStatus !== 'Paid') {
        customerInvoice = inv;
        const canPay = Math.min(inv.outstandingBalance, paymentData.amountReceived);
        const newOutstanding = inv.outstandingBalance - canPay;
        return {
          ...inv,
          amountPaid: inv.amountPaid + canPay,
          outstandingBalance: newOutstanding,
          paymentStatus: newOutstanding === 0 ? ('Paid' as const) : ('Pending' as const),
        };
      }
      return inv;
    });
    setInvoices(updatedInvoices);

    setCustomers((prev) => prev.map((c) => {
      if (c.id === paymentData.customerId) {
        const newOutstanding = Math.max(0, c.outstandingBalance - paymentData.amountReceived);
        return {
          ...c,
          outstandingBalance: newOutstanding,
          paymentStatus: newOutstanding === 0 ? ('Paid' as const) : ('Pending' as const),
        };
      }
      return c;
    }));

    // REST call
    paymentService.receivePayment(
      paymentData.customerId,
      paymentData.amountReceived,
      paymentData.paymentMethod,
      paymentData.referenceNumber,
      0,
      paymentData.notes
    ).then(() => {
      fetchData();
    }).catch((err) => {
      console.error(err);
    });

    return { payment: newPayment, invoice: customerInvoice };
  };

  const addBulkPayments = (paymentsData: Omit<Payment, 'id' | 'receivedBy'>[]) => {
    const newPayments: Payment[] = [];
    paymentsData.forEach((payData, idx) => {
      const newPaymentId = `REC-2026-${1000 + payments.length + idx + 1}`;
      newPayments.push({
        ...payData,
        id: newPaymentId,
        receivedBy: currentUser?.name || 'Muhammad Shahid',
      });
    });

    setPayments((prev) => [...newPayments, ...prev]);

    // Backend bulk recharges execution
    const promises = paymentsData.map((pay) =>
      paymentService.receivePayment(
        pay.customerId,
        pay.amountReceived,
        pay.paymentMethod,
        pay.referenceNumber,
        0,
        pay.notes
      )
    );

    Promise.all(promises)
      .then(() => {
        fetchData();
      })
      .catch((err) => {
        console.error('Failed to submit bulk payment logs:', err);
      });
  };

  const addComplaint = async (complaintData: Omit<Complaint, 'id' | 'ticketNumber' | 'status' | 'dateCreated' | 'timeline'>) => {
    const nextTicket = `TIC-${1000 + complaints.length + 1}`;
    const newComplaint: Complaint = {
      ...complaintData,
      id: `comp-${complaints.length + 1}`,
      ticketNumber: nextTicket,
      status: (complaintData.assignedEngineer && complaintData.assignedEngineer !== 'None') ? 'Assigned' : 'Pending',
      dateCreated: new Date().toISOString().split('T')[0],
      timeline: [
        {
          status: 'Pending',
          date: new Date().toLocaleString(),
          comment: 'Complaint Created.',
        },
      ],
    };

    setComplaints((prev) => [newComplaint, ...prev]);

    try {
      await complaintService.createComplaint({
        customerId: complaintData.customerId,
        mobileNumber: complaintData.mobileNumber || '',
        category: complaintData.category || 'General Outage',
        issue: complaintData.issue,
        priority: complaintData.priority,
        assignedEngineer: complaintData.assignedEngineer === 'None' ? null : complaintData.assignedEngineer,
      });
      await fetchData();
      return newComplaint;
    } catch (err) {
      console.error('Failed to file complaint ticket:', err);
      setComplaints((prev) => prev.filter((c) => c.id !== newComplaint.id));
      throw err;
    }
  };

  const updateComplaintStatus = (
    id: string,
    status: Complaint['status'],
    comment: string,
    engineer?: string,
    engineerNotes?: string
  ) => {
    setComplaints((prev) => prev.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          status,
          assignedEngineer: engineer || c.assignedEngineer,
          engineerNotes: engineerNotes || c.engineerNotes,
          resolvedDate: status === 'Resolved' ? new Date().toISOString().split('T')[0] : c.resolvedDate,
          timeline: [
            ...c.timeline,
            { status, date: new Date().toLocaleString(), comment },
          ],
        };
      }
      return c;
    }));

    complaintService.updateComplaint(id, {
      status,
      assignedEngineer: engineer === 'None' ? null : engineer,
      engineerNotes,
      comment,
    }).then(() => {
      fetchData();
    }).catch((err) => {
      console.error(err);
    });
  };

  const updateSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
    settingsService.updateSettings(newSettings)
      .then(() => fetchData())
      .catch((err) => console.error(err));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    notificationService.markAsRead(id)
      .then(() => fetchData())
      .catch((err) => console.error(err));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    const unread = notifications.filter((n) => !n.isRead);
    const promises = unread.map((n) => notificationService.markAsRead(n.id));
    Promise.all(promises)
      .then(() => fetchData())
      .catch((err) => console.error(err));
  };

  const addCustomerNote = (customerId: string, text: string) => {
    setCustomers((prev) => prev.map((c) => {
      if (c.id === customerId) {
        return {
          ...c,
          notes: [
            {
              id: `n-${Date.now()}`,
              text,
              date: new Date().toISOString().split('T')[0],
              author: currentUser?.name || 'Muhammad Shahid (Admin)',
            },
            ...c.notes,
          ],
        };
      }
      return c;
    }));

    customerService.addCustomerNote(customerId, text)
      .then(() => fetchData())
      .catch((err) => console.error(err));
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
