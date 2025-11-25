# Supabase Database Migrations

## Overview

ეს დირექტორია შეიცავს SQL migrations-ებს EASYUP-ის მონაცემთა ბაზისთვის. მიგრაცია ხდება **ეტაპობრივად**.

## Current Migration: Authentication Tables

ამჟამად გვაქვს **მხოლოდ Authentication**-თან დაკავშირებული tables:

### Tables:
1. **`roles`** - სისტემური როლები (super_admin, client, და ა.შ.)
2. **`organizations`** - ორგანიზაციები/სააგენტოები
3. **`user_organizations`** - user-organization-role relationships (junction table)

### Features:
- ✅ Row Level Security (RLS) policies
- ✅ Auto-updating timestamps
- ✅ Foreign key constraints
- ✅ Indexes for performance
- ✅ Seed data for roles

## How to Run Migrations

### Option 1: Supabase Dashboard (GUI) - **რეკომენდებული**

1. გადადით თქვენს Supabase project-ში: https://supabase.com/dashboard
2. აირჩიეთ **SQL Editor** მარცხენა sidebar-იდან
3. დააჭირეთ **New Query**

#### Step 1: Run Schema Migration

4. გახსენით `01_auth_schema.sql` ფაილი
5. დააკოპირეთ მთელი შინაარსი
6. ჩასვით Supabase SQL Editor-ში
7. დააჭირეთ **Run** (ან Ctrl/Cmd + Enter)
8. დაელოდეთ "Success" შეტყობინებას

#### Step 2: Run Seed Data

9. დააჭირეთ **New Query** ახალი tab-ისთვის
10. გახსენით `02_seed_roles.sql` ფაილი
11. დააკოპირეთ შინაარსი
12. ჩასვით SQL Editor-ში
13. დააჭირეთ **Run**
14. უნდა დაინახოთ 7 როლი SELECT შედეგში

### Option 2: Supabase CLI (Terminal)

თუ გაქვთ Supabase CLI დაყენებული:

```bash
# Link your project (first time only)
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Verification

### 1. Check Tables Created

SQL Editor-ში გაუშვით:

```sql
-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

უნდა დაინახოთ:
- `organizations`
- `roles`
- `user_organizations`

### 2. Check Roles Seeded

```sql
SELECT * FROM public.roles ORDER BY display_name;
```

უნდა დაინახოთ 7 როლი:
- Super Admin
- Account Manager
- Copywriter
- Designer
- Content Creator
- Advertiser
- Client

### 3. Check RLS Enabled

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

ყველა table-ს უნდა ჰქონდეს `rowsecurity = true`

## What's Next

ამ migration-ის შემდეგ საჭიროა:

### 1. Update authService.ts

ახლა authService უნდა გამოიყენოს **Supabase tables** mockDb-ის მაგივრად:

```typescript
// Before (mockDb)
mockDb.insert('organizations', newOrg);

// After (Supabase)
await supabase.from('organizations').insert(newOrg);
```

### 2. Test Registration Flow

1. წაშალეთ localStorage data (browser DevTools → Application → Local Storage)
2. გადადით `/register`
3. შექმენით ახალი account
4. შეამოწმეთ Supabase Dashboard → Table Editor:
   - `auth.users` - უნდა ჩანდეს user
   - `public.organizations` - უნდა შეიქმნას ორგანიზაცია
   - `public.user_organizations` - უნდა დაკავშირდეს user org-თან

### 3. Migrate Other Services (Future)

შემდეგი ეტაპებია:
- ❌ Projects (არ არის მიგრირებული)
- ❌ Ideas (არ არის მიგრირებული)
- ❌ Tasks (არ არის მიგრირებული)
- და ა.შ.

## Troubleshooting

### Error: "relation already exists"

თუ ხელახლა ამბობთ migration-ს:

```sql
-- Drop tables (careful!)
DROP TABLE IF EXISTS public.user_organizations CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
```

შემდეგ ხელახლა გაუშვით `01_auth_schema.sql`

### Error: "permission denied"

დარწმუნდით რომ იყენებთ სწორ API key-ს და project-ს.

### Error: "cannot insert into table"

RLS policies-მა შეიძლება დაბლოკოს INSERT. დროებით გამორთეთ RLS:

```sql
ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;
-- Run your insert
-- Then re-enable
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
```

## Migration History

- ✅ **01_auth_schema.sql** - Authentication tables (roles, organizations, user_organizations)
- ✅ **02_seed_roles.sql** - Seed data for roles
- ⏳ **Future**: Projects, Ideas, Tasks, Assets, etc.
