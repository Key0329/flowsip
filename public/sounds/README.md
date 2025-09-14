# FlowSip 音效資源

這個目錄包含 FlowSip PWA 的所有音效檔案，支援多種主題和格式。

## 音效檔案結構

```
sounds/
├── README.md                    # 音效說明文件
├── water-drop.mp3              # 喝水提醒音效 (主要格式)
├── water-drop.ogg              # 喝水提醒音效 (備用格式)
├── bell-chime.mp3              # 番茄鐘完成音效
├── bell-chime.ogg              # 番茄鐘完成音效 (備用格式)
├── nature-bell.mp3             # 休息時間音效
├── nature-bell.ogg             # 休息時間音效 (備用格式)
├── click.mp3                   # 按鈕點擊音效
├── click.ogg                   # 按鈕點擊音效 (備用格式)
├── pop.mp3                     # 通知音效
├── pop.ogg                     # 通知音效 (備用格式)
├── tick.mp3                    # 計時器滴答音效
├── tick.ogg                    # 計時器滴答音效 (備用格式)
├── success.mp3                 # 成功提示音效
├── success.ogg                 # 成功提示音效 (備用格式)
├── error.mp3                   # 錯誤提示音效
├── error.ogg                   # 錯誤提示音效 (備用格式)
└── themes/                     # 音效主題目錄
    ├── nature/                 # 自然主題
    │   ├── water-stream.mp3    # 自然水流聲
    │   ├── bird-chirp.mp3      # 鳥鳴聲
    │   └── forest-bell.mp3     # 森林鈴聲
    ├── electronic/             # 電子主題
    │   ├── synth-drop.mp3      # 合成器水滴音
    │   ├── digital-chime.mp3   # 數位鈴聲
    │   └── tech-beep.mp3       # 科技嗶聲
    └── minimal/                # 簡約主題
        ├── soft-ping.mp3       # 柔和提示音
        ├── gentle-tone.mp3     # 溫和鈴聲
        └── quiet-bell.mp3      # 安靜鈴聲
```

## 音效類型說明

### 1. 喝水提醒音效 (`water-drop.mp3/.ogg`)
- **時長**: 1-2 秒
- **音調**: 柔和、舒緩
- **音效**: 清脆的水滴聲
- **音量**: 適中，不刺耳
- **用途**: 30分鐘喝水計時完成時播放

### 2. 番茄鐘完成音效 (`bell-chime.mp3/.ogg`)
- **時長**: 2-3 秒
- **音調**: 溫和但明確
- **音效**: 輕鈴聲、鐘聲
- **音量**: 略高於喝水提醒，但不刺耳
- **用途**: 25分鐘番茄鐘計時完成時播放

### 3. 按鈕點擊音效 (`click.mp3/.ogg`)
- **時長**: 0.2-0.5 秒
- **音調**: 簡潔、清脆
- **音效**: 按鈕點擊聲
- **音量**: 較低，用於回饋
- **用途**: 按鈕點擊、操作確認

## 技術規格

- **格式**: MP3 (推薦) 或 WAV
- **取樣率**: 44.1kHz 或 48kHz
- **位元率**: 128kbps - 320kbps
- **聲道**: 單聲道或立體聲
- **檔案大小**: 儘量控制在 100KB 以下

## 版權要求

- 必須使用無版權或自有版權的音效
- 建議來源：
  - Freesound.org (CC授權)
  - Zapsplat (需註冊)
  - 自製音效
  - Adobe Audition 內建音效庫

## 實作注意事項

1. 音效應通過 Web Audio API 或 HTML5 Audio 播放
2. 需要考慮不同瀏覽器的相容性
3. 提供靜音選項
4. 支援音量調整
5. 在 Service Worker 中預快取音效檔案

## MVP 階段處理

目前為佔位符檔案，在 MVP 完成後：
1. 錄製或獲取真實音效檔案
2. 更新 useNotifications composable 中的音效播放邏輯
3. 測試在不同裝置和瀏覽器上的播放效果