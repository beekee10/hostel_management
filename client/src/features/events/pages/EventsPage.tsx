import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/useAuth";
import { api } from "../../../lib/api";
import type { HostelEvent, User } from "../../../types";
import {
  Calendar,
  Sparkles,
  Plus,
  Users,
  MapPin,
  Clock,
  Trophy,
  Code2,
  Music,
  PartyPopper,
  GraduationCap,
  Shield,
  Phone,
  CheckCircle2,
  X,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  FileText,
  Mail,
  UserCheck,
  User as UserIcon,
} from "lucide-react";

export function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<HostelEvent[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // Organize & Edit Event Modal
  const [isOrganizeModalOpen, setIsOrganizeModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<HostelEvent | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<any>("SPORTS");
  const [venue, setVenue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [googleFormUrl, setGoogleFormUrl] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("50");
  const [selectedManagerIds, setSelectedManagerIds] = useState<string[]>([]);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [submittingEvent, setSubmittingEvent] = useState(false);

  // View Attendees Modal
  const [viewingAttendeesEvent, setViewingAttendeesEvent] = useState<HostelEvent | null>(null);
  const [attendeeSearch, setAttendeeSearch] = useState("");

  const currentUserId = user?.id || (user as any)?._id;

  const isModerator =
    user?.role === "STUDENT_COORDINATOR" ||
    user?.role === "WARDEN" ||
    user?.role === "ADMIN";

  useEffect(() => {
    fetchEvents();
  }, [categoryFilter]);

  async function fetchEvents() {
    try {
      setLoading(true);
      const url = categoryFilter === "ALL" ? "/events" : `/events?category=${categoryFilter}`;
      const res = await api.get(url);
      if (res.data?.data) {
        setEvents(res.data.data);
      }
    } catch (err) {
      console.error("Fetch events error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function openOrganizeModal() {
    setEditingEvent(null);
    setTitle("");
    setDescription("");
    setCategory("SPORTS");
    setVenue("");
    setEventDate("");
    setGoogleFormUrl("");
    setMaxAttendees("50");
    setSelectedManagerIds([]);
    setIsOrganizeModalOpen(true);
    fetchDirectoryStudents();
  }

  async function openEditModal(event: HostelEvent) {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description);
    setCategory(event.category);
    setVenue(event.venue);
    setGoogleFormUrl(event.googleFormUrl || "");
    setMaxAttendees(String(event.maxAttendees || 50));
    setEventDate(
      event.eventDate ? new Date(event.eventDate).toISOString().slice(0, 16) : "",
    );
    setSelectedManagerIds(
      event.studentManagers?.map((m) => m.id || (m as any)._id) || [],
    );
    setIsOrganizeModalOpen(true);
    fetchDirectoryStudents();
  }

  const openAttendeesModal = (event: HostelEvent) => {
    setViewingAttendeesEvent(event);
    setAttendeeSearch("");
  };

  async function fetchDirectoryStudents() {
    try {
      const res = await api.get("/students");
      if (res.data?.data) {
        setAllStudents(res.data.data);
      }
    } catch (err) {
      console.error("Fetch students for managers error:", err);
    }
  }

  const toggleManagerSelection = (studentId: string) => {
    setSelectedManagerIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
  };

  async function handleSaveEvent(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingEvent(true);
    try {
      const payload = {
        title,
        description,
        category,
        venue,
        eventDate,
        googleFormUrl,
        maxAttendees: Number(maxAttendees) || 0,
        studentManagers: selectedManagerIds,
      };

      if (editingEvent) {
        const res = await api.put(`/events/${editingEvent._id}`, payload);
        if (res.data?.data) {
          setEvents((prev) =>
            prev.map((ev) => (ev._id === editingEvent._id ? res.data.data : ev)),
          );
          setIsOrganizeModalOpen(false);
        }
      } else {
        const res = await api.post("/events", payload);
        if (res.data?.data) {
          setEvents((prev) => [res.data.data, ...prev]);
          setIsOrganizeModalOpen(false);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save event");
    } finally {
      setSubmittingEvent(false);
    }
  }

  async function handleDeleteEvent(eventId: string, eventTitle: string) {
    if (!confirm(`Are you sure you want to delete event: "${eventTitle}"?`)) return;

    try {
      await api.delete(`/events/${eventId}`);
      setEvents((prev) => prev.filter((ev) => ev._id !== eventId));
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete event");
    }
  }

  async function handleRegisterAndAttend(event: HostelEvent) {
    // 1. If Google form link is provided, open it in a new window
    if (event.googleFormUrl && event.googleFormUrl.trim()) {
      window.open(event.googleFormUrl.trim(), "_blank", "noopener,noreferrer");
    }

    // 2. Also record in-app RSVP attendance
    try {
      const res = await api.post(`/events/${event._id}/rsvp`);
      if (res.data?.data) {
        const updated = res.data.data;
        setEvents((prev) => prev.map((e) => (e._id === event._id ? updated : e)));
        if (viewingAttendeesEvent?._id === event._id) {
          setViewingAttendeesEvent(updated);
        }
      }
    } catch (err: any) {
      console.error("RSVP error:", err);
    }
  }

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "SPORTS":
        return <Trophy size={14} className="text-yellow-500" />;
      case "HACKATHON":
        return <Code2 size={14} className="text-emerald-500" />;
      case "CULTURAL":
        return <Music size={14} className="text-purple-400" />;
      case "CELEBRATION":
        return <PartyPopper size={14} className="text-rose-400" />;
      case "WORKSHOP":
        return <GraduationCap size={14} className="text-sky-400" />;
      default:
        return <Calendar size={14} className="text-zinc-400" />;
    }
  };

  const filteredStudents = allStudents.filter((s) => {
    if (!studentSearch) return true;
    const q = studentSearch.toLowerCase();
    return s.fullName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.roomNumber?.toLowerCase().includes(q);
  });

  const filteredAttendees = (viewingAttendeesEvent?.attendees || []).filter((a) => {
    if (!attendeeSearch) return true;
    const q = attendeeSearch.toLowerCase();
    return (
      a.fullName?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.roomNumber?.toLowerCase().includes(q) ||
      a.block?.toLowerCase().includes(q) ||
      a.department?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="drizzle-badge drizzle-badge-yellow text-[10px] sm:text-xs">
              <Calendar size={12} /> STUDENT ACTIVITIES & ATTENDEE ROSTER
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight mt-1">
            Hostel Events & Google Form Registration
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Organize activities, track registered student attendees, attach Google Forms, and manage student committees.
          </p>
        </div>

        <button
          onClick={openOrganizeModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs font-bold text-zinc-950 hover:bg-yellow-300 shadow-sm transition-all cursor-pointer w-full sm:w-auto"
        >
          <Plus size={16} />
          <span>Organize Campus Event</span>
        </button>
      </div>

      {/* Categories Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "ALL", label: "All Events" },
          { id: "SPORTS", label: "🏆 Sports" },
          { id: "HACKATHON", label: "💻 Hackathons" },
          { id: "CULTURAL", label: "🎭 Cultural" },
          { id: "WORKSHOP", label: "🔬 Workshops" },
          { id: "CELEBRATION", label: "🎉 Celebrations" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCategoryFilter(tab.id)}
            className={`rounded-xl px-3 sm:px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              categoryFilter === tab.id
                ? "bg-yellow-400 text-zinc-950 shadow-xs font-bold"
                : "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111216] text-zinc-600 dark:text-zinc-400 hover:border-yellow-400/40"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="drizzle-card p-6 h-64 animate-pulse bg-zinc-100 dark:bg-zinc-900" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="drizzle-card p-12 text-center">
          <Calendar size={32} className="mx-auto text-zinc-400 mb-2 opacity-50" />
          <h3 className="text-base font-bold">No upcoming events scheduled</h3>
          <p className="text-xs text-zinc-500 mt-1">
            Students, Representatives, and Wardens can organize the next campus activity!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {events.map((event) => {
            const creatorId =
              (event.createdBy as any)?._id ||
              event.createdBy?.id ||
              (event.createdBy as any);

            const isCreator = creatorId === currentUserId;
            const isStudentManager = event.studentManagers?.some(
              (m) => (m.id || (m as any)._id) === currentUserId,
            );
            const isStaffOrAdmin =
              user?.role === "WARDEN" ||
              user?.role === "SUPERVISOR" ||
              user?.role === "STUDENT_COORDINATOR" ||
              user?.role === "ADMIN";

            // Organizers and Managers can view attendee roster
            const canViewAttendees = isCreator || isStudentManager || isStaffOrAdmin;
            const canEdit = isCreator || user?.role === "WARDEN" || user?.role === "ADMIN";
            const canDelete = isCreator || isModerator;

            const isAttending = event.attendees?.some(
              (a) => (a as any)?._id === currentUserId || a?.id === currentUserId || (a as any) === currentUserId,
            );

            const hasGoogleForm = Boolean(event.googleFormUrl && event.googleFormUrl.trim());
            const attendeeCount = event.attendees?.length || 0;

            return (
              <div
                key={event._id}
                className="drizzle-card p-5 sm:p-6 flex flex-col justify-between border-yellow-500/30"
              >
                <div>
                  {/* Top Badges & Controls */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="drizzle-badge drizzle-badge-yellow text-[10px]">
                        {getCategoryIcon(event.category)}
                        <span>{event.category}</span>
                      </span>

                      <span className="font-mono text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded flex items-center gap-1">
                        <MapPin size={11} className="text-yellow-500" />
                        {event.venue}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {canEdit && (
                        <button
                          onClick={() => openEditModal(event)}
                          className="p-1 rounded-lg text-zinc-400 hover:text-yellow-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Edit Event Details"
                        >
                          <Edit2 size={13} />
                        </button>
                      )}

                      {canDelete && (
                        <button
                          onClick={() => handleDeleteEvent(event._id, event.title)}
                          className="p-1 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}

                      <span className="font-mono text-[10px] text-zinc-400 ml-1">
                        {new Date(event.eventDate).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                    {event.title}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-2 leading-relaxed whitespace-pre-line">
                    {event.description}
                  </p>

                  {/* Scheduled Date / Time & Attendees Pill */}
                  <div className="mt-3.5 space-y-2">
                    <div className="rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-[#18191f] p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                      <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                        <Clock size={14} className="text-yellow-500 shrink-0" />
                        <span>{new Date(event.eventDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>

                      {/* Organizer Attendees View Trigger */}
                      {canViewAttendees ? (
                        <button
                          onClick={() => openAttendeesModal(event)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20 px-2 py-1 rounded-lg border border-yellow-400/30 transition-colors cursor-pointer"
                          title="View Registered Attendees Roster"
                        >
                          <Users size={12} />
                          <span>Attendees ({attendeeCount} / {event.maxAttendees || "∞"}) 👥</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-zinc-400">
                          RSVP: {attendeeCount} / {event.maxAttendees || "∞"}
                        </span>
                      )}
                    </div>

                    {hasGoogleForm && (
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                          <FileText size={14} className="shrink-0" />
                          <span className="font-semibold text-[11px] sm:text-xs">Google Form Attached</span>
                        </div>
                        <a
                          href={event.googleFormUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[11px] font-bold text-emerald-500 hover:underline flex items-center gap-1 shrink-0"
                        >
                          Open Link <ExternalLink size={11} />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Responsible Student Managers Section */}
                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 font-bold uppercase tracking-wider mb-2">
                      <Users size={13} className="text-yellow-500" />
                      <span>Responsible Student Managers ({event.studentManagers?.length || 0}):</span>
                    </div>

                    {event.studentManagers?.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic">Managed by Event Creator ({event.createdBy?.fullName})</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {event.studentManagers.map((mgr) => (
                          <div
                            key={mgr.id || (mgr as any)._id}
                            className="flex items-center gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/5 px-2.5 py-1 text-xs"
                          >
                            <div className="h-5 w-5 rounded-full bg-yellow-400 text-zinc-950 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {mgr.fullName?.charAt(0) || "S"}
                            </div>
                            <div>
                              <p className="font-bold text-zinc-900 dark:text-zinc-100 text-[11px]">
                                {mgr.fullName}
                              </p>
                              <p className="text-[9px] font-mono text-zinc-400">
                                {mgr.block || "Block A"} · {mgr.roomNumber || "Main"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* RSVP & Action Bar */}
                <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-mono text-zinc-400 truncate">
                      Created by: {event.createdBy?.fullName || "Student"}
                    </span>

                    {canViewAttendees && (
                      <button
                        onClick={() => openAttendeesModal(event)}
                        className="text-[11px] font-mono font-bold text-yellow-500 hover:underline cursor-pointer shrink-0"
                      >
                        [Roster ({attendeeCount})]
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleRegisterAndAttend(event)}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer w-full sm:w-auto ${
                      hasGoogleForm
                        ? "bg-yellow-400 text-zinc-950 hover:bg-yellow-300 shadow-sm shadow-yellow-400/20"
                        : isAttending
                        ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                        : "bg-yellow-400 text-zinc-950 hover:bg-yellow-300 shadow-xs"
                    }`}
                  >
                    {hasGoogleForm ? (
                      <>
                        <ExternalLink size={14} />
                        <span>Register on Google Form ↗</span>
                      </>
                    ) : isAttending ? (
                      <>
                        <CheckCircle2 size={14} />
                        <span>Registered (Attending)</span>
                      </>
                    ) : (
                      <>
                        <Calendar size={14} />
                        <span>Register & Attend 👋</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Organize / Edit Event Modal */}
      {isOrganizeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => setIsOrganizeModalOpen(false)}
          />
          <div className="relative w-full max-w-xl rounded-2xl border border-yellow-500/40 bg-white dark:bg-[#111216] p-5 sm:p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Calendar size={18} className="text-yellow-500" />
              {editingEvent ? "Edit Campus Event Details" : "Organize Campus Event & Add Google Form"}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Available to all Students, Representatives, Wardens, and Administrators.
            </p>

            <form onSubmit={handleSaveEvent} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">EVENT TITLE</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Inter-Hostel Cricket Tournament 2026"
                  required
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3.5 py-2 text-xs outline-hidden focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">DESCRIPTION & RULES</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Event schedule, team sizes, equipment, prizes, and contact details..."
                  required
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3.5 py-2 text-xs outline-hidden focus:border-yellow-400"
                />
              </div>

              {/* Google Form Link Input */}
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1 flex items-center gap-1.5">
                  <ExternalLink size={13} className="text-yellow-500" />
                  <span>GOOGLE FORM REGISTRATION LINK (OPTIONAL)</span>
                </label>
                <input
                  type="url"
                  value={googleFormUrl}
                  onChange={(e) => setGoogleFormUrl(e.target.value)}
                  placeholder="https://docs.google.com/forms/d/e/.../viewform or https://forms.gle/..."
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3.5 py-2 text-xs outline-hidden focus:border-yellow-400"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  When added, clicking "Register & Attend" will redirect students directly to this Google Form.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">CATEGORY</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-2 text-xs outline-hidden focus:border-yellow-400"
                  >
                    <option value="SPORTS">🏆 Sports & Games</option>
                    <option value="HACKATHON">💻 Coding & Hackathon</option>
                    <option value="CULTURAL">🎭 Cultural & Music</option>
                    <option value="WORKSHOP">🔬 Workshop & Tech</option>
                    <option value="CELEBRATION">🎉 Celebration / Festival</option>
                    <option value="MEETING">📋 General Meeting</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">VENUE / LOCATION</label>
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Hostel Common Ground"
                    required
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-2 text-xs outline-hidden focus:border-yellow-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">EVENT DATE & TIME</label>
                  <input
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-2 text-xs outline-hidden focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">MAX ATTENDEE LIMIT</label>
                  <input
                    type="number"
                    value={maxAttendees}
                    onChange={(e) => setMaxAttendees(e.target.value)}
                    placeholder="50 (0 for unlimited)"
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-2 text-xs outline-hidden focus:border-yellow-400"
                  />
                </div>
              </div>

              {/* Multi-Select Student Managers Picker */}
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  APPOINT RESPONSIBLE STUDENT MANAGERS ({selectedManagerIds.length} SELECTED)
                </label>
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search students by name or room..."
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-1.5 text-xs outline-hidden focus:border-yellow-400 mb-2"
                />

                <div className="max-h-40 overflow-y-auto space-y-1 rounded-xl border border-zinc-200 dark:border-zinc-800 p-2 bg-zinc-50/50 dark:bg-[#18191f]">
                  {filteredStudents.map((s) => {
                    const sid = s.id || (s as any)._id;
                    const isSelected = selectedManagerIds.includes(sid);

                    return (
                      <button
                        key={sid}
                        type="button"
                        onClick={() => toggleManagerSelection(sid)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                          isSelected
                            ? "bg-yellow-400/20 border border-yellow-400/40 text-yellow-700 dark:text-yellow-400 font-bold"
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        <div>
                          <p>{s.fullName} ({s.block || "Block A"} · {s.roomNumber || "Main"})</p>
                          <p className="text-[10px] text-zinc-400 font-mono">{s.email}</p>
                        </div>
                        {isSelected && <span className="text-yellow-500 font-bold">✓ Assigned</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsOrganizeModalOpen(false)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEvent}
                  className="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-yellow-300"
                >
                  {submittingEvent ? "Saving..." : editingEvent ? "Save Changes" : "Publish Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Event Attendees Roster Modal (For Organizers & Managers) */}
      {viewingAttendeesEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => setViewingAttendeesEvent(null)}
          />
          <div className="relative w-full max-w-2xl rounded-2xl border border-yellow-500/40 bg-white dark:bg-[#111216] p-5 sm:p-6 shadow-2xl z-10 max-h-[90vh] flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="drizzle-badge drizzle-badge-yellow text-[10px]">
                      <UserCheck size={12} /> ORGANIZER ATTENDEE ROSTER
                    </span>
                    <span className="font-mono text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-600 dark:text-zinc-400">
                      {viewingAttendeesEvent.venue}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                    {viewingAttendeesEvent.title}
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Total Registered Attendees: <strong>{viewingAttendeesEvent.attendees?.length || 0}</strong> / {viewingAttendeesEvent.maxAttendees || "∞ capacity"}
                  </p>
                </div>

                <button
                  onClick={() => setViewingAttendeesEvent(null)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search Filter Bar */}
              <div className="mt-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-zinc-400" />
                  <input
                    type="text"
                    value={attendeeSearch}
                    onChange={(e) => setAttendeeSearch(e.target.value)}
                    placeholder="Search registered attendees by name, email, or room..."
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] pl-9 pr-4 py-2 text-xs outline-hidden focus:border-yellow-400"
                  />
                </div>
              </div>

              {/* Attendees List */}
              <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
                {filteredAttendees.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-500 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                    <Users size={28} className="mx-auto text-zinc-400 mb-2 opacity-50" />
                    <p className="font-bold">No registered attendees found</p>
                    <p className="mt-0.5">Students who click "Register & Attend" will automatically appear on this roster.</p>
                  </div>
                ) : (
                  filteredAttendees.map((attendee, index) => {
                    const aid = attendee.id || (attendee as any)._id || index;
                    return (
                      <div
                        key={aid}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-[#18191f] hover:border-yellow-400/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative h-8 w-8 rounded-xl border border-yellow-400/50 bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center font-bold text-xs text-yellow-600 dark:text-yellow-400 shrink-0">
                            {attendee.avatarUrl ? (
                              <img src={attendee.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                            ) : (
                              <span>{attendee.fullName?.charAt(0) || "S"}</span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                              {attendee.fullName}
                            </p>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono truncate">
                              {attendee.email} {attendee.phoneNumber && `· 📞 ${attendee.phoneNumber}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 font-mono text-[10px] text-zinc-700 dark:text-zinc-300">
                            {attendee.block || "Block A"} · {attendee.roomNumber || "Main"}
                          </span>
                          <span className="rounded font-mono text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 px-1.5 py-0.5">
                            ✓ CONFIRMED
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 mt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>Roster verified by CampusNest Event System</span>
              <button
                onClick={() => setViewingAttendeesEvent(null)}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 px-4 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
