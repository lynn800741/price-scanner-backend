// 這是完整的 server.js 檔案內容
// 直接複製這整個檔案即可

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const OpenAI = require('openai');

const app = express();
const upload = multer({ 
  limits: { fileSize: 10 * 1024 * 1024 },
  storage: multer.memoryStorage()
});

// ⚠️ 重要：請將下面的 YOUR_GITHUB_USERNAME 替換成您的 GitHub 用戶名
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://lynn800741.github.io'  // 替換這裡！
  ]
}));

app.use(express.json());

// 初始化 OpenAI - 使用環境變數
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

const prompt = `你是價格評估專家。快速分析圖片中的物品並用JSON回應。

重要規則：
- 萬物皆有價格，包括太陽、月亮、大橋等
- 無法購買的物品用幽默方式給天文數字
- 必須給出具體價格，禁止說"無價"
- 用繁體中文，保持專業但幽默

直接以JSON格式回應：
{
  "name": "物品名稱",
  "price": "NT$ 具體金額",
  "priceNote": "價格說明(30字內)",
  "description": "簡短描述(50字內)",
  "origin": "起源(50字內)",
  "material": "材質",
  "usage": "用途",
  "category": "類別",
  "brand": "品牌或通用",
  "size": "尺寸",
  "weight": "重量",
  "warranty": "保固",
  "availability": "哪裡買得到",
  "popularityScore": 1-100數字,
  "ecoScore": 1-100數字,
  "durability": "耐用度",
  "maintenance": "保養方式",
  "tips": ["建議1", "建議2", "建議3"],
  "relatedItems": [
    {"icon": "🔧", "name": "相關1"},
    {"icon": "📦", "name": "相關2"},
    {"icon": "🛡️", "name": "相關3"}
  ]
}`;

// 修改 API 呼叫參數
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
            detail: "low"  // 改為 low 以加快速度
          }
        }
      ]
    }
  ],
  max_tokens: 800,  // 減少 token 數
  temperature: 0.7,
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
