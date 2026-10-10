import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Delete many Cloudinary images, a few at a time in parallel.
 * Returns the public IDs that are gone (deleted or already missing).
 */
export const destroyImages = async (publicIds, batchSize = 10) => {
  const ids = [...new Set(publicIds.filter(Boolean))];
  const removed = [];

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map((publicId) => cloudinary.uploader.destroy(publicId))
    );

    results.forEach((result, index) => {
      if (
        result.status === "fulfilled" &&
        ["ok", "not found"].includes(result.value?.result)
      ) {
        removed.push(batch[index]);
      } else {
        console.error(
          `Failed to delete Cloudinary image ${batch[index]}:`,
          result.reason || result.value
        );
      }
    });
  }

  return removed;
};

export default cloudinary;
