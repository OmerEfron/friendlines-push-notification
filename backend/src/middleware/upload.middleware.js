const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  }
});

// Image processing middleware
const processImage = (options = {}) => {
  return async (req, res, next) => {
    if (!req.file) return next();

    const {
      width = 800,
      height = 800,
      quality = 80,
      folder = 'general'
    } = options;

    try {
      // Generate unique filename
      const uniqueName = crypto.randomBytes(16).toString('hex');
      const extension = path.extname(req.file.originalname).toLowerCase() || '.jpg';
      const filename = `${uniqueName}${extension}`;
      const filepath = path.join(__dirname, '../../uploads', folder, filename);

      // Ensure upload directory exists
      await fs.mkdir(path.dirname(filepath), { recursive: true });

      // Process and save image
      await sharp(req.file.buffer)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality })
        .toFile(filepath);

      // Add processed image info to request
      req.file.processedPath = `/uploads/${folder}/${filename}`;
      req.file.localPath = filepath;

      next();
    } catch (error) {
      console.error('Image processing error:', error);
      return res.status(500).json({
        error: 'Image Processing Error',
        message: 'Failed to process uploaded image'
      });
    }
  };
};

// Cleanup middleware for failed requests
const cleanupFile = async (req, res, next) => {
  // Store original json method
  const originalJson = res.json;
  
  res.json = function(data) {
    // If response has error status and file was uploaded
    if (res.statusCode >= 400 && req.file?.localPath) {
      fs.unlink(req.file.localPath).catch(err => 
        console.error('Failed to cleanup file:', err)
      );
    }
    
    // Call original json method
    return originalJson.call(this, data);
  };
  
  next();
};

module.exports = {
  upload,
  processImage,
  cleanupFile
}; 