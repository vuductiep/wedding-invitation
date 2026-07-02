// Uploads the project's static media (15 referenced images + 1 background
// music track) to Cloudinary under deterministic public_ids. Re-runs are
// idempotent: same filename → same public_id, overwrite + invalidate.
//
// Run with:  npm run upload:media
//
// Writes an audit manifest to scripts/.media-manifest.json (gitignored).
// The runtime URL helper in app/wedding-invite.tsx is fully deterministic
// (filename → public_id) and does NOT read the manifest, so it's safe to
// delete or not commit.
//
// Environment variables (read from .env via dotenv):
//   CLOUDINARY_CLOUD_NAME
//   CLOUDINARY_API_KEY
//   CLOUDINARY_API_SECRET
// The script only needs server-side credentials; the client bundle reads
// NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME separately.

import "dotenv/config";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import * as fs from "node:fs";
import * as path from "node:path";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error(
    "Missing one of CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env",
  );
  process.exit(1);
}

cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

type File = {
  local: string;
  publicId: string;
  resourceType: "image" | "video";
};

// 15 images referenced from app/metadata.json + the hardcoded giftbox.png
// + 1 audio. public_id mirrors the local filename (sans extension) under
// the project-scoped folder. Re-running overwrites the same asset.
const FILES: File[] = [
  { local: "public/images/giftbox.png",       publicId: "wedding-invitation/images/giftbox",       resourceType: "image" },
  { local: "public/images/0Q0A4332.jpg",      publicId: "wedding-invitation/images/0Q0A4332",      resourceType: "image" },
  { local: "public/images/0Q0A4576deban.jpg", publicId: "wedding-invitation/images/0Q0A4576deban", resourceType: "image" },
  { local: "public/images/0Q0A4613.jpg",      publicId: "wedding-invitation/images/0Q0A4613",      resourceType: "image" },
  { local: "public/images/0Q0A4647.jpg",      publicId: "wedding-invitation/images/0Q0A4647",      resourceType: "image" },
  { local: "public/images/0Q0A4725.jpg",      publicId: "wedding-invitation/images/0Q0A4725",      resourceType: "image" },
  { local: "public/images/0Q0A4854.jpg",      publicId: "wedding-invitation/images/0Q0A4854",      resourceType: "image" },
  { local: "public/images/0Q0A5021x.jpg",     publicId: "wedding-invitation/images/0Q0A5021x",     resourceType: "image" },
  { local: "public/images/0Q0A5051x.jpg",     publicId: "wedding-invitation/images/0Q0A5051x",     resourceType: "image" },
  { local: "public/images/0Q0A5187.jpg",      publicId: "wedding-invitation/images/0Q0A5187",      resourceType: "image" },
  { local: "public/images/0Q0A5334.jpg",      publicId: "wedding-invitation/images/0Q0A5334",      resourceType: "image" },
  { local: "public/images/0Q0A5515.jpg",      publicId: "wedding-invitation/images/0Q0A5515",      resourceType: "image" },
  { local: "public/images/anhto1.jpg",        publicId: "wedding-invitation/images/anhto1",        resourceType: "image" },
  { local: "public/images/groom_qr.jpg",      publicId: "wedding-invitation/images/groom_qr",      resourceType: "image" },
  { local: "public/images/bribe_qr.jpg",      publicId: "wedding-invitation/images/bribe_qr",      resourceType: "image" },
  { local: "public/music/wedding-music.mp3",  publicId: "wedding-invitation/music/wedding-music",  resourceType: "video" },
];

type ManifestEntry = {
  source: string;
  public_id: string;
  resource_type: string;
  format: string;
  bytes: number;
  secure_url: string;
  version: number;
};

async function main() {
  console.log(`Uploading ${FILES.length} files to Cloudinary (cloud: ${cloudName})…\n`);

  const results: ManifestEntry[] = [];
  for (const file of FILES) {
    const localPath = path.resolve(file.local);
    if (!fs.existsSync(localPath)) {
      throw new Error(`Local file missing: ${localPath}`);
    }

    const res: UploadApiResponse = await cloudinary.uploader.upload(localPath, {
      public_id: file.publicId,
      resource_type: file.resourceType,
      overwrite: true,
      invalidate: true,
    });

    results.push({
      source: file.local,
      public_id: res.public_id,
      resource_type: res.resource_type,
      format: res.format,
      bytes: res.bytes,
      secure_url: res.secure_url,
      version: res.version,
    });

    console.log(
      `  ✓ ${file.local.padEnd(40)} → ${res.public_id}.${res.format}  (${(res.bytes / 1024).toFixed(1)} KB)`,
    );
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    cloudName,
    files: results,
  };
  const manifestPath = path.resolve("scripts/.media-manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

  console.log(`\nUploaded ${results.length} files.`);
  console.log(`Manifest: ${manifestPath}`);
}

main().catch((err) => {
  console.error("\nUpload failed:", err.message ?? err);
  process.exit(1);
});
