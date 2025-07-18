const express = require('express');
const cors = require('cors');
const multer = require('multer');
const OpenAI = require('openai');

const app = express();
const upload = multer({ 
  limits: { fileSize: 10 * 1024 * 1024 },
  storage: multer.memoryStorage()
});

// CORS 設定
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://lynn800741.github.io'
  ]
}));

app.use(express.json());

// 初始化 OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 語言對應函數
function getResponseLanguage(langCode) {
  const languageMap = {
    'zh-TW': '繁體中文',
    'zh-CN': '簡體中文',
    'en': 'English',
    'ja': '日本語',
    'ko': '한국어',
    'th': 'ภาษาไทย',
    'vi': 'Tiếng Việt',
    'es': 'Español',
    'fr': 'Français',
    'de': 'Deutsch',
    'it': 'Italiano',
    'pt': 'Português',
    'ar': 'العربية',
    'tr': 'Türkçe',
    'ru': 'Русский',
    'id': 'Bahasa Indonesia',
    'fil': 'Filipino'
  };
  
  return languageMap[langCode] || languageMap['zh-TW'];
}

// 獲取幣別符號
function getCurrencySymbol(currency) {
  const symbols = {
    'TWD': 'NT$',
    'USD': '$',
    'CNY': '¥',
    'EUR': '€',
    'JPY': '¥',
    'KRW': '₩',
    'HKD': 'HK$',
    'SGD': 'S$',
    'THB': '฿',
    'VND': '₫',
    'MYR': 'RM',
    'PHP': '₱',
    'IDR': 'Rp',
    'GBP': '£',
    'CAD': 'C$',
    'AUD': 'A$',
    'CHF': 'CHF'
  };
  return symbols[currency] || currency + ' ';
}

// 根據國家代碼獲取購物平台
function getShoppingPlatforms(countryCode) {
  const platforms = {
    // 台灣
    'TW': [
      { platform: '蝦皮購物', searchTerm: '{keyword}' },
      { platform: 'PChome 24h', searchTerm: '{keyword}' },
      { platform: 'momo購物網', searchTerm: '{keyword}' },
      { platform: '露天拍賣', searchTerm: '{keyword}' },
      { platform: 'Yahoo拍賣', searchTerm: '{keyword}' }
    ],
    // 美國
    'US': [
      { platform: 'Amazon', searchTerm: '{keyword}' },
      { platform: 'eBay', searchTerm: '{keyword}' },
      { platform: 'Walmart', searchTerm: '{keyword}' },
      { platform: 'Target', searchTerm: '{keyword}' },
      { platform: 'Best Buy', searchTerm: '{keyword}' }
    ],
    // 中國
    'CN': [
      { platform: '淘寶', searchTerm: '{keyword}' },
      { platform: '京東', searchTerm: '{keyword}' },
      { platform: '拼多多', searchTerm: '{keyword}' },
      { platform: '天貓', searchTerm: '{keyword}' },
      { platform: '蘇寧易購', searchTerm: '{keyword}' }
    ],
    // 日本
    'JP': [
      { platform: 'Amazon.co.jp', searchTerm: '{keyword}' },
      { platform: '楽天市場', searchTerm: '{keyword}' },
      { platform: 'Yahoo!ショッピング', searchTerm: '{keyword}' },
      { platform: 'メルカリ', searchTerm: '{keyword}' },
      { platform: 'ヨドバシカメラ', searchTerm: '{keyword}' }
    ],
    // 韓國
    'KR': [
      { platform: 'Coupang', searchTerm: '{keyword}' },
      { platform: 'Gmarket', searchTerm: '{keyword}' },
      { platform: '11번가', searchTerm: '{keyword}' },
      { platform: 'Naver Shopping', searchTerm: '{keyword}' },
      { platform: 'Auction', searchTerm: '{keyword}' }
    ],
    // 泰國
    'TH': [
      { platform: 'Shopee', searchTerm: '{keyword}' },
      { platform: 'Lazada', searchTerm: '{keyword}' },
      { platform: 'JD Central', searchTerm: '{keyword}' },
      { platform: 'Central Online', searchTerm: '{keyword}' },
      { platform: 'Tops Online', searchTerm: '{keyword}' }
    ],
    // 越南
    'VN': [
      { platform: 'Shopee', searchTerm: '{keyword}' },
      { platform: 'Lazada', searchTerm: '{keyword}' },
      { platform: 'Tiki', searchTerm: '{keyword}' },
      { platform: 'Sendo', searchTerm: '{keyword}' },
      { platform: 'FPT Shop', searchTerm: '{keyword}' }
    ],
    // 新加坡
    'SG': [
      { platform: 'Shopee', searchTerm: '{keyword}' },
      { platform: 'Lazada', searchTerm: '{keyword}' },
      { platform: 'Amazon.sg', searchTerm: '{keyword}' },
      { platform: 'Qoo10', searchTerm: '{keyword}' },
      { platform: 'Carousell', searchTerm: '{keyword}' }
    ],
    // 馬來西亞
    'MY': [
      { platform: 'Shopee', searchTerm: '{keyword}' },
      { platform: 'Lazada', searchTerm: '{keyword}' },
      { platform: 'PGMall', searchTerm: '{keyword}' },
      { platform: 'Mudah.my', searchTerm: '{keyword}' },
      { platform: 'Lelong', searchTerm: '{keyword}' }
    ],
    // 印尼
    'ID': [
      { platform: 'Shopee', searchTerm: '{keyword}' },
      { platform: 'Tokopedia', searchTerm: '{keyword}' },
      { platform: 'Bukalapak', searchTerm: '{keyword}' },
      { platform: 'Lazada', searchTerm: '{keyword}' },
      { platform: 'Blibli', searchTerm: '{keyword}' }
    ],
    // 菲律賓
    'PH': [
      { platform: 'Shopee', searchTerm: '{keyword}' },
      { platform: 'Lazada', searchTerm: '{keyword}' },
      { platform: 'Zalora', searchTerm: '{keyword}' },
      { platform: 'Carousell', searchTerm: '{keyword}' },
      { platform: 'Facebook Marketplace', searchTerm: '{keyword}' }
    ],
    // 英國
    'GB': [
      { platform: 'Amazon.co.uk', searchTerm: '{keyword}' },
      { platform: 'eBay', searchTerm: '{keyword}' },
      { platform: 'Argos', searchTerm: '{keyword}' },
      { platform: 'ASOS', searchTerm: '{keyword}' },
      { platform: 'Tesco', searchTerm: '{keyword}' }
    ],
    // 德國
    'DE': [
      { platform: 'Amazon.de', searchTerm: '{keyword}' },
      { platform: 'eBay', searchTerm: '{keyword}' },
      { platform: 'Otto', searchTerm: '{keyword}' },
      { platform: 'Zalando', searchTerm: '{keyword}' },
      { platform: 'MediaMarkt', searchTerm: '{keyword}' }
    ],
    // 法國
    'FR': [
      { platform: 'Amazon.fr', searchTerm: '{keyword}' },
      { platform: 'eBay', searchTerm: '{keyword}' },
      { platform: 'Cdiscount', searchTerm: '{keyword}' },
      { platform: 'Fnac', searchTerm: '{keyword}' },
      { platform: 'La Redoute', searchTerm: '{keyword}' }
    ],
    // 義大利
    'IT': [
      { platform: 'Amazon.it', searchTerm: '{keyword}' },
      { platform: 'eBay', searchTerm: '{keyword}' },
      { platform: 'Subito', searchTerm: '{keyword}' },
      { platform: 'ePrice', searchTerm: '{keyword}' },
      { platform: 'Zalando', searchTerm: '{keyword}' }
    ],
    // 西班牙
    'ES': [
      { platform: 'Amazon.es', searchTerm: '{keyword}' },
      { platform: 'eBay', searchTerm: '{keyword}' },
      { platform: 'El Corte Inglés', searchTerm: '{keyword}' },
      { platform: 'Wallapop', searchTerm: '{keyword}' },
      { platform: 'AliExpress', searchTerm: '{keyword}' }
    ],
    // 巴西
    'BR': [
      { platform: 'Mercado Livre', searchTerm: '{keyword}' },
      { platform: 'Amazon.com.br', searchTerm: '{keyword}' },
      { platform: 'Americanas', searchTerm: '{keyword}' },
      { platform: 'Magazine Luiza', searchTerm: '{keyword}' },
      { platform: 'OLX', searchTerm: '{keyword}' }
    ],
    // 加拿大
    'CA': [
      { platform: 'Amazon.ca', searchTerm: '{keyword}' },
      { platform: 'eBay', searchTerm: '{keyword}' },
      { platform: 'Walmart Canada', searchTerm: '{keyword}' },
      { platform: 'Canadian Tire', searchTerm: '{keyword}' },
      { platform: 'Best Buy Canada', searchTerm: '{keyword}' }
    ],
    // 澳洲
    'AU': [
      { platform: 'Amazon.com.au', searchTerm: '{keyword}' },
      { platform: 'eBay', searchTerm: '{keyword}' },
      { platform: 'Gumtree', searchTerm: '{keyword}' },
      { platform: 'JB Hi-Fi', searchTerm: '{keyword}' },
      { platform: 'Kogan', searchTerm: '{keyword}' }
    ],
    // 俄羅斯
    'RU': [
      { platform: 'Ozon', searchTerm: '{keyword}' },
      { platform: 'Wildberries', searchTerm: '{keyword}' },
      { platform: 'AliExpress Russia', searchTerm: '{keyword}' },
      { platform: 'Avito', searchTerm: '{keyword}' },
      { platform: 'Яндекс.Маркет', searchTerm: '{keyword}' }
    ],
    // 土耳其
    'TR': [
      { platform: 'Trendyol', searchTerm: '{keyword}' },
      { platform: 'Hepsiburada', searchTerm: '{keyword}' },
      { platform: 'n11', searchTerm: '{keyword}' },
      { platform: 'GittiGidiyor', searchTerm: '{keyword}' },
      { platform: 'Amazon.com.tr', searchTerm: '{keyword}' }
    ],
    // 沙烏地阿拉伯
    'SA': [
      { platform: 'Amazon.sa', searchTerm: '{keyword}' },
      { platform: 'noon', searchTerm: '{keyword}' },
      { platform: 'Jarir', searchTerm: '{keyword}' },
      { platform: 'extra', searchTerm: '{keyword}' },
      { platform: 'Souq', searchTerm: '{keyword}' }
    ],
    // 香港
    'HK': [
      { platform: 'HKTVmall', searchTerm: '{keyword}' },
      { platform: 'PriceHK', searchTerm: '{keyword}' },
      { platform: '友和YOHO', searchTerm: '{keyword}' },
      { platform: '豐澤', searchTerm: '{keyword}' },
      { platform: 'Carousell', searchTerm: '{keyword}' }
    ]
  };
  
  // 如果找不到對應國家，返回美國平台作為預設
  return platforms[countryCode] || platforms['US'];
}

// 簡單的記憶體儲存（實際應用應使用資料庫）
const shareStorage = new Map();

// 健康檢查
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '萬物價格掃描器 API 運行中',
    endpoints: {
      health: '/api/health',
      analyze: '/api/analyze (POST)',
      chat: '/api/chat (POST)',
      share: '/api/share (POST)',
      getShare: '/api/share/:id (GET)'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'GPT-4o 價格掃描器 API' });
});

// 主要的圖片分析端點
app.post('/api/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '請提供圖片' });
    }

    const base64Image = req.file.buffer.toString('base64');

    // 獲取自定義問題
    const customQuestion = req.body.question || "這個東西多少錢？哪裡可以買到？";
    
    // 獲取語言、幣別和國家代碼參數
    const language = req.body.language || 'zh-TW';
    const currency = req.body.currency || 'TWD';
    const countryCode = req.body.countryCode || 'TW';
    const responseLanguage = getResponseLanguage(language);
    
    // 根據國家代碼獲取購物平台
    const shoppingPlatforms = getShoppingPlatforms(countryCode);
    
    // Debug: 記錄收到的參數
    console.log('分析請求參數:', {
      language: language,
      currency: currency,
      countryCode: countryCode,
      responseLanguage: responseLanguage,
      platformsCount: shoppingPlatforms.length,
      hasFile: !!req.file
    });

    // 萬物價格掃描提示詞
    const prompt = `你是萬物價格評估專家，任何東西都能給出價格！

核心原則：
1. 萬物皆有價格 - 從一支筆到整個太陽
2. 無法購買的東西用創意方式計算價值
3. 保持專業但帶幽默感
4. 絕對禁止說「無價」或「無法估價」

分析步驟：
1. 詳細描述看到的物品（包含所有細節）
2. 識別具體是什麼（品牌、型號、種類等）
3. 給出合理或創意的價格

特殊物品定價原則：
- 太陽/月亮/星球：用科學方式計算（如能源價值、稀有元素）
- 建築物：估算建造成本+地價
- 動物：強調生命無價但給出飼養成本
- 人：幽默回應並計算「培養成本」
- 藝術品/古董：根據市場行情
- 大自然景觀：用觀光價值或保護成本計算

如果是商品：
- 識別具體品牌和型號
- 不要只說「玩具」「家電」這種模糊分類
- 根據特徵推測最可能的產品

回應必須是JSON格式：
{
  "name": "具體名稱（如：野獸國 D-Stage 死侍雕像、太陽、台北101大樓）",
  "price": "${getCurrencySymbol(currency)} 具體金額或範圍",
  "priceNote": "價格說明（如何計算或為何是這個價格）",
  "description": "詳細描述所有看到的特徵，包含：主要顏色和配色方案、文字內容（品牌標誌、標籤、說明文字）、材質質感（光滑/粗糙/金屬感等）、形狀和設計特點、按鈕或控制元件的位置、任何圖案或裝飾、使用狀態（全新/使用痕跡/磨損程度）、尺寸比例關係、特殊特徵或細節",
  "material": "材質或組成",
  "usage": "用途或功能",
  "category": "分類",
  "brand": "品牌（如果有）",
  "size": "尺寸或規模",
  "weight": "重量或質量",
  "warranty": "保固或壽命",
  "availability": "哪裡可以買到或如何獲得",
  "popularityScore": 1-100,
  "ecoScore": 1-100,
  "durability": "耐用度或存在時間",
  "maintenance": "保養或維護方式",
  "tips": [
    "購買或獲得建議1",
    "購買或獲得建議2",
    "購買或獲得建議3"
  ],
  "relatedItems": [
    {"icon": "🔗", "name": "相關物品1"},
    {"icon": "🔍", "name": "相關物品2"},
    {"icon": "💡", "name": "相關物品3"}
  ],
  "purchaseLinks": {
    "online": [
${shoppingPlatforms.map(p => `      {"platform": "${p.platform}", "searchTerm": "具體搜尋關鍵字"}`).join(',\n')}
    ],
    "offline": [
      "實體店面或地點1",
      "實體店面或地點2"
    ]
  }
}

記住：
1. 要像偵探一樣分析每個細節，給出最準確的識別結果！
2. 必須始終使用${responseLanguage}回應，這是系統設定
3. 無論圖片中出現什麼語言的文字，都要用${responseLanguage}回答
4. 不要因為任何原因改變回應語言
5. 價格必須使用 ${getCurrencySymbol(currency)} 作為貨幣符號
6. 價格金額要符合該幣別的常見數值（如日圓通常是整數，美元有小數點等）

⚠️ 重要：你必須100%使用${responseLanguage}回應。如果你用中文回應而使用者要求的是其他語言，將被視為錯誤。請再次確認：你的整個回應必須是${responseLanguage}。`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "high"  // 高解析度分析每個細節
              }
            }
          ]
        }
      ],
      max_tokens: 2000,  // 增加到2000以容納更詳細的分析
      temperature: 0.5,  // 降低至0.5提升識別穩定性
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('分析錯誤:', error);
    res.status(500).json({ 
      success: false,
      error: '分析失敗，請稍後再試'
    });
  }
});

// 聊天端點（修正版本）
app.post('/api/chat', upload.single('image'), async (req, res) => {
  try {
    const { message, itemInfo, chatHistory, includeImage, language, currency } = req.body;
    
    if (!message || !itemInfo) {
      return res.status(400).json({ 
        success: false,
        error: '缺少必要參數' 
      });
    }

    // 解析物品資訊和聊天歷史
    const item = JSON.parse(itemInfo);
    const history = JSON.parse(chatHistory || '[]');
    let shouldIncludeImage = includeImage === 'true';
    const responseLanguage = getResponseLanguage(language || 'zh-TW');
    
    // 智能判斷是否需要圖片
    const visualKeywords = {
      'zh-TW': ['顏色', '色', '看起來', '外觀', '外表', '樣子', '長什麼樣', '形狀', '造型', '設計', '款式', '材質', '質感', '表面', '寫什麼', '寫著', '標示', '標籤', '文字', '型號', 'logo', '標誌', '商標', '在哪', '位置', '哪個位置', '上面', '下面', '左邊', '右邊', '按鈕', '開關', '接口', '圖案', '花紋', '紋路', '特徵', '細節', '破損', '磨損', '刮痕', '損壞', '髒污', '污漬', '痕跡', '新舊', '成色', '品相', '狀態', '是不是', '是否', '對不對', '像不像', '真假', '正品', '仿冒', '這個', '那個', '看看', '查看', '檢查', '仔細看', '照片', '圖片', '影像'],
      'zh-CN': ['颜色', '色', '看起来', '外观', '外表', '样子', '长什么样', '形状', '造型', '设计', '款式', '材质', '质感', '表面', '写什么', '写着', '标示', '标签', '文字', '型号', 'logo', '标志', '商标', '在哪', '位置', '哪个位置', '上面', '下面', '左边', '右边', '按钮', '开关', '接口', '图案', '花纹', '纹路', '特征', '细节', '破损', '磨损', '刮痕', '损坏', '脏污', '污渍', '痕迹', '新旧', '成色', '品相', '状态', '是不是', '是否', '对不对', '像不像', '真假', '正品', '仿冒', '这个', '那个', '看看', '查看', '检查', '仔细看', '照片', '图片', '影像'],
      'en': ['color', 'colour', 'look', 'looks', 'appearance', 'design', 'shape', 'style', 'material', 'texture', 'surface', 'what is', 'written', 'label', 'text', 'model', 'logo', 'brand mark', 'where', 'location', 'position', 'above', 'below', 'left', 'right', 'button', 'switch', 'port', 'pattern', 'detail', 'damage', 'scratch', 'worn', 'stain', 'condition', 'is it', 'is this', 'does it', 'genuine', 'fake', 'authentic', 'this', 'that', 'show', 'check', 'see', 'picture', 'photo', 'image'],
      'ja': ['色', 'いろ', 'カラー', '見た目', '外観', 'デザイン', '形', '材質', '質感', '書いて', 'ラベル', '文字', '型番', 'ロゴ', 'どこ', '位置', '上', '下', '左', '右', 'ボタン', 'スイッチ', '模様', '柄', '詳細', '傷', '汚れ', '状態', 'これ', 'それ', '見て', '確認', '写真', '画像'],
      'ko': ['색', '색깔', '색상', '모양', '외관', '디자인', '모습', '재질', '질감', '뭐라고', '라벨', '글자', '모델', '로고', '어디', '위치', '위', '아래', '왼쪽', '오른쪽', '버튼', '스위치', '무늬', '패턴', '세부', '흠집', '손상', '상태', '이거', '저거', '봐', '확인', '사진', '이미지'],
      'th': ['สี', 'ดู', 'ลักษณะ', 'หน้าตา', 'รูปร่าง', 'ดีไซน์', 'วัสดุ', 'เขียนว่า', 'ป้าย', 'ตัวอักษร', 'รุ่น', 'โลโก้', 'ที่ไหน', 'ตำแหน่ง', 'บน', 'ล่าง', 'ซ้าย', 'ขวา', 'ปุ่ม', 'สวิตช์', 'ลาย', 'รายละเอียด', 'รอย', 'สภาพ', 'นี่', 'นั่น', 'ดูหน่อย', 'เช็ค', 'รูป', 'ภาพ'],
      'vi': ['màu', 'màu sắc', 'nhìn', 'hình dáng', 'thiết kế', 'kiểu dáng', 'chất liệu', 'ghi', 'nhãn', 'chữ', 'model', 'logo', 'ở đâu', 'vị trí', 'trên', 'dưới', 'trái', 'phải', 'nút', 'công tắc', 'họa tiết', 'chi tiết', 'vết', 'tình trạng', 'cái này', 'cái kia', 'xem', 'kiểm tra', 'hình', 'ảnh'],
      'es': ['color', 'ver', 'aspecto', 'apariencia', 'forma', 'diseño', 'material', 'escrito', 'etiqueta', 'texto', 'modelo', 'logo', 'dónde', 'ubicación', 'arriba', 'abajo', 'izquierda', 'derecha', 'botón', 'interruptor', 'patrón', 'detalle', 'daño', 'estado', 'esto', 'eso', 'muestra', 'revisar', 'foto', 'imagen'],
      'fr': ['couleur', 'voir', 'aspect', 'apparence', 'forme', 'design', 'matériau', 'écrit', 'étiquette', 'texte', 'modèle', 'logo', 'où', 'position', 'haut', 'bas', 'gauche', 'droite', 'bouton', 'interrupteur', 'motif', 'détail', 'dommage', 'état', 'ceci', 'cela', 'montrer', 'vérifier', 'photo', 'image'],
      'de': ['Farbe', 'aussehen', 'Aussehen', 'Form', 'Design', 'Material', 'geschrieben', 'Etikett', 'Text', 'Modell', 'Logo', 'wo', 'Position', 'oben', 'unten', 'links', 'rechts', 'Taste', 'Schalter', 'Muster', 'Detail', 'Schaden', 'Zustand', 'dies', 'das', 'zeigen', 'prüfen', 'Foto', 'Bild'],
      'it': ['colore', 'vedere', 'aspetto', 'forma', 'design', 'materiale', 'scritto', 'etichetta', 'testo', 'modello', 'logo', 'dove', 'posizione', 'sopra', 'sotto', 'sinistra', 'destra', 'pulsante', 'interruttore', 'motivo', 'dettaglio', 'danno', 'condizione', 'questo', 'quello', 'mostra', 'controlla', 'foto', 'immagine'],
      'pt': ['cor', 'ver', 'aspecto', 'aparência', 'forma', 'design', 'material', 'escrito', 'etiqueta', 'texto', 'modelo', 'logo', 'onde', 'posição', 'cima', 'baixo', 'esquerda', 'direita', 'botão', 'interruptor', 'padrão', 'detalhe', 'dano', 'estado', 'isto', 'isso', 'mostrar', 'verificar', 'foto', 'imagem'],
      'ar': ['لون', 'شكل', 'مظهر', 'تصميم', 'مادة', 'مكتوب', 'ملصق', 'نص', 'موديل', 'شعار', 'أين', 'موقع', 'فوق', 'تحت', 'يسار', 'يمين', 'زر', 'مفتاح', 'نمط', 'تفصيل', 'ضرر', 'حالة', 'هذا', 'ذلك', 'أرني', 'تحقق', 'صورة', 'صورة'],
      'tr': ['renk', 'görünüm', 'şekil', 'tasarım', 'malzeme', 'yazılı', 'etiket', 'metin', 'model', 'logo', 'nerede', 'konum', 'üst', 'alt', 'sol', 'sağ', 'düğme', 'anahtar', 'desen', 'detay', 'hasar', 'durum', 'bu', 'şu', 'göster', 'kontrol', 'fotoğraf', 'resim'],
      'ru': ['цвет', 'выглядит', 'внешний вид', 'форма', 'дизайн', 'материал', 'написано', 'этикетка', 'текст', 'модель', 'логотип', 'где', 'позиция', 'сверху', 'снизу', 'слева', 'справа', 'кнопка', 'переключатель', 'узор', 'деталь', 'повреждение', 'состояние', 'это', 'то', 'покажи', 'проверь', 'фото', 'изображение'],
      'id': ['warna', 'lihat', 'tampilan', 'bentuk', 'desain', 'bahan', 'tertulis', 'label', 'teks', 'model', 'logo', 'dimana', 'posisi', 'atas', 'bawah', 'kiri', 'kanan', 'tombol', 'saklar', 'pola', 'detail', 'kerusakan', 'kondisi', 'ini', 'itu', 'tunjukkan', 'periksa', 'foto', 'gambar'],
      'fil': ['kulay', 'tignan', 'itsura', 'hugis', 'disenyo', 'materyal', 'nakasulat', 'label', 'teksto', 'modelo', 'logo', 'saan', 'posisyon', 'taas', 'baba', 'kaliwa', 'kanan', 'button', 'switch', 'pattern', 'detalye', 'sira', 'kondisyon', 'ito', 'iyan', 'ipakita', 'tingnan', 'larawan', 'litrato']
    };
    
    // 檢查訊息是否包含視覺相關關鍵詞
    if (!shouldIncludeImage) {
      const keywords = visualKeywords[language] || visualKeywords['en'];
      const messageLower = message.toLowerCase();
      shouldIncludeImage = keywords.some(keyword => 
        messageLower.includes(keyword.toLowerCase())
      );
    }
    
    // 構建對話歷史
    const messages = [
      {
        role: "system",
        content: `你是一個專業的 AI 助手，專門回答關於「${item.name}」的問題。
        
        你已經分析過這個物品的照片，以下是詳細資訊：
        
        物品識別結果：
        - 名稱：${item.name}
        - 外觀描述：${item.description}
        - 價格：${item.price}
        - 價格說明：${item.priceNote || ''}
        - 材質：${item.material || '根據外觀判斷'}
        - 用途：${item.usage || '日常使用'}
        - 類別：${item.category || '一般商品'}
        - 品牌：${item.brand || '未知品牌'}
        - 尺寸：${item.size || '標準尺寸'}
        - 重量：${item.weight || '輕便'}
        - 購買地點：${item.availability}
        - 流行度評分：${item.popularityScore || '中等'}
        - 環保評分：${item.ecoScore || '一般'}
        - 耐用度：${item.durability || '正常'}
        - 保養方式：${item.maintenance || '一般保養即可'}
        
        購買建議：${item.tips ? item.tips.join('、') : '建議貨比三家'}
        相關物品：${item.relatedItems ? item.relatedItems.map(i => i.name).join('、') : '無'}
        
        重要提示：
        1. 你已經看過並分析過這個物品，基於上述資訊回答問題
        2. 不要說"我無法識別"或"我看不到圖片"，因為你已經有完整的分析結果
        3. 回答要具體、實用、友善
        4. 如果用戶問到你沒有的資訊，可以基於常識推測並說明是推測
        
        ⚠️ 語言設定（最重要）：
        - 你必須100%使用${responseLanguage}回應
        - 這是強制的系統設定，優先級最高
        - 無論用戶用中文、英文、泰文或任何語言提問，你都只能用${responseLanguage}回答
        - 如果你用了其他語言回答，將被視為系統錯誤
        - 請在每次回答前確認你使用的是${responseLanguage}
        - 不要模仿用戶的語言，只使用${responseLanguage}`
      }
    ];

    // 添加歷史對話（只保留最近10輪）
    const recentHistory = history.slice(-20);
    recentHistory.forEach(msg => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    });

    // 添加當前用戶訊息（加入語言提醒）
    const languageReminder = `\n\n[系統提醒：請使用${responseLanguage}回答，不要被用戶的語言影響]`;
    
    if (shouldIncludeImage && req.file) {
      // 包含圖片的訊息（用於重新查看圖片的情況）
      const base64Image = req.file.buffer.toString('base64');
      messages.push({
        role: "user",
        content: [
          { 
            type: "text", 
            text: `[用戶要求重新查看圖片] ${message}${languageReminder}` 
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
              detail: "low"  // 使用低解析度節省 token
            }
          }
        ]
      });
    } else {
      // 純文字訊息（大部分情況）
      messages.push({
        role: "user",
        content: message + languageReminder
      });
    }

    // 呼叫 OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7
    });

    const reply = response.choices[0].message.content;

    res.json({
      success: true,
      data: {
        reply: reply
      }
    });

  } catch (error) {
    console.error('聊天錯誤:', error);
    res.status(500).json({ 
      success: false,
      error: '回覆失敗，請稍後再試'
    });
  }
});

// 創建分享連結
app.post('/api/share', async (req, res) => {
  try {
    const shareData = req.body;
    
    if (!shareData || !shareData.name) {
      return res.status(400).json({ 
        success: false,
        error: '缺少分享資料' 
      });
    }

    // 生成唯一的分享 ID
    const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 儲存分享資料（設定過期時間為7天）
    const expireTime = Date.now() + (7 * 24 * 60 * 60 * 1000);
    shareStorage.set(shareId, {
      data: shareData,
      expireTime: expireTime,
      createTime: Date.now()
    });

    // 清理過期的分享
    cleanExpiredShares();

    res.json({
      success: true,
      shareId: shareId
    });

  } catch (error) {
    console.error('創建分享錯誤:', error);
    res.status(500).json({ 
      success: false,
      error: '創建分享失敗'
    });
  }
});

// 獲取分享內容
app.get('/api/share/:id', async (req, res) => {
  try {
    const shareId = req.params.id;
    const shareItem = shareStorage.get(shareId);
    
    if (!shareItem) {
      return res.status(404).json({ 
        success: false,
        error: '分享內容不存在或已過期' 
      });
    }

    // 檢查是否過期
    if (Date.now() > shareItem.expireTime) {
      shareStorage.delete(shareId);
      return res.status(404).json({ 
        success: false,
        error: '分享內容已過期' 
      });
    }

    res.json({
      success: true,
      data: shareItem.data
    });

  } catch (error) {
    console.error('獲取分享錯誤:', error);
    res.status(500).json({ 
      success: false,
      error: '獲取分享失敗'
    });
  }
});

// 清理過期的分享
function cleanExpiredShares() {
  const now = Date.now();
  for (const [key, value] of shareStorage.entries()) {
    if (now > value.expireTime) {
      shareStorage.delete(key);
    }
  }
}

// 定期清理（每小時執行一次）
setInterval(cleanExpiredShares, 60 * 60 * 1000);

// Excel 匯出端點
app.post('/api/export/excel', async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ 
        success: false,
        error: '缺少匯出資料' 
      });
    }

    // 這裡應該使用專門的 Excel 套件如 exceljs 或 xlsx
    // 由於示範，這裡簡單地返回 CSV 格式
    const headers = Object.keys(data[0] || {});
    const rows = data.map(item => headers.map(header => item[header] || ''));
    
    // 建立 CSV 內容
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // 加入 BOM 以支援中文
    const BOM = '\uFEFF';
    const buffer = Buffer.from(BOM + csvContent, 'utf-8');
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="price_scanner_export.csv"');
    res.send(buffer);

  } catch (error) {
    console.error('匯出錯誤:', error);
    res.status(500).json({ 
      success: false,
      error: '匯出失敗'
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`伺服器運行在 port ${PORT}`);
});
