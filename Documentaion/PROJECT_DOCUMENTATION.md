# GuptaSandwitch - Hotel Management System
## Complete Project Documentation

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Workflow Analysis](#workflow-analysis)
5. [Database Schema](#database-schema)
6. [Table Relationships](#table-relationships)
7. [Entity-Relationship Diagram](#entity-relationship-diagram)
8. [API Structure Recommendations](#api-structure-recommendations)
9. [Security Considerations](#security-considerations)
10. [Future Enhancements](#future-enhancements)

---

## Project Overview

**Project Name:** GuptaSandwitch  
**Type:** Multi-Outlet Restaurant Management System  
**Current State:** React Frontend with Local State Management  
**Target State:** Full-Stack Application with Backend API and Database

### Business Purpose
GuptaSandwitch is a comprehensive restaurant management system designed for multi-location food outlets. The system handles:
- Point of Sale (POS) operations
- Kitchen Order Tickets (KOT) management
- Online food delivery platform integration (Swiggy, Zomato)
- Multi-outlet management
- Customer relationship management
- Inventory tracking
- Financial accounting and reporting

### Key Features
- **Multi-Outlet Support:** Manage multiple restaurant locations from a single admin panel
- **Dual Pricing Structure:** Different pricing for dine-in, parcel, and online platforms
- **Real-Time Order Processing:** Live order tracking from Swiggy/Zomato
- **Kitchen Display System:** KOT management for kitchen staff
- **Comprehensive Reporting:** Sales analytics, payment tracking, GST reports
- **Customer CRM:** Track customer visits, orders, and preferences
- **Inventory Management:** Stock level monitoring and reorder alerts

---

## Technology Stack

### Current Implementation
- **Frontend Framework:** React 19.2.6
- **Build Tool:** Create React App (react-scripts 5.0.1)
- **Charting Library:** Chart.js 4.5.1, react-chartjs-2 5.3.1
- **State Management:** React Hooks (useState, useEffect)
- **Authentication:** Session-based (sessionStorage)
- **Styling:** CSS Modules

### Recommended Backend Stack
- **Backend Framework:** Node.js with Express.js
- **Database:** PostgreSQL (recommended) or MongoDB
- **ORM:** Prisma (for PostgreSQL) or Mongoose (for MongoDB)
- **Authentication:** JWT (JSON Web Tokens)
- **API Documentation:** Swagger/OpenAPI
- **Real-Time Communication:** Socket.io (for live orders and KOT updates)
- **File Storage:** AWS S3 or Cloudinary (for receipts, bills)

---

## System Architecture

### User Roles
1. **Admin**
   - Full system access
   - Outlet management
   - Menu and pricing control
   - Financial reports and accounting
   - User management

2. **Staff**
   - POS operations
   - KOT management
   - Order processing
   - Customer interaction
   - Basic reporting

### Application Modules

#### Admin Panel
- **Dashboard:** Outlet performance analytics with charts
- **Dishes Management:** Menu item CRUD with multi-pricing
- **Reports:** Daily sales, payment modes, GST, category-wise, hourly, platform-wise
- **Accounting:** Financial ledger with bill uploads
- **Outlets:** Multi-location management with credentials

#### Staff Panel
- **POS:** Order taking with dine-in/parcel toggle
- **KOT:** Kitchen display system with item tracking
- **Live Orders:** Swiggy/Zomato integration
- **Reports:** Sales analytics and order history
- **Customers:** Customer management and order history
- **Inventory:** Stock level monitoring

---

## Workflow Analysis

### Order Processing Workflow

```
Customer Order → POS System → Order Creation → KOT Generation → Kitchen Preparation 
→ Order Completion → Payment Processing → Receipt Generation → Order Completion
```

### Detailed Workflow Steps

#### 1. Order Creation (POS)
- Staff selects dine-in or parcel mode
- Items added from menu with appropriate pricing
- Discounts applied (percentage or flat)
- Order subtotal calculated with GST (5%)
- Table assigned (for dine-in)

#### 2. KOT Generation
- Kitchen Order Ticket created
- Items sent to kitchen display
- Preparation time estimated
- Urgent orders flagged

#### 3. Kitchen Processing
- Kitchen staff receive KOT
- Individual items marked as ready
- Partial dispatching allowed
- Full order dispatch when complete

#### 4. Payment Processing
- Payment method selected (Cash/Online/UPI/Card)
- Payment recorded
- Receipt generated
- Order marked as completed

#### 5. Online Platform Orders (Swiggy/Zomato)
- Orders received via API integration
- Auto-accept or manual accept
- Status updates sent to platform
- Delivery tracking

### Multi-Outlet Workflow
- Central admin manages all outlets
- Each outlet has independent operations
- Consolidated reporting across outlets
- Outlet-specific pricing and menu availability

---

## Database Schema

### 1. Users Table
**Purpose:** Store system users (Admin and Staff)

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff') NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    outlet_id INTEGER REFERENCES outlets(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Outlets Table
**Purpose:** Store restaurant outlet information

```sql
CREATE TABLE outlets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    manager_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Categories Table
**Purpose:** Store menu categories

```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. MenuItems Table
**Purpose:** Store menu items with multi-pricing

```sql
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    description TEXT,
    emoji VARCHAR(10),
    is_veg BOOLEAN DEFAULT true,
    preparation_time VARCHAR(50),
    
    -- Pricing
    dine_price DECIMAL(10,2) NOT NULL,
    parcel_price DECIMAL(10,2) NOT NULL,
    swiggy_price DECIMAL(10,2),
    zomato_price DECIMAL(10,2),
    
    -- Platform availability
    available_swiggy BOOLEAN DEFAULT true,
    available_zomato BOOLEAN DEFAULT true,
    
    -- Outlet availability
    available_all_outlets BOOLEAN DEFAULT true,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. MenuItemOutlets Table (Junction)
**Purpose:** Link menu items to specific outlets

```sql
CREATE TABLE menu_item_outlets (
    id SERIAL PRIMARY KEY,
    menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
    outlet_id INTEGER REFERENCES outlets(id) ON DELETE CASCADE,
    is_available BOOLEAN DEFAULT true,
    UNIQUE(menu_item_id, outlet_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6. Ingredients Table
**Purpose:** Store ingredients for menu items

```sql
CREATE TABLE ingredients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    unit VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 7. MenuItemIngredients Table (Junction)
**Purpose:** Link ingredients to menu items

```sql
CREATE TABLE menu_item_ingredients (
    id SERIAL PRIMARY KEY,
    menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
    ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity DECIMAL(10,2) NOT NULL,
    UNIQUE(menu_item_id, ingredient_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 8. Tables Table
**Purpose:** Store dining table information

```sql
CREATE TABLE tables (
    id SERIAL PRIMARY KEY,
    outlet_id INTEGER REFERENCES outlets(id),
    table_number VARCHAR(20) NOT NULL,
    capacity INTEGER DEFAULT 4,
    location VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(outlet_id, table_number),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 9. Customers Table
**Purpose:** Store customer CRM data

```sql
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    favorite_dish VARCHAR(255),
    total_visits INTEGER DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0,
    last_visit_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 10. Orders Table
**Purpose:** Store customer orders

```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    outlet_id INTEGER REFERENCES outlets(id),
    table_id INTEGER REFERENCES tables(id),
    customer_id INTEGER REFERENCES customers(id),
    
    -- Order details
    order_type ENUM('dine_in', 'parcel', 'swiggy', 'zomato') NOT NULL,
    status ENUM('pending', 'preparing', 'ready', 'completed', 'cancelled') DEFAULT 'pending',
    
    -- Pricing
    subtotal DECIMAL(10,2) NOT NULL,
    discount_type ENUM('percentage', 'flat'),
    discount_value DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    gst_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Platform-specific (for Swiggy/Zomato)
    platform_order_id VARCHAR(100),
    platform_customer_name VARCHAR(255),
    platform_customer_phone VARCHAR(20),
    delivery_address TEXT,
    special_instructions TEXT,
    estimated_delivery_time INTEGER,
    
    -- Staff
    created_by INTEGER REFERENCES users(id),
    
    -- Timestamps
    order_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completion_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 11. OrderItems Table
**Purpose:** Store items within an order

```sql
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INTEGER REFERENCES menu_items(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 12. KOTs Table
**Purpose:** Store Kitchen Order Tickets

```sql
CREATE TABLE kots (
    id SERIAL PRIMARY KEY,
    kot_number VARCHAR(50) UNIQUE NOT NULL,
    order_id INTEGER REFERENCES orders(id),
    table_id INTEGER REFERENCES tables(id),
    
    -- KOT details
    status ENUM('pending', 'in_progress', 'ready', 'dispatched', 'cancelled') DEFAULT 'pending',
    is_urgent BOOLEAN DEFAULT false,
    
    -- Timing
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ready_at TIMESTAMP,
    dispatched_at TIMESTAMP
);
```

### 13. KOTItems Table
**Purpose:** Store items within a KOT

```sql
CREATE TABLE kot_items (
    id SERIAL PRIMARY KEY,
    kot_id INTEGER REFERENCES kots(id) ON DELETE CASCADE,
    menu_item_id INTEGER REFERENCES menu_items(id),
    quantity INTEGER NOT NULL,
    is_ready BOOLEAN DEFAULT false,
    dispatched_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 14. Payments Table
**Purpose:** Store payment transactions

```sql
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    payment_method ENUM('cash', 'upi', 'card', 'wallet') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    transaction_id VARCHAR(100),
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'completed',
    payment_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 15. InventoryCategories Table
**Purpose:** Store inventory category classifications

```sql
CREATE TABLE inventory_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    icon VARCHAR(10),
    color VARCHAR(20),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 16. InventoryItems Table
**Purpose:** Store inventory stock items

```sql
CREATE TABLE inventory_items (
    id SERIAL PRIMARY KEY,
    outlet_id INTEGER REFERENCES outlets(id),
    category_id INTEGER REFERENCES inventory_categories(id),
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    
    -- Stock levels
    current_stock DECIMAL(10,2) NOT NULL,
    minimum_stock DECIMAL(10,2) NOT NULL,
    maximum_stock DECIMAL(10,2) NOT NULL,
    
    -- Status
    stock_status ENUM('ok', 'low', 'critical') DEFAULT 'ok',
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 17. AccountingEntries Table
**Purpose:** Store financial ledger entries

```sql
CREATE TABLE accounting_entries (
    id SERIAL PRIMARY KEY,
    entry_number VARCHAR(50) UNIQUE NOT NULL,
    outlet_id INTEGER REFERENCES outlets(id),
    order_id INTEGER REFERENCES orders(id),
    
    -- Financial details
    amount DECIMAL(12,2) NOT NULL,
    entry_type ENUM('credit', 'debit') NOT NULL,
    category VARCHAR(100),
    description TEXT,
    
    -- Dates
    order_date DATE,
    delivery_date DATE,
    payment_date DATE,
    
    -- Status
    status ENUM('pending', 'paid', 'due', 'overdue') DEFAULT 'pending',
    bill_uploaded BOOLEAN DEFAULT false,
    bill_url TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 18. PlatformOrders Table
**Purpose:** Store Swiggy/Zomato platform orders

```sql
CREATE TABLE platform_orders (
    id SERIAL PRIMARY KEY,
    platform ENUM('swiggy', 'zomato') NOT NULL,
    platform_order_id VARCHAR(100) UNIQUE NOT NULL,
    outlet_id INTEGER REFERENCES outlets(id),
    
    -- Customer details
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    delivery_address TEXT,
    special_instructions TEXT,
    
    -- Order details
    items JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    estimated_delivery_time INTEGER,
    
    -- Status
    status ENUM('pending', 'accepted', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled') DEFAULT 'pending',
    payment_method ENUM('online', 'cod'),
    
    -- Timestamps
    order_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    delivered_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 19. Discounts Table
**Purpose:** Store discount configurations

```sql
CREATE TABLE discounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type ENUM('percentage', 'flat') NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    
    -- Applicability
    applicable_to ENUM('all', 'category', 'menu_item', 'outlet') NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    menu_item_id INTEGER REFERENCES menu_items(id),
    outlet_id INTEGER REFERENCES outlets(id),
    
    -- Validity
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 20. Reports Table
**Purpose:** Store generated reports

```sql
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    report_type ENUM('daily_sales', 'payment_modes', 'gst', 'category', 'hourly', 'platform', 'food_cost') NOT NULL,
    outlet_id INTEGER REFERENCES outlets(id),
    report_date DATE NOT NULL,
    report_data JSONB NOT NULL,
    generated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Table Relationships

### Primary Relationships

```
Users (1) ──────< (N) Orders
  │
  └── (1) ──────< (N) Outlets

Outlets (1) ──────< (N) Tables
Outlets (1) ──────< (N) Orders
Outlets (1) ──────< (N) InventoryItems
Outlets (1) ──────< (N) PlatformOrders
Outlets (1) ──────< (N) AccountingEntries

Categories (1) ──────< (N) MenuItems

MenuItems (1) ──────< (N) OrderItems
MenuItems (1) ──────< (N) KOTItems
MenuItems (M) ──────< (N) Ingredients (Junction)
MenuItems (M) ──────< (N) Outlets (Junction)

Orders (1) ──────< (N) OrderItems
Orders (1) ──────< (N) Payments
Orders (1) ──────< (1) KOT

KOTs (1) ──────< (N) KOTItems

Customers (1) ──────< (N) Orders

Tables (1) ──────< (N) Orders
Tables (1) ──────< (N) KOTs

InventoryCategories (1) ──────< (N) InventoryItems
```

### Relationship Details

#### User-Outlet Relationship
- **Type:** Many-to-One
- **Description:** Staff users belong to a specific outlet, Admin users can manage all outlets
- **Foreign Key:** `users.outlet_id → outlets.id`

#### Order-Customer Relationship
- **Type:** Many-to-One (Optional)
- **Description:** Orders can be linked to customers for CRM tracking
- **Foreign Key:** `orders.customer_id → customers.id`

#### Order-Table Relationship
- **Type:** Many-to-One (Optional)
- **Description:** Dine-in orders are assigned to tables
- **Foreign Key:** `orders.table_id → tables.id`

#### Order-KOT Relationship
- **Type:** One-to-One
- **Description:** Each order generates one KOT for the kitchen
- **Foreign Key:** `kots.order_id → orders.id`

#### MenuItem-Outlet Relationship
- **Type:** Many-to-Many
- **Description:** Menu items can be available at multiple outlets
- **Junction Table:** `menu_item_outlets`

#### MenuItem-Ingredient Relationship
- **Type:** Many-to-Many
- **Description:** Menu items consist of multiple ingredients
- **Junction Table:** `menu_item_ingredients`

#### PlatformOrder-Outlet Relationship
- **Type:** Many-to-One
- **Description:** Platform orders are routed to specific outlets
- **Foreign Key:** `platform_orders.outlet_id → outlets.id`

---

## Entity-Relationship Diagram

### ERD Description

```
┌─────────────────┐       ┌─────────────────┐
│     Users       │       │    Outlets      │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │───────│ id (PK)         │
│ email           │       │ name            │
│ password_hash   │       │ address         │
│ role            │       │ phone           │
│ name            │       │ manager_name    │
│ phone           │       │ email           │
│ outlet_id (FK)  │       │ username        │
│ is_active       │       │ password_hash   │
│ created_at      │       │ status          │
│ updated_at      │       │ created_at      │
└─────────────────┘       │ updated_at      │
                          └────────┬────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
           ┌────────▼────────┐ ┌──▼──────────┐ ┌─▼─────────────┐
           │     Tables      │ │   Orders    │ │InventoryItems │
           ├─────────────────┤ ├─────────────┤ ├───────────────┤
           │ id (PK)         │ │ id (PK)     │ │ id (PK)       │
           │ outlet_id (FK)  │ │ outlet_id   │ │ outlet_id     │
           │ table_number    │ │ table_id    │ │ category_id   │
           │ capacity        │ │ customer_id │ │ name          │
           │ location        │ │ order_type  │ │ unit          │
           │ is_active       │ │ status      │ │ current_stock │
           │ created_at      │ │ subtotal    │ │ minimum_stock │
           └─────────────────┘ │ total_amount│ │ maximum_stock │
                              │ order_time  │ │ stock_status  │
                              └──────┬──────┘ └───────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
           ┌────────▼────────┐ ┌────▼──────┐ ┌──────▼──────┐
           │  OrderItems     │ │  KOTs     │ │  Payments   │
           ├─────────────────┤ ├───────────┤ ├─────────────┤
           │ id (PK)         │ │ id (PK)   │ │ id (PK)     │
           │ order_id (FK)   │ │ order_id  │ │ order_id    │
           │ menu_item_id    │ │ table_id  │ │ payment_method│
           │ quantity        │ │ status    │ │ amount      │
           │ unit_price      │ │ is_urgent │ │ status      │
           │ total_price     │ │ created_at│ │ payment_time│
           └────────┬────────┘ └─────┬─────┘ └─────────────┘
                    │               │
           ┌────────▼────────┐ ┌───▼────────┐
           │  MenuItems      │ │ KOTItems   │
           ├─────────────────┤ ├────────────┤
           │ id (PK)         │ │ id (PK)    │
           │ category_id     │ │ kot_id     │
           │ name            │ │ menu_item_id│
           │ dine_price   │ │ quantity   │
           │ parcel_price    │ │ is_ready   │
           │ swiggy_price    │ └────────────┘
           │ zomato_price    │
           │ is_veg          │
           └────────┬────────┘
                    │
           ┌────────┴────────┐
           │                 │
    ┌──────▼──────┐  ┌──────▼──────┐
    │ Categories  │  │ Ingredients │
    ├─────────────┤  ├─────────────┤
    │ id (PK)     │  │ id (PK)     │
    │ name        │  │ name        │
    │ description │  │ unit        │
    └─────────────┘  └─────────────┘
```

---

## API Structure Recommendations

### Authentication Endpoints
```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
```

### User Management
```
GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
```

### Outlet Management
```
GET    /api/outlets
POST   /api/outlets
GET    /api/outlets/:id
PUT    /api/outlets/:id
DELETE /api/outlets/:id
PUT    /api/outlets/:id/status
```

### Menu Management
```
GET    /api/categories
POST   /api/categories
GET    /api/menu-items
POST   /api/menu-items
GET    /api/menu-items/:id
PUT    /api/menu-items/:id
DELETE /api/menu-items/:id
GET    /api/menu-items/:id/ingredients
```

### Order Management
```
GET    /api/orders
POST   /api/orders
GET    /api/orders/:id
PUT    /api/orders/:id
DELETE /api/orders/:id
POST   /api/orders/:id/items
PUT   /api/orders/:id/items/:itemId
DELETE /api/orders/:id/items/:itemId
POST   /api/orders/:id/payment
POST   /api/orders/:id/discount
```

### KOT Management
```
GET    /api/kots
POST   /api/kots
GET    /api/kots/:id
PUT    /api/kots/:id/status
PUT    /api/kots/:id/items/:itemId/status
POST   /api/kots/:id/dispatch
```

### Customer Management
```
GET    /api/customers
POST   /api/customers
GET    /api/customers/:id
PUT    /api/customers/:id
DELETE /api/customers/:id
GET    /api/customers/:id/orders
```

### Inventory Management
```
GET    /api/inventory/categories
GET    /api/inventory/items
POST   /api/inventory/items
PUT    /api/inventory/items/:id
GET    /api/inventory/low-stock
```

### Accounting
```
GET    /api/accounting/entries
POST   /api/accounting/entries
GET    /api/accounting/entries/:id
PUT    /api/accounting/entries/:id
POST   /api/accounting/entries/:id/bill
```

### Platform Integration
```
GET    /api/platform/orders
POST   /api/platform/orders/:id/accept
POST   /api/platform/orders/:id/reject
PUT    /api/platform/orders/:id/status
```

### Reports
```
GET    /api/reports/daily-sales
GET    /api/reports/payment-modes
GET    /api/reports/gst
GET    /api/reports/category-wise
GET    /api/reports/hourly
GET    /api/reports/platform-wise
GET    /api/reports/food-cost
```

---

## Security Considerations

### Authentication & Authorization
- Implement JWT-based authentication
- Role-based access control (RBAC)
- Password hashing using bcrypt
- Session management with refresh tokens
- API rate limiting

### Data Protection
- Encrypt sensitive data (passwords, customer info)
- Use HTTPS for all API communications
- Implement CORS policies
- SQL injection prevention using parameterized queries
- XSS protection

### Audit Logging
- Log all user actions
- Track order modifications
- Monitor payment transactions
- Record login attempts

---

## Future Enhancements

### Phase 1: Backend Development
- Set up Node.js/Express backend
- Implement PostgreSQL database with Prisma ORM
- Create RESTful API endpoints
- Implement JWT authentication
- Set up Socket.io for real-time features

### Phase 2: Advanced Features
- Swiggy/Zomato API integration
- Real-time KOT updates using WebSockets
- Email/SMS notifications
- Advanced reporting with export options
- Mobile app development

### Phase 3: Analytics & AI
- Predictive inventory management
- Customer behavior analytics
- Sales forecasting
- Automated reorder suggestions
- Loyalty program integration

### Phase 4: Scalability
- Microservices architecture
- Load balancing
- Caching layer (Redis)
- CDN implementation
- Multi-region deployment

---

## Conclusion

GuptaSandwitch is a comprehensive restaurant management system designed for multi-location operations. The current React frontend provides a solid foundation with POS, KOT, and basic reporting features. The proposed database schema and API structure will enable the system to scale to a full-stack application with robust data management, real-time capabilities, and advanced analytics.

The system's modular architecture allows for phased development, starting with core backend functionality and progressively adding advanced features like platform integrations, AI-powered analytics, and mobile applications.

---

**Document Version:** 1.0  
**Last Updated:** May 20, 2026  
**Author:** System Analysis
