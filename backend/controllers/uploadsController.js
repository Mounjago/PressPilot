const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  defaultMeta: { service: 'presspilot-api' },
  transports: [new winston.transports.Console()]
});

// Base upload directory
const UPLOAD_BASE_DIR = './uploads';

// Category configuration with size limits and allowed types
const UPLOAD_CONFIG = {
  avatars: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    maxFiles: 1
  },
  covers: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    maxFiles: 1
  },
  attachments: {
    maxSize: 10 * 1024 * 1024, // 10MB per file
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.doc', '.docx', '.xls', '.xlsx'],
    maxFiles: 10
  },
  audio: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/webm',
      'video/mp4', 'video/webm', 'video/ogg' // For video files containing audio
    ],
    allowedExtensions: ['.mp3', '.wav', '.ogg', '.m4a', '.webm', '.mp4'],
    maxFiles: 1
  },
  documents: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv', 'text/plain'
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt'],
    maxFiles: 1
  }
};

// Ensure upload directories exist
const ensureUploadDirs = async () => {
  const categories = Object.keys(UPLOAD_CONFIG);
  for (const category of categories) {
    const dir = path.join(UPLOAD_BASE_DIR, category);
    if (!fsSync.existsSync(dir)) {
      await fs.mkdir(dir, { recursive: true });
    }
  }
};

// Initialize directories on module load
ensureUploadDirs().catch(err => logger.error('Error ensuring upload dirs', { error: err.message }));

// Validate category against whitelist
const isValidCategory = (category) => {
  return Object.keys(UPLOAD_CONFIG).includes(category);
};

// Sanitize filename to prevent path traversal
const sanitizeFilename = (filename) => {
  // Remove any directory traversal patterns and special characters
  return filename
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '')
    .replace(/^\.+/, '');
};

// Create multer storage configuration
const createStorage = (category) => {
  return multer.diskStorage({
    destination: async (req, file, cb) => {
      const uploadDir = path.join(UPLOAD_BASE_DIR, category);
      try {
        await fs.access(uploadDir);
      } catch {
        await fs.mkdir(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const userId = req.user?.id || 'anonymous';
      const sanitizedName = sanitizeFilename(file.originalname);
      const uniqueName = `${userId}-${Date.now()}-${sanitizedName}`;
      cb(null, uniqueName);
    }
  });
};

// Create file filter for MIME type validation
const createFileFilter = (category) => {
  return (req, file, cb) => {
    const config = UPLOAD_CONFIG[category];
    const ext = path.extname(file.originalname).toLowerCase();

    // Check MIME type
    if (config.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    }
    // Also check extension as fallback
    else if (config.allowedExtensions.includes(ext)) {
      cb(null, true);
    }
    else {
      cb(new multer.MulterError('INVALID_FILE_TYPE', `File type not allowed for ${category}`));
    }
  };
};

// Create multer configuration for each category
const createMulterConfig = (category, fieldName) => {
  const config = UPLOAD_CONFIG[category];
  return multer({
    storage: createStorage(category),
    fileFilter: createFileFilter(category),
    limits: {
      fileSize: config.maxSize,
      files: config.maxFiles
    }
  });
};

// Multer middleware exports
exports.avatarUpload = createMulterConfig('avatars', 'avatar').single('avatar');
exports.coverUpload = createMulterConfig('covers', 'cover').single('cover');
exports.attachmentsUpload = createMulterConfig('attachments', 'attachments').array('attachments', 10);
exports.audioUpload = createMulterConfig('audio', 'audio').single('audio');
exports.documentUpload = createMulterConfig('documents', 'document').single('document');

// Controller handler for avatar upload
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileUrl = `/uploads/avatars/${req.file.filename}`;

    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: fileUrl,
        category: 'avatars'
      }
    });
  } catch (error) {
    logger.error('Avatar upload error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to upload avatar'
    });
  }
};

// Controller handler for cover upload
exports.uploadCover = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileUrl = `/uploads/covers/${req.file.filename}`;

    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: fileUrl,
        category: 'covers'
      }
    });
  } catch (error) {
    logger.error('Cover upload error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to upload cover'
    });
  }
};

// Controller handler for attachments upload
exports.uploadAttachments = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: `/uploads/attachments/${file.filename}`,
      category: 'attachments'
    }));

    res.json({
      success: true,
      data: uploadedFiles
    });
  } catch (error) {
    logger.error('Attachments upload error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to upload attachments'
    });
  }
};

// Controller handler for audio upload
exports.uploadAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileUrl = `/uploads/audio/${req.file.filename}`;

    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: fileUrl,
        category: 'audio'
      }
    });
  } catch (error) {
    logger.error('Audio upload error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to upload audio'
    });
  }
};

// Controller handler for document upload
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileUrl = `/uploads/documents/${req.file.filename}`;

    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: fileUrl,
        category: 'documents'
      }
    });
  } catch (error) {
    logger.error('Document upload error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to upload document'
    });
  }
};

// Delete a file
exports.deleteFile = async (req, res) => {
  try {
    const { category, filename } = req.params;

    // Validate category
    if (!isValidCategory(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    // Sanitize filename to prevent path traversal
    const sanitizedFilename = sanitizeFilename(filename);
    const filePath = path.join(UPLOAD_BASE_DIR, category, sanitizedFilename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Delete the file
    await fs.unlink(filePath);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    logger.error('File deletion error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to delete file'
    });
  }
};

// Get file metadata
exports.getFileInfo = async (req, res) => {
  try {
    const { category, filename } = req.params;

    // Validate category
    if (!isValidCategory(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    // Sanitize filename
    const sanitizedFilename = sanitizeFilename(filename);
    const filePath = path.join(UPLOAD_BASE_DIR, category, sanitizedFilename);

    // Get file stats
    try {
      const stats = await fs.stat(filePath);

      res.json({
        success: true,
        data: {
          filename: sanitizedFilename,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          category: category,
          url: `/uploads/${category}/${sanitizedFilename}`
        }
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }
      throw error;
    }
  } catch (error) {
    logger.error('Get file info error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to get file info'
    });
  }
};

// List files in a category
exports.listFiles = async (req, res) => {
  try {
    const { category } = req.params;

    // Validate category
    if (!isValidCategory(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    const dirPath = path.join(UPLOAD_BASE_DIR, category);

    // Read directory
    try {
      const files = await fs.readdir(dirPath);

      // Get stats for each file
      const fileList = await Promise.all(
        files.map(async (filename) => {
          const filePath = path.join(dirPath, filename);
          const stats = await fs.stat(filePath);

          return {
            filename: filename,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            url: `/uploads/${category}/${filename}`
          };
        })
      );

      // Sort by modified date (most recent first)
      fileList.sort((a, b) => b.modified - a.modified);

      res.json({
        success: true,
        data: {
          category: category,
          count: fileList.length,
          files: fileList
        }
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Directory doesn't exist yet, return empty list
        return res.json({
          success: true,
          data: {
            category: category,
            count: 0,
            files: []
          }
        });
      }
      throw error;
    }
  } catch (error) {
    logger.error('List files error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to list files'
    });
  }
};

// Get upload statistics
exports.getUploadStats = async (req, res) => {
  try {
    const categories = Object.keys(UPLOAD_CONFIG);
    const stats = {};
    let totalFiles = 0;
    let totalSize = 0;

    for (const category of categories) {
      const dirPath = path.join(UPLOAD_BASE_DIR, category);

      try {
        const files = await fs.readdir(dirPath);
        let categorySize = 0;

        for (const filename of files) {
          const filePath = path.join(dirPath, filename);
          const fileStats = await fs.stat(filePath);
          categorySize += fileStats.size;
        }

        stats[category] = {
          count: files.length,
          size: categorySize,
          sizeFormatted: formatBytes(categorySize)
        };

        totalFiles += files.length;
        totalSize += categorySize;
      } catch (error) {
        // Directory doesn't exist, set zero stats
        stats[category] = {
          count: 0,
          size: 0,
          sizeFormatted: '0 B'
        };
      }
    }

    res.json({
      success: true,
      data: {
        categories: stats,
        total: {
          files: totalFiles,
          size: totalSize,
          sizeFormatted: formatBytes(totalSize)
        }
      }
    });
  } catch (error) {
    logger.error('Get upload stats error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to get upload statistics'
    });
  }
};

// Multer error handler middleware
exports.handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File size too large'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name'
      });
    }
    if (err.code === 'INVALID_FILE_TYPE') {
      return res.status(415).json({
        success: false,
        message: err.field || 'Invalid file type'
      });
    }
    // Generic multer error
    return res.status(400).json({
      success: false,
      message: 'File upload error'
    });
  }

  // Pass to next error handler if not a multer error
  next(err);
};

// Utility function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}