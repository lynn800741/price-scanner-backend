// 在 server.js 中找到聊天端點並替換為以下程式碼

// 聊天端點
app.post('/api/chat', upload.single('image'), async (req, res) => {
  try {
    const { message, itemInfo, chatHistory, includeImage } = req.body;
    
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
        5. 使用繁體中文回應`
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
