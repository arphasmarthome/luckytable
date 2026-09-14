# LUMIQ 家庭相框原型

本頁延續 `docs/device_images/相册.png` 與 `相册-全屏.png` 的功能基線，並新增逐張照片的 AI 美化與動態生成流程。

## 已實作

- 相框主頁以觀看為主，AI 動態自動播放；照片只用上一張／下一張手動切換
- 目前照片旁提供單一「一鍵生成 AI 動態」入口，避免重複設定
- 照片集中在主相框切換，不另外顯示重複的家庭相簿網格
- 上傳、全螢幕、刪除、顯示裝置與播放偏好集中在「設定」
- 可在設定中調整一鍵生成預設與天氣效果
- 每張照片各自提供「AI 美化」入口與處理狀態
- 可選「動作延伸」或「天氣變化」，天氣包含陽光、雲層、細雨與飄雪
- 上傳、主體與場景分析、畫面內動作或天氣生成、自然融合
- 動態始終使用同一張照片產生 5 秒片段，不會在 5 秒後切換照片
- 原圖保留、動態版本可重新產生或移除
- 伺服器失敗、逾時、取消與重試狀態
- 未設定伺服器時使用確定性的本機效果示範；這不是實際生成影片

## 伺服器接入

頁面啟動前設定：

```js
window.PHOTO_AI_MOTION_ENDPOINT = "/api/photo-frame/motion";
```

前端會以 `multipart/form-data` 傳送：

- `photo`: 原始圖片
- `photoId`: 相片識別碼
- `durationSeconds`: `5`
- `effectType`: `action-extension` 或 `weather-transition`
- `weatherPreset`: 天氣模式時傳送 `sunlight`、`clouds`、`rain` 或 `snow`
- `style`: `natural`

同步回應可直接提供：

```json
{
  "status": "completed",
  "videoUrl": "/media/generated/example.mp4",
  "posterUrl": "/media/generated/example-poster.webp",
  "durationSeconds": 5,
  "effectType": "action-extension",
  "analysis": {
    "subject": "4 位家人",
    "depth": "前後三層",
    "motion": "人物自然微動"
  }
}
```

非同步工作可先回傳 `statusUrl`。前端會定期查詢，直到取得 `videoUrl`、狀態為 `completed`，或服務回覆 `failed`。

目前倉庫只有前端接入介面與本機示範效果，沒有實際的照片分析／影片生成伺服器。
