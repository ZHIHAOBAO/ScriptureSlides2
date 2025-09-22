
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  Sparkles,
  Heart,
  Star,
  Shield,
  Lightbulb,
  AlertCircle,
  Clock,
  Upload,
  Image,
  X,
  History,
  Book
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BackgroundGallery from "./BackgroundGallery";
import ImageErrorBoundary from "../ui/ImageErrorBoundary";
import { UserImage, User } from "@/api/entities";
import { UploadFile } from "@/api/integrations";

const BIBLE_SUGGESTIONS = [
// 旧约
"创世记", "出埃及记", "利未记", "民数记", "申命记",
"约书亚记", "士师记", "路得记", "撒母耳记上", "撒母耳记下",
"列王纪上", "列王纪下", "历代志上", "历代志下", "以斯拉记",
"尼希米记", "以斯帖记", "约伯记", "诗篇", "箴言",
"传道书", "雅歌", "以赛亚书", "耶利米书", "耶利米哀歌",
"以西结书", "但以理书", "何西阿书", "约珥书", "阿摩司书",
"俄巴底亚书", "约拿书", "弥迦书", "那鸿书", "哈巴谷书",
"西番雅书", "哈该书", "撒迦利亚书", "玛拉基书",
// 新约
"马太福音", "马可福音", "路加福音", "约翰福音", "使徒行传",
"罗马书", "哥林多前书", "哥林多后书", "加拉太书", "以弗所书",
"腓立比书", "歌罗西书", "帖撒罗尼迦前书", "帖撒罗尼迦后书",
"提摩太前书", "提摩太后书", "提多书", "腓利门书", "希伯来书",
"雅各书", "彼得前书", "彼得后书", "约翰一书", "约翰二书",
"约翰三书", "犹大书", "启示录"];


// 常用章节推荐
const POPULAR_CHAPTERS = [
"诗篇 23", "约翰福音 3:16", "罗马书 8:28", "诗篇 91", "马太福音 5:3-12",
"哥林多前书 13", "箴言 3:5-6", "腓立比书 4:13", "创世记 1:1-3", "约翰福音 14:6",
"以弗所书 2:8-9", "提摩太后书 3:16", "希伯来书 11:1", "雅各书 1:17", "彼得前书 5:7"];


export default function SearchInterface({ searchQuery, setSearchQuery, onGenerate, error, recentPresentations, onRecentSelect }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [uploadedImage, setUploadedImage] = useState(null); // Will store { preview, name, id }
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [recentImages, setRecentImages] = useState([]); // Stores { preview, name, id }
  const [showBackgroundGallery, setShowBackgroundGallery] = useState(false);
  const [localError, setLocalError] = useState(null); // 本地错误状态

  useEffect(() => {
    // Load user's persistent images
    loadUserImages();
  }, []);

  // 保存图片到本地历史记录
  const saveImageToHistory = (imageData) => {
    try {
      const historyKey = 'backgroundImageHistory';
      let history = [];
      
      // 获取现有历史
      const existingHistory = localStorage.getItem(historyKey);
      if (existingHistory) {
        history = JSON.parse(existingHistory);
      }
      
      // 检查是否已存在（根据name和preview判断）
      const existingIndex = history.findIndex(item => 
        item.name === imageData.name || item.preview === imageData.preview
      );
      
      if (existingIndex > -1) {
        // 如果已存在，更新时间并移动到前面
        history[existingIndex] = {
          ...history[existingIndex],
          ...imageData,
          lastUsed: new Date().toISOString()
        };
        // 移动到数组前面
        const item = history.splice(existingIndex, 1)[0];
        history.unshift(item);
      } else {
        // 新增到前面
        history.unshift({
          ...imageData,
          id: 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          addedAt: new Date().toISOString(),
          lastUsed: new Date().toISOString()
        });
      }
      
      // 限制最多保存10张图片
      if (history.length > 10) {
        history = history.slice(0, 10);
      }
      
      // 保存到localStorage
      localStorage.setItem(historyKey, JSON.stringify(history));
      
      // 更新状态
      setRecentImages(history);
      
      console.log('已保存图片到本地历史:', imageData.name);
    } catch (error) {
      console.error('保存图片历史失败:', error);
    }
  };

  const loadUserImages = async () => {
    try {
      // 优先尝试从云端加载
      try {
        const images = await UserImage.list();
        if (images && images.length > 0) {
          const cloudImages = images.map(img => ({
            id: img.id,
            preview: img.image_url,
            name: img.name || '未命名图片',
            addedAt: img.created_at,
            lastUsed: img.updated_at || img.created_at,
            isCloud: true
          }));
          setRecentImages(cloudImages);
          console.log('已从云端加载历史图片:', cloudImages.length, '张');
          return;
        }
      } catch (cloudError) {
        console.warn('云端加载失败，使用本地存储:', cloudError);
      }
      
      // 云端加载失败时，回退到本地存储
      const localHistory = localStorage.getItem('backgroundImageHistory');
      if (localHistory) {
        const parsedHistory = JSON.parse(localHistory);
        // 验证历史记录是否仍然有效（图片URL是否可访问）
        const validImages = [];
        for (const image of parsedHistory) {
          // 对于blob URL，检查是否仍然存在
          if (image.preview && image.preview.startsWith('blob:')) {
            // Blob URL在页面刷新后会失效，我们跳过这些
            continue;
          }
          validImages.push(image);
        }
        setRecentImages(validImages);
        // 更新localStorage，移除无效的记录
        if (validImages.length !== parsedHistory.length) {
          localStorage.setItem('backgroundImageHistory', JSON.stringify(validImages));
        }
        console.log('已从本地存储加载历史图片:', validImages.length, '张');
      }
    } catch (e) {
      console.warn("无法加载用户图片", e);
      setRecentImages([]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Default onGenerate call without image
      onGenerate(searchQuery.trim());
      setShowSuggestions(false);
    }
  };

  // 清理HTML标签的函数
  const cleanHtmlTags = (text) => {
    if (!text) return '';
    return text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  };

  // 处理历史演示文稿数据，清理可能存在的HTML标签
  const cleanedRecentPresentations = recentPresentations.map((presentation) => ({
    ...presentation,
    passage_text: cleanHtmlTags(presentation.passage_text),
    slides_content: presentation.slides_content?.map((slide) => ({
      ...slide,
      content: slide.content ? cleanHtmlTags(slide.content) : slide.content
    }))
  }));

  // 获取匹配的建议
  const getSuggestions = () => {
    if (!searchQuery.trim()) {
      if (recentPresentations && recentPresentations.length > 0) {
        return recentPresentations.map(p => p.passage_reference);
      }
      // 显示常用章节推荐
      return POPULAR_CHAPTERS.slice(0, 8);
    }

    const query = searchQuery.toLowerCase();
    const bookSuggestions = BIBLE_SUGGESTIONS.
    filter((book) => book.toLowerCase().includes(query)).
    map((book) => `${book} 1`); // 默认推荐第1章

    const chapterSuggestions = POPULAR_CHAPTERS.
    filter((chapter) => chapter.toLowerCase().includes(query));

    return [...chapterSuggestions, ...bookSuggestions].slice(0, 8);
  };

  const suggestions = getSuggestions();

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    setShowSuggestions(true);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => prev <= 0 ? suggestions.length - 1 : prev - 1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const validateAndProcessFile = (file) => {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return false;
    }

    // 检查文件大小 (限制为5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('图片文件不能超过5MB');
      return false;
    }

    return true;
  };

  const processImageFile = async (file) => {
    setUploading(true);
    setLocalError(null); // 清除之前的错误

    try {
      // 先创建本地预览URL
      const localPreviewUrl = URL.createObjectURL(file);
      
      // 尝试上传到云端
      try {
        console.log('尝试上传图片到云端...');
        const { file_url } = await UploadFile({ file });
        
        if (file_url) {
          const cloudImage = {
            preview: file_url,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString(),
            isCloud: true
          };
          
          // 保存到云端数据库
          try {
            const savedImage = await UserImage.create({
              image_url: file_url,
              name: file.name
            });
            cloudImage.id = savedImage.id;
            console.log('图片已成功保存到云端:', file.name);
          } catch (saveError) {
            console.warn('保存到云端数据库失败，但文件上传成功:', saveError);
            cloudImage.id = 'cloud-' + Date.now();
          }
          
          setUploadedImage(cloudImage);
          // 重新加载云端历史
          await loadUserImages();
          console.log('云端上传成功，已更新历史记录');
          return;
        }
      } catch (cloudError) {
        console.warn('云端上传失败，使用本地模式:', cloudError);
      }
      
      // 云端上传失败，使用本地模式
      console.log('使用本地预览模式处理图片');
      
      const localImage = {
        preview: localPreviewUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        id: 'local-' + Date.now(),
        isLocal: true
      };
      
      setUploadedImage(localImage);
      
      // 保存到本地历史记录
      saveImageToHistory(localImage);
      
      console.log('图片处理成功，已保存到本地历史记录');
      
    } catch (error) {
      console.error('处理图片失败:', error);
      setLocalError('处理图片失败，请重试。');
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (validateAndProcessFile(file)) {
      await processImageFile(file);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (validateAndProcessFile(file)) {
        processImageFile(file);
      }
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
    // Only set false if drag leaves the entire container
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const selectRecentImage = (image) => {
    setUploadedImage(image); // `image` now contains `id`
  };
  
  const removeRecentImage = async (imageToRemove, event) => {
    event.stopPropagation();
    
    if (!imageToRemove.id) {
      console.error("图片ID不存在，无法删除:", imageToRemove);
      alert('删除失败：图片ID缺失，请刷新页面重试。');
      return;
    }

    try {
      // 如果是云端图片，先从云端删除
      if (imageToRemove.isCloud && !imageToRemove.id.startsWith('local')) {
        try {
          await UserImage.delete(imageToRemove.id);
          console.log('已从云端删除图片:', imageToRemove.name);
          // 重新加载云端历史
          await loadUserImages();
        } catch (cloudError) {
          console.error('从云端删除失败:', cloudError);
          alert('从云端删除失败，请重试。');
          return;
        }
      } else {
        // 从本地存储中删除
        const historyKey = 'backgroundImageHistory';
        const existingHistory = localStorage.getItem(historyKey);
        
        if (existingHistory) {
          const history = JSON.parse(existingHistory);
          const filteredHistory = history.filter(img => img.id !== imageToRemove.id);
          
          // 更新localStorage
          localStorage.setItem(historyKey, JSON.stringify(filteredHistory));
          
          // 更新状态
          setRecentImages(filteredHistory);
          
          console.log('已从本地历史记录中删除图片:', imageToRemove.name);
        }
      }
      
      // 如果当前选中的图片被删除，清除选中状态
      if (uploadedImage && uploadedImage.id === imageToRemove.id) {
        setUploadedImage(null);
      }
      
    } catch (error) {
      console.error("删除历史图片失败:", error);
      alert('删除历史图片失败，请重试。');
    }
  };

  const removeUploadedImage = () => {
    setUploadedImage(null);
  };

  // 清空所有历史记录
  const clearImageHistory = async () => {
    if (window.confirm('确定要清空所有背景图片历史记录吗？')) {
      try {
        // 尝试清空云端图片
        try {
          const images = await UserImage.list();
          if (images && images.length > 0) {
            // 批量删除云端图片
            const deletePromises = images.map(img => UserImage.delete(img.id));
            await Promise.all(deletePromises);
            console.log('已清空云端历史图片:', images.length, '张');
          }
        } catch (cloudError) {
          console.warn('清空云端图片失败，仅清空本地记录:', cloudError);
        }
        
        // 清空本地存储
        localStorage.removeItem('backgroundImageHistory');
        
        // 清空状态
        setRecentImages([]);
        
        // 如果当前选中的是历史图片，也清除
        if (uploadedImage && uploadedImage.id) {
          setUploadedImage(null);
        }
        
        console.log('已清空所有背景图片历史记录');
      } catch (error) {
        console.error('清空历史记录失败:', error);
        alert('清空失败，请重试。');
      }
    }
  };

  const handleGenerateWithImage = () => {
    if (searchQuery.trim()) {
      onGenerate(searchQuery.trim(), "elegant", uploadedImage);
      setShowSuggestions(false);
    }
  };

  return (
    <div className="space-y-8">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardHeader className="text-center pb-6">
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                        创建您的圣经演示文稿
                    </CardTitle>
                    <p className="text-gray-600 text-lg mt-2">
                        输入具体的圣经章节，并可选择上传背景图片
                    </p>
                </CardHeader>
                <CardContent className="space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                            <Input
                value={searchQuery}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="请输入章节，如：约翰福音 3:16、使徒行传2:43-3:10、诗篇 23..."
                className="pl-12 h-14 text-lg border-2 border-gray-200 focus:border-blue-400 rounded-xl" />

                            
                            {/* 智能下拉建议框 */}
                            <AnimatePresence>
                                {showSuggestions && suggestions.length > 0 &&
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-64 overflow-y-auto">

                                        <div className="py-2">
                                            {!searchQuery.trim() && recentPresentations.length > 0 &&
                    <div className="px-4 py-2 text-xs text-gray-500 font-medium border-b border-gray-100">
                                                        最近搜索
                                                    </div>
                    }
                                            {suggestions.map((suggestion, index) =>
                    <div
                      key={index}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className={`px-4 py-3 cursor-pointer transition-colors flex items-center gap-3 ${
                      index === selectedIndex ?
                      'bg-blue-50 text-blue-700' :
                      'hover:bg-gray-50'}`
                      }>

                                                    <Search className="w-4 h-4 text-gray-400" />
                                                    <span className="flex-1">{suggestion}</span>
                                                </div>
                    )}
                                        </div>
                                    </motion.div>
                }
                            </AnimatePresence>
                        </div>

                        {/* 背景图片上传区域 - 支持拖拽 */}
                        <ImageErrorBoundary>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Image className="w-5 h-5 text-gray-600" />
                                    <span className="font-medium text-gray-700">自定义背景图片（可选）</span>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowBackgroundGallery(true)}
                                    className="flex items-center gap-2"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    社区图库
                                </Button>
                            </div>
                            
                            {!uploadedImage ?
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
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
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={uploading} />

                                    <label htmlFor="image-upload" className="cursor-pointer block">
                                        <motion.div
                    animate={isDragOver ? { scale: 1.1 } : { scale: 1 }}
                    transition={{ duration: 0.2 }}>

                                            <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                                        </motion.div>
                                        
                                    {uploading ?
                  <div className="flex items-center justify-center gap-2">
                                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                <p className="text-blue-600 font-medium">正在处理图片...</p>
                                            </div> :

                  <>
                                                <p className={`font-medium mb-1 ${isDragOver ? 'text-blue-700' : 'text-gray-600'}`}>
                                                    {isDragOver ? '放开以上传图片' : '点击上传或拖拽图片到此处'}
                                                </p>
                                                <p className="text-xs text-gray-500 mb-2">
                                                    支持 JPG、PNG 格式，最大 5MB
                                                </p>

                                            </>
                  }
                                    </label>
                                </div> :

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative">

                                    <div className="flex items-center gap-4 bg-white rounded-lg p-4 border border-blue-200 bg-blue-50">
                                        <img
                    src={uploadedImage.preview}
                    alt="预览" 
                    className="bg-blue-100 w-16 h-16 object-cover rounded-lg border-2 border-blue-100"
                    onError={(e) => {
                      console.warn('图片加载失败:', uploadedImage.preview);
                      e.target.style.display = 'none';
                    }}
                  />


                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 flex items-center gap-2">
                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                {uploadedImage.name}
                                            </p>
                                            <p className="text-sm text-blue-700">已选择为PPT背景图片</p>
                                        </div>
                                        <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={removeUploadedImage}
                    className="text-gray-400 hover:text-red-500">

                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </motion.div>
              }

              {/* 历史图片区域 - 只有当有图片时才显示 */}
              {recentImages.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-gray-600" />
                      <h4 className="text-sm font-medium text-gray-700">最近使用的背景</h4>
                      <Badge variant="secondary" className="text-xs">
                        {recentImages.length}
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearImageHistory}
                      className="text-xs text-gray-500 hover:text-red-500 h-6 px-2"
                      title="清空历史记录"
                    >
                      清空
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {recentImages.map((image, index) => (
                      <div 
                        key={image.id || index}
                        onClick={() => selectRecentImage(image)} 
                        className={`relative group aspect-w-1 aspect-h-1 rounded-md overflow-hidden cursor-pointer border-2 transition-all transform hover:scale-105 ${uploadedImage?.id === image.id ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg' : 'border-transparent hover:border-blue-400 hover:shadow-md'}`}
                      >
                        <img 
                          src={image.preview} 
                          alt={image.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.warn('历史图片加载失败:', image.preview);
                            e.target.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all"></div>
                        
                        {/* 选中状态指示器 */}
                        {uploadedImage?.id === image.id && (
                          <div className="absolute top-1 left-1 p-0.5 bg-blue-500 rounded-full text-white">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        
                        {/* 图片信息悬浮提示 */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white text-xs truncate" title={image.name}>
                            {image.name}
                          </p>
                          {image.addedAt && (
                            <p className="text-white/80 text-xs">
                              {new Date(image.addedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        
                        <button 
                          onClick={(e) => removeRecentImage(image, e)}
                          className="absolute top-1 right-1 p-0.5 bg-white/70 hover:bg-white rounded-full text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          aria-label="删除此历史图片"
                        >
                          <X className="w-3 h-3"/>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    点击图片快速选择，悬停查看详情
                  </div>
                </div>
              )}
            </div>
            </ImageErrorBoundary>

            <Button
              type="button"
              onClick={uploadedImage ? handleGenerateWithImage : handleSubmit}
              className="w-full h-14 text-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl"
              disabled={!searchQuery.trim() || uploading}>

                            <Sparkles className="w-5 h-5 mr-2" />
                            {uploading ? '处理中...' : uploadedImage ? '使用自定义背景生成PowerPoint' : '生成PowerPoint'}
                        </Button>
                    </form>

                    {(error || localError) &&
          <Alert variant={(error && error.includes('（本地模式）')) || (localError && localError.includes('（本地模式）')) ? "default" : "destructive"}>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error || localError}</AlertDescription>
                        </Alert>
          }
                </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-r from-blue-50 to-green-50 p-6">
                <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Search className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">云端获取</h3>
                        <p className="text-sm text-gray-600">实时从云端API获取最新经文</p>
                    </div>
                    <div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Sparkles className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">双语对照</h3>
                        <p className="text-sm text-gray-600">自动生成中英双语幻灯片</p>
                    </div>
                    <div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Heart className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">即刻分享</h3>
                        <p className="text-sm text-gray-600">适用于讲道、查经班和灵修</p>
                    </div>
                </div>
                

            </Card>

            <BackgroundGallery
                isOpen={showBackgroundGallery}
                onClose={() => setShowBackgroundGallery(false)}
                onSelectBackground={setUploadedImage}
                currentBackground={uploadedImage?.preview}
            />
        </div>);

}




