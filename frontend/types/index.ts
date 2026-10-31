export type TripCategory = "Backpacker" | "Standard" | "Luxury";

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface Profile extends User {
  total_trips: number;
  total_conversations: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface TripInput {
  destination: string;
  days: number;
  budget: number;
  travel_style?: string | null;
  country?: string | null;
  currency?: string;
  travel_month?: string | null;
}

export interface Trip {
  id: number;
  user_id: number;
  destination: string;
  country: string | null;
  days: number;
  budget: number;
  currency: string;
  travel_style: string | null;
  travel_month: string | null;
  season: string | null;
  category: TripCategory;
  daily_budget: number;
  recommended_transport: string;
  ai_recommendation: string | null;
  created_at: string;
  updated_at: string | null;
}

export type TripSort = "latest" | "oldest" | "budget_desc" | "budget_asc";

export interface GenerateResponse {
  trip_id: number;
  destination: string;
  recommendation: string;
}

export interface Source {
  name: string;
  title?: string | null;
  excerpt?: string | null;
}

export interface AnswerResponse {
  question: string;
  answer: string;
  sources: Source[];
  mode: "knowledge_base" | "local";
}

export interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string | null;
  message_count: number;
  last_message: string | null;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ConversationDetail extends Conversation {
  messages: ChatMessage[];
}

export interface SendMessageResponse {
  conversation: Conversation;
  user_message: ChatMessage;
  assistant_message: ChatMessage;
}
