export type AuthUser = {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type FieldErrors = Record<string, string[]>;
