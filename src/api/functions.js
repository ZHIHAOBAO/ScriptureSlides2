// Bible API Functions using bolls.life API as primary source

// Book ID mapping for bolls.life API
const bookIds = {
  'Genesis': 1, 'Exodus': 2, 'Leviticus': 3, 'Numbers': 4, 'Deuteronomy': 5,
  'Joshua': 6, 'Judges': 7, 'Ruth': 8, '1 Samuel': 9, '2 Samuel': 10,
  '1 Kings': 11, '2 Kings': 12, '1 Chronicles': 13, '2 Chronicles': 14,
  'Ezra': 15, 'Nehemiah': 16, 'Esther': 17, 'Job': 18, 'Psalms': 19,
  'Proverbs': 20, 'Ecclesiastes': 21, 'Song of Solomon': 22, 'Isaiah': 23,
  'Jeremiah': 24, 'Lamentations': 25, 'Ezekiel': 26, 'Daniel': 27,
  'Hosea': 28, 'Joel': 29, 'Amos': 30, 'Obadiah': 31, 'Jonah': 32,
  'Micah': 33, 'Nahum': 34, 'Habakkuk': 35, 'Zephaniah': 36, 'Haggai': 37,
  'Zechariah': 38, 'Malachi': 39, 'Matthew': 40, 'Mark': 41, 'Luke': 42,
  'John': 43, 'Acts': 44, 'Romans': 45, '1 Corinthians': 46, '2 Corinthians': 47,
  'Galatians': 48, 'Ephesians': 49, 'Philippians': 50, 'Colossians': 51,
  '1 Thessalonians': 52, '2 Thessalonians': 53, '1 Timothy': 54, '2 Timothy': 55,
  'Titus': 56, 'Philemon': 57, 'Hebrews': 58, 'James': 59, '1 Peter': 60,
  '2 Peter': 61, '1 John': 62, '2 John': 63, '3 John': 64, 'Jude': 65,
  'Revelation': 66
};

// Book abbreviations mapping (for backward compatibility)
const bookAbbreviations = {
  'Genesis': 'GEN', 'Exodus': 'EXO', 'Leviticus': 'LEV', 'Numbers': 'NUM', 'Deuteronomy': 'DEU',
  'Joshua': 'JOS', 'Judges': 'JDG', 'Ruth': 'RUT', '1 Samuel': '1SA', '2 Samuel': '2SA',
  '1 Kings': '1KI', '2 Kings': '2KI', '1 Chronicles': '1CH', '2 Chronicles': '2CH',
  'Ezra': 'EZR', 'Nehemiah': 'NEH', 'Esther': 'EST', 'Job': 'JOB', 'Psalms': 'PSA',
  'Proverbs': 'PRO', 'Ecclesiastes': 'ECC', 'Song of Solomon': 'SON', 'Isaiah': 'ISA',
  'Jeremiah': 'JER', 'Lamentations': 'LAM', 'Ezekiel': 'EZE', 'Daniel': 'DAN',
  'Hosea': 'HOS', 'Joel': 'JOE', 'Amos': 'AMO', 'Obadiah': 'OBA', 'Jonah': 'JON',
  'Micah': 'MIC', 'Nahum': 'NAH', 'Habakkuk': 'HAB', 'Zephaniah': 'ZEP', 'Haggai': 'HAG',
  'Zechariah': 'ZEC', 'Malachi': 'MAL', 'Matthew': 'MAT', 'Mark': 'MAR', 'Luke': 'LUK',
  'John': 'JHN', 'Acts': 'ACT', 'Romans': 'ROM', '1 Corinthians': '1CO', '2 Corinthians': '2CO',
  'Galatians': 'GAL', 'Ephesians': 'EPH', 'Philippians': 'PHP', 'Colossians': 'COL',
  '1 Thessalonians': '1TH', '2 Thessalonians': '2TH', '1 Timothy': '1TI', '2 Timothy': '2TI',
  'Titus': 'TIT', 'Philemon': 'PHM', 'Hebrews': 'HEB', 'James': 'JAS', '1 Peter': '1PE',
  '2 Peter': '2PE', '1 John': '1JN', '2 John': '2JN', '3 John': '3JN', 'Jude': 'JUD',
  'Revelation': 'REV'
};

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

// Function to fetch verses from bolls.life API
const fetchFromBollsAPI = async (bookName, chapter, startVerse, endVerse) => {
  try {
    const bookId = bookIds[bookName];
    if (!bookId) {
      throw new Error(`Book "${bookName}" not found`);
    }

    // Fetching from bolls.life API

    // Fetch English verses (KJV - King James Version)
    const englishResponse = await fetch(`https://bolls.life/get-text/KJV/${bookId}/${chapter}/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ScriptureSlides.app/1.0'
      }
    });
    
    let englishVerses = [];
    if (englishResponse.ok) {
      const englishData = await englishResponse.json();
      // English data received
      // Filter verses based on the requested range, but also consider available verses
      englishVerses = englishData.filter(v => v.verse >= startVerse && (endVerse >= 200 ? true : v.verse <= endVerse));
    } else {
      console.warn('Failed to fetch English verses:', englishResponse.status);
    }

    // Fetch Chinese verses (CUV - Chinese Union Version)
    const chineseResponse = await fetch(`https://bolls.life/get-text/CUV/${bookId}/${chapter}/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ScriptureSlides.app/1.0'
      }
    });
    
    let chineseVerses = [];
    if (chineseResponse.ok) {
      const chineseData = await chineseResponse.json();
      // Chinese data received
      // Filter verses based on the requested range, but also consider available verses
      chineseVerses = chineseData.filter(v => v.verse >= startVerse && (endVerse >= 200 ? true : v.verse <= endVerse));
    } else {
      console.warn('Failed to fetch Chinese verses:', chineseResponse.status);
    }

    // Combine English and Chinese verses
    const verses = [];
    
    // Determine the actual verse range based on available data
    const availableVerses = new Set();
    englishVerses.forEach(v => availableVerses.add(v.verse));
    chineseVerses.forEach(v => availableVerses.add(v.verse));
    
    // If no verses found in range, try to get all available verses
    if (availableVerses.size === 0) {
      // Get all available verses from both translations
      englishVerses.forEach(v => availableVerses.add(v.verse));
      chineseVerses.forEach(v => availableVerses.add(v.verse));
    }
    
    // Sort available verses and use them as the range
    const sortedVerses = Array.from(availableVerses).sort((a, b) => a - b);
    const actualStartVerse = Math.max(startVerse, Math.min(...sortedVerses));
    const actualEndVerse = Math.min(endVerse, Math.max(...sortedVerses));
    
    for (let verseNum = actualStartVerse; verseNum <= actualEndVerse; verseNum++) {
      // Only process verses that actually exist in the data
      if (availableVerses.has(verseNum)) {
        const englishVerse = englishVerses.find(v => v.verse === verseNum);
        const chineseVerse = chineseVerses.find(v => v.verse === verseNum);
        
        // Clean HTML tags and Strong's numbers from text
        const cleanText = (text) => {
          if (!text) return '';
          return text
            .replace(/<S>\d+<\/S>/g, '') // Remove Strong's numbers like <S>1161</S>
            .replace(/<[^>]*>/g, '') // Remove all other HTML tags
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .trim(); // Remove leading/trailing spaces
        };
        
        verses.push({
          chapter_number: chapter,
          verse_number: verseNum,
          full_reference: `${chapter}:${verseNum}`,
          text: chineseVerse ? cleanText(chineseVerse.text) : `${bookName} ${chapter}:${verseNum} (中文经文不可用)`,
          text_english: englishVerse ? cleanText(englishVerse.text) : `${bookName} ${chapter}:${verseNum} (English text not available)`
        });
      }
    }

    // Successfully processed verses from bolls.life API
    return verses;
  } catch (error) {
    console.error('Error fetching from Bolls API:', error);
    throw error;
  }
};

// Enhanced Bible content fetch function using bolls.life as primary source
export const fetchBibleContent = async (params) => {
    try {
        // Validate parameters
        if (!params || !params.book_abbr || !params.chapter) {
            throw new Error('缺少必要的参数：书卷缩写和章节号');
        }

        // 开始获取圣经内容
        
        // Convert book abbreviation to full name for bolls.life API
        let bookName = null;
        for (const [fullName, abbr] of Object.entries(bookAbbreviations)) {
            if (abbr === params.book_abbr.toUpperCase()) {
                bookName = fullName;
                break;
            }
        }
        
        if (!bookName) {
            throw new Error(`不支持的书卷缩写: ${params.book_abbr}`);
        }
        
        // Try bolls.life API first
        try {
            // 正在尝试 bolls.life API
            
            // First, get all available verses for the chapter to determine the actual range
            let actualEndVerse = params.end_verse;
            if (!actualEndVerse || actualEndVerse > 200) {
                // If end_verse is not specified or too large, we'll determine it from the API response
                actualEndVerse = 200; // Set a reasonable upper limit for initial fetch
            }
            
            const bollsVerses = await fetchFromBollsAPI(
                bookName,
                params.chapter,
                params.start_verse || 1,
                actualEndVerse
            );
            
            if (bollsVerses && bollsVerses.length > 0) {
                // bolls.life API成功获取经文数据
                return {
                    data: { verses: bollsVerses },
                    error: null
                };
            }
        } catch (bollsError) {
            console.warn('bolls.life API调用失败:', bollsError.message);
        }
        
        // All APIs failed, throw error
        throw new Error('所有圣经API 都无法连接，请检查网络连接后重试');
        
    } catch (error) {
        console.error('获取圣经内容失败:', error);
        
        // Final fallback: generate structured example data
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