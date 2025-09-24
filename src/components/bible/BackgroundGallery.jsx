
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Still needed for now, might be removed if the description field is gone entirely from the UI
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CommunityBackgroundImage } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { User } from "@/api/entities";
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
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";

export default function BackgroundGallery({ isOpen, onClose, onSelectBackground, currentBackground }) {
  const [activeTab, setActiveTab] = useState("community");
  const [communityImages, setCommunityImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: "",
    description: "",
    category: "nature"
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCommunityImages();
    }
  }, [isOpen]);


  const loadCommunityImages = async () => {
    setLoading(true);
    try {
      // 使用降级模式，直接返回空数组
      // 使用降级模式，跳过社区图片加载
      setCommunityImages([]);
    } catch (error) {
      console.error("加载社区背景图片失败:", error);
      setCommunityImages([]);
    }
    setLoading(false);
  };

  const validateFile = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {// 改为10MB
      alert('图片文件不能超过10MB');
      return false;
    }
    return true;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (validateFile(file)) {
      setSelectedFile(file);
      setUploadForm((prev) => ({ ...prev, name: file.name.replace(/\.[^/.]+$/, "") }));
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
    // Check if the event is truly leaving the drop zone, not just entering a child element
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

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        setUploadForm((prev) => ({ ...prev, name: file.name.replace(/\.[^/.]+$/, "") }));
      }
    }
  };

  const handleUploadToCommunity = async () => {
    if (!selectedFile || !uploadForm.name.trim()) {
      alert('请选择图片并填写名称');
      return;
    }

    setUploading(true);
    try {
      // 上传文件到云端
      const uploadResult = await UploadFile({ file: selectedFile });
      
      if (!uploadResult || !uploadResult.file_url) {
        throw new Error('文件上传失败，未返回URL');
      }

      // 尝试保存到社区背景图片实体
      try {
        if (typeof CommunityBackgroundImage.create === 'function') {
          await CommunityBackgroundImage.create({
            name: uploadForm.name.trim(),
            description: uploadForm.description || '',
            image_url: uploadResult.file_url,
            category: uploadForm.category,
            download_count: 0,
            created_by: 'anonymous' // 不再需要用户认证
          });
        }
      } catch (createError) {
        console.warn('保存到社区失败，但文件上传成功:', createError);
      }

      // Reset form
      setSelectedFile(null);
      setUploadForm({ name: "", description: "", category: "nature" });

      // 尝试重新加载社区图片
      try {
        await loadCommunityImages();
      } catch (loadError) {
        console.warn('重新加载社区图片失败:', loadError);
      }

      alert('背景图片已成功上传！');
    } catch (error) {
      console.error("上传失败:", error);
      
      let errorMessage = '上传失败，请重试';
      if (error.message.includes('文件上传服务')) {
        errorMessage = '文件上传服务暂时不可用，请检查网络连接或稍后重试';
      } else if (error.message.includes('API不可用')) {
        errorMessage = '服务暂时不可用，请稍后重试';
      } else if (error.message.includes('网络')) {
        errorMessage = '网络连接问题，请检查网络后重试';
      }
      
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (image) => {
    if (!confirm(`确定要删除背景图片"${image.name}"吗？此操作无法撤销。`)) {
      return;
    }

    try {
      await CommunityBackgroundImage.delete(image.id);
      await loadCommunityImages(); // 重新加载列表
      alert('图片已成功删除！');
    } catch (error) {
      console.error("删除图片失败:", error);
      alert('删除失败，请重试');
    }
  };

  const handleSelectImage = async (image) => {
    // 增加使用次数
    if (image.id) {
      try {
        await CommunityBackgroundImage.update(image.id, {
          download_count: (image.download_count || 0) + 1
        });
      } catch (error) {
        console.error("更新使用次数失败:", error);
      }
    }

    // 调用父组件的选择回调
    onSelectBackground({
      preview: image.image_url,
      name: image.name
    });

    onClose();
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
                        {loading ?
            <div className="text-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                                <p className="text-gray-600">加载社区背景中...</p>
                            </div> :

            <div className="space-y-4">
                                {communityImages.length === 0 ?
              <div className="text-center py-8 text-gray-500">
                                        <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>还没有用户分享背景图片</p>
                                        <p className="text-sm">成为第一个分享者吧！</p>
                                    </div> :

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {communityImages.map((image) =>
                <motion.div
                  key={image.id}
                  whileHover={{ scale: 1.05 }}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  currentBackground === image.image_url ?
                  'border-blue-500 ring-2 ring-blue-200' :
                  'border-gray-200 hover:border-blue-400'}`
                  }
                  onClick={() => handleSelectImage(image)}>

                                                <div className="aspect-video">
                                                    <img
                      src={image.image_url}
                      alt={image.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.warn('社区图片加载失败:', image.image_url);
                        e.target.style.display = 'none';
                        e.target.parentNode.innerHTML = '<div class="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">图片加载失败</div>';
                      }}
                    />

                                                </div>
                                                
                                                {/* 删除按钮 - 暂时隐藏，因为没有用户认证 */}
                                                
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button size="sm" className="bg-white/90 text-gray-900 hover:bg-white">
                                                        选择此背景
                                                    </Button>
                                                </div>
                                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                                                    <p className="text-white text-sm font-medium">{image.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="secondary" className="text-xs">
                                                            {categoryLabels[image.category]}
                                                        </Badge>
                                                        <span className="text-white text-xs flex items-center gap-1">
                                                            <Download className="w-3 h-3" />
                                                            {image.download_count || 0}
                                                        </span>
                                                    </div>
                                                </div>
                                                {currentBackground === image.image_url &&
                  <div className="absolute top-2 right-2">
                                                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                                                    </div>
                  }
                                            </motion.div>
                )}
                                    </div>
              }
                            </div>
            }
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
                                {!selectedFile ?
                <div
                  className={`bg-white rounded-lg border-2 border-dashed transition-all duration-200 p-8 text-center ${
                  isDragOver ?
                  'border-blue-500 bg-blue-50 scale-105' :
                  'border-gray-300 hover:border-blue-400'}`
                  }
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}>

                                        <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="upload-input" />

                                        <label htmlFor="upload-input" className="cursor-pointer block">
                                            <motion.div
                      animate={isDragOver ? { scale: 1.1 } : { scale: 1 }}
                      transition={{ duration: 0.2 }}>

                                                <Upload className={`w-12 h-12 mx-auto mb-4 ${
                      isDragOver ? 'text-blue-500' : 'text-gray-400'}`
                      } />
                                            </motion.div>
                                            <h4 className={`text-lg font-semibold mb-2 ${
                    isDragOver ? 'text-blue-700' : 'text-gray-900'}`
                    }>
                                                {isDragOver ? '放开以上传图片' : '点击上传或拖拽图片到此处'}
                                            </h4>
                                            <p className="text-gray-600 mb-4">支持 JPG、PNG 格式，最大 10MB</p>
                                            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-colors">
                                                <Upload className="w-4 h-4 mr-2" />
                                                选择文件
                                            </div>
                                        </label>
                                    </div> :

                <div className="bg-white rounded-lg p-6 space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0">
                                                <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-100">
                                                    <img
                          src={URL.createObjectURL(selectedFile)}
                          alt="预览"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.warn('上传文件预览失败');
                            e.target.style.display = 'none';
                          }}
                        />

                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                                                <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                            <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                      className="text-red-500 hover:text-red-600">

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
                        className="w-full" />

                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    分类
                                                </label>
                                                <select
                        value={uploadForm.category}
                        onChange={(e) => setUploadForm((prev) => ({ ...prev, category: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">

                                                    {Object.entries(categoryLabels).map(([key, label]) =>
                        <option key={key} value={key}>{label}</option>
                        )}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex justify-end">
                                            <Button
                      onClick={handleUploadToCommunity}
                      disabled={!selectedFile || !uploadForm.name.trim() || uploading}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 px-6 py-2 text-white font-medium rounded-lg">

                                                {uploading ?
                      <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        正在分享...
                                                    </> :

                      <>
                                                        <Heart className="w-4 h-4 mr-2" />
                                                        分享到社区
                                                    </>
                      }
                                            </Button>
                                        </div>
                                    </div>
                }
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>);

}