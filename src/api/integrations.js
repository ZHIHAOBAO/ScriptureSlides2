import { base44 } from './base44Client';
import { 
  isCloudinaryConfigured, 
  getCloudinaryUploadUrl, 
  CLOUDINARY_CONFIG 
} from '../config/cloudinary.js';

// Cloudinary 图片上传
const uploadToCloudinary = async (file) => {
  // Cloudinary 上传调试信息
  
  if (!isCloudinaryConfigured()) {
    // Cloudinary 配置不完整
    throw new Error('Cloudinary 未正确配置，请检查环境变量');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.upload_preset);
  
  // 注意：对于 unsigned upload，不需要添加 cloud_name
  // 也不需要 API key，因为使用的是 unsigned preset
  
  // 添加标签以便管理（可选）
  // formData.append('tags', 'scripture_slides,background_image');
  
  // 添加自定义文件夹（可选）
  // formData.append('folder', 'scripture-slides/backgrounds');
  
  const uploadUrl = getCloudinaryUploadUrl();
  // 上传信息

  try {
    // 开始上传到 Cloudinary
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      // 不要设置 Content-Type，让浏览器自动处理 multipart/form-data
    });

    // 响应信息
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        // Cloudinary 详细错误信息
      } catch (e) {
        errorData = await response.text();
        // Cloudinary 错误文本
      }
      
      // Cloudinary 响应错误
      
      let errorMessage = `Cloudinary 上传失败: ${response.status}`;
      if (errorData) {
        if (typeof errorData === 'object' && errorData.error) {
          errorMessage += ` - ${errorData.error.message || errorData.error}`;
        } else {
          errorMessage += ` - ${errorData}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    // Cloudinary 上传成功
    
    return {
      file_url: result.secure_url,
      public_id: result.public_id,
      filename: result.original_filename || file.name,
      size: result.bytes,
      type: file.type,
      width: result.width,
      height: result.height,
      format: result.format,
      upload_id: result.public_id,
      thumbnail_url: result.eager?.[0]?.secure_url || result.secure_url,
      success: true,
      provider: 'cloudinary'
    };
  } catch (error) {
    // Cloudinary 上传错误
    throw new Error(`图片上传到云端失败: ${error.message}`);
  }
};

// 本地文件上传处理（降级方案）
const uploadLocally = async (file) => {
  // 文件验证
  if (!file) {
    return Promise.reject(new Error('未选择文件'));
  }
  
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    return Promise.reject(new Error('文件大小不能超过10MB'));
  }
  
  if (!file.type.startsWith('image/')) {
    return Promise.reject(new Error('只支持图片文件'));
  }
  
  // 创建本地文件URL
  return new Promise((resolve, reject) => {
    try {
      const fileUrl = URL.createObjectURL(file);
      
      // 模拟上传延迟
      setTimeout(() => {
        resolve({
          file_url: fileUrl,
          filename: file.name,
          size: file.size,
          type: file.type,
          upload_id: 'local_' + Date.now(),
          success: true,
          provider: 'local'
        });
      }, 500); // 0.5秒延迟模拟上传过程
      
    } catch (error) {
      reject(new Error('文件处理失败：' + error.message));
    }
  });
};

// 智能文件上传（优先使用 Cloudinary，降级到本地）
export const UploadFile = base44?.integrations?.Core?.UploadFile || (async ({ file }) => {
  // 文件基础验证
  if (!file) {
    throw new Error('未选择文件');
  }
  
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    throw new Error('文件大小不能超过10MB');
  }
  
  if (!file.type.startsWith('image/')) {
    throw new Error('只支持图片文件');
  }

  // 优先尝试 Cloudinary 上传
  if (isCloudinaryConfigured()) {
    try {
      return await uploadToCloudinary(file);
    } catch (cloudinaryError) {
      // Cloudinary 上传失败，回退到本地存储
      // 继续执行本地上传
    }
  }
  
  // 降级到本地存储
  return await uploadLocally(file);
});