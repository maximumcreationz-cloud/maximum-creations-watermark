const cloudinary = require('cloudinary').v2;
const formidable = require('formidable');
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const form = new formidable.IncomingForm({ maxFileSize: 100 * 1024 * 1024 });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(400).json({ error: 'Failed to parse upload' });

    const file = Array.isArray(files.video) ? files.video[0] : files.video;
    if (!file) return res.status(400).json({ error: 'No video file found' });

    const filePath = file.filepath || file.path;

    try {
      const uploadResult = await cloudinary.uploader.upload(filePath, {
        resource_type: 'video',
        folder: 'watermarked',
        transformation: [
          {
            overlay: {
              public_id: 'maximum_creations_watermark_baunr9',
              resource_type: 'image',
            },
            gravity: 'south_east',
            x: 20,
            y: 20,
            width: 300,
            opacity: 80,
          },
          { flags: 'layer_apply' },
        ],
      });

      try { fs.unlinkSync(filePath); } catch(e) {}

      return res.status(200).json({
        success: true,
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      });
    } catch (uploadError) {
      console.error('Cloudinary error:', uploadError);
      return res.status(500).json({ error: 'Video processing failed', detail: uploadError.message });
    }
  });
};
