# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/)


. # 社内スケジュール管理システム

  ## プロジェクト概要
  WEB制作会社向けの社内スケジュール管理システム（10-15名規模）
  - React + TypeScript で開発
  - VPSにデプロイ予定
  - Jiraより簡単で使いやすいUIを目指す

  ## 主要機能（要件定義より）
  - [ ] ユーザー管理・認証機能
  - [ ] タスク管理機能（CRUD操作）
  - [ ] ダッシュボード
  - [ ] ガントチャート表示
  - [ ] SOS機能（困った時の支援要請）
  - [ ] チーム負荷メーター
  - [ ] 通知機能
  - [ ] レポート・エクスポート機能

  ## 技術スタック
  - **フロントエンド**: React 18 + TypeScript
  - **UI**: Material-UI (@mui/material)
  - **ルーティング**: React Router
  - **状態管理**: Zustand
  - **日付操作**: Day.js
  - **ガントチャート**: gantt-task-react
  - **HTTP通信**: Axios
  - **フォーム**: React Hook Form

  ## 開発進捗

  ### 完了
  - [x] React + TypeScript環境構築
  - [x] 必要ライブラリの選定・インストール

  ### 進行中
  - [ ] 基本的なプロジェクト構造の作成

  ### 未着手
  - [ ] データベース設計
  - [ ] 認証機能
  - [ ] タスク管理機能
  - [ ] 各画面の実装

  ## フォルダ構成（予定）
  src/
    components/       # 共通コンポーネント
    pages/           # 各ページコンポーネント
    hooks/           # カスタムフック
    stores/          # Zustand store
    types/           # TypeScript型定義
    utils/           # ユーティリティ関数
    styles/          # スタイル関連

  ## 開発メモ
  - 2025/1/25: プロジェクト開始、環境構築完了
  - コメント多めで、初心者でも理解しやすいコードを心がける
  - 段階的リリース予定（Phase1: 基本機能 → Phase2: SOS・負荷メーター → Phase3:
  レポート・外部連携）

  ## 起動方法
  ```bash
  npm start

  デプロイ予定

  - VPS環境
  - 本格運用前にテスト期間を設ける予定
:



