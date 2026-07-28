# 🥛 Udhari Khata (उधारी खाता)

**Udhari Khata** is a mobile-first, offline-capable PWA credit ledger designed for dairy shop operators. It supports instant local IndexedDB storage, Marathi-friendly UI, and optional real-time multi-device cloud synchronization via Supabase.

---

## 🚀 Quick Local Demo Setup (Zero Setup Required)

Test the complete application locally without Supabase keys, hosted backends, or external accounts.

### Step-by-Step Instructions

1. **Install Node.js** (v18 or v20+ recommended).
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Configure Local Environment**:
   Copy `.env.example` to `.env.local` (or use the default `.env` provided):
   ```env
   VITE_APP_NAME=Udhari Khata
   VITE_APP_ENV=development
   VITE_DATA_MODE=local
   VITE_ENABLE_PWA=true

   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   ```
4. **Start Development Server**:
   ```bash
   npm run dev
   ```
5. **Open Local App**:
   Open the localhost URL shown by Vite (e.g. `http://localhost:5173`).

---

## 🔑 Local Demo Credentials

Use either of these pre-configured test accounts on the login screen:

### 👑 Owner Account (अ‍ॅडमिन मालक)
- **Email**: `admin@udhari.local`
- **Password**: `Admin@123`
- **Permissions**: Add/edit customers, add credit/payments, edit & soft-delete transactions, view reports, reset demo data, import/export backups.

### 👤 Staff Account (भाऊ स्टाफ)
- **Email**: `brother@udhari.local`
- **Password**: `Brother@123`
- **Permissions**: View & search customers, add credit & payments, view history. Restricted from resetting demo data or hard deleting transactions.

---

## 💡 Important Local Mode Information

- **Local Persistence**: All data is saved locally in your browser's **IndexedDB** database using Dexie.js.
- **Browser Data Storage**: Clearing browser cache or site data will wipe local records.
- **No Cross-Device Sync**: Local Demo Mode stores data strictly inside the single browser. Realtime multi-device sync is enabled when switching to Supabase mode (`VITE_DATA_MODE=supabase`).
- **Reset Demo Data**: Navigate to **Settings** -> **Reset Demo Data** to restore the initial 5 Marathi sample customers and ledger transactions.
- **PWA Local Preview**: Test the PWA offline shell by running:
  ```bash
  npm run build
  npm run preview
  ```

---

## 🛠️ Development & Quality Scripts

```bash
# Run all quality checks (Typecheck, Lint, Test, Build)
npm run check

# Start development server
npm run dev

# Run Vitest unit & integration test suite
npm run test

# Run strict TypeScript typecheck
npm run typecheck

# Run ESLint linter
npm run lint

# Build production bundle & PWA service worker
npm run build

# Preview production build locally
npm run preview
```

---

## 📄 Documentation

- [PRODUCTION_SETUP.md](file:///d:/testantigravityy/PRODUCTION_SETUP.md) - Instructions for later switching to Supabase mode.
- [SECURITY.md](file:///d:/testantigravityy/SECURITY.md) - Security audit, RLS policies, and CSV formula protection.
- [USER_GUIDE.md](file:///d:/testantigravityy/USER_GUIDE.md) - Complete Marathi User Guide for shop operators.
- [DEPLOYMENT.md](file:///d:/testantigravityy/DEPLOYMENT.md) - Deployment instructions for Vercel, Netlify, and Cloudflare.
- [TESTING.md](file:///d:/testantigravityy/TESTING.md) - Testing overview and Vitest/Playwright setup.
