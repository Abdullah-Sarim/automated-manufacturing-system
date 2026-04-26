# WAMS - Web-Based Automated Manufacturing System

A comprehensive full-stack web application for manufacturing companies to manage orders, inventory, suppliers, manufacturing processes, billing, and reports.

## Overview

WAMS (Web-Based Automated Manufacturing System) is a centralized platform that streamlines manufacturing operations by providing role-based access for Admin, Dealer, Supplier, and Manager users. The system handles the complete lifecycle of manufacturing orders from order placement to billing and delivery.

## Technology Stack

### Frontend
- **React.js 18** - UI framework
- **Tailwind CSS v3** - Styling
- **Chart.js & React-Chartjs-2** - Data visualization
- **React Router v6** - Navigation
- **Lucide React** - Icons
- **React Hot Toast** - Notifications
- **Axios** - HTTP client
- **Vite** - Build tool

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite (sql.js)** - Database
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **cors** - Cross-origin resource sharing

## Project Structure

```
WAMS/
├── backend/
│   ├── config/
│   │   └── database.js        # SQLite database configuration
│   ├── middleware/
│   │   └── auth.js            # JWT authentication & authorization
│   ├── routes/
│   │   ├── auth.js            # Authentication (login, register, profile)
│   │   ├── users.js           # User management
│   │   ├── dealers.js         # Dealer CRUD operations
│   │   ├── suppliers.js       # Supplier management
│   │   ├── products.js        # Product/inventory management
│   │   ├── materials.js       # Raw materials tracking
│   │   ├── orders.js          # Order processing & workflow
│   │   ├── quotations.js      # Supplier quotations/RFQ
│   │   ├── manufacturing.js   # Manufacturing orders
│   │   ├── bills.js           # Billing & payments
│   │   ├── reports.js         # Analytics & reports
│   │   └── notifications.js   # User notifications
│   ├── server.js              # Express server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx     # Top navigation bar
│   │   │   ├── Sidebar.jsx    # Side navigation menu
│   │   │   └── Layout.jsx     # Main layout wrapper
│   │   ├── pages/
│   │   │   ├── Login.jsx      # User login
│   │   │   ├── Register.jsx   # User registration
│   │   │   ├── Dashboard.jsx  # Role-based dashboard
│   │   │   ├── Products.jsx   # Product management
│   │   │   ├── Materials.jsx  # Raw materials
│   │   │   ├── Orders.jsx     # Order management
│   │   │   ├── PlaceOrder.jsx # Order placement
│   │   │   ├── Dealers.jsx    # Dealer management
│   │   │   ├── Suppliers.jsx  # Supplier management
│   │   │   ├── Quotations.jsx # Supplier quotations
│   │   │   ├── Manufacturing.jsx # Manufacturing orders
│   │   │   ├── Bills.jsx      # Billing management
│   │   │   ├── Reports.jsx    # Analytics & charts
│   │   │   ├── Notifications.jsx # User notifications
│   │   │   ├── UserManagement.jsx # User admin
│   │   │   ├── Profile.jsx    # User profile
│   │   │   ├── DealerDashboard.jsx
│   │   │   ├── DealerBills.jsx
│   │   │   ├── SupplierDashboard.jsx
│   │   │   ├── SupplierBills.jsx
│   │   │   └── SupplierQuotations.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Authentication state
│   │   ├── utils/
│   │   │   └── api.js         # API helper functions
│   │   ├── App.jsx            # Main app component
│   │   ├── index.jsx          # Entry point
│   │   └── index.css          # Global styles
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   ├── package.json
│   └── index.html
├── Screenshots/               # Application screenshots
├── SPEC.md                    # Detailed specifications
├── .gitignore
└── README.md
```

## Features

### Authentication & Authorization
- JWT-based authentication with secure token refresh
- Role-based access control (Admin, Dealer, Supplier, Manager)
- Password change functionality
- Approval workflow for dealer/supplier registration

### Dashboard
- **Admin Dashboard**: Overview of all operations, pending approvals, alerts
- **Dealer Dashboard**: Order history, order status tracking
- **Supplier Dashboard**: Quotation management, pending quotes
- **Manager Dashboard**: Reports, analytics, manufacturing oversight

### Core Modules

1. **Dealer Management**
   - Add/Edit/Delete dealers
   - View dealer profiles and order history
   - Dealer approval system

2. **Supplier Management**
   - Supplier registration and approval
   - Company profiles and contact information
   - Performance tracking

3. **Product/Inventory Management**
   - Product catalog with pricing
   - Stock level tracking
   - Low stock alerts and reorder levels
   - Real-time inventory updates

4. **Raw Materials Tracking**
   - Material inventory management
   - Stock monitoring
   - Reorder level alerts

5. **Order Management**
   - Single and bulk order placement
   - Order workflow tracking (received → stock verified → billing → completed)
   - Stock availability checking (available/partial/unavailable)
   - Order status updates (pending, processing, completed, cancelled)
   - Notification system for order updates

6. **Supplier Quotations (RFQ)**
   - Request for quotations from suppliers
   - Compare quotes
   - Approve quotations and generate purchase orders
   - Track delivery dates

7. **Manufacturing Orders**
   - Manufacturing order creation
   - Production tracking
   - Start/end date management
   - Status updates (pending, in_progress, completed)

8. **Billing & Payments**
   - Automatic bill generation from orders
   - Payment status tracking (pending, paid, overdue)
   - Due date management
   - Dealer and supplier bills

9. **Reports & Analytics**
   - Sales reports with charts
   - Stock level reports
   - Supplier performance reports
   - Interactive charts (Line, Bar, Pie)

10. **Notifications**
    - Low stock alerts
    - New order notifications
    - Payment reminders
    - Order status updates

## User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full system access, user management, approvals, all CRUD operations |
| **Manager** | Order processing, manufacturing oversight, reports, analytics |
| **Dealer** | Place orders, view order history, make payments, view bills |
| **Supplier** | Submit quotations, view purchase orders, manage supply orders |

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/password` - Change password

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Dealers
- `GET /api/dealers` - List dealers
- `POST /api/dealers` - Add dealer
- `PUT /api/dealers/:id` - Update dealer
- `DELETE /api/dealers/:id` - Delete dealer

### Products
- `GET /api/products` - List products
- `POST /api/products` - Add product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Materials
- `GET /api/materials` - List raw materials
- `POST /api/materials` - Add material
- `PUT /api/materials/:id` - Update material

### Orders
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `POST /api/orders/bulk` - Create bulk orders
- `PUT /api/orders/:id` - Update order status
- `PUT /api/orders/:id/process` - Process order
- `PUT /api/orders/:id/generate-bill` - Generate bill

### Quotations
- `GET /api/quotations` - List quotations
- `POST /api/quotations` - Create quotation
- `PUT /api/quotations/:id/approve` - Approve quotation

### Manufacturing
- `GET /api/manufacturing` - List manufacturing orders
- `POST /api/manufacturing` - Create manufacturing order
- `PUT /api/manufacturing/:id` - Update manufacturing order

### Bills
- `GET /api/bills` - List bills
- `POST /api/bills` - Create bill
- `PUT /api/bills/:id` - Update bill

### Reports
- `GET /api/reports/sales` - Sales reports
- `GET /api/reports/stock` - Stock reports
- `GET /api/reports/supplier` - Supplier reports

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read

## Database Schema

### Users Table
| Column | Type | Description |
|--------|------|-------------|
| userID | INTEGER | Primary key |
| username | TEXT | Unique username |
| password | TEXT | Hashed password |
| role | TEXT | admin, dealer, supplier, manager |
| name | TEXT | Full name |
| email | TEXT | Email address |
| approvalStatus | TEXT | pending, approved, rejected |
| createdAt | DATETIME | Creation timestamp |

### Dealers Table
| Column | Type | Description |
|--------|------|-------------|
| dealerID | INTEGER | Primary key |
| userID | INTEGER | Foreign key to users |
| companyName | TEXT | Company name |
| contactPerson | TEXT | Contact person |
| phone | TEXT | Phone number |
| address | TEXT | Address |
| approved | BOOLEAN | Approval status |

### Suppliers Table
| Column | Type | Description |
|--------|------|-------------|
| supplierID | INTEGER | Primary key |
| userID | INTEGER | Foreign key to users |
| companyName | TEXT | Company name |
| contactPerson | TEXT | Contact person |
| phone | TEXT | Phone number |
| email | TEXT | Email address |
| address | TEXT | Address |
| approved | BOOLEAN | Approval status |

### Products Table
| Column | Type | Description |
|--------|------|-------------|
| productID | INTEGER | Primary key |
| name | TEXT | Product name |
| description | TEXT | Description |
| price | REAL | Unit price |
| stock | INTEGER | Current stock |
| reorderLevel | INTEGER | Reorder threshold |

### Orders Table
| Column | Type | Description |
|--------|------|-------------|
| orderID | INTEGER | Primary key |
| dealerID | INTEGER | Foreign key to dealers |
| productID | INTEGER | Foreign key to products |
| quantity | INTEGER | Order quantity |
| status | TEXT | pending, processing, completed, cancelled |
| workflowStep | TEXT | Workflow tracking |
| totalAmount | REAL | Total order amount |
| orderDate | DATETIME | Order date |

### Quotations Table
| Column | Type | Description |
|--------|------|-------------|
| quoteID | INTEGER | Primary key |
| supplierID | INTEGER | Foreign key to suppliers |
| materialID | INTEGER | Foreign key to materials |
| price | REAL | Quoted price |
| deliveryDate | DATE | Expected delivery |
| status | TEXT | pending, approved, rejected |

### Bills Table
| Column | Type | Description |
|--------|------|-------------|
| billID | INTEGER | Primary key |
| orderID | INTEGER | Foreign key to orders |
| dealerID | INTEGER | Foreign key to dealers |
| amount | REAL | Bill amount |
| paymentStatus | TEXT | pending, paid, overdue |
| dueDate | DATE | Payment due date |

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd WAMS
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm start
   ```
   Server runs on http://localhost:5000

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```
   Application runs on http://localhost:5173

### Default Admin Credentials
- **Username**: admin
- **Password**: admin123

## Screenshots

The application includes the following screenshots:

| File | Description |
|------|-------------|
| Screenshot (1660).png | Dashboard view |
| Screenshot (1661).png | Products management |
| Screenshot (1662).png | Materials inventory |
| Screenshot (1663).png | Orders list |
| Screenshot (1664).png | Order placement |
| Screenshot (1665).png | Dealer management |
| Screenshot (1666).png | Suppliers list |
| Screenshot (1667).png | Quotations |
| Screenshot (1668).png | Manufacturing orders |
| Screenshot (1669).png | Bills management |
| Screenshot (1670).png | Reports & analytics |
| Screenshot (1671).png | Notifications |
| Screenshot (1672).png | User management |
| Screenshot (1673).png | Profile settings |
| Screenshot (1674).png | Login page |
| Screenshot (1675).png | Registration |
| Screenshot (1676).png | Sidebar navigation |

## Design Specifications

### Color Palette
- **Primary**: #1e40af (Blue-800)
- **Secondary**: #0f172a (Slate-900)
- **Accent**: #3b82f6 (Blue-500)
- **Success**: #22c55e (Green-500)
- **Warning**: #f59e0b (Amber-500)
- **Danger**: #ef4444 (Red-500)
- **Background**: #f8fafc (Slate-50)
- **Card**: #ffffff
- **Text Primary**: #1e293b (Slate-800)
- **Text Secondary**: #64748b (Slate-500)

### Typography
- **Font Family**: Inter, system-ui, sans-serif
- **Headings**: 24px (h1), 20px (h2), 18px (h3)
- **Body**: 14px-16px
- **Small**: 12px

### Layout
- **Sidebar**: 256px fixed width (collapsible)
- **Main Content**: Fluid with max-width 1400px
- **Card Padding**: 24px
- **Border Radius**: 8px (cards), 6px (buttons), 4px (inputs)

## Development Notes

- The backend uses SQLite with sql.js for in-memory database operations
- JWT tokens expire after 7 days
- All passwords are hashed using bcrypt with 10 salt rounds
- The system automatically creates notifications for important events
- Order workflow: received → stock_verified/stock_partial/stock_unavailable → billing → completed
- Low stock alerts trigger when product/material stock falls below reorder level

## License

This project is developed for educational purposes as part of a software engineering project.