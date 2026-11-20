import "dotenv/config";

const API_BASE = "http://localhost:5000/api";

interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    roomNumber?: string;
    block?: string;
  };
}

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: any) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    if (detail) console.error("     Detail:", detail);
  }
}

async function apiRequest<T = any>(
  path: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
  body?: any,
  token?: string
): Promise<{ status: number; body: { success: boolean; message?: string; data?: T; [key: string]: any } }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let resBody: any = {};
  try {
    resBody = await res.json();
  } catch {
    resBody = {};
  }

  return { status: res.status, body: resBody };
}

async function runTests() {
  console.log("=================================================");
  console.log("🚀 STARTING E2E AUTOMATED SYSTEM VERIFICATION");
  console.log("=================================================\n");

  // 1. HEALTH CHECK
  console.log("▶ [1/9] Health Check");
  const healthRes = await apiRequest("/health");
  assert(healthRes.status === 200 && healthRes.body.success === true, "Health endpoint returns 200 OK");

  // 2. AUTHENTICATION & RBAC
  console.log("\n▶ [2/9] Authentication & Role Accounts");
  const roles = [
    { role: "STUDENT", email: "student@campus.in" },
    { role: "STUDENT_COORDINATOR", email: "representative@campus.in" },
    { role: "SUPERVISOR", email: "supervisor@campus.in" },
    { role: "WARDEN", email: "warden@campus.in" },
    { role: "MESS_COORDINATOR", email: "messincharge@campus.in" },
    { role: "ADMIN", email: "admin@campus.in" },
  ];

  const tokens: Record<string, string> = {};
  const users: Record<string, any> = {};

  for (const r of roles) {
    const loginRes = await apiRequest<AuthResponse>("/auth/login", "POST", {
      email: r.email,
      password: "Pass@123",
    });
    const ok = loginRes.status === 200 && !!loginRes.body.data?.accessToken;
    assert(ok, `Login successful for ${r.role} (${r.email})`, loginRes.body);
    if (ok && loginRes.body.data) {
      tokens[r.role] = loginRes.body.data.accessToken;
      users[r.role] = loginRes.body.data.user;
    }
  }

  const meRes = await apiRequest("/auth/me", "GET", undefined, tokens["STUDENT"]);
  assert(
    meRes.status === 200 && meRes.body.data?.email === "student@campus.in",
    "Profile verification (/auth/me) works with JWT bearer"
  );

  // 3. COMPLAINTS MODULE & AI PRIORITY
  console.log("\n▶ [3/9] Complaints Lifecycle & AI Prioritization");
  const listComplaintsRes = await apiRequest("/complaints", "GET", undefined, tokens["STUDENT"]);
  assert(
    listComplaintsRes.status === 200 && Array.isArray(listComplaintsRes.body.data),
    "List complaints returns student's tickets",
    listComplaintsRes.body
  );

  const createComplaintRes = await apiRequest("/complaints", "POST", {
    title: "Ceiling Fan Speed Regulator Jammed in Room 304",
    description: "The fan regulator knob is broken and stuck on maximum speed creating strong noise.",
    category: "ELECTRICITY",
    severity: "MEDIUM",
    block: "Block B",
    roomNumber: "Room 304",
  }, tokens["STUDENT"]);

  assert(
    createComplaintRes.status === 201 && !!createComplaintRes.body.data?._id,
    "Student successfully creates a new complaint ticket",
    createComplaintRes.body
  );
  const createdComplaintId = createComplaintRes.body.data?._id;

  // Supervisor AI Summary
  const supSummaryRes = await apiRequest("/complaints/supervisor-summary", "GET", undefined, tokens["SUPERVISOR"]);
  assert(
    supSummaryRes.status === 200 && !!supSummaryRes.body.data?.summary,
    "Supervisor summary endpoint returns aggregate metrics and AI analysis",
    supSummaryRes.body
  );

  if (createdComplaintId) {
    // Representative forwards complaint
    const forwardRes = await apiRequest(`/complaints/${createdComplaintId}/forward`, "POST", {
      forwardTarget: "Electrical Maintenance Team",
      coordinatorNotes: "Student verified issue during room inspection.",
    }, tokens["STUDENT_COORDINATOR"]);
    assert(
      forwardRes.status === 200 && forwardRes.body.data?.forwardedTo === "Electrical Maintenance Team",
      "Student Coordinator successfully forwards complaint to contractor",
      forwardRes.body
    );

    // Supervisor updates status to RESOLVED
    const updateStatusRes = await apiRequest(`/complaints/${createdComplaintId}/status`, "PATCH", {
      status: "RESOLVED",
    }, tokens["SUPERVISOR"]);
    assert(
      updateStatusRes.status === 200 && updateStatusRes.body.data?.status === "RESOLVED",
      "Supervisor updates complaint status to RESOLVED with resolution note",
      updateStatusRes.body
    );
  }

  // 4. NOTICES BOARD
  console.log("\n▶ [4/9] Notice Board Announcements");
  const listNoticesRes = await apiRequest("/notices", "GET", undefined, tokens["STUDENT"]);
  assert(
    listNoticesRes.status === 200 && Array.isArray(listNoticesRes.body.data),
    "Student fetches active notice announcements",
    listNoticesRes.body
  );

  const createNoticeRes = await apiRequest("/notices", "POST", {
    title: "⚡ Generator Load Testing - 30 Min Advisory",
    body: "Hostel back-up diesel generator synchronization test will occur at 5:00 PM today.",
    type: "ELECTRICITY",
    block: "All Blocks",
    affectedAreas: "Entire Complex",
    isPinned: false,
  }, tokens["WARDEN"]);
  assert(
    createNoticeRes.status === 201 && !!createNoticeRes.body.data?._id,
    "Warden posts a new official notice announcement",
    createNoticeRes.body
  );
  const testNoticeId = createNoticeRes.body.data?._id;

  if (testNoticeId) {
    const deleteNoticeRes = await apiRequest(`/notices/${testNoticeId}`, "DELETE", undefined, tokens["WARDEN"]);
    assert(
      deleteNoticeRes.status === 200,
      "Warden deletes test notice successfully"
    );
  }

  // 5. COMMUNITY: HOT TOPICS & LEND-BORROW
  console.log("\n▶ [5/9] Community: Hot Topics & Lend-Borrow Marketplace");
  const topicsRes = await apiRequest("/community/topics", "GET", undefined, tokens["STUDENT"]);
  assert(
    topicsRes.status === 200 && Array.isArray(topicsRes.body.data),
    "List Bento Hot Topics with upvotes and heat scores",
    topicsRes.body
  );

  const firstTopic = topicsRes.body.data?.[0];
  if (firstTopic?._id) {
    const voteRes = await apiRequest(`/community/topics/${firstTopic._id}/vote`, "POST", {}, tokens["STUDENT"]);
    assert(
      voteRes.status === 200,
      "Student casts / toggles upvote on Hot Topic",
      voteRes.body
    );

    const commentRes = await apiRequest(`/community/topics/${firstTopic._id}/comments`, "POST", {
      content: "Great initiative! Full support from Block B residents.",
    }, tokens["STUDENT"]);
    assert(
      commentRes.status === 201 && !!commentRes.body.data?._id,
      "Student adds discussion comment to Hot Topic",
      commentRes.body
    );
  }

  // Lend & Borrow
  const lendListRes = await apiRequest("/community/items", "GET", undefined, tokens["STUDENT"]);
  assert(
    lendListRes.status === 200 && Array.isArray(lendListRes.body.data),
    "Fetch Lend & Borrow marketplace listings",
    lendListRes.body
  );

  const createItemRes = await apiRequest("/community/items", "POST", {
    title: "USB-C Laptop Power Adapter 65W",
    description: "Spare fast charger available for borrowing.",
    category: "ELECTRONICS",
    locationHint: "Room 304, Block B",
  }, tokens["STUDENT"]);
  assert(
    createItemRes.status === 201 && !!createItemRes.body.data?._id,
    "Student posts item to Lend & Borrow marketplace",
    createItemRes.body
  );

  const lendItemId = createItemRes.body.data?._id;
  if (lendItemId) {
    const deleteItemRes = await apiRequest(`/community/items/${lendItemId}`, "DELETE", undefined, tokens["STUDENT"]);
    assert(
      deleteItemRes.status === 200,
      "Student deletes their own marketplace item",
      deleteItemRes.body
    );
  }

  // 6. MESS MANAGEMENT: MENU, REVIEWS & WASTAGE
  console.log("\n▶ [6/9] Mess Menu, Reviews & Wastage Tracking");
  const menuRes = await apiRequest("/mess/menu", "GET", undefined, tokens["STUDENT"]);
  assert(
    menuRes.status === 200 && Array.isArray(menuRes.body.data) && menuRes.body.data.length > 0,
    "Student retrieves 7-day mess menu schedule",
    menuRes.body
  );

  const reviewRes = await apiRequest("/mess/reviews", "POST", {
    mealType: "DINNER",
    rating: 5,
    foodQuality: 5,
    hygiene: 5,
    taste: 5,
    comment: "Excellent paneer curry and fresh hot chapatis tonight!",
  }, tokens["STUDENT"]);
  assert(
    reviewRes.status === 201 && !!reviewRes.body.data?._id,
    "Student submits mess meal rating & review",
    reviewRes.body
  );

  const wastageRes = await apiRequest("/mess/wastage", "GET", undefined, tokens["MESS_COORDINATOR"]);
  assert(
    wastageRes.status === 200 && wastageRes.body.data?.totals?.totalWasted !== undefined,
    "Mess coordinator retrieves food wastage analytics",
    wastageRes.body
  );

  // 7. REAL-TIME CHAT & CONVERSATIONS
  console.log("\n▶ [7/9] Real-Time Conversations & Chat Channels");
  const convRes = await apiRequest("/chat/conversations", "GET", undefined, tokens["STUDENT"]);
  const channels = convRes.body.data?.channels || [];
  assert(
    convRes.status === 200 && Array.isArray(channels) && channels.length > 0,
    "Student lists chat channels (general, alerts, mess-feedback)",
    convRes.body
  );

  const generalChan = channels.find((c: any) => c.name === "general-lounge" || c.type === "CHANNEL");
  if (generalChan?._id) {
    const msgListRes = await apiRequest(`/chat/conversations/${generalChan._id}/messages`, "GET", undefined, tokens["STUDENT"]);
    assert(
      msgListRes.status === 200 && Array.isArray(msgListRes.body.data),
      "Fetch message history for general lounge channel",
      msgListRes.body
    );

    const sendMsgRes = await apiRequest(`/chat/conversations/${generalChan._id}/messages`, "POST", {
      text: "Testing automated chat message delivery across CampusNest!",
      tag: "GENERAL",
    }, tokens["STUDENT"]);
    assert(
      sendMsgRes.status === 201 && sendMsgRes.body.data?.text?.includes("automated chat message"),
      "Student posts message to general lounge channel",
      sendMsgRes.body
    );
  }

  // 8. EVENTS & RSVP
  console.log("\n▶ [8/9] Events & Student RSVP");
  const eventsRes = await apiRequest("/events", "GET", undefined, tokens["STUDENT"]);
  assert(
    eventsRes.status === 200 && Array.isArray(eventsRes.body.data),
    "List hostel events",
    eventsRes.body
  );

  const createEventRes = await apiRequest("/events", "POST", {
    title: "Campus Cleanliness & Plantation Drive",
    description: "Join fellow residents for a 1-hour hostel garden beautification drive.",
    eventDate: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    venue: "Hostel Central Lawn",
    category: "CULTURAL",
  }, tokens["STUDENT_COORDINATOR"]);
  assert(
    createEventRes.status === 201 && !!createEventRes.body.data?._id,
    "Student Coordinator creates new hostel event",
    createEventRes.body
  );

  const eventId = createEventRes.body.data?._id;
  if (eventId) {
    const rsvpRes = await apiRequest(`/events/${eventId}/rsvp`, "POST", { status: "GOING" }, tokens["STUDENT"]);
    assert(
      rsvpRes.status === 200,
      "Student registers RSVP for the event",
      rsvpRes.body
    );

    // Clean up test event
    await apiRequest(`/events/${eventId}`, "DELETE", undefined, tokens["STUDENT_COORDINATOR"]);
  }

  // 9. STUDENT DIRECTORY & ACCESS CONTROL
  console.log("\n▶ [9/9] Student Directory & Access Control");
  const studentsListRes = await apiRequest("/students", "GET", undefined, tokens["SUPERVISOR"]);
  assert(
    studentsListRes.status === 200 && Array.isArray(studentsListRes.body.data),
    "Supervisor lists student resident directory",
    studentsListRes.body
  );

  console.log("\n=================================================");
  console.log(`📊 TEST RESULTS SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  if (passedTests === totalTests) {
    console.log("🎉 ALL TESTS PASSED PERFECTLY!");
  } else {
    console.log(`⚠️ ${totalTests - passedTests} TEST(S) FAILED`);
  }
  console.log("=================================================\n");
}

runTests().catch(console.error);
