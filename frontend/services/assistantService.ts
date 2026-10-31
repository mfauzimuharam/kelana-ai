import type { AnswerResponse } from "@/types";

import { request } from "./api";

export function askAssistant(question: string) {
  return request<AnswerResponse>("/assistant", { method: "POST", body: JSON.stringify({ question }) });
}
