import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "internship-images",

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

const uploadInternshipImageFile = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export default uploadInternshipImageFile;