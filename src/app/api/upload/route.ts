import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/dwg",
  "application/acad",
  "application/zip",
]);

const MAX_SIZE = 15 * 1024 * 1024; // 15 MB

export async function POST(req: NextRequest) {
  try {
    await requireUser();

    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Файл слишком большой (максимум 15 МБ)" }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    const allowedExt = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".dwg", ".zip"];
    if (!ALLOWED_TYPES.has(file.type) && !allowedExt.includes(ext)) {
      return NextResponse.json({ error: "Недопустимый тип файла" }, { status: 400 });
    }

    const safeExt = allowedExt.includes(ext) ? ext : "";
    const filename = `${randomUUID()}${safeExt}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Vercel's deployed filesystem has no persistent/writable disk, so uploads
    // go to Vercel Blob storage there. Locally (no token configured) we fall
    // back to writing into public/uploads so dev doesn't need cloud credentials.
    let url: string;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`uploads/${filename}`, buffer, {
        access: "public",
        contentType: file.type || undefined,
      });
      url = blob.url;
    } else {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadsDir, { recursive: true });
      await writeFile(path.join(uploadsDir, filename), buffer);
      url = `/uploads/${filename}`;
    }

    return NextResponse.json({
      url,
      filename: file.name,
      type: file.type || "application/octet-stream",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
