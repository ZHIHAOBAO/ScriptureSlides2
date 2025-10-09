import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isCloudinaryConfigured, getThumbnailUrl, getOptimizedImageUrl } from '@/config/cloudinary';
import { Upload, Trash2, Eye, Cloud, HardDrive, Settings, AlertCircle } from 'lucide-react';

export default function CloudinaryImageManager({ 
  images = [], 
  onUpload, 
  onDelete, 
  onSelect,
  selectedImageId = null 
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [cloudinaryEnabled, setCloudinaryEnabled] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => {
    const enabled = isCloudinaryConfigured();
    setCloudinaryEnabled(enabled);
    
    // 输出配置调试信息
    console.log('=== CloudinaryImageManager 组件启动 ===');
    console.log('环境变量:');
    console.log('  VITE_CLOUDINARY_CLOUD_NAME:', import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);
    console.log('  VITE_CLOUDINARY_API_KEY:', import.meta.env.VITE_CLOUDINARY_API_KEY ? '已配置' : '未配置');
    console.log('  VITE_CLOUDINARY_UPLOAD_PRESET:', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    console.log('Cloudinary 配置状态:', enabled);
  }, []);

  // 直接上传到 Cloudinary 的函数
  const uploadDirectlyToCloudinary = async (file) => {
    console.log('uploadDirectlyToCloudinary 开始，接收到的文件对象:', file);
    
    if (!file || typeof file !== 'object') {
      throw new Error('无效的文件对象');
    }

    // 检查是否是真正的 File 对象
    if (!(file instanceof File) && !(file instanceof Blob)) {
      console.error('传入的不是 File 或 Blob 对象:', file);
      throw new Error('传入的对象不是有效的文件类型');
    }

    console.log('开始 Cloudinary 上传:', {
      name: file.name,
      type: file.type,
      size: file.size,
      constructor: file.constructor.name
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      throw new Error('VITE_CLOUDINARY_CLOUD_NAME 环境变量未配置');
    }

    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    if (!uploadPreset) {
      throw new Error('VITE_CLOUDINARY_UPLOAD_PRESET 环境变量未配置');
    }

    console.log('FormData 内容:');
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value);
    }

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      console.log('Cloudinary 响应状态:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.error('Cloudinary 错误响应 JSON:', errorData);
          errorMessage = errorData.error?.message || errorMessage;
        } catch (parseError) {
          const errorText = await response.text();
          console.error('Cloudinary 错误响应 Text:', errorText);
        }
        throw new Error(`Cloudinary 上传失败: ${errorMessage}`);
      }

      const result = await response.json();
      console.log('Cloudinary 上传成功响应:', result);
      return result;
    } catch (fetchError) {
      console.error('Cloudinary 上传请求异常:', fetchError);
      throw fetchError;
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('CloudinaryImageManager 选择的文件:', file);

    // 文件验证 - 添加 null/undefined 检查
    if (!file.type || typeof file.type !== 'string') {
      console.error('文件类型信息缺失:', file);
      setUploadError('无法识别文件类型');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setUploadError('请选择图片文件');
      return;
    }

    if (!file.size || file.size > 10 * 1024 * 1024) { // 10MB
      setUploadError('图片文件不能超过10MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    
    try {
      if (cloudinaryEnabled) {
        // 直接上传到 Cloudinary
        console.log('开始上传到 Cloudinary...');
        const cloudinaryResult = await uploadDirectlyToCloudinary(file);
        console.log('Cloudinary 上传成功:', cloudinaryResult);
        
        const uploadResult = {
          upload_id: cloudinaryResult.public_id,
          public_id: cloudinaryResult.public_id,
          file_url: cloudinaryResult.secure_url,
          filename: file.name || 'unnamed',
          provider: 'cloudinary',
          width: cloudinaryResult.width,
          height: cloudinaryResult.height,
          format: cloudinaryResult.format,
          size: cloudinaryResult.bytes
        };

        // 直接保存到本地存储
        try {
          const { base44 } = await import('@/api/base44Client');
          await base44.entities.UserImage.create(uploadResult);
          console.log('已保存到用户图片列表:', uploadResult);
        } catch (saveError) {
          console.warn('保存到用户图片列表失败:', saveError);
        }

        console.log('Cloudinary 上传完成');
        
        // 触发父组件重新加载图片列表
        if (typeof onUpload === 'function') {
          onUpload('reload');
        }
      } else {
        // 使用现有的 UploadFile API（本地存储）
        // 使用本地存储上传
        if (typeof onUpload === 'function') {
          // 让父组件处理本地上传逻辑
          await onUpload(file);
        } else {
          throw new Error('上传函数未定义');
        }
      }
    } catch (error) {
      // 上传失败
      setUploadError(error.message || '上传失败，请重试');
    } finally {
      setIsUploading(false);
      // 清空input值，允许上传同一个文件
      event.target.value = '';
    }
  };

  const getImageUrl = (image) => {
    if (!image) return '';
    
    if (image.provider === 'cloudinary' && image.public_id && cloudinaryEnabled) {
      try {
        return getOptimizedImageUrl(image.public_id, { width: 400, height: 300 });
      } catch (error) {
        // 获取 Cloudinary 优化 URL 失败，使用原始 URL
        return image.file_url || '';
      }
    }
    return image.file_url || '';
  };

  const getThumbnail = (image) => {
    if (!image) return '';
    
    if (image.provider === 'cloudinary' && image.public_id && cloudinaryEnabled) {
      try {
        return getThumbnailUrl(image.public_id);
      } catch (error) {
        // 获取 Cloudinary 缩略图失败，使用原始 URL
        return image.file_url || '';
      }
    }
    return image.file_url || '';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          云端图片管理
          {cloudinaryEnabled ? (
            <Badge variant="outline" className="text-green-600">
              <Cloud className="h-3 w-3 mr-1" />
              Cloudinary
            </Badge>
          ) : (
            <Badge variant="outline" className="text-gray-600">
              <HardDrive className="h-3 w-3 mr-1" />
              本地存储
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 错误提示 */}
        {uploadError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        {/* 配置状态提示 */}
        {!cloudinaryEnabled && (
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              Cloudinary 未配置，当前使用本地存储。
            </AlertDescription>
          </Alert>
        )}

        {/* 上传按钮 */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="cloudinary-image-upload"
            disabled={isUploading}
          />
          <label htmlFor="cloudinary-image-upload">
            <Button 
              asChild 
              disabled={isUploading}
              className="cursor-pointer"
            >
              <span>
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? '上传中...' : `上传到${cloudinaryEnabled ? '云端' : '本地'}`}
              </span>
            </Button>
          </label>
          
          {cloudinaryEnabled && (
            <Badge variant="secondary">
              支持自动优化和 CDN 加速
            </Badge>
          )}
        </div>

        {/* 图片网格 */}
        {images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div 
                key={image.upload_id || image.id}
                className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                  selectedImageId === (image.upload_id || image.id)
                    ? 'border-blue-500 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onSelect?.(image)}
              >
                {/* 图片 */}
                <div className="aspect-square bg-gray-100">
                  <img
                    src={getThumbnail(image)}
                    alt={image.filename || image.name || '背景图片'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      // 图片加载失败
                      e.target.style.display = 'none';
                      e.target.parentNode.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-500 text-xs">图片加载失败</div>';
                    }}
                  />
                </div>
                
                {/* 图片信息覆盖层 */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all">
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(getImageUrl(image), '_blank');
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('确定要删除这张图片吗？')) {
                            onDelete?.(image);
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 存储提供商标识 */}
                <div className="absolute top-1 right-1">
                  {image.provider === 'cloudinary' ? (
                    <Badge variant="outline" className="text-xs bg-white/90">
                      <Cloud className="h-2 w-2 mr-1" />
                      云端
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs bg-white/90">
                      <HardDrive className="h-2 w-2 mr-1" />
                      本地
                    </Badge>
                  )}
                </div>

                {/* 选中状态指示器 */}
                {selectedImageId === (image.upload_id || image.id) && (
                  <div className="absolute top-1 left-1">
                    <Badge className="text-xs bg-blue-500">
                      已选择
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>还没有上传任何背景图片</p>
            <p className="text-sm">点击上传按钮开始添加图片</p>
          </div>
        )}

        {/* 统计信息 */}
        {images.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex justify-between text-sm text-gray-600">
              <span>共 {images.length} 张图片</span>
              <div className="flex gap-4">
                <span>
                  云端: {images.filter(img => img.provider === 'cloudinary').length}
                </span>
                <span>
                  本地: {images.filter(img => img.provider !== 'cloudinary').length}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}