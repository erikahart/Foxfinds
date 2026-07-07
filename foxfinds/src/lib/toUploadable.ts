/**
 * Normalizes a picked image File for web use. iPhones often produce HEIC/HEIF,
 * which browsers can't display — convert those to JPEG. Everything else passes through.
 */
export async function toUploadable(file: File): Promise<{ blob: Blob; ext: string; contentType: string }> {
  const name = (file.name || "").toLowerCase();
  const isHeic =
    file.type === "image/heic" || file.type === "image/heif" ||
    name.endsWith(".heic") || name.endsWith(".heif");

  if (isHeic) {
    const heic2any = (await import("heic2any")).default as (opts: { blob: Blob; toType?: string; quality?: number }) => Promise<Blob | Blob[]>;
    const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
    const blob = Array.isArray(out) ? out[0] : out;
    return { blob, ext: "jpg", contentType: "image/jpeg" };
  }

  const ext = (name.split(".").pop() || "jpg").toLowerCase();
  return { blob: file, ext, contentType: file.type || "image/jpeg" };
}