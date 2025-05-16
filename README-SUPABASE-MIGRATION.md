# Firebase to Supabase Migration Guide

This document provides detailed instructions for migrating your application from Firebase to Supabase.

## Overview

The migration system consists of three main components:

1. **Authentication Migration** - Transfers user accounts from Firebase to Supabase
2. **Data Migration** - Moves data collections from Firestore to Supabase tables
3. **Environment Configuration** - Updates your application settings to use Supabase

## Prerequisites

Before starting the migration, ensure you have:

1. A Supabase project set up with appropriate tables created
2. Required environment variables in your `.env.local` file:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)

## Database Schema Preparation

Before migrating, create the following tables in your Supabase project:

1. **profiles** table:
   - `id` (primary key, UUID) 
   - `email` (text)
   - `display_name` (text)
   - `avatar_url` (text)
   - `firebase_uid` (text)
   - `created_at` (timestamp with timezone)
   - `updated_at` (timestamp with timezone)

2. **templates** table:
   - Include all fields from your Firestore templates collection
   - Add `firebase_id` (text) to reference the original ID
   - Add `created_at` and `updated_at` timestamps

3. **sounds** table:
   - Include all fields from your Firestore sounds collection
   - Add `firebase_id` (text) to reference the original ID
   - Add `created_at` and `updated_at` timestamps

## Migration Scripts

The project includes several scripts to help with migration:

### Complete Migration (Recommended)

For most users, the complete migration script handles everything in one step:

```bash
npm run complete-migration
```

This script will:
1. Migrate all users from Firebase to Supabase
2. Migrate all configured data collections
3. Update your environment configuration

### Step-by-Step Migration

If you prefer to migrate in steps:

1. **Migrate Authentication Only**:
   ```bash
   npm run migrate-to-supabase
   ```

2. **Migrate Data Collections**:
   
   Migrate all collections at once:
   ```bash
   npm run migrate-data-to-supabase:all
   ```
   
   Or migrate a specific collection:
   ```bash
   npm run migrate-data-to-supabase users profiles
   ```

3. **Enable Supabase in Environment**:
   ```bash
   npm run enable-supabase
   ```

## Testing Migration

To validate the migration process:

```bash
npm run test-migration       # Test the basic auth migration
npm run test-data-migration   # Test the data migration utilities
npm run migration:test-all    # Run all migration tests
```

## Troubleshooting

### Authentication Issues

- If users can't sign in after migration, check the Supabase Authentication dashboard
- Ensure the `firebase_uid` is properly stored in the user metadata
- Test the authentication by running `npm run test-migration`

### Data Migration Issues

- For collection migration failures, check the error messages in the console
- Try migrating specific collections manually for more detailed error information
- Verify your Supabase table structure matches the expected schema

### Environment Configuration Issues

- If the application doesn't use Supabase after migration, manually set `NEXT_PUBLIC_USE_SUPABASE=true` in your `.env.local` file
- Restart your Next.js development server after changing environment variables

## Post-Migration Steps

After successfully migrating:

1. Restart your Next.js server
2. Verify user authentication works with Supabase
3. Check all data access patterns to ensure they use Supabase correctly
4. Update any Firebase-specific code throughout your application

## Custom Data Transformations

If your collections need custom transformations during migration, edit the `DEFAULT_MAPPINGS` in `migrate-data-to-supabase.js` or `complete-migration.js` to add custom transform functions.

Example:

```javascript
{
  firebaseCollection: 'orders',
  supabaseTable: 'customer_orders',
  transform: (data, id) => ({
    order_id: id,
    customer_email: data.email,
    items: JSON.stringify(data.items), // Convert array to JSON string
    total: parseFloat(data.total), // Ensure proper number format
    firebase_id: id,
    created_at: new Date(data.created.seconds * 1000).toISOString(), // Convert Firebase timestamp
    updated_at: new Date().toISOString()
  })
}
```

## Migration System Architecture

The migration system uses the following components:

- `src/lib/utils/migration.js` - Authentication migration utilities
- `src/lib/utils/data-migration.js` - Data migration utilities
- `migrate-to-supabase.js` - CLI script for auth migration
- `migrate-data-to-supabase.js` - CLI script for data migration
- `complete-migration.js` - CLI script for complete migration

## Support

If you encounter issues during migration, please provide detailed error messages and logs from the migration process. 