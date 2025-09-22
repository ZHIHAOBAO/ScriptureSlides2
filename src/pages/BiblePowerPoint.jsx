
import React, { useState } from "react";
import { BiblePresentation, User } from "@/api/entities";
import { fetchBibleContent } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Search,
    Download,
    FileText,
    Sparkles,
    Book,
    Heart,
    Star,
    Loader2,
    AlertCircle,
    LogIn
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import SearchInterface from "../components/bible/SearchInterface";
import ProcessingDisplay from "../components/bible/ProcessingDisplay";
import ResultsPreview from "../components/bible/ResultsPreview";
// The RecentPresentations component is no longer needed here.

// 辅助函数：动态加载外部JS脚本
function loadScript(url) {
    return new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[src="${url}"]`);
        if (existingScript) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
        document.body.appendChild(script);
    });
}

export default function BiblePowerPointPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [currentStep, setCurrentStep] = useState("");
    const [generatedPresentation, setGeneratedPresentation] = useState(null);
    const [recentPresentations, setRecentPresentations] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    React.useEffect(() => {
        initializeApp();
    }, []);

    const initializeApp = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            // 尝试加载历史数据（非阻塞性）
            try {
                await loadRecentPresentations();
            } catch (loadError) {
                console.warn('加载历史数据失败，但不影响基本功能:', loadError);
            }
        } catch (err) {
            console.error("初始化应用时出错:", err);
            // 不显示错误，避免影响用户体验
            setError(null);
        } finally {
            setIsLoading(false);
        }
    };


    const loadRecentPresentations = async () => {
        try {
            // 使用降级模式，直接返回空数组
            console.log('使用降级模式，跳过历史演示文稿加载');
            setRecentPresentations([]);
            return;
            
        } catch (err) {
            console.warn("加载最近的演示文稿时出错:", err);
            // 不设置错误状态，因为这不是关键功能
            setRecentPresentations([]); // 设置为空数组
        }
    };

    const createSlidesLocally = async (searchResult) => {
        const slides = [
            {
                type: "title",
                title: searchResult.overall_theme, // e.g., "使徒行传2:43-3:10 研读 ||| Acts 2:43-3:10 Study"
                content: searchResult.full_reference, // e.g., "使徒行传 2:43-3:10 ||| Acts 2:43-3:10"
                reference: ""
            }
        ];

        searchResult.verses.forEach((verse) => {
            // verse.full_reference will be like "2:43" or "3:10"
            const verseReference = `${searchResult.book_name_cn} ${verse.full_reference}`;
            const verseReferenceEng = `${searchResult.book_name_eng} ${verse.full_reference}`;
            const bilingualTitle = `${verseReference}|||${verseReferenceEng}`;
            
            // 创建中英文对照内容，用 ||| 分隔
            const chineseText = verse.text || '';
            const englishText = verse.text_english || '';
            const bilingualContent = `${chineseText}|||${englishText}`;
            
            slides.push({
                type: "verse",
                title: bilingualTitle,
                content: bilingualContent,
                reference: verseReference
            });
        });

        return { slides };
    };

    const downloadPptxPresentation = async () => {
        if (!generatedPresentation) return;

        setIsDownloading(true);
        setError(null);

        try {
            await loadScript('https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js');
            
            if (typeof window.PptxGenJS === 'undefined') {
                throw new Error("pptxgenjs failed to load.");
            }

            let pptx = new window.PptxGenJS();
            pptx.layout = 'LAYOUT_16x9';

            const slides = generatedPresentation.slides_content || [];

            // 增强的安全字符串转换函数
            const safeString = (val) => {
                if (val === null || val === undefined) return '';
                if (typeof val === 'string') return val;
                if (typeof val === 'number') return String(val);
                if (typeof val === 'object') return JSON.stringify(val);
                return String(val);
            };

            // 清理文本的函数
            const cleanText = (text) => {
                if (!text) return '';
                // 修复：允许中文标点符号
                return safeString(text)
                    .replace(/<[^>]*>/g, ' ')
                    .replace(/&nbsp;/g, ' ')
                    .replace(/\s+/g, ' ')
                    .replace(/[^\u0000-\u007F\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/g, ' ')
                    .trim();
            };

            // 将在线图片转换为Base64的函数
            const getImageAsBase64 = async (imageUrl, localFile = null) => {
                try {
                    // 如果是本地文件，直接转换
                    if (localFile) {
                        return new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result);
                            reader.readAsDataURL(localFile);
                        });
                    }
                    
                    // 如果是URL，通过fetch获取
                    const response = await fetch(imageUrl);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    const blob = await response.blob();
                    return new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    });
                } catch (error) {
                    console.warn(`无法加载图片: ${imageUrl}`, error);
                    return null;
                }
            };

            // 精选的高质量背景图片 - 统一风格
            const backgroundImages = {
                // 主背景 - 用于标题页和内容页
                mainBackground: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                
                // 备选背景图片
                alternativeBackgrounds: [
                    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                ]
            };

            // 如果用户上传了自定义背景图片，使用它；否则使用默认背景
            const customImage = generatedPresentation.customBackgroundImage;
            let backgroundBase64 = null;

            if (customImage && customImage.preview) {
                setCurrentStep("正在处理背景图片...");
                
                // 检查是否为本地文件
                if (customImage.isLocal && customImage.file) {
                    // 本地文件，直接转换为base64
                    backgroundBase64 = await getImageAsBase64(null, customImage.file);
                } else if (customImage.preview.startsWith('data:')) {
                    // 已经是base64格式，直接使用
                    backgroundBase64 = customImage.preview;
                } else {
                    // 云端图片URL格式，需要转换为base64
                    backgroundBase64 = await getImageAsBase64(customImage.preview);
                    if (!backgroundBase64) {
                        console.warn("云端图片加载失败，使用默认背景");
                        backgroundBase64 = await getImageAsBase64(backgroundImages.mainBackground);
                    }
                }
            } else {
                setCurrentStep("正在加载默认背景图片...");
                backgroundBase64 = await getImageAsBase64(backgroundImages.mainBackground);
                
                // 如果主要背景加载失败，尝试备选背景
                if (!backgroundBase64) {
                    console.log("主背景加载失败，尝试备选背景...");
                    for (const altBg of backgroundImages.alternativeBackgrounds) {
                        backgroundBase64 = await getImageAsBase64(altBg);
                        if (backgroundBase64) break;
                    }
                }
            }
            
            setCurrentStep("正在创建PPT页面...");

            slides.forEach((slideData, index) => {
                let slide = pptx.addSlide();

                const safeSlideData = {
                    type: safeString(slideData.type) || 'content',
                    title: cleanText(safeString(slideData.title)) || '标题',
                    content: cleanText(safeString(slideData.content)) || '内容',
                    reference: cleanText(safeString(slideData.reference)) || ''
                };

                if (safeSlideData.type === 'title') {
                    // 📸 标题页设计 - 降低背景图片不透明度
                    if (backgroundBase64) {
                        // 添加背景图片，然后用半透明遮罩调节亮度
                        slide.background = { data: backgroundBase64 };
                        slide.addShape(pptx.ShapeType.rect, {
                            x: 0, y: 0, w: '100%', h: '100%',
                            fill: { color: '000000', transparency: 80 }, // 深色遮罩降低背景亮度
                            line: { width: 0 }
                        });
                    } else {
                        // 备选渐变背景
                        slide.background = {
                            fill: {
                                type: 'gradient',
                                colors: ['1a1a2e', '16213e', '0f3460'],
                                angle: 135
                            }
                        };
                    }
                    
                    // 主标题 - 增强阴影效果确保可读性
                    slide.addText(safeSlideData.title.split('|||')[0], {
                        x: 0.5, y: 2.2, w: '90%', h: 1.5,
                        align: 'center', 
                        valign: 'top',
                        fontSize: 56, 
                        color: 'FFFFFF', 
                        bold: true, 
                        fontFace: 'Microsoft YaHei',
                        shadow: { 
                            type: 'outer', 
                            color: '000000', 
                            blur: 20,
                            offset: 6,
                            angle: 45 
                        }
                    });

                    slide.addText(safeSlideData.title.split('|||')[1], {
                        x: 0.5, y: 3.2, w: '90%', h: 1.5,
                        align: 'center', 
                        valign: 'top',
                        fontSize: 32, 
                        color: 'FFFFFF', 
                        bold: true, 
                        fontFace: 'Times New Roman',
                        shadow: { 
                            type: 'outer', 
                            color: '000000', 
                            blur: 20,
                            offset: 6,
                            angle: 45 
                        }
                    });

                    // 装饰元素
                    slide.addText('✧ ✦ ✧', {
                        x: 0.5, y: 5.0, w: '90%', h: 0.5,
                        align: 'center', 
                        fontSize: 36, 
                        color: 'FFFFFF',
                        fontFace: 'Microsoft YaHei',
                        shadow: { 
                            type: 'outer', 
                            color: '000000', 
                            blur: 10, 
                            offset: 3, 
                            angle: 0 
                        }
                    });

                } else {
                    // 📖 内容页设计 - 与标题页保持一致的背景处理
                    if (backgroundBase64) {
                        slide.background = { data: backgroundBase64 };
                        // 使用与标题页相同的深色遮罩
                        slide.addShape(pptx.ShapeType.rect, {
                            x: 0, y: 0, w: '100%', h: '100%',
                            fill: { color: '000000', transparency: 80 }, // 与标题页一致的深色遮罩
                            line: { width: 0 }
                        });
                    } else {
                        // 备选：使用与标题页一致的渐变背景
                        slide.background = {
                            fill: {
                                type: 'gradient',
                                colors: ['1a1a2e', '16213e', '0f3460'],
                                angle: 135
                            }
                        };
                    }
                    
                    // 页面标题 - 双语
                    const titleParts = safeSlideData.title.split('|||');
                    const chineseTitle = titleParts[0] || '';
                    const englishTitle = titleParts[1] || '';

                    slide.addText(chineseTitle, {
                        x: 0.5, y: 0.1, w: '90%', h: 0.5,
                        align: 'center', 
                        fontSize: 32, 
                        color: 'FFFFFF',
                        bold: true, 
                        fontFace: 'Microsoft YaHei'
                    });

                    if (englishTitle) {
                        slide.addText(englishTitle, {
                            x: 0.5, y: 0.5, w: '90%', h: 0.4,
                            align: 'center', 
                            fontSize: 22, 
                            color: 'FFFFFF',
                            bold: true, 
                            fontFace: 'Times New Roman'
                        });
                    }

                    const contentParts = safeSlideData.content.split('|||');
                    const chinese = contentParts[0] || '';
                    const english = contentParts[1] || '';

                    // 中文经文 - 调整字体和位置
                    if (chinese) {
                        slide.addText(chinese, {
                            x: 0.5, y: 1.2, w: '90%', h: 2.0, // Adjust Y and H
                            align: 'center', 
                            fontSize: 32, // 减小字体
                            color: 'FFFFFF',
                            valign: 'middle', 
                            fontFace: 'Microsoft YaHei',
                            bold: true
                        });
                    }

                    // 精美的装饰性分隔线 - 调整位置
                    if (chinese && english) {
                        slide.addShape(pptx.ShapeType.line, {
                            x: 1.2, y: 3.4, w: 7.6, h: 0,
                            line: { color: 'FFFFFF', width: 3, transparency: 50 }
                        });
                        
                        // 分隔线中心装饰
                        slide.addText('◊', {
                            x: 4.8, y: 3.25, w: 0.4, h: 0.3,
                            align: 'center', 
                            fontSize: 20, 
                            color: 'FFFFFF',
                            fontFace: 'Microsoft YaHei'
                        });
                    }

                    // 英文经文 - 调整字体和位置
                    if (english) {
                        slide.addText(english, {
                            x: 0.5, y: 3.7, w: '90%', h: 1.5,
                            align: 'center', 
                            fontSize: 24, // 进一步减小字体
                            color: 'FFFFFF',
                            italic: true, 
                            bold: true, 
                            valign: 'middle', 
                            fontFace: 'Times New Roman'
                        });
                    }

                    // 页面底部装饰边框 - 与文字保持距离
                    slide.addShape(pptx.ShapeType.rect, {
                        x: 0.5, y: 5.8, w: '90%', h: 0.08, // 向下移动到5.8，与文字保持距离
                        fill: { color: 'FFFFFF', transparency: 60 },
                        line: { width: 0 }
                    });
                }
            });
            
            // 生成文件名
            const referenceText = cleanText(generatedPresentation.passage_reference);
            const safeFileName = referenceText.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-') || 'bible-presentation';
            const fileName = `${safeFileName}-纯背景版.pptx`;
            
            await pptx.writeFile({ fileName });
            console.log("纯背景双语PPTX文件生成成功！");

        } catch (err) {
            console.error("生成PPTX时出错:", err);
            setError(`生成PPTX失败: ${err.message || '未知错误'}`);
        }

        setIsDownloading(false);
    };

    const generatePresentation = async (query, theme = "elegant", customImage = null) => {
        setIsGenerating(true);
        setError(null);
        setCurrentStep("正在分析章节信息...");

        try {
            // 本地解析逻辑 - 支持更多输入格式，包括跨章节
            const parseReference = (input) => {
                const trimmed = input.trim();
                const patterns = [
                    // 跨章节格式: 使徒行传2:43-3:10 或 使徒行传 2:43-3:10
                    { regex: /^(.+?)\s*(\d+):(\d+)-(\d+):(\d+)$/, type: 'cross_chapter_range' },
                    // 格式: 约翰福音 3:16-17 或 约翰福音3:16-17
                    { regex: /^(.+?)\s*(\d+):(\d+)-(\d+)$/, type: 'verse_range' },
                    // 格式: 约翰福音 3:16 或 约翰福音3:16
                    { regex: /^(.+?)\s*(\d+):(\d+)$/, type: 'single_verse' },
                    // 格式: 诗篇第23章1-6节
                    { regex: /^(.+?)第?(\d+)章(\d+)-(\d+)节?$/, type: 'verse_range_cn' },
                    // 格式: 诗篇第23章第1节
                    { regex: /^(.+?)第?(\d+)章第?(\d+)节?$/, type: 'single_verse_cn' },
                    // 格式: 诗篇12, 诗篇 23, 诗篇23章, 诗篇 23篇
                    { regex: /^([^\d]+?)\s*第?(\d+)[章篇]?$/, type: 'full_chapter' }
                ];

                for (const p of patterns) {
                    const match = trimmed.match(p.regex);
                    if (match) {
                        const book = match[1].trim();

                        switch (p.type) {
                            case 'cross_chapter_range':
                                return { 
                                    book, 
                                    start_chapter: parseInt(match[2]), 
                                    start_verse: parseInt(match[3]),
                                    end_chapter: parseInt(match[4]),
                                    end_verse: parseInt(match[5]),
                                    is_cross_chapter: true 
                                };
                            case 'verse_range':
                            case 'verse_range_cn':
                                return { book, chapter: parseInt(match[2]), start_verse: parseInt(match[3]), end_verse: parseInt(match[4]), is_full_chapter: false, is_cross_chapter: false };
                            case 'single_verse':
                            case 'single_verse_cn':
                                return { book, chapter: parseInt(match[2]), start_verse: parseInt(match[3]), end_verse: parseInt(match[3]), is_full_chapter: false, is_cross_chapter: false };
                            case 'full_chapter':
                                return { book, chapter: parseInt(match[2]), start_verse: 1, end_verse: 999, is_full_chapter: true, is_cross_chapter: false };
                        }
                    }
                }
                return null;
            };

            const parsed = parseReference(query);
            if (!parsed) {
                throw new Error("无法解析您输入的章节引用。支持格式：'约翰福音 3:16-17'、'使徒行传2:43-3:10'、'诗篇 23'、'诗篇23章'等。");
            }
            
            const bookNameToAbbrMap = {
                "创世记":"Gen", "出埃及记":"Exo", "利未记":"Lev", "民数记":"Num", "申命记":"Deu",
                "约书亚记":"Jos", "士师记":"Jud", "路得记":"Rut", "撒母耳记上":"1Sa", "撒母耳记下":"2Sa",
                "列王纪上":"1Ki", "列王纪下":"2Ki", "历代志上":"1Ch", "历代志下":"2Ch", "以斯拉记":"Ezr",
                "尼希米记":"Neh",
                "以斯帖记":"Est", "约伯记":"Job", "诗篇":"Psa", "箴言":"Pro",
                "传道书":"Ecc", "雅歌":"Son", "以赛亚书":"Isa", "耶利米书":"Jer", "耶利米哀歌":"Lam",
                "以西结书":"Eze", "但以理书":"Dan", "何西阿书":"Hos", "约珥书":"Joe", "阿摩司书":"Amo",
                "俄巴底亚书":"Oba", "约拿书":"Jon", "弥迦书":"Mic", "那鸿书":"Nah", "哈巴谷书":"Hab",
                "西番雅书":"Zep", "哈该书":"Hg", "撒迦利亚书":"Zec", "玛拉基书":"Mal",
                "马太福音":"Mat", "马可福音":"Mar", "路加福音":"Luk", "约翰福音":"Jhn", "使徒行传":"Act",
                "罗马书":"Rom", "哥林多前书":"1Co", "哥林多后书":"2Co", "加拉太书":"Gal", "以弗所书":"Eph",
                "腓立比书":"Php", "歌罗西书":"Col", "帖撒罗尼迦前书":"1Th", "帖撒罗尼迦后书":"2Th",
                "提摩太前书":"1Ti", "提摩太后书":"2Ti", "提多书":"Tit", "腓利门书":"Phm", "希伯来书":"Heb",
                "雅各书":"Jas", "彼得前书":"1Pe", "彼得后书":"2Pe", "约翰一书":"1Jn", "约翰二书":"2Jn",
                "约翰三书":"3Jn", "犹大书":"Jde", "启示录":"Rev"
            };
            
            // 新增：中文书卷名到英文的映射
            const bookNameToEnglishMap = {
                "创世记":"Genesis", "出埃及记":"Exodus", "利未记":"Leviticus", "民数记":"Numbers", "申命记":"Deuteronomy",
                "约书亚记":"Joshua", "士师记":"Judges", "路得记":"Ruth", "撒母耳记上":"1 Samuel", "撒母耳记下":"2 Samuel",
                "列王纪上":"1 Kings", "列王纪下":"2 Kings", "历代志上":"1 Chronicles", "历代志下":"2 Chronicles", "以斯拉记":"Ezra",
                "尼希米记":"Nehemiah", "以斯帖记":"Esther", "约伯记":"Job", "诗篇":"Psalms", "箴言":"Proverbs",
                "传道书":"Ecclesiastes", "雅歌":"Song of Solomon", "以赛亚书":"Isaiah", "耶利米书":"Jeremiah", "耶利米哀歌":"Lamentations",
                "以西结书":"Ezekiel", "但以理书":"Daniel", "何西阿书":"Hosea", "约珥书":"Joel", "阿摩司书":"Amos",
                "俄巴底亚书":"Obadiah", "约拿书":"Jonah", "弥迦书":"Micah", "那鸿书":"Nahum", "哈巴谷书":"Habakkuk",
                "西番雅书":"Zephaniah", "哈该书":"Haggai", "撒迦利亚书":"Zechariah", "玛拉基书":"Malachi",
                "马太福音":"Matthew", "马可福音":"Mark", "路加福音":"Luke", "约翰福音":"John", "使徒行传":"Acts",
                "罗马书":"Romans", "哥林多前书":"1 Corinthians", "哥林多后书":"2 Corinthians", "加拉太书":"Galatians", "以弗所书":"Ephesians",
                "腓立比书":"Philippians", "歌罗西书":"Colossians", "帖撒罗尼迦前书":"1 Thessalonians", "帖撒罗尼迦后书":"2 Thessalonians",
                "提摩太前书":"1 Timothy", "提摩太后书":"2 Timothy", "提多书":"Titus", "腓利门书":"Philemon", "希伯来书":"Hebrews",
                "雅各书":"James", "彼得前书":"1 Peter", "彼得后书":"2 Peter", "约翰一书":"1 John", "约翰二书":"2 John",
                "约翰三书":"3 John", "犹大书":"Jude", "启示录":"Revelation"
            };

            const bookAbbr = bookNameToAbbrMap[parsed.book];
            if (!bookAbbr) {
                throw new Error(`无法识别书卷名称：'${parsed.book}'。请输入标准中文书卷名。`);
            }
            
            setCurrentStep("正在从云端API获取中英文经文...");
            
            let allVerses = [];
            
            try {
                if (parsed.is_cross_chapter) {
                    // 处理跨章节范围
                    for (let chapterNum = parsed.start_chapter; chapterNum <= parsed.end_chapter; chapterNum++) {
                        const startVerse = (chapterNum === parsed.start_chapter) ? parsed.start_verse : 1;
                        const endVerse = (chapterNum === parsed.end_chapter) ? parsed.end_verse : 999; // 999 to fetch till end of chapter
                        
                        const { data: fcRes, error: fcError } = await fetchBibleContent({
                            book_abbr: bookAbbr,
                            chapter: chapterNum,
                            start_verse: startVerse,
                            end_verse: endVerse,
                            is_full_chapter: false // Not necessarily full chapter
                        });

                        if (fcError || !fcRes || !Array.isArray(fcRes.verses)) {
                            // Log error but attempt to continue for other chapters if possible, or throw if critical
                            console.warn(`无法获取第${chapterNum}章的经文:`, fcError?.response?.data?.error || fcError?.message || '未知错误');
                            continue; 
                        }

                        // 为每节经文添加章节信息和完整的章节-节引用
                        const versesWithChapterInfo = fcRes.verses
                            .filter(v => v && v.verse_number && (v.text ?? "") !== "") // Filter invalid verses
                            .map(v => ({
                                ...v,
                                chapter_number: chapterNum,
                                full_reference: `${chapterNum}:${v.verse_number}` // e.g., "2:43"
                            }));

                        allVerses = [...allVerses, ...versesWithChapterInfo];
                    }
                } else {
                    // 处理单章节范围 (包括单节、节范围、整章)
                    const { data: fcRes, error: fcError } = await fetchBibleContent({
                        book_abbr: bookAbbr,
                        chapter: parsed.chapter,
                        start_verse: parsed.is_full_chapter ? 1 : parsed.start_verse,
                        end_verse: parsed.is_full_chapter ? 999 : parsed.end_verse,
                        is_full_chapter: parsed.is_full_chapter
                    });

                    if (fcError || !fcRes || !Array.isArray(fcRes.verses) || fcRes.verses.length === 0) {
                         let detailedError = "无法从API读取经文，请检查输入或稍后重试。";
                        if (fcError && fcError.response && fcError.response.data && fcError.response.data.error) {
                            detailedError = fcError.response.data.error;
                        }
                        throw new Error(detailedError);
                    }
                    
                    // 为单章节经文添加章节信息和完整的章节-节引用
                    allVerses = fcRes.verses
                        .filter(v => v && v.verse_number && (v.text ?? "") !== "")
                        .map(v => ({
                            ...v,
                            chapter_number: parsed.chapter,
                            full_reference: `${parsed.chapter}:${v.verse_number}`
                        }));
                }
            } catch (apiError) {
                console.error("API调用失败:", apiError);
                
                // API失败时，直接使用占位符内容继续处理
                const userBookName = parsed.book || "诗篇";
                const userChapter = parsed.is_cross_chapter ? parsed.start_chapter : parsed.chapter || 23;
                const userStartVerse = parsed.start_verse || 1;
                const userEndVerse = parsed.is_cross_chapter ? parsed.start_verse + 2 : (parsed.end_verse || Math.min(parsed.start_verse + 2, 6));
                const bookEng = bookNameToEnglishMap[userBookName] || "Psalms";
                
                const placeholderVerses = [];
                for (let i = userStartVerse; i <= userEndVerse; i++) {
                    const verseRef = `${userChapter}:${i}`;
                    placeholderVerses.push({
                        chapter_number: userChapter,
                        verse_number: i,
                        full_reference: verseRef,
                        text: `${userBookName} ${verseRef} - 由于网络问题暂时使用占位符内容。请检查网络连接后重新尝试以获取准确的圣经内容。`,
                        text_english: `${bookEng} ${verseRef} - Due to network issues, placeholder content is being used temporarily. Please check your network connection and try again for accurate Bible content.`
                    });
                }
                
                allVerses = placeholderVerses;
                setError(`网络连接问题，当前显示的是占位符内容。请检查网络连接后重新尝试以获取 ${userBookName} 的真实经文。`);
            }
            
            const filteredVerses = allVerses.filter(v => v && v.verse_number && v.text); // 过滤无效经文

            if (filteredVerses.length === 0 && allVerses.length === 0) {
                // 如果没有任何经文，生成基本的占位符数据
                const userBookName = parsed.book || "诗篇";
                const userChapter = parsed.is_cross_chapter ? parsed.start_chapter : parsed.chapter || 23;
                const userStartVerse = parsed.start_verse || 1;
                const userEndVerse = parsed.is_cross_chapter ? parsed.start_verse + 2 : (parsed.end_verse || Math.min(parsed.start_verse + 2, 6));
                const bookEng = bookNameToEnglishMap[userBookName] || "Psalms";
                
                const placeholderVerses = [];
                for (let i = userStartVerse; i <= userEndVerse; i++) {
                    const verseRef = `${userChapter}:${i}`;
                    placeholderVerses.push({
                        chapter_number: userChapter,
                        verse_number: i,
                        full_reference: verseRef,
                        text: `${userBookName} ${verseRef} - 由于网络问题无法获取完整经文。请检查网络连接后重新尝试以获取准确的圣经内容。`,
                        text_english: `${bookEng} ${verseRef} - Unable to retrieve complete scripture due to network issues. Please check your network connection and try again for accurate Bible content.`
                    });
                }
                
                allVerses = placeholderVerses;
                if (!error) {
                    setError(`网络连接问题，当前显示的是占位符内容。请检查网络连接后重新尝试以获取 ${userBookName} 的真实经文。`);
                }
            }

            setCurrentStep("正在创建双语演示文稿...");
            
            // 确保我们有经文数据，即使是占位符
            const verseData = allVerses.length > 0 ? allVerses : [
                {
                    chapter_number: parsed.chapter || 23,
                    verse_number: 1,
                    full_reference: `${parsed.chapter || 23}:1`,
                    text: `${parsed.book || '诗篇'} ${parsed.chapter || 23}:1 - 由于网络问题无法获取完整经文。请检查网络连接后重新尝试。`,
                    text_english: `${bookNameToEnglishMap[parsed.book] || 'Psalms'} ${parsed.chapter || 23}:1 - Unable to retrieve scripture due to network issues. Please check your connection and try again.`
                }
            ];
            
            const bookEng = bookNameToEnglishMap[parsed.book] || parsed.book;

            let finalReference;
            let finalReferenceEng;
            let overallTheme;
            let overallThemeEng;

            if (parsed.is_cross_chapter) {
                // Use the parsed start/end chapters/verses directly for the overall reference
                finalReference = `${parsed.book} ${parsed.start_chapter}:${parsed.start_verse}-${parsed.end_chapter}:${parsed.end_verse}`;
                finalReferenceEng = `${bookEng} ${parsed.start_chapter}:${parsed.start_verse}-${parsed.end_chapter}:${parsed.end_verse}`;
                overallTheme = `${finalReference} 研读`;
                overallThemeEng = `${finalReferenceEng} Study`;
            } else if (parsed.is_full_chapter) {
                 finalReference = `${parsed.book} ${parsed.chapter}章`;
                 finalReferenceEng = `${bookEng} Chapter ${parsed.chapter}`;
                 overallTheme = `${parsed.book} ${parsed.chapter}章研读`;
                 overallThemeEng = `${bookEng} Chapter ${parsed.chapter} Study`;
            } else if (parsed.start_verse === parsed.end_verse) {
                finalReference = `${parsed.book} ${parsed.chapter}:${parsed.start_verse}`;
                finalReferenceEng = `${bookEng} ${parsed.chapter}:${parsed.start_verse}`;
                overallTheme = finalReference;
                overallThemeEng = finalReferenceEng;
            } else {
                finalReference = `${parsed.book} ${parsed.chapter}:${parsed.start_verse}-${parsed.end_verse}`;
                finalReferenceEng = `${bookEng} ${parsed.chapter}:${parsed.start_verse}-${parsed.end_verse}`;
                overallTheme = finalReference;
                overallThemeEng = finalReference; // Changed to match Chinese, as it's the full reference
            }

            // Modify searchResult to adapt to cross-chapter
            const searchResult = {
                book_name_cn: parsed.book, // Add Chinese book name for slide generation
                book_name_eng: bookEng, // Add English book name for slide generation
                main_reference: parsed.is_cross_chapter ? 
                    `${parsed.book} ${parsed.start_chapter}-${parsed.end_chapter}` : 
                    `${parsed.book} ${parsed.chapter}`,
                main_reference_eng: parsed.is_cross_chapter ? 
                    `${bookEng} ${parsed.start_chapter}-${parsed.end_chapter}` : 
                    `${bookEng} ${parsed.chapter}`,
                overall_theme: `${overallTheme}|||${overallThemeEng}`,
                full_reference: `${finalReference}|||${finalReferenceEng}`,
                verses: verseData // 使用确保的经文数据，不是filteredVerses
            };

            const slideContent = await createSlidesLocally(searchResult);

            // 辅助函数：清理HTML标签和&nbsp;实体
            const cleanHtmlTags = (text) => {
                if (!text) return '';
                return text
                    .replace(/<[^>]*>/g, ' ')  // 将HTML标签替换为空格
                    .replace(/&nbsp;/g, ' ')   // 将&nbsp;替换为空格
                    .replace(/\s+/g, ' ')      // 将多个连续空格替换为单个空格
                    .trim();                   // 移除首尾空格
            };

            // 创建双语版本的passage_text，确保清理HTML标签
            // For cross-chapter, verse.full_reference will be like "2:43", so it's correct.
            const bilingualPassageText = verseData.map(v => 
                `(${v.full_reference}) ${cleanHtmlTags(v.text)}\n${v.text_english ? `(${v.full_reference}) ${cleanHtmlTags(v.text_english)}` : ''}`
            ).join("\n\n");

            const presentationData = {
                search_query: query,
                passage_reference: finalReference,
                passage_text: bilingualPassageText,
                slides_content: slideContent.slides,
                theme: theme,
                html_content: null,
                custom_background_image: customImage // 保存用户上传的图片信息
            };

            // 尝试保存到数据库，如果失败则只在本地显示
            let savedPresentation;
            try {
                // 检查API是否可用
                if (typeof BiblePresentation.create === 'function') {
                    savedPresentation = await BiblePresentation.create(presentationData);
                    
                    // 尝试更新历史记录
                    try {
                        await loadRecentPresentations();
                    } catch (historyError) {
                        console.warn("更新历史记录失败:", historyError);
                    }
                } else {
                    throw new Error('BiblePresentation.create 不可用');
                }
            } catch (saveError) {
                console.warn("保存到数据库失败，仅在本地显示:", saveError);
                
                // 创建临时的本地演示文稿对象
                savedPresentation = {
                    id: 'local-' + Date.now(),
                    search_query: query,
                    passage_reference: finalReference,
                    passage_text: bilingualPassageText,
                    slides_content: slideContent.slides,
                    theme: theme,
                    created_date: new Date().toISOString(),
                    custom_background_image: customImage
                };
                
                // 只在没有其他错误时显示保存错误
                if (!error) {
                    setError("演示文稿无法保存到云端，但您可以正常查看和下载。");
                }
            }

            setGeneratedPresentation({ 
                ...savedPresentation, 
                slideContent: slideContent.slides,
                customBackgroundImage: customImage 
            });

        } catch (err) {
            console.error("生成演示文稿时发生错误:", err);
            setError(`生成失败: ${err.message || '处理请求时出现问题，请稍后重试。'}`);
        }

        setIsGenerating(false);
        setCurrentStep("");
    };

    const handleBackgroundChange = (newImage) => {
        if (!generatedPresentation) return;

        setGeneratedPresentation(prev => ({
            ...prev,
            customBackgroundImage: newImage, // 更新背景图片信息
            // 还需要更新保存到数据库的数据
            custom_background_image: newImage ? {
                preview: newImage.preview,
                name: newImage.name,
                // file object is not serializable for DB
            } : null
        }));
    };

    // 加载状态
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="p-6">
                        <div className="flex flex-col items-center space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-gray-900">正在加载应用</h3>
                                <p className="text-sm text-gray-600 mt-1">请稍候...</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl flex items-center justify-center">
                                <Book className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">圣经PowerPoint生成器</h1>
                                <p className="text-gray-600">将圣经章节转化为精美的演示文稿</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">
                <AnimatePresence mode="wait">
                    {!isGenerating && !generatedPresentation && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <SearchInterface
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                onGenerate={generatePresentation}
                                error={error}
                                recentPresentations={recentPresentations}
                                onRecentSelect={(presentation) => setGeneratedPresentation(presentation)}
                            />
                        </motion.div>
                    )}

                    {isGenerating && <ProcessingDisplay currentStep={currentStep} />}

                    {generatedPresentation && !isGenerating && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <ResultsPreview
                                presentation={generatedPresentation}
                                onDownload={downloadPptxPresentation}
                                isDownloading={isDownloading}
                                onStartNew={() => {
                                    setGeneratedPresentation(null);
                                    setSearchQuery("");
                                    setError(null);
                                }}
                                onBackgroundChange={handleBackgroundChange} // 传递处理函数
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
