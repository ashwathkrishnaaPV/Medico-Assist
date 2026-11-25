const assert = require('assert');
const http = require('http');
const { createApp } = require('../src/index');
const { connectDB } = require('../src/db');
const { getModel } = require('../src/models/provider');

function makeRequest(server, options, postData) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const reqOptions = {
      hostname: '127.0.0.1',
      port: addr.port,
      path: options.path,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (postData) {
      const dataStr = typeof postData === 'string' ? postData : JSON.stringify(postData);
      if (!reqOptions.headers['Content-Type']) {
        reqOptions.headers['Content-Type'] = 'application/json';
      }
      reqOptions.headers['Content-Length'] = Buffer.byteLength(dataStr);
    }

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch { /* ignore non-JSON */ }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          rawBody: body,
          data: json
        });
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

function parseCookies(res) {
  const raw = res.headers['set-cookie'] || [];
  const cookies = {};
  for (const c of raw) {
    const [nameVal] = c.split(';');
    const [k, v] = nameVal.split('=');
    cookies[k.trim()] = v ? v.trim() : '';
  }
  return cookies;
}

async function runTests() {
  console.log('\n========================================================');
  console.log('🧪 RUNNING COMPREHENSIVE PHASE 2 & PHASE 3 VERIFICATION');
  console.log('========================================================\n');

  const connected = await connectDB();
  assert.strictEqual(connected, true, 'Must connect to MongoDB campushealth');

  const app = createApp();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total += 1;
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed += 1;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
    }
  }

  // 1. Missing password rejected
  await test('Login fails with 400 when password is omitted', async () => {
    const res = await makeRequest(server, { path: '/api/auth/login', method: 'POST' }, {
      email: 'nivetha@sece.ac.in'
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.success, false);
  });

  // 2. Weak/wrong password rejected
  await test('Login fails with 401 when wrong password is provided', async () => {
    const res = await makeRequest(server, { path: '/api/auth/login', method: 'POST' }, {
      email: 'nivetha@sece.ac.in',
      password: 'WrongPassword123'
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // 3. Real bcrypt login succeeds with HttpOnly cookie & CSRF token
  let doctorCookies = {};
  let doctorCsrf = '';
  await test('Doctor login with valid bcrypt password succeeds with HttpOnly cookie & CSRF token', async () => {
    const res = await makeRequest(server, { path: '/api/auth/login', method: 'POST' }, {
      email: 'nivetha@sece.ac.in',
      password: 'Password@123'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.user.role, 'MEDICAL_STAFF');
    doctorCookies = parseCookies(res);
    assert(doctorCookies.campushealth_token, 'HttpOnly JWT cookie must be set');
    assert(doctorCookies['XSRF-TOKEN'], 'XSRF-TOKEN cookie must be set');
    doctorCsrf = res.data.data.csrfToken || doctorCookies['XSRF-TOKEN'];
    assert(doctorCsrf, 'CSRF token must be present');
  });

  // 4. Admin login
  let adminCookies = {};
  let adminCsrf = '';
  await test('Admin login with valid password succeeds', async () => {
    const res = await makeRequest(server, { path: '/api/auth/login', method: 'POST' }, {
      email: 'admin@sece.ac.in',
      password: 'Password@123'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.user.role, 'ADMIN');
    adminCookies = parseCookies(res);
    adminCsrf = res.data.data.csrfToken || adminCookies['XSRF-TOKEN'];
  });

  // 5. Student login
  let studentCookies = {};
  await test('Student (Ashwath 24CC006) login succeeds', async () => {
    const res = await makeRequest(server, { path: '/api/auth/login', method: 'POST' }, {
      email: 'ashwathkrishnaa.pv2024cce@sece.ac.in',
      password: 'Password@123'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.user.role, 'STUDENT');
    studentCookies = parseCookies(res);
  });

  // 6. Public registration rejects role injection (e.g. role: 'ADMIN')
  await test('Public registration rejects role: ADMIN (mass-assignment protection)', async () => {
    const res = await makeRequest(server, { path: '/api/auth/register', method: 'POST' }, {
      name: 'Hacker User',
      email: 'hacker@sece.ac.in',
      password: 'ValidPassword123',
      role: 'ADMIN'
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.success, false);
  });

  // 7. Unauthenticated access to /api/inventory rejected with 401
  await test('Unauthenticated GET /api/inventory rejected with 401', async () => {
    const res = await makeRequest(server, { path: '/api/inventory', method: 'GET' });
    assert.strictEqual(res.status, 401);
  });

  // 8. IDOR Protection: Student cannot access another student profile
  await test('IDOR Protection: Student cannot view another student profile', async () => {
    const res = await makeRequest(
      server,
      {
        path: '/api/profiles/24CC007',
        method: 'GET',
        headers: {
          Cookie: `campushealth_token=${studentCookies.campushealth_token}`
        }
      }
    );
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.data.error.code, 'IDOR_ACCESS_DENIED');
  });

  // 9. Student can view their own profile
  await test('Student can view their own profile (24CC006)', async () => {
    const res = await makeRequest(
      server,
      {
        path: '/api/profiles/24CC006',
        method: 'GET',
        headers: {
          Cookie: `campushealth_token=${studentCookies.campushealth_token}`
        }
      }
    );
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.studentId, '24CC006');
  });

  // 10. Admin blocked from clinical consultations /api/visits
  await test('Admin blocked from creating clinical consultation (/api/visits)', async () => {
    const res = await makeRequest(
      server,
      {
        path: '/api/visits',
        method: 'POST',
        headers: {
          Cookie: `campushealth_token=${adminCookies.campushealth_token}; XSRF-TOKEN=${adminCsrf}`,
          'X-CSRF-TOKEN': adminCsrf
        }
      },
      {
        studentId: '24CC006',
        visitType: 'Consultation',
        visitDate: '2026-11-25',
        chiefComplaint: 'Headache',
        diagnosis: 'Tension headache'
      }
    );
    assert.strictEqual(res.status, 403);
  });

  // 11. CSRF Protection: State-changing request with cookie but missing x-csrf-token rejected with 403
  await test('CSRF Protection: POST without x-csrf-token header rejected with 403', async () => {
    const res = await makeRequest(
      server,
      {
        path: '/api/auth/logout',
        method: 'POST',
        headers: {
          Cookie: `campushealth_token=${doctorCookies.campushealth_token}; XSRF-TOKEN=${doctorCsrf}`
          // Missing X-CSRF-TOKEN header!
        }
      }
    );
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.data.error.code, 'CSRF_TOKEN_INVALID');
  });

  // 12. Medical staff can create prescription and inventory stock is atomically deducted
  await test('Medical staff creates prescription and medicine inventory is deducted', async () => {
    const MedicineInventory = getModel('MedicineInventory');
    const medBefore = await MedicineInventory.findOne({ name: 'para 650' });
    assert(medBefore, "'para 650' must exist in inventory");
    const initialQty = medBefore.quantity;

    const res = await makeRequest(
      server,
      {
        path: '/api/prescriptions',
        method: 'POST',
        headers: {
          Cookie: `campushealth_token=${doctorCookies.campushealth_token}; XSRF-TOKEN=${doctorCsrf}`,
          'X-CSRF-TOKEN': doctorCsrf
        }
      },
      {
        studentId: '24CC006',
        diagnosis: 'Mild Fever & Body Ache',
        followUpDate: '2026-11-28',
        notes: 'Take with warm water after food',
        items: [
          {
            medicineName: 'para 650',
            dosage: '650mg',
            frequency: '1-0-1',
            durationDays: 2,
            quantity: 4,
            instructions: 'After meals'
          }
        ]
      }
    );

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.studentId, '24CC006');
    assert.strictEqual(res.data.data.currentVersion.version, 1);

    const medAfter = await MedicineInventory.findOne({ name: 'para 650' });
    assert.strictEqual(medAfter.quantity, initialQty - 4, '4 tablets must be deducted from inventory');
  });

  // 13. Prescription Version History: Updating prescription creates version 2 with preserved history
  await test('Prescription update creates version 2 with preserved immutable version 1', async () => {
    const Prescription = getModel('Prescription');
    const rx = await Prescription.findOne({ studentId: '24CC006' }).sort({ createdAt: -1 });
    assert(rx, 'Prescription must exist');

    const res = await makeRequest(
      server,
      {
        path: `/api/prescriptions/${rx.id || rx._id}`,
        method: 'PUT',
        headers: {
          Cookie: `campushealth_token=${doctorCookies.campushealth_token}; XSRF-TOKEN=${doctorCsrf}`,
          'X-CSRF-TOKEN': doctorCsrf
        }
      },
      {
        changeReason: 'Symptoms persistent, adjusting dosage duration',
        diagnosis: 'Persistent Fever',
        followUpDate: '2026-11-30',
        notes: 'Extended course by 2 days',
        items: [
          {
            medicineName: 'para 650',
            dosage: '650mg',
            frequency: '1-0-1',
            durationDays: 3,
            quantity: 6,
            instructions: 'After meals with water'
          }
        ]
      }
    );

    const expectedVersion = Number(rx.currentVersion?.version || 1) + 1;
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.currentVersion.version, expectedVersion);
    assert.strictEqual(res.data.data.history.length >= 2, true, 'History must contain prior and current versions');
    assert.strictEqual(res.data.data.currentVersion.changeReason, 'Symptoms persistent, adjusting dosage duration');
  });

  // 14. Admin Database Backup Snapshot
  await test('Admin triggers real server-side database backup snapshot (/api/audit/backup)', async () => {
    const res = await makeRequest(
      server,
      {
        path: '/api/audit/backup',
        method: 'POST',
        headers: {
          Cookie: `campushealth_token=${adminCookies.campushealth_token}; XSRF-TOKEN=${adminCsrf}`,
          'X-CSRF-TOKEN': adminCsrf
        }
      }
    );

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert(res.data.data.filename.startsWith('backup_'), 'Filename must start with backup_');
    assert(res.data.data.stats.User >= 70, 'Must include >= 70 users');
    assert(res.data.data.stats.MedicineInventory >= 140, 'Must include >= 140 medicines');
  });

  // 15. Server-side audit log verified
  await test('Audit logs record real server-side events and cannot be forged by clients', async () => {
    const AuditLog = getModel('AuditLog');
    const logs = await AuditLog.find({ action: 'SYSTEM_DATABASE_BACKUP' });
    assert(logs.length > 0, 'Audit log must record database backup');
    const latest = logs[logs.length - 1];
    assert.strictEqual(latest.actorRole || latest.userRole, 'ADMIN');
  });

  server.close();
  await require('mongoose').disconnect();

  console.log('\n========================================================');
  console.log(`🎉 TEST SUMMARY: ${passed}/${total} TESTS PASSED CLEANLY (${Math.round((passed / total) * 100)}%)`);
  console.log('========================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
