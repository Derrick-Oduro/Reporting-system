# Quick Start Guide - Backend Setup

## Important Note About Windows Setup

The backend uses `better-sqlite3` which requires native compilation on Windows. You have **three options**:

### Option 1: Deploy to a Cloud Platform (Recommended - Easiest)

Skip local setup entirely and deploy directly to a cloud platform that handles compilation:

1. **Railway** (Easiest - Free Tier)
   ```bash
   npm i -g @railway/cli
   cd backend
   railway login
   railway init
   railway up
   ```
2. **Render** (Free Tier)
   - Push code to GitHub
   - Connect repo to [render.com](https://render.com)
   - Auto-deploys and compiles correctly

3. **Heroku** (Free Tier with credit card)
   ```bash
   heroku create your-app-name
   git subtree push --prefix backend heroku main
   ```

### Option 2: Install Build Tools on Windows

Install Visual Studio Build Tools to compile native modules:

1. Download **Visual Studio Build Tools 2022**:
   https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022

2. Run installer and select "Desktop development with C++"

3. Install backend dependencies:

   ```bash
   cd backend
   npm install
   ```

4. Start server:
   ```bash
   npm run dev
   ```

### Option 3: Use Supabase Instead (No Backend Needed)

Instead of running your own backend, use Supabase (PostgreSQL cloud database with built-in APIs):

1. Create free account at [supabase.com](https://supabase.com)
2. Create new project
3. Get your API URL and anon key
4. Update mobile app to use Supabase SDK

**This is the recommended approach for production apps!**

## Which Option Should I Choose?

- **For testing/development**: Option 1 (Deploy to Railway - takes 5 minutes)
- **For production**: Option 3 (Supabase - most scalable and reliable)
- **If you really want local development**: Option 2 (Install build tools - takes 30 minutes)

## After Setup

Once your backend is running (locally or deployed):

1. Get your API URL (e.g., `http://localhost:3000` or `https://your-app.railway.app`)
2. Update `config/api.config.ts` in the mobile app with your API URL
3. Test with: `curl YOUR_API_URL/health`
4. Login with default admin:
   - Email: `admin@system.com`
   - Password: `admin123`

## Next Steps

See [BACKEND_SETUP.md](BACKEND_SETUP.md) for detailed documentation on:

- API endpoints
- Database schema
- Deployment guides
- Security checklist
