# タビブ -TabiBookmark- AWS デプロイ手順書

本手順書は、「タビブ -TabiBookmark-」を AWS の全自動サーバーレスコンテナサービス **AWS App Runner** （単一コンテナ）および **Amazon S3** を使用してデプロイ・運用するための一連の手順をまとめています。

---

## 🏗️ 全体アーキテクチャ

```
[ スマホ / Web クライアント ]
            │
            ▼ (HTTPS / Google OAuth 2.0)
┌────────────────────────────────────────────────────────┐
│  AWS App Runner (単一コンテナ: tabibookmark)            │
│  Next.js 14 Standalone Server                          │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼ (AWS SDK v3 / S3 API)
┌────────────────────────────────────────────────────────┐
│  Amazon S3 (S3 バケット)                                │
│  - trips/index.json                                    │
│  - trips/{tripId}/data.json                            │
│  - trips/{tripId}/photos/...                           │
└──────────────────────────┴─────────────────────────────┘
```

---

## 📋 前提条件

- **AWS アカウント**（AdministratorAccess または適切な IAM 権限を持つユーザー）
- ローカル環境にインストール済みのツール:
  - `aws` CLI (`aws configure` 実行済み)
  - `docker`

---

## Step 1: Amazon S3 バケットの作成 & IAM アクセキー発行

1. **S3 バケットの作成**
   ```bash
   export BUCKET_NAME="tabibookmark-data-aws-bucket"
   export REGION="ap-northeast-1"

   aws s3api create-bucket \
     --bucket ${BUCKET_NAME} \
     --region ${REGION} \
     --create-bucket-configuration LocationConstraint=${REGION}
   ```

2. **IAM ユーザーの作成 & S3 アクセス権限の付与**
   ```bash
   # IAM ユーザーの作成
   aws iam create-user --user-name tabibookmark-s3-user

   # S3アクセス用のポリシー作成とアタッチ
   aws iam put-user-policy \
     --user-name tabibookmark-s3-user \
     --policy-name TabibookmarkS3AccessPolicy \
     --policy-document '{
       "Version": "2012-10-17",
       "Statement": [
         {
           "Effect": "Allow",
           "Action": [
             "s3:GetObject",
             "s3:PutObject",
             "s3:DeleteObject",
             "s3:ListBucket"
           ],
           "Resource": [
             "arn:aws:s3:::'"${BUCKET_NAME}"'",
             "arn:aws:s3:::'"${BUCKET_NAME}"'/*"
           ]
         }
       ]
     }'

   # Access Key / Secret Key の発行
   aws iam create-access-key --user-name tabibookmark-s3-user
   ```
   *出力された `AccessKeyId` (S3_ACCESS_KEY_ID) と `SecretAccessKey` (S3_SECRET_ACCESS_KEY) をメモしてください。*

---

## Step 2: Google OAuth 2.0 クライアントIDの「事前作成」

1. [Google Cloud Console > APIとサービス > 認証情報](https://console.cloud.google.com/apis/credentials) へアクセスします。
2. **「認証情報を作成」 > 「OAuth クライアント ID」** を選択します。
   - アプリケーションの種類: **ウェブ アプリケーション**
   - 名前: `Tabibookmark AWS Client`
   - **承認済みの JavaScript リダイレクト URI**: (ローカル用テスト等、一旦 `http://localhost:3000` を設定)
   - **承認済みのリダイレクト URI**: (一旦 `http://localhost:3000/api/auth/callback/google` を設定)
3. 発行された **クライアント ID** (`GOOGLE_CLIENT_ID`) と **クライアント シークレット** (`GOOGLE_CLIENT_SECRET`) をメモします。
   *(※ AWS App Runner の本番URLは Step 4 デプロイ後に確定するため、Step 5 で本番URIを追加登録します)*

---

## Step 3: Amazon ECR の作成 & コンテナイメージのビルドとプッシュ

1. **Amazon ECR リポジトリの作成**
   ```bash
   aws ecr create-repository \
     --repository-name tabibookmark \
     --region ap-northeast-1
   ```

2. **ECR への Docker ログイン**
   ```bash
   export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
   export ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-1.amazonaws.com/tabibookmark:latest"

   aws ecr get-login-password --region ap-northeast-1 | \
     docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-1.amazonaws.com
   ```

3. **コンテナイメージのビルド & プッシュ**
   ```bash
   # ビルド
   docker build -t tabibookmark .

   # タグ付け
   docker tag tabibookmark:latest ${ECR_URI}

   # プッシュ
   docker push ${ECR_URI}
   ```

---

## Step 4: AWS App Runner へのデプロイ

AWS App Runner は単一コンテナで動作し、自動SSL証明書、自動スケールを標準提供します。

1. [AWS コンソール > App Runner](https://ap-northeast-1.console.aws.amazon.com/apprunner) へアクセスします。
2. **「サービスを作成」** をクリックします。
   - **ソース**: コンテナイメージリポジトリ > Amazon ECR
   - **コンテナイメージ URI**: `${ECR_URI}` を選択
3. **サービス設定**:
   - サービス名: `tabibookmark-service`
   - CPU / メモリ: `1 vCPU / 2 GB`
   - ポート: `3000`
   - **環境変数 (Environment variables)**:
     - `NEXTAUTH_SECRET` = `a-very-secure-random-string-for-nextauth`
     - `GOOGLE_CLIENT_ID` = `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com`
     - `GOOGLE_CLIENT_SECRET` = `YOUR_GOOGLE_CLIENT_SECRET`
     - `S3_BUCKET_NAME` = `tabibookmark-data-aws-bucket`
     - `S3_REGION` = `ap-northeast-1`
     - `S3_ACCESS_KEY_ID` = `YOUR_S3_ACCESS_KEY_ID`
     - `S3_SECRET_ACCESS_KEY` = `YOUR_S3_SECRET_ACCESS_KEY`
4. **「作成とデプロイ」** をクリックします。

デプロイ完了後、App Runner のドメイン名（例: `https://xxxxxx.ap-northeast-1.awsapprunner.com`）が発行されます。

---

## Step 5: OAuth 認証への本番 URI 追加 ＆ 動作確認

1. **Google OAuth 認証設定に App Runner の本番 URL を追加設定**
   Step 2 で作成した Google Cloud Console の OAuth クライアント設定を開き、発番された App Runner の本番 URL を追加して保存します。
   - **承認済みの JavaScript リダイレクト URI**:
     - `https://xxxxxx.ap-northeast-1.awsapprunner.com`
   - **承認済みのリダイレクト URI**:
     - `https://xxxxxx.ap-northeast-1.awsapprunner.com/api/auth/callback/google`

2. **App Runner の NEXTAUTH_URL 環境変数をアップデート**
   App Runner サービス設定の「構成」から `NEXTAUTH_URL` 環境変数に `https://xxxxxx.ap-northeast-1.awsapprunner.com` をセットして再デプロイ（更新）します。

3. **動作確認**
   - 発行された App Runner URL にアクセスし、Google 認証・しおり作成・写真アップロードをテスト。
