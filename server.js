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

// 健康檢查
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '萬物價格掃描器 API 運行中',
    endpoints: {
      health: '/api/health',
      analyze: '/api/analyze (POST)'
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

    // 更精確的提示詞
    const prompt = `請仔細分析這張圖片，識別物品的具體型號、品牌和特徵。

首先描述你在圖片中看到的所有細節：
- 物品的外觀特徵（顏色、形狀、材質）
- 可見的品牌標誌或文字
- 尺寸估計
- 特殊標記或型號

如果是玩具或收藏品，請識別：
- 具體角色名稱（如寶可夢的耿鬼/Gengar）
- 系列名稱
- 版本或型號

然後提供完整的商品資訊和購買建議。回應必須是JSON格式：

{
  "name": "具體的產品名稱（包含品牌和型號）",
  "price": "NT$ 實際市場價格",
  "priceNote": "價格說明或範圍",
  "description": "詳細描述產品特徵、品牌、系列等",
  "origin": "產品的來源、品牌歷史或角色背景",
  "material": "材質和製造資訊",
  "usage": "用途和功能",
  "category": "產品類別",
  "brand": "品牌名稱",
  "size": "尺寸規格",
  "weight": "重量",
  "warranty": "保固資訊",
  "availability": "購買管道（要具體）",
  "popularityScore": 1-100,
  "ecoScore": 1-100,
  "durability": "耐用度",
  "maintenance": "保養方式",
  "tips": [
    "選購建議1",
    "選購建議2",
    "選購建議3"
  ],
  "relatedItems": [
    {"icon": "🛒", "name": "相關產品1"},
    {"icon": "🔗", "name": "相關產品2"},
    {"icon": "📦", "name": "相關產品3"}
  ],
  "purchaseLinks": {
    "online": [
      {"platform": "蝦皮購物", "searchTerm": "搜尋關鍵字"},
      {"platform": "PChome 24h", "searchTerm": "搜尋關鍵字"},
      {"platform": "momo購物網", "searchTerm": "搜尋關鍵字"},
      {"platform": "Amazon JP", "searchTerm": "英文搜尋關鍵字"},
      {"platform": "淘寶/天貓", "searchTerm": "中文搜尋關鍵字"}
    ],
    "offline": [
      "實體店面1",
      "實體店面2"
    ]
  }
}

重要規則：
- 必須識別具體的產品，不要只說"玩偶"或"玩具"
- 如果是角色商品，要說明角色名稱和來源
- 價格要根據實際市場行情
- 購買建議要包含具體的搜尋關鍵字
- 使用繁體中文`;

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
                detail: "high"  // 使用高解析度以提高辨識準確度
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.3,  // 降低隨機性，提高準確度
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`伺服器運行在 port ${PORT}`);
});
