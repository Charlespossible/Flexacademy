import { v2 as cloudinary } from "cloudinary";
import { logger } from "../utils/logger";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

/**
 * True only when all three credentials are present. Endpoints that touch
 * Cloudinary check this and fail with a clear 503 rather than throwing an
 * opaque SDK error, so a missing key never looks like a bug in our code.
 */
export const isCloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

if (!isCloudinaryConfigured) {
  logger.warn(
    "Cloudinary is not configured — lesson video uploads are disabled. " +
      "Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET."
  );
} else {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  logger.debug({ cloudName }, "Cloudinary configured");
}

export { cloudinary };

/** Where a tutor's lesson videos live. Scoped per tutor so assets are traceable. */
export const lessonFolder = (tutorProfileId: string) =>
  `flexacademy/lessons/${tutorProfileId}`;

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId: string;
  resourceType: "video" | "image";
  /** Where the browser POSTs the file. */
  uploadUrl: string;
}

/**
 * Build a signed direct-upload payload.
 *
 * The browser uploads straight to Cloudinary with these params — the file never
 * passes through Express. Proxying multi-hundred-megabyte lesson videos through
 * Node would tie up the event loop and cap us on request-body limits.
 *
 * The signature covers `folder`, `public_id` and `timestamp`, so a client cannot
 * redirect the upload somewhere else or replay it indefinitely (Cloudinary
 * rejects signatures older than ~1 hour).
 */
export function createUploadSignature(
  tutorProfileId: string,
  resourceType: "video" | "image" = "video"
): UploadSignature {
  if (!isCloudinaryConfigured) {
    throw new Error("Cloudinary is not configured.");
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = lessonFolder(tutorProfileId);
  // Collision-resistant without pulling in a uuid dep for this one use.
  const publicId = `${resourceType}_${timestamp}_${Math.random().toString(36).slice(2, 10)}`;

  const signature = cloudinary.utils.api_sign_request(
    { folder, public_id: publicId, timestamp },
    apiSecret as string
  );

  return {
    cloudName: cloudName as string,
    apiKey: apiKey as string,
    timestamp,
    signature,
    folder,
    publicId,
    resourceType,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
  };
}

export interface VerifiedAsset {
  secureUrl: string;
  /** Rounded seconds — videos only. */
  durationSecs: number | null;
  bytes: number;
  format: string;
}

/**
 * Confirm an asset really exists in our account before we store its URL.
 *
 * Without this a tutor could POST any arbitrary string as `videoUrl` and we'd
 * persist it. Fetching the resource also gives us the true duration, which is
 * more trustworthy than a client-supplied number and feeds Course.totalDuration.
 */
export async function verifyUploadedAsset(
  publicId: string,
  resourceType: "video" | "image" = "video"
): Promise<VerifiedAsset | null> {
  if (!isCloudinaryConfigured) return null;

  try {
    const res = await cloudinary.api.resource(publicId, {
      resource_type: resourceType,
      // Without this Cloudinary omits `duration` entirely — the field is simply
      // absent, not null, so every video silently came back with no runtime.
      media_metadata: true,
    });
    return {
      secureUrl: res.secure_url as string,
      durationSecs:
        typeof res.duration === "number" ? Math.round(res.duration) : null,
      bytes: res.bytes as number,
      format: res.format as string,
    };
  } catch (err) {
    logger.warn({ err, publicId }, "Cloudinary asset verification failed");
    return null;
  }
}

/** Best-effort cleanup when a lesson is deleted or its video replaced. */
export async function destroyAsset(
  publicId: string,
  resourceType: "video" | "image" = "video"
): Promise<void> {
  if (!isCloudinaryConfigured) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    // Never fail the request over orphaned storage.
    logger.warn({ err, publicId }, "Cloudinary asset deletion failed");
  }
}
