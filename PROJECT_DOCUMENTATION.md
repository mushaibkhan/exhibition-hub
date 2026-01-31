# HydExpo - Exhibition Management System

## Complete Project Documentation

> **Purpose**: This document provides a comprehensive overview of the HydExpo project for AI context and development guidance.

---

## 🎯 Project Overview

**HydExpo** is a full-stack exhibition management system built for managing stall bookings, leads, transactions, payments, and services for trade exhibitions/expos. The system supports **multi-exhibition** management, allowing operators to switch between different exhibitions while keeping data isolated.

### Business Domain
- **Target Users**: Exhibition organizers, sales teams managing stall rentals
- **Core Workflow**: Lead → Transaction (Booking) → Payment → Invoice
- **Key Entities**: Exhibitions, Stalls, Leads, Transactions, Payments, Services, Expenses

---

## 🏗️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI Framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **React Router v6** | Client-side routing |
| **TanStack React Query** | Server state management, caching |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Component library (Radix UI based) |
| **Lucide React** | Icon library |
| **date-fns** | Date formatting |
| **Recharts** | Dashboard charts |

### Backend
| Technology | Purpose |
|------------|---------|
| **Supabase** | Backend-as-a-Service |
| **PostgreSQL** | Database (via Supabase) |
| **Row Level Security (RLS)** | Data access control |
| **Supabase Auth** | Authentication |

### Development Tools
| Tool | Purpose |
|------|---------|
| **Bun** | Package manager (lockfile: `bun.lockb`) |
| **ESLint** | Linting |
| **tsx** | TypeScript execution for scripts |

---

## 📁 Project Structure

```
exhibition-hub/
├── src/
│   ├── App.tsx                    # Root component, routing setup
│   ├── main.tsx                   # Entry point
│   ├── index.css                  # Global styles (Tailwind)
│   │
│   ├── pages/                     # Route pages
│   │   ├── Index.tsx              # Floor layout view (main landing)
│   │   ├── Dashboard.tsx          # Admin analytics dashboard
│   │   ├── Leads.tsx              # Lead management (CRUD)
│   │   ├── Stalls.tsx             # Stall listing (read-only view)
│   │   ├── StallPrices.tsx        # 🆕 Stall pricing editor (admin)
│   │   ├── Services.tsx           # Service catalog management
│   │   ├── Transactions.tsx       # Booking management (core feature)
│   │   ├── Payments.tsx           # Receipts view (renamed from Payments)
│   │   ├── Expenses.tsx           # Expense tracking (admin)
│   │   ├── Accounts.tsx           # Payment accounts (bank/UPI)
│   │   ├── Users.tsx              # User management (admin)
│   │   ├── Settings.tsx           # App settings
│   │   ├── Auth.tsx               # Login page
│   │   └── NotFound.tsx           # 404 page
│   │
│   ├── components/
│   │   ├── layout/                # Layout components
│   │   │   ├── AppLayout.tsx      # Main app shell
│   │   │   ├── Sidebar.tsx        # Navigation sidebar
│   │   │   ├── MobileHeader.tsx   # Mobile navigation
│   │   │   ├── ExhibitionSelector.tsx  # Exhibition switcher
│   │   │   └── RoleSwitcher.tsx   # Dev role switcher
│   │   │
│   │   ├── floor/                 # Floor layout components
│   │   │   ├── FloorLayoutEditor.tsx   # Interactive stall grid
│   │   │   ├── StallBox.tsx       # Individual stall component
│   │   │   ├── StallDrawer.tsx    # Stall detail sheet
│   │   │   └── FloorLegend.tsx    # Status color legend
│   │   │
│   │   └── ui/                    # shadcn/ui components
│   │       ├── button.tsx, card.tsx, dialog.tsx, etc.
│   │
│   ├── contexts/                  # React Context providers
│   │   ├── AuthContext.tsx        # Authentication state
│   │   ├── ExhibitionContext.tsx  # Current exhibition state
│   │   ├── SupabaseDataContext.tsx # 🔑 Main data layer (Supabase)
│   │   └── MockDataContext.tsx    # Legacy mock data (not used)
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── useStalls.ts           # Stall queries/mutations
│   │   ├── useLeads.ts            # Lead queries/mutations
│   │   ├── useTransactions.ts     # Transaction queries
│   │   ├── usePayments.ts         # Payment queries
│   │   ├── useServices.ts         # Service queries
│   │   ├── useAccounts.ts         # Account queries
│   │   └── use-toast.ts           # Toast notifications
│   │
│   ├── lib/                       # Utility functions
│   │   ├── utils.ts               # General utilities (cn, etc.)
│   │   ├── formatUtils.ts         # Number/date formatting
│   │   ├── exportUtils.ts         # Excel export
│   │   ├── invoiceUtils.ts        # Invoice data building
│   │   ├── generateInvoicePDF.ts  # Invoice HTML generation
│   │   ├── invoiceConfig.ts       # Invoice template config
│   │   └── layoutUtils.ts         # Floor layout calculations
│   │
│   ├── types/
│   │   ├── database.ts            # 🔑 All TypeScript interfaces
│   │   ├── invoice.ts             # Invoice types
│   │   └── layout.ts              # Layout types
│   │
│   └── integrations/
│       └── supabase/
│           ├── client.ts          # Supabase client init
│           └── types.ts           # Auto-generated DB types
│
├── supabase/
│   ├── README.md                  # Supabase setup guide
│   └── migrations/                # SQL migration files
│       ├── 001_initial_schema.sql
│       ├── 002_create_views.sql
│       ├── 003_rls_policies.sql
│       ├── 004_seed_data.sql
│       ├── 005_user_management.sql
│       ├── 006_make_profiles_flexible.sql
│       ├── 007_fix_user_roles_rls_recursion.sql
│       ├── 008_allow_profiles_insert.sql
│       ├── 010_seed_test_users.sql
│       ├── 011_allow_exhibitions_insert.sql
│       └── 012_expenses_schema.sql
│
├── scripts/
│   └── seed-stalls.ts             # Stall seeding script
│
└── [config files]                 # vite.config.ts, tailwind.config.ts, etc.
```

---

## 🗄️ Database Schema

### Core Entities

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ exhibitions │────<│   stalls    │────<│stall_layouts│
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │            ┌──────┴──────┐
       │            │             │
       ▼            ▼             ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────────┐
│    leads    │  │  services   │  │service_allocations│
└─────────────┘  └─────────────┘  └─────────────────┘
       │                │                  │
       └────────┬───────┘                  │
                │                          │
                ▼                          │
       ┌─────────────────┐                 │
       │  transactions   │<────────────────┘
       └─────────────────┘
                │
       ┌────────┴────────┐
       │                 │
       ▼                 ▼
┌─────────────────┐ ┌─────────────┐
│transaction_items│ │  payments   │
└─────────────────┘ └─────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │  accounts   │
                    └─────────────┘
```

### Key Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `exhibitions` | Exhibition/event definitions | `name`, `short_name`, `start_date`, `end_date` |
| `stalls` | Stall inventory | `stall_number`, `zone`, `base_rent`, `is_blocked` |
| `stall_layouts` | Stall positioning (for floor view) | `position_x`, `position_y`, `width`, `height` |
| `leads` | Customer/prospect records | `name`, `phone`, `company`, `status` |
| `services` | Additional services catalog | `name`, `category`, `price`, `quantity` |
| `transactions` | Bookings/sales | `transaction_number`, `lead_id`, `total_amount` |
| `transaction_items` | Line items in a transaction | `item_type`, `stall_id`, `service_id`, `final_price` |
| `payments` | Payment records | `amount`, `payment_mode`, `account_id`, `payment_date` |
| `service_allocations` | Service assigned to stalls | `service_id`, `stall_id`, `transaction_id` |
| `expenses` | Expense tracking | `category`, `amount`, `description` |
| `accounts` | Payment accounts (Bank/UPI) | `name`, `upi_details`, `bank_details` |
| `profiles` | User profiles | `email`, `full_name`, `is_active` |
| `user_roles` | Role assignments | `user_id`, `role` (admin/maintainer) |

### Derived Fields (Computed, Not Stored)

| Field | Computed From |
|-------|---------------|
| `stall.status` | Transaction existence + payment status |
| `transaction.amount_paid` | Sum of related payments |
| `transaction.payment_status` | Comparison of amount_paid vs total |

---

## 🔐 Authentication & Authorization

### Roles
| Role | Permissions |
|------|-------------|
| **Admin** | Full access: Dashboard, User Management, Expenses, Stall Prices, all CRUD |
| **Maintainer** | Limited: Leads, Transactions, Payments, Services (no admin features) |

### Auth Flow
1. User logs in via Supabase Auth (email/password)
2. `AuthContext` manages session state
3. `user_roles` table determines permissions
4. RLS policies enforce data access at database level

---

## 📄 Pages Overview

### Public / All Roles
| Page | Route | Description |
|------|-------|-------------|
| **Floor Layout** | `/` | Interactive grid view of all stalls with status colors |
| **Stalls** | `/stalls` | Table view of all stalls with filters |
| **Services** | `/services` | Service catalog with pricing |

### Operations (Admin + Maintainer)
| Page | Route | Description |
|------|-------|-------------|
| **Leads** | `/leads` | Full CRUD for leads with status tracking |
| **Bookings** | `/transactions` | Create transactions, add stalls/services, record payments |
| **Receipts** | `/receipts` | Payment history with invoice generation |

### Admin Only
| Page | Route | Description |
|------|-------|-------------|
| **Dashboard** | `/dashboard` | Analytics: revenue, stall status, lead conversion |
| **Stall Prices** | `/stall-prices` | Edit base rent per stall |
| **Expenses** | `/expenses` | Track exhibition expenses |
| **Accounts** | `/accounts` | Manage payment accounts |
| **Users** | `/users` | User CRUD, role assignment, password reset |
| **Settings** | `/settings` | App configuration |

---

## 🔄 Core Workflows

### 1. Lead → Booking Flow
```
1. Create Lead (Leads page)
   └─ Name, Phone, Company, Status (new/follow_up/interested/converted)

2. Create Transaction (Transactions page)
   ├─ Select Lead (or create inline)
   ├─ Add Stall(s) - selects from available stalls
   ├─ Add Service(s) - optional add-ons
   └─ System calculates total

3. Record Payment(s)
   ├─ Amount, Mode (Cash/UPI/Bank), Account, Reference
   └─ System updates payment_status (unpaid → partial → paid)

4. Stall Status Auto-Updates
   └─ available → reserved (unpaid) → pending (partial) → sold (paid)
```

### 2. Invoice Generation
```
1. User clicks invoice icon on a payment (Receipts page or Transactions)
2. System builds invoice data:
   - Exhibition info, Lead info, Transaction items
   - Payment details, Balance due
3. Generates HTML invoice
4. Downloads as file (user can print to PDF)
```

### 3. Multi-Exhibition Support
```
1. ExhibitionContext provides current exhibition
2. ExhibitionSelector in sidebar allows switching
3. All data queries filter by exhibition_id
4. Selection persists in localStorage
```

---

## 🧩 Key Components

### SupabaseDataContext (Data Layer)
The central data provider that:
- Fetches all data via React Query (with caching)
- Provides CRUD functions for all entities
- Computes derived fields (stall status, payment totals)
- Filters by current exhibition

**Exposed Interface:**
```typescript
// Data arrays
stalls, leads, services, transactions, transactionItems, 
payments, accounts, expenses, serviceAllocations

// CRUD functions
addLead, updateLead, deleteLead
addService, updateService, deleteService
addTransaction, cancelTransaction
addPayment, deletePayment
updateStall
addExpense, updateExpense, deleteExpense

// Helper functions
getLeadById, getStallById, getServiceById
getItemsByTransactionId, getPaymentsByTransactionId
getTransactionsByStallId, getAvailableStalls
```

### Floor Layout (Index.tsx)
- Interactive grid showing stall positions
- Color-coded by status (available/reserved/pending/sold/blocked)
- Click stall → Opens StallDrawer with details
- Supports zoom and pan

### Transactions Page
- Most complex page - handles full booking workflow
- Create transaction with stall + service selection
- Inline payment recording
- Invoice generation
- Transaction cancellation (soft delete)

---

## 🎨 UI Patterns

### Status Colors
| Status | Color | CSS Class |
|--------|-------|-----------|
| Available | Pink/Emerald | `bg-emerald-100` |
| Reserved | Yellow | `bg-yellow-100` |
| Pending (Partial) | Orange | `bg-orange-100` |
| Sold (Paid) | Green | `bg-green-100` |
| Blocked | Gray | `bg-gray-100` |

### Component Patterns
- **Cards** for summary stats
- **Tables** for data lists with search/filter
- **Dialogs** for create/edit forms
- **Sheets** (drawers) for detail views
- **Badges** for status indicators
- **Toasts** for success/error feedback

---

## 🛠️ Development Commands

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Seed stalls (requires Supabase setup)
bun run seed-stalls

# Lint code
bun run lint
```

---

## 🔧 Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # For user management
```

---

## 📝 Recent Changes (Latest First)

### January 2026
1. **Stall Prices Page** (`/stall-prices`)
   - New admin-only page to edit `base_rent` per stall
   - Inline editing with save/reset per row
   - Bulk "Save All" for multiple edits
   - Filter by zone, search by stall number

2. **Payments → Receipts Rename**
   - Route changed: `/payments` → `/receipts` (with redirect)
   - Sidebar label updated
   - Export filename updated

3. **Production Hardening**
   - All console logs wrapped with `import.meta.env.DEV`
   - Error boundaries added
   - User-friendly error messages

4. **User Management**
   - Full CRUD for users (admin only)
   - Password reset capability
   - Role assignment (admin/maintainer)
   - Activate/deactivate users

5. **Expenses Module**
   - New page for tracking exhibition expenses
   - Categories: venue, furniture, marketing, utilities, staff, misc
   - Integrated with dashboard revenue calculations

---

## 🚀 How to Approach New Tasks

### Adding a New Page
1. Create page component in `src/pages/NewPage.tsx`
2. Add route in `src/App.tsx`
3. Add navigation item in `src/components/layout/Sidebar.tsx`
4. If admin-only, add `adminOnly: true` to nav item

### Adding a New Entity
1. Add TypeScript interface in `src/types/database.ts`
2. Create SQL migration in `supabase/migrations/`
3. Add queries/mutations in `src/contexts/SupabaseDataContext.tsx`
4. Create page with CRUD UI

### Modifying Existing Features
1. Check `SupabaseDataContext.tsx` for data functions
2. Find the relevant page in `src/pages/`
3. Look for related components in `src/components/`
4. Update types if schema changes

### Best Practices
- Use existing UI components from `src/components/ui/`
- Follow existing patterns for forms, tables, dialogs
- Add proper TypeScript types
- Use `useToast` for user feedback
- Handle loading/error states
- Test with both admin and maintainer roles

---

## 📊 Current Status

| Aspect | Status |
|--------|--------|
| Core Features | ✅ Complete |
| Supabase Backend | ✅ Migrated |
| Authentication | ✅ Working |
| Multi-Exhibition | ✅ Working |
| User Management | ✅ Working |
| Production Build | ✅ Passing |
| TypeScript | ⚠️ 9 non-blocking warnings |

---

## 🐛 Known Issues / TODOs

1. **TypeScript Type Generation**: Supabase types need regeneration for new tables
2. **Stall Size**: Currently hardcoded to "3×2" (all stalls standardized)
3. **Legacy Code**: `MockDataContext.tsx` and `multiExhibitionData.ts` can be removed
4. **Accessibility**: ARIA labels and keyboard nav need audit
5. **Mobile**: Some tables need better mobile optimization

---

## 📚 Related Documentation

- [SUPABASE_MIGRATION_SUMMARY.md](SUPABASE_MIGRATION_SUMMARY.md) - Backend migration details
- [USER_MANAGEMENT_SETUP.md](USER_MANAGEMENT_SETUP.md) - User management guide
- [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md) - Production checklist
- [supabase/README.md](supabase/README.md) - Database setup instructions
