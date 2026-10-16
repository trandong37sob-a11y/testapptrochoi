import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'server-db.json');

// Ensure data folder exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

interface ServerDB {
  config: {
    googleSheetWebhookUrl: string;
    googleSheetUrl: string;
    sheetName: string;
    autoSyncEnabled: boolean;
  };
  results: Array<{
    id: string;
    timestamp: string;
    studentName: string;
    gradeClass: string;
    topicId: string;
    topicName: string;
    gameMode: string;
    score: number;
    correctCount: number;
    totalQuestions: number;
    accuracy: number;
    timeSpentSeconds: number;
    rating: string;
    weakPoints: string;
    syncedToSheet?: boolean;
  }>;
}

const defaultDB: ServerDB = {
  config: {
    googleSheetWebhookUrl: '',
    googleSheetUrl: '',
    sheetName: 'Kết Quả Học Sinh',
    autoSyncEnabled: true,
  },
  results: [],
};

const loadDB = (): ServerDB => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error loading server DB:', err);
  }
  return defaultDB;
};

const saveDB = (data: ServerDB) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving server DB:', err);
  }
};

let db = loadDB();

// Helper to push a result to Google Sheets Webhook from the server
const pushToGoogleSheetWebhook = async (webhookUrl: string, resultData: any) => {
  if (!webhookUrl || !webhookUrl.startsWith('http')) return false;

  try {
    // Send payload matching Google Apps Script doPost(e)
    const payload = {
      timestamp: resultData.timestamp,
      studentName: resultData.studentName,
      gradeClass: resultData.gradeClass,
      topicName: resultData.topicName,
      gameMode: resultData.gameMode,
      score: resultData.score,
      correctCount: resultData.correctCount,
      totalQuestions: resultData.totalQuestions,
      accuracy: `${resultData.accuracy}%`,
      timeSpentSeconds: `${resultData.timeSpentSeconds}s`,
      rating: resultData.rating,
      weakPoints: resultData.weakPoints || 'Nắm vững kiến thức!',
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (err) {
    console.error('Server failed to forward to Google Sheet webhook:', err);
    return false;
  }
};

async function startServer() {
  const app = express();
  app.use(express.json());

  // API 1: Get Server Configuration
  app.get('/api/server-config', (req, res) => {
    res.json({
      success: true,
      config: db.config,
      totalResultsOnServer: db.results.length,
    });
  });

  // API 2: Update Server Configuration (Teacher sets their Google Sheet Webhook)
  app.post('/api/server-config', (req, res) => {
    const { googleSheetWebhookUrl, googleSheetUrl, sheetName, autoSyncEnabled } = req.body;
    db.config = {
      ...db.config,
      googleSheetWebhookUrl: typeof googleSheetWebhookUrl === 'string' ? googleSheetWebhookUrl.trim() : db.config.googleSheetWebhookUrl,
      googleSheetUrl: typeof googleSheetUrl === 'string' ? googleSheetUrl.trim() : db.config.googleSheetUrl,
      sheetName: sheetName || db.config.sheetName,
      autoSyncEnabled: autoSyncEnabled !== undefined ? Boolean(autoSyncEnabled) : db.config.autoSyncEnabled,
    };
    saveDB(db);
    res.json({ success: true, config: db.config });
  });

  // API 3: Get all student results stored on the server
  app.get('/api/server-results', (req, res) => {
    res.json({
      success: true,
      results: db.results,
      config: {
        googleSheetConfigured: Boolean(db.config.googleSheetWebhookUrl),
        googleSheetUrl: db.config.googleSheetUrl,
      },
    });
  });

  // API 4: When a student plays and finishes, client sends result to Server
  // Server saves it and automatically forwards it to the teacher's Google Sheet
  app.post('/api/server-submit', async (req, res) => {
    const resultData = req.body;
    if (!resultData || !resultData.studentName) {
      return res.status(400).json({ error: 'Missing student data' });
    }

    let syncedToSheet = false;
    // Check if Google Sheet webhook is configured on server
    if (db.config.googleSheetWebhookUrl && db.config.autoSyncEnabled) {
      syncedToSheet = await pushToGoogleSheetWebhook(db.config.googleSheetWebhookUrl, resultData);
    }

    const record = {
      ...resultData,
      id: resultData.id || `res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      syncedToSheet,
    };

    // Store at beginning of server list
    db.results.unshift(record);
    // Keep last 1000 records on server
    if (db.results.length > 1000) {
      db.results = db.results.slice(0, 1000);
    }
    saveDB(db);

    console.log(`[Server] Received quiz from "${resultData.studentName}" (${resultData.score}đ). Synced to Google Sheet: ${syncedToSheet}`);

    res.json({
      success: true,
      recordId: record.id,
      syncedToSheet,
      message: syncedToSheet
        ? 'Đã lưu lên máy chủ và cập nhật vào Google Sheet thành công!'
        : 'Đã lưu an toàn trên máy chủ của bạn.',
    });
  });

  // API 5: Test connection to teacher's Google Sheet Webhook
  app.post('/api/server-test-sheet', async (req, res) => {
    const { webhookUrl } = req.body;
    const targetUrl = webhookUrl || db.config.googleSheetWebhookUrl;

    if (!targetUrl) {
      return res.status(400).json({ error: 'Chưa nhập URL Webhook Google Sheet.' });
    }

    const now = new Date();
    const testPayload = {
      timestamp: `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
        .toString()
        .padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}`,
      studentName: 'Học sinh Thử Nghiệm (Test)',
      gradeClass: 'Lớp 3A Test',
      topicName: 'Kiểm Tra Kết Nối Máy Chủ',
      gameMode: 'Thử Nghiệm Kết Nối',
      score: 100,
      correctCount: 10,
      totalQuestions: 10,
      accuracy: 100,
      timeSpentSeconds: 15,
      rating: 'Xuất Sắc ⭐⭐⭐',
      weakPoints: 'Kết nối máy chủ Google Sheet thành công!',
    };

    const ok = await pushToGoogleSheetWebhook(targetUrl, testPayload);
    if (ok) {
      res.json({ success: true, message: 'Đã gửi thành công 1 dòng kiểm tra vào Google Sheet của bạn!' });
    } else {
      res.status(500).json({
        error: 'Không thể kết nối đến Google Sheet. Vui lòng kiểm tra lại quyền truy cập hoặc URL Webhook.',
      });
    }
  });

  // Mount Vite middleware in development
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
