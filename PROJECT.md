# PROJECT.md — Aura Pay

> 開發流程：參考 staged-dev workflow。[!] = 中斷待續。

## ⚡ 快速入口
- **階段**: Phase 1 — MVP 穩定化
- **DOING**: TODO #7 API 合約驗證（request validation + error shape 統一）
- **最後更新**: 2026-02-25（完成 TODO #6 版本對齊與 build warning 清理）

## 📋 當前 Phase TODO（按開發順序）

### 🧱 核心功能盤點（既有）
1. [x] Next.js 15 + TypeScript 專案重構完成
2. [x] Dashboard 首頁（營收/訂單視圖）
3. [x] Product Admin 頁面（新增/編輯/刪除）
4. [x] API routes：`/api`、`/api/products`、`/api/checkout`、`/api/webhook`
5. [x] Supabase schema 建置（`schema.sql`）

### ✅ 穩定化（近期優先）
6. [x] 套件版本清理：對齊 `next` 與 `@next/swc` 版本，消除 build warning
7. [ ] 補 API 合約驗證（request body validation / error shape 統一）
   - [x] Sub 1: 建立共用 API response contract 與驗證 helper
   - [x] Sub 2: 套用到 `/api/products`（GET/POST/PATCH/DELETE）
   - [x] Sub 3: 套用到 `/api/checkout`、`/api/webhook` 並完成 build 驗證
8. [ ] 建立最小測試集（至少涵蓋 products + checkout）
9. [ ] 補齊 `.env.example` 說明欄位與部署必要變數對照

### 🚀 上線品質（下一階段）
10. [ ] 加入基本監控與錯誤追蹤（至少 server log 結構化）
11. [ ] 補 admin 存取保護（Auth / role gate）
12. [ ] 建立 staging→production 部署檢查清單

---

*以下為完整參考資料，需要時才往下讀*

---

## 目前狀態摘要

- **Repo 狀態**：`master` 與 `origin/master` 同步，工作樹乾淨
- **最近里程碑（依 git log）**
  - `e802eda` feat: Add product management admin panel
  - `c4b7015` refactor: Migrate to Next.js 15 + TypeScript
  - `05a05d1` Add payment dashboard with stats and order listing
  - `8efc56c` Initial commit: Aura Pay API with Supabase + Vercel
- **建置狀態**：`npm run build` 成功（2026-02-25），`@next/swc` mismatch warning 已清除（next/swc = 15.5.12）

## 產品目標（當前版本）

建立一個可部署、可維護的支付後台：
- 管理產品（SKU/價格/啟用狀態）
- 產生訂單與 checkout 流程
- 接收 webhook 更新付款狀態
- 在 dashboard 檢視業務指標

## 技術棧

- Framework: Next.js 15 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- DB: Supabase
- Deploy: Vercel

## Session 結束更新規範

每次開發 session 結束前，至少更新這三項：
1. `快速入口`（階段 / DOING / 最後更新）
2. `當前 Phase TODO`（勾掉完成項、補上新 TODO）
3. `目前狀態摘要`（必要時補最新 commit / build /部署狀態）

---

*⚠️ 此檔案是 Aura Pay 開發狀態的唯一真相來源。每次 session 結束前必須更新。*