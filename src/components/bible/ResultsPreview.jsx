
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Download,
    RotateCcw,
    FileText,
    Quote,
    ChevronRight,
    Eye,
    Loader2,
    Home,
    ChevronLeft,
    Image as ImageIcon,
    RefreshCw,
    Clock,
    CheckCircle2,
    Upload,
    X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SlidePreview from "./SlidePreview";
import { UserImage } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import BackgroundGallery from "./BackgroundGallery"; // Added import

export default function ResultsPreview({ presentation, onDownload, isDownloading, onStartNew, onBackgroundChange }) {
    const [isExpanded, setIsExpanded] = useState(false);
    // Combine currentSlideIndex and slideDirection into a single state to ensure atomic updates
    const [[currentSlideIndex, slideDirection], setSlideState] = useState([0, 1]); // [index, direction]
    const [isUploadingBg, setIsUploadingBg] = useState(false);
    const [recentImages, setRecentImages] = useState([]);
    const [showBackgroundGallery, setShowBackgroundGallery] = useState(false); // Added state

    const slides = presentation.slideContent || presentation.slides_content || [];
    const slideCount = slides.length;

    // 确定预览背景图
    const customBg = presentation.customBackgroundImage?.preview;
    const defaultBg = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80';
    const previewBackgroundImage = customBg || defaultBg;

    // Load recent images from user's persistent storage on component mount
    useEffect(() => {
        loadUserImages();
    }, []);

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
                    // 已从云端加载历史图片
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
                // 已从本地存储加载历史图片
            }
        } catch (e) {
            console.warn("无法加载用户图片", e);
            setRecentImages([]);
        }
    };

    const goToNextSlide = () => {
        // Update both index and direction simultaneously
        setSlideState([(currentSlideIndex + 1) % slideCount, 1]);
    };

    const goToPrevSlide = () => {
        // Update both index and direction simultaneously
        setSlideState([(currentSlideIndex - 1 + slideCount) % slideCount, -1]);
    };

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
            
            // 已保存图片到本地历史
        } catch (error) {
            console.error('保存图片历史失败:', error);
        }
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
                        // 已清空云端历史图片
                    }
                } catch (cloudError) {
                    console.warn('清空云端图片失败，仅清空本地记录:', cloudError);
                }
                
                // 清空本地存储
                localStorage.removeItem('backgroundImageHistory');
                
                // 清空状态
                setRecentImages([]);
                
                // 已清空所有背景图片历史记录
            } catch (error) {
                console.error('清空历史记录失败:', error);
                alert('清空失败，请重试。');
            }
        }
    };

    // 删除单个历史图片
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
                    // 已从云端删除图片
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
                    
                    // 已从本地历史记录中删除图片
                }
            }
            
        } catch (error) {
            console.error("删除历史图片失败:", error);
            alert('删除历史图片失败，请重试。');
        }
    };

    const handleBackgroundFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 验证文件
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件');
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert('图片文件不能超过5MB');
            return;
        }

        setIsUploadingBg(true);
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
                        
                        onBackgroundChange(cloudImage); // Update parent state
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
                        
                        // 保存到本地历史记录
                        saveImageToHistory(localImageFromCloud);
                        onBackgroundChange(localImageFromCloud); // Update parent state
                        // 图片处理成功，已保存到本地历史记录
                        return;
                    }
                }
            } catch (cloudError) {
                console.warn('云端上传失败，使用本地模式:', cloudError);
            }
            
            // 云端上传失败，使用本地模式
            // 使用本地预览模式处理图片
            
            const localImage = {
                preview: localPreviewUrl,
                name: file.name,
                size: file.size,
                type: file.type,
                uploadedAt: new Date().toISOString(),
                id: 'local-' + Date.now(),
                isLocal: true
            };
            
            // 保存到本地历史记录
            saveImageToHistory(localImage);

            onBackgroundChange(localImage); // Update parent state
            // 图片处理成功，已保存到历史记录

        } catch (err) {
            console.error("上传新背景失败:", err);
            // 更友好的错误提示
            if (err.message.includes('文件大小')) {
                alert("图片文件太大，请选择小于5MB的图片。");
            } else if (err.message.includes('只支持图片')) {
                alert("请选择有效的图片文件（JPG、PNG等格式）。");
            } else {
                alert("上传图片失败，请重试。");
            }
        } finally {
            setIsUploadingBg(false);
        }
    };

    const selectHistoryImage = (image) => {
        // When selecting from history, or default, pass the image object.
        // If image is null, it means select default background.
        onBackgroundChange(image);
    };

    return (
        <div className="space-y-6">
            {/* 面包屑导航 */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-sm text-gray-600"
            >
                <Button
                    variant="link"
                    className="p-0 h-auto text-blue-600 hover:text-blue-800"
                    onClick={onStartNew}
                >
                    <Home className="w-4 h-4 mr-1" />
                    搜索页面
                </Button>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900 font-medium">{presentation.passage_reference}</span>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    演示文稿已就绪！
                </h2>
                <p className="text-gray-600">
                    您的圣经演示文稿已创建，共 {slideCount} 张幻灯片
                </p>
            </motion.div>

            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl text-gray-900">
                                {presentation.passage_reference}
                            </CardTitle>
                            <p className="text-gray-600 mt-1">
                                基于: "{presentation.search_query}"
                            </p>
                        </div>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {slideCount} 张幻灯片
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-amber-50 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <Quote className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                            <div className="w-full">
                                <p className="text-gray-700 italic leading-relaxed whitespace-pre-wrap">
                                    {isExpanded
                                        ? presentation.passage_text
                                        : `${presentation.passage_text?.slice(0, 300) || ''}${presentation.passage_text?.length > 300 ? "..." : ""}`
                                    }
                                </p>
                                <div className="flex justify-between items-center mt-2">
                                    {presentation.passage_text?.length > 300 && (
                                        <Button
                                            variant="link"
                                            className="p-0 h-auto text-blue-600"
                                            onClick={() => setIsExpanded(!isExpanded)}
                                        >
                                            {isExpanded ? "收起" : "展开阅读"}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 幻灯片预览区域 */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                            <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                幻灯片预览
                            </div>
                            <div className="text-gray-500">
                                {currentSlideIndex + 1} / {slideCount}
                            </div>
                        </div>

                        <div className="relative overflow-hidden rounded-lg aspect-video">
                            <AnimatePresence initial={false}>
                                {/* The motion.div is now always rendered. Its 'key' prop is what Framer Motion watches
                                    to trigger exit/enter animations, resolving the flicker. */}
                                <motion.div
                                    key={currentSlideIndex} // Key changes when currentSlideIndex changes, triggering animation
                                    className="absolute w-full h-full"
                                    initial={{ x: `${slideDirection * 100}%` }}
                                    animate={{ x: 0 }}
                                    exit={{ x: `${-slideDirection * 100}%` }}
                                    transition={{
                                        type: "tween",
                                        ease: "easeInOut",
                                        duration: 0.4,
                                    }}
                                >
                                    <SlidePreview
                                        slide={slides[currentSlideIndex]}
                                        backgroundImage={previewBackgroundImage}
                                        isTitleSlide={slides[currentSlideIndex]?.type === 'title'}
                                    />
                                </motion.div>
                            </AnimatePresence>

                            {slideCount > 1 && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={goToPrevSlide}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/50 hover:bg-white/80 backdrop-blur-sm shadow-md z-20"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={goToNextSlide}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/50 hover:bg-white/80 backdrop-blur-sm shadow-md z-20"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* 背景图片替换区域 */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ImageIcon className="w-6 h-6 text-gray-600" />
                                <div>
                                    <h4 className="font-medium text-gray-800">当前演示文稿背景</h4>
                                    <p className="text-xs text-gray-500 truncate max-w-xs">
                                        {presentation.customBackgroundImage ? presentation.customBackgroundImage.name : "默认山景图"}
                                    </p>
                                </div>
                            </div>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline">
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        更换背景
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <h4 className="font-medium leading-none">更换背景图片</h4>
                                            <p className="text-sm text-muted-foreground">
                                                上传新图片或从可用背景中选择。
                                            </p>
                                        </div>
                                        <div className="grid gap-2">
                                            <Button asChild variant="outline" className="w-full justify-start cursor-pointer">
                                                <label htmlFor="background-replace-input-popover" className="flex items-center cursor-pointer w-full">
                                                    {isUploadingBg ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                                    上传新图片
                                                </label>
                                            </Button>
                                            <input
                                                type="file"
                                                id="background-replace-input-popover"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleBackgroundFileChange}
                                            />

                                            {/* Added Community Gallery Button */}
                                            <Button 
                                                variant="outline" 
                                                className="w-full justify-start"
                                                onClick={() => setShowBackgroundGallery(true)}
                                            >
                                                <ImageIcon className="w-4 h-4 mr-2" />
                                                社区图库
                                            </Button>

                                            <div className="mt-4 pt-4 border-t">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        <h5 className="text-sm font-medium text-gray-700">可用背景</h5>
                                                        {recentImages.length > 0 && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                {recentImages.length + 1}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {recentImages.length > 0 && (
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
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {/* Default Image */}
                                                    <div
                                                        key="default-bg"
                                                        onClick={() => selectHistoryImage(null)} // Reset to default
                                                        className={`group relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 transition-all ${
                                                            !presentation.customBackgroundImage
                                                                ? 'border-blue-500 ring-2 ring-blue-200'
                                                                : 'border-gray-200 hover:border-blue-400'
                                                        }`}
                                                    >
                                                        <img src={defaultBg} alt="默认背景" className="w-full h-full object-cover" />
                                                        {!presentation.customBackgroundImage && (
                                                            <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                                                <CheckCircle2 className="w-4 h-4 text-white" />
                                                            </div>
                                                        )}
                                                        <div className="absolute bottom-0 inset-x-0 p-1 bg-black/50 text-white text-[10px] text-center truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                                            默认山景图
                                                        </div>
                                                    </div>

                                                    {/* Recent Images */}
                                                    {recentImages.map((image, index) => (
                                                        <div
                                                            key={image.id || index}
                                                            onClick={() => { selectHistoryImage(image) }}
                                                            className={`group relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 transition-all transform hover:scale-105 ${
                                                                presentation.customBackgroundImage?.preview === image.preview
                                                                    ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg'
                                                                    : 'border-gray-200 hover:border-blue-400 hover:shadow-md'
                                                            }`}
                                                        >
                                                            <img src={image.preview} alt={image.name} className="w-full h-full object-cover" />
                                                            
                                                            {/* 选中状态指示器 */}
                                                            {presentation.customBackgroundImage?.preview === image.preview ? (
                                                                <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                                                </div>
                                                            ) : (
                                                                <div className="absolute top-1 left-1 p-0.5 bg-blue-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                            
                                                            {/* 图片信息悬浮提示 */}
                                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <p className="text-white text-[10px] truncate" title={image.name}>
                                                                    {image.name}
                                                                </p>
                                                                {image.addedAt && (
                                                                    <p className="text-white/80 text-[9px]">
                                                                        {new Date(image.addedAt).toLocaleDateString()}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            
                                                            {/* 删除按钮 */}
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
                                            </div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            onClick={onDownload}
                            className="flex-1 h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl"
                            disabled={isDownloading}
                        >
                            {isDownloading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    正在生成...
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5 mr-2" />
                                    下载演示文稿 (.pptx)
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={onStartNew}
                            variant="outline"
                            className="h-12 px-6 border-2 rounded-xl"
                            disabled={isDownloading}
                        >
                            <RotateCcw className="w-5 h-5 mr-2" />
                            创建新的
                        </Button>
                    </div>

                    <div className="mt-4 text-xs text-gray-500 text-center">
                        由 pptxgenjs 强力驱动，在您的浏览器中直接生成。
                    </div>
                </CardContent>
            </Card>

            {/* Added BackgroundGallery component */}
            <BackgroundGallery
                isOpen={showBackgroundGallery}
                onClose={() => setShowBackgroundGallery(false)}
                onSelectBackground={(image) => {
                    onBackgroundChange(image);
                    setShowBackgroundGallery(false); // Close gallery after selection
                }}
                currentBackground={presentation.customBackgroundImage?.preview}
            />
        </div>
    );
}


