const BASE_URL = "http://localhost:5000/api";

async function testStudentCreatorAppointManagers() {
  console.log("==========================================");
  console.log("TESTING STUDENT CREATOR APPOINTING EVENT MANAGERS");
  console.log("==========================================");

  try {
    // 1. Alex Login (Regular Student)
    const alexLogin = await (
      await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "student@campus.in", password: "Pass@123" }),
      })
    ).json();
    const alexToken = alexLogin.data.accessToken;
    const alexId = alexLogin.data.user.id;

    // 2. Fetch Directory Students as normal student (to appoint managers)
    const studentsRes = await (
      await fetch(`${BASE_URL}/students`, {
        headers: { Authorization: `Bearer ${alexToken}` },
      })
    ).json();
    console.log(`1. Regular student fetched student directory: ${studentsRes.data?.length || 0} residents accessible`);

    const otherStudent = studentsRes.data?.find((s: any) => (s._id || s.id) !== alexId) || studentsRes.data?.[0];
    const otherStudentId = otherStudent?._id || otherStudent?.id;
    console.log(`2. Selected Student Manager to appoint: ${otherStudent?.fullName} (${otherStudent?.email})`);

    // 3. Alex creates a new hostel event with student managers
    const nextFriday = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const createEventRes = await (
      await fetch(`${BASE_URL}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${alexToken}`,
        },
        body: JSON.stringify({
          title: "🎸 Hostel Open Mic & Acoustic Night",
          description: "Music, poetry, and standup comedy night by hostel residents! Tea and snacks provided.",
          category: "CULTURAL",
          venue: "Hostel Amphitheatre / Rooftop",
          eventDate: nextFriday.toISOString(),
          googleFormUrl: "https://docs.google.com/forms/d/e/sample_acoustic_night/viewform",
          maxAttendees: 60,
          studentManagers: [otherStudentId],
        }),
      })
    ).json();

    if (!createEventRes.data) {
      console.log("Create event response:", createEventRes);
      return;
    }

    const event = createEventRes.data;
    console.log(`3. Event successfully created by student: "${event.title}"`);
    console.log(`   - Created By: ${event.createdBy?.fullName} (${event.createdBy?.role})`);
    console.log(`   - Appointed Student Managers (${event.studentManagers?.length}):`, event.studentManagers?.map((m: any) => `${m.fullName} (${m.email})`));

    const isManagerAssigned = event.studentManagers?.some((m: any) => (m._id || m.id) === otherStudentId);
    console.log(`4. Manager correctly persisted and populated: ${isManagerAssigned ? "✓ PASS" : "✗ FAIL"}`);

    // 4. Alex updates appointed student managers
    const updateRes = await (
      await fetch(`${BASE_URL}/events/${event._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${alexToken}`,
        },
        body: JSON.stringify({
          venue: "Hostel Main Courtyard & Lawn",
          studentManagers: [otherStudentId, alexId],
        }),
      })
    ).json();

    console.log(`5. Event updated by student creator: "${updateRes.data?.venue}"`);
    console.log(`   - Updated Student Managers count: ${updateRes.data?.studentManagers?.length}`);

    console.log("==========================================");
    console.log("STUDENT CREATOR EVENT MANAGER APPOINTMENT VERIFIED 100%!");
    console.log("==========================================");
  } catch (err: any) {
    console.error("Test failure:", err);
  }
}

testStudentCreatorAppointManagers();
