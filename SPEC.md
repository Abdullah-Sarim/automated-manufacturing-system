# WAMS - Web-Based Automated Manufacturing System

## 1. Project Overview
- **Project Name**: WAMS (Web-Based Automated Manufacturing System)
- **Type**: Full-stack web application
- **Core Functionality**: Centralized platform for manufacturing companies to manage orders, inventory, suppliers, manufacturing processes, billing, and reports
- **Target Users**: Admin, Dealer, Supplier, Management Authority

## 2. Technology Stack
- **Frontend**: React.js 18, Tailwind CSS v3, Chart.js, React Router v6, Lucide React Icons, React Hot Toast
- **Backend**: Node.js, Express.js, SQLite (better-sqlite3)
- **Authentication**: JWT tokens, bcrypt for password hashing
- **API**: RESTful APIs

## 3. Database Schema

### Users Table
- userID (INTEGER PRIMARY KEY)
- username (TEXT UNIQUE)
- password (TEXT)
- role (TEXT) - admin, dealer, supplier, manager
- name (TEXT)
- email (TEXT)
- createdAt (DATETIME)

### Dealers Table
- dealerID (INTEGER PRIMARY KEY)
- userID (INTEGER FOREIGN KEY)
- companyName (TEXT)
- contactPerson (TEXT)
- phone (TEXT)
- address (TEXT)
- createdAt (DATETIME)

### Suppliers Table
- supplierID (INTEGER PRIMARY KEY)
- userID (INTEGER FOREIGN KEY)
- companyName (TEXT)
- contactPerson (TEXT)
- phone (TEXT)
- email (TEXT)
- address (TEXT)
- createdAt (DATETIME)

### Products Table
- productID (INTEGER PRIMARY KEY)
- name (TEXT)
- description (TEXT)
- price (REAL)
- stock (INTEGER)
- reorderLevel (INTEGER)
- createdAt (DATETIME)

### Raw Materials Table
- materialID (INTEGER PRIMARY KEY)
- name (TEXT)
- quantity (INTEGER)
- unit (TEXT)
- reorderLevel (INTEGER)
- createdAt (DATETIME)

### Orders Table
- orderID (INTEGER PRIMARY KEY)
- dealerID (INTEGER FOREIGN KEY)
- productID (INTEGER)
- quantity (INTEGER)
- status (TEXT) - pending, processing, completed, cancelled
- totalAmount (REAL)
- orderDate (DATETIME)
- createdAt (DATETIME)

### Quotations Table
- quoteID (INTEGER PRIMARY KEY)
- supplierID (INTEGER FOREIGN KEY)
- materialID (INTEGER)
- price (REAL)
- deliveryDate (DATE)
- status (TEXT) - pending, approved, rejected
- createdAt (DATETIME)

### Manufacturing Orders Table
- mfgID (INTEGER PRIMARY KEY)
- orderID (INTEGER FOREIGN KEY)
- productID (INTEGER)
- quantity (INTEGER)
- status (TEXT) - pending, in_progress, completed
- startDate (DATETIME)
- endDate (DATETIME)
- createdAt (DATETIME)

### Bills Table
- billID (INTEGER PRIMARY KEY)
- orderID (INTEGER FOREIGN KEY)
- dealerID (INTEGER FOREIGN KEY)
- amount (REAL)
- paymentStatus (TEXT) - pending, paid, overdue
- dueDate (DATE)
- createdAt (DATETIME)

### Notifications Table
- notificationID (INTEGER PRIMARY KEY)
- userID (INTEGER FOREIGN KEY)
- title (TEXT)
- message (TEXT)
- isRead (BOOLEAN)
- createdAt (DATETIME)

## 4. UI/UX Specification

### Color Palette
- Primary: #1e40af (Blue-800)
- Secondary: #0f172a (Slate-900)
- Accent: #3b82f6 (Blue-500)
- Success: #22c55e (Green-500)
- Warning: #f59e0b (Amber-500)
- Danger: #ef4444 (Red-500)
- Background: #f8fafc (Slate-50)
- Card: #ffffff
- Text Primary: #1e293b (Slate-800)
- Text Secondary: #64748b (Slate-500)

### Typography
- Font Family: Inter, system-ui, sans-serif
- Headings: 24px (h1), 20px (h2), 18px (h3)
- Body: 14px-16px
- Small: 12px

### Layout
- Sidebar: 256px fixed width (collapsible to 64px)
- Main Content: Fluid with max-width 1400px
- Card Padding: 24px
- Border Radius: 8px (cards), 6px (buttons), 4px (inputs)

### Components
- Dashboard Cards with hover effect
- Data Tables with search, filter, pagination
- Forms with validation
- Charts (Line, Bar, Pie)
- Modals for CRUD operations
- Toast notifications

## 5. Functionality Specification

### Authentication
- JWT-based authentication
- Role-based access control
- Password change functionality

### Dashboard (Role-specific)
- Admin: All stats, alerts, recent orders
- Dealer: My orders, order status
- Supplier: My quotations, pending quotes
- Manager: Reports, analytics

### Core Features
1. **Dealer Management**: CRUD, order placement, history
2. **Inventory**: Stock tracking, low stock alerts, reorder levels
3. **Supplier/Quotation**: RFQ, compare quotes, PO generation
4. **Manufacturing**: MO generation, production tracking
5. **Billing**: Bill generation, payment tracking
6. **Reports**: Sales, stock, supplier reports with charts
7. **Notifications**: Low stock, new orders, payment reminders

## 6. API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/profile
- PUT /api/auth/password

### Dealers
- GET /api/dealers
- POST /api/dealers
- PUT /api/dealers/:id
- DELETE /api/dealers/:id

### Products
- GET /api/products
- POST /api/products
- PUT /api/products/:id
- DELETE /api/products/:id

### Raw Materials
- GET /api/materials
- POST /api/materials
- PUT /api/materials/:id

### Orders
- GET /api/orders
- POST /api/orders
- PUT /api/orders/:id

### Quotations
- GET /api/quotations
- POST /api/quotations
- PUT /api/quotations/:id/approve

### Manufacturing
- GET /api/manufacturing
- POST /api/manufacturing
- PUT /api/manufacturing/:id

### Bills
- GET /api/bills
- POST /api/bills
- PUT /api/bills/:id

### Reports
- GET /api/reports/sales
- GET /api/reports/stock
- GET /api/reports/supplier

### Notifications
- GET /api/notifications
- PUT /api/notifications/:id/read

## 7. Folder Structure
```
WAMS/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── dealers.js
│   │   ├── products.js
│   │   ├── materials.js
│   │   ├── orders.js
│   │   ├── quotations.js
│   │   ├── manufacturing.js
│   │   ├── bills.js
│   │   └── reports.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── tailwind.config.js
│   ├── package.json
│   └── vite.config.js
└── README.md
```