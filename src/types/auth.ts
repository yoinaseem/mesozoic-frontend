export type AuthUser = {
  id: number;
  name: string;
  email: string;
  roles: string[];
  // Effective permissions = role-derived ∪ direct.
  permissions: string[];
  // Subset of `permissions` granted directly (not via a role).
  direct_permissions: string[];
  // Hotels this user manages (empty for non-hotel-managers).
  managed_hotel_ids: number[];
  created_at: string;
  updated_at: string;
};

export type Permission = {
  id: number;
  name: string;
  guard_name: string;
};

export type Role = {
  id: number;
  name: string;
  guard_name: string;
  is_system: boolean;
  users_count?: number;
  permissions: string[];
  created_at: string;
  updated_at: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type FieldErrors = Record<string, string[]>;

export type Paginated<T> = {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
};
