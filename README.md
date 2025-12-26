
# Quality Evaluator Pro - Deployment Guide

Follow these steps to take your application live using GitHub.

## 1. Prepare your GitHub Repository
1. Create a new repository on GitHub.
2. Initialize git in your local folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

## 2. Deploy the Database (MySQL)
You need a live MySQL instance.
1. Sign up at [Aiven.io](https://aiven.io/) or [Railway.app](https://railway.app/).
2. Create a **MySQL** service.
3. Note down the **Host, Port, User, Password, and Database Name**.
4. Run the contents of `init.sql` in your new database to create the tables.

## 3. Deploy the Backend (Server)
Use **Render.com** (Free Tier available):
1. Log in to [Render](https://render.com/).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository.
4. Set **Environment Variables**:
   - `DB_HOST`: (Your MySQL Host)
   - `DB_USER`: (Your MySQL User)
   - `DB_PASSWORD`: (Your MySQL Password)
   - `DB_NAME`: `qc_evaluator`
   - `DB_PORT`: `3306`
   - `DB_SSL`: `true` (if using Aiven/Railway)
5. Copy the generated URL (e.g., `https://qc-backend.onrender.com`).

## 4. Deploy the Frontend (UI)
Use **Vercel** (Best for React):
1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New** > **Project**.
3. Import your GitHub repository.
4. Set **Environment Variables**:
   - `API_URL`: `https://your-backend-url.onrender.com/api`
5. Click **Deploy**.

## 5. Final Step: Whitelist URLs
Go back to your **Render** backend settings and add your Vercel URL to the `FRONTEND_URL` environment variable to allow secure data communication (CORS).

Your app is now LIVE!
