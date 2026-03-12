export interface TokenPair {
  access: string;
  refresh: string;
}

export interface UserProfile {
  id: number;
  phone: string;
  name: string;
  business_name?: string | null;
  business_type?: string | null;
  profile_image?: string | null;
}

export interface RegisterRequest {
  phone: string;
  name: string;
  password: string;
  confirm_password: string;
}

export interface RegisterResponse {
  user: {
    id: number;
    phone: string;
    name: string;
  };
  tokens: TokenPair;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LogoutRequest {
  refresh: string;
}

export interface RefreshTokenRequest {
  refresh: string;
}

export interface RefreshTokenResponse {
  access: string;
  refresh: string;
}
