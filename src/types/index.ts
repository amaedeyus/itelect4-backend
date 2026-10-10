
import { Types } from "mongoose";

// ===== ENUMS =====
export enum Role {
  Student = "student",
  SecurityAdmin = "security_admin",
}

export enum ClaimStatus {
  Pending = "pending",
  Verified = "verified",
  Rejected = "rejected",
}

// ===== ID TYPES =====

// IDs received through API requests are strings.
// MongoDB document references use ObjectId internally.
export type ID = string;
export type MongoId = Types.ObjectId;

// ===== INTERFACES =====

// Public user data. Never include the password here.
export interface User {
  id: ID;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt?: Date;
}

// Used internally by authentication code and the User model.
// Do not send this interface directly in API responses.
export interface UserRecord extends User {
  password: string;
}

// ===== LOST AND FOUND ITEMS =====
export interface LostFoundItem {
  id: ID;
  title: string;
  description: string;
  type: "lost" | "found";
  reporterId: MongoId;
  createdAt: Date;
}

// ===== CLAIMS =====
export interface Claim {
  id: ID;
  itemId: MongoId;
  claimantId: MongoId;
  status: ClaimStatus;
  notes?: string;
  createdAt?: Date;
}

// ===== GENERIC INTERFACE =====
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ===== UTILITY TYPES =====

// Only allow editable item fields.
// IDs, ownership, and creation dates cannot be changed
// through a regular item update.
export type ItemUpdate = Partial<
  Pick<LostFoundItem, "title" | "description" | "type">
>;

export type ItemPreview = Pick<
  LostFoundItem,
  "id" | "title" | "type"
>;

// ===== OTHER TYPE ALIASES =====
export type Coordinate = {
  x: number;
  y: number;
};

export type Formatter = (value: number) => string;

export type StringOrNumber = string | number;

export type Status = "pending" | "active" | "inactive";

// ===== INTERSECTION TYPES =====
export type StudentWithItems = User & {
  reportedItems: LostFoundItem[];
  claimsSubmitted: Claim[];
};