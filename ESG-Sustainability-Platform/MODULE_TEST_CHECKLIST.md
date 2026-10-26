# ESG Sustainability Platform - Module Test Checklist

This document details test cases executed across all platform modules, including positive, negative, authorization, and boundary test scenarios.

---

## 1. Authentication & Session Module

| Feature Name | Test Case | Expected Result | Actual Result | Status | Test Reference / Evidence | Fix Applied |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **User Login (Admin)** | Valid credentials for `admin@esg.com` | HTTP 200, JWT returned, role="admin" | Received 200, valid token | **PASS** | Automated Suite 2, Test 1 | None required |
| **User Login (Manager)** | Valid credentials for `manager@esg.com` | HTTP 200, JWT returned, role="esg_manager" | Received 200, valid token | **PASS** | Automated Suite 2, Test 2 | None required |
| **User Login (Employee)** | Valid credentials for `employee@esg.com` | HTTP 200, JWT returned, role="employee" | Received 200, valid token | **PASS** | Automated Suite 2, Test 3 | None required |
| **Login Validation** | Incorrect password supplied | HTTP 401 Unauthorized | Received 401, error message | **PASS** | Automated Suite 2, Test 4 | None required |
| **Protected Route** | Access `/api/auth/me` without Bearer token | HTTP 401 Unauthorized | Received 401 | **PASS** | Automated Suite 2, Test 5 | None required |
| **Token Verification** | Malformed / expired token supplied | HTTP 401 Unauthorized | Received 401 | **PASS** | Automated Suite 2, Test 6 | None required |
| **Public Registration** | Attempt to register with `role: "admin"` | Role forced to `"employee"` | User created with role="employee" | **PASS** | Automated Suite 2, Test 7 | Enforced `role: "employee"` in `authController.js` and removed dropdown from `Register.jsx` |
| **Profile Update** | Update user name via `PUT /api/auth/me` | HTTP 200, name updated in DB & context | Received 200, updated name | **PASS** | Verified via API & context sync | Added `updateUser` to `AuthContext.jsx` |

---

## 2. Authorization & RBAC Module

| Feature Name | Test Case | Expected Result | Actual Result | Status | Test Reference / Evidence | Fix Applied |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **Admin Self-Lockout** | Admin attempts to delete own account | HTTP 400 Bad Request, deletion rejected | Received 400 with lockout warning | **PASS** | Automated Suite 2, Test 8 | Added self-account check in `userController.js` |
| **Admin Self-Deactivation**| Admin sets `isActive: false` on own account | HTTP 400 Bad Request, deactivation rejected | Received 400 with deactivation warning | **PASS** | Automated Suite 2, Test 9 | Added self-deactivation guard in `userController.js` |
| **Employee Boundary** | Employee accesses `/api/users` | HTTP 403 Forbidden | Received 403 | **PASS** | Automated Suite 2, Test 10 | RBAC verified |
| **Employee Boundary** | Employee posts to `/api/energy` | HTTP 403 Forbidden | Received 403 | **PASS** | Automated Suite 2, Test 11 | RBAC verified |
| **Employee Boundary** | Employee posts to `/api/reports` | HTTP 403 Forbidden | Received 403 | **PASS** | Automated Suite 2, Test 12 | RBAC verified |
| **Manager Boundary** | Manager accesses `/api/users` | HTTP 403 Forbidden | Received 403 | **PASS** | Automated Suite 2, Test 13 | RBAC verified |

---

## 3. ESG Scoring & Calculation Engine

| Feature Name | Test Case | Expected Result | Actual Result | Status | Test Reference / Evidence | Fix Applied |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **Higher-is-Better Metric** | Value 30, Target 60 | Score = 50.0 | Score = 50.0 | **PASS** | Automated Suite 3, Test 1 | None required |
| **Metric Cap Bonus** | Value 90, Target 60 (150% achievement) | Score capped at 100.0 | Score = 100.0 | **PASS** | Automated Suite 3, Test 1 | None required |
| **Lower-is-Better Metric** | Value 0, Target 0 (zero incidents) | Score = 100.0 | Score = 100.0 | **PASS** | Automated Suite 3, Test 2 | Clamped in `scoreCalculator.js` |
| **Lower-is-Better Metric** | Value 10, Target 5 (violations exceeded) | Score = 50.0 | Score = 50.0 | **PASS** | Automated Suite 3, Test 2 | Handled in `scoreCalculator.js` |
| **Multi-Pillar Weighting** | Env 100, Social 80, Gov 100 | Overall = 94.0 ($40 + 24 + 30$) | Overall = 94.0 | **PASS** | Automated Suite 3, Test 3 | Verified formula |
| **Empty Metrics List** | Calculate score with `[]` | Overall = 0, no NaN or division errors | Overall = 0 | **PASS** | Automated Suite 3, Test 4 | Defensive array checks in `scoreCalculator.js` |
| **Missing Pillar Normalization** | Metrics present only in Environmental | Dynamically normalized weight (100) | Overall = 100.0 | **PASS** | Automated Suite 3, Test 4 | Added dynamic pillar normalization |

---

## 4. Emission Factors & Carbon Accounting

| Feature Name | Test Case | Expected Result | Actual Result | Status | Test Reference / Evidence | Fix Applied |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **Standard Factor Grid** | Check standard reference factors | Electricity: 0.82, Diesel: 2.68, etc. | Exact match | **PASS** | Automated Suite 4, Test 1 | Verified `emissionFactors.js` |
| **CO2e Calculation** | 100 litres of Diesel logged | $\text{CO}_2\text{e} = 100 \times 2.68 = 268\text{ kg}$ | $\text{CO}_2\text{e} = 268$ | **PASS** | Automated Suite 6, Test 5 | Schema pre-save calculation verified |
| **CO2e Recalculation** | Quantity updated to 200 litres | $\text{CO}_2\text{e} = 200 \times 2.68 = 536\text{ kg}$ | $\text{CO}_2\text{e} = 536$ | **PASS** | Automated Suite 6, Test 5 | Pre-save hook trigger on update |
| **Source Factor Switch** | Source updated without passing factor | Automatically applies new source factor | Standard factor applied | **PASS** | Verified in `emissionController.js` | Auto-resolution added in `updateEmissionRecord` |

---

## 5. Energy Management Module

| Feature Name | Test Case | Expected Result | Actual Result | Status | Test Reference / Evidence | Fix Applied |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **Renewable Cap Check** | Renewable energy (800) > Electricity (500) | HTTP 400 Bad Request, record rejected | Received 400 with validation error | **PASS** | Automated Suite 6, Test 4 | Added path validator to `EnergyRecord.js` and mapped in `error.js` |
| **Valid Energy Record** | Electricity 1000, Renewable 400 | HTTP 201 Created, renewable% = 40% | Received 201, virtual=40% | **PASS** | Automated Suite 6, Test 4 | None required |
| **Zero Electricity Division**| Electricity = 0, Renewable = 0 | `renewablePercentage` returns 0 without NaN | Returns 0 | **PASS** | Verified in `EnergyRecord.js` | Updated virtual getter |
| **Energy Update & Delete** | Modify reading, then delete | HTTP 200 for update and deletion | Received 200 for both | **PASS** | Automated Suite 6, Test 4 | Full CRUD verified |

---

## 6. Waste Management Module

| Feature Name | Test Case | Expected Result | Actual Result | Status | Test Reference / Evidence | Fix Applied |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **Waste Sum Constraint** | Recycled (80) + Reused (40) > Total (100) | HTTP 400 Bad Request, record rejected | Received 400 with validation error | **PASS** | Automated Suite 6, Test 6 | Added path validator to `WasteRecord.js` and mapped in `error.js` |
| **Valid Waste Record** | Total 100, Recycled 60, Reused 10 | HTTP 201 Created, disposed auto-set to 30 | Received 201, disposed=30 | **PASS** | Automated Suite 6, Test 6 | Pre-save remainder calculation |
| **Waste Record Deletion**| Delete created test record | HTTP 200 OK | Received 200 | **PASS** | Automated Suite 6, Test 6 | Full CRUD verified |

---

## 7. Sustainability Targets Module

| Feature Name | Test Case | Expected Result | Actual Result | Status | Test Reference / Evidence | Fix Applied |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **Increase Target (On Track)** | Current 30, Target 60, Future date | Progress = 50%, Status = "On Track" | Progress = 50%, Status = "On Track" | **PASS** | Automated Suite 6, Test 8 | Verified dynamic computation |
| **Target Achievement** | Update Current to 60 (equals Target) | Progress = 100%, Status = "Achieved" | Progress = 100%, Status = "Achieved" | **PASS** | Automated Suite 6, Test 8 | Verified dynamic computation |
| **Decrease Target** | Target 60, Current 50 (below target) | Progress = 100%, Status = "Achieved" | Progress = 100%, Status = "Achieved" | **PASS** | Model unit test | Verified decrease calculation |
| **Overdue Target** | Deadline in past, Progress < 100% | Status = "Overdue" | Status = "Overdue" | **PASS** | Model unit test | Verified date comparison |

---

## 8. Risk & Recommendation Engine

| Feature Name | Test Case | Expected Result | Actual Result | Status | Test Reference / Evidence | Fix Applied |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **Emission Spike Warning** | 15% increase in emissions | Warning risk generated with mitigation steps | Warning generated | **PASS** | Automated Suite 5, Test 1 | Verified threshold > 10% |
| **Emission Spike Critical** | 40% increase in emissions | Critical risk generated | Critical generated | **PASS** | Automated Suite 5, Test 1 | Verified threshold > 25% |
| **Recycling Deficit Warning**| Recycling rate at 40% | Warning risk generated | Warning generated | **PASS** | Automated Suite 5, Test 2 | Verified threshold < 50% |
| **Recycling Deficit Critical**| Recycling rate at 20% | Critical risk generated | Critical generated | **PASS** | Automated Suite 5, Test 2 | Verified threshold < 30% |
| **Zero-Baseline Transition** | Previous emissions 0, current > 0 | Warning risk generated | Warning generated | **PASS** | Engine unit test | Added zero-baseline branch |
| **Facility/Dept Filtering** | Query `GET /api/dashboard/risks?facility=...` | Filters records to selected facility | Filter applied | **PASS** | Controller test | Connected query params in `dashboardController.js` |

---

## 9. Reports & PDFKit Generation Module

| Feature Name | Test Case | Expected Result | Actual Result | Status | Test Reference / Evidence | Fix Applied |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **Inverted Date Range** | `periodStart` later than `periodEnd` | HTTP 400 Bad Request | Received 400 | **PASS** | Automated Suite 7, Test 1 | Added date validation in `createReport` |
| **Report Snapshot Create** | Valid monthly range (May to Oct 2026) | HTTP 201, snapshot frozen in MongoDB | Received 201, snapshot generated | **PASS** | Automated Suite 7, Test 1 | Verified persistence |
| **PDF Download Stream** | `GET /api/reports/:id/pdf` | HTTP 200, Content-Type: `application/pdf`, `%PDF` magic header | Received 200, valid PDF binary | **PASS** | Automated Suite 7, Test 2 | PDFKit stream verified |
| **Missing Snapshot Data** | Snapshot with null/undefined fields | Renders PDF without server crash | Safe defaults used | **PASS** | Code verification | Added defensive optional chaining |
| **Report Deletion** | Delete report snapshot via API / UI | HTTP 200 OK | Received 200 | **PASS** | Automated Suite 7, Test 3 | Added Delete button & modal in `Reports.jsx` |

---

## 10. Notifications Module

| Feature Name | Test Case | Expected Result | Actual Result | Status | Test Reference / Evidence | Fix Applied |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **Automated Alert Scan** | Trigger `POST /api/notifications/generate` | Overdue targets and KPI variances flagged | Received 200, alerts populated | **PASS** | Automated Suite 8, Test 1 | None required |
| **Lower-is-Better Evaluation**| High incidents/violations metric | Generates notification when exceeding target | Notification generated | **PASS** | Code test | Corrected evaluation direction using `isLowerBetter` |
| **Mark as Read** | `PUT /api/notifications/:id/read` | HTTP 200, `isRead` set to `true` | Received 200, `isRead: true` | **PASS** | Automated Suite 8, Test 1 | Verified persistence |

---

## 11. Facilities & Departments Module

| Feature Name | Test Case | Expected Result | Actual Result | Status | Test Reference / Evidence | Fix Applied |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **Facility CRUD** | Create, Read, Update, Delete test facility | HTTP 201, 200, 200, 200 | All operations succeeded | **PASS** | Automated Suite 6, Test 1 | Verified |
| **Department CRUD** | Create, Read, Update, Delete test department | HTTP 201, 200, 200, 200 | All operations succeeded | **PASS** | Automated Suite 6, Test 2 | Verified |
| **Referential Integrity** | Attempt deleting department referenced by users | HTTP 400 Bad Request, deletion blocked | Received 400 with detail message | **PASS** | Controller verification | Added reference count check in `deleteDepartment` |
| **Referential Integrity** | Attempt deleting facility referenced by records | HTTP 400 Bad Request, deletion blocked | Received 400 with detail message | **PASS** | Controller verification | Added reference count check in `deleteFacility` |
