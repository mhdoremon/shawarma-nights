import fs from 'fs';
import path from 'path';
import DataLayer from '../../core/DataLayer.js';
import { generateUUID } from '../../utils/helpers.js';

export const uploadMedia = (req, res) => {
  try {
    const { image, filename } = req.body;
    const storeId = req.storeId;
    
    if (!image) {
      return res.status(400).json({ success: false, message: 'No image data provided' });
    }

    const uploadsDir = DataLayer.getUploadsDir(storeId);
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    let fileData;
    let ext = '.jpg';
    
    if (image.startsWith('data:image')) {
      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        fileData = Buffer.from(matches[2], 'base64');
        const mime = matches[1];
        if (mime === 'image/png') ext = '.png';
        else if (mime === 'image/jpeg') ext = '.jpg';
        else if (mime === 'image/webp') ext = '.webp';
      }
    } else {
      fileData = Buffer.from(image, 'base64');
    }

    const uniqueFilename = `${Date.now()}-${generateUUID().split('-')[0]}${filename ? '-' + filename : ext}`;
    const filePath = path.join(uploadsDir, uniqueFilename);
    
    fs.writeFileSync(filePath, fileData);

    res.json({ success: true, url: `/uploads/${storeId}/uploads/${uniqueFilename}` });
  } catch (error) {
    console.error('Media upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload media', error: error.message });
  }
};
