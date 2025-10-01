import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CommunityBackgroundImage } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { User } from "@/api/entities";
import { isCloudinaryConfigured } from '@/config/cloudinary';
import {
  Upload,
  Download,
  Heart,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  Users,
  Sparkles,
  X,
  AlertCircle,
  Cloud,
  HardDrive
} from "lucide-react";
import { motion } from "framer-motion";

export default function BackgroundGallery({ isOpen, onClose, onSelectBackground, currentBackground }) {
  const [activeTab, setActiveTab] = useState("community");
  const [userImages, setUserImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: "",
    description: "",
    category: "nature"
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [cloudinaryEnabled, setCloudinaryEnabled] = useState(false);

  useEffect(() => {
    if (isOpen) {
      console.log('对话框打开，开始加载数据...');
      loadUserImages();
      setCloudinaryEnabled(isCloudinaryConfigured());
    }
  }, [isOpen]);

  const loadUserImages = async () => {
    try {
      console.log('开始加载用户图片...');
      const { base44 } = await import('@/api/base44Client');
      const images = await base44.entities.UserImage.list();
      console.log('原始用户图片数据:', images);
      const imageArray = Array.isArray(images) ? images : [];
      console.log('处理后的用户图片数组:', imageArray);
      setUserImages(imageArray);
    } catch (error) {
      console.error('加载用户图片失败:', error);
      setUserImages([]);
    }
  };

  const loadCommunityImages = async () => {
    // 由于现在社区分享直接显示用户图片，这个函数不再需要
    return;
  };

  const validateFile = (file) => {
    // 添加文件对象验证
    if (!file || typeof file !== 'object') {
      console.error('无效的文件对象:', file);
      alert('无效的文件');
      return false;
    }

    // 验证文件类型属性存在
    if (!file.type || typeof file.type !== 'string') {
      console.error('文件类型信息缺失:', file);
      alert('无法识别文件类型');
      return false;
    }

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return false;
    }
    
    if (!file.size || file.size > 10 * 1024 * 1024) { // 改为10MB
      alert('图片文件不能超过10MB');
      return false;
    }
    return true;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('选择的文件:', file);
    
    if (validateFile(file)) {
      setSelectedFile(file);
      // 安全地提取文件名
      const fileName = file.name || 'unnamed';
      const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
      setUploadForm((prev) => ({ ...prev, name: nameWithoutExt }));
    }
  };

  // 拖拽事件处理
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length > 0) {
      const file = files[0];
      console.log('拖拽的文件:', file);
      
      if (validateFile(file)) {
        setSelectedFile(file);
        const fileName = file.name || 'unnamed';
        const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
        setUploadForm((prev) => ({ ...prev, name: nameWithoutExt }));
      }
    }
  };

  // 直接上传到 Cloudinary
  const uploadDirectlyToCloudinary = async (file) => {
    if (!file) {
      throw new Error('文件对象为空');
    }

    console.log('开始上传到 Cloudinary:', file);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      throw new Error('Cloudinary Cloud Name 未配置');
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary 上传响应错误:', errorText);
      throw new Error(`Cloudinary 上传失败: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Cloudinary 上传成功:', result);
    
    return {
      upload_id: result.public_id,
      public_id: result.public_id,
      file_url: result.secure_url,
      filename: file.name || 'unnamed',
      provider: 'cloudinary', // 明确标记为cloudinary
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes
    };
  };

  const handleUploadToCloudinary = async (fileOrSignal) => {
    console.log('BackgroundGallery handleUploadToCloudinary 被调用:', fileOrSignal);
    
    try {
      // 如果是重载信号，只重新加载用户图片
      if (fileOrSignal === 'reload') {
        console.log('收到重载信号，重新加载用户图片');
        await loadUserImages();
        return;
      }
      
      // 如果是原始文件，处理上传 (应该只有本地存储会走到这里)
      const file = fileOrSignal;
      let result;
      
      if (cloudinaryEnabled) {
        console.log('警告：Cloudinary 启用时不应该走到这个分支');
        result = await uploadDirectlyToCloudinary(file);
      } else {
        // 对于本地存储，我们需要检查 UploadFile 函数的参数格式
        try {
          const uploadResult = await UploadFile({ file });
          result = {
            ...uploadResult,
            provider: 'local',
            filename: file?.name || 'unnamed'
          };
        } catch (uploadError) {
          console.error('UploadFile 调用失败:', uploadError);
          // 如果 UploadFile 失败，尝试不同的参数格式
          try {
            const uploadResult = await UploadFile(file);
            result = {
              ...uploadResult,
              provider: 'local',
              filename: file?.name || 'unnamed'
            };
          } catch (secondError) {
            console.error('UploadFile 第二次尝试也失败:', secondError);
            throw new Error('本地文件上传服务不可用，请尝试配置 Cloudinary 使用云端存储');
          }
        }
        
        // 保存到用户图片列表
        try {
          const { base44 } = await import('@/api/base44Client');
          await base44.entities.UserImage.create(result);
          console.log('已保存到用户图片列表:', result);
        } catch (saveError) {
          console.warn('保存到用户图片列表失败:', saveError);
          // 不抛出错误，因为文件已经上传成功
        }
        
        // 重新加载用户图片
        await loadUserImages();
      }
      
      return result;
    } catch (error) {
      console.error('上传失败:', error);
      throw error;
    }
  };

  const handleDeleteUserImage = async (image) => {
    if (!image) {
      console.error('图片对象为空');
      return;
    }

    try {
      const { base44 } = await import('@/api/base44Client');
      const imageId = image.upload_id || image.id;
      if (imageId) {
        await base44.entities.UserImage.delete(imageId);
      }
      
      // 重新加载用户图片
      await loadUserImages();
    } catch (error) {
      console.error('删除用户图片失败:', error);
      throw error;
    }
  };

  const handleSelectUserImage = (image) => {
    if (!image) {
      console.error('选择的图片对象为空');
      return;
    }

    const imageId = image.upload_id || image.id;
    setSelectedImageId(imageId);
    
    let imageUrl;
    if (image.provider === 'cloudinary' && image.public_id) {
      imageUrl = `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/${image.public_id}`;
    } else {
      imageUrl = image.file_url;
    }
    
    if (imageUrl && onSelectBackground) {
      onSelectBackground(imageUrl);
      // 选择背景图片后关闭对话框
      onClose();
    }
  };

  const handleUploadToCommunity = async () => {
    if (!selectedFile || !uploadForm.name.trim()) {
      alert('请选择图片并填写名称');
      return;
    }

    setUploading(true);
    try {
      // 上传文件到云端或本地
      let uploadResult;
      
      if (cloudinaryEnabled) {
        uploadResult = await uploadDirectlyToCloudinary(selectedFile);
      } else {
        // 尝试使用 UploadFile API，处理可能的参数格式问题
        try {
          uploadResult = await UploadFile({ file: selectedFile });
        } catch (uploadError) {
          console.error('UploadFile 第一次尝试失败:', uploadError);
          try {
            uploadResult = await UploadFile(selectedFile);
          } catch (secondError) {
            console.error('UploadFile 第二次尝试也失败:', secondError);
            throw new Error('本地文件上传服务不可用，请联系管理员或尝试配置 Cloudinary');
          }
        }
      }
      
      if (!uploadResult || !uploadResult.file_url) {
        throw new Error('文件上传失败，未返回URL');
      }

      // 保存到用户图片列表（不是社区）
      const userImageData = {
        upload_id: uploadResult.public_id || uploadResult.upload_id || Date.now().toString(),
        public_id: uploadResult.public_id,
        file_url: uploadResult.file_url,
        filename: uploadForm.name.trim(),
        name: uploadForm.name.trim(),
        description: uploadForm.description || '',
        category: uploadForm.category,
        provider: uploadResult.provider || (cloudinaryEnabled ? 'cloudinary' : 'local'), // 正确设置provider
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        size: uploadResult.size || uploadResult.bytes
      };

      try {
        const { base44 } = await import('@/api/base44Client');
        await base44.entities.UserImage.create(userImageData);
        console.log('已保存到用户图片列表:', userImageData);
      } catch (saveError) {
        console.warn('保存到用户图片列表失败:', saveError);
        // 不抛出错误，因为文件已经上传成功
      }

      // Reset form
      setSelectedFile(null);
      setUploadForm({ name: "", description: "", category: "nature" });

      // 重新加载用户图片
      await loadUserImages();

      alert('背景图片已成功分享！');
      
      // 自动切换到社区分享页面
      setActiveTab('community');
    } catch (error) {
      console.error("上传失败:", error);
      
      let errorMessage = '上传失败，请重试';
      if (error.message?.includes('本地文件上传服务')) {
        errorMessage = '本地文件上传服务暂时不可用。建议配置 Cloudinary 使用云端存储，或联系管理员解决本地存储问题。';
      } else if (error.message?.includes('Cloudinary')) {
        errorMessage = 'Cloudinary 上传失败: ' + error.message;
      } else if (error.message?.includes('网络')) {
        errorMessage = '网络连接问题，请检查网络后重试';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const categoryLabels = {
    nature: "自然风景",
    abstract: "抽象艺术",
    minimal: "简约风格",
    spiritual: "属灵主题",
    texture: "纹理材质"
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            背景图片库
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="community" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              社区分享
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              分享背景
            </TabsTrigger>
          </TabsList>

          <TabsContent value="community" className="mt-6">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">加载社区背景中...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 显示用户分享的所有图片 */}
                {(() => {
                  console.log('社区分享 - 用户图片列表:', userImages);
                  return null;
                })()}
                {(() => {
                  // 临时显示所有图片进行调试
                  console.log('社区分享 - 原始用户图片列表:', userImages);
                  
                  // 先显示所有图片，看看数据结构
                  const cloudImages = userImages.filter(image => image.provider === 'cloudinary'); // 临时注释过滤逻辑
                  
                  userImages.forEach((image, index) => {
                    console.log(`图片 ${index + 1}:`, {
                      filename: image.filename,
                      name: image.name,
                      provider: image.provider,
                      public_id: image.public_id,
                      file_url: image.file_url,
                      upload_id: image.upload_id,
                      id: image.id
                    });
                  });
                  
                  console.log('社区分享 - 当前显示的图片:', cloudImages);
                  
                  if (cloudImages.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>还没有用户分享云端背景图片</p>
                        <p className="text-sm">上传到云端的图片才会在社区中显示</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {cloudImages.map((image) => (
                      <motion.div
                        key={image.upload_id || image.id}
                        whileHover={{ scale: 1.05 }}
                        className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImageId === (image.upload_id || image.id)
                            ? 'border-blue-500 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-blue-400'
                        }`}
                        onClick={() => handleSelectUserImage(image)}
                      >
                        <div className="aspect-video">
                          <img
                            src={
                              image.provider === 'cloudinary' && image.public_id ? 
                                `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/w_400,h_300,c_fill/${image.public_id}` : 
                                image.file_url
                            }
                            alt={image.filename || image.name || '背景图片'}
                            className="w-full h-full object-cover"
                            onLoad={() => {
                              console.log('图片加载成功:', image.filename, image.provider, image.file_url);
                            }}
                            onError={(e) => {
                              console.warn('社区图片加载失败:', {
                                filename: image.filename,
                                provider: image.provider,
                                public_id: image.public_id,
                                file_url: image.file_url,
                                src: e.target.src
                              });
                              e.target.style.display = 'none';
                              e.target.parentNode.innerHTML = '<div class="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">图片加载失败</div>';
                            }}
                          />
                        </div>
                        
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button size="sm" className="bg-white/90 text-gray-900 hover:bg-white">
                            选择此背景
                          </Button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                          <p className="text-white text-sm font-medium">{image.filename || image.name || '背景图片'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {image.provider === 'cloudinary' ? (
                              <Badge variant="secondary" className="text-xs">
                                <Cloud className="w-3 h-3 mr-1" />
                                云端
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                <HardDrive className="w-3 h-3 mr-1" />
                                本地
                              </Badge>
                            )}
                          </div>
                        </div>
                        {selectedImageId === (image.upload_id || image.id) && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle2 className="w-5 h-5 text-blue-500" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                  );
                })()}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="mt-6">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">分享您的精美背景</h3>
                <p className="text-gray-600">让其他用户也能使用您喜爱的背景图片</p>
              </div>

              <div className="max-w-2xl mx-auto">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-amber-700 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>注意：上传的图片将以匿名方式分享到社区</span>
                  </div>
                </div>
                {!selectedFile ? (
                  <div
                    className={`bg-white rounded-lg border-2 border-dashed transition-all duration-200 p-8 text-center ${
                      isDragOver
                        ? 'border-blue-500 bg-blue-50 scale-105'
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="upload-input"
                    />
                    <label htmlFor="upload-input" className="cursor-pointer block">
                      <motion.div
                        animate={isDragOver ? { scale: 1.1 } : { scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Upload className={`w-12 h-12 mx-auto mb-4 ${
                          isDragOver ? 'text-blue-500' : 'text-gray-400'
                        }`} />
                      </motion.div>
                      <h4 className={`text-lg font-semibold mb-2 ${
                        isDragOver ? 'text-blue-700' : 'text-gray-900'
                      }`}>
                        {isDragOver ? '放开以上传图片' : '点击上传或拖拽图片到此处'}
                      </h4>
                      <p className="text-gray-600 mb-4">支持 JPG、PNG 格式，最大 10MB</p>
                      <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-colors">
                        <Upload className="w-4 h-4 mr-2" />
                        选择文件
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-6 space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-100">
                          {selectedFile && (
                            <img
                              src={URL.createObjectURL(selectedFile)}
                              alt="预览"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.warn('上传文件预览失败');
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {selectedFile?.name || 'unnamed'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {selectedFile?.size ? (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB' : '未知大小'}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                        className="text-red-500 hover:text-red-600"
                      >
                        重新选择
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          背景名称 *
                        </label>
                        <Input
                          value={uploadForm.name}
                          onChange={(e) => setUploadForm((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="给您的背景起个好听的名字"
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          分类
                        </label>
                        <select
                          value={uploadForm.category}
                          onChange={(e) => setUploadForm((prev) => ({ ...prev, category: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {Object.entries(categoryLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleUploadToCommunity}
                        disabled={!selectedFile || !uploadForm.name.trim() || uploading}
                        className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 px-6 py-2 text-white font-medium rounded-lg"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            正在分享...
                          </>
                        ) : (
                          <>
                            <Heart className="w-4 h-4 mr-2" />
                            分享到社区
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}