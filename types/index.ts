export type ConnectionStatus = 'Active' | 'Inactive';
export type PaymentStatus = 'Paid' | 'Unpaid' | 'Pending';

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface CustomerNote {
  id: string;
  text: string;
  date: string;
  author: string;
}

export interface Customer {
  id: string; // FNB-XXXX
  name: string;
  phone: string;
  whatsapp?: string;
  address: string;
  area: string;
  packageId: string;
  packageName: string;
  monthlyCharges: number;
  installationCharges: number;
  routerMac?: string;
  onuNumber?: string;
  connectionDate: string;
  connectionStatus: ConnectionStatus;
  paymentStatus: PaymentStatus;
  outstandingBalance: number;
  timeline: TimelineEvent[];
  notes: CustomerNote[];
}

export interface Package {
  id: string;
  name: string; // Basic, Bronze, Silver
  speed: string; // e.g., "15 Mbps", "35 Mbps"
  monthlyCharges: number;
  installationCharges: number;
  status: ConnectionStatus;
}

export interface Invoice {
  id: string; // INV-YYYY-XXXX
  customerId: string;
  customerName: string;
  billingMonth: string; // e.g., "July 2026"
  monthlyCharges: number;
  previousDue: number;
  additionalCharges: number;
  discount: number;
  tax: number;
  grandTotal: number;
  amountPaid: number;
  outstandingBalance: number;
  paymentStatus: PaymentStatus;
  billingDate: string;
  dueDate: string;
}

export interface Payment {
  id: string; // REC-XXXX
  customerId: string;
  customerName: string;
  amountReceived: number;
  paymentMethod: 'Cash' | 'Bank' | 'JazzCash' | 'EasyPaisa';
  referenceNumber?: string;
  paymentDate: string;
  billingMonth: string;
  notes?: string;
  receivedBy: string;
}

export interface Complaint {
  id: string;
  ticketNumber: string; // TIC-XXXX
  customerId: string;
  customerName: string;
  issue: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedEngineer: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  timeline: { status: string; date: string; comment: string }[];
  dateCreated: string;
}

export interface Notification {
  id: string;
  type: 'payment_received' | 'payment_pending' | 'connection_expired' | 'new_customer' | 'complaint_created';
  title: string;
  message: string;
  date: string;
  isRead: boolean;
}

export interface SystemSettings {
  companyName: string;
  logo: string;
  phone: string;
  email: string;
  address: string;
  currency: string;
  invoiceFooter: string;
  receiptFooter: string;
}
