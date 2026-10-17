import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "internship-applications",
    allowed_formats: ["jpg", "jpeg", "png"],
    // Stored as a small, compressed JPEG to save space
    format: "jpg",
    transformation: [
      { width: 500, height: 500, crop: "limit", quality: "auto:good" },
    ],
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export default upload;
