# User Management Setup Guide

## Overview
The Users page allows admins to perform full CRUD operations on user accounts, including password management and role assignment.

## Prerequisites

### 1. Run the Database Migration
Make sure you've run the `005_user_management.sql` migration in your Supabase SQL Editor.

### 2. Configure Service Role Key (Required for User Creation/Password Updates)

For security reasons, user creation and password updates require the Supabase **Service Role Key** (not the anon key). 

**⚠️ Security Warning**: The service role key bypasses Row Level Security and should NEVER be exposed in client-side code in production. For production, you should:

1. **Option A (Recommended)**: Create a backend API endpoint that handles user creation/password updates
2. **Option B (Development Only)**: Use the service role key in environment variables (only for development/testing)

### Setup for Development:

1. Get your Service Role Key:
   - Go to Supabase Dashboard → Settings → API
   - Copy the `service_role` key (NOT the `anon` key)

2. Add to your `.env` file:
   ```env
   VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

3. **Important**: Add `.env` to `.gitignore` to prevent committing the service role key:
   ```gitignore
   .env
   .env.local
   ```

### For Production:
Create a backend API (e.g., using Supabase Edge Functions, Next.js API routes, or a separate backend service) that:
- Accepts user creation/update requests
- Uses the service role key server-side
- Validates admin permissions
- Returns success/error responses

## Features

### User Management
- ✅ **Create Users**: Add new users with email, password, name, phone, and roles
- ✅ **Edit Users**: Update user information (name, phone, roles)
- ✅ **Change Passwords**: Admin can reset any user's password
- ✅ **Activate/Deactivate**: Enable or disable user accounts
- ✅ **Role Management**: Assign/remove admin and maintainer roles
- ✅ **View Users**: See all users with their roles and status

### User Roles
- **Admin**: Full access to all features including user management
- **Maintainer**: Limited access (no user management)

### Security Features
- Email validation
- Password strength requirements (minimum 6 characters)
- Role-based access control (only admins can manage users)
- User deactivation instead of deletion (preserves data)

## Usage

### Creating a User
1. Click "Add User" button
2. Fill in:
   - Email (required, cannot be changed after creation)
   - Password (required, minimum 6 characters)
   - Full Name (required)
   - Phone (optional)
   - Roles (select admin and/or maintainer)
3. Click "Create User"

### Editing a User
1. Click the edit icon (pencil) next to a user
2. Update name, phone, or roles
3. Note: Email cannot be changed after creation
4. Click "Update User"

### Changing a Password
1. Click the key icon next to a user
2. Enter new password (minimum 6 characters)
3. Confirm password
4. Click "Update Password"

### Managing Roles
- Roles can be assigned/removed when editing a user
- Check/uncheck the role checkboxes to add/remove roles
- Changes are saved immediately

### Activating/Deactivating Users
- **Deactivate**: Click the trash icon → Confirm deactivation
- **Activate**: Click the checkmark icon on an inactive user
- Deactivated users cannot log in but their data is preserved

## Troubleshooting

### "Service role key not configured" Error
- Make sure `VITE_SUPABASE_SERVICE_ROLE_KEY` is set in your `.env` file
- Restart your development server after adding the key
- Verify the key is correct in Supabase Dashboard

### "Failed to create user" Error
- Check that the email is not already in use
- Verify password meets requirements (6+ characters)
- Ensure you have admin role assigned

### Users Not Appearing
- Verify the `005_user_management.sql` migration was run successfully
- Check that RLS policies allow admins to view profiles
- Ensure you're logged in as an admin user

## API Reference

### Context Functions

```typescript
// Create a new user
createUser({
  email: string,
  password: string,
  full_name: string,
  phone?: string,
  roles?: AppRole[]
}): Promise<Profile>

// Update user information
updateUser(id: string, updates: Partial<Profile>): Promise<void>

// Update user password
updateUserPassword(id: string, newPassword: string): Promise<void>

// Deactivate user
deactivateUser(id: string): Promise<void>

// Activate user
activateUser(id: string): Promise<void>

// Assign role to user
assignUserRole(userId: string, role: AppRole): Promise<void>

// Remove role from user
removeUserRole(userId: string, role: AppRole): Promise<void>
```

## Next Steps

1. **Set up authentication**: Connect your login system to use the profiles table
2. **Add user activity tracking**: Update `last_login_at` on login
3. **Email notifications**: Send welcome emails when users are created
4. **Audit logging**: Track who created/updated users
5. **Password policies**: Implement stronger password requirements
6. **Two-factor authentication**: Add 2FA for enhanced security
