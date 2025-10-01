import { base44 } from './base44Client';
import { 
  isCloudinaryConfigured, 
  getCloudinaryUploadUrl, 
  CLOUDINARY_CONFIG 
} from '../config/cloudinary.js';

// Cloudinary 图片上传
const uploadToCloudinary = async (file) => {
  console.log('=== Cloudinary 上传调试信息 ===');
  console.log('Cloud Name:', CLOUDINARY_CONFIG.cloud_name);
  console.log('Upload Preset:', CLOUDINARY_CONFIG.upload_preset);
  console.log('配置状态:', isCloudinaryConfigured());
  
  if (!isCloudinaryConfigured()) {
    console.error('Cloudinary 配置不完整:', {
      cloud_name: CLOUDINARY_CONFIG.cloud_name,
      upload_preset: CLOUDINARY_CONFIG.upload_preset
    });
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
  console.log('上传 URL:', uploadUrl);
  console.log('文件信息:', {
    name: file.name,
    size: file.size,
    type: file.type
  });

  try {
    console.log('开始上传到 Cloudinary...');
    console.log('FormData 内容:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      // 不要设置 Content-Type，让浏览器自动处理 multipart/form-data
    });

    console.log('响应状态:', response.status);
    console.log('响应头:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error('Cloudinary 详细错误信息:', errorData);
      } catch (e) {
        errorData = await response.text();
        console.error('Cloudinary 错误文本:', errorData);
      }
      
      console.error('Cloudinary 响应错误:', {
        status: response.status,
        statusText: response.statusText,
        errorData: errorData
      });
      
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
    console.log('Cloudinary 上传成功:', result);
    
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
    console.error('Cloudinary 上传错误:', error);
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
      console.warn('Cloudinary 上传失败，回退到本地存储:', cloudinaryError.message);
      // 继续执行本地上传
    }
  }
  
  // 降级到本地存储
  return await uploadLocally(file);
});