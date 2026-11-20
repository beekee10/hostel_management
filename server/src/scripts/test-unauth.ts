async function testUnauth() {
  console.log("Testing unauthenticated GET request to /api/complaints...");
  const r1 = await fetch("http://localhost:5000/api/complaints");
  console.log("Request 1 Status:", r1.status);
  console.log("Request 1 ETag:", r1.headers.get("etag"));
  console.log("Request 1 Cache-Control:", r1.headers.get("cache-control"));
  const b1 = await r1.json();
  console.log("Request 1 Body:", b1);

  console.log("\nTesting second request with conditional If-None-Match & If-Modified-Since headers...");
  const r2 = await fetch("http://localhost:5000/api/complaints", {
    headers: {
      "If-None-Match": 'W/"some-cached-etag"',
      "If-Modified-Since": new Date().toUTCString(),
    },
  });
  console.log("Request 2 Status:", r2.status);
  const b2 = await r2.json();
  console.log("Request 2 Body:", b2);

  const code1 = b1.error || b1.errorCode;
  const code2 = b2.error || b2.errorCode;

  if (r1.status === 401 && r2.status === 401 && code1 === "UNAUTHORIZED" && code2 === "UNAUTHORIZED") {
    console.log("\n✅ SUCCESS: 401 Unauthorized is properly returned and 304 Not Modified is never triggered!");
  } else {
    console.error("\n❌ FAILED: Unexpected status code");
  }
}

testUnauth().catch(console.error);
