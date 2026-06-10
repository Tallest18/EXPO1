// Helpers for building multipart/form-data request bodies (used for image
// uploads). React Native's fetch/axios expects a file to be appended as a
// plain object of the shape { uri, name, type } — not a Blob — so we normalise
// picked/cropped images into that shape before appending.

export interface FormImageFile {
  uri: string;
  name: string;
  type: string;
}

// Anything that might carry an image uri (expo-image-picker asset, our cropped
// PickedImage, or a stored product image).
export interface FormImageInput {
  uri?: string | null;
  fileName?: string | null;
  name?: string | null;
  type?: string | null;
  mimeType?: string | null;
}

/**
 * Normalise an image source into the { uri, name, type } file object that
 * FormData needs for a multipart upload.
 *
 * Returns `undefined` when there is nothing to upload — no uri, or a remote
 * (already-uploaded) http(s) image — so callers can simply skip the field.
 */
export function readImage(
  source?: FormImageInput | null,
): FormImageFile | undefined {
  if (!source || typeof source !== "object" || !source.uri) return undefined;
  // A remote image is already on the server; nothing to re-upload.
  if (source.uri.startsWith("http")) return undefined;

  return {
    uri: source.uri,
    name: source.fileName || source.name || `upload-${Date.now()}.jpg`,
    type: source.type || source.mimeType || "image/jpeg",
  };
}

/**
 * Build a FormData body from a plain object.
 * - `undefined` / `null` values are skipped.
 * - File objects (anything with a `uri`) are appended as-is so RN treats them
 *   as file parts; everything else is stringified.
 * - Array values append one entry per item under the same key.
 */
export function toFormData(obj: Record<string, unknown>): FormData {
  const form = new FormData();

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const value = obj[key];
    if (value === undefined || value === null) continue;

    const items = Array.isArray(value) ? value : [value];
    for (const item of items) {
      if (item === undefined || item === null) continue;
      if (typeof item === "object" && "uri" in (item as object)) {
        // React Native file part.
        form.append(key, item as any);
      } else {
        form.append(key, String(item));
      }
    }
  }

  return form;
}

/**
 * Axios request config for sending a FormData body in React Native.
 * Setting Content-Type to undefined lets the platform add the multipart
 * boundary, and the identity transformRequest stops axios from trying to
 * JSON-stringify the FormData.
 */
export const MULTIPART_CONFIG = {
  headers: { "Content-Type": undefined },
  transformRequest: [(data: any) => data],
};
