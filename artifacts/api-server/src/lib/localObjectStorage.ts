import { randomUUID } from "crypto";
import { access, mkdir, readFile, writeFile } from "fs/promises";
import { join, extname } from "path";

const UPLOAD_DIR = join(process.cwd(), "data", "uploads");

export function useLocalObjectStorage(): boolean {
  return (
    process.env["USE_LOCAL_STORAGE"] === "true" ||
    process.env["USE_LOCAL_STORAGE"] === "1" ||
    !process.env["PRIVATE_OBJECT_DIR"]
  );
}

export async function ensureUploadDir(): Promise<void> {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

export function createLocalUploadTarget(): { objectId: string; uploadURL: string; objectPath: string } {
  const objectId = randomUUID();
  return {
    objectId,
    uploadURL: `/api/storage/local-upload/${objectId}`,
    objectPath: `/objects/uploads/${objectId}`,
  };
}

function extensionForContentType(contentType: string): string {
  if (contentType.includes("png")) return ".png";
  if (contentType.includes("webp")) return ".webp";
  if (contentType.includes("gif")) return ".gif";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return ".jpg";
  return ".bin";
}

export async function saveLocalUpload(
  objectId: string,
  data: Buffer,
  contentType: string,
): Promise<string> {
  await ensureUploadDir();
  const ext = extensionForContentType(contentType);
  const filePath = join(UPLOAD_DIR, `${objectId}${ext}`);
  await writeFile(filePath, data);
  return filePath;
}

export async function readLocalObject(
  objectPath: string,
): Promise<{ data: Buffer; contentType: string } | null> {
  if (!objectPath.startsWith("/objects/uploads/")) {
    return null;
  }
  const objectId = objectPath.slice("/objects/uploads/".length);
  if (!objectId) return null;

  await ensureUploadDir();
  const extensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bin"];
  for (const ext of extensions) {
    const filePath = join(UPLOAD_DIR, `${objectId}${ext}`);
    try {
      await access(filePath);
      const data = await readFile(filePath);
      const contentType =
        ext === ".png"
          ? "image/png"
          : ext === ".webp"
            ? "image/webp"
            : ext === ".gif"
              ? "image/gif"
              : ext === ".bin"
                ? "application/octet-stream"
                : "image/jpeg";
      return { data, contentType };
    } catch {
      // try next extension
    }
  }

  // fallback: any file starting with objectId
  const { readdir } = await import("fs/promises");
  const files = await readdir(UPLOAD_DIR);
  const match = files.find((f) => f.startsWith(objectId));
  if (!match) return null;
  const filePath = join(UPLOAD_DIR, match);
  const data = await readFile(filePath);
  const ext = extname(match).toLowerCase();
  const contentType =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : ext === ".gif"
          ? "image/gif"
          : "image/jpeg";
  return { data, contentType };
}
