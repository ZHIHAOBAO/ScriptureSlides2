import { base44 } from './base44Client';

// 书卷名称映射：中文到英文缩写（用于备用API）
const BOOK_NAME_MAP = {
    "创世记": "GEN", "出埃及记": "EXO", "利未记": "LEV", "民数记": "NUM", "申命记": "DEU",
    "约书亚记": "JOS", "士师记": "JDG", "路得记": "RUT", "撒母耳记上": "1SA", "撒母耳记下": "2SA",
    "列王纪上": "1KI", "列王纪下": "2KI", "历代志上": "1CH", "历代志下": "2CH", "以斯拉记": "EZR",
    "尼希米记": "NEH", "以斯帖记": "EST", "约伯记": "JOB", "诗篇": "PSA", "箴言": "PRO",
    "传道书": "ECC", "雅歌": "SNG", "以赛亚书": "ISA", "耶利米书": "JER", "耶利米哀歌": "LAM",
    "以西结书": "EZK", "但以理书": "DAN", "何西阿书": "HOS", "约珥书": "JOL", "阿摩司书": "AMO",
    "俄巴底亚书": "OBA", "约拿书": "JON", "弥迦书": "MIC", "那鸿书": "NAM", "哈巴谷书": "HAB",
    "西番雅书": "ZEP", "哈该书": "HAG", "撒迦利亚书": "ZEC", "玛拉基书": "MAL",
    "马太福音": "MAT", "马可福音": "MRK", "路加福音": "LUK", "约翰福音": "JHN", "使徒行传": "ACT",
    "罗马书": "ROM", "哥林多前书": "1CO", "哥林多后书": "2CO", "加拉太书": "GAL", "以弗所书": "EPH",
    "腓立比书": "PHP", "歌罗西书": "COL", "帖撒罗尼迦前书": "1TH", "帖撒罗尼迦后书": "2TH",
    "提摩太前书": "1TI", "提摩太后书": "2TI", "提多书": "TIT", "腓利门书": "PHM", "希伯来书": "HEB",
    "雅各书": "JAS", "彼得前书": "1PE", "彼得后书": "2PE", "约翰一书": "1JN", "约翰二书": "2JN",
    "约翰三书": "3JN", "犹大书": "JUD", "启示录": "REV"
};

// 中文圣经书卷缩写映射（用于信望爱API）
const CHINESE_BOOK_MAP = {
    "创世记": "创", "出埃及记": "出", "利未记": "利", "民数记": "民", "申命记": "申",
    "约书亚记": "书", "士师记": "士", "路得记": "得", "撒母耳记上": "撒上", "撒母耳记下": "撒下",
    "列王纪上": "王上", "列王纪下": "王下", "历代志上": "代上", "历代志下": "代下", "以斯拉记": "拉",
    "尼希米记": "尼", "以斯帖记": "斯", "约伯记": "伯", "诗篇": "诗", "箴言": "箴",
    "传道书": "传", "雅歌": "歌", "以赛亚书": "赛", "耶利米书": "耶", "耶利米哀歌": "哀",
    "以西结书": "结", "但以理书": "但", "何西阿书": "何", "约珥书": "珥", "阿摩司书": "摩",
    "俄巴底亚书": "俄", "约拿书": "拿", "弥迦书": "弥", "那鸿书": "鸿", "哈巴谷书": "哈",
    "西番雅书": "番", "哈该书": "该", "撒迦利亚书": "亚", "玛拉基书": "玛",
    "马太福音": "太", "马可福音": "可", "路加福音": "路", "约翰福音": "约", "使徒行传": "徒",
    "罗马书": "罗", "哥林多前书": "林前", "哥林多后书": "林后", "加拉太书": "加", "以弗所书": "弗",
    "腓立比书": "腓", "歌罗西书": "西", "帖撒罗尼迦前书": "帖前", "帖撒罗尼迦后书": "帖后",
    "提摩太前书": "提前", "提摩太后书": "提后", "提多书": "多", "腓利门书": "门", "希伯来书": "来",
    "雅各书": "雅", "彼得前书": "彼前", "彼得后书": "彼后", "约翰一书": "约一", "约翰二书": "约二",
    "约翰三书": "约三", "犹大书": "犹", "启示录": "启"
};

// 使用 bible-api.com 获取中英文圣经数据
const fetchFromBibleAPI = async (bookAbbr, chapter, startVerse, endVerse) => {
    try {
        // bible-api.com 支持的书卷映射
        const bibleAPIBookMapping = {
            'GEN': 'genesis', 'EXO': 'exodus', 'LEV': 'leviticus', 'NUM': 'numbers', 'DEU': 'deuteronomy',
            'JOS': 'joshua', 'JDG': 'judges', 'RUT': 'ruth', '1SA': '1samuel', '2SA': '2samuel',
            '1KI': '1kings', '2KI': '2kings', '1CH': '1chronicles', '2CH': '2chronicles', 'EZR': 'ezra',
            'NEH': 'nehemiah', 'EST': 'esther', 'JOB': 'job', 'PSA': 'psalms', 'PRO': 'proverbs',
            'ECC': 'ecclesiastes', 'SNG': 'songofsolomon', 'ISA': 'isaiah', 'JER': 'jeremiah', 'LAM': 'lamentations',
            'EZK': 'ezekiel', 'DAN': 'daniel', 'HOS': 'hosea', 'JOL': 'joel', 'AMO': 'amos',
            'OBA': 'obadiah', 'JON': 'jonah', 'MIC': 'micah', 'NAM': 'nahum', 'HAB': 'habakkuk',
            'ZEP': 'zephaniah', 'HAG': 'haggai', 'ZEC': 'zechariah', 'MAL': 'malachi',
            'MAT': 'matthew', 'MRK': 'mark', 'LUK': 'luke', 'JHN': 'john', 'ACT': 'acts',
            'ROM': 'romans', '1CO': '1corinthians', '2CO': '2corinthians', 'GAL': 'galatians', 'EPH': 'ephesians',
            'PHP': 'philippians', 'COL': 'colossians', '1TH': '1thessalonians', '2TH': '2thessalonians',
            '1TI': '1timothy', '2TI': '2timothy', 'TIT': 'titus', 'PHM': 'philemon', 'HEB': 'hebrews',
            'JAS': 'james', '1PE': '1peter', '2PE': '2peter', '1JN': '1john', '2JN': '2john',
            '3JN': '3john', 'JUD': 'jude', 'REV': 'revelation'
        };
        
        const bookName = bibleAPIBookMapping[bookAbbr.toUpperCase()];
        if (!bookName) {
            throw new Error(`Bible API不支持书卷: ${bookAbbr}`);
        }
        
        // 构建 URL - 如果是整章就不加节数，否则加节数范围
        let url;
        if (endVerse === 999) {
            // 整章
            url = `https://bible-api.com/${bookName}+${chapter}`;
        } else if (startVerse === endVerse) {
            // 单节
            url = `https://bible-api.com/${bookName}+${chapter}:${startVerse}`;
        } else {
            // 节范围
            url = `https://bible-api.com/${bookName}+${chapter}:${startVerse}-${endVerse}`;
        }
        
        console.log('调用 Bible API:', url);
        
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Bible API请求超时')), 15000);
        });
        
        const fetchPromise = fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'ScriptureSlides.app/1.0'
            }
        });
        
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (!response.ok) {
            throw new Error(`Bible API响应错误: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Bible API返回数据:', data);
        
        let verses = [];
        
        if (data.verses && Array.isArray(data.verses)) {
            // 多节经文
            verses = data.verses.map(v => ({
                chapter_number: chapter,
                verse_number: v.verse,
                full_reference: `${chapter}:${v.verse}`,
                text: '', // 这个API不提供中文，我们需要用其他方式获取
                text_english: v.text || ''
            }));
        } else if (data.text) {
            // 单节经文
            verses = [{
                chapter_number: chapter,
                verse_number: startVerse,
                full_reference: `${chapter}:${startVerse}`,
                text: '',
                text_english: data.text
            }];
        }
        
        if (verses.length === 0) {
            throw new Error('Bible API未返回经文数据');
        }
        
        return {
            data: { verses },
            error: null
        };
        
    } catch (error) {
        console.error('Bible API调用失败:', error);
        throw error;
    }
};

// 使用中文圣经 API 获取中文经文
const fetchChineseBible = async (bookAbbr, chapter, startVerse, endVerse) => {
    try {
        // 中文书卷名映射
        const chineseBookNames = {
            'GEN': '创世记', 'EXO': '出埃及记', 'LEV': '利未记', 'NUM': '民数记', 'DEU': '申命记',
            'JOS': '约书亚记', 'JDG': '士师记', 'RUT': '路得记', '1SA': '撒母耳记上', '2SA': '撒母耳记下',
            '1KI': '列王纪上', '2KI': '列王纪下', '1CH': '历代志上', '2CH': '历代志下', 'EZR': '以斯拉记',
            'NEH': '尼希米记', 'EST': '以斯帖记', 'JOB': '约伯记', 'PSA': '诗篇', 'PRO': '箴言',
            'ECC': '传道书', 'SNG': '雅歌', 'ISA': '以赛亚书', 'JER': '耶利米书', 'LAM': '耶利米哀歌',
            'EZK': '以西结书', 'DAN': '但以理书', 'HOS': '何西阿书', 'JOL': '约珥书', 'AMO': '阿摩司书',
            'OBA': '俄巴底亚书', 'JON': '约拿书', 'MIC': '弥迦书', 'NAM': '那鸿书', 'HAB': '哈巴谷书',
            'ZEP': '西番雅书', 'HAG': '哈该书', 'ZEC': '撒迦利亚书', 'MAL': '玛拉基书',
            'MAT': '马太福音', 'MRK': '马可福音', 'LUK': '路加福音', 'JHN': '约翰福音', 'ACT': '使徒行传',
            'ROM': '罗马书', '1CO': '哥林多前书', '2CO': '哥林多后书', 'GAL': '加拉太书', 'EPH': '以弗所书',
            'PHP': '腓立比书', 'COL': '歌罗西书', '1TH': '帖撒罗尼迦前书', '2TH': '帖撒罗尼迦后书',
            '1TI': '提摩太前书', '2TI': '提摩太后书', 'TIT': '提多书', 'PHM': '腓利门书', 'HEB': '希伯来书',
            'JAS': '雅各书', '1PE': '彼得前书', '2PE': '彼得后书', '1JN': '约翰一书', '2JN': '约翰二书',
            '3JN': '约翰三书', 'JUD': '犹大书', 'REV': '启示录'
        };
        
        // 这里使用一个简单的静态数据作为演示，实际应用中你可以更换为真正的中文圣经API
        const staticVerses = {
            'JHN_3_16': '神爱世人，甚至将他的独生子赐给他们，叫一切信他的，不至灭亡，反得永生。',
            'PSA_23_1': '耶和华是我的牧者，我必不致缺乏。',
            'PSA_23_2': '他使我躺在青草地上，领我在可安歇的水边。',
            'PSA_23_3': '他使我的灵魂苏醒，为自己的名引导我走义路。',
            'ROM_8_28': '我们晓得万事都互相效力，叫爱神的人得益处，就是按他旨意被召的人。',
            'MAT_5_3': '虚心的人有福了！因为天国是他们的。',
            'MAT_5_4': '哀恐的人有福了！因为他们必得安慰。'
        };
        
        const verses = [];
        const bookName = chineseBookNames[bookAbbr.toUpperCase()] || '圣经';
        
        for (let verseNum = startVerse; verseNum <= (endVerse === 999 ? startVerse + 5 : endVerse); verseNum++) {
            const key = `${bookAbbr.toUpperCase()}_${chapter}_${verseNum}`;
            const staticText = staticVerses[key];
            
            if (staticText) {
                verses.push({
                    chapter_number: chapter,
                    verse_number: verseNum,
                    full_reference: `${chapter}:${verseNum}`,
                    text: staticText,
                    text_english: ''
                });
            } else {
                // 如果没有静态数据，返回一个示例文本
                verses.push({
                    chapter_number: chapter,
                    verse_number: verseNum,
                    full_reference: `${chapter}:${verseNum}`,
                    text: `${bookName} ${chapter}:${verseNum} - 这里是经文内容（需要实际的中文圣经API）`,
                    text_english: ''
                });
            }
        }
        
        return {
            data: { verses },
            error: null
        };
// 使用 bible-api.com 获取英文圣经数据，并添加中文静态数据
const fetchFromBibleAPI = async (bookAbbr, chapter, startVerse, endVerse) => {
    try {
        // bible-api.com 支持的书卷映射
        const bibleAPIBookMapping = {
            'GEN': 'genesis', 'EXO': 'exodus', 'LEV': 'leviticus', 'NUM': 'numbers', 'DEU': 'deuteronomy',
            'JOS': 'joshua', 'JDG': 'judges', 'RUT': 'ruth', '1SA': '1samuel', '2SA': '2samuel',
            '1KI': '1kings', '2KI': '2kings', '1CH': '1chronicles', '2CH': '2chronicles', 'EZR': 'ezra',
            'NEH': 'nehemiah', 'EST': 'esther', 'JOB': 'job', 'PSA': 'psalms', 'PRO': 'proverbs',
            'ECC': 'ecclesiastes', 'SNG': 'songofsolomon', 'ISA': 'isaiah', 'JER': 'jeremiah', 'LAM': 'lamentations',
            'EZK': 'ezekiel', 'DAN': 'daniel', 'HOS': 'hosea', 'JOL': 'joel', 'AMO': 'amos',
            'OBA': 'obadiah', 'JON': 'jonah', 'MIC': 'micah', 'NAM': 'nahum', 'HAB': 'habakkuk',
            'ZEP': 'zephaniah', 'HAG': 'haggai', 'ZEC': 'zechariah', 'MAL': 'malachi',
            'MAT': 'matthew', 'MRK': 'mark', 'LUK': 'luke', 'JHN': 'john', 'ACT': 'acts',
            'ROM': 'romans', '1CO': '1corinthians', '2CO': '2corinthians', 'GAL': 'galatians', 'EPH': 'ephesians',
            'PHP': 'philippians', 'COL': 'colossians', '1TH': '1thessalonians', '2TH': '2thessalonians',
            '1TI': '1timothy', '2TI': '2timothy', 'TIT': 'titus', 'PHM': 'philemon', 'HEB': 'hebrews',
            'JAS': 'james', '1PE': '1peter', '2PE': '2peter', '1JN': '1john', '2JN': '2john',
            '3JN': '3john', 'JUD': 'jude', 'REV': 'revelation'
        };
        
        // 中文经文静态数据
        const chineseVerses = {
            'JHN_3_16': '神爱世人，甚至将他的独生子赐给他们，叫一切信他的，不至灭亡，反得永生。',
            'PSA_23_1': '耶和华是我的牧者，我必不致缺乏。',
            'PSA_23_2': '他使我躺在青草地上，领我在可安歇的水边。',
            'PSA_23_3': '他使我的灵魂苏醒，为自己的名引导我走义路。',
            'PSA_23_4': '我虽然行过死荫的幽谷，也不怕遇害，因为你与我同在；你的杖，你的竦，都安慰我。',
            'PSA_23_5': '在我敌人面前，你为我摆设筵席；你用油膏了我的头，使我的福杯满溢。',
            'PSA_23_6': '我一生一世必有恩惠慈爱随着我；我且要住在耶和华的殿中，直到永远。',
            'ROM_8_28': '我们晓得万事都互相效力，叫爱神的人得益处，就是按他旨意被召的人。',
            'MAT_5_3': '虚心的人有福了！因为天国是他们的。',
            'MAT_5_4': '哀恐的人有福了！因为他们必得安慰。',
            'MAT_5_5': '温柔的人有福了！因为他们必承受地土。',
            'MAT_5_6': '饥渴慈义的人有福了！因为他们必得饱足。',
            'MAT_5_7': '怜恤人的人有福了！因为他们必蒙怜恤。',
            'MAT_5_8': '清心的人有福了！因为他们必得见神。'
        };
        
        const bookName = bibleAPIBookMapping[bookAbbr.toUpperCase()];
        if (!bookName) {
            throw new Error(`Bible API不支持书卷: ${bookAbbr}`);
        }
        
        // 构建 URL
        let url;
        if (endVerse === 999) {
            url = `https://bible-api.com/${bookName}+${chapter}`;
        } else if (startVerse === endVerse) {
            url = `https://bible-api.com/${bookName}+${chapter}:${startVerse}`;
        } else {
            url = `https://bible-api.com/${bookName}+${chapter}:${startVerse}-${endVerse}`;
        }
        
        console.log('调用 Bible API:', url);
        
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Bible API请求超时')), 15000);
        });
        
        const fetchPromise = fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'ScriptureSlides.app/1.0'
            }
        });
        
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (!response.ok) {
            throw new Error(`Bible API响应错误: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Bible API返回数据:', data);
        
        let verses = [];
        
        if (data.verses && Array.isArray(data.verses)) {
            verses = data.verses.map(v => {
                const key = `${bookAbbr.toUpperCase()}_${chapter}_${v.verse}`;
                return {
                    chapter_number: chapter,
                    verse_number: v.verse,
                    full_reference: `${chapter}:${v.verse}`,
                    text: chineseVerses[key] || `中文经文 ${chapter}:${v.verse}`,
                    text_english: v.text || ''
                };
            });
        } else if (data.text) {
            const key = `${bookAbbr.toUpperCase()}_${chapter}_${startVerse}`;
            verses = [{
                chapter_number: chapter,
                verse_number: startVerse,
                full_reference: `${chapter}:${startVerse}`,
                text: chineseVerses[key] || `中文经文 ${chapter}:${startVerse}`,
                text_english: data.text
            }];
        }
        
        if (verses.length === 0) {
            throw new Error('Bible API未返回经文数据');
        }
        
        return {
            data: { verses },
            error: null
        };
        
    } catch (error) {
        console.error('Bible API调用失败:', error);
        throw error;
    }
};T': 'Acts',
            'ROM': 'Romans', '1CO': '1Corinthians', '2CO': '2Corinthians', 'GAL': 'Galatians', 'EPH': 'Ephesians',
            'PHP': 'Philippians', 'COL': 'Colossians', '1TH': '1Thessalonians', '2TH': '2Thessalonians',
            '1TI': '1Timothy', '2TI': '2Timothy', 'TIT': 'Titus', 'PHM': 'Philemon', 'HEB': 'Hebrews',
            'JAS': 'James', '1PE': '1Peter', '2PE': '2Peter', '1JN': '1John', '2JN': '2John',
            '3JN': '3John', 'JUD': 'Jude', 'REV': 'Revelation'
        };
        
        const bookName = bookNameMapping[bookAbbr.toUpperCase()];
        if (!bookName) {
            throw new Error(`备用API不支持书卷: ${bookAbbr}`);
        }

        // 构建请求范围
        let verseRange = '';
        if (startVerse === endVerse) {
            verseRange = `:${startVerse}`;
        } else if (endVerse === 999) {
            verseRange = ''; // 整章
        } else {
            verseRange = `:${startVerse}-${endVerse}`;
        }
        
        const url = `https://bible-api.com/${bookName}${chapter}${verseRange}`;
        console.log('调用英文圣经API:', url);
        
        // 创建带超时的fetch请求
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('英文API请求超时')), 10000);
        });
        
        const fetchPromise = fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'ScriptureSlides.app/1.0'
            }
        });
        
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (!response.ok) {
            throw new Error(`英文API响应错误: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('英文API返回数据:', data);
        
        let verses = [];
        
        if (data.verses && Array.isArray(data.verses)) {
            // 多节经文
            verses = data.verses.map(v => ({
                chapter_number: chapter,
                verse_number: v.verse,
                full_reference: `${chapter}:${v.verse}`,
                text: '', // 英文API不提供中文
                text_english: v.text || ''
            }));
        } else if (data.text) {
            // 单节经文
            verses = [{
                chapter_number: chapter,
                verse_number: startVerse,
                full_reference: `${chapter}:${startVerse}`,
                text: '',
                text_english: data.text
            }];
        }
        
        if (verses.length === 0) {
            throw new Error('英文API未返回经文数据');
        }
        
        return {
            data: { verses },
            error: null
        };
        
    } catch (error) {
        console.error('英文API调用失败:', error);
        throw error;
    }
};

// 增强的圣经内容获取函数，优先使用 bolls.life API
export const fetchBibleContent = async (params) => {
    try {
        // 验证参数
        if (!params || !params.book_abbr || !params.chapter) {
            throw new Error('缺少必要的参数：书卷缩写和章节号');
        }

        console.log('开始获取圣经内容:', params);
        
        // 优先尝试 Bolls.life API
        try {
            console.log('正在尝试 Bolls.life API...');
            const bollsResult = await fetchFromBollsLifeAPI(
                params.book_abbr,
                params.chapter,
                params.start_verse || 1,
                params.end_verse || 999
            );
            
            if (bollsResult && bollsResult.data && bollsResult.data.verses.length > 0) {
                console.log('Bolls.life API成功获取经文数据:', bollsResult.data.verses.length, '节');
                return bollsResult;
            }
        } catch (bollsError) {
            console.warn('Bolls.life API调用失败，尝试备用API:', bollsError.message);
        }
        
        // 如果 Bolls.life API 失败，尝试英文备用API
        try {
            console.log('正在尝试英文备用API...');
            const backupResult = await fetchFromBackupAPI(
                params.book_abbr,
                params.chapter,
                params.start_verse || 1,
                params.end_verse || 999
            );
            
            console.log('英文备用API成功获取经文数据:', backupResult.data.verses.length, '节');
            return backupResult;
            
        } catch (backupError) {
            console.warn('英文备用API也失败了:', backupError.message);
        }
        
        // 所有API都失败了，抛出错误
        throw new Error('所有圣经API 都无法连接，请检查网络连接后重试');
        
    } catch (error) {
        console.error('获取圣经内容失败:', error);
        
        // 最后的降级方案：生成结构化的示例数据
        const bookNames = {
            'GEN': '创世记', 'EXO': '出埃及记', 'PSA': '诗篇', 'JHN': '约翰福音', 
            'MAT': '马太福音', 'ROM': '罗马书', 'ACT': '使徒行传'
        };
        
        const bookName = bookNames[params.book_abbr.toUpperCase()] || '圣经';
        const startVerse = params.start_verse || 1;
        const endVerse = params.end_verse || Math.min(startVerse + 2, startVerse + 5);
        
        const fallbackVerses = [];
        for (let i = startVerse; i <= endVerse; i++) {
            fallbackVerses.push({
                chapter_number: params.chapter,
                verse_number: i,
                full_reference: `${params.chapter}:${i}`,
                text: `${bookName} ${params.chapter}:${i} - 由于网络问题暂时无法获取完整经文。请检查网络连接后重新尝试以获取准确的圣经内容。`,
                text_english: `${bookName} ${params.chapter}:${i} - Due to network issues, complete scripture content is temporarily unavailable. Please check your network connection and try again for accurate Bible content.`
            });
        }
        
        return {
            data: {
                verses: fallbackVerses
            },
            error: new Error('网络连接问题，显示的是占位符内容。请检查网络连接后重试以获取真实的圣经经文。')
        };
    }
};

