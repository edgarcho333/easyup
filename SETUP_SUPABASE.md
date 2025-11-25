# Supabase Setup Instructions

## Overview

EASYUP-ი ეტაპობრივად მიგრირდება Supabase-ზე. ამჟამად **მხოლოდ Authentication** დაკავშირებულია Supabase-თან, ხოლო organizations, projects, ideas და სხვა features-ები ჯერ კიდევ mockDb-ს იყენებენ.

## Step 1: Create Supabase Project

1. შედით [https://supabase.com](https://supabase.com) და შექმენით ანგარიში
2. დააჭირეთ "New Project"
3. შეიყვანეთ:
   - **Organization**: შექმენით ან აირჩიეთ არსებული
   - **Project Name**: `easyup` (ან თქვენი სასურველი სახელი)
   - **Database Password**: ძლიერი პაროლი (შეინახეთ უსაფრთხო ადგილას)
   - **Region**: აირჩიეთ თქვენთან ახლოს მდებარე რეგიონი
4. დააჭირეთ "Create new project" და დაელოდეთ რამდენიმე წუთს

## Step 2: Get API Credentials

1. თქვენს Supabase project-ში, გადადით **Settings** → **API**
2. მონიშნეთ შემდეგი მნიშვნელობები:
   - **Project URL** (მაგ: `https://xxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (დიდი სტრიქონი რომელიც იწყება `eyJ...`)

## Step 3: Configure Environment Variables

1. გახსენით `.env.local` ფაილი პროექტის root directory-ში
2. შეცვალეთ Supabase credentials-ები:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. გადააკოპირეთ თქვენი რეალური მნიშვნელობები Step 2-დან

## Step 4: Set Up Authentication

ამჟამად თქვენ არ გჭირდებათ რაიმე SQL tables-ის შექმნა, რადგან Supabase Auth ავტომატურად ქმნის საჭირო tables-ს `auth` schema-ში.

თუმცა, შეგიძლიათ დააკონფიგურიროთ Auth Settings:

1. გადადით **Authentication** → **Providers**
2. დარწმუნდით რომ **Email** provider ჩართულია (default-ად ჩართულია)
3. (Optional) დააკონფიგურიროთ:
   - **Confirm Email**: თუ გინდათ რომ users-მა დაადასტურონ email
   - **Email Templates**: customize welcome, reset password emails

## Step 5: Test Authentication

1. გაუშვით dev server:
```bash
npm run dev
```

2. გახსენით `http://localhost:3000`
3. დააჭირეთ "Sign up" და შექმენით test account
4. თუ registration წარმატებულია, თქვენ გადამისამართდებით dashboard-ზე

## Step 6: Verify in Supabase Dashboard

1. გადადით Supabase Dashboard → **Authentication** → **Users**
2. დაინახავთ თქვენს ახლად შექმნილ user-ს

## Migration Status

### ✅ Completed
- **Authentication**: Login, Register, Logout, Password Reset (Supabase Auth)

### 🔄 In Progress (Using mockDb)
- **Organizations**: Organization management and relationships
- **Users Metadata**: User profiles, avatars (ამჟამად Supabase user_metadata-ში ინახება)
- **Roles**: User roles and permissions
- **User-Organization Relationships**: Organization memberships

### ⏳ Planned (Future Migration)
- **Projects**: Project CRUD and settings
- **Ideas**: Content ideas and approval workflows
- **Tasks**: Task management and dependencies
- **Assets**: File uploads and reviews
- **Chat**: Messaging system
- **Analytics**: Activity logs and metrics
- **Notifications**: Real-time notifications
- **Budgets**: Campaign budget tracking
- **Workflows**: Automation rules
- **Time Tracking**: Time logs

## Architecture Notes

### Hybrid Approach

ამჟამად app იყენებს **hybrid approach**-ს:

1. **Supabase Auth** - User authentication (login, register, sessions)
2. **mockDb (localStorage)** - Organizations, projects, ideas და დანარჩენი features

### AuthService

`services/authService.ts` აერთიანებს:
- Supabase Auth-ს user authentication-ისთვის
- mockDb-ს organizations და roles-ისთვის

### Why This Approach?

ეს საშუალებას გვაძლევს **ეტაპობრივად** გავაკეთოთ migration:
1. ✅ Step 1: Authentication (Supabase) ← **ახლავე დასრულებულია**
2. Step 2: Organizations & User Management (Supabase tables)
3. Step 3: Projects & Ideas (Supabase tables)
4. და ასე შემდეგ...

## Troubleshooting

### Issue: "Supabase credentials not found"
**Solution**: დარწმუნდით რომ `.env.local` შექმნილია და შეიცავს სწორ credentials-ებს.

### Issue: "Invalid login credentials"
**Solution**:
- დარწმუნდით რომ user რეგისტრირებულია Supabase-ში
- შეამოწმეთ email confirmation settings თუ ჩართულია

### Issue: "User has no organizations"
**Solution**:
- ახალი რეგისტრაციისას ავტომატურად იქმნება organization mockDb-ში
- თუ მაინც პრობლემაა, შეამოწმეთ browser console-ი errors-ისთვის

### Issue: Dev server won't start
**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Restart dev server
npm run dev
```

## Next Steps

როცა ეს ეტაპი (Authentication) დადასტურდება, შეგვიძლია გავაგრძელოთ შემდეგი migration steps-ით:

1. Organizations migration → Supabase tables
2. Projects migration → Supabase tables
3. Ideas & Content workflow → Supabase tables
4. და ა.შ.

თითოეული ეტაპი იქნება დამოუკიდებელი და დატესტილი ცალ-ცალკე.
