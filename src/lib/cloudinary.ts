// ============================================================
// Konfigurasi Cloudinary (Free Tier - Unsigned Upload)
// ------------------------------------------------------------
// Cara mendapatkan (gratis, tanpa backend):
// 1. Daftar di https://cloudinary.com/users/register/free
// 2. Setelah login, buka Dashboard -> salin "Cloud Name"
// 3. Buka Settings (icon gear) -> Upload -> scroll ke
//    "Upload presets" -> klik "Add upload preset"
// 4. Set "Signing Mode" = Unsigned, lalu Save.
//    Salin nama preset (misal: "ml_default" atau preset baru)
// 5. Tempel kedua nilai di bawah ini.
// ============================================================
export const CLOUDINARY_CLOUD_NAME: string = "drzcrjmbb";
export const CLOUDINARY_UPLOAD_PRESET: string = "toko_sembako_preset";

export const CLOUDINARY_CONFIGURED =
  !!CLOUDINARY_CLOUD_NAME &&
  !!CLOUDINARY_UPLOAD_PRESET &&
  CLOUDINARY_CLOUD_NAME !== "MASUKKAN_CLOUD_NAME_DISINI" &&
  CLOUDINARY_UPLOAD_PRESET !== "MASUKKAN_PRESET_DISINI";

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB

export async function uploadGambarKeCloudinary(file: File): Promise<string> {
  if (!CLOUDINARY_CONFIGURED) {
    throw new Error(
      "Cloudinary belum dikonfigurasi. Edit src/lib/cloudinary.ts (lihat instruksi di atas).",
    );
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("File harus berupa gambar.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Ukuran gambar maksimal 2MB.");
  }

  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: fd },
  );
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Upload gagal (${res.status}). ${txt.slice(0, 120)}`);
  }
  const json: { secure_url?: string } = await res.json();
  if (!json.secure_url) throw new Error("Respon Cloudinary tidak valid.");
  return optimasiUrlCloudinary(json.secure_url);
}

// Sisipkan transformasi q_auto,f_auto,w_400 ke URL Cloudinary
export function optimasiUrlCloudinary(url: string): string {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  if (/\/upload\/(q_auto|f_auto|w_\d+)/.test(url)) return url;
  return url.replace("/upload/", "/upload/q_auto,f_auto,w_400/");
}