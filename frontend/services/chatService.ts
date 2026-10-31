import type { Conversation, ConversationDetail, SendMessageResponse } from "@/types";

import { request } from "./api";

export function getConversations() {
  return request<Conversation[]>("/conversations");
}

export function createConversation(title?: string) {
  return request<Conversation>("/conversations", {
    method: "POST",
    body: JSON.stringify(title ? { title } : {}),
  });
}

export function getConversation(id: number) {
  return request<ConversationDetail>(`/conversations/${id}`);
}

export function renameConversation(id: number, title: string) {
  return request<Conversation>(`/conversations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

export function deleteConversation(id: number) {
  return request<void>(`/conversations/${id}`, { method: "DELETE" });
}

export function sendMessage(id: number, content: string) {
  return request<SendMessageResponse>(`/conversations/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}
