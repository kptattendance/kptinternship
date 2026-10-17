import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "internship-consent",
    allowed_formats: ["jpg", "jpeg", "png"],
    // Stored as a compressed JPEG (large enough to stay readable)
    format: "jpg",
    transformation: [
      {
        width: 1600,
        height: 2200,
        crop: "limit",
        quality: "auto:good",
      },
    ],
  },
});

const uploadConsent = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export default uploadConsent;