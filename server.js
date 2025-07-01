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

    const prompt = `你是一個專業的物品鑑定專家和價格評估師。請分析這張圖片中的物品，並提供以下資訊：

1. 物品名稱：識別這是什麼物品
2. 預估價格：給出合理的價格範圍（使用台幣 NT$）
3. 價格說明：簡短說明價格的依據
4. 基本描述：2-3句話描述這個物品
5. 歷史起源：簡述這類物品的歷史背景
6. 材質規格：說明可能的材質和規格
7. 功能用途：說明主要用途和功能
8. 類別：物品所屬類別
9. 品牌：如果能識別出品牌，請註明
10. 尺寸：估計大小
11. 重量：估計重量
12. 保固期：一般的保固期限
13. 可購買性：在哪裡可以買到
14. 熱門程度：1-100的評分
15. 環保指數：1-100的評分
16. 耐用度：預估使用壽命
17. 保養方式：簡單的保養維護建議
18. 選購建議：3個實用的選購建議
19. 相關物品：3個相關的物品推薦

特別規則：
- 如果是無法購買的物品（如太陽、月亮），請用幽默方式給出天文數字價格
- 回應請用繁體中文
- 保持專業但帶點幽默感

請以 JSON 格式回應。`;

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
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
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
