const assert = require('assert');
const http = require('http');
const { createApp } = require('../src/index');
const { connectDB, mongoose } = require('../src/db');

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
        resolve({ status: res.statusCode, headers: res.headers, data: json });
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

function parseCookies(setCookieHeader) {
  const cookies = {};
  const arr = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  for (const item of arr) {
    if (!item) continue;
    const kv = item.split(';')[0];
    const idx = kv.indexOf('=');
    if (idx > 0) {
      cookies[kv.slice(0, idx).trim()] = decodeURIComponent(kv.slice(idx + 1).trim());
    }
  }
  return cookies;
}

async function runTests() {
  await connectDB();
  const app = createApp();
  const server = app.listen(0);
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name} -> ${err.message}`);
      failed++;
    }
  }

  try {
    console.log('\n========================================================');
    console.log('🤖 RUNNING PHASE 5 AI INTEGRATION VERIFICATION');
    console.log('========================================================\n');

    const stuLogin = await makeRequest(
      server,
      { path: '/api/auth/login', method: 'POST' },
      { email: 'ashwathkrishnaa.pv2024cce@sece.ac.in', password: 'Password@123' }
    );
    assert.strictEqual(stuLogin.status, 200);
    const stuCookies = parseCookies(stuLogin.headers['set-cookie']);
    const stuCookieHeader = `campushealth_token=${stuCookies.campushealth_token}; XSRF-TOKEN=${stuCookies['XSRF-TOKEN']}`;

    const docLogin = await makeRequest(
      server,
      { path: '/api/auth/login', method: 'POST' },
      { email: 'nivetha@sece.ac.in', password: 'Password@123' }
    );
    assert.strictEqual(docLogin.status, 200);
    const docCookies = parseCookies(docLogin.headers['set-cookie']);
    const docCookieHeader = `campushealth_token=${docCookies.campushealth_token}; XSRF-TOKEN=${docCookies['XSRF-TOKEN']}`;

    await test('Unauthenticated request to /api/ai/health-info rejected with 401', async () => {
      const res = await makeRequest(
        server,
        { path: '/api/ai/health-info', method: 'POST' },
        { question: 'What is normal BMI?' }
      );
      assert.strictEqual(res.status, 401);
    });

    await test('POST /api/ai/health-info returns educational response, strips PHI, includes disclaimer', async () => {
      const res = await makeRequest(
        server,
        {
          path: '/api/ai/health-info',
          method: 'POST',
          headers: { Cookie: stuCookieHeader, 'X-CSRF-TOKEN': stuCookies['XSRF-TOKEN'] }
        },
        { question: 'What is normal blood pressure for student@sece.ac.in 9876543210?' }
      );
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body?.success ?? res.data?.success, true);
      assert.ok(res.data.data.disclaimer);
      assert.ok(!res.data.data.text.includes('student@sece.ac.in'));
      assert.ok(!res.data.data.text.includes('9876543210'));
    });

    await test('POST /api/ai/nutrition-advice generates allergy-aware guidance', async () => {
      const res = await makeRequest(
        server,
        {
          path: '/api/ai/nutrition-advice',
          method: 'POST',
          headers: { Cookie: stuCookieHeader, 'X-CSRF-TOKEN': stuCookies['XSRF-TOKEN'] }
        },
        { goal: 'Exam recovery', allergies: ['Peanuts', 'Dairy'], preferences: 'Vegetarian', currentBmi: 22 }
      );
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(res.data.data.disclaimer);
    });

    await test('POST /api/ai/trend-explanation summarizes vital trends safely', async () => {
      const res = await makeRequest(
        server,
        {
          path: '/api/ai/trend-explanation',
          method: 'POST',
          headers: { Cookie: stuCookieHeader, 'X-CSRF-TOKEN': stuCookies['XSRF-TOKEN'] }
        },
        {
          vitals: [
            { recordedAt: '2026-11-20', bloodPressureSys: 118, bloodPressureDia: 76, heartRateBpm: 70, temperatureF: 98.4, spo2Percent: 99 }
          ]
        }
      );
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
    });

    await test('RBAC: Student blocked (403) from /api/ai/visit-summary-draft', async () => {
      const res = await makeRequest(
        server,
        {
          path: '/api/ai/visit-summary-draft',
          method: 'POST',
          headers: { Cookie: stuCookieHeader, 'X-CSRF-TOKEN': stuCookies['XSRF-TOKEN'] }
        },
        { chiefComplaint: 'Headache', diagnosis: 'Migraine' }
      );
      assert.strictEqual(res.status, 403);
    });

    await test('Medical staff can generate clinician-reviewed draft on /api/ai/visit-summary-draft', async () => {
      const res = await makeRequest(
        server,
        {
          path: '/api/ai/visit-summary-draft',
          method: 'POST',
          headers: { Cookie: docCookieHeader, 'X-CSRF-TOKEN': docCookies['XSRF-TOKEN'] }
        },
        { chiefComplaint: 'Fever', diagnosis: 'Viral URI', clinicalNotes: 'Hydration & rest' }
      );
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(res.data.data.text.includes('Clinician'));
    });

    await test('Zod validation rejects unexpected fields on AI routes with 400', async () => {
      const res = await makeRequest(
        server,
        {
          path: '/api/ai/health-info',
          method: 'POST',
          headers: { Cookie: stuCookieHeader, 'X-CSRF-TOKEN': stuCookies['XSRF-TOKEN'] }
        },
        { question: 'What is SpO2?', adminOverride: true }
      );
      assert.strictEqual(res.status, 400);
    });
  } finally {
    server.close();
    if (mongoose?.connection?.readyState === 1) {
      await mongoose.disconnect();
    }
  }

  console.log(`\nSUMMARY: ${passed}/${passed + failed} AI tests passed.`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
