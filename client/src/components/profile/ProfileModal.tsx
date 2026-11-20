import React, { useState } from "react";
import { useAuth } from "../../context/useAuth";
import { api } from "../../lib/api";
import {
  User,
  KeyRound,
  Camera,
  CheckCircle2,
  X,
  Lock,
  Phone,
  ShieldAlert,
  Sparkles,
  Upload,
  Trash2,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=Alex",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Sam",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Jordan",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Taylor",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Morgan",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Casey",
];

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"PROFILE" | "PASSWORD">("PROFILE");

  // Profile Details State
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [emergencyContact, setEmergencyContact] = useState(user?.emergencyContact || "");
  const [roomNumber, setRoomNumber] = useState(user?.roomNumber || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  if (!isOpen) return null;

  // Students and Student Representatives cannot edit official Name & Room Allocation
  const isNameRoomRestricted =
    user?.role === "STUDENT" || user?.role === "STUDENT_COORDINATOR";

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Please upload an image smaller than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUnselectAvatar = () => {
    setAvatarUrl("");
  };

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(false);

    try {
      const payload: any = {
        phoneNumber,
        emergencyContact,
        avatarUrl,
      };

      // Only staff/admins can modify official name/room via self profile
      if (!isNameRoomRestricted) {
        payload.fullName = fullName;
        payload.roomNumber = roomNumber;
      }

      const res = await api.put("/auth/profile", payload);

      if (res.data?.data) {
        // Update user profile in localStorage
        const storedUser = localStorage.getItem("authUser");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          const updated = { ...parsed, ...res.data.data.user };
          localStorage.setItem("authUser", JSON.stringify(updated));
        }
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setSavingPassword(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-yellow-500/40 bg-white dark:bg-[#111216] p-5 sm:p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-yellow-400 text-zinc-950 flex items-center justify-center font-bold">
              <User size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Account & Security Settings
              </h2>
              <p className="text-[11px] text-zinc-500 font-mono">
                {user?.email} · [ROLE: {user?.role}]
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] p-1 text-xs mt-4 mb-4">
          <button
            onClick={() => setActiveTab("PROFILE")}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === "PROFILE"
                ? "bg-yellow-400 text-zinc-950 shadow-xs font-bold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            Profile Picture & Details
          </button>
          <button
            onClick={() => setActiveTab("PASSWORD")}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === "PASSWORD"
                ? "bg-yellow-400 text-zinc-950 shadow-xs font-bold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            Change Password
          </button>
        </div>

        {/* TAB 1: Profile & Avatar */}
        {activeTab === "PROFILE" && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Student/Representative Name & Room Lock Info Banner */}
            {isNameRoomRestricted && (
              <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
                <Lock size={15} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Official Administrative Record:</strong> Student full name and room allocation are managed exclusively by the Hostel Supervisor and Warden. You can freely update your profile picture, personal phone, emergency contact, and password.
                </div>
              </div>
            )}

            {/* Avatar Preview & Upload */}
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-2">
                PROFILE PICTURE
              </label>
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 rounded-2xl border-2 border-yellow-400/50 bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="font-bold text-lg text-yellow-500 flex items-center justify-center">
                      {fullName?.charAt(0) || "U"}
                    </div>
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-1.5 text-xs font-semibold hover:border-yellow-400 cursor-pointer transition-colors">
                      <Upload size={14} className="text-yellow-500" />
                      <span>Upload Image File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={handleUnselectAvatar}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 cursor-pointer transition-colors"
                      >
                        <Trash2 size={13} />
                        <span>Unselect Picture</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[10px] text-zinc-400">
                    JPG, PNG or SVG under 2MB. Unselecting restores your clean initial badge.
                  </p>
                </div>
              </div>

              {/* Preset Avatars */}
              <div className="mt-3">
                <p className="text-[10px] font-mono text-zinc-400 mb-1.5">Or pick/unpick an avatar:</p>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {/* Default Initials Tile */}
                  <button
                    type="button"
                    onClick={handleUnselectAvatar}
                    className={`h-9 w-9 rounded-xl border-2 font-bold text-xs flex items-center justify-center shrink-0 transition-transform cursor-pointer ${
                      !avatarUrl
                        ? "border-yellow-400 bg-yellow-400/20 text-yellow-500 scale-105"
                        : "border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                    }`}
                    title="Default Initials Avatar"
                  >
                    {fullName?.charAt(0) || "U"}
                  </button>

                  {PRESET_AVATARS.map((av, i) => {
                    const isSelected = avatarUrl === av;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setAvatarUrl(isSelected ? "" : av)}
                        className={`h-9 w-9 rounded-xl border-2 overflow-hidden p-0.5 shrink-0 transition-transform cursor-pointer ${
                          isSelected ? "border-yellow-400 scale-105" : "border-transparent hover:border-zinc-600"
                        }`}
                        title={isSelected ? "Click to unselect" : `Choose avatar ${i + 1}`}
                      >
                        <img src={av} alt={`Preset ${i}`} className="h-full w-full" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 mb-1">
                  <span>FULL NAME</span>
                  {isNameRoomRestricted && (
                    <span title="Locked official record" className="inline-flex items-center">
                      <Lock size={12} className="text-amber-500" />
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={isNameRoomRestricted}
                  className={`w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-2 text-xs outline-hidden focus:border-yellow-400 ${
                    isNameRoomRestricted ? "opacity-60 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900" : ""
                  }`}
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 mb-1">
                  <span>ROOM NUMBER</span>
                  {isNameRoomRestricted && (
                    <span title="Locked official record" className="inline-flex items-center">
                      <Lock size={12} className="text-amber-500" />
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="Room 204"
                  disabled={isNameRoomRestricted}
                  className={`w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-2 text-xs outline-hidden focus:border-yellow-400 ${
                    isNameRoomRestricted ? "opacity-60 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900" : ""
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">PHONE NUMBER</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-2 text-xs outline-hidden focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">EMERGENCY CONTACT</label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="Parent / Guardian Phone"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-2 text-xs outline-hidden focus:border-yellow-400"
                />
              </div>
            </div>

            {profileSuccess && (
              <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs flex items-center gap-2">
                <CheckCircle2 size={15} />
                <span>Profile updated successfully!</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={savingProfile}
                className="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-yellow-300"
              >
                {savingProfile ? "Saving..." : "Save Profile Details"}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Change Password */}
        {activeTab === "PASSWORD" && (
          <form onSubmit={handleChangePassword} className="space-y-3.5">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                CURRENT PASSWORD
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3.5 py-2 text-xs outline-hidden focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                NEW PASSWORD (MIN 6 CHARACTERS)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3.5 py-2 text-xs outline-hidden focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                CONFIRM NEW PASSWORD
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3.5 py-2 text-xs outline-hidden focus:border-yellow-400"
              />
            </div>

            {passwordError && (
              <div className="p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs flex items-center gap-2">
                <ShieldAlert size={15} />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs flex items-center gap-2">
                <CheckCircle2 size={15} />
                <span>Password changed successfully!</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingPassword}
                className="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-yellow-300"
              >
                {savingPassword ? "Updating Password..." : "Update Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
