/**
 * Math Question & Grade 3 Curriculum Types
 */

export type TopicId =
  | 'all'
  | 'multiplication_division'
  | 'numbers_10000_100000'
  | 'geometry_measurement'
  | 'time_calendar'
  | 'word_problems'
  | 'statistics_probability';

export interface MathTopic {
  id: TopicId;
  name: string;
  shortDesc: string;
  icon: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
}

export const MATH_TOPICS: MathTopic[] = [
  {
    id: 'multiplication_division',
    name: 'Bảng Nhân, Bảng Chia & Tính Nhẩm',
    shortDesc: 'Bảng cửu chương 6-9, nhân chia số 2-3 chữ số, chia có dư',
    icon: '✖️➗',
    color: 'from-blue-500 to-indigo-600',
    badgeBg: 'bg-blue-50 text-blue-700',
    badgeBorder: 'border-blue-200',
  },
  {
    id: 'numbers_10000_100000',
    name: 'Số Trong Phạm Vi 100.000 & Phép Tính',
    shortDesc: 'Đọc, viết, so sánh, làm tròn số, cộng trừ 4-5 chữ số',
    icon: '🔢',
    color: 'from-emerald-500 to-teal-600',
    badgeBg: 'bg-emerald-50 text-emerald-700',
    badgeBorder: 'border-emerald-200',
  },
  {
    id: 'geometry_measurement',
    name: 'Hình Học & Đo Lường (Chu vi, Diện tích)',
    shortDesc: 'Góc vuông, chu vi, diện tích hình chữ nhật/vuông, mm, cm, g, ml, tiền VN',
    icon: '📐',
    color: 'from-amber-500 to-orange-600',
    badgeBg: 'bg-amber-50 text-amber-700',
    badgeBorder: 'border-amber-200',
  },
  {
    id: 'time_calendar',
    name: 'Thời Gian & Xem Đồng Hồ, Xem Lịch',
    shortDesc: 'Xem đồng hồ chính xác đến phút, giờ kém, số ngày các tháng',
    icon: '⏰',
    color: 'from-purple-500 to-pink-600',
    badgeBg: 'bg-purple-50 text-purple-700',
    badgeBorder: 'border-purple-200',
  },
  {
    id: 'word_problems',
    name: 'Toán Có Lời Văn (Giải 2 Bước)',
    shortDesc: 'Bài toán rút về đơn vị, gấp lên/giảm đi nhiều lần, thực tế',
    icon: '📝',
    color: 'from-rose-500 to-red-600',
    badgeBg: 'bg-rose-50 text-rose-700',
    badgeBorder: 'border-rose-200',
  },
  {
    id: 'statistics_probability',
    name: 'Thống Kê, Biểu Đồ & Khả Năng Xảy Ra',
    shortDesc: 'Bảng số liệu, biểu đồ tranh, chắc chắn - có thể - không thể',
    icon: '📊',
    color: 'from-cyan-500 to-blue-600',
    badgeBg: 'bg-cyan-50 text-cyan-700',
    badgeBorder: 'border-cyan-200',
  },
];

export interface VisualData {
  type: 'clock' | 'geometry' | 'money' | 'measurement' | 'pictograph' | 'fraction_bar';
  clock?: {
    hours: number;
    minutes: number;
  };
  geometry?: {
    shape: 'rectangle' | 'square' | 'right_angle' | 'triangle';
    width?: number;
    height?: number;
    side?: number;
    unit?: string;
    showPerimeterFormula?: boolean;
    showAreaFormula?: boolean;
  };
  money?: {
    bills: { value: number; count: number }[];
  };
  measurement?: {
    scaleType: 'length' | 'weight' | 'volume';
    value: number;
    unit: string;
  };
  tableData?: {
    headers: string[];
    rows: (string | number)[][];
  };
}

export interface Question {
  id: string;
  topicId: TopicId;
  topicName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prompt: string;
  subPrompt?: string;
  visual?: VisualData;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint: string;
}

export interface StudentProfile {
  name: string;
  gradeClass: string;
  schoolName?: string;
  avatar: string;
  totalScore: number;
  gamesPlayed: number;
  badges: string[];
  isLoggedIn: boolean;
}

