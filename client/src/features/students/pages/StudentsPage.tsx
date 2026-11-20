import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/useAuth";
import { api } from "../../../lib/api";
import type { User } from "../../../types";
import {
  Users,
  Plus,
  Search,
  Trash2,
  Edit2,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Filter,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
} from "lucide-react";

export function StudentsPage() {
  const { user: currentUser } = useAuth();
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterBlock, setFilterBlock] = useState("ALL");

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [block, setBlock] = useState("Block A");
  const [department, setDepartment] = useState("Computer Science");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [submitting, setSubmitting] = useState(false);

  // Admin Reset Password Modal
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [targetStudentForPassword, setTargetStudentForPassword] = useState<User | null>(null);
  const [adminNewPassword, setAdminNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState("");

  const canAddStudent =
    currentUser?.role === "SUPERVISOR" ||
    currentUser?.role === "WARDEN" ||
    currentUser?.role === "ADMIN";

  const canEditStudent = canAddStudent;

  // Warden & Admin can delete & reset passwords; Supervisor is restricted
  const canDeleteStudent =
    currentUser?.role === "WARDEN" || currentUser?.role === "ADMIN";

  const canResetPassword =
    currentUser?.role === "WARDEN" || currentUser?.role === "ADMIN";

  useEffect(() => {
    fetchStudents();
  }, [filterBlock]);

  async function fetchStudents() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterBlock !== "ALL") params.append("block", filterBlock);
      if (search) params.append("search", search);

      const res = await api.get(`/students?${params.toString()}`);
      if (res.data?.data) {
        setStudents(res.data.data);
      }
    } catch (err) {
      console.error("Fetch students error:", err);
    } finally {
      setLoading(false);
    }
  }

  const openAddModal = () => {
    setEditingStudent(null);
    setFullName("");
    setEmail("");
    setRoomNumber("Room 101");
    setBlock("Block A");
    setDepartment("Computer Science");
    setPhoneNumber("+91 98765 43210");
    setRole("STUDENT");
    setIsModalOpen(true);
  };

  const openEditModal = (student: User) => {
    setEditingStudent(student);
    setFullName(student.fullName);
    setEmail(student.email);
    setRoomNumber(student.roomNumber || "Room 101");
    setBlock(student.block || "Block A");
    setDepartment(student.department || "Computer Science");
    setPhoneNumber(student.phoneNumber || "");
    setRole(student.role);
    setIsModalOpen(true);
  };

  const openResetPasswordModal = (student: User) => {
    setTargetStudentForPassword(student);
    setAdminNewPassword("Student@" + Math.floor(100 + Math.random() * 900));
    setResetSuccessMessage("");
    setIsResetPasswordOpen(true);
  };

  async function handleSaveStudent(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        fullName,
        email,
        roomNumber,
        block,
        department,
        phoneNumber,
        role,
      };

      if (editingStudent) {
        const res = await api.put(`/students/${editingStudent.id || (editingStudent as any)._id}`, payload);
        if (res.data?.data) {
          setStudents((prev) =>
            prev.map((s) =>
              (s.id || (s as any)._id) === (editingStudent.id || (editingStudent as any)._id)
                ? res.data.data
                : s,
            ),
          );
        }
      } else {
        const res = await api.post("/students", payload);
        if (res.data?.data) {
          setStudents((prev) => [res.data.data, ...prev]);
        }
      }

      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save student");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAdminResetPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetStudentForPassword) return;

    if (adminNewPassword.length < 6) {
      alert("New password must be at least 6 characters long");
      return;
    }

    setResettingPassword(true);
    try {
      const studentId = targetStudentForPassword.id || (targetStudentForPassword as any)._id;
      const res = await api.post(`/students/${studentId}/reset-password`, {
        newPassword: adminNewPassword,
      });

      setResetSuccessMessage(res.data?.message || "Password successfully changed!");
      setTimeout(() => {
        setIsResetPasswordOpen(false);
        setResetSuccessMessage("");
      }, 2500);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to reset password");
    } finally {
      setResettingPassword(false);
    }
  }

  async function handleDeleteStudent(id: string, name: string) {
    if (!canDeleteStudent) {
      alert("Permission Denied: Hostel Supervisors cannot delete student records. Only the Warden or Admin has deletion authorization.");
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete student record: ${name}?`)) return;

    try {
      await api.delete(`/students/${id}`);
      setStudents((prev) => prev.filter((s) => (s.id || (s as any)._id) !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete student");
    }
  }

  const filtered = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.roomNumber?.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="drizzle-badge drizzle-badge-yellow text-[10px] sm:text-xs">
              <ShieldCheck size={12} /> RBAC RESIDENT DIRECTORY & SECURITY
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight mt-1">
            Student Residents Directory
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Admin & Warden: Reset student passwords, edit allocations, and manage records · Supervisor: Add & Update residents.
          </p>
        </div>

        {canAddStudent && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs font-bold text-zinc-950 hover:bg-yellow-300 shadow-sm transition-all cursor-pointer w-full sm:w-auto"
          >
            <Plus size={16} />
            <span>Add New Student</span>
          </button>
        )}
      </div>

      {/* Permission Notice Banner for Supervisor */}
      {currentUser?.role === "SUPERVISOR" && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-start sm:items-center gap-2">
            <ShieldCheck size={16} className="text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              <strong>Supervisor Access:</strong> You can register new students and update room allocations. Password resets and deletions are restricted to the Chief Warden and Admin.
            </span>
          </div>
          <span className="drizzle-badge drizzle-badge-yellow text-[10px] shrink-0">
            ACTIVE PERMISSION
          </span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <Search size={15} className="absolute left-3.5 top-3 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, room, department..."
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111216] pl-10 pr-4 py-2 text-xs outline-hidden focus:border-yellow-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-[11px] sm:text-xs font-mono text-zinc-400 mr-1">Block:</span>
          {["ALL", "Block A", "Block B", "Block C"].map((b) => (
            <button
              key={b}
              onClick={() => setFilterBlock(b)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filterBlock === b
                  ? "bg-yellow-400 text-zinc-950 font-bold"
                  : "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111216] text-zinc-600 dark:text-zinc-400 hover:border-zinc-700"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Students Directory Container */}
      <div className="drizzle-card overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold flex items-center gap-2">
            <Users size={16} className="text-yellow-500" />
            Registered Student Residents
          </h3>
          <span className="text-[10px] sm:text-[11px] font-mono text-zinc-500">
            {filtered.length} students found
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-400 font-mono">
            Loading student directory...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-500">
            No students found matching your criteria.
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Table View (hidden on small mobile screens) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] text-zinc-500 font-mono">
                  <tr>
                    <th className="p-3.5">STUDENT NAME</th>
                    <th className="p-3.5">EMAIL</th>
                    <th className="p-3.5">BLOCK / ROOM</th>
                    <th className="p-3.5">DEPARTMENT</th>
                    <th className="p-3.5">ROLE</th>
                    <th className="p-3.5 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filtered.map((student) => {
                    const id = student.id || (student as any)._id;
                    const isRep = student.role === "STUDENT_COORDINATOR";

                    return (
                      <tr key={id} className="hover:bg-zinc-50/50 dark:hover:bg-[#14151a]">
                        <td className="p-3.5 font-bold text-zinc-900 dark:text-zinc-100">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-lg bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                              {student.fullName?.charAt(0) || "S"}
                            </div>
                            <span className="truncate max-w-[150px]">{student.fullName}</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-zinc-500">{student.email}</td>
                        <td className="p-3.5 font-mono whitespace-nowrap">
                          <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-zinc-700 dark:text-zinc-300">
                            {student.block || "Block A"} · {student.roomNumber || "Room 101"}
                          </span>
                        </td>
                        <td className="p-3.5 text-zinc-500 truncate max-w-[120px]">
                          {student.department || "Computer Science"}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                              isRep
                                ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                                : "bg-zinc-800 text-zinc-400"
                            }`}
                          >
                            {student.role}
                          </span>
                        </td>

                        {/* Perfectly Aligned Desktop Actions Cell */}
                        <td className="p-3.5 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5 p-1 rounded-xl bg-zinc-100/60 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800">
                            {/* Admin / Warden Change Password Button */}
                            {canResetPassword && (
                              <button
                                onClick={() => openResetPasswordModal(student)}
                                className="h-7 w-7 flex items-center justify-center rounded-lg text-amber-500 hover:text-amber-400 hover:bg-amber-500/15 transition-colors cursor-pointer"
                                title={`Change Password for ${student.fullName}`}
                              >
                                <KeyRound size={14} />
                              </button>
                            )}

                            {canEditStudent && (
                              <button
                                onClick={() => openEditModal(student)}
                                className="h-7 w-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-yellow-500 hover:bg-yellow-500/15 transition-colors cursor-pointer"
                                title="Edit Student Allocation"
                              >
                                <Edit2 size={14} />
                              </button>
                            )}

                            {canDeleteStudent ? (
                              <button
                                onClick={() => handleDeleteStudent(id, student.fullName)}
                                className="h-7 w-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/15 transition-colors cursor-pointer"
                                title="Delete Student Record"
                              >
                                <Trash2 size={14} />
                              </button>
                            ) : (
                              <button
                                disabled
                                className="h-7 w-7 flex items-center justify-center rounded-lg text-zinc-600 opacity-40 cursor-not-allowed"
                                title="Supervisors cannot delete student records"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards View (Visible on screens < md) */}
            <div className="md:hidden divide-y divide-zinc-200 dark:divide-zinc-800">
              {filtered.map((student) => {
                const id = student.id || (student as any)._id;
                const isRep = student.role === "STUDENT_COORDINATOR";

                return (
                  <div key={id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-xl bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {student.fullName?.charAt(0) || "S"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                            {student.fullName}
                          </p>
                          <p className="text-[11px] font-mono text-zinc-500 truncate">
                            {student.email}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold shrink-0 ${
                          isRep
                            ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {student.role}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span className="rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-zinc-700 dark:text-zinc-300">
                        {student.block || "Block A"} · {student.roomNumber || "Room 101"}
                      </span>
                      <span className="text-zinc-500 text-[11px]">
                        {student.department || "Computer Science"}
                      </span>
                    </div>

                    {/* Perfectly Aligned Mobile Actions Bar */}
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-end gap-2">
                      {canResetPassword && (
                        <button
                          onClick={() => openResetPasswordModal(student)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold hover:bg-amber-500/20 cursor-pointer"
                        >
                          <KeyRound size={13} />
                          <span>Password</span>
                        </button>
                      )}

                      {canEditStudent && (
                        <button
                          onClick={() => openEditModal(student)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:border-yellow-400 hover:text-yellow-500 cursor-pointer"
                        >
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>
                      )}

                      {canDeleteStudent && (
                        <button
                          onClick={() => handleDeleteStudent(id, student.fullName)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-500/20 cursor-pointer"
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111216] p-5 sm:p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Users size={18} className="text-yellow-500" />
              {editingStudent ? "Edit Student Record" : "Register New Student"}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Enter room allocation and department details.
            </p>

            <form onSubmit={handleSaveStudent} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  FULL NAME
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  required
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-2 text-xs outline-hidden focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  COLLEGE EMAIL
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@campus.in"
                  required
                  disabled={Boolean(editingStudent)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-2 text-xs outline-hidden focus:border-yellow-400 disabled:opacity-60"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    BLOCK
                  </label>
                  <select
                    value={block}
                    onChange={(e) => setBlock(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-2 text-xs outline-hidden focus:border-yellow-400"
                  >
                    <option value="Block A">Block A</option>
                    <option value="Block B">Block B</option>
                    <option value="Block C">Block C</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    ROOM NUMBER
                  </label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="Room 304"
                    required
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-2 text-xs outline-hidden focus:border-yellow-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    DEPARTMENT
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Computer Science"
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-2 text-xs outline-hidden focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    ROLE
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={currentUser?.role === "SUPERVISOR"}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-2 text-xs outline-hidden focus:border-yellow-400"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="STUDENT_COORDINATOR">Student Representative</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-yellow-300"
                >
                  {submitting ? "Saving..." : editingStudent ? "Save Changes" : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin / Warden Reset Student Password Modal */}
      {isResetPasswordOpen && targetStudentForPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setIsResetPasswordOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-yellow-500/40 bg-white dark:bg-[#111216] p-5 sm:p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 text-yellow-500 mb-1">
              <KeyRound size={20} />
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Change Student Password
              </h2>
            </div>
            <p className="text-xs text-zinc-500">
              Set a new secure password for <strong>{targetStudentForPassword.fullName}</strong> ({targetStudentForPassword.email}).
            </p>

            <form onSubmit={handleAdminResetPasswordSubmit} className="mt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-mono text-zinc-400">
                    NEW PASSWORD
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setAdminNewPassword(
                        "Pass@" + Math.floor(1000 + Math.random() * 9000),
                      )
                    }
                    className="text-[11px] font-mono text-yellow-500 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={11} /> Generate
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={adminNewPassword}
                    onChange={(e) => setAdminNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 chars)"
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] pl-3.5 pr-10 py-2 text-xs outline-hidden focus:border-yellow-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {resetSuccessMessage && (
                <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs flex items-center gap-2">
                  <CheckCircle2 size={15} />
                  <span>{resetSuccessMessage}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordOpen(false)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingPassword}
                  className="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-yellow-300 shadow-sm"
                >
                  {resettingPassword ? "Updating..." : "Update Student Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
