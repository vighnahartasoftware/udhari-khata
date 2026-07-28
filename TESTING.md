# Testing & QA Guide - Udhari Khata

This document outlines automated testing strategies, commands, and verification processes for **Udhari Khata**.

---

## 1. Unit & Integration Testing (Vitest)

Unit and integration tests run with Vitest, jsdom, React Testing Library, and MSW.

```bash
# Run all unit and integration tests
npm run test

# Run tests with code coverage report
npm run test:coverage
```

### Test Coverage Areas
- **`src/test/balance.test.ts`**: Money precision rounding (`roundMoney`), credit addition, payment subtraction, opening balance inclusion, and soft-delete exclusion.
- **`src/test/csv.test.ts`**: Formula injection defenses (`=`, `+`, `-`, `@`, `\t`, `\r` escaping).
- **`src/test/customer.test.ts`**: Customer creation, space-tolerant multi-field search (Name, Mobile, Alternate Name).
- **`src/test/transaction.test.ts`**: Credit & Payment creation, soft-delete flag assignment.
- **`src/test/sync.test.ts`**: Offline queue insertion, backoff retry logic.
- **`src/test/env.test.ts`**: Zod schema validation of environment variables.
- **`src/test/app.test.tsx`**: Route protection, login redirect, and dashboard layout rendering.

---

## 2. End-to-End Testing (Playwright)

Playwright tests verify user interaction across mobile viewports (Android & iPhone).

```bash
# Execute end-to-end browser tests
npm run test:e2e
```

### Configured Viewports
- **Mobile Chrome** (`Pixel 5` emulation)
- **Mobile Safari** (`iPhone 12` emulation)
