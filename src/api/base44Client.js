import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// 创建一个完全去除认证的客户端包装器
let base44Client = null;

// 先创建降级客户端，防止应用崩溃
const createFallbackClient = () => ({
  entities: {
    BiblePresentation: {
      list: () => {
        console.log('使用降级BiblePresentation.list');
        return Promise.resolve([]);
      },
      create: () => {
        console.log('使用降级BiblePresentation.create');
        return Promise.reject(new Error('API不可用'));
      }
    },
    UserImage: {
      list: () => {
        console.log('使用降级UserImage.list');
        return Promise.resolve([]);
      },
      create: () => {
        console.log('使用降级UserImage.create');
        return Promise.reject(new Error('API不可用'));
      },
      delete: () => {
        console.log('使用降级UserImage.delete');
        return Promise.reject(new Error('API不可用'));
      }
    },
    CommunityBackgroundImage: {
      list: () => {
        console.log('使用降级CommunityBackgroundImage.list');
        return Promise.resolve([]);
      },
      create: () => {
        console.log('使用降级CommunityBackgroundImage.create');
        return Promise.reject(new Error('API不可用'));
      },
      update: () => {
        console.log('使用降级CommunityBackgroundImage.update');
        return Promise.reject(new Error('API不可用'));
      },
      delete: () => {
        console.log('使用降级CommunityBackgroundImage.delete');
        return Promise.reject(new Error('API不可用'));
      }
    }
  },
  functions: {
    fetchBibleContent: () => {
      console.log('使用降级fetchBibleContent');
      return Promise.resolve({ data: null, error: new Error('API不可用') });
    }
  },
  integrations: {
    Core: {
    UploadFile: ({ file }) => {
        console.log('使用本地文件上传处理');
        
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
                        success: true
                    });
                }, 500); // 0.5秒延迟模拟上传过程
                
            } catch (error) {
                reject(new Error('文件处理失败：' + error.message));
            }
        });
    }
    }
  },
  auth: {
    getCurrentUser: () => {
      console.log('使用降级getCurrentUser');
      return Promise.resolve(null);
    },
    login: () => {
      console.log('使用降级login');
      return Promise.reject(new Error('认证服务不可用'));
    },
    logout: () => {
      console.log('使用降级logout');
      return Promise.resolve();
    }
  }
});

// 直接使用降级客户端，不再尝试创建真实的Base44客户端
console.log('初始化降级客户端，绕过Base44认证');
base44Client = createFallbackClient();

export const base44 = base44Client;
