import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import config from '../config/env.js';

const isCloudinaryConfigured = Boolean(
  config.CLOUDINARY?.cloudName &&
  config.CLOUDINARY?.apiKey &&
  config.CLOUDINARY?.apiSecret
);

const uploadDir = path.join(process.cwd(), 'uploads', 'photos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `photo-${uniqueSuffix}${ext}`);
  },
});

const cloudinaryStorage = isCloudinaryConfigured
  ? new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'sfa_uploads',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        public_id: (req, file) => `photo-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      },
    })
  : null;

const storage = isCloudinaryConfigured ? cloudinaryStorage : diskStorage;

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

export const uploadPhoto = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter,
});
