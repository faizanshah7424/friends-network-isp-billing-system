import { Customer, Package, Invoice, Payment, Complaint, Notification, SystemSettings } from '@/types';

export const initialPackages: Package[] = [
  { id: 'pkg-1', name: 'Basic', speed: '15 Mbps', monthlyCharges: 1200, status: 'Active' },
  { id: 'pkg-2', name: 'Bronze', speed: '35 Mbps', monthlyCharges: 2000, status: 'Active' },
  { id: 'pkg-3', name: 'Silver', speed: '60 Mbps', monthlyCharges: 3000, status: 'Active' }
];

export const initialCustomers: Customer[] = [
  {
    id: 'FNB-1001',
    name: 'Muhammad Ali',
    phone: '0300-1234567',
    whatsapp: '0300-1234567',
    address: 'Flat A-104, Block 5, Clifton',
    area: 'Clifton',
    packageId: 'pkg-3',
    packageName: 'Silver',
    monthlyCharges: 3000,
    routerMac: 'AA:BB:CC:DD:EE:11',
    onuNumber: 'ONUM-482910',
    connectionDate: '2025-01-15',
    connectionStatus: 'Active',
    paymentStatus: 'Paid',
    outstandingBalance: 0,
    timeline: [
      { id: 't-1', title: 'Connection Activated', description: 'ONT configured and line activated successfully.', date: '2025-01-15', type: 'success' },
      { id: 't-2', title: 'Router Upgraded', description: 'Dual-band router replaced on request.', date: '2025-06-10', type: 'info' }
    ],
    notes: [
      { id: 'n-1', text: 'Prefers evening visits for maintenance.', date: '2025-01-16', author: 'Muhammad Shahid (Admin)' }
    ]
  },
  {
    id: 'FNB-1002',
    name: 'Ayesha Khan',
    phone: '0321-7654321',
    whatsapp: '0321-7654321',
    address: 'House 42, Street 3, DHA Phase 6',
    area: 'DHA',
    packageId: 'pkg-3',
    packageName: 'Silver',
    monthlyCharges: 3000,
    routerMac: 'AA:BB:CC:DD:EE:22',
    onuNumber: 'ONUM-998124',
    connectionDate: '2025-03-20',
    connectionStatus: 'Active',
    paymentStatus: 'Unpaid',
    outstandingBalance: 3000,
    timeline: [
      { id: 't-3', title: 'Connection Activated', description: 'DHA distribution box linked.', date: '2025-03-20', type: 'success' }
    ],
    notes: []
  },
  {
    id: 'FNB-1003',
    name: 'Zainab Bibi',
    phone: '0333-1122334',
    whatsapp: '0333-1122334',
    address: 'Apartment 3C, Pearl Heights, Gulshan-e-Iqbal Block 13',
    area: 'Gulshan-e-Iqbal',
    packageId: 'pkg-1',
    packageName: 'Basic',
    monthlyCharges: 1200,
    routerMac: '11:22:33:44:55:66',
    onuNumber: 'ONUM-883391',
    connectionDate: '2024-11-10',
    connectionStatus: 'Active',
    paymentStatus: 'Paid',
    outstandingBalance: 0,
    timeline: [
      { id: 't-4', title: 'Connection Activated', description: 'Substituted older copper setup with GPON.', date: '2024-11-10', type: 'success' }
    ],
    notes: [
      { id: 'n-2', text: 'Requested auto-receipts on WhatsApp.', date: '2024-11-11', author: 'Muhammad Shahid (Admin)' }
    ]
  },
  {
    id: 'FNB-1004',
    name: 'Bilal Ahmed',
    phone: '0345-4455667',
    address: 'House 112, Block L, Johar Town',
    area: 'Johar Town',
    packageId: 'pkg-1',
    packageName: 'Basic',
    monthlyCharges: 1200,
    routerMac: 'AA:BB:CC:11:22:33',
    onuNumber: 'ONUM-110022',
    connectionDate: '2025-05-01',
    connectionStatus: 'Active',
    paymentStatus: 'Pending',
    outstandingBalance: 1200,
    timeline: [
      { id: 't-5', title: 'Connection Activated', description: 'Johar Town sub-ring loop connection.', date: '2025-05-01', type: 'success' }
    ],
    notes: []
  },
  {
    id: 'FNB-1005',
    name: 'Tech Ventures PK',
    phone: '021-34567890',
    whatsapp: '0300-8899889',
    address: 'Office 702, 7th Floor, Executive Tower, Clifton Block 9',
    area: 'Clifton',
    packageId: 'pkg-3',
    packageName: 'Silver',
    monthlyCharges: 3000,
    routerMac: 'FF:EE:DD:CC:BB:AA',
    onuNumber: 'ONUM-772211',
    connectionDate: '2024-06-01',
    connectionStatus: 'Active',
    paymentStatus: 'Paid',
    outstandingBalance: 0,
    timeline: [
      { id: 't-6', title: 'Corporate Fiber SLA Active', description: 'Dual ring redundancy tested.', date: '2024-06-01', type: 'success' }
    ],
    notes: [
      { id: 'n-3', text: 'Corporate SLA active.', date: '2024-06-02', author: 'NOC Manager' }
    ]
  },
  {
    id: 'FNB-1006',
    name: 'Hamza Siddiqui',
    phone: '0312-3344556',
    address: 'House B-22, Street 8, Bahria Town Precinct 1',
    area: 'Bahria Town',
    packageId: 'pkg-2',
    packageName: 'Bronze',
    monthlyCharges: 2000,
    connectionDate: '2025-02-18',
    connectionStatus: 'Inactive',
    paymentStatus: 'Unpaid',
    outstandingBalance: 4000,
    timeline: [
      { id: 't-7', title: 'Connection Activated', description: 'Precinct 1 optical node.', date: '2025-02-18', type: 'success' },
      { id: 't-8', title: 'Connection Suspended', description: 'Suspended automatically due to non-payment of 2 bills.', date: '2026-06-10', type: 'error' }
    ],
    notes: [
      { id: 'n-4', text: 'Customer claims they are out of the country.', date: '2026-06-11', author: 'Admin' }
    ]
  },
  {
    id: 'FNB-1007',
    name: 'Sana Fatima',
    phone: '0336-9900112',
    address: 'Flat 501, Boulevard Residency, Gulistan-e-Jauhar Block 17',
    area: 'Gulistan-e-Jauhar',
    packageId: 'pkg-1',
    packageName: 'Basic',
    monthlyCharges: 1200,
    routerMac: '88:99:AA:BB:CC:DD',
    onuNumber: 'ONUM-229988',
    connectionDate: '2025-04-10',
    connectionStatus: 'Active',
    paymentStatus: 'Paid',
    outstandingBalance: 0,
    timeline: [
      { id: 't-9', title: 'Connection Activated', description: 'Jauhar Splice completed.', date: '2025-04-10', type: 'success' }
    ],
    notes: []
  },
  {
    id: 'FNB-1008',
    name: 'Kamran Shah',
    phone: '0315-9988776',
    whatsapp: '0315-9988776',
    address: 'House 56, Block D, DHA City',
    area: 'DHA',
    packageId: 'pkg-3',
    packageName: 'Silver',
    monthlyCharges: 3000,
    routerMac: '44:55:66:77:88:99',
    onuNumber: 'ONUM-113355',
    connectionDate: '2025-05-15',
    connectionStatus: 'Active',
    paymentStatus: 'Unpaid',
    outstandingBalance: 3000,
    timeline: [
      { id: 't-10', title: 'Dedicated fiber link pulled', description: 'Private IP block assigned.', date: '2025-05-15', type: 'success' }
    ],
    notes: []
  }
];

export const initialInvoices: Invoice[] = [
  {
    id: 'INV-2026-1001',
    customerId: 'FNB-1001',
    customerName: 'Muhammad Ali',
    billingMonth: 'July 2026',
    monthlyCharges: 3000,
    previousDue: 0,
    additionalCharges: 0,
    discount: 0,
    grandTotal: 3000,
    amountPaid: 3000,
    outstandingBalance: 0,
    paymentStatus: 'Paid',
    billingDate: '2026-07-01',
    dueDate: '2026-07-10'
  },
  {
    id: 'INV-2026-1002',
    customerId: 'FNB-1002',
    customerName: 'Ayesha Khan',
    billingMonth: 'July 2026',
    monthlyCharges: 3000,
    previousDue: 0,
    additionalCharges: 0,
    discount: 0,
    grandTotal: 3000,
    amountPaid: 0,
    outstandingBalance: 3000,
    paymentStatus: 'Unpaid',
    billingDate: '2026-07-01',
    dueDate: '2026-07-10'
  },
  {
    id: 'INV-2026-1003',
    customerId: 'FNB-1003',
    customerName: 'Zainab Bibi',
    billingMonth: 'July 2026',
    monthlyCharges: 1200,
    previousDue: 0,
    additionalCharges: 0,
    discount: 100,
    grandTotal: 1100,
    amountPaid: 1100,
    outstandingBalance: 0,
    paymentStatus: 'Paid',
    billingDate: '2026-07-01',
    dueDate: '2026-07-10'
  },
  {
    id: 'INV-2026-1004',
    customerId: 'FNB-1004',
    customerName: 'Bilal Ahmed',
    billingMonth: 'July 2026',
    monthlyCharges: 1200,
    previousDue: 0,
    additionalCharges: 0,
    discount: 0,
    grandTotal: 1200,
    amountPaid: 0,
    outstandingBalance: 1200,
    paymentStatus: 'Pending',
    billingDate: '2026-07-01',
    dueDate: '2026-07-10'
  },
  {
    id: 'INV-2026-1005',
    customerId: 'FNB-1005',
    customerName: 'Tech Ventures PK',
    billingMonth: 'July 2026',
    monthlyCharges: 3000,
    previousDue: 0,
    additionalCharges: 0,
    discount: 0,
    grandTotal: 3000,
    amountPaid: 3000,
    outstandingBalance: 0,
    paymentStatus: 'Paid',
    billingDate: '2026-07-01',
    dueDate: '2026-07-10'
  },
  {
    id: 'INV-2026-1006',
    customerId: 'FNB-1006',
    customerName: 'Hamza Siddiqui',
    billingMonth: 'June 2026',
    monthlyCharges: 2000,
    previousDue: 2000,
    additionalCharges: 0,
    discount: 0,
    grandTotal: 4000,
    amountPaid: 0,
    outstandingBalance: 4000,
    paymentStatus: 'Unpaid',
    billingDate: '2026-06-01',
    dueDate: '2026-06-10'
  },
  {
    id: 'INV-2026-1007',
    customerId: 'FNB-1007',
    customerName: 'Sana Fatima',
    billingMonth: 'July 2026',
    monthlyCharges: 1200,
    previousDue: 0,
    additionalCharges: 0,
    discount: 0,
    grandTotal: 1200,
    amountPaid: 1200,
    outstandingBalance: 0,
    paymentStatus: 'Paid',
    billingDate: '2026-07-01',
    dueDate: '2026-07-10'
  },
  {
    id: 'INV-2026-1008',
    customerId: 'FNB-1008',
    customerName: 'Kamran Shah',
    billingMonth: 'July 2026',
    monthlyCharges: 3000,
    previousDue: 0,
    additionalCharges: 0,
    discount: 0,
    grandTotal: 3000,
    amountPaid: 0,
    outstandingBalance: 3000,
    paymentStatus: 'Unpaid',
    billingDate: '2026-07-01',
    dueDate: '2026-07-10'
  }
];

export const initialPayments: Payment[] = [
  {
    id: 'REC-2026-1001',
    customerId: 'FNB-1001',
    customerName: 'Muhammad Ali',
    amountReceived: 3000,
    paymentMethod: 'EasyPaisa',
    referenceNumber: 'EP-9988223311',
    paymentDate: '2026-07-03 10:15 AM',
    billingMonth: 'July 2026',
    receivedBy: 'Muhammad Shahid'
  },
  {
    id: 'REC-2026-1002',
    customerId: 'FNB-1003',
    customerName: 'Zainab Bibi',
    amountReceived: 1100,
    paymentMethod: 'JazzCash',
    referenceNumber: 'JC-1200239129',
    paymentDate: '2026-07-04 02:40 PM',
    billingMonth: 'July 2026',
    receivedBy: 'Muhammad Shahid'
  },
  {
    id: 'REC-2026-1003',
    customerId: 'FNB-1005',
    customerName: 'Tech Ventures PK',
    amountReceived: 3000,
    paymentMethod: 'Bank',
    referenceNumber: 'HBL-FT-48201',
    paymentDate: '2026-07-02 11:00 AM',
    billingMonth: 'July 2026',
    receivedBy: 'Muhammad Shahid'
  },
  {
    id: 'REC-2026-1004',
    customerId: 'FNB-1007',
    customerName: 'Sana Fatima',
    amountReceived: 1200,
    paymentMethod: 'Cash',
    paymentDate: '2026-07-05 06:12 PM',
    billingMonth: 'July 2026',
    receivedBy: 'Muhammad Shahid'
  }
];

export const initialComplaints: Complaint[] = [
  {
    id: 'comp-1',
    ticketNumber: 'TIC-1024',
    customerId: 'FNB-1002',
    customerName: 'Ayesha Khan',
    issue: 'High latency and packet loss during video calls.',
    priority: 'High',
    assignedEngineer: 'Yasir Ahmed',
    status: 'In Progress',
    dateCreated: '2026-07-11',
    timeline: [
      { status: 'Open', date: '2026-07-11 11:30 AM', comment: 'Ticket created by customer app.' },
      { status: 'In Progress', date: '2026-07-12 09:15 AM', comment: 'Yasir assigned. DHA node inspected.' }
    ]
  },
  {
    id: 'comp-2',
    ticketNumber: 'TIC-1025',
    customerId: 'FNB-1006',
    customerName: 'Hamza Siddiqui',
    issue: 'Complete connection outage / Red light on ONU.',
    priority: 'Critical',
    assignedEngineer: 'Yasir Ahmed',
    status: 'Open',
    dateCreated: '2026-07-13',
    timeline: [
      { status: 'Open', date: '2026-07-13 08:00 AM', comment: 'Outage reported. Red LOS light verified.' }
    ]
  },
  {
    id: 'comp-3',
    ticketNumber: 'TIC-1021',
    customerId: 'FNB-1001',
    customerName: 'Muhammad Ali',
    issue: 'Router configuration - port forwarding required.',
    priority: 'Low',
    assignedEngineer: 'Naveed Akhtar',
    status: 'Resolved',
    dateCreated: '2026-07-09',
    timeline: [
      { status: 'Open', date: '2026-07-09 03:00 PM', comment: 'Customer requests port 8080 forward.' },
      { status: 'Resolved', date: '2026-07-09 04:30 PM', comment: 'Forwarded via TR-069.' }
    ]
  }
];

export const initialNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'payment_received',
    title: 'Payment Received',
    message: 'FNB-1001 (Muhammad Ali) paid PKR 3,000 via EasyPaisa.',
    date: '2026-07-13 03:10 PM',
    isRead: false
  },
  {
    id: 'notif-2',
    type: 'new_customer',
    title: 'New Customer Registered',
    message: 'Kamran Shah (FNB-1008) has been activated on Silver package.',
    date: '2026-07-13 11:20 AM',
    isRead: false
  },
  {
    id: 'notif-3',
    type: 'complaint_created',
    title: 'New Critical Ticket',
    message: 'Hamza Siddiqui (FNB-1006) reported complete outage: TIC-1025.',
    date: '2026-07-13 08:00 AM',
    isRead: true
  },
  {
    id: 'notif-4',
    type: 'payment_pending',
    title: 'Payment Reminder Sent',
    message: 'Auto-reminder sent to 4 unpaid customers for July billing.',
    date: '2026-07-12 10:00 AM',
    isRead: true
  }
];

export const defaultSettings: SystemSettings = {
  companyName: 'Friends Network',
  logo: '/friends-logo.png',
  phone: '021-111-362-362',
  email: 'support@friendsnetwork.net',
  address: 'Suite 201, 2nd Floor, Marine Heights, Clifton Block 2, Karachi, Pakistan',
  currency: 'PKR',
  invoiceFooter: 'This is a computer-generated invoice from Friends Network Broadband and does not require a physical signature. Please clear your dues by the due date to avoid service interruption.',
  receiptFooter: 'Thank you for your payment. Keep this receipt for your records. For complaints, contact support@friendsnetwork.net.'
};
