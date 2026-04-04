export type AuthUser = {
  id?: number;
  full_name?: string;
  email?: string;
  student_id?: string;
  phone?: string;
  role?: string;
  is_verified?: number;
  verified_at?: string | null;
  updated_at?: string;
  created_at?: string;
  ticket_count?: number;
};

export type ApiStats = {
  totalUsers?: number;
  verifiedUsers?: number;
  pendingVerificationUsers?: number;
  totalTickets?: number;
  pendingTickets?: number;
  resolvedTickets?: number;
};

export type Ticket = {
  id: number;
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  status?: string;
  user_id?: number;
  user_name?: string;
  user_email?: string;
  student_id?: string;
  comment_count?: number;
  created_at?: string;
  updated_at?: string;
};

export type TicketComment = {
  id: number;
  ticket_id: number;
  user_id: number;
  user_name?: string;
  user_role?: string;
  comment: string;
  created_at?: string;
};

export type TicketAttachment = {
  id: number;
  ticket_id: number;
  file_name: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  uploaded_at?: string;
};

export type NotificationItem = {
  id: number;
  ticket_id?: number;
  title: string;
  message: string;
  type?: string;
  is_read?: number | boolean;
  created_at?: string;
};

const TOKEN_KEY = "reporting_auth_token";
const USER_KEY = "reporting_user";
const API_BASE_KEY = "reporting_api_base_url";
const DEFAULT_API_BASE_URL = "http://localhost:3000/api";

export function getApiBaseUrl() {
  return localStorage.getItem(API_BASE_KEY)?.trim() || DEFAULT_API_BASE_URL;
}

export function getApiOrigin() {
  const baseUrl = getApiBaseUrl();
  return baseUrl.replace(/\/api\/?$/, "");
}

export function getAttachmentUrl(filePath?: string) {
  if (!filePath) return "";
  const normalizedPath = filePath.startsWith("/") ? filePath : `/${filePath}`;
  return `${getApiOrigin()}${normalizedPath}`;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

type ApiRequestInit = Omit<RequestInit, "body"> & { body?: unknown };

async function request<T>(endpoint: string, init?: ApiRequestInit): Promise<T> {
  const headers = new Headers(init?.headers || {});
  headers.set("Content-Type", "application/json");

  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
    ...init,
    headers,
    body:
      init?.body &&
      typeof init.body !== "string" &&
      !(init.body instanceof FormData)
        ? JSON.stringify(init.body)
        : (init?.body as BodyInit | null | undefined),
  });

  let payload: any = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    throw new Error(payload.error || payload.message || "Request failed");
  }

  return payload as T;
}

export async function login(email: string, password: string) {
  const payload = await request<{ token: string; user: AuthUser }>(
    "/auth/login",
    {
      method: "POST",
      body: { email: email.trim().toLowerCase(), password },
    },
  );
  setSession(payload.token, payload.user);
  return payload;
}

export function logout() {
  clearSession();
}

export async function me() {
  return request<{ user: AuthUser }>("/auth/me");
}

export async function getStats() {
  return request<{ stats: ApiStats }>("/users/stats");
}

export async function getUsers() {
  return request<{ users: Array<AuthUser & { created_at?: string }> }>(
    "/users",
  );
}

export async function createUser(input: {
  email: string;
  password: string;
  full_name: string;
  student_id?: string;
  phone?: string;
  role?: "student" | "admin";
  is_verified?: boolean;
}) {
  return request<{ message: string; user: AuthUser }>("/users", {
    method: "POST",
    body: input,
  });
}

export async function updateUser(
  userId: number,
  input: {
    email?: string;
    password?: string;
    full_name?: string;
    student_id?: string;
    phone?: string;
    role?: "student" | "admin";
    is_verified?: boolean;
  },
) {
  return request<{ message: string; user: AuthUser }>(`/users/${userId}`, {
    method: "PATCH",
    body: input,
  });
}

export async function verifyUser(userId: number) {
  return request<{ message: string; user: AuthUser }>(
    `/users/${userId}/verify`,
    {
      method: "PATCH",
    },
  );
}

export async function deleteUser(userId: number) {
  return request<{ message: string }>(`/users/${userId}`, {
    method: "DELETE",
  });
}

export async function getTickets() {
  return request<{ tickets: Ticket[] }>("/tickets");
}

export async function getTicketDetails(ticketId: number) {
  return request<{
    ticket: Ticket;
    comments: TicketComment[];
    attachments: TicketAttachment[];
  }>(`/tickets/${ticketId}`);
}

export async function updateTicketStatus(
  ticketId: number,
  status: "pending" | "in-progress" | "resolved" | "closed",
) {
  return request<{ message: string; ticket: Ticket }>(
    `/tickets/${ticketId}/status`,
    {
      method: "PATCH",
      body: { status },
    },
  );
}

export async function addTicketComment(ticketId: number, comment: string) {
  return request<{ message: string; comment: TicketComment }>(
    `/tickets/${ticketId}/comments`,
    {
      method: "POST",
      body: { comment },
    },
  );
}

export async function deleteTicket(ticketId: number) {
  return request<{ message: string }>(`/tickets/${ticketId}`, {
    method: "DELETE",
  });
}

export async function getNotifications() {
  return request<{ notifications: NotificationItem[] }>("/notifications");
}

export async function getUnreadNotificationCount() {
  return request<{ count: number }>("/notifications/unread-count");
}

export async function markNotificationAsRead(notificationId: number) {
  return request<{ message: string }>(`/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsAsRead() {
  return request<{ message: string }>("/notifications/mark-all-read", {
    method: "PATCH",
  });
}

export async function deleteNotification(notificationId: number) {
  return request<{ message: string }>(`/notifications/${notificationId}`, {
    method: "DELETE",
  });
}
