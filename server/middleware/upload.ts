import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

// Augment Express Request to carry uploadType (set by setUploadType middleware)
declare global {
  namespace Express {
    interface Request {
      uploadType?: string;
    }
  }
}

interface UploadOptions {
  destination?: string;
  allowedTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
  imageOnly?: boolean;
}

interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

export function createUpload(options: UploadOptions = {}) {
  const {
    destination = 'uploads',
    allowedTypes = [],
    maxFileSize = 5 * 1024 * 1024, // 5MB
    maxFiles = 5,
    imageOnly = false,
  } = options;

  // Ensure upload directory exists
  const ensureDir = async () => {
    try {
      await fs.access(destination);
    } catch {
      await fs.mkdir(destination, { recursive: true });
    }
  };

  const storage = multer.diskStorage({
    destination: async (req: Express.Request, file: Express.Multer.File, cb: any) => {
      await ensureDir();
      cb(null, destination);
    },
    filename: (req: Express.Request, file: Express.Multer.File, cb: any) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      cb(null, `${name}-${uniqueSuffix}${ext}`);
    },
  });

  const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Check if image only
    if (imageOnly) {
      const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!imageTypes.includes(file.mimetype)) {
        return cb(new Error('Only image files are allowed'));
      }
    }

    // Check allowed types
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      return cb(new Error(`File type ${file.mimetype} is not allowed`));
    }

    cb(null, true);
  };

  const upload = multer({
    storage,
    limits: {
      fileSize: maxFileSize,
      files: maxFiles,
    },
    fileFilter,
  });

  return upload;
}

// Predefined upload configurations
export const avatarUpload = createUpload({
  destination: 'uploads/avatars',
  maxFileSize: 2 * 1024 * 1024, // 2MB
  maxFiles: 1,
  imageOnly: true,
});

export const documentUpload = createUpload({
  destination: 'uploads/documents',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 10,
  allowedTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
  ],
});

export const imageUpload = createUpload({
  destination: 'uploads/images',
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 5,
  imageOnly: true,
});

export const generalUpload = createUpload({
  destination: 'uploads/general',
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 3,
});

// ---------------------------------------------------------------------------
// Legacy-compatible exports: upload, setUploadType
// These match the upload.js API that routes import as:
//   import { upload, setUploadType } from '../middleware/upload.js';
// Routes use: setUploadType('receipt'), upload.single('receipt')
// The uploadType controls which subdirectory files are saved to.
// ---------------------------------------------------------------------------

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880'); // 5MB

// Ensure upload directories exist at startup
const uploadSubDirs = ['documents', 'receipts', 'screenshots'].map(d => path.join(UPLOAD_DIR, d));
uploadSubDirs.forEach(dir => {
  if (!fsSync.existsSync(dir)) {
    fsSync.mkdirSync(dir, { recursive: true });
  }
});

const legacyStorage = multer.diskStorage({
  destination: (req: Express.Request, _file: Express.Multer.File, cb: any) => {
    let subDir = 'documents';
    if ((req as any).uploadType === 'receipt') subDir = 'receipts';
    else if ((req as any).uploadType === 'screenshot') subDir = 'screenshots';
    cb(null, path.join(UPLOAD_DIR, subDir));
  },
  filename: (_req: Express.Request, file: Express.Multer.File, cb: any) => {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9\-_]/g, '_');
    cb(null, `${randomUUID()}-${basename}${ext}`);
  },
});

const legacyFileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`));
  }
};

/** General-purpose multer instance with uploadType-based destination routing. */
export const upload = multer({
  storage: legacyStorage,
  fileFilter: legacyFileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

/** Middleware to set req.uploadType before the multer middleware runs. */
export function setUploadType(type: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    (req as any).uploadType = type;
    next();
  };
}

// Error handling middleware for upload errors
export function handleUploadError(err: Error, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        res.status(400).json({ error: 'File size too large' });
        return;
      case 'LIMIT_FILE_COUNT':
        res.status(400).json({ error: 'Too many files' });
        return;
      case 'LIMIT_UNEXPECTED_FILE':
        res.status(400).json({ error: 'Unexpected file field' });
        return;
      default:
        res.status(400).json({ error: 'Upload error: ' + err.message });
        return;
    }
  }

  if (err.message.includes('Only image files are allowed')) {
    res.status(400).json({ error: err.message });
    return;
  }

  if (err.message.includes('File type') && err.message.includes('is not allowed')) {
    res.status(400).json({ error: err.message });
    return;
  }

  next(err);
}

// Utility function to remove uploaded files
export async function removeUploadedFiles(files: FileUpload[] | Express.Multer.File[]): Promise<void> {
  const removePromises = files.map(async (file) => {
    try {
      await fs.unlink(file.path);
      console.log(`Removed file: ${file.path}`);
    } catch (error) {
      console.error(`Failed to remove file ${file.path}:`, error);
    }
  });

  await Promise.allSettled(removePromises);
}

// Utility function to get file info
export function getFileInfo(file: Express.Multer.File) {
  const ext = path.extname(file.originalname).toLowerCase();
  const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
  
  return {
    originalName: file.originalname,
    filename: file.filename,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype,
    extension: ext,
    isImage,
    url: `/uploads/${path.basename(path.dirname(file.path))}/${file.filename}`,
  };
}

// Extend Express Request interface to include uploaded files
declare global {
  namespace Express {
    interface Request {
      uploadedFiles?: Express.Multer.File[];
      fileInfo?: ReturnType<typeof getFileInfo>;
    }
  }
}