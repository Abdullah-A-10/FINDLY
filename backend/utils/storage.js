const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uploadDir = 'uploads';


// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'item-' + uniqueName + ext);
  }
});

// File filter - allow only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Create multer instance 
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5 // Max 5 files
  },
  fileFilter: fileFilter
});

// Middleware for handling multiple images
const uploadImages = (req, res, next) => {
  // Use multer to handle file uploads
  upload.array('images', 5)(req, res, (err) => {
    if (err) {
      // Handle multer errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 5MB per image' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'Maximum 5 images allowed' });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ error: 'Invalid file type' });
      }
      return res.status(400).json({ error: err.message });
    }
    
    next();
  });
};

// Helper to delete files (for cleanup if item creation fails)
const deleteUploadedFiles = (filePaths) => {
  filePaths.forEach(filePath => {
    fs.unlink(filePath, err => {
      if (err) console.error('Error deleting file:', err);
    });
  });
};

module.exports = {
  upload,
  uploadImages,
  deleteUploadedFiles
};