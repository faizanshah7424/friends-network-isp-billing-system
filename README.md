# Friends Network Billing System - Premium ISP Dashboard

A premium SaaS-style Customer Management and Billing ERP designed for modern Internet Service Providers (ISPs). Built using **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Framer Motion**.

This dashboard is fully client-side and operates with a reactive, synchronized database store backed by `localStorage` so that administrative actions (registering clients, adjusting plan configurations, generating bills, and collecting payments) are persisted across page reloads and instantly reflected in all charts and printable templates.

---

## 🚀 Key Features

*   **⚡ Reactive State Engine:** Centralized React context (`lib/context.tsx`) that acts as a client-side mock database. Adding a customer, changing settings, filing tickets, generating invoices, or clearing payments updates all graphs, counters, ledger books, and printable templates instantly.
*   **📊 Dynamic Business Analytics:** Rich charting using `Recharts` showing projected Monthly Revenue vs Collections trend graphs, Zone subscriber density donut charts, and automated status ratio KPIs.
*   **📋 Interactive Customer Directory:** Clean, responsive data tables featuring name/ID search, multi-zone filters, payment status sorting, pagination, and one-click **Export to CSV**.
*   **🧾 Real-time Billing Desk & Invoice Preview:** Custom bill generation form with automatic previous due detection, 15% SST calculation, and a live, side-by-side Invoice Sheet preview that updates as you type.
*   **💵 Payments Desk & Printable Receipts:** Log cash, bank, EasyPaisa, or JazzCash payments. Generates a pixel-perfect, printable payment receipt with authorization signature slots.
*   **🛠️ Full complaints Ticket Desk:** Split-pane support ticketing desk with priority status tags, assigned field engineers, resolution timeline feeds, and re-assignment forms.
*   **⚙️ Custom settings Console:** Configure company branding, logo, helpline numbers, and footer disclaimers. Changing these values propagates instantly to all generated bills and payment receipts.
*   **🌙 Dark & Light Themes:** Toggle between dark mode and light mode, retaining state via local storage.

---

## 📂 Project Architecture

```filepath
app/
 ├── (dashboard)/
 │    ├── billing/page.tsx          # Billing Desk & Invoice Preview
 │    ├── complaints/page.tsx       # Support Tickets & Engineer Assignment
 │    ├── customers/
 │    │    ├── page.tsx             # Customer Directory Table & CSV Export
 │    │    ├── [id]/page.tsx        # Profile timeline, Invoices, & Staff Notes
 │    │    └── add/page.tsx         # Register Customer Form (Zod/React Hook Form)
 │    ├── invoices/page.tsx         # Invoice Logs & Detailed Print Modal
 │    ├── notifications/page.tsx    # Chronological Audit Event log
 │    ├── packages/page.tsx         # Bandwidth Service Plans (CRUD UI)
 │    ├── payments/page.tsx         # Record payments & Receipt Preview
 │    ├── reports/page.tsx          # Collection ledger sheets & Debtor logs
 │    ├── settings/page.tsx         # System Customization Panel
 │    ├── layout.tsx                # Sidebar, Topbar, & responsive drawers
 │    └── page.tsx                  # Dashboard Home (KPIs, Charts, & Quick Actions)
 ├── globals.css                    # Tailwind CSS v4 variables & custom scrollbars
 └── layout.tsx                     # Providers wrapper (Theme, LocalDB Context)
components/
 ├── Navbar.tsx                     # Topbar with autocomplete search & notification drawer
 ├── Sidebar.tsx                    # Side navigation panel & Admin slot
 ├── StatCard.tsx                   # Animated KPI metric card
 └── StatusBadge.tsx                # Status color tags
data/
 └── dummyData.ts                   # Seed database of customers, packages, & tickets
types/
 └── index.ts                       # Domain TypeScript interfaces
lib/
 ├── context.tsx                    # Mock database provider (localStorage)
 └── ThemeContext.tsx               # Class-based Light/Dark switcher
```

---

## 🛠️ Setup & Local Development

### 1. Install Dependencies
Run the package installation:
```bash
npm install
```

### 2. Launch Development Server
Start the dev server on port `3000`:
```bash
npm run dev
```
Open `http://localhost:3000` in your web browser.

### 3. Production Compilation & Typecheck
Compile page optimization and TypeScript verification:
```bash
npm run build
```

---

## 🎨 Design Systems & UI Style

*   **Colors:** Tailored HSL color variables (Dark: Slate-950/Deep Blue, Light: Slate-50) using indigo/violet accent tones. No browser defaults.
*   **Badges:** Status colors map to:
    *   `Active` = Emerald Green
    *   `Inactive` = Rose Red
    *   `Paid` = Blue
    *   `Pending` = Amber Orange
*   **Animations:** Powered by Framer Motion. Smooth page mounts, hover elevation shifts, and slide-in overlays for mobile screens.
*   **Printing:** All Receipts and Invoices support dedicated `@media print` CSS configurations, hiding standard buttons, navigation drawers, and background panels when printing.
