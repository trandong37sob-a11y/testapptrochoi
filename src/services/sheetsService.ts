/**
 * Google Sheets Service for Grade 3 Math learning results tracking
 */

export interface StudentResult {
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
}

export const DEFAULT_SPREADSHEET_NAME = 'Bảng Điểm Toán Lớp 3 - Đấu Trường Trí Tuệ';
export const SHEET_TAB_NAME = 'Kết Quả Học Sinh';

const SHEET_HEADERS = [
  'Thời Gian',
  'Họ Và Tên Học Sinh',
  'Lớp',
  'Chủ Đề',
  'Chế Độ Chơi',
  'Điểm Số',
  'Số Câu Đúng',
  'Tổng Số Câu',
  'Tỷ Lệ Đúng (%)',
  'Thời Gian (Giây)',
  'Xếp Loại',
  'Dạng Bài Cần Ôn / Ghi Chú',
];

const LOCAL_STORAGE_KEY = 'toan_lop3_local_results';
const LOCAL_SPREADSHEET_ID_KEY = 'toan_lop3_spreadsheet_id';

/**
 * Get stored spreadsheet ID from local storage
 */
export const getSavedSpreadsheetId = (): string | null => {
  return localStorage.getItem(LOCAL_SPREADSHEET_ID_KEY);
};

/**
 * Save spreadsheet ID in local storage
 */
export const setSavedSpreadsheetId = (id: string | null) => {
  if (id) {
    localStorage.setItem(LOCAL_SPREADSHEET_ID_KEY, id);
  } else {
    localStorage.removeItem(LOCAL_SPREADSHEET_ID_KEY);
  }
};

/**
 * Find existing spreadsheet or create a new formatted one in user's Google Drive
 */
export const findOrCreateMathSpreadsheet = async (
  accessToken: string
): Promise<{ id: string; name: string; url: string }> => {
  // First check if user already has a saved ID
  const savedId = getSavedSpreadsheetId();
  if (savedId) {
    try {
      const checkRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${savedId}?fields=spreadsheetId,properties.title`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (checkRes.ok) {
        const sheetData = await checkRes.json();
        return {
          id: sheetData.spreadsheetId,
          name: sheetData.properties?.title || DEFAULT_SPREADSHEET_NAME,
          url: `https://docs.google.com/spreadsheets/d/${sheetData.spreadsheetId}/edit`,
        };
      }
    } catch {
      // Stored ID might be deleted or invalid, continue searching
    }
  }

  // Search Drive for existing spreadsheet with default title
  try {
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(
      DEFAULT_SPREADSHEET_NAME
    )}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false&fields=files(id,name)`;
    const driveRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (driveRes.ok) {
      const driveData = await driveRes.json();
      if (driveData.files && driveData.files.length > 0) {
        const found = driveData.files[0];
        setSavedSpreadsheetId(found.id);
        return {
          id: found.id,
          name: found.name,
          url: `https://docs.google.com/spreadsheets/d/${found.id}/edit`,
        };
      }
    }
  } catch (err) {
    console.warn('Drive search failed, proceeding to create new sheet:', err);
  }

  // Create new Spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: DEFAULT_SPREADSHEET_NAME,
      },
      sheets: [
        {
          properties: {
            title: SHEET_TAB_NAME,
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Không thể tạo Google Sheet: ${errorText}`);
  }

  const createdSheet = await createRes.json();
  const spreadsheetId = createdSheet.spreadsheetId;
  setSavedSpreadsheetId(spreadsheetId);

  // Initialize header row with format
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${SHEET_TAB_NAME}'!A1:L1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [SHEET_HEADERS],
      }),
    }
  );

  return {
    id: spreadsheetId,
    name: DEFAULT_SPREADSHEET_NAME,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
};

/**
 * Append a student quiz result to Google Sheets
 */
export const appendResultToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  result: StudentResult
): Promise<boolean> => {
  const rowValues = [
    result.timestamp,
    result.studentName,
    result.gradeClass,
    result.topicName,
    result.gameMode,
    result.score,
    result.correctCount,
    result.totalQuestions,
    `${result.accuracy}%`,
    result.timeSpentSeconds,
    result.rating,
    result.weakPoints || 'Nắm vững kiến thức!',
  ];

  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${SHEET_TAB_NAME}'!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    }
  );

  if (!appendRes.ok) {
    // If sheet tab name didn't match, try appending to default range
    const fallbackRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [rowValues],
        }),
      }
    );
    return fallbackRes.ok;
  }

  return true;
};

/**
 * Fetch all student results from Google Sheets
 */
export const fetchResultsFromSheet = async (
  accessToken: string,
  spreadsheetId: string
): Promise<StudentResult[]> => {
  const readRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A2:L2000`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!readRes.ok) {
    throw new Error('Không thể tải dữ liệu từ Google Sheets. Vui lòng kiểm tra quyền truy cập.');
  }

  const data = await readRes.json();
  const rows: any[][] = data.values || [];

  return rows.map((row, index) => {
    const accuracyStr = (row[8] || '0%').replace('%', '').trim();
    const accuracy = Number(accuracyStr) || 0;
    return {
      id: `row-${index}-${row[0] || Date.now()}`,
      timestamp: row[0] || '',
      studentName: row[1] || 'Học sinh',
      gradeClass: row[2] || 'Lớp 3',
      topicId: 'topic',
      topicName: row[3] || 'Toán Lớp 3',
      gameMode: row[4] || 'Đấu Trường',
      score: Number(row[5]) || 0,
      correctCount: Number(row[6]) || 0,
      totalQuestions: Number(row[7]) || 0,
      accuracy,
      timeSpentSeconds: Number(row[9]) || 0,
      rating: row[10] || 'Hoàn thành',
      weakPoints: row[11] || '',
    };
  });
};

/**
 * Local storage caching for offline play and fast UI rendering
 */
export const getLocalResults = (): StudentResult[] => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveLocalResult = (result: StudentResult) => {
  try {
    const list = getLocalResults();
    list.unshift(result);
    // keep latest 100 entries locally
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list.slice(0, 100)));
  } catch (err) {
    console.error('Error saving to localStorage', err);
  }
};

/**
 * SERVER-SIDE GOOGLE SHEET INTEGRATION
 * Submits student result directly to server backend, which automatically
 * forwards and updates the teacher's master Google Sheet!
 */
export const submitResultToServer = async (
  result: StudentResult
): Promise<{ success: boolean; syncedToSheet: boolean; message: string }> => {
  try {
    const res = await fetch('/api/server-submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(result),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        syncedToSheet: Boolean(data.syncedToSheet),
        message: data.message || 'Đã lưu lên máy chủ.',
      };
    }
  } catch (err) {
    console.warn('Cannot reach server API, falling back to local storage:', err);
  }

  return {
    success: false,
    syncedToSheet: false,
    message: 'Không thể kết nối máy chủ.',
  };
};

export const fetchServerResults = async (): Promise<StudentResult[]> => {
  try {
    const res = await fetch('/api/server-results');
    if (res.ok) {
      const data = await res.json();
      return data.results || [];
    }
  } catch (err) {
    console.warn('Failed to fetch server results:', err);
  }
  return [];
};

export const fetchServerConfig = async () => {
  try {
    const res = await fetch('/api/server-config');
    if (res.ok) {
      const data = await res.json();
      return data.config;
    }
  } catch (err) {
    console.warn('Failed to fetch server config:', err);
  }
  return null;
};

export const updateServerConfig = async (config: {
  googleSheetWebhookUrl?: string;
  googleSheetUrl?: string;
  sheetName?: string;
  autoSyncEnabled?: boolean;
}) => {
  const res = await fetch('/api/server-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  return res.ok;
};

export const testServerSheetConnection = async (webhookUrl?: string) => {
  const res = await fetch('/api/server-test-sheet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ webhookUrl }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Kiểm tra kết nối thất bại.');
  }
  return data;
};

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Tạo dòng tiêu đề nếu bảng tính còn trống
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Thời Gian",
        "Họ Và Tên Học Sinh",
        "Lớp",
        "Chủ Đề",
        "Chế Độ Chơi",
        "Điểm Số",
        "Số Câu Đúng",
        "Tổng Số Câu",
        "Tỷ Lệ Đúng",
        "Thời Gian Làm Bài",
        "Xếp Loại",
        "Dạng Bài Cần Ôn / Ghi Chú"
      ]);
      sheet.getRange(1, 1, 1, 12).setFontWeight("bold").setBackground("#d1fae5");
    }
    
    // Ghi kết quả của học sinh
    sheet.appendRow([
      data.timestamp || new Date().toLocaleString("vi-VN"),
      data.studentName || "Học sinh",
      data.gradeClass || "Lớp 3",
      data.topicName || "",
      data.gameMode || "",
      data.score || 0,
      data.correctCount || 0,
      data.totalQuestions || 0,
      data.accuracy || "",
      data.timeSpentSeconds || "",
      data.rating || "",
      data.weakPoints || ""
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

