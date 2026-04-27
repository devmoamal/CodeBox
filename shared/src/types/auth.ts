export interface User {
  id: string;
  username: string;
}

export interface LoginBody {
  username: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface MeResponse {
  user: User;
}
