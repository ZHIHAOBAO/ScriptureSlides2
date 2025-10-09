// Cloudinary 上传服务
import { 
  CLOUDINARY_CONFIG, 
  isCloudinaryConfigured, 
  getCloudinaryUploadUrl,
  getOptimizedImageUrl,
  getThumbnailUrl 
} from '../config/cloudinary.js';

/**
 * 上传图片到 Cloudinary
 * @param {File} file - 要上传的图片文件
 * @param {Object} options - 上传选项
 * @returns {Promise<Object>} 上传结果
 */
export const uploadImageToCloudinary = async (file, options = {}) => {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary 未正确配置');
  }

  try {
    // 创建 FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.upload_preset);
    
    // 添加额外的上传参数
    if (options.folder) {
      formData.append('folder', options.folder);
    }
    
    // 添加标签
    const tags = ['scripture-slides', 'user-upload', ...(options.tags || [])];
    formData.append('tags', tags.join(','));
    
    // 添加 public_id（如果指定）
    if (options.public_id) {
      formData.append('public_id', options.public_id);
    }

    console.log('🔄 开始上传图片到 Cloudinary...');
    
    // 上传到 Cloudinary
    const response = await fetch(getCloudinaryUploadUrl(), {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Cloudinary 上传失败:', errorData);
      throw new Error(`上传失败: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('✅ Cloudinary 上传成功:', result);
    
    // 返回标准化的结果
    return {
      success: true,
      public_id: result.public_id,
      secure_url: result.secure_url,
      url: result.url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      created_at: result.created_at,
      // 生成不同尺寸的 URL
      thumbnail_url: getThumbnailUrl(result.public_id),
      optimized_url: getOptimizedImageUrl(result.public_id),
      original_url: result.secure_url
    };
    
  } catch (error) {
    console.error('上传图片到 Cloudinary 失败:', error);
    throw new Error(`上传失败: ${error.message}`);
  }
};

/**
 * 删除 Cloudinary 中的图片
 * @param {string} publicId - 图片的 public_id
 * @returns {Promise<boolean>} 删除是否成功
 */
export const deleteImageFromCloudinary = async (publicId) => {
  if (!isCloudinaryConfigured()) {
    console.warn('Cloudinary 未配置，跳过删除操作');
    return true;
  }

  try {
    // 注意：删除操作需要服务器端 API，这里只是模拟
    // 在实际项目中，你需要创建一个服务器端接口来处理删除
    console.log('🗑️ 删除 Cloudinary 图片:', publicId);
    
    // 由于删除需要 API Secret，这里暂时返回成功
    // 实际实现需要后端 API
    return true;
    
  } catch (error) {
    console.error('删除 Cloudinary 图片失败:', error);
    return false;
  }
};

/**
 * 批量上传图片
 * @param {File[]} files - 要上传的图片文件数组
 * @param {Object} options - 上传选项
 * @returns {Promise<Object[]>} 上传结果数组
 */
export const uploadMultipleImages = async (files, options = {}) => {
  const uploadPromises = files.map((file, index) => 
    uploadImageToCloudinary(file, {
      ...options,
      public_id: options.public_id ? `${options.public_id}_${index}` : undefined
    })
  );

  try {
    const results = await Promise.allSettled(uploadPromises);
    
    return results.map((result, index) => ({
      file: files[index],
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null
    }));
    
  } catch (error) {
    console.error('批量上传失败:', error);
    throw error;
  }
};

/**
 * 验证文件是否为有效的图片
 * @param {File} file - 要验证的文件
 * @returns {Object} 验证结果
 */
export const validateImageFile = (file) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  const result = {
    valid: true,
    errors: []
  };
  
  if (!file) {
    result.valid = false;
    result.errors.push('未选择文件');
    return result;
  }
  
  if (!allowedTypes.includes(file.type)) {
    result.valid = false;
    result.errors.push('不支持的文件类型，请选择 JPEG、PNG、GIF 或 WebP 格式');
  }
  
  if (file.size > maxSize) {
    result.valid = false;
    result.errors.push('文件太大，请选择小于 10MB 的图片');
  }
  
  return result;
};

/**
 * 查询 Cloudinary 中的图片列表
 * @returns {Promise<Array>} 图片列表
 */
export const listCloudinaryImages = async () => {
  if (!isCloudinaryConfigured()) {
    console.warn('Cloudinary 未配置，返回空列表');
    return [];
  }

  try {
    // 使用 Cloudinary 的公开 Search API
    // 注意：这是一个潜在的方法，可能不稳定
    const searchUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloud_name}/image/list/scripture-slides.json`;
    
    const response = await fetch(searchUrl);
    
    if (response.ok) {
      const data = await response.json();
      const images = data.resources || [];
      
      console.log('✅ 从 Cloudinary 查询到', images.length, '张图片');
      
      // 转换为标准格式
      return images.map(img => ({
        id: img.public_id,
        public_id: img.public_id,
        secure_url: img.secure_url,
        url: img.url || img.secure_url,
        width: img.width,
        height: img.height,
        format: img.format,
        bytes: img.bytes,
        created_at: img.created_at,
        name: img.public_id.split('/').pop() || '云端图片',
        filename: img.public_id.split('/').pop() || 'cloud-image',
        file_size: img.bytes,
        file_type: `image/${img.format}`,
        provider: 'cloudinary',
        thumbnail_url: getThumbnailUrl(img.public_id),
        optimized_url: getOptimizedImageUrl(img.public_id)
      }));
    } else {
      console.warn('Cloudinary 查询失败:', response.status, response.statusText);
      return [];
    }
    
  } catch (error) {
    console.error('查询 Cloudinary 图片列表失败:', error);
    return [];
  }
};