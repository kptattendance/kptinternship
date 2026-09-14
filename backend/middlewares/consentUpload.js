import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "internship-consent",

    allowed_formats: ["jpg", "jpeg", "png"],

    transformation: [
      {
        width: 1600,
        height: 2200,
        crop: "limit",
        quality: "auto",
        fetch_format: "auto",
      },
    ],
  },
});

const uploadConsent = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

export default uploadConsent;