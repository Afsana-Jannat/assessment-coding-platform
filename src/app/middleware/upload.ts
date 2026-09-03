import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (
    file.mimetype !== 'application/pdf' &&
    !file.originalname.toLowerCase().endsWith('.pdf')
  ) {
    cb(new Error('Only PDF files are allowed'));
    return;
  }

  cb(null, true);
};

export const uploadResume = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});
