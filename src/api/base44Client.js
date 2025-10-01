import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

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
      list: () => {
        // 从 localStorage 获取用户上传的图片历史
        try {
          const stored = localStorage.getItem('scripture_user_images');
          const images = stored ? JSON.parse(stored) : [];
          return Promise.resolve(images);
        } catch (error) {
          console.error('加载用户图片失败:', error);
          return Promise.resolve([]);
        }
      },
      create: (imageData) => {
        // 保存到 localStorage
        try {
          const stored = localStorage.getItem('scripture_user_images');
          const images = stored ? JSON.parse(stored) : [];
          
          // 添加时间戳和 ID
          const newImage = {
            ...imageData,
            id: Date.now().toString(),
            created_at: new Date().toISOString(),
            provider: imageData.provider || 'local'
          };
          
          images.unshift(newImage); // 新图片放在最前面
          
          // 限制最多保存 50 张图片
          if (images.length > 50) {
            images.splice(50);
          }
          
          localStorage.setItem('scripture_user_images', JSON.stringify(images));
          return Promise.resolve(newImage);
        } catch (error) {
          console.error('保存用户图片失败:', error);
          return Promise.reject(new Error('保存图片失败'));
        }
      },
      delete: (imageId) => {
        try {
          const stored = localStorage.getItem('scripture_user_images');
          const images = stored ? JSON.parse(stored) : [];
          
          const filteredImages = images.filter(img => 
            img.id !== imageId && 
            img.upload_id !== imageId
          );
          
          localStorage.setItem('scripture_user_images', JSON.stringify(filteredImages));
          return Promise.resolve({ success: true });
        } catch (error) {
          console.error('删除用户图片失败:', error);
          return Promise.reject(new Error('删除图片失败'));
        }
      },
      clear: () => {
        try {
          localStorage.removeItem('scripture_user_images');
          return Promise.resolve({ success: true });
        } catch (error) {
          return Promise.reject(new Error('清空图片失败'));
        }
      }
    },
    CommunityBackgroundImage: {
      list: () => {
        return Promise.resolve([]);
      },
      create: () => {
        return Promise.reject(new Error('API不可用'));
      },
      update: () => {
        return Promise.reject(new Error('API不可用'));
      },
      delete: () => {
        return Promise.reject(new Error('API不可用'));
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

export const base44 = base44Client;