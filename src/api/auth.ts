import { apiClient } from "./client";
import { getRefreshToken, saveTokens } from "./tokenStorage";
import type {
    LoginRequest,
    LogoutRequest,
    RegisterRequest,
    RegisterResponse,
    TokenPair,
    UserProfile,
} from "./types";

export async function register(
  payload: RegisterRequest,
): Promise<RegisterResponse> {
  const response = await apiClient.post<RegisterResponse>(
    "/auth/register/",
    payload,
  );
  return response.data;
}

export async function login(payload: LoginRequest): Promise<TokenPair> {
  const response = await apiClient.post<TokenPair>("/token/", payload);
  return response.data;
}

export async function logout(): Promise<void> {
  const refresh = await getRefreshToken();
  if (!refresh) return;

  const payload: LogoutRequest = { refresh };
  await apiClient.post("/auth/logout/", payload);
}

export async function getProfile(): Promise<UserProfile> {
  const response = await apiClient.get<UserProfile>("/auth/profile/");
  return response.data;
}

export interface UpdateProfilePayload {
  name?: string;
  business_name?: string;
  business_type?: string;
}

export async function updateProfile(
  payload: UpdateProfilePayload,
  profileImageUri?: string,
): Promise<UserProfile> {
  if (profileImageUri) {
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    if (profileImageUri.startsWith("http")) {
      formData.append("profile_image", profileImageUri);
    } else {
      formData.append("profile_image", {
        uri: profileImageUri,
        name: `profile-${Date.now()}.jpg`,
        type: "image/jpeg",
      } as any);
    }

    const response = await apiClient.patch<UserProfile>(
      "/auth/profile/",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  }

  const response = await apiClient.patch<UserProfile>(
    "/auth/profile/",
    payload,
  );
  return response.data;
}

export async function saveAuthTokens(tokens: TokenPair): Promise<void> {
  await saveTokens(tokens.access, tokens.refresh);
}

// ── OTP Auth Flow ─────────────────────────────────────────────────────────────

export interface OtpRequestResponse {
  verification_id: string;
  expires_in: number;
  message: string;
  code?: string; // MOCK MODE only — not present in production
}

export interface OtpVerifyResponse {
  user: UserProfile;
  tokens: TokenPair;
  is_new_user: boolean;
}

export async function requestOtp(phone: string): Promise<OtpRequestResponse> {
  const response = await apiClient.post<OtpRequestResponse>(
    "/auth/request-otp/",
    { phone },
  );
  return response.data;
}

export async function verifyOtp(
  verification_id: string,
  code: string,
): Promise<OtpVerifyResponse> {
  const response = await apiClient.post<OtpVerifyResponse>(
    "/auth/verify-otp/",
    { verification_id, code },
  );
  return response.data;
}

export async function resendOtp(
  verification_id: string,
): Promise<OtpRequestResponse> {
  const response = await apiClient.post<OtpRequestResponse>(
    "/auth/resend-otp/",
    { verification_id },
  );
  return response.data;
}
