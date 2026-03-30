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

const resolveImageUrl = (url?: string): string => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${process.env.EXPO_PUBLIC_API_BASE_URL}${url}`;
};

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
  return {
    ...response.data,
    profile_image: resolveImageUrl(response.data.profile_image ?? undefined),
  };
}

export interface UpdateProfilePayload {
  name?: string;
  business_name?: string;
  business_type?: string;
  // NOTE: profile_image must NEVER be added here as a string.
  // Images are always uploaded via the second argument as a file.
}

export interface UploadableProfileImage {
  uri: string;
  fileName?: string;
  mimeType?: string;
  type?: string;
  file?: File;
}

export async function updateProfile(
  payload: UpdateProfilePayload,
  profileImage?: UploadableProfileImage,
): Promise<UserProfile> {
  if (profileImage) {
    const formData = new FormData();

    // Append only text fields — never append profile_image as a string
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    // Web: File object directly (e.g. from <input type="file">)
    if (profileImage.file instanceof File) {
      formData.append("profile_image", profileImage.file);

      // Web: blob: or data: URI — convert to File first
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

      // Native (iOS/Android): local file:// URI
    } else {
      const uri = profileImage.uri;
      const fileName =
        profileImage.fileName ||
        uri.split("/").pop() ||
        `profile-${Date.now()}.jpg`;
      const mimeType =
        profileImage.mimeType || profileImage.type || "image/jpeg";

      formData.append("profile_image", {
        uri,
        name: fileName,
        type: mimeType,
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
    return {
      ...response.data,
      profile_image: resolveImageUrl(response.data.profile_image ?? undefined),
    };
  }

  // No new image — plain JSON, text fields only
  const response = await apiClient.patch<UserProfile>(
    "/auth/profile/",
    payload,
  );
  return {
    ...response.data,
    profile_image: resolveImageUrl(response.data.profile_image ?? undefined),
  };
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
