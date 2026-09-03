import cloudinary from '../lib/cloudinary';

export const uploadToCloudinary = (
  buffer: Buffer,
  originalName: string
): Promise<{ secure_url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'developer-assessment/candidates/resumes',
        resource_type: 'raw',
        public_id: originalName.replace(/\.[^/.]+$/, ''),
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error('Cloudinary upload failed'));
          return;
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    uploadStream.end(buffer);
  });
};
