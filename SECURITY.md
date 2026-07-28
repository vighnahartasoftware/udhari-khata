# Security Policy & Architecture Guide - Udhari Khata

## 1. Overview & Threat Model

Udhari Khata is designed to run securely on public mobile browsers (Android Chrome, iPhone Safari) while communicating directly with Supabase via Row Level Security (RLS) policies.

---

## 2. Key Security Safeguards

### A. Secret Protection
- **No Service Role Keys**: The Supabase `service_role` key is never compiled, referenced, or exposed in frontend code.
- **Environment Validation**: All runtime variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are validated strictly at startup using Zod schemas in `src/lib/env.ts`.

### B. Database & Row Level Security (RLS)
- **Strict RLS Enabled**: All PostgreSQL tables (`profiles`, `customers`, `transactions`, `activity_logs`) have Row Level Security enabled.
- **Identity Anti-Spoofing**: Policies enforce `created_by = auth.uid()`, preventing clients from impersonating other users.
- **Role Isolation**:
  - `staff` role: Can view, add, and soft-delete entries (`deleted_at`).
  - `owner` role: Full administrative access, including hard-delete privileges.

### C. CSV Formula Injection Defense
- **Input Sanitization**: All CSV cell contents exported via `src/utils/csvExport.ts` are processed through `sanitizeCSVCell()`.
- Cells starting with formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`) are escaped with a leading single quote (`'`), preventing arbitrary macro code execution when opened in Excel or Google Sheets.

### D. Backup Import Hardening
- **File Size Cap**: Backup file uploads in `src/features/settings/BackupImportModal.tsx` are hard-capped at **5 MB**.
- **Schema Validation**: Uploaded JSON is validated for required array fields and customer structure before writing to local IndexedDB.

### E. Service Worker & Cache Isolation
- **No API Response Caching**: Supabase REST APIs (`https://*.supabase.co/*`) are excluded from Service Worker precaching to prevent caching sensitive ledger records in public browser storage.

---

## 3. Reporting Vulnerabilities

To report security issues, please contact the shop application administrator or file a private security issue in the repository.
