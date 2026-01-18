import api from "./axios";

/**
 * ✅ Admin Chat API
 * Assumes backend exposes:
 * GET  /api/admin/chat/threads
 * GET  /api/admin/chat/threads/:threadId/messages
 */

export type AdminChatThread = {
  _id: string;

  job?: {
    _id?: string;
    title?: string;
  };

  customer?: {
    _id?: string;
    name?: string;
  };

  provider?: {
    _id?: string;
    name?: string;
  };

  status?: "ACTIVE" | "CLOSED";
  unlockedAt?: string;
  lastMessageAt?: string;

  createdAt?: string;
  updatedAt?: string;
};

export type AdminChatMessage = {
  _id: string;
  thread?: string;

  sender?: {
    _id?: string;
    name?: string;
  };

  senderRole?: string;
  message?: string;

  createdAt?: string;
  updatedAt?: string;
};

export async function fetchAdminChatThreads() {
  const res = await api.get<{ threads: AdminChatThread[] }>(`/api/admin/chat/threads`);
  return res.data;
}

export async function fetchAdminChatMessages(threadId: string) {
  if (!threadId) throw new Error("threadId is required");
  const res = await api.get<{ messages: AdminChatMessage[] }>(
    `/api/admin/chat/threads/${threadId}/messages`
  );
  return res.data;
}