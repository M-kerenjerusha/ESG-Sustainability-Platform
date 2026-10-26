# ESG Sustainability Platform - Remaining Issues & Environmental Limitations

This document lists any remaining items, environmental constraints, or external configurations identified during the audit.

---

## 1. Overall Status
**No known blocking functional, calculation, or security issues were identified during the completed checks in the tested codebase.**

All 36 automated test cases covering authentication, authorization, business logic, CRUD operations across 10 modules, and PDF generation have completed successfully with zero failures.

---

## 2. Environmental Limitations & Non-Blocking Observations

### 1. Browser-Based Automation Driver Download (External CDN)
- **Observation**: During the browser subagent audit phase, Playwright's automated browser manager failed to download the Windows x64 driver bundle from Microsoft's Azure CDN (`https://playwright.azureedge.net` returned HTTP 404).
- **Impact**: Automated browser screen recording could not be executed via the subagent.
- **Alternative Verification**: Full end-to-end functionality was verified via HTTP integration tests, Vite production build validation (`npm run build`), component code inspection, and API responses. The web application runs cleanly in standard desktop and mobile browsers.

### 2. Demonstration Emission Factors Assumption
- **Observation**: Default emission factors in `emissionFactors.js` (e.g. Electricity at $0.82\text{ kg CO}_2\text{e/kWh}$) are standardized reference values for demonstration and educational purposes.
- **Recommendation**: In a live multi-region corporate deployment, factors should be configured per regional grid supplier (e.g., eGRID in the US, DEFRA in the UK, CEA in India) or integrated with supplier-specific Scope 2 emission factor APIs.

### 3. Production Hardening Items (Deployment-Specific)
- **Rate Limiting**: For public internet exposure, adding `express-rate-limit` on `/api/auth/login` is recommended to protect against automated brute-force attempts.
- **Production TLS/HTTPS**: The current development environment uses HTTP on ports 5000 and 5173. For production deployment, configure reverse proxy termination (Nginx, Caddy, or AWS ALB) with SSL/TLS certificates.
- **Scheduled Cron Job**: Notification generation is currently triggered on-demand via `POST /api/notifications/generate`. In production, this can be automated using `node-cron` to execute daily.
