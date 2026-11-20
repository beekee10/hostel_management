import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { AppLayout } from "../components/layout/AppLayout";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { NoticesPage } from "../features/notices/pages/NoticesPage";
import { EventsPage } from "../features/events/pages/EventsPage";
import { ComplaintsPage } from "../features/complaints/pages/ComplaintsPage";
import { HotTopicsPage } from "../features/community/pages/HotTopicsPage";
import { MessPage } from "../features/mess/pages/MessPage";
import { ChatPage } from "../features/chat/pages/ChatPage";
import { StudentsPage } from "../features/students/pages/StudentsPage";
import { UnauthorizedPage } from "../pages/UnauthorizedPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/notices" element={<NoticesPage />} />
          <Route path="/hostel" element={<NoticesPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/complaints" element={<ComplaintsPage />} />
          <Route path="/community" element={<HotTopicsPage />} />
          <Route path="/mess" element={<MessPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/students" element={<StudentsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
