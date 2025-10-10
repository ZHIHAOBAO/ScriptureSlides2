
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
    Upload,
    CheckCircle2,
    Wifi,
    Trash2,
    X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SlidePreview from "./SlidePreview";
import { UserImage } from "@/api/entities";
import { base44 } from "@/api/base44Client";
import { UploadFile } from "@/api/integrations";

export default function ResultsPreview({ presentation, onDownload, isDownloading, onStartNew, onBackgroundChange }) {
    const [isExpanded, setIsExpanded] = useState(false);
    // Combine currentSlideIndex and slideDirection into a single state to ensure atomic updates
    const [[currentSlideIndex, slideDirection], setSlideState] = useState([0, 1]); // [index, direction]
    const [isUploadingBg, setIsUploadingBg] = useState(false);
    const [recentImages, setRecentImages] = useState([]);
    const [retryingImages, setRetryingImages] = useState(new Set()); // 追踪正在重试的图片
    const [showAllImages, setShowAllImages] = useState(false); // 控制是否显示所有图片
    const [deletingImages, setDeletingImages] = useState(new Set()); // 追踪正在删除的图片

    const slides = presentation.slideContent || presentation.slides_content || [];
    const slideCount = slides.length;

    // 确定预览背景图
    const customBg = presentation.customBackgroundImage?.preview;
    const defaultBg = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80';
    const previewBackgroundImage = customBg || defaultBg;

    // Load recent images from user's persistent storage on component mount
    useEffect(() => {
        // 首先清理localStorage中的过期数据
        cleanupLocalStorage();
        loadUserImages();
    }, []);
    
    // 监控recentImages状态变化
    useEffect(() => {
        // 监控recentImages状态变化
    }, [recentImages]);

    // 清理localStorage中的过期数据
    const cleanupLocalStorage = () => {
        try {
            // 先检查localStorage使用情况
            let totalSize = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length;
                }
            }
            
            // 如果超过500KB，清理非关键数据
            if (totalSize > 500 * 1024) {
                // 保留必要的键，包括用户图片数据
                const preserveKeys = ['backgroundImageHistory', 'scripture_user_images'];
                const keysToRemove = [];
                
                for (let key in localStorage) {
                    if (localStorage.hasOwnProperty(key) && !preserveKeys.includes(key)) {
                        keysToRemove.push(key);
                    }
                }
                
                // 清理不必要的数据
                keysToRemove.forEach(key => {
                    try {
                        localStorage.removeItem(key);
                    } catch (e) {
                        // 清理失败
                    }
                });
            }
            
            // 检查背景历史（保留更多记录用于显示）
            const historyKey = 'backgroundImageHistory';
            const existingHistory = localStorage.getItem(historyKey);
            if (existingHistory) {
                const history = JSON.parse(existingHistory);
                // 保留最近10个有效的记录
                const validHistory = history.filter(item => {
                    return item && item.id && item.name;
                }).slice(0, 10);
                
                if (validHistory.length !== history.length) {
                    localStorage.setItem(historyKey, JSON.stringify(validHistory));
                }
            }
            
        } catch (error) {
            // 清理localStorage失败
        }
    };

    const loadUserImages = async () => {
        try {
            // 从云端加载所有用户上传的图片
            try {
                const images = await UserImage.list();
                if (images && images.length > 0) {
                    // 处理 Cloudinary 云端图片
                    const cloudImages = images.map(img => {
                        let preview;
                        
                        // 优先使用 Cloudinary URL
                        if (img.secure_url) {
                            preview = img.secure_url;
                        } else if (img.file_url || img.image_url) {
                            preview = img.file_url || img.image_url;
                        } else if (img.image_data) {
                            // 兼容旧的 Base64 数据
                            preview = `data:${img.file_type || 'image/jpeg'};base64,${img.image_data}`;
                        } else {
                            // 图片缺少显示数据，跳过
                            return null;
                        }
                        
                        return {
                            id: img.id,
                            preview: preview,
                            name: img.filename || img.name || '未命名图片',
                            size: img.file_size || img.bytes || 0,
                            type: img.file_type || img.format || 'image/jpeg',
                            addedAt: img.created_at || img.upload_date,
                            lastUsed: img.updated_at || img.created_at,
                            
                            // 云端存储标记
                            isDatabase: false,
                            isCloud: true, // 标记为真正的云端存储
                            provider: img.provider || 'cloudinary',
                            isPersistent: true,
                            
                            // Cloudinary 特有字段
                            public_id: img.public_id,
                            secure_url: img.secure_url,
                            thumbnail_url: img.thumbnail_url,
                            optimized_url: img.optimized_url,
                            width: img.width,
                            height: img.height
                        };
                    }).filter(Boolean);
                    
                    // 按上传时间排序，最新的在前面
                    cloudImages.sort((a, b) => {
                        const timeA = new Date(a.addedAt).getTime();
                        const timeB = new Date(b.addedAt).getTime();
                        return timeB - timeA;
                    });
                    
                    setRecentImages(cloudImages);
                    // 从 Cloudinary 云端加载
                    return;
                }
            } catch (cloudError) {
                // Cloudinary 云端加载失败，将尝试本地备份
            }
            
            // 云端加载失败时，回退到本地存储（作为备份）
            // 本地数据库不可用，加载备份数据
            const localHistory = localStorage.getItem('backgroundImageHistory');
            let validImages = [];
            
            if (localHistory) {
                const parsedHistory = JSON.parse(localHistory);
                
                for (const image of parsedHistory) {
                    // 跳过失效的blob URL
                    if (image.preview && image.preview.startsWith('blob:')) {
                        // 跳过失效的blob URL
                        continue;
                    }
                    
                    // 为本地存储的图片添加preview字段
                    if (!image.preview) {
                        if (image.thumbnailData) {
                            image.preview = image.thumbnailData;
                        } else {
                            // 图片缺少预览数据
                            continue;
                        }
                    }
                    
                    validImages.push({
                        ...image,
                        isPersistent: image.isPersistent || false // 保留原有的持久化标记
                    });
                }
                
                // 从本地备份加载
            }
            
            // 尝试从旧的scripture_user_images中恢复数据
            try {
                const oldUserImages = localStorage.getItem('scripture_user_images');
                if (oldUserImages) {
                    const oldImages = JSON.parse(oldUserImages);
                    // 发现旧数据，尝试恢复
                    
                    for (const oldImg of oldImages) {
                        // 检查是否已存在
                        const exists = validImages.some(img => 
                            img.id === oldImg.id || img.name === oldImg.name
                        );
                        
                        if (!exists && oldImg.has_image_data) {
                            // 转换为可显示的格式
                            const recoveredImage = {
                                id: oldImg.id,
                                name: oldImg.name || oldImg.filename,
                                preview: oldImg.image_data ? `data:${oldImg.file_type || 'image/jpeg'};base64,${oldImg.image_data}` : null,
                                addedAt: oldImg.created_at || oldImg.upload_date,
                                isPersistent: true, // 标记为持久化
                                size: oldImg.file_size,
                                type: oldImg.file_type
                            };
                            
                            if (recoveredImage.preview) {
                                validImages.unshift(recoveredImage);
                                // 成功恢复图片
                            }
                        }
                    }
                }
            } catch (recoveryError) {
                // 数据恢复失败
            }
            
            setRecentImages(validImages);
            
            // 更新本地存储以保持数据一致性
            if (validImages.length > 0) {
                try {
                    localStorage.setItem('backgroundImageHistory', JSON.stringify(validImages.slice(0, 10)));
                } catch (saveError) {
                    // 更新本地存储失败
                }
            }
        } catch (e) {
            // 无法加载用户图片
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
            
            // 先清理localStorage，避免配额问题
            try {
                localStorage.removeItem('scripture_user_images'); // 清理可能的大数据
                localStorage.removeItem('deleted_sample_images');
                // 清理其他可能的缓存数据
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key !== historyKey) {
                        try {
                            localStorage.removeItem(key);
                        } catch (e) {
                            // 清理localStorage项目失败
                        }
                    }
                });
            } catch (cleanupError) {
                // 清理localStorage失败
            }
            
            let history = [];
            
            // 获取现有历史
            const existingHistory = localStorage.getItem(historyKey);
            if (existingHistory) {
                try {
                    history = JSON.parse(existingHistory);
                } catch (parseError) {
                    // 解析历史数据失败，清空重新开始
                    history = [];
                    localStorage.removeItem(historyKey);
                }
            }
            
            // 检查是否已存在
            const existingIndex = history.findIndex(item => 
                item.name === imageData.name || item.id === imageData.id
            );
            
            // 创建超小缩略图
            let miniThumbnail = null;
            if (imageData.thumbnailData) {
                try {
                    // 创建100x100像素的超小缩略图
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const img = new Image();
                    
                    img.onload = () => {
                        canvas.width = 80;
                        canvas.height = 80;
                        ctx.drawImage(img, 0, 0, 80, 80);
                        miniThumbnail = canvas.toDataURL('image/jpeg', 0.3);
                        // 超小缩略图创建完成
                    };
                    
                    img.src = imageData.thumbnailData;
                } catch (compressionError) {
                    // 创建超小缩略图失败
                    miniThumbnail = imageData.thumbnailData;
                }
            }
            
            // 只保存最基本的数据
            const imageDataForStorage = {
                id: imageData.id,
                name: imageData.name,
                preview: miniThumbnail || imageData.preview,
                addedAt: new Date().toISOString()
            };
            
            if (existingIndex > -1) {
                history[existingIndex] = imageDataForStorage;
            } else {
                history.unshift(imageDataForStorage);
            }
            
            // 只保存最新的2张图片
            history = history.slice(0, 2);
            
            // 尝试保存
            try {
                const dataToStore = JSON.stringify(history);
                // 准备保存数据
                localStorage.setItem(historyKey, dataToStore);
                // 成功保存到localStorage
            } catch (storageError) {
                // localStorage保存失败
                // 完全放弃localStorage，只使用内存
                // 放弃localStorage，仅使用内存模式
            }
            
            // 更新内存状态（保留完整数据）
            setRecentImages(prev => {
                const filtered = prev.filter(img => img.id !== imageData.id);
                const newImage = {
                    ...imageData,
                    preview: imageData.preview || imageData.thumbnailData
                };
                // 正在更新recentImages状态
                const updated = [newImage, ...filtered].slice(0, 5);
                // recentImages即将更新
                return updated;
            });
            
        } catch (error) {
            // 保存图片历史失败
            // 完全依赖内存状态
            setRecentImages(prev => {
                const filtered = prev.filter(img => img.id !== imageData.id);
                return [{
                    ...imageData,
                    preview: imageData.preview || imageData.thumbnailData
                }, ...filtered].slice(0, 3);
            });
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
            // 将图片转换为Base64格式
            const base64Data = await convertFileToBase64(file);
            
            // 创建缩略图用于显示
            const thumbnailData = await createThumbnail(file);
            
            // 创建本地预览URL
            const localPreviewUrl = URL.createObjectURL(file);
            
            try {
                // 检查API是否可用
                if (!base44?.entities?.UserImage) {
                    throw new Error('云端服务不可用，请检查网络连接');
                }
                
                // 上传图片到 Cloudinary 云端存储
                const savedImage = await UserImage.create({
                    name: file.name,
                    filename: file.name,
                    file_size: file.size,
                    file_type: file.type,
                    file: file, // 传递文件对象给 Cloudinary 服务
                    upload_date: new Date().toISOString(),
                    provider: 'cloudinary'
                });
                
                const cloudImage = {
                    id: savedImage.id,
                    preview: savedImage.secure_url, // 使用 Cloudinary URL
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    uploadedAt: new Date().toISOString(),
                    addedAt: new Date().toISOString(),
                    isDatabase: false,
                    isCloud: true, // 标记为真正的云端存储
                    provider: 'cloudinary',
                    isPersistent: true, // 标记为持久化存储
                    
                    // Cloudinary 特有字段
                    public_id: savedImage.public_id,
                    secure_url: savedImage.secure_url,
                    thumbnail_url: savedImage.thumbnail_url,
                    optimized_url: savedImage.optimized_url,
                    width: savedImage.width,
                    height: savedImage.height,
                    cloudinary_id: savedImage.id
                };
                
                // 立即更新UI显示
                setRecentImages(prev => {
                    const filtered = prev.filter(img => img.id !== cloudImage.id);
                    return [cloudImage, ...filtered];
                });
                
                // 应用为当前背景
                onBackgroundChange(cloudImage);
                
                // 不需要本地备份，因为数据已经存储在云端
                // 图片已成功上传到 Cloudinary 云端存储
                
                // 图片已成功上传到 Cloudinary 云端存储
                
            } catch (dbError) {
                // 云端上传失败
                
                // 云端上传失败，使用本地存储作为备选方案
                const localImage = {
                    preview: thumbnailData || localPreviewUrl,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    uploadedAt: new Date().toISOString(),
                    addedAt: new Date().toISOString(),
                    id: 'local-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                    isLocal: true,
                    isDatabase: false,
                    isCloud: false,
                    provider: 'local',
                    isPersistent: false, // 标记为临时存储
                    file: file,
                    base64Data: base64Data,
                    thumbnailData: thumbnailData,
                    needsRetry: true // 标记需要重试上传
                };
                
                // 更新UI显示
                setRecentImages(prev => {
                    const filtered = prev.filter(img => img.id !== localImage.id);
                    return [localImage, ...filtered];
                });
                
                // 应用为当前背景
                onBackgroundChange(localImage);
                
                // 图片已保存到本地
            }

        } catch (err) {
            console.error("处理图片失败:", err);
            alert("处理图片失败，请重试。");
        } finally {
            setIsUploadingBg(false);
        }
    };

    // 创建缩略图用于localStorage存储
    const createThumbnail = (file, maxWidth = 150, maxHeight = 150, quality = 0.5) => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // 计算缩略图尺寸
                let { width, height } = img;
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // 绘制缩略图
                ctx.drawImage(img, 0, 0, width, height);
                
                // 转换为Base64（使用JPEG格式和更高压缩）
                const thumbnailData = canvas.toDataURL('image/jpeg', quality);
                resolve(thumbnailData);
            };
            
            img.onerror = () => {
                console.warn('创建缩略图失败');
                resolve(null);
            };
            
            img.src = URL.createObjectURL(file);
        });
    };
    const convertFileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // 移除data:image/...;base64,前缀，只保留Base64数据
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const selectHistoryImage = (image) => {
        // When selecting from history, or default, pass the image object.
        // If image is null, it means select default background.
        onBackgroundChange(image);
    };

    // 删除图片的功能
    const deleteImage = async (image) => {
        if (!image.id) {
            return;
        }

        // 确认删除
        const confirmDelete = window.confirm(`确定要删除图片 "${image.name}" 吗？此操作不可恢复。`);
        if (!confirmDelete) {
            return;
        }

        // 添加到正在删除的集合中
        setDeletingImages(prev => new Set([...prev, image.id]));

        try {
            // 如果是数据库中的图片，先从数据库删除
            if (image.isDatabase || image.dbId) {
                try {
                    await UserImage.delete(image.id);
                } catch (dbError) {
                    // 从数据库删除失败
                    // 即使数据库删除失败，也继续从本地删除
                }
            }
            
            // 从本地存储中删除
            const historyKey = 'backgroundImageHistory';
            const existingHistory = localStorage.getItem(historyKey);
            if (existingHistory) {
                const history = JSON.parse(existingHistory);
                const updatedHistory = history.filter(img => 
                    img.id !== image.id && 
                    img.name !== image.name
                );
                localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
            }
            
            // 更新内存状态
            setRecentImages(prev => prev.filter(img => img.id !== image.id));
            
            // 如果删除的是当前使用的背景，重置为默认背景
            if (presentation.customBackgroundImage?.preview === image.preview) {
                onBackgroundChange(null);
            }
            
            // 图片已成功删除
        } catch (error) {
            // 删除图片失败
            alert('删除失败，请稍后重试。');
        } finally {
            // 从正在删除的集合中移除
            setDeletingImages(prev => {
                const newSet = new Set(prev);
                newSet.delete(image.id);
                return newSet;
            });
        }
    };

    // 重试保存图片到云端数据库的功能
    const retryImageToDatabase = async (image) => {
        if (!image.base64Data || image.isDatabase) {
            return;
        }

        // 添加到正在重试的集合中
        setRetryingImages(prev => new Set([...prev, image.id]));

        try {
            // 重试将图片保存到云端
            
            // 检查API是否可用
            if (!base44?.entities?.UserImage) {
                throw new Error('云端数据库服务仍然不可用');
            }
            
            // 保存到云端数据库
            const savedImage = await UserImage.create({
                name: image.name,
                filename: image.name,
                file_size: image.size,
                file_type: image.type,
                image_data: image.base64Data,
                is_local_upload: true,
                upload_date: new Date().toISOString(),
                provider: 'database'
            });
            
            // 重试成功，图片已保存到云端
            
            // 更新本地图片状态为云端状态
            const updatedImage = {
                ...image,
                id: savedImage.id,
                isDatabase: true,
                isLocal: false,
                isPersistent: true,
                needsRetry: false,
                provider: 'database',
                dbId: savedImage.id,
                preview: `data:${image.type};base64,${image.base64Data}`
            };
            
            // 更新图片列表
            setRecentImages(prev => prev.map(img => 
                img.id === image.id ? updatedImage : img
            ));
            
            // 重新加载云端数据确保一致性
            await loadUserImages();
            
            // 重试成功！图片已保存到云端
        } catch (error) {
            console.error('🚫 重试保存到云端失败:', error);
            alert('⚠️ 重试失败，请检查网络连接后再试。');
        } finally {
            // 从正在重试的集合中移除
            setRetryingImages(prev => {
                const newSet = new Set(prev);
                newSet.delete(image.id);
                return newSet;
            });
        }
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

                    {/* 新的左右布局区域 */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* 左侧：自定义背景 */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <ImageIcon className="w-6 h-6 text-gray-600" />
                                    <div>
                                        <h4 className="font-medium text-gray-800">自定义背景</h4>
                                        <p className="text-xs text-gray-500">
                                            {presentation.customBackgroundImage ? presentation.customBackgroundImage.name : "默认山景图"}
                                        </p>
                                    </div>
                                </div>
                                
                                {/* 显示当前背景图片缩略图 */}
                                <div className="grid grid-cols-2 gap-2">
                                    {/* 默认背景 */}
                                    <div
                                        onClick={() => selectHistoryImage(null)}
                                        className={`aspect-video rounded-md overflow-hidden cursor-pointer border-2 transition-all ${
                                            !presentation.customBackgroundImage
                                                ? 'border-blue-500 ring-2 ring-blue-200'
                                                : 'border-gray-200 hover:border-blue-400'
                                        }`}
                                    >
                                        <img src={defaultBg} alt="默认背景" className="w-full h-full object-cover" />
                                    </div>
                                    
                                    {/* 当前选中的自定义背景或最近上传的图片 */}
                                    {presentation.customBackgroundImage ? (
                                        <div className="aspect-video rounded-md overflow-hidden border-2 border-blue-500 ring-2 ring-blue-200">
                                            <img src={presentation.customBackgroundImage.preview} alt={presentation.customBackgroundImage.name} className="w-full h-full object-cover" />
                                        </div>
                                    ) : recentImages.length > 0 ? (
                                        <div
                                            onClick={() => selectHistoryImage(recentImages[0])}
                                            className="aspect-video rounded-md overflow-hidden cursor-pointer border-2 border-gray-200 hover:border-blue-400 transition-all"
                                        >
                                            <img src={recentImages[0].preview} alt={recentImages[0].name} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="aspect-video rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                                            无图片
                                        </div>
                                    )}
                                </div>
                                
                                {/* 操作按钮 */}
                                <div>
                                    <Button asChild variant="outline" className="justify-start cursor-pointer w-full">
                                        <label htmlFor="background-upload-input" className="flex items-center cursor-pointer w-full">
                                            {isUploadingBg ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                            上传新图片
                                        </label>
                                    </Button>
                                    <input
                                        type="file"
                                        id="background-upload-input"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleBackgroundFileChange}
                                    />
                                </div>
                            </div>
                            
                            {/* 右侧：操作区域 */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Download className="w-6 h-6 text-gray-600" />
                                    <div>
                                        <h4 className="font-medium text-gray-800">操作</h4>
                                        <p className="text-xs text-gray-500">
                                            下载或重新创建传道演示文稿
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <Button
                                        onClick={onDownload}
                                        className="w-full h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl"
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
                                                下载演示文稿
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={onStartNew}
                                        variant="outline"
                                        className="w-full h-12 border-2 rounded-xl"
                                        disabled={isDownloading}
                                    >
                                        <RotateCcw className="w-5 h-5 mr-2" />
                                        创建新的
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 text-xs text-gray-500 text-center">
                        由 pptxgenjs 强力驱动，在您的浏览器中直接生成。
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


