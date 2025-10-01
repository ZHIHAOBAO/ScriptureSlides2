// Cloudinary 配置和工具函数（浏览器端）

// Cloudinary 配置（客户端）
const CLOUDINARY_CONFIG = {
  cloud_name: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key: import.meta.env.VITE_CLOUDINARY_API_KEY,
  upload_preset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'scripture_slides'
};

// 验证配置
export const isCloudinaryConfigured = () => {
  console.log('=== Cloudinary 配置检查 ===');
  console.log('Cloud Name:', CLOUDINARY_CONFIG.cloud_name);
  console.log('Upload Preset:', CLOUDINARY_CONFIG.upload_preset);
  console.log('API Key:', CLOUDINARY_CONFIG.api_key);
  console.log('环境变量 VITE_CLOUDINARY_CLOUD_NAME:', import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);
  console.log('环境变量 VITE_CLOUDINARY_UPLOAD_PRESET:', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
  console.log('环境变量 VITE_CLOUDINARY_API_KEY:', import.meta.env.VITE_CLOUDINARY_API_KEY);
  
  const isConfigured = !!(CLOUDINARY_CONFIG.cloud_name && CLOUDINARY_CONFIG.upload_preset);
  console.log('配置状态:', isConfigured);
  
  // 显示详细的配置缺失信息
  if (!isConfigured) {
    const missing = [];
    if (!CLOUDINARY_CONFIG.cloud_name) missing.push('VITE_CLOUDINARY_CLOUD_NAME');
    if (!CLOUDINARY_CONFIG.upload_preset) missing.push('VITE_CLOUDINARY_UPLOAD_PRESET');
    console.error('缺失的环境变量:', missing.join(', '));
    console.error('请在 Vercel 项目设置中添加这些环境变量');
  }
  
  return isConfigured;
};

// 生成 Cloudinary 上传 URL
export const getCloudinaryUploadUrl = () => {
  if (!CLOUDINARY_CONFIG.cloud_name) {
    throw new Error('Cloudinary cloud_name 未配置');
  }
  return `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/image/upload`;
};

// 生成 Cloudinary 图片 URL（带优化参数）
export const getOptimizedImageUrl = (publicId, options = {}) => {
  if (!publicId || !CLOUDINARY_CONFIG.cloud_name) {
    return null;
  }
  
  const {
    width = 800,
    height = 600,
    quality = 'auto',
    format = 'auto',
    crop = 'fill'
  } = options;
  
  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloud_name}/image/upload/w_${width},h_${height},c_${crop},q_${quality},f_${format}/${publicId}`;
};

// 生成缩略图 URL
export const getThumbnailUrl = (publicId) => {
  return getOptimizedImageUrl(publicId, {
    width: 150,
    height: 150,
    crop: 'thumb'
  });
};

// 获取原图 URL
export const getOriginalImageUrl = (publicId) => {
  if (!publicId || !CLOUDINARY_CONFIG.cloud_name) {
    return null;
  }
  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloud_name}/image/upload/${publicId}`;
};

export { CLOUDINARY_CONFIG };