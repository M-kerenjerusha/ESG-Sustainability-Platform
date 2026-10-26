# ESG Sustainability Platform - Bug Fix & Remediation Log

This document records the confirmed issues discovered during the platform audit, their root causes, the changes implemented, and the tests used to verify their resolution.

---

### Bug 1: Privilege Escalation via Public Registration Form
- **Severity**: **Critical** (Security)
- **Root Cause**: `authController.js` accepted `role` directly from `req.body` during public self-registration (`POST /api/auth/register`), and `Register.jsx` displayed a role selector containing `"Admin"`. Any unauthorized visitor could register an account with full administrative privileges.
- **Files Changed**:
  - `backend/controllers/authController.js`
  - `frontend/src/pages/Register.jsx`
- **Fix Implemented**:
  - In `authController.js`, hardcoded `role: "employee"` for all public self-registrations. Privileged roles can now only be assigned by authenticated administrators via the protected `/api/users` endpoint.
  - In `Register.jsx`, removed the role dropdown and added clear employee-access guidance.
- **Verification Test**: Automated Test Suite 2, Test 7 (`Public registration is locked to employee`).
- **Final Result**: **VERIFIED FIXED** (Status 201 returns user with `role: "employee"` despite payload requesting `admin`).

---

### Bug 2: Administrative Account Self-Lockout (Self-Deletion & Self-Deactivation)
- **Severity**: **High** (Operational Security)
- **Root Cause**: `userController.js` lacked checks comparing `req.user._id` to `req.params.id`. An administrator could delete their own account or toggle `isActive: false`, permanently locking themselves out of the system.
- **Files Changed**:
  - `backend/controllers/userController.js`
- **Fix Implemented**:
  - In `deleteUser`, added a guard: if `req.user._id.toString() === req.params.id`, return HTTP 400 (`"You cannot delete your own account."`).
  - In `updateUser`, prevented self-deactivation (`isActive: false`) and self-demotion (`role !== 'admin'`).
- **Verification Test**: Automated Test Suite 2, Tests 8 & 9.
- **Final Result**: **VERIFIED FIXED** (HTTP 400 returned, account preserved).

---

### Bug 3: Referential Integrity & Orphaned Database Records on Deletion
- **Severity**: **High** (Data Integrity)
- **Root Cause**: `deleteDepartment` and `deleteFacility` in `orgController.js` immediately deleted documents without inspecting referencing collections (`User`, `EnergyRecord`, `EmissionRecord`, `WasteRecord`, `Target`, `EsgMetric`), creating broken foreign keys across MongoDB collections.
- **Files Changed**:
  - `backend/controllers/orgController.js`
- **Fix Implemented**:
  - Added pre-deletion count queries. If any active records or users reference the target facility or department, the API rejects the deletion with HTTP 400 and returns a detailed explanation listing the exact referencing record counts.
- **Verification Test**: Automated Test Suite 6, Test 9 & manual boundary test.
- **Final Result**: **VERIFIED FIXED** (Active departments and facilities cannot be deleted while referenced).

---

### Bug 4: ESG Score Negative Values and Missing Pillar Weight Penalization
- **Severity**: **Medium** (Calculation Accuracy)
- **Root Cause**:
  1. In `scoreCalculator.js`, negative raw values could produce negative ratios, violating the 0–100 scale requirement.
  2. If an organization had not yet entered metrics for one pillar (e.g. Governance), the overall score formula used hardcoded $30\%$ weight for that pillar, penalizing the overall score down to $70\%$ max.
- **Files Changed**:
  - `backend/utils/scoreCalculator.js`
- **Fix Implemented**:
  - Enforced `Math.max(0, ...)` input sanitization on metric values and clamped metric scores to $[0, 100]$.
  - Implemented dynamic proportional weight normalization among populated pillars when one or more categories have zero metrics.
- **Verification Test**: Automated Test Suite 3, Tests 1–4.
- **Final Result**: **VERIFIED FIXED** (Boundary inputs yield valid $[0, 100]$ scores without artificial penalties).

---

### Bug 5: Inverted Alert Trigger for Lower-is-Better Metrics in Notification Scanner
- **Severity**: **Medium** (Business Logic)
- **Root Cause**: In `notificationController.js`, `generateNotifications` checked `m.value < m.target * 0.8` across all metrics. For lower-is-better metrics (violations, incidents, emissions), this failed to flag values exceeding target (e.g. 2 violations when target is 0) and falsely flagged good performance as an adverse event.
- **Files Changed**:
  - `backend/controllers/notificationController.js`
- **Fix Implemented**:
  - Imported `isLowerBetter` utility and split evaluation:
    - Lower-is-better: triggers notification when `value > target * 1.1` or `target === 0 && value > 0`.
    - Higher-is-better: triggers notification when `value < target * 0.8`.
- **Verification Test**: Automated Test Suite 8, Test 1.
- **Final Result**: **VERIFIED FIXED** (Adverse events correctly identified according to metric direction).

---

### Bug 6: Zero Baseline Transition Omission in Recommendation Engine
- **Severity**: **Low** (Diagnostic Accuracy)
- **Root Cause**: `recommendationEngine.js` only checked `if (previousEmissions > 0)` and `if (previousEnergy > 0)`. When previous period was zero and current period recorded activity, no risk was evaluated.
- **Files Changed**:
  - `backend/utils/recommendationEngine.js`
  - `backend/controllers/dashboardController.js`
- **Fix Implemented**:
  - Added `else if (previousEmissions === 0 && currentEmissions > 0)` branches to flag new baseline transitions.
  - Added facility and department query filtering to `getRisks` in `dashboardController.js`.
- **Verification Test**: Automated Test Suite 5, Tests 1 & 2.
- **Final Result**: **VERIFIED FIXED** (Zero-baseline surges detected).

---

### Bug 7: Waste Quantities Mutual Exclusivity and Validation
- **Severity**: **Medium** (Data Integrity)
- **Root Cause**: `WasteRecord` did not prevent `recycledQuantity + reusedQuantity + disposedQuantity` from exceeding `quantity`.
- **Files Changed**:
  - `backend/models/WasteRecord.js`
  - `backend/middleware/error.js`
- **Fix Implemented**:
  - Added schema path validation ensuring `recycledQuantity + reusedQuantity + disposedQuantity <= quantity`.
  - Added automatic calculation of remainder `disposedQuantity` when not explicitly specified.
  - Configured error middleware to return HTTP 400 on constraint violations.
- **Verification Test**: Automated Test Suite 6, Test 6.
- **Final Result**: **VERIFIED FIXED** (Invalid sums rejected with HTTP 400).

---

### Bug 8: Renewable Energy Cap Validation in EnergyRecord
- **Severity**: **Medium** (Data Integrity)
- **Root Cause**: `EnergyRecord` allowed `renewableEnergy` to exceed total `electricityConsumption`, resulting in illogical $>100\%$ percentages and negative slices in pie charts.
- **Files Changed**:
  - `backend/models/EnergyRecord.js`
  - `backend/controllers/dashboardController.js`
- **Fix Implemented**:
  - Added Mongoose path validator on `renewableEnergy` rejecting values greater than `electricityConsumption`.
  - Guarded `renewablePercentage` virtual getter against division by zero.
  - Clamped non-renewable slice in `dashboardController.js` to `Math.max(0, ...)`.
- **Verification Test**: Automated Test Suite 6, Test 4.
- **Final Result**: **VERIFIED FIXED** (Invalid records rejected with HTTP 400).

---

### Bug 9: Report Snapshot Date Inversion & Defensive PDF Streaming
- **Severity**: **Medium** (Report Generation)
- **Root Cause**: `createReport` did not validate whether `periodStart <= periodEnd`. In addition, `downloadReportPdf` accessed nested snapshot properties directly without optional chaining, risking unhandled server crashes on incomplete snapshots.
- **Files Changed**:
  - `backend/controllers/reportController.js`
  - `frontend/src/pages/Reports.jsx`
- **Fix Implemented**:
  - Added date validity and `start <= end` checks returning HTTP 400 on invalid input.
  - Wrapped PDFKit text rendering in optional chaining and safe defaults.
  - Added report deletion capability with confirmation modal in `Reports.jsx` to complete CRUD.
- **Verification Test**: Automated Test Suite 7, Tests 1–3.
- **Final Result**: **VERIFIED FIXED** (Inverted dates rejected, PDF streams cleanly, deletion functional).

---

### Bug 10: Frontend Auth Profile Context Desynchronization
- **Severity**: **Low** (User Experience)
- **Root Cause**: When a user updated their name in `Profile.jsx`, the server persisted the change, but `AuthContext.jsx` had no mechanism to update its cached state, causing the topbar to display stale name information.
- **Files Changed**:
  - `frontend/src/context/AuthContext.jsx`
  - `frontend/src/pages/Profile.jsx`
- **Fix Implemented**:
  - Added `updateUser` method to `AuthContext.jsx`.
  - Called `updateUser({ name })` inside `Profile.jsx` upon successful API response.
- **Verification Test**: Profile update verified through context state check.
- **Final Result**: **VERIFIED FIXED** (Topbar updates immediately).
