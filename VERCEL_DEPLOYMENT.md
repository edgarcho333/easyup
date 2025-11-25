# Vercel Deployment Guide

## Prerequisites

- GitHub account
- Vercel account (sign up at https://vercel.com)
- Supabase project already set up

---

## Step 1: Push Code to GitHub

### 1.1 Initialize Git (თუ ჯერ არ გაკეთებულია)

```bash
git init
git add .
git commit -m "feat: Complete authentication migration to Supabase"
```

### 1.2 Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `easyup` (or your preferred name)
3. Make it **Private** (recommended)
4. **DO NOT** initialize with README (we already have code)
5. Click **Create repository**

### 1.3 Push to GitHub

```bash
# Replace with your actual GitHub repository URL
git remote add origin https://github.com/YOUR_USERNAME/easyup.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy to Vercel

### 2.1 Import Project

1. Go to https://vercel.com/new
2. Click **Import Git Repository**
3. Select your GitHub repository `easyup`
4. Click **Import**

### 2.2 Configure Project

Vercel will auto-detect Vite settings:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install --legacy-peer-deps`

Click **Deploy** (დროებით, environment variables-ის გარეშე deployment fail-დება, მაგრამ ეს ნორმალურია)

---

## Step 3: Configure Environment Variables

### 3.1 Add Environment Variables

Vercel Dashboard → Your Project → **Settings** → **Environment Variables**

დაამატეთ შემდეგი variables:

#### 1. **VITE_SUPABASE_URL**
```
Value: https://dnvnaxuqzpdujanzgcki.supabase.co
Environment: Production, Preview, Development
```

#### 2. **VITE_SUPABASE_ANON_KEY**
```
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudm5heHVxenBkdWphbnpnY2tpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNjAyMzYsImV4cCI6MjA3OTYzNjIzNn0.YcLp5zbgV46UK33rqt-H1VqGHljsPnTJbvYOBcyG_jo
Environment: Production, Preview, Development
```

#### 3. **VITE_GEMINI_API_KEY** (თუ გაქვთ)
```
Value: your_gemini_api_key_here
Environment: Production, Preview, Development
```

### 3.2 Redeploy

After adding environment variables:

1. Go to **Deployments** tab
2. Click **•••** (three dots) on the latest deployment
3. Click **Redeploy**
4. Check **Use existing Build Cache** (optional)
5. Click **Redeploy**

---

## Step 4: Configure Supabase for Production

### 4.1 Add Vercel Domain to Supabase

Supabase Dashboard → **Authentication** → **URL Configuration**

Add your Vercel domain to **Site URL**:
```
https://your-project-name.vercel.app
```

Add to **Redirect URLs**:
```
https://your-project-name.vercel.app/**
https://your-project-name.vercel.app/auth/callback
```

### 4.2 Update CORS Settings (თუ საჭიროა)

Supabase Dashboard → **Settings** → **API** → **CORS**

Ensure your Vercel domain is allowed.

---

## Step 5: Test Production Deployment

### 5.1 Visit Your Site

Open: `https://your-project-name.vercel.app`

### 5.2 Test Authentication

1. Click **Sign up** (Register)
2. Create a test account:
   - Email: `test@example.com`
   - Password: `testpass123`
   - Full Name: `Test User`
   - Organization: `Test Org`

3. Verify in Supabase Dashboard:
   - **Authentication** → **Users** (should see new user)
   - **Table Editor** → `organizations` (should see "Test Org")
   - **Table Editor** → `user_organizations` (should see relationship)

4. Test Login:
   - Logout
   - Login with same credentials
   - Should redirect to dashboard

5. Test Page Refresh:
   - While logged in, refresh the page (`F5`)
   - Should remain logged in (not redirected to login)

---

## Troubleshooting

### Issue: "Failed to load resource" or Network Errors

**Solution**: Check that environment variables are set correctly in Vercel.

### Issue: "Auth session missing" after deployment

**Solution**:
1. Check Supabase Site URL includes your Vercel domain
2. Clear browser cookies for your Vercel domain
3. Try registering a new account

### Issue: Build fails with peer dependency errors

**Solution**: Vercel should use `--legacy-peer-deps` (already in `vercel.json`). If not:
- Vercel Dashboard → Project Settings → General → Build & Development Settings
- Override Install Command: `npm install --legacy-peer-deps`

### Issue: Vite environment variables not working

**Solution**: Make sure all env vars start with `VITE_` prefix in Vercel.

---

## Post-Deployment

### Custom Domain (Optional)

Vercel Dashboard → Your Project → **Settings** → **Domains**

Add your custom domain (e.g., `easyup.app`)

### Monitoring

- **Vercel Analytics**: Automatic performance monitoring
- **Vercel Logs**: Real-time function logs
- **Supabase Dashboard**: Monitor auth events and database queries

---

## Continuous Deployment

ახლა ყოველი `git push` ავტომატურად deploy-ს გააკეთებს Vercel-ზე:

```bash
# Make changes
git add .
git commit -m "feat: Add new feature"
git push origin main

# Vercel will automatically deploy
```

---

## Environment-Specific Deployments

- **Production**: `main` branch → `your-project.vercel.app`
- **Preview**: Other branches → `branch-name-your-project.vercel.app`
- **Development**: Local with `.env.local`

---

## Security Best Practices

✅ Never commit `.env.local` to Git
✅ Use Vercel Environment Variables for secrets
✅ Enable Supabase RLS policies
✅ Review Vercel deployment logs regularly
✅ Use HTTPS only (Vercel handles this automatically)

---

## Next Steps After Deployment

Once authentication is verified in production:

1. Continue database migration (Projects, Ideas, Tasks, etc.)
2. Each new migration should be tested locally first
3. Then pushed to GitHub → auto-deploys to Vercel
4. Test in production after each major migration

---

**გილოცავთ! თქვენი აპლიკაცია ახლა live-ია Vercel-ზე!** 🎉
