
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
  Book
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState(null); // 本地错误状态

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
        // 尝试上传图片到云端
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
          
          // 尝试保存到云端数据库
          try {
            const savedImage = await UserImage.create({
              image_url: file_url,
              name: file.name
            });
            cloudImage.id = savedImage.id;
            // 图片已成功保存到云端
            
            setUploadedImage(cloudImage);
            // 重新加载云端历史
            await loadUserImages();
            // 云端上传成功，已更新历史记录
            return;
          } catch (saveError) {
            console.warn('保存到云端数据库失败，但文件上传成功，转为本地模式:', saveError);
            // 如果云端数据库失败，但文件上传成功，转为本地模式处理
            const localImageFromCloud = {
              preview: file_url.startsWith('blob:') ? file_url : localPreviewUrl,
              name: file.name,
              size: file.size,
              type: file.type,
              uploadedAt: new Date().toISOString(),
              id: 'local-' + Date.now(),
              isLocal: true
            };
            
            setUploadedImage(localImageFromCloud);
            // 保存到本地历史记录
            saveImageToHistory(localImageFromCloud);
            return;
          }
        }
      } catch (cloudError) {
        // 云端上传失败，使用本地模式
      }
      
      // 云端上传失败，使用本地模式
      
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

  return (
    <div className="space-y-8">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardHeader className="text-center pb-6">
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                        创建您的圣经演示文稿
                    </CardTitle>
                    <p className="text-gray-600 text-lg mt-2">
                        输入具体的经文章节，快速生成PPT演示文稿
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
                      key={`suggestion-${suggestion}-${index}`}
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

                        <Button
              type="button"
              onClick={handleSubmit}
              className="w-full h-14 text-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl"
              disabled={!searchQuery.trim() || uploading}>

                            <Sparkles className="w-5 h-5 mr-2" />
                            {uploading ? '处理中...' : '生成PowerPoint'}
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
        </div>);

}










