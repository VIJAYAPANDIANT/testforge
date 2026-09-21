import http from 'node:http';
import app from '../apps/server/src/app.js';
import connectDB from '../apps/server/src/config/db.js';

async function runAuthTests() {
  console.log('Connecting to DB...');
  await connectDB();

  const server = http.createServer(app);
  const PORT = 5001; // Test port to avoid port conflict

  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Test server running on port ${PORT}`);

  const baseUrl = `http://localhost:${PORT}`;

  try {
    const testEmail = `user_${Date.now()}@example.com`;

    // 1. Valid Registration
    console.log('\n--- 1. Testing Valid Registration ---');
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jane Doe',
        email: testEmail,
        password: 'password123',
      }),
    });
    const regData = await regRes.json();
    console.log('Status:', regRes.status);
    console.log('Body:', JSON.stringify(regData, null, 2));

    if (regRes.status !== 201 || !regData.success || !regData.data?.token) {
      throw new Error('Registration failed!');
    }

    const token = regData.data.token;

    // 2. Duplicate Email Registration
    console.log('\n--- 2. Testing Duplicate Email ---');
    const dupRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jane Doe',
        email: testEmail,
        password: 'password123',
      }),
    });
    const dupData = await dupRes.json();
    console.log('Status:', dupRes.status);
    console.log('Body:', JSON.stringify(dupData, null, 2));

    if (dupRes.status !== 409 || dupData.success !== false) {
      throw new Error('Duplicate email test failed!');
    }

    // 3. Invalid Email Format
    console.log('\n--- 3. Testing Invalid Email ---');
    const invalidRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jane Doe',
        email: 'invalid-email-format',
        password: 'password123',
      }),
    });
    const invalidData = await invalidRes.json();
    console.log('Status:', invalidRes.status);
    console.log('Body:', JSON.stringify(invalidData, null, 2));

    if (invalidRes.status !== 400 || invalidData.success !== false) {
      throw new Error('Invalid email validation failed!');
    }

    // 4. Valid Login
    console.log('\n--- 4. Testing Valid Login ---');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'password123',
      }),
    });
    const loginData = await loginRes.json();
    console.log('Status:', loginRes.status);
    console.log('Body:', JSON.stringify(loginData, null, 2));

    if (loginRes.status !== 200 || !loginData.success || !loginData.data?.token) {
      throw new Error('Login failed!');
    }

    // 5. Get Current User (GET /api/auth/me)
    console.log('\n--- 5. Testing GET /api/auth/me ---');
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const meData = await meRes.json();
    console.log('Status:', meRes.status);
    console.log('Body:', JSON.stringify(meData, null, 2));

    if (meRes.status !== 200 || !meData.success || meData.data?.user?.email !== testEmail) {
      throw new Error('GET /api/auth/me failed!');
    }

    console.log('\n✅ ALL AUTH FLOW TESTS PASSED SUCCESSFULLY!');
  } finally {
    server.close();
  }
}

runAuthTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
