import type { Profile, TokenResponse, User } from "@/types";

import { request } from "./api";

export function register(name: string, email: string, password: string) {
  return request<User>("/auth/register", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ name, email, password }),
  });
}

export function login(email: string, password: string) {
  return request<TokenResponse>("/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ email, password }),
  });
}

export function getMe() {
  return request<Profile>("/auth/me");
}
