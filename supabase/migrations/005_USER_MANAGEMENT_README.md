# User Management Schema Migration

## Overview
This migration (`005_user_management.sql`) adds comprehensive user management capabilities to your Supabase database, including user profiles, foreign key relationships, and Row Level Security (RLS) policies.

## What This Migration Does

### 1. **Profiles Table**
- Creates a `profiles` table that extends `auth.users` with additional information
- Stores: email, full_name, phone, is_active, last_login_at
- References `auth.users.id` for authentication integration

### 2. **Foreign Key Constraints**
- Links `leads.created_by` → `profiles.id`
- Links `transactions.created_by` → `profiles.id`
- Links `payments.recorded_by` → `profiles.id`
- All use `ON DELETE SET NULL` to preserve data if a user is deleted

### 3. **Indexes**
- Performance indexes on email, is_active, and all user reference columns

### 4. **RLS Policies**
- Users can view their own profile
- Users can view all active profiles (for dropdowns)
- Users can update their own profile
- Only admins can create/update/delete other users' profiles
- Admins can view all user roles

### 5. **Helper Functions & Views**
- `user_with_roles` view: Combines profile info with roles
- `get_user_display_name(user_id)`: Returns user-friendly name
- `is_user_admin(user_id)`: Checks if user has admin role
- `handle_new_user()`: Auto-creates profile on signup (requires setup)

## How to Use

### Step 1: Run the Migration
1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy the entire contents of `005_user_management.sql`
4. Paste and run it

### Step 2: Set Up Auto-Profile Creation (Optional)
To automatically create a profile when a user signs up, you have two options:

**Option A: Using Supabase Database Webhooks**
1. Go to Database → Webhooks
2. Create a webhook on `auth.users` table INSERT event
3. Call the `handle_new_user()` function

**Option B: Using Supabase Edge Functions**
- Create an Edge Function that triggers on user signup
- Call `handle_new_user()` function from your Edge Function

**Option C: Application Code**
- In your signup flow, after creating a user in `auth.users`, insert a row into `profiles`

### Step 3: Update Your Application Code

#### When Creating Leads:
```typescript
await addLead({
  ...leadData,
  created_by: currentUser.id, // Set the current user ID
});
```

#### When Creating Transactions:
```typescript
await addTransaction({
  ...transactionData,
  created_by: currentUser.id, // Set the current user ID
}, items);
```

#### When Recording Payments:
```typescript
await addPayment({
  ...paymentData,
  recorded_by: currentUser.id, // Set the current user ID
});
```

#### Querying User Information:
```typescript
// Get user profile
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();

// Get user with roles
const { data: userWithRoles } = await supabase
  .from('user_with_roles')
  .select('*')
  .eq('id', userId)
  .single();

// Get display name
const { data } = await supabase.rpc('get_user_display_name', { user_id: userId });
```

## Database Schema

### Profiles Table
```sql
profiles (
  id UUID PRIMARY KEY → auth.users(id)
  email TEXT
  full_name TEXT
  phone TEXT
  is_active BOOLEAN DEFAULT TRUE
  last_login_at TIMESTAMPTZ
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
)
```

### Relationships
- `leads.created_by` → `profiles.id` (nullable)
- `transactions.created_by` → `profiles.id` (nullable)
- `payments.recorded_by` → `profiles.id` (nullable)
- `user_roles.user_id` → `profiles.id` (via auth.users)

## Security

### Row Level Security (RLS)
- ✅ Users can only view/update their own profile
- ✅ All users can view active profiles (for dropdowns)
- ✅ Only admins can manage other users
- ✅ Only admins can assign roles

### Best Practices
1. Always set `created_by` and `recorded_by` when creating records
2. Use the `user_with_roles` view for user management UI
3. Use `is_user_admin()` function to check admin status
4. Deactivate users instead of deleting them (set `is_active = FALSE`)

## Next Steps

1. **Create User Management UI**: Build an admin page to:
   - View all users
   - Create new users
   - Edit user profiles
   - Assign roles
   - Activate/deactivate users

2. **Update Existing Code**: 
   - Add `created_by` to all lead/transaction creation
   - Add `recorded_by` to all payment recording
   - Display creator names in UI

3. **Authentication Integration**:
   - Connect your auth system to set `created_by` automatically
   - Update `last_login_at` on login
   - Sync email from `auth.users` to `profiles`

## Notes

- The `profiles` table is separate from `auth.users` to allow flexibility
- Email should be synced from `auth.users` (handle in application code)
- Use `is_active = FALSE` to deactivate users instead of deleting
- Foreign keys use `ON DELETE SET NULL` to preserve audit trail
