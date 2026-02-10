# ⚡ QUICK START GUIDE

## Already have Python, Node.js, and FFmpeg installed?

### 1. Backend Setup (3 commands)
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### 2. Frontend Setup (3 commands - NEW TERMINAL)
```bash
cd frontend
npm install
npm run dev
```

### 3. Open Browser
```
http://localhost:3000
```

## That's it! 🎉

---

## Don't have dependencies?

### Install in this order:

1. **Python** → https://python.org (Check "Add to PATH")
2. **Node.js** → https://nodejs.org
3. **FFmpeg** → `choco install ffmpeg` (or see SETUP_GUIDE.md)
4. **yt-dlp** → `pip install yt-dlp`

Then run the 3+3 commands above!

---

## Testing

1. Paste YouTube URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
2. Click "Analyze"
3. Download any quality
4. Video should have AUDIO ✅

---

## Files Structure

```
backend/
  main.py           - API server
  config.py         - Settings
  scraper.py        - Video info extraction
  downloader.py     - Download logic
  requirements.txt  - Dependencies

frontend/
  app/page.tsx      - UI
  package.json      - Dependencies
```

---

## What Got Fixed?

✅ Facebook audio broken → **FIXED**
✅ YouTube audio missing → **FIXED**  
✅ No error messages → **FIXED**
✅ Security holes → **FIXED**
✅ Confusing errors → **FIXED with solutions**

---

## Need Help?

Read: **SETUP_GUIDE.md** for detailed instructions

Check: http://localhost:8000/health for status

Logs: `backend/downloader.log`
