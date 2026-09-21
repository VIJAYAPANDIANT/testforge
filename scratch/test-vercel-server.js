async function testVercelServer() {
  console.log("Testing https://testforge-server.vercel.app...");

  // 1. Test GET /
  try {
    const rootRes = await fetch("https://testforge-server.vercel.app/");
    console.log("GET / status:", rootRes.status);
    const rootText = await rootRes.text();
    console.log("GET / body:", rootText);
  } catch (err) {
    console.error("GET / error:", err.message);
  }

  // 2. Test GET /health
  try {
    const healthRes = await fetch("https://testforge-server.vercel.app/health");
    console.log("GET /health status:", healthRes.status);
    const healthText = await healthRes.text();
    console.log("GET /health body:", healthText);
  } catch (err) {
    console.error("GET /health error:", err.message);
  }

  // 3. Test POST /api/auth/login
  try {
    const loginRes = await fetch("https://testforge-server.vercel.app/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "pandas@gmail.com", password: "password123" })
    });
    console.log("POST /api/auth/login status:", loginRes.status);
    const loginText = await loginRes.text();
    console.log("POST /api/auth/login body:", loginText);
  } catch (err) {
    console.error("POST /api/auth/login error:", err.message);
  }
}

testVercelServer();
