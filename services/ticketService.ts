import {
  Attachment,
  Comment,
  StatusHistory,
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  TicketWithUser,
} from "../types";
import { apiClient } from "../utils/apiClient";

export class TicketService {
  constructor() {}

  async createTicket(
    userId: number,
    title: string,
    description: string,
    category: TicketCategory,
    priority: TicketPriority = "medium",
  ): Promise<number> {
    console.log("TicketService: Creating ticket:", {
      title,
      category,
      priority,
    });

    const response = await apiClient.post<{ ticket: Ticket; message?: string }>(
      "/tickets",
      {
        title,
        description,
        category,
        priority,
      },
    );

    console.log("TicketService: Create ticket response:", {
      hasError: !!response.error,
      hasData: !!response.data,
      hasTicket: !!response.data?.ticket,
      ticketId: response.data?.ticket?.id,
    });

    if (response.error) {
      console.error("TicketService: Create ticket error:", response.error);
      throw new Error(response.error);
    }

    const ticketId = response.data?.ticket?.id;
    if (!ticketId && ticketId !== 0) {
      console.error("TicketService: No ticket ID in response", response.data);
      throw new Error("Failed to create ticket");
    }

    console.log("TicketService: Ticket created successfully, ID:", ticketId);
    return ticketId;
  }

  async getTicketById(ticketId: number): Promise<TicketWithUser | null> {
    const response = await apiClient.get<{
      ticket: TicketWithUser;
      comments: Comment[];
    }>(`/tickets/${ticketId}`);

    if (response.error) {
      return null;
    }

    return response.data?.ticket || null;
  }

  async getUserTickets(userId: number): Promise<Ticket[]> {
    const response = await apiClient.get<{ tickets: Ticket[] }>("/tickets");

    if (response.error) {
      return [];
    }

    return response.data?.tickets || [];
  }

  async getAllTickets(filters?: {
    status?: TicketStatus;
    category?: TicketCategory;
    priority?: TicketPriority;
  }): Promise<TicketWithUser[]> {
    const response = await apiClient.get<{ tickets: TicketWithUser[] }>(
      "/tickets",
    );

    if (response.error) {
      return [];
    }

    let tickets = response.data?.tickets || [];

    // Apply client-side filtering if needed
    if (filters?.status) {
      tickets = tickets.filter((t) => t.status === filters.status);
    }
    if (filters?.category) {
      tickets = tickets.filter((t) => t.category === filters.category);
    }
    if (filters?.priority) {
      tickets = tickets.filter((t) => t.priority === filters.priority);
    }

    return tickets;
  }

  async updateTicketStatus(
    ticketId: number,
    newStatus: TicketStatus,
    changedBy: number,
  ): Promise<void> {
    const response = await apiClient.patch(`/tickets/${ticketId}/status`, {
      status: newStatus,
    });

    if (response.error) {
      throw new Error(response.error);
    }
  }

  async addComment(
    ticketId: number,
    userId: number,
    comment: string,
  ): Promise<void> {
    const response = await apiClient.post(`/tickets/${ticketId}/comments`, {
      comment,
    });

    if (response.error) {
      throw new Error(response.error);
    }
  }

  async getTicketComments(ticketId: number): Promise<Comment[]> {
    const response = await apiClient.get<{
      ticket: TicketWithUser;
      comments: Comment[];
    }>(`/tickets/${ticketId}`);

    if (response.error) {
      return [];
    }

    return response.data?.comments || [];
  }

  async getTicketStatusHistory(ticketId: number): Promise<StatusHistory[]> {
    // Status history not implemented in API yet - return empty array
    return [];
  }

  async addAttachment(
    ticketId: number,
    fileName: string,
    filePath: string,
    fileType?: string,
    fileSize?: number,
  ): Promise<void> {
    // Attachments not implemented in API yet
    console.warn("Attachments not yet supported with API");
  }

  async getTicketAttachments(ticketId: number): Promise<Attachment[]> {
    // Attachments not implemented in API yet - return empty array
    return [];
  }

  async getTicketStats(userId?: number) {
    // Get user's own tickets instead of calling admin-only stats endpoint
    const response = await apiClient.get<{ tickets: Ticket[] }>("/tickets");

    if (response.error || !response.data?.tickets) {
      console.warn("Failed to get ticket stats:", response.error);
      return {
        pending: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
        total: 0,
      };
    }

    const tickets = response.data.tickets;
    return {
      pending: tickets.filter((t) => t.status === "pending").length,
      inProgress: tickets.filter((t) => t.status === "in-progress").length,
      resolved: tickets.filter((t) => t.status === "resolved").length,
      closed: tickets.filter((t) => t.status === "closed").length,
      total: tickets.length,
    };
  }
}
