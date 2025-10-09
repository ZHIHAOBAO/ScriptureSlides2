// import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';
import { uploadImageToCloudinary, deleteImageFromCloudinary, validateImageFile, listCloudinaryImages } from '../services/cloudinaryService.js';
import { crossBrowserSync } from '../services/crossBrowserSync.js';

// 创建一个完全去除认证的客户端包装器
let base44Client = null;

// 先创建降级客户端，防止应用崩溃
const createFallbackClient = () => ({
  entities: {
    BiblePresentation: {
      list: () => {
        return Promise.resolve([]);
      },
      create: () => {
        return Promise.reject(new Error('API不可用'));
      }
    },
    UserImage: {
      list: async () => {
        // 从云端获取所有用户上传的图片
        try {
          // 使用 IndexedDB 实现跨浏览器同步
          const crossBrowserImages = await crossBrowserSync.getAllImages();
          
          // 也从 localStorage 加载传统数据（兼容性）
          const stored = localStorage.getItem('cloudinary_user_images');
          const localImages = stored ? JSON.parse(stored) : [];
          
          // 合并数据，去重
          const allImages = [...crossBrowserImages];
          
          localImages.forEach(localImg => {
            const exists = allImages.some(img => 
              img.public_id === localImg.public_id || 
              img.id === localImg.id
            );
            if (!exists) {
              allImages.push(localImg);
            }
          });
          
          // 按时间排序
          allImages.sort((a, b) => {
            const timeA = new Date(a.created_at || a.upload_date || 0).getTime();
            const timeB = new Date(b.created_at || b.upload_date || 0).getTime();
            return timeB - timeA;
          });
          
          console.log('从云端加载了', allImages.length, '张用户图片');
          return Promise.resolve(allImages);
        } catch (error) {
          console.error('加载云端图片失败:', error);
          return Promise.resolve([]);
        }
      },
      create: async (imageData) => {
        // 上传图片到 Cloudinary 云端存储
        try {
          // 验证图片文件
          if (imageData.file) {
            const validation = validateImageFile(imageData.file);
            if (!validation.valid) {
              throw new Error(validation.errors.join(', '));
            }
          }
          
          console.log('🚀 开始上传图片到 Cloudinary...');
          
          // 上传到 Cloudinary
          const uploadResult = await uploadImageToCloudinary(imageData.file, {
            folder: 'scripture-slides/user-uploads',
            tags: ['user-upload', 'background']
          });
          
          // 创建数据库记录
          const imageRecord = {
            id: Date.now().toString(),
            name: imageData.name || imageData.file.name,
            filename: imageData.file.name,
            file_size: imageData.file.size,
            file_type: imageData.file.type,
            is_local_upload: false, // 标记为云端上传
            upload_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
            provider: 'cloudinary',
            
            // Cloudinary 特有字段
            public_id: uploadResult.public_id,
            secure_url: uploadResult.secure_url,
            url: uploadResult.url,
            thumbnail_url: uploadResult.thumbnail_url,
            optimized_url: uploadResult.optimized_url,
            width: uploadResult.width,
            height: uploadResult.height,
            format: uploadResult.format,
            bytes: uploadResult.bytes,
            
            // 兼容字段
            file_url: uploadResult.secure_url,
            image_url: uploadResult.secure_url,
            has_image_data: true
          };
          
          // 保存到本地元数据存储和 IndexedDB
          const stored = localStorage.getItem('cloudinary_user_images');
          const images = stored ? JSON.parse(stored) : [];
          
          images.unshift(imageRecord);
          
          // 保留最近20条记录
          if (images.length > 20) {
            images.splice(20);
          }
          
          // 保存到 localStorage
          localStorage.setItem('cloudinary_user_images', JSON.stringify(images));
          
          // 同时保存到 IndexedDB 实现跨浏览器同步
          try {
            await crossBrowserSync.saveImage(imageRecord);
            console.log('✅ 图片元数据已同步到 IndexedDB');
          } catch (syncError) {
            console.warn('IndexedDB 同步失败:', syncError);
          }
          
          console.log('✅ 图片成功上传到 Cloudinary 云端存储');
          console.log('Public ID:', uploadResult.public_id);
          console.log('URL:', uploadResult.secure_url);
          
          return Promise.resolve(imageRecord);
          
        } catch (error) {
          console.error('上传图片到云端失败:', error);
          throw new Error(`云端上传失败: ${error.message}`);
        }
      },
      delete: async (imageId) => {
        try {
          // 从本地元数据中查找图片记录
          const stored = localStorage.getItem('cloudinary_user_images');
          if (!stored) {
            return Promise.resolve({ success: true, deleted_id: imageId });
          }
          
          const images = JSON.parse(stored);
          const imageToDelete = images.find(img => img.id === imageId);
          
          if (imageToDelete && imageToDelete.public_id) {
            // 删除 Cloudinary 中的图片（需要后端 API）
            await deleteImageFromCloudinary(imageToDelete.public_id);
          }
          
          // 从本地元数据中删除
          const filteredImages = images.filter(img => img.id !== imageId);
          localStorage.setItem('cloudinary_user_images', JSON.stringify(filteredImages));
          
          // 从 IndexedDB 中删除
          try {
            await crossBrowserSync.deleteImage(imageId);
            console.log('✅ 图片元数据已从 IndexedDB 删除');
          } catch (syncError) {
            console.warn('IndexedDB 删除失败:', syncError);
          }
          
          console.log('✅ 图片已从云端删除');
          return Promise.resolve({ success: true, deleted_id: imageId });
          
        } catch (error) {
          console.error('删除云端图片失败:', error);
          return Promise.reject(new Error('删除图片失败'));
        }
      },
      clear: async () => {
        try {
          // 清空本地元数据
          localStorage.removeItem('cloudinary_user_images');
          // 清理旧的本地数据
          localStorage.removeItem('scripture_user_images');
          localStorage.removeItem('deleted_sample_images');
          
          // 清空 IndexedDB
          try {
            await crossBrowserSync.clearAllImages();
            console.log('✅ 已清空 IndexedDB 中的所有图片记录');
          } catch (syncError) {
            console.warn('IndexedDB 清空失败:', syncError);
          }
          
          console.log('✅ 已清空所有图片记录');
          return Promise.resolve({ success: true });
        } catch (error) {
          return Promise.reject(new Error('清空图片失败'));
        }
      }
    }
  },
  functions: {
    fetchBibleContent: () => {
      return Promise.resolve({ data: null, error: new Error('API不可用') });
    }
  },
  integrations: {
    Core: {
      UploadFile: (input) => {
        console.log('UploadFile 接收到的参数:', input);
        
        // 处理不同的参数格式
        let file;
        if (input && typeof input === 'object') {
          if (input.file) {
            // 格式: { file: FileObject }
            file = input.file;
          } else if (input.constructor === File || input.type || input.size !== undefined) {
            // 格式: FileObject (直接传入文件对象)
            file = input;
          } else {
            console.error('无效的参数格式:', input);
            return Promise.reject(new Error('无效的文件参数格式'));
          }
        } else {
          console.error('参数不是对象或为空:', input);
          return Promise.reject(new Error('参数必须是对象或文件'));
        }
        
        // 文件验证
        if (!file) {
          console.error('文件对象为空');
          return Promise.reject(new Error('未选择文件'));
        }
        
        // 检查文件大小
        if (typeof file.size === 'number' && file.size > 10 * 1024 * 1024) { // 10MB limit
          return Promise.reject(new Error('文件大小不能超过10MB'));
        }
        
        // 检查文件类型 - 添加空值检查
        if (file.type && typeof file.type === 'string') {
          if (!file.type.startsWith('image/')) {
            return Promise.reject(new Error('只支持图片文件'));
          }
        } else {
          console.warn('无法验证文件类型，跳过类型检查');
        }
        
        // 创建本地文件URL
        return new Promise((resolve, reject) => {
          try {
            console.log('开始处理文件:', {
              name: file.name,
              type: file.type,
              size: file.size
            });
            
            const fileUrl = URL.createObjectURL(file);
            
            // 模拟上传延迟
            setTimeout(() => {
              const result = {
                file_url: fileUrl,
                filename: file.name || 'unnamed',
                size: file.size || 0,
                type: file.type || 'unknown',
                upload_id: 'local_' + Date.now(),
                success: true,
                provider: 'local'
              };
              
              console.log('UploadFile 返回结果:', result);
              resolve(result);
            }, 500); // 0.5秒延迟模拟上传过程
            
          } catch (error) {
            console.error('文件处理失败:', error);
            reject(new Error('文件处理失败：' + error.message));
          }
        });
      }
    }
  },
  auth: {
    getCurrentUser: () => {
      return Promise.resolve(null);
    },
    login: () => {
      return Promise.reject(new Error('认证服务不可用'));
    },
    logout: () => {
      return Promise.resolve();
    }
  }
});

// 直接使用降级客户端，不再尝试创建真实的Base44客户端
base44Client = createFallbackClient();

// 清理旧的示例图片删除记录
try {
  localStorage.removeItem('deleted_sample_images');
} catch (e) {
  console.warn('清理旧数据失败:', e);
}

export const base44 = base44Client;