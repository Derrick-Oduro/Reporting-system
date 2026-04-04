export type UserRole = "student" | "admin";

export interface User {
  id: number;
  email: string;
  password?: string;
  full_name: string;
  student_id?: string;
  phone?: string;
  role: UserRole;
  created_at: string;
}

export type TicketStatus = "pending" | "in-progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high";
export type TicketCategory =
  | "transcript"
  | "missing-result"
  | "registration"
  | "academic"
  | "administrative"
  | "other";

export interface Ticket {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface TicketWithUser extends Ticket {
  user_email: string;
  user_name: string;
  student_id?: string;
  comment_count?: number;
}

export interface Attachment {
  id: number;
  ticket_id: number;
  file_name: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  uploaded_at: string;
}

export interface Comment {
  id: number;
  ticket_id: number;
  user_id: number;
  comment: string;
  created_at: string;
  user_name?: string;
  user_role?: UserRole;
}

export interface StatusHistory {
  id: number;
  ticket_id: number;
  old_status?: TicketStatus;
  new_status: TicketStatus;
  changed_by: number;
  changed_at: string;
  changed_by_name?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  ticket_id?: number;
  title: string;
  message: string;
  type: string;
  is_read: number;
  created_at: string;
}
