import { v2 as cloudinary } from "cloudinary";

function client() {
  const raw = process.env.CLOUDINARY_URL;
  if (!raw) throw new Error("CLOUDINARY_URL no está configurada.");
  const url = new URL(raw);
  cloudinary.config({
    cloud_name: url.hostname,
    api_key: decodeURIComponent(url.username),
    api_secret: decodeURIComponent(url.password),
    secure: true,
  });
  return cloudinary;
}

export async function uploadBuffer(buffer: Buffer, folder: string, filename: string) {
  const api = client();
  return new Promise<{ secureUrl: string; publicId: string }>((resolve, reject) => {
    const stream = api.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        use_filename: true,
        unique_filename: true,
        filename_override: filename,
      },
      (error, result) => {
        if (error || !result) reject(error ?? new Error("Cloudinary no devolvió el archivo."));
        else resolve({ secureUrl: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}
