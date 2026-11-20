export type Role =
  | "STUDENT"
  | "STUDENT_COORDINATOR"
  | "SUPERVISOR"
  | "WARDEN"
  | "MESS_COORDINATOR"
  | "ADMIN";

export interface User {
  id?: string;
  _id?: string;
  email: string;
  role: Role;
  fullName: string;
  avatarUrl?: string;
  roomNumber?: string;
  block?: string;
  department?: string;
  phoneNumber?: string;
  emergencyContact?: string;
  status?: "ACTIVE" | "ON_LEAVE" | "GRADUATED" | "SUSPENDED";
}
