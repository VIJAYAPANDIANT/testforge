async function testSignup() {
  const email = `testuser_${Date.now()}@example.com`;
  console.log("Registering user:", email);
  try {
    const res = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: email,
        password: "password123"
      })
    });
    const data = await res.json();
    console.log("Response status:", res.status);
    console.log("Response data:", data);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

testSignup();
