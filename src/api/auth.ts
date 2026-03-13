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

interface UploadableProfileImage {
  uri: string;
  fileName?: string;
  mimeType?: string;
  type?: string;
  file?: File;
}

export async function updateProfile(
  payload: UpdateProfilePayload,
  profileImage?: string | UploadableProfileImage,
): Promise<UserProfile> {
  if (profileImage) {
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    if (typeof profileImage === "string") {
      if (!profileImage.startsWith("http")) {
        formData.append("profile_image", {
          uri: profileImage,
          name: `profile-${Date.now()}.jpg`,
          type: "image/jpeg",
        } as any);
      }
    } else if (profileImage.file instanceof File) {
      formData.append("profile_image", profileImage.file);
    } else if (
      profileImage.uri.startsWith("blob:") ||
      profileImage.uri.startsWith("data:")
    ) {
      const blobResponse = await fetch(profileImage.uri);
      const blob = await blobResponse.blob();
      const fallbackName = profileImage.fileName || `profile-${Date.now()}.jpg`;
      const file = new File([blob], fallbackName, {
        type:
          profileImage.mimeType ||
          profileImage.type ||
          blob.type ||
          "image/jpeg",
      });
      formData.append("profile_image", file);
    } else {
      formData.append("profile_image", {
        uri: profileImage.uri,
        name: profileImage.fileName || `profile-${Date.now()}.jpg`,
        type: profileImage.mimeType || profileImage.type || "image/jpeg",
      } as any);
    }

    const response = await apiClient.patch<UserProfile>(
      "/auth/profile/",
      formData,
      {
        headers: { "Content-Type": undefined },
        transformRequest: [(data: any) => data],
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
