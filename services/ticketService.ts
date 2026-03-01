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
    console.log("=== TicketService: Creating ticket ===");
    console.log("Title:", title);
    console.log("Category:", category);
    console.log("Priority:", priority);

    const response = await apiClient.post<{ ticket: Ticket; message?: string }>(
      "/tickets",
      {
        title,
        description,
        category,
        priority,
      },
    );

    console.log("=== TicketService: Response Received ===");
    console.log("Has Error:", !!response.error);
    console.log("Error:", response.error);
    console.log("Has Data:", !!response.data);
    console.log("Full Response Data:", JSON.stringify(response.data, null, 2));

    if (response.error) {
      console.error("❌ TicketService: Create ticket error:", response.error);
      throw new Error(response.error);
    }

    if (!response.data) {
      console.error("❌ TicketService: No data in response");
      throw new Error("No response data from server");
    }

    const ticketId = response.data?.ticket?.id;
    console.log("Extracted Ticket ID:", ticketId);
    console.log("Ticket ID Type:", typeof ticketId);

    if (ticketId === undefined || ticketId === null) {
      console.error("❌ TicketService: No ticket ID in response");
      console.error("Response data:", response.data);
      throw new Error("Failed to create ticket - no ID returned");
    }

    console.log("✅ TicketService: Ticket created successfully, ID:", ticketId);
    return ticketId;
  }

  async getTicketById(ticketId: number): Promise<TicketWithUser | null> {
    const response = await apiClient.get<{
      ticket: TicketWithUser;
      comments: Comment[];
      attachments: Attachment[];
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
      attachments: Attachment[];
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

  async uploadFile(
    fileUri: string,
    fileName: string,
    mimeType: string,
  ): Promise<string> {
    console.log("TicketService: Uploading file:", {
      fileUri,
      fileName,
      mimeType,
    });

    const response = await apiClient.uploadFile(
      "/tickets/upload",
      fileUri,
      fileName,
      mimeType,
    );

    if (response.error) {
      console.error("TicketService: Upload error:", response.error);
      throw new Error(response.error);
    }

    if (!response.data?.file?.path) {
      throw new Error("Invalid upload response");
    }

    console.log(
      "TicketService: File uploaded successfully:",
      response.data.file.path,
    );
    return response.data.file.path;
  }

  async addAttachment(
    ticketId: number,
    fileName: string,
    filePath: string,
    fileType?: string,
    fileSize?: number,
  ): Promise<void> {
    console.log("TicketService: Adding attachment:", {
      ticketId,
      fileName,
      filePath,
      fileType,
      fileSize,
    });

    const response = await apiClient.post(`/tickets/${ticketId}/attachments`, {
      file_name: fileName,
      file_path: filePath,
      file_type: fileType,
      file_size: fileSize,
    });

    console.log("TicketService: Add attachment response:", {
      hasError: !!response.error,
      hasData: !!response.data,
      response: response.data,
    });

    if (response.error) {
      console.error("Failed to add attachment:", response.error);
      throw new Error(response.error);
    }
  }

  async getTicketAttachments(ticketId: number): Promise<Attachment[]> {
    console.log("TicketService: Fetching attachments for ticket", ticketId);
    const response = await apiClient.get<{
      ticket: TicketWithUser;
      comments: Comment[];
      attachments: Attachment[];
    }>(`/tickets/${ticketId}`);

    console.log("TicketService: Attachments response:", {
      hasError: !!response.error,
      hasData: !!response.data,
      attachmentsCount: response.data?.attachments?.length || 0,
      attachments: response.data?.attachments,
    });

    if (response.error) {
      console.error(
        "TicketService: Error fetching attachments:",
        response.error,
      );
      return [];
    }

    return response.data?.attachments || [];
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
