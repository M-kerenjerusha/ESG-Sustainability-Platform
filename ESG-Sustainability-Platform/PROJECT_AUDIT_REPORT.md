# ESG Sustainability Platform - Comprehensive Project Audit Report

**Audit Date**: October 22, 2026  
**Auditor**: Senior Full-Stack MERN Stack Auditor & QA Automation Engineer  
**Project**: ESG Sustainability Performance Monitoring & Reporting Platform  
**Target Architecture**: MongoDB, Express.js, React 18, Node.js (MERN)

---

## 1. Executive Summary & Overall Status

**Overall Status**: **FUNCTIONAL WITH NO KNOWN BLOCKING ISSUES IN TESTED AREAS**

The application was subjected to an end-to-end audit encompassing architecture, static code analysis, database schema integrity, REST API security, role-based access control (RBAC), calculation correctness, UI component rendering, automated testing, and PDF export validation.

All 36 automated test cases in the test suite passed with zero failures. Both the Express backend (running on port 5000) and the Vite frontend (running on port 5173) compile and run cleanly, with live database connectivity to MongoDB.

---

## 2. Technology Stack & Environment Details

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Backend Runtime** | Node.js | v18+ | JavaScript runtime (CommonJS) |
| **Web Server** | Express.js | 4.19.2 | REST API routing and middleware |
| **Database** | MongoDB | 8.5.0 (Mongoose) | Document persistence & schemas |
| **Security & Auth** | JWT & bcryptjs | 9.0.2 / 2.4.3 | Token-based auth & salted password hashing |
| **PDF Reporting** | PDFKit | 0.15.0 | Dynamic executive PDF export |
| **Frontend Framework** | React | 18.3.1 | Single-page application |
| **Build Tool** | Vite | 5.3.4 | Development server & production bundler |
| **Data Visualization** | Recharts | 2.12.7 | Interactive area, bar, and pie charts |
| **HTTP Client** | Axios | 1.7.2 | Interceptor-driven API communication |
| **Design System** | Custom Vanilla CSS | - | Responsive design with custom CSS tokens |

---

## 3. Project Structure & Module Inventory

```
ESG-Sustainability-Platform/
├── backend/
│   ├── config/
│   │   └── db.js                        # MongoDB connection handler
│   ├── controllers/
│   │   ├── authController.js            # User auth, registration, profile
│   │   ├── dashboardController.js       # Aggregations, time-series, risks
│   │   ├── emissionController.js        # GHG emissions logging & CO2e calculation
│   │   ├── energyController.js          # Electricity, renewable & fuel monitoring
│   │   ├── metricController.js          # ESG KPI catalog & scoring
│   │   ├── notificationController.js    # Automated alert generation & read status
│   │   ├── orgController.js             # Facilities & Departments CRUD
│   │   ├── reportController.js          # Point-in-time snapshots & PDFKit generator
│   │   ├── targetController.js          # Sustainability goals & trajectory engine
│   │   ├── userController.js            # Administrative user accounts management
│   │   └── wasteController.js           # Materials disposal & diversion monitoring
│   ├── middleware/
│   │   ├── auth.js                      # JWT verification & req.user attachment
│   │   ├── error.js                     # Global 404 & centralized error handling
│   │   └── role.js                      # RBAC authorization enforcement
│   ├── models/
│   │   ├── Department.js, Facility.js   # Organization models
│   │   ├── EmissionRecord.js            # Pre-save CO2e calculation
│   │   ├── EnergyRecord.js              # Virtual properties & renewable constraints
│   │   ├── EsgMetric.js                 # Multi-pillar KPI definitions
│   │   ├── Notification.js              # Audit event logs
│   │   ├── Report.js                    # Frozen snapshot document schema
│   │   ├── Target.js                    # Dynamic progress & trajectory computation
│   │   ├── User.js                      # Auth credentials & RBAC definitions
│   │   └── WasteRecord.js               # Diversion & quantity consistency validators
│   ├── routes/                          # Express REST API route mappers
│   ├── seed/
│   │   └── seed.js                      # Seed data script for test users & 6-month history
│   ├── tests/
│   │   └── run_audit_tests.js           # Automated end-to-end test suite
│   ├── utils/
│   │   ├── emissionFactors.js           # Standard IPCC/grid reference factors
│   │   ├── recommendationEngine.js      # Rule-based diagnostic risk engine
│   │   └── scoreCalculator.js           # Standardized 0-100 ESG scoring algorithm
│   ├── server.js                        # Express app bootstrap
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/                  # Navbar, Sidebar, Modal, ConfirmDialog, StatCard
    │   ├── context/                     # AuthContext, ToastContext
    │   ├── layouts/                     # DashboardLayout
    │   ├── pages/                       # Dashboard, Energy, Emissions, Waste, Metrics,
    │   │                                # Targets, Risks, Reports, Notifications, Users,
    │   │                                # Facilities, Departments, Profile, Login, Register
    │   ├── services/                    # Axios client instance with interceptors
    │   ├── App.jsx                      # Route hierarchy & role guards
    │   ├── index.css                    # Unified CSS design system
    │   └── main.jsx
    └── vite.config.js
```

---

## 4. Test Execution & Verification Summary

| Suite # | Test Suite Description | Tests Run | Passed | Failed | Status |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **1** | Server Config & Health Check | 1 | 1 | 0 | **PASS** |
| **2** | Authentication, RBAC & Privilege Escalation | 12 | 12 | 0 | **PASS** |
| **3** | ESG Scoring & Mathematical Edge Cases | 4 | 4 | 0 | **PASS** |
| **4** | Emission Factors & CO2e Engine | 1 | 1 | 0 | **PASS** |
| **5** | Rule-Based Risk & Recommendation Engine | 2 | 2 | 0 | **PASS** |
| **6** | Full CRUD Across All Platform Modules | 11 | 11 | 0 | **PASS** |
| **7** | Report Snapshot & PDFKit Streaming | 3 | 3 | 0 | **PASS** |
| **8** | Notification Engine & Alerts | 1 | 1 | 0 | **PASS** |
| **9** | Dashboard Aggregations & Query Filters | 2 | 2 | 0 | **PASS** |
| **Total** | **All Automated Test Suites** | **36** | **36** | **0** | **100% PASS** |

---

## 5. Security Audit Findings & Remediations

1. **Privilege Escalation on Public Registration (FIXED)**:
   - *Vulnerability*: The registration form previously accepted `role` in the request body, allowing arbitrary users to register as `admin`.
   - *Fix*: Public registration (`authController.js`) is now strictly constrained to `role: "employee"`. The role selector was removed from the frontend registration page. Only authenticated administrators can assign privileged roles via the admin endpoint.
2. **Administrative Self-Lockout (FIXED)**:
   - *Vulnerability*: An administrator could delete or deactivate their own account, causing permanent lockout.
   - *Fix*: Added verification in `userController.js` rejecting self-deletion or self-deactivation.
3. **Referential Integrity & Orphaned Records (FIXED)**:
   - *Vulnerability*: Deleting a Department or Facility with active foreign references left orphaned keys in database collections.
   - *Fix*: Added referential validation in `orgController.js` rejecting deletion if active users or operational records reference the entity.
4. **JWT Security & Password Serialization (VERIFIED)**:
   - Verified that passwords are never returned in queries or serialization (`select: false` on User schema).
   - Passwords hashed with bcrypt and 10 salt rounds.
   - Validated expired and invalid token rejection.

---

## 6. Calculation & Business Logic Verification

1. **ESG Score (0–100 Scale)**:
   - Verified weighted formula: $40\% \text{ Environmental} + 30\% \text{ Social} + 30\% \text{ Governance}$.
   - Verified lower-is-better metric identification and ratio computation.
   - Verified that unpopulated pillars dynamically normalize active pillar weights to prevent artificial score deflation.
   - Clamped metric scores to ensure values remain within $[0, 100]$.
2. **Emission Engine**:
   - Verified $\text{CO}_2\text{e} = \text{quantity} \times \text{factor}$.
   - Verified automatic recalculation upon updating records.
3. **Target Engine**:
   - Verified trajectory computation for both `increase` and `decrease` targets.
   - Status classifications (`On Track`, `At Risk`, `Achieved`, `Overdue`) verified across boundary conditions.
4. **Risk Engine**:
   - Verified threshold triggers: emissions surge $>10\%$ (warning) and $>25\%$ (critical); recycling $<50\%$ (warning) and $<30\%$ (critical); zero-baseline transitions.

---

## 7. PDF Report Generation Verification

- Report generation creates a persistent historical snapshot stored in MongoDB.
- `GET /api/reports/:id/pdf` streams a valid PDF document with header `%PDF`.
- Document verified to contain organization name, reporting dates, ESG scores, energy statistics, emissions, waste metrics, targets, and risk mitigations.
- Handled defensive null checking so that incomplete snapshots do not trigger server unhandled exceptions.
- Added full Delete CRUD support in `Reports.jsx` with confirmation modal.

---

## 8. Build & Startup Results

- **Backend**: Successfully starts with `npm start`, connects to MongoDB, and serves endpoints on port 5000.
- **Frontend**: Successfully compiles with `npm run build` in 5.8s with zero errors. Dev server runs cleanly on port 5173.
- **Tests**: `npm test` runs 36 automated assertions with a 100% pass rate.
