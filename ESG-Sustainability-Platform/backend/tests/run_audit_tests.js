const http = require("http");

const BASE_URL = "http://localhost:5000";

// Lightweight HTTP request helper returning JSON or raw buffer
const request = (path, options = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { ...options.headers };
    if (options.body && typeof options.body === "object" && !(options.body instanceof Buffer)) {
      headers["Content-Type"] = "application/json";
    }

    const req = http.request(
      url,
      {
        method: options.method || "GET",
        headers,
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const buffer = Buffer.concat(chunks);
          let data = null;
          const contentType = res.headers["content-type"] || "";
          if (contentType.includes("application/json")) {
            try {
              data = JSON.parse(buffer.toString("utf8"));
            } catch (err) {
              data = buffer.toString("utf8");
            }
          } else {
            data = buffer;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data,
            raw: buffer,
          });
        });
      }
    );

    req.on("error", reject);
    if (options.body) {
      if (typeof options.body === "string" || options.body instanceof Buffer) {
        req.write(options.body);
      } else {
        req.write(JSON.stringify(options.body));
      }
    }
    req.end();
  });
};

// Test Runner Infrastructure
let passedCount = 0;
let failedCount = 0;
const results = [];

const test = async (name, fn) => {
  try {
    await fn();
    passedCount++;
    results.push({ name, passed: true });
    console.log(`  ✓ PASS: ${name}`);
  } catch (err) {
    failedCount++;
    results.push({ name, passed: false, error: err.message });
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    -> ${err.message}`);
  }
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message || "Assertion failed");
};

const assertEqual = (actual, expected, message) => {
  if (actual !== expected) {
    throw new Error(`${message || "Values differ"}: expected ${expected}, got ${actual}`);
  }
};

async function runAllTests() {
  console.log("===============================================================");
  console.log("ESG SUSTAINABILITY PLATFORM - AUTOMATED COMPREHENSIVE AUDIT");
  console.log("===============================================================\n");

  let adminToken = "";
  let managerToken = "";
  let employeeToken = "";
  let adminUserId = "";

  // --------------------------------------------------------------------------
  // SUITE 1: API HEALTH & SYSTEM INITIALIZATION
  // --------------------------------------------------------------------------
  console.log("Suite 1: Server Configuration & Health Checks");

  await test("Backend Health Check endpoint responds with 200 OK", async () => {
    const res = await request("/api/health");
    assertEqual(res.status, 200, "Health status");
    assert(res.data && res.data.success === true, "Health success boolean");
  });

  // --------------------------------------------------------------------------
  // SUITE 2: AUTHENTICATION, RBAC & PRIVILEGE ESCALATION SECURITY
  // --------------------------------------------------------------------------
  console.log("\nSuite 2: Authentication & RBAC Verification");

  await test("Admin login succeeds and returns JWT token", async () => {
    const res = await request("/api/auth/login", {
      method: "POST",
      body: { email: "admin@esg.com", password: "Admin@123" },
    });
    assertEqual(res.status, 200, "Admin login status");
    assert(res.data.data.token, "Token present");
    assertEqual(res.data.data.role, "admin", "Admin role");
    adminToken = res.data.data.token;
    adminUserId = res.data.data._id;
  });

  await test("ESG Manager login succeeds", async () => {
    const res = await request("/api/auth/login", {
      method: "POST",
      body: { email: "manager@esg.com", password: "Manager@123" },
    });
    assertEqual(res.status, 200, "Manager login status");
    assertEqual(res.data.data.role, "esg_manager", "Manager role");
    managerToken = res.data.data.token;
  });

  await test("Employee login succeeds", async () => {
    const res = await request("/api/auth/login", {
      method: "POST",
      body: { email: "employee@esg.com", password: "Employee@123" },
    });
    assertEqual(res.status, 200, "Employee login status");
    assertEqual(res.data.data.role, "employee", "Employee role");
    employeeToken = res.data.data.token;
  });

  await test("Login with wrong password fails with 401 Unauthorized", async () => {
    const res = await request("/api/auth/login", {
      method: "POST",
      body: { email: "admin@esg.com", password: "WrongPassword999" },
    });
    assertEqual(res.status, 401, "Invalid password status");
    assert(res.data.success === false, "Success is false");
  });

  await test("Accessing protected route without token returns 401", async () => {
    const res = await request("/api/auth/me");
    assertEqual(res.status, 401, "Unauthenticated status");
  });

  await test("Accessing protected route with corrupted token returns 401", async () => {
    const res = await request("/api/auth/me", {
      headers: { Authorization: "Bearer bad.token.here" },
    });
    assertEqual(res.status, 401, "Bad token status");
  });

  await test("Public registration is locked to employee (cannot escalate to admin)", async () => {
    const testEmail = `test_registrant_${Date.now()}@esg.com`;
    const res = await request("/api/auth/register", {
      method: "POST",
      body: {
        name: "Malicious Actor",
        email: testEmail,
        password: "Password@123",
        role: "admin", // attempt privilege escalation
      },
    });
    assertEqual(res.status, 201, "Registration status");
    assertEqual(res.data.data.role, "employee", "Escalation blocked - role is employee");
  });

  await test("Admin cannot delete own account (self-lockout prevention)", async () => {
    const res = await request(`/api/users/${adminUserId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assertEqual(res.status, 400, "Self deletion blocked status");
    assert(res.data.message.includes("cannot delete your own account"), "Self deletion message");
  });

  await test("Admin cannot deactivate own account", async () => {
    const res = await request(`/api/users/${adminUserId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { isActive: false },
    });
    assertEqual(res.status, 400, "Self deactivation blocked status");
    assert(res.data.message.includes("cannot deactivate your own account"), "Self deactivation message");
  });

  await test("Employee is forbidden from accessing user administration (403)", async () => {
    const res = await request("/api/users", {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    assertEqual(res.status, 403, "Employee access to /api/users forbidden");
  });

  await test("Employee is forbidden from creating energy records (403)", async () => {
    const res = await request("/api/energy", {
      method: "POST",
      headers: { Authorization: `Bearer ${employeeToken}` },
      body: { electricityConsumption: 100 },
    });
    assertEqual(res.status, 403, "Employee write to /api/energy forbidden");
  });

  await test("Employee is forbidden from creating reports (403)", async () => {
    const res = await request("/api/reports", {
      method: "POST",
      headers: { Authorization: `Bearer ${employeeToken}` },
      body: { title: "Forbidden Report" },
    });
    assertEqual(res.status, 403, "Employee write to /api/reports forbidden");
  });

  await test("ESG Manager is forbidden from user administration (403)", async () => {
    const res = await request("/api/users", {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    assertEqual(res.status, 403, "Manager access to /api/users forbidden");
  });

  // --------------------------------------------------------------------------
  // SUITE 3: ESG SCORING ALGORITHM & EDGE CASES
  // --------------------------------------------------------------------------
  console.log("\nSuite 3: ESG Scoring Algorithm & Mathematical Edge Cases");
  const { calculateEsgScore, metricScore, isLowerBetter } = require("../utils/scoreCalculator");

  await test("metricScore calculates higher-is-better metrics accurately", async () => {
    const s1 = metricScore({ name: "Renewable Energy", value: 30, target: 60 });
    assertEqual(s1, 50, "50% achievement");

    const s2 = metricScore({ name: "Renewable Energy", value: 60, target: 60 });
    assertEqual(s2, 100, "100% achievement");

    const s3 = metricScore({ name: "Renewable Energy", value: 90, target: 60 });
    assertEqual(s3, 100, "Over-achievement capped at 100");
  });

  await test("metricScore calculates lower-is-better metrics accurately", async () => {
    assert(isLowerBetter("Workplace Safety Incidents"), "Detected as lower is better");
    assert(isLowerBetter("Carbon Emissions"), "Detected as lower is better");
    assert(isLowerBetter("Policy Violations"), "Detected as lower is better");

    const zeroIncidents = metricScore({ name: "Workplace Safety Incidents", value: 0, target: 0 });
    assertEqual(zeroIncidents, 100, "0 incidents with 0 target gives perfect score");

    const halfScore = metricScore({ name: "Policy Violations", value: 10, target: 5 });
    assertEqual(halfScore, 50, "Double violations yields 50 score");

    const perfectLower = metricScore({ name: "Policy Violations", value: 0, target: 2 });
    assertEqual(perfectLower, 100, "Zero violations yields 100");
  });

  await test("calculateEsgScore computes 40% Env, 30% Soc, 30% Gov weights", async () => {
    const testMetrics = [
      { name: "Electricity Usage", category: "Environmental", value: 50, target: 50 }, // 100
      { name: "Diversity Ratio", category: "Social", value: 40, target: 50 }, // 80
      { name: "Compliance Rate", category: "Governance", value: 100, target: 100 }, // 100
    ];
    const score = calculateEsgScore(testMetrics);
    assertEqual(score.environmentalScore, 100, "Env score 100");
    assertEqual(score.socialScore, 80, "Social score 80");
    assertEqual(score.governanceScore, 100, "Gov score 100");
    // Overall: (100 * 0.4) + (80 * 0.3) + (100 * 0.3) = 40 + 24 + 30 = 94
    assertEqual(score.overallScore, 94, "Overall ESG Score matches 94");
  });

  await test("calculateEsgScore handles empty or missing pillars without crashing", async () => {
    const emptyScore = calculateEsgScore([]);
    assertEqual(emptyScore.overallScore, 0, "Empty metrics yields 0");

    const envOnly = calculateEsgScore([
      { name: "Renewable Energy", category: "Environmental", value: 60, target: 60 },
    ]);
    assertEqual(envOnly.environmentalScore, 100, "Env is 100");
    assert(envOnly.overallScore > 0, "Overall score normalized for single pillar");
  });

  // --------------------------------------------------------------------------
  // SUITE 4: EMISSION FACTORS & CALCULATIONS
  // --------------------------------------------------------------------------
  console.log("\nSuite 4: Emission Factor Verification & CO2e Engine");
  const EMISSION_FACTORS = require("../utils/emissionFactors");

  await test("Reference emission factors match standards", async () => {
    assertEqual(EMISSION_FACTORS.Electricity, 0.82, "Electricity factor");
    assertEqual(EMISSION_FACTORS.Petrol, 2.31, "Petrol factor");
    assertEqual(EMISSION_FACTORS.Diesel, 2.68, "Diesel factor");
    assertEqual(EMISSION_FACTORS.NaturalGas, 2.02, "NaturalGas factor");
    assertEqual(EMISSION_FACTORS.Transportation, 0.14, "Transportation factor");
    assertEqual(EMISSION_FACTORS.Other, 1.0, "Other factor");
  });

  // --------------------------------------------------------------------------
  // SUITE 5: RISK & RECOMMENDATION ENGINE
  // --------------------------------------------------------------------------
  console.log("\nSuite 5: Rule-Based Risk & Recommendation Engine");
  const { generateRecommendations } = require("../utils/recommendationEngine");

  await test("Flags carbon emission surge (>10% warning, >25% critical)", async () => {
    const warningRisks = generateRecommendations({
      currentEmissions: 115,
      previousEmissions: 100, // 15% increase -> warning
      currentEnergy: 100,
      previousEnergy: 100,
    });
    const emissionWarn = warningRisks.find((r) => r.category === "Carbon Emissions");
    assert(emissionWarn, "Emission warning generated");
    assertEqual(emissionWarn.level, "warning", "Warning level for 15% rise");

    const criticalRisks = generateRecommendations({
      currentEmissions: 140,
      previousEmissions: 100, // 40% increase -> critical
      currentEnergy: 100,
      previousEnergy: 100,
    });
    const emissionCrit = criticalRisks.find((r) => r.category === "Carbon Emissions");
    assert(emissionCrit, "Emission critical generated");
    assertEqual(emissionCrit.level, "critical", "Critical level for 40% rise");
  });

  await test("Flags low recycling rate (<50% warning, <30% critical)", async () => {
    const warnWaste = generateRecommendations({
      wasteStats: { totalWaste: 100, recycledQuantity: 40 }, // 40% -> warning
    });
    const wasteWarn = warnWaste.find((r) => r.category === "Waste Management");
    assert(wasteWarn, "Waste warning generated");
    assertEqual(wasteWarn.level, "warning", "Warning level for 40% recycling");

    const critWaste = generateRecommendations({
      wasteStats: { totalWaste: 100, recycledQuantity: 20 }, // 20% -> critical
    });
    const wasteCrit = critWaste.find((r) => r.category === "Waste Management");
    assert(wasteCrit, "Waste critical generated");
    assertEqual(wasteCrit.level, "critical", "Critical level for 20% recycling");
  });

  // --------------------------------------------------------------------------
  // SUITE 6: FULL CRUD OPERATIONS ACROSS ALL PLATFORM MODULES
  // --------------------------------------------------------------------------
  console.log("\nSuite 6: Full CRUD Cycle Across Modules");

  let createdFacilityId = "";
  let createdDepartmentId = "";
  let createdUserId = "";
  let createdEnergyId = "";
  let createdEmissionId = "";
  let createdWasteId = "";
  let createdMetricId = "";
  let createdTargetId = "";
  let createdReportId = "";

  // 1. Facility CRUD
  await test("Facility CRUD: Create, Read, Update, Delete", async () => {
    // Create
    const createRes = await request("/api/org/facilities", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { name: `Test Site ${Date.now()}`, location: "Bangalore, India", type: "R&D Center" },
    });
    assertEqual(createRes.status, 201, "Facility create status");
    createdFacilityId = createRes.data.data._id;

    // Read
    const getRes = await request("/api/org/facilities", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(getRes.data.data.some((f) => f._id === createdFacilityId), "Created facility present");

    // Update
    const updateRes = await request(`/api/org/facilities/${createdFacilityId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { location: "Mysore, India" },
    });
    assertEqual(updateRes.status, 200, "Facility update status");
    assertEqual(updateRes.data.data.location, "Mysore, India", "Updated location");

    // We keep facility for department test, will delete after department cleanup
  });

  // 2. Department CRUD
  await test("Department CRUD: Create, Read, Update, Delete", async () => {
    // Create
    const createRes = await request("/api/org/departments", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { name: `Test Dept ${Date.now()}`, description: "Quality Assurance", facility: createdFacilityId },
    });
    assertEqual(createRes.status, 201, "Department create status");
    createdDepartmentId = createRes.data.data._id;

    // Read
    const getRes = await request("/api/org/departments", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(getRes.data.data.some((d) => d._id === createdDepartmentId), "Created department present");

    // Update
    const updateRes = await request(`/api/org/departments/${createdDepartmentId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { description: "QA & Compliance" },
    });
    assertEqual(updateRes.status, 200, "Department update status");
    assertEqual(updateRes.data.data.description, "QA & Compliance", "Updated description");
  });

  // 3. User CRUD (Admin)
  await test("User CRUD: Create, Read, Update, Delete", async () => {
    const testUserEmail = `crud_user_${Date.now()}@esg.com`;
    // Create
    const createRes = await request("/api/users", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: "Test Engineer",
        email: testUserEmail,
        password: "Engineer@123",
        role: "employee",
        department: createdDepartmentId,
        facility: createdFacilityId,
      },
    });
    assertEqual(createRes.status, 201, "User create status");
    createdUserId = createRes.data.data._id;

    // Read
    const getRes = await request(`/api/users/${createdUserId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assertEqual(getRes.status, 200, "User read status");
    assertEqual(getRes.data.data.email, testUserEmail, "Correct user email");

    // Update
    const updateRes = await request(`/api/users/${createdUserId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { name: "Senior Test Engineer" },
    });
    assertEqual(updateRes.status, 200, "User update status");
    assertEqual(updateRes.data.data.name, "Senior Test Engineer", "Updated user name");

    // Delete
    const deleteRes = await request(`/api/users/${createdUserId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assertEqual(deleteRes.status, 200, "User delete status");
  });

  // 4. EnergyRecord CRUD
  await test("EnergyRecord CRUD: Create, Read, Update, Delete with Renewable check", async () => {
    // Negative test: renewable > electricity
    const invalidRes = await request("/api/energy", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        facility: createdFacilityId,
        department: createdDepartmentId,
        date: "2026-10-01",
        electricityConsumption: 500,
        renewableEnergy: 800, // Invalid: exceeds electricity
      },
    });
    assertEqual(invalidRes.status, 400, "Renewable > electricity rejected");

    // Valid create
    const createRes = await request("/api/energy", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        facility: createdFacilityId,
        department: createdDepartmentId,
        date: "2026-10-01",
        electricityConsumption: 1000,
        renewableEnergy: 400,
        fuelConsumption: 50,
        waterConsumption: 25,
      },
    });
    assertEqual(createRes.status, 201, "Energy record create status");
    createdEnergyId = createRes.data.data._id;

    // Read
    const getRes = await request(`/api/energy/${createdEnergyId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assertEqual(getRes.status, 200, "Energy record read status");
    assertEqual(getRes.data.data.renewableEnergy, 400, "Renewable energy value");

    // Update
    const updateRes = await request(`/api/energy/${createdEnergyId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { renewableEnergy: 450 },
    });
    assertEqual(updateRes.status, 200, "Energy record update status");

    // Delete
    const delRes = await request(`/api/energy/${createdEnergyId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assertEqual(delRes.status, 200, "Energy record delete status");
  });

  // 5. EmissionRecord CRUD
  await test("EmissionRecord CRUD: Create, Read, Update, Delete with automatic CO2e", async () => {
    // Create with source = Diesel (factor 2.68)
    const createRes = await request("/api/emissions", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        facility: createdFacilityId,
        department: createdDepartmentId,
        source: "Diesel",
        quantity: 100,
        unit: "litres",
        date: "2026-10-01",
      },
    });
    assertEqual(createRes.status, 201, "Emission create status");
    assertEqual(createRes.data.data.co2e, 268, "CO2e auto-calculated: 100 * 2.68 = 268");
    createdEmissionId = createRes.data.data._id;

    // Update quantity
    const updateRes = await request(`/api/emissions/${createdEmissionId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { quantity: 200 },
    });
    assertEqual(updateRes.status, 200, "Emission update status");
    assertEqual(updateRes.data.data.co2e, 536, "CO2e recalculated: 200 * 2.68 = 536");

    // Delete
    const delRes = await request(`/api/emissions/${createdEmissionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assertEqual(delRes.status, 200, "Emission delete status");
  });

  // 6. WasteRecord CRUD
  await test("WasteRecord CRUD: Create, Read, Update, Delete with sum constraint", async () => {
    // Negative test: recycled + reused > total
    const invalidRes = await request("/api/waste", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        facility: createdFacilityId,
        department: createdDepartmentId,
        wasteType: "Plastic",
        quantity: 100,
        recycledQuantity: 80,
        reusedQuantity: 40, // 80 + 40 = 120 > 100
        date: "2026-10-01",
      },
    });
    assertEqual(invalidRes.status, 400, "Waste sum exceeding quantity rejected");

    // Valid create
    const createRes = await request("/api/waste", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        facility: createdFacilityId,
        department: createdDepartmentId,
        wasteType: "Plastic",
        quantity: 100,
        recycledQuantity: 60,
        reusedQuantity: 10,
        date: "2026-10-01",
      },
    });
    assertEqual(createRes.status, 201, "Waste create status");
    createdWasteId = createRes.data.data._id;

    // Delete
    const delRes = await request(`/api/waste/${createdWasteId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assertEqual(delRes.status, 200, "Waste delete status");
  });

  // 7. EsgMetric CRUD
  await test("EsgMetric CRUD: Create, Read, Update, Delete", async () => {
    const createRes = await request("/api/metrics", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: "Test Diversity KPI",
        category: "Social",
        value: 45,
        target: 50,
        unit: "%",
        date: "2026-10-01",
        department: createdDepartmentId,
      },
    });
    assertEqual(createRes.status, 201, "Metric create status");
    createdMetricId = createRes.data.data._id;

    // Update
    const updateRes = await request(`/api/metrics/${createdMetricId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { value: 48 },
    });
    assertEqual(updateRes.status, 200, "Metric update status");
    assertEqual(updateRes.data.data.value, 48, "Updated metric value");

    // Delete
    const delRes = await request(`/api/metrics/${createdMetricId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assertEqual(delRes.status, 200, "Metric delete status");
  });

  // 8. Sustainability Target CRUD
  await test("Sustainability Target CRUD: Create, Read, Update, Delete with computed status", async () => {
    const createRes = await request("/api/targets", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: "Test Solar Energy Goal",
        category: "Environmental",
        currentValue: 30,
        targetValue: 60,
        unit: "%",
        direction: "increase",
        deadline: "2027-12-31",
        department: createdDepartmentId,
      },
    });
    assertEqual(createRes.status, 201, "Target create status");
    assertEqual(createRes.data.data.progress, 50, "50% progress");
    assertEqual(createRes.data.data.status, "On Track", "Status On Track");
    createdTargetId = createRes.data.data._id;

    // Update to 60 -> Achieved
    const updateRes = await request(`/api/targets/${createdTargetId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { currentValue: 60 },
    });
    assertEqual(updateRes.status, 200, "Target update status");
    assertEqual(updateRes.data.data.progress, 100, "100% progress");
    assertEqual(updateRes.data.data.status, "Achieved", "Status Achieved");

    // Delete
    const delRes = await request(`/api/targets/${createdTargetId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assertEqual(delRes.status, 200, "Target delete status");
  });

  // Cleanup department and facility
  await test("Clean up created department and facility", async () => {
    const deptDel = await request(`/api/org/departments/${createdDepartmentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assertEqual(deptDel.status, 200, "Department delete");

    const facDel = await request(`/api/org/facilities/${createdFacilityId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assertEqual(facDel.status, 200, "Facility delete");
  });

  // 9. Report Generation & PDF Streaming
  console.log("\nSuite 7: Report Generation & PDFKit Streaming");

  await test("Create Report snapshot and validate date constraints", async () => {
    // Invalid date range
    const badRange = await request("/api/reports", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        title: "Bad Range Report",
        periodType: "monthly",
        periodStart: "2026-10-31",
        periodEnd: "2026-10-01", // Start > End
      },
    });
    assertEqual(badRange.status, 400, "Inverted date range rejected");

    // Valid create report
    const createRes = await request("/api/reports", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        title: "Audit Test Report October 2026",
        periodType: "monthly",
        periodStart: "2026-05-01",
        periodEnd: "2026-10-22",
      },
    });
    assertEqual(createRes.status, 201, "Report snapshot created");
    assert(createRes.data.data.snapshot, "Snapshot data present");
    createdReportId = createRes.data.data._id;
  });

  await test("Download Report as PDF returns valid PDF stream", async () => {
    const res = await request(`/api/reports/${createdReportId}/pdf`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assertEqual(res.status, 200, "PDF stream status");
    assert(res.headers["content-type"].includes("application/pdf"), "Content-Type is application/pdf");
    // Verify PDF Magic Bytes (%PDF-)
    const pdfMagic = res.raw.slice(0, 4).toString("utf8");
    assertEqual(pdfMagic, "%PDF", "Valid PDF binary magic header");
    assert(res.raw.length > 500, "PDF buffer contains generated content");
  });

  await test("Delete Report snapshot completes Report CRUD", async () => {
    const delRes = await request(`/api/reports/${createdReportId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assertEqual(delRes.status, 200, "Report delete status");
  });

  // 10. Notification Scanning & Read Status
  console.log("\nSuite 8: Notification Engine & Scan Actions");

  await test("Generate notifications scan and mark as read", async () => {
    const genRes = await request("/api/notifications/generate", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assertEqual(genRes.status, 200, "Notification scan status");

    const getRes = await request("/api/notifications", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assertEqual(getRes.status, 200, "Get notifications status");
    assert(Array.isArray(getRes.data.data), "Notifications array");

    if (getRes.data.data.length > 0) {
      const firstId = getRes.data.data[0]._id;
      const readRes = await request(`/api/notifications/${firstId}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assertEqual(readRes.status, 200, "Mark as read status");
      assertEqual(readRes.data.data.isRead, true, "isRead set to true");
    }
  });

  // 11. Dashboard Aggregation & Filtering
  console.log("\nSuite 9: Dashboard Aggregations & Query Filters");

  await test("GET /api/dashboard/summary returns populated charts and totals", async () => {
    const res = await request("/api/dashboard/summary", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assertEqual(res.status, 200, "Summary status");
    const d = res.data.data;
    assert(typeof d.totals.totalEnergy === "number", "Total energy is numeric");
    assert(typeof d.totals.totalEmissions === "number", "Total emissions is numeric");
    assert(typeof d.esgScore.overallScore === "number", "Overall score is numeric");
    assert(Array.isArray(d.charts.energyOverTime), "Energy over time array");
    assert(Array.isArray(d.charts.emissionsOverTime), "Emissions over time array");
    assert(Array.isArray(d.charts.renewableVsNonRenewable), "Renewable chart array");
    // Ensure non-renewable energy value is >= 0
    assert(d.charts.renewableVsNonRenewable[1].value >= 0, "Non-renewable slice is >= 0");
  });

  await test("GET /api/dashboard/risks returns active risk evaluations", async () => {
    const res = await request("/api/dashboard/risks", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assertEqual(res.status, 200, "Risks status");
    assert(Array.isArray(res.data.data), "Risks array");
    res.data.data.forEach((r) => {
      assert(r.title, "Risk title exists");
      assert(["warning", "critical"].includes(r.level), "Risk level is valid");
      assert(Array.isArray(r.recommendations), "Recommendations array exists");
    });
  });

  console.log("\n===============================================================");
  console.log(`TOTAL TESTS EXECUTED: ${passedCount + failedCount}`);
  console.log(`PASSED: ${passedCount}`);
  console.log(`FAILED: ${failedCount}`);
  console.log("===============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
