# DeepScan

A Next.js application that uses AI to analyze GitHub repositories, then generates professional consulting proposals with integrated payment processing.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Complete Setup Guide](#complete-setup-guide)
- [How It Works](#how-it-works)
- [API Keys Reference](#api-keys-reference)
- [Troubleshooting](#troubleshooting)
- [Production Deployment](#production-deployment)

---

## Overview

This application helps consultants quickly create personalized, professional proposals for potential clients by:

1. **Analyzing** their GitHub repository using AI (Google Gemini)
2. **Identifying** security issues, performance bottlenecks, and opportunities
3. **Generating** an interactive proposal with recommended services
4. **Processing** payments directly through Flowglad integration

### Features

- ✅ AI-powered analysis using Gemini (gemini-3-pro-preview)
- ✅ GitHub repository analysis (GitHub-only)
- ✅ Role-based authentication (Consultants & Businesses)
- ✅ Interactive proposal viewer with live pricing
- ✅ Integrated payment processing via Flowglad
- ✅ MongoDB for user and request storage
- ✅ Beautiful, modern UI with animations

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory. See [Complete Setup Guide](#complete-setup-guide) for detailed instructions.

**Minimum required:**
```env
# Auth0 (Required)
AUTH0_SECRET='<AUTH0_SECRET>'
APP_BASE_URL='http://localhost:3000'
AUTH0_DOMAIN='your-tenant.auth0.com'
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='<AUTH0_CLIENT_SECRET>'

# MongoDB (Required)
MONGODB_URI='<MONGODB_URI>'
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Open in Browser

Navigate to [http://localhost:3000](http://localhost:3000)

---

## Complete Setup Guide

### 1. Auth0 Setup (Required)

#### Step 1: Create Auth0 Account
1. Go to [https://auth0.com](https://auth0.com)
2. Sign up for a free account
3. Select your region

#### Step 2: Create Application
1. In Auth0 Dashboard → **Applications** → **Applications**
2. Click **Create Application**
3. Name: `Consulting Proposal Generator`
4. Type: **Regular Web Application**
5. Click **Create**

#### Step 3: Get Credentials
1. Go to **Settings** tab
2. Copy these values:
   - **Domain** (e.g., `your-tenant.us.auth0.com`)
   - **Client ID**
   - **Client Secret** (click "Show" to reveal)

#### Step 4: Configure URLs ⚠️ CRITICAL
In **Application Settings** → **Application URIs**:

**Allowed Callback URLs:**
```
http://localhost:3000/api/auth/callback
```
> ⚠️ **IMPORTANT:** Use the exact URL above. Must include:
> - Protocol: `http://` (or `https://` for production)
> - Port: `:3000` (for local development)
> - Full path: `/api/auth/callback`
> - No trailing slash

**Allowed Logout URLs:**
```
http://localhost:3000
```

**Allowed Web Origins:**
```
http://localhost:3000
```

**Click "Save Changes"!**

#### Step 5: Generate AUTH0_SECRET
```bash
openssl rand -hex 32
```
Copy the output.

#### Step 6: Add to .env.local
```env
AUTH0_SECRET='<AUTH0_SECRET>'
APP_BASE_URL='http://localhost:3000'
AUTH0_DOMAIN='your-tenant.us.auth0.com'
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='<AUTH0_CLIENT_SECRET>'
```

> ⚠️ **Note:** `AUTH0_DOMAIN` should be just the domain (e.g., `your-tenant.us.auth0.com`), NOT the full URL with `https://`

---

### 2. MongoDB Setup (Required)

#### Option A: MongoDB Atlas (Cloud - Recommended)

1. **Create Account**
   - Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for free (M0 cluster is free forever)

2. **Create Cluster**
   - Click **Build a Database**
   - Select **M0 FREE**
   - Choose region and click **Create**
   - Wait 3-5 minutes

3. **Create Database User**
   - Go to **Database Access**
   - Click **Add New Database User**
   - Username: `consulting-app` (or your choice)
   - Password: Generate secure password (save it!)
   - Privileges: **Read and write to any database**
   - Click **Add User**

4. **Configure Network Access**
   - Go to **Network Access**
   - Click **Add IP Address**
   - For development: **Add Current IP Address**
   - For production: **Allow Access from Anywhere** (0.0.0.0/0)

5. **Get Connection String**
   - Go to **Database** → Click **Connect** on your cluster
   - Choose **Connect your application**
   - Select **Node.js** and version **5.5 or later**
   - Copy connection string

6. **Create Full Connection String**
   Replace `<username>` and `<password>`:
   ```
   <YOUR_MONGODB_ATLAS_CONNECTION_STRING>
   ```

#### Option B: Local MongoDB

1. **Install MongoDB**
   ```bash
   # macOS
   brew tap mongodb/brew
   brew install mongodb-community
   
   # Ubuntu/Debian
   sudo apt-get install mongodb
   ```

2. **Start MongoDB**
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

3. **Connection String**
   ```
   mongodb://localhost:27017/consulting-proposals
   ```

#### Add to .env.local
```env
# For MongoDB Atlas
MONGODB_URI='<YOUR_MONGODB_ATLAS_CONNECTION_STRING>'

# OR for Local MongoDB
MONGODB_URI='mongodb://localhost:27017/consulting-proposals'
```

---

### 3. Google Gemini API (Optional - for AI Analysis)

**Without this key, the app uses mock/demo data for analysis.**

1. **Get API Key**
   - Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
   - Sign in with Google account
   - Click **Create API Key**
   - Select or create Google Cloud project
   - Copy the API key

2. **Add to .env.local**
   ```env
   GEMINI_API_KEY='<GEMINI_API_KEY>'
   ```

---

### 4. Flowglad API (Optional - for Payments)

**Without this key, the app uses demo mode for checkout.**

1. **Sign Up**
   - Go to [https://flowglad.com](https://flowglad.com)
   - Sign up for an account

2. **Get API Key**
   - Go to Flowglad dashboard
   - Navigate to **Settings** → **API Keys**
   - Copy your API key

3. **Add to .env.local**
   ```env
   # Provide ONE of the following:
   FLOWGLAD_SECRET_KEY='<FLOWGLAD_SECRET_KEY>'
   # FLOWGLAD_API_KEY='<FLOWGLAD_API_KEY>'
   ```

---

### 5. GitHub Token (Optional - for Higher Rate Limits)

**Without this, GitHub API works but with lower rate limits (60 requests/hour vs 5000).**

1. **Create Personal Access Token**
   - Go to [https://github.com/settings/tokens](https://github.com/settings/tokens)
   - Click **Generate new token** → **Generate new token (classic)**
   - Name: `Consulting Proposal Generator`
   - Expiration: Choose your preference
   - Scopes: Check `public_repo`
   - Click **Generate token**
   - **Copy the token immediately** (you won't see it again!)

2. **Add to .env.local**
   ```env
   GITHUB_TOKEN='<GITHUB_TOKEN>'
   ```

---

### 6. App URL

Add to `.env.local`:
```env
NEXT_PUBLIC_APP_URL='http://localhost:3000'
```

---

### Complete .env.local Example

```env
# Auth0 Configuration (Required)
AUTH0_SECRET='<AUTH0_SECRET>'
APP_BASE_URL='http://localhost:3000'
AUTH0_DOMAIN='your-tenant.auth0.com'
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='<AUTH0_CLIENT_SECRET>'

# MongoDB Connection (Required)
MONGODB_URI='<MONGODB_URI>'

# Google Gemini API (Optional)
GEMINI_API_KEY='<GEMINI_API_KEY>'

# Flowglad API (Optional)
FLOWGLAD_SECRET_KEY='<FLOWGLAD_SECRET_KEY>'
# FLOWGLAD_API_KEY='<FLOWGLAD_API_KEY>'

# GitHub Token (Optional)
GITHUB_TOKEN='<GITHUB_TOKEN>'

# App URL
NEXT_PUBLIC_APP_URL='http://localhost:3000'
```

---

## How It Works

### For Consultants

#### Step 1: Input Client Information
- Visit the landing page
- Enter a GitHub repository URL (e.g., `https://github.com/client-org/project`)
- Click "Analyze & Generate Proposal"

#### Step 2: AI Analysis (Automatic)
The system automatically:
1. **Fetches data** from GitHub: README, dependencies, tech stack
3. **Analyzes with Gemini (gemini-3-pro-preview):**
   - Identifies critical security issues
   - Finds performance bottlenecks
   - Detects scalability concerns
   - Identifies technical debt
   - Finds missing best practices
   - Suggests opportunities for improvement
4. **Maps to services:**
   - Security Audit ($8,000)
   - Performance Optimization ($10,000)
   - Tech Stack Migration ($15,000)
   - Monthly Retainer - Basic ($3,000/month)
   - Monthly Retainer - Premium ($7,500/month)

#### Step 3: Proposal Generation
- Unique proposal ID generated
- Proposal includes:
  - Executive summary
  - Issues organized by severity
  - Opportunities
  - Recommended services with pricing
  - Tech stack information
- Shareable link: `/proposal/[id]`

#### Step 4: Client Views & Purchases
- Client reviews proposal
- Selects services they need
- Sees live pricing updates
- Clicks "Proceed to Payment"
- Completes payment via Flowglad
- Receives invoice and confirmation

### Service Pricing Model

| Service | Price | Timeline | Best For |
|---------|-------|----------|----------|
| Security Audit | $8,000 | 2 weeks | Critical security issues |
| Performance Optimization | $10,000 | 3 weeks | Performance bottlenecks |
| Tech Stack Migration | $15,000 | 6-8 weeks | Major modernization |
| Monthly Retainer - Basic | $3,000/month | Ongoing | Ongoing support |
| Monthly Retainer - Premium | $7,500/month | Ongoing | Comprehensive support |

### Consultant Benefits

- **Time Savings:** Minutes instead of hours/days
- **Consistency:** Professional proposals every time
- **Scalability:** Generate unlimited proposals
- **Automation:** AI handles analysis, Flowglad handles payments

---

## API Keys Reference

### Required Keys

| Service | Variable | Where to Get |
|---------|----------|--------------|
| Auth0 | `AUTH0_SECRET`, `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` | [auth0.com](https://auth0.com) |
| MongoDB | `MONGODB_URI` | [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) |

### Optional Keys

| Service | Variable | Where to Get | What Happens Without It |
|---------|----------|--------------|-------------------------|
| Gemini | `GEMINI_API_KEY` | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) | Uses mock/demo data |
| Flowglad | `FLOWGLAD_API_KEY` | [flowglad.com](https://flowglad.com) | Uses demo mode |
| GitHub | `GITHUB_TOKEN` | [github.com/settings/tokens](https://github.com/settings/tokens) | Lower rate limits (60/hour) |

---

## Troubleshooting

### Auth0 Issues

**Error: "Callback URL mismatch"**
- **Solution:** 
  - Go to Auth0 Dashboard → Applications → Your App → Settings
  - Add exactly: `http://localhost:3000/api/auth/callback` to **Allowed Callback URLs**
  - Click "Save Changes"
  - Restart dev server

**Error: "Invalid state" or "Redirect URI mismatch"**
- Clear browser cookies
- Verify `APP_BASE_URL` matches your app URL
- Check callback URLs in Auth0 dashboard match exactly

**Error: "AUTH0_SECRET is required"**
- Make sure `.env.local` exists in project root
- Restart dev server after adding variables
- Verify `AUTH0_SECRET` is a long random string (32+ characters)

### MongoDB Issues

**Error: "Connection timeout"**
- Check network access in MongoDB Atlas (allow your IP)
- Verify connection string has correct username/password
- Check if cluster is running (Atlas dashboard)

**Error: "Authentication failed"**
- Verify username and password in connection string
- Check database user has correct permissions

### Gemini Issues

**Error: "API key not found"**
- Verify `GEMINI_API_KEY` is set in `.env.local`
- Restart dev server after adding key
- Check API key is valid in Google AI Studio

### Flowglad Issues

**Error: "API key not configured"**
- App will use demo mode automatically
- For real payments, add `FLOWGLAD_API_KEY`
- Restart dev server after adding key

### General Issues

**Build errors after adding environment variables**
- Restart dev server: `npm run dev`
- Clear `.next` folder: `rm -rf .next`
- Rebuild: `npm run build`

---

## Production Deployment

### 1. Update Environment Variables

Set all environment variables in your hosting platform (Vercel, Netlify, etc.)

### 2. Update Auth0 URLs

In Auth0 Dashboard → Applications → Your App → Settings:

**Allowed Callback URLs:**
```
http://localhost:3000/api/auth/callback, https://yourdomain.com/api/auth/callback
```

**Allowed Logout URLs:**
```
http://localhost:3000, https://yourdomain.com
```

**Allowed Web Origins:**
```
http://localhost:3000, https://yourdomain.com
```

### 3. Update Environment Variables

```env
APP_BASE_URL='https://yourdomain.com'
NEXT_PUBLIC_APP_URL='https://yourdomain.com'
```

### 4. Use Production Keys

- Flowglad: Use your production key from the Flowglad dashboard
- MongoDB: Production cluster
- Auth0: Production application

### 5. Deploy

```bash
npm run build
# Deploy to your hosting platform
```

---

## Project Structure

```
app/
├── page.tsx                 # Landing page
├── login/                   # Auth0 login page
├── dashboard/               # Role-based dashboard
├── analyze/                 # Analysis progress
├── proposal/[id]/          # Generated proposal viewer
├── checkout/[proposalId]/  # Checkout flow
├── success/                 # Payment success
└── api/                    # API routes
    ├── auth/[...auth0]/    # Auth0 routes
    ├── analyze/            # Repository analysis
    ├── proposal/[id]/      # Fetch proposal
    ├── checkout/           # Create checkout session
    └── consulting-requests/ # CRUD for requests

lib/
├── auth0.ts                # Auth0 client
├── gemini.ts               # Gemini API client
├── github.ts               # GitHub API client
├── project-analyzer.ts     # GitHub analyzer
├── website.ts              # (Deprecated) website analyzer (GitHub-only focus)
├── flowglad.ts             # Service definitions
├── flowglad-client.ts      # Flowglad API client
├── mongodb.ts              # MongoDB connection
├── store.ts                # In-memory proposal store
└── models/                 # Mongoose models
    ├── User.ts
    └── ConsultingRequest.ts

components/
├── dashboards/
│   ├── ConsultantDashboard.tsx
│   └── BusinessDashboard.tsx
└── ui/                     # shadcn/ui components
```

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Authentication:** Auth0 v4
- **Database:** MongoDB (Mongoose)
- **AI:** Google Gemini (gemini-3-pro-preview)
- **Payments:** Flowglad
- **Deployment:** Vercel/Netlify ready

---

## Demo Mode

You can test the application without API keys by clicking the "Try Demo Mode" button on the landing page. This uses mock data to demonstrate the full flow.

---

## Security Best Practices

1. **Never commit `.env.local` to git** (already in `.gitignore`)
2. **Use different keys for development and production**
3. **Rotate keys regularly**, especially if exposed
4. **Use environment-specific MongoDB databases**
5. **Limit MongoDB network access** to only necessary IPs

---

## Summary

**Minimum Required Setup:**
- ✅ Auth0 (authentication)
- ✅ MongoDB (database)

**Recommended Setup:**
- ✅ Gemini API (real AI analysis)
- ✅ Flowglad API (real payments)
- ✅ GitHub token (better rate limits)

**Total Setup Time:** ~15-20 minutes

Once all keys are in `.env.local`, restart your dev server and everything should work!

---

## Need Help?

- Check the [Troubleshooting](#troubleshooting) section
- Verify all environment variables are set correctly
- Ensure Auth0 callback URLs match exactly
- Check server logs for detailed error messages

---

## License

MIT
