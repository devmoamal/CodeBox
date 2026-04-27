import api from "@/lib/api";
import { LoginBody, AuthResponse, MeResponse } from "@codebox/shared";

export const AuthService = {
  login: async (credentials: LoginBody): Promise<AuthResponse> => {
    return api.post<AuthResponse>("/auth/login", credentials);
  },

  me: async (): Promise<MeResponse> => {
    return api.get<MeResponse>("/auth/me");
  },
};
