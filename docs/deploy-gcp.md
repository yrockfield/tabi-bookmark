# タビブ -TabiBookmark- Google Cloud (GCP) デプロイ手順書

本手順書は、「タビブ -TabiBookmark-」を Google Cloud のサーバーレスサービス **Cloud Run** （単一コンテナ）および **Google Cloud Storage (GCS)** を使用してデプロイ・運用するための一連の手順をまとめています。

---

## 🏗️ 全体アーキテクチャ

```
[ スマホ / Web クライアント ]
            │
            ▼ (HTTPS / Google OAuth 2.0)
┌────────────────────────────────────────────────────────┐
│  Google Cloud Run (単一コンテナ: tabibookmark)           │
│  Next.js 14 Standalone Server                          │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼ (S3 互換 HMAC API / JSON & 写真)
┌────────────────────────────────────────────────────────┐
│  Google Cloud Storage (GCS バケット)                    │
│  - trips/index.json                                    │
│  - trips/{tripId}/data.json                            │
│  - trips/{tripId}/photos/...                           │
└──────────────────────────┴─────────────────────────────┘
```

---

## 📋 前提条件

- **Google Cloud アカウント** およびプロジェクト（例: `my-tabibookmark-proj`）
- ローカル環境にインストール済みのツール:
  - `gcloud` CLI (`gcloud components update`)
  - `docker`

---

## Step 1: Google Cloud Storage (GCS) の作成 & 認証キー発行

1. **gcloud のプロジェクト設定とAPI有効化**
   ```bash
   gcloud config set project MY_PROJECT_ID
   gcloud services enable run.googleapis.com \
                          artifactregistry.googleapis.com \
                          storage.googleapis.com \
                          secretmanager.googleapis.com
   ```

2. **GCS バケットの作成**
   ```bash
   export BUCKET_NAME="tabibookmark-data-bucket"
   export REGION="asia-northeast1"

   gcloud storage buckets create gs://${BUCKET_NAME} \
     --location=${REGION} \
     --uniform-bucket-level-access
   ```

3. **GCS S3互換 HMAC キー（Access Key / Secret Key）の発行**
   Cloud Run から GCS を S3 互換 API 経由で操作するための HMAC キーを発行します。
   ```bash
   # サービスアカウントの作成
   gcloud iam service-accounts create tabibookmark-sa \
     --display-name="Tabibookmark Storage Service Account"

   # バケットのストレージ管理者権限を付与
   gcloud storage buckets add-iam-policy-binding gs://${BUCKET_NAME} \
     --member="serviceAccount:tabibookmark-sa@MY_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/storage.objectAdmin"

   # HMACアクセスキー・シークレットの発行
   gcloud storage hmac create tabibookmark-sa@MY_PROJECT_ID.iam.gserviceaccount.com
   ```
   *出力結果の `accessId` (S3_ACCESS_KEY_ID) と `secret` (S3_SECRET_ACCESS_KEY) をメモしてください。*

---

## Step 2: Google OAuth 2.0 クライアントIDの「事前作成」

1. [Google Cloud Console > APIとサービス > 認証情報](https://console.cloud.google.com/apis/credentials) へアクセスします。
2. **「認証情報を作成」 > 「OAuth クライアント ID」** を選択します。
   - アプリケーションの種類: **ウェブ アプリケーション**
   - 名前: `Tabibookmark Web Client`
   - **承認済みの JavaScript リダイレクト URI**: (ローカル用テスト等、一旦 `http://localhost:3000` を設定)
   - **承認済みのリダイレクト URI**: (一旦 `http://localhost:3000/api/auth/callback/google` を設定)
3. 発行された **クライアント ID** (`GOOGLE_CLIENT_ID`) と **クライアント シークレット** (`GOOGLE_CLIENT_SECRET`) をメモします。
   *(※ Cloud Run の本番URLは Step 4 デプロイ後に確定するため、Step 5 で本番URIを追加登録します)*

---

## Step 3: Artifact Registry の作成 & コンテナイメージのビルドとプッシュ

1. **Artifact Registry リポジトリの作成**
   ```bash
   gcloud artifacts repositories create tabibookmark-repo \
     --repository-format=docker \
     --location=asia-northeast1 \
     --description="Docker repository for Tabibookmark"
   ```

2. **Docker 認証の設定**
   ```bash
   gcloud auth configure-docker asia-northeast1-docker.pkg.dev
   ```

3. **ローカルで Docker イメージをビルド＆プッシュ**
   ```bash
   export IMAGE_URI="asia-northeast1-docker.pkg.dev/MY_PROJECT_ID/tabibookmark-repo/tabibookmark:latest"

   # ビルド
   docker build -t ${IMAGE_URI} .

   # プッシュ
   docker push ${IMAGE_URI}
   ```

---

## Step 4: Google Cloud Run へのデプロイ

Cloud Run へコンテナを単一インスタンス/オートスケール対応でデプロイします。

```bash
gcloud run deploy tabibookmark \
  --image=${IMAGE_URI} \
  --platform=managed \
  --region=asia-northeast1 \
  --allow-unauthenticated \
  --port=3000 \
  --set-env-vars="NEXTAUTH_SECRET=a-very-secure-random-string-for-nextauth" \
  --set-env-vars="GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com" \
  --set-env-vars="GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET" \
  --set-env-vars="S3_BUCKET_NAME=tabibookmark-data-bucket" \
  --set-env-vars="S3_REGION=auto" \
  --set-env-vars="S3_ENDPOINT=https://storage.googleapis.com" \
  --set-env-vars="S3_ACCESS_KEY_ID=YOUR_HMAC_ACCESS_ID" \
  --set-env-vars="S3_SECRET_ACCESS_KEY=YOUR_HMAC_SECRET"
```

デプロイ完了後、Cloud Run のサービス URL が自動発行されて画面に表示されます：
`Service URL: https://tabibookmark-xyz123-an.a.run.app`

---

## Step 5: OAuth 認証への本番 URI 追加 ＆ 動作確認

1. **OAuth 認証設定に Cloud Run の本番 URL を追加設定**
   Step 2 で作成した Google Cloud Console の OAuth クライアント設定を開き、発番された Cloud Run の本番 URL を追加して保存します。
   - **承認済みの JavaScript リダイレクト URI**:
     - `https://tabibookmark-xyz123-an.a.run.app`
   - **承認済みのリダイレクト URI**:
     - `https://tabibookmark-xyz123-an.a.run.app/api/auth/callback/google`

2. **Cloud Run の NEXTAUTH_URL 環境変数をアップデート**
   ```bash
   gcloud run services update tabibookmark \
     --region=asia-northeast1 \
     --update-env-vars="NEXTAUTH_URL=https://tabibookmark-xyz123-an.a.run.app"
   ```

3. **動作テスト**
   - 発行された URL にアクセスし、「ログイン」から Google アカウント認証ができるかテスト。
   - しおり作成、予定・持ち物・写真投稿をテストし、GCS バケットに保存されるか確認。
