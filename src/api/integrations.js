import { base44 } from './base44Client';

// 安全的集成导出，确保即使 API 不可用也不会导致错误
export const Core = base44?.integrations?.Core || {};

export const InvokeLLM = base44?.integrations?.Core?.InvokeLLM || (() => Promise.reject(new Error('集成服务不可用')));

export const SendEmail = base44?.integrations?.Core?.SendEmail || (() => Promise.reject(new Error('集成服务不可用')));

export const UploadFile = base44?.integrations?.Core?.UploadFile || (({ file }) => {
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
});

export const GenerateImage = base44?.integrations?.Core?.GenerateImage || (() => Promise.reject(new Error('集成服务不可用')));

export const ExtractDataFromUploadedFile = base44?.integrations?.Core?.ExtractDataFromUploadedFile || (() => Promise.reject(new Error('集成服务不可用')));

export const CreateFileSignedUrl = base44?.integrations?.Core?.CreateFileSignedUrl || (() => Promise.reject(new Error('集成服务不可用')));

export const UploadPrivateFile = base44?.integrations?.Core?.UploadPrivateFile || (() => Promise.reject(new Error('集成服务不可用')));






