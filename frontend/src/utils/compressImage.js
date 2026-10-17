// src/utils/compressImage.js
// Shrinks a photo in the browser before it is uploaded, so uploads are
// faster on mobile data and take less storage space.

// Ready-made sizes for the kinds of photos the portal stores
export const IMAGE_PRESETS = {
  // Profile photos / company logos — shown small
  profile: { maxWidth: 600, maxHeight: 600, quality: 0.82 },
  // Internship photos — shown large on the home page
  photo: { maxWidth: 1600, maxHeight: 1600, quality: 0.8 },
  // Scanned letters — must stay readable
  document: { maxWidth: 1600, maxHeight: 2200, quality: 0.85 },
};

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });

const decode = async (file) => {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // fall back to <img> below
    }
  }
  return loadImage(file);
};

/**
 * Returns a resized JPEG version of the image file.
 * If the browser cannot read the file, or compressing would not make it
 * smaller, the original file is returned unchanged.
 */
export async function compressImage(file, options = IMAGE_PRESETS.photo) {
  if (!file || !file.type?.startsWith("image/")) return file;
  if (["image/gif", "image/svg+xml"].includes(file.type)) return file;

  const { maxWidth, maxHeight, quality } = { ...IMAGE_PRESETS.photo, ...options };

  try {
    const image = await decode(file);
    const width = image.width;
    const height = image.height;
    const scale = Math.min(1, maxWidth / width, maxHeight / height);

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);

    const ctx = canvas.getContext("2d");
    // White background so transparent PNGs do not turn black as JPEG
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    image.close?.();

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );

    if (!blob || blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch (err) {
    console.warn("Image compression skipped:", err);
    return file;
  }
}

/** "1.2 MB" style size label */
export const formatFileSize = (bytes = 0) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
