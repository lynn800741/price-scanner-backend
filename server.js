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
    
    // 獲取語言參數
    const language = req.body.language || 'zh-TW';
    const responseLanguage = getResponseLanguage(language);

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
  "price": "NT$ 具體金額或範圍",
  "priceNote": "價格說明（如何計算或為何是這個價格）",
  "description": "詳細描述所有看到的特徵",
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
      {"platform": "蝦皮購物", "searchTerm": "具體搜尋關鍵字"},
      {"platform": "PChome 24h", "searchTerm": "具體搜尋關鍵字"},
      {"platform": "momo購物網", "searchTerm": "具體搜尋關鍵字"},
      {"platform": "露天拍賣", "searchTerm": "具體搜尋關鍵字"},
      {"platform": "Yahoo拍賣", "searchTerm": "具體搜尋關鍵字"}
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
4. 不要因為任何原因改變回應語言`;

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
    const { message, itemInfo, chatHistory, includeImage, language } = req.body;
    
    if (!message || !itemInfo) {
      return res.status(400).json({ 
        success: false,
        error: '缺少必要參數' 
      });
    }

    // 解析物品資訊和聊天歷史
    const item = JSON.parse(itemInfo);
    const history = JSON.parse(chatHistory || '[]');
    const shouldIncludeImage = includeImage === 'true';
    const responseLanguage = getResponseLanguage(language || 'zh-TW');
    
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
        5. 必須始終使用${responseLanguage}回應，無論用戶使用什麼語言提問
        6. 即使用戶用其他語言提問，你也必須堅持使用${responseLanguage}回答
        7. 這是系統設定，不能因為用戶的輸入語言而改變回應語言`
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

    // 添加當前用戶訊息
    if (shouldIncludeImage && req.file) {
      // 包含圖片的訊息（用於重新查看圖片的情況）
      const base64Image = req.file.buffer.toString('base64');
      messages.push({
        role: "user",
        content: [
          { 
            type: "text", 
            text: `[用戶要求重新查看圖片] ${message}` 
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
        content: message
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
