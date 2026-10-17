import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import DataLayer from '../../core/DataLayer.js';
import { generateUUID } from '../../utils/helpers.js';

/**
 * Extracts Cloudinary configuration from environment or per-store configuration.
 */
function getCloudinaryConfig(storeId) {
  // 1. Check store-specific configuration if present
  try {
    const storeConfig = DataLayer.getStoreConfig(storeId);
    if (storeConfig?.media?.cloudinary?.cloudName && storeConfig.media.cloudinary.apiKey && storeConfig.media.cloudinary.apiSecret) {
      return storeConfig.media.cloudinary;
    }
  } catch (ignored) {}

  // 2. Check global environment variable CLOUDINARY_URL
  const envUrl = process.env.CLOUDINARY_URL;
  if (envUrl && envUrl.startsWith('cloudinary://')) {
    const matched = envUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@([^/?]+)/);
    if (matched) {
      return {
        apiKey: matched[1],
        apiSecret: matched[2],
        cloudName: matched[3]
      };
    }
  }

  // 3. Check individual global environment variables
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (cloudName && apiKey && apiSecret) {
    return { cloudName, apiKey, apiSecret };
  }

  return null;
}

/**
 * Upload image to Cloudinary CDN (Fastest, automated WebP/AVIF, Akamai edge caching)
 */
async function uploadToCloudinary(imageUri, storeId, filename) {
  const config = getCloudinaryConfig(storeId);
  if (!config) return null;

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `churuone/${storeId || 'default'}`;
  const cleanPublicId = filename 
    ? filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_') 
    : `dish_${Date.now()}`;

  // Signature parameters sorted alphabetically: folder, public_id, timestamp
  const paramsToSign = `folder=${folder}&public_id=${cleanPublicId}&timestamp=${timestamp}${config.apiSecret}`;
  const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

  const formData = new URLSearchParams();
  formData.append('file', imageUri);
  formData.append('api_key', config.apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);
  formData.append('folder', folder);
  formData.append('public_id', cleanPublicId);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  const data = await res.json();
  if (data && data.secure_url) {
    // Inject automatic modern format (f_auto) and quality compression (q_auto) for lightning speed
    const optimized = data.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');
    return optimized;
  }
  if (data?.error?.message) {
    console.warn(`⚠️ [Cloudinary Upload Warning] Store ${storeId}:`, data.error.message);
  }
  return null;
}

/**
 * Upload image to ImgBB (Unlimited free storage alternative)
 */
async function uploadToImgbb(imageUri, filename) {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) return null;

  let cleanBase64 = imageUri;
  if (cleanBase64.startsWith('data:image')) {
    const parts = cleanBase64.split(',');
    if (parts.length > 1) cleanBase64 = parts[1];
  }

  const formData = new URLSearchParams();
  formData.append('key', apiKey);
  formData.append('image', cleanBase64);
  if (filename) formData.append('name', filename);

  const res = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: formData,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  const data = await res.json();
  if (data && data.success && data.data && data.data.url) {
    return data.data.url;
  }
  return null;
}

/**
 * Universal Store-Scoped Media Uploader
 */
export const uploadMedia = async (req, res) => {
  try {
    const { image, filename } = req.body;
    const storeId = req.storeId || 'shawarma';

    if (!image) {
      return res.status(400).json({ success: false, message: 'No image data provided' });
    }

    const isVideo = image.startsWith('data:video') || (filename && /\.(mp4|webm|ogg|mov)$/i.test(filename));

    // 1. Try Primary High-Speed Provider: Cloudinary (Fastest global CDN)
    try {
      const config = getCloudinaryConfig(storeId);
      if (config) {
        const timestamp = Math.floor(Date.now() / 1000);
        const folder = `churuone/${storeId || 'default'}`;
        const cleanPublicId = filename 
          ? filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_') 
          : `${isVideo ? 'video' : 'media'}_${Date.now()}`;

        const paramsToSign = `folder=${folder}&public_id=${cleanPublicId}&timestamp=${timestamp}${config.apiSecret}`;
        const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

        const formData = new URLSearchParams();
        formData.append('file', image);
        formData.append('api_key', config.apiKey);
        formData.append('timestamp', String(timestamp));
        formData.append('signature', signature);
        formData.append('folder', folder);
        formData.append('public_id', cleanPublicId);

        const resourceType = isVideo ? 'video' : 'image';
        const cRes = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/upload`, {
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const cData = await cRes.json();
        if (cData && cData.secure_url) {
          const optimized = isVideo ? cData.secure_url : cData.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');
          console.log(`⚡ [Media Engine] Uploaded ${isVideo ? 'video' : 'image'} to Cloudinary CDN (${storeId}): ${optimized}`);
          return res.json({ 
            success: true, 
            url: optimized, 
            provider: 'cloudinary',
            speed: 'ultra_fast_cdn',
            isVideo,
            storeId
          });
        }
      }
    } catch (cErr) {
      console.warn(`⚠️ [Cloudinary Fallback] Store ${storeId}:`, cErr.message);
    }

    // 2. Try Secondary Cloud Provider: ImgBB (Only for images, ImgBB does not support video)
    if (!isVideo) {
      try {
        const imgbbUrl = await uploadToImgbb(image, filename);
        if (imgbbUrl) {
          console.log(`⚡ [Media Engine] Uploaded to ImgBB (${storeId}): ${imgbbUrl}`);
          return res.json({ 
            success: true, 
            url: imgbbUrl, 
            provider: 'imgbb',
            speed: 'cloud_free',
            storeId
          });
        }
      } catch (iErr) {
        console.warn(`⚠️ [ImgBB Fallback] Store ${storeId}:`, iErr.message);
      }
    }

    // 3. Fallback: Local Disk Storage (Always succeeds, zero downtime)
    const uploadsDir = DataLayer.getUploadsDir(storeId);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    let fileData;
    let ext = isVideo ? '.mp4' : '.jpg';
    if (image.startsWith('data:')) {
      const matches = image.match(/^data:([^;]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        fileData = Buffer.from(matches[2], 'base64');
        const mime = matches[1].toLowerCase();
        if (mime === 'video/mp4') ext = '.mp4';
        else if (mime === 'video/webm') ext = '.webm';
        else if (mime === 'video/ogg') ext = '.ogg';
        else if (mime === 'video/quicktime') ext = '.mov';
        else if (mime === 'image/png') ext = '.png';
        else if (mime === 'image/jpeg' || mime === 'image/jpg') ext = '.jpg';
        else if (mime === 'image/webp') ext = '.webp';
        else if (mime === 'image/gif') ext = '.gif';
      } else {
        fileData = Buffer.from(image.replace(/^data:[^;]+;base64,/, ''), 'base64');
      }
    } else {
      fileData = Buffer.from(image, 'base64');
    }

    const uniqueFilename = `${Date.now()}-${generateUUID().split('-')[0]}${filename ? '-' + filename.replace(/[^a-zA-Z0-9._-]/g, '') : ext}`;
    const filePath = path.join(uploadsDir, uniqueFilename);
    fs.writeFileSync(filePath, fileData);

    const localUrl = `/uploads/${storeId}/uploads/${uniqueFilename}`;
    console.log(`💾 [Media Engine] Saved ${isVideo ? 'video' : 'image'} to Local Storage (${storeId}): ${localUrl}`);
    return res.json({ 
      success: true, 
      url: localUrl, 
      provider: 'local',
      isVideo,
      storeId
    });
  } catch (error) {
    console.error('Media upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload media', error: error.message });
  }
};

/**
 * Health check & status for the Media Engine
 */
export const getMediaStatus = (req, res) => {
  const storeId = req.storeId || 'shawarma';
  const cConfig = getCloudinaryConfig(storeId);
  const hasImgbb = Boolean(process.env.IMGBB_API_KEY);

  res.json({
    activeProvider: cConfig ? 'cloudinary' : (hasImgbb ? 'imgbb' : 'local'),
    cloudinary: {
      enabled: Boolean(cConfig),
      cloudName: cConfig ? cConfig.cloudName : null,
      folder: `churuone/${storeId}`
    },
    imgbb: {
      enabled: hasImgbb
    },
    local: {
      enabled: true,
      directory: DataLayer.getUploadsDir(storeId)
    },
    storeId
  });
};
