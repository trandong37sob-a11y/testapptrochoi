/**
 * Grade 3 Math Question Generator (Chương trình Toán Lớp 3 chuẩn)
 * Generates dynamic questions across all 6 core Grade 3 topics.
 */

import { Question, TopicId, VisualData } from '../types/math';

// Helper for random integer between min and max inclusive
const randInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Helper for shuffling array
const shuffle = <T>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Helper to format options without duplicates
const createOptions = (correct: string | number, distractors: (string | number)[]): { options: string[]; correctIndex: number } => {
  const correctStr = String(correct);
  const uniqueDistractors = Array.from(new Set(distractors.map(String))).filter((d) => d !== correctStr);

  const finalPool = [correctStr, ...uniqueDistractors.slice(0, 3)];
  while (finalPool.length < 4) {
    const num = Number(correct);
    if (!isNaN(num)) {
      const extra = String(num + (finalPool.length % 2 === 0 ? finalPool.length * 2 : -finalPool.length * 3));
      if (!finalPool.includes(extra)) finalPool.push(extra);
      else finalPool.push(String(num + randInt(5, 20)));
    } else {
      finalPool.push(`Đáp án ${finalPool.length + 1}`);
    }
  }

  const shuffled = shuffle(finalPool.slice(0, 4));
  return {
    options: shuffled,
    correctIndex: shuffled.indexOf(correctStr),
  };
};

/**
 * TOPIC 1: Bảng nhân, bảng chia & tính toán (bảng 6, 7, 8, 9; nhân chia 2-3 chữ số)
 */
const generateMultiplicationDivision = (difficulty: 'easy' | 'medium' | 'hard'): Question => {
  const type = randInt(1, 4);

  if (type === 1 || difficulty === 'easy') {
    // Basic multiplication or division table 6, 7, 8, 9
    const isMult = Math.random() > 0.5;
    const a = randInt(6, 9);
    const b = randInt(2, 9);

    if (isMult) {
      const ans = a * b;
      const opts = createOptions(ans, [a * (b - 1), a * (b + 1), (a - 1) * b, ans + randInt(2, 4)]);
      return {
        id: `mult-${Date.now()}-${Math.random()}`,
        topicId: 'multiplication_division',
        topicName: 'Bảng Nhân, Bảng Chia & Tính Nhẩm',
        difficulty,
        prompt: `Tính kết quả của phép tính: ${a} × ${b} = ?`,
        options: opts.options,
        correctIndex: opts.correctIndex,
        explanation: `Theo bảng nhân ${a}: ta có ${a} × ${b} = ${ans}.`,
        hint: `Hãy nhẩm bảng cửu chương nhân ${a}.`,
      };
    } else {
      const ans = b;
      const product = a * b;
      const opts = createOptions(ans, [ans - 1, ans + 1, ans + 2, Math.max(1, ans - 2)]);
      return {
        id: `div-${Date.now()}-${Math.random()}`,
        topicId: 'multiplication_division',
        topicName: 'Bảng Nhân, Bảng Chia & Tính Nhẩm',
        difficulty,
        prompt: `Tính kết quả của phép tính: ${product} : ${a} = ?`,
        options: opts.options,
        correctIndex: opts.correctIndex,
        explanation: `Vì ${a} × ${b} = ${product}, nên ${product} : ${a} = ${b}.`,
        hint: `Nhớ lại: ${a} nhân mấy thì bằng ${product}?`,
      };
    }
  } else if (type === 2) {
    // Division with remainder (phép chia có dư)
    const divisor = randInt(4, 9);
    const quotient = randInt(3, 9);
    const remainder = randInt(1, divisor - 1);
    const dividend = divisor * quotient + remainder;

    const correctAns = `${quotient} (dư ${remainder})`;
    const distractors = [
      `${quotient} (dư ${remainder + 1 >= divisor ? 1 : remainder + 1})`,
      `${quotient + 1} (dư ${remainder})`,
      `${quotient - 1} (dư ${remainder})`,
      `${quotient} (không dư)`,
    ];
    const opts = createOptions(correctAns, distractors);

    return {
      id: `divrem-${Date.now()}-${Math.random()}`,
      topicId: 'multiplication_division',
      topicName: 'Bảng Nhân, Bảng Chia & Tính Nhẩm',
      difficulty,
      prompt: `Thực hiện phép chia có dư: ${dividend} : ${divisor} = ?`,
      subPrompt: 'Lưu ý: Số dư phải bé hơn số chia!',
      options: opts.options,
      correctIndex: opts.correctIndex,
      explanation: `Ta có: ${dividend} : ${divisor} = ${quotient} (dư ${remainder}) vì ${divisor} × ${quotient} + ${remainder} = ${dividend}.`,
      hint: `Tìm số lớn nhất bé hơn ${dividend} chia hết cho ${divisor}.`,
    };
  } else if (type === 3) {
    // 2-digit or 3-digit multiplication with 1-digit
    const a = difficulty === 'hard' ? randInt(112, 345) : randInt(23, 89);
    const b = randInt(3, 6);
    const ans = a * b;
    const distractors = [ans + 10, ans - 10, a * b + b, ans + randInt(2, 8)];
    const opts = createOptions(ans, distractors);

    return {
      id: `mult23-${Date.now()}-${Math.random()}`,
      topicId: 'multiplication_division',
      topicName: 'Bảng Nhân, Bảng Chia & Tính Nhẩm',
      difficulty,
      prompt: `Đặt tính rồi tính: ${a} × ${b} = ?`,
      options: opts.options,
      correctIndex: opts.correctIndex,
      explanation: `Đặt tính nhân lần lượt từ phải sang trái: ${a} × ${b} = ${ans}.`,
      hint: `Nhớ cộng số nhớ (nếu có) khi nhân sang hàng tiếp theo nhé!`,
    };
  } else {
    // Gấp lên một số lần hoặc giảm đi một số lần
    const val = randInt(6, 18);
    const factor = randInt(3, 6);
    const isIncrease = Math.random() > 0.5;

    if (isIncrease) {
      const ans = val * factor;
      const opts = createOptions(ans, [val + factor, ans - factor, val * (factor - 1)]);
      return {
        id: `scale-up-${Date.now()}-${Math.random()}`,
        topicId: 'multiplication_division',
        topicName: 'Bảng Nhân, Bảng Chia & Tính Nhẩm',
        difficulty,
        prompt: `Số ${val} gấp lên ${factor} lần thì được số nào?`,
        options: opts.options,
        correctIndex: opts.correctIndex,
        explanation: `Muốn gấp một số lên nhiều lần, ta lấy số đó nhân với số lần: ${val} × ${factor} = ${ans}.`,
        hint: `Gấp lên nhiều lần thì làm phép tính NHÂN.`,
      };
    } else {
      const orig = val * factor;
      const ans = val;
      const opts = createOptions(ans, [orig - factor, ans + 2, Math.max(1, ans - 2)]);
      return {
        id: `scale-down-${Date.now()}-${Math.random()}`,
        topicId: 'multiplication_division',
        topicName: 'Bảng Nhân, Bảng Chia & Tính Nhẩm',
        difficulty,
        prompt: `Số ${orig} giảm đi ${factor} lần thì được số nào?`,
        options: opts.options,
        correctIndex: opts.correctIndex,
        explanation: `Muốn giảm một số đi nhiều lần, ta lấy số đó chia cho số lần: ${orig} : ${factor} = ${ans}.`,
        hint: `Giảm đi nhiều lần thì làm phép tính CHIA.`,
      };
    }
  }
};

/**
 * TOPIC 2: Các số trong phạm vi 10.000 và 100.000
 */
const generateNumbers10000To100000 = (difficulty: 'easy' | 'medium' | 'hard'): Question => {
  const type = randInt(1, 4);

  if (type === 1) {
    // Giá trị chữ số theo hàng
    const num = randInt(12000, 89000);
    const numStr = String(num);
    const positions = [
      { name: 'hàng chục nghìn', digit: Number(numStr[0]), value: Number(numStr[0]) * 10000 },
      { name: 'hàng nghìn', digit: Number(numStr[1]), value: Number(numStr[1]) * 1000 },
      { name: 'hàng trăm', digit: Number(numStr[2]), value: Number(numStr[2]) * 100 },
      { name: 'hàng chục', digit: Number(numStr[3]), value: Number(numStr[3]) * 10 },
      { name: 'hàng đơn vị', digit: Number(numStr[4]), value: Number(numStr[4]) },
    ];
    const picked = positions[randInt(0, 4)];
    const ans = picked.value.toLocaleString('vi-VN');
    const distractors = [
      picked.digit.toString(),
      (picked.value * 10).toLocaleString('vi-VN'),
      Math.max(1, picked.value / 10).toLocaleString('vi-VN'),
      ((picked.digit + 1) * 100).toLocaleString('vi-VN'),
    ];
    const opts = createOptions(ans, distractors);

    return {
      id: `place-val-${Date.now()}-${Math.random()}`,
      topicId: 'numbers_10000_100000',
      topicName: 'Số Trong Phạm Vi 100.000 & Phép Tính',
      difficulty,
      prompt: `Trong số ${num.toLocaleString('vi-VN')}, chữ số ${picked.digit} thuộc ${picked.name} có giá trị là bao nhiêu?`,
      options: opts.options,
      correctIndex: opts.correctIndex,
      explanation: `Chữ số ${picked.digit} đứng ở ${picked.name} nên có giá trị là ${ans}.`,
      hint: `Xác định vị trí hàng của chữ số từ phải sang trái: đơn vị, chục, trăm, nghìn, chục nghìn.`,
    };
  } else if (type === 2) {
    // Làm tròn số đến hàng chục, hàng trăm hoặc hàng nghìn
    const num = randInt(1250, 8950);
    const targets = ['hàng chục', 'hàng trăm', 'hàng nghìn'] as const;
    const target = targets[randInt(0, 2)];

    let rounded = 0;
    let explanationRule = '';
    if (target === 'hàng chục') {
      rounded = Math.round(num / 10) * 10;
      explanationRule = `Chữ số hàng đơn vị là ${num % 10}, ${num % 10 >= 5 ? 'lớn hơn hoặc bằng 5 nên làm tròn lên' : 'nhỏ hơn 5 nên làm tròn xuống'}.`;
    } else if (target === 'hàng trăm') {
      rounded = Math.round(num / 100) * 100;
      const tens = Math.floor((num % 100) / 10);
      explanationRule = `Chữ số hàng chục là ${tens}, ${tens >= 5 ? 'lớn hơn hoặc bằng 5 nên làm tròn lên' : 'nhỏ hơn 5 nên làm tròn xuống'}.`;
    } else {
      rounded = Math.round(num / 1000) * 1000;
      const hundreds = Math.floor((num % 1000) / 100);
      explanationRule = `Chữ số hàng trăm là ${hundreds}, ${hundreds >= 5 ? 'lớn hơn hoặc bằng 5 nên làm tròn lên' : 'nhỏ hơn 5 nên làm tròn xuống'}.`;
    }

    const ans = rounded.toLocaleString('vi-VN');
    const distractors = [
      (rounded + 100).toLocaleString('vi-VN'),
      (rounded - 100).toLocaleString('vi-VN'),
      num.toLocaleString('vi-VN'),
      (rounded + 10).toLocaleString('vi-VN'),
    ];
    const opts = createOptions(ans, distractors);

    return {
      id: `round-${Date.now()}-${Math.random()}`,
      topicId: 'numbers_10000_100000',
      topicName: 'Số Trong Phạm Vi 100.000 & Phép Tính',
      difficulty,
      prompt: `Làm tròn số ${num.toLocaleString('vi-VN')} đến ${target} ta được số nào?`,
      options: opts.options,
      correctIndex: opts.correctIndex,
      explanation: `${explanationRule} Do đó số ${num.toLocaleString('vi-VN')} làm tròn đến ${target} là ${ans}.`,
      hint: `Quan sát chữ số ở hàng ngay sau hàng cần làm tròn để quyết định cộng thêm 1 hay giữ nguyên.`,
    };
  } else if (type === 3) {
    // Phép cộng số có 4-5 chữ số
    const a = randInt(12400, 48200);
    const b = randInt(11300, 39500);
    const ans = (a + b).toLocaleString('vi-VN');
    const distractors = [
      (a + b + 1000).toLocaleString('vi-VN'),
      (a + b - 100).toLocaleString('vi-VN'),
      (a + b + 100).toLocaleString('vi-VN'),
    ];
    const opts = createOptions(ans, distractors);

    return {
      id: `add-large-${Date.now()}-${Math.random()}`,
      topicId: 'numbers_10000_100000',
      topicName: 'Số Trong Phạm Vi 100.000 & Phép Tính',
      difficulty,
      prompt: `Tính kết quả: ${a.toLocaleString('vi-VN')} + ${b.toLocaleString('vi-VN')} = ?`,
      options: opts.options,
      correctIndex: opts.correctIndex,
      explanation: `Đặt tính dọc thẳng hàng rồi cộng từ phải sang trái: ${a.toLocaleString('vi-VN')} + ${b.toLocaleString('vi-VN')} = ${ans}.`,
      hint: `Cộng từ hàng đơn vị sang hàng chục, trăm, nghìn, chục nghìn. Nhớ số có nhớ!`,
    };
  } else {
    // Phép trừ số có 4-5 chữ số
    const a = randInt(35000, 85000);
    const b = randInt(12000, 34000);
    const ans = (a - b).toLocaleString('vi-VN');
    const distractors = [
      (a - b + 1000).toLocaleString('vi-VN'),
      (a - b - 1000).toLocaleString('vi-VN'),
      (a - b + 100).toLocaleString('vi-VN'),
    ];
    const opts = createOptions(ans, distractors);

    return {
      id: `sub-large-${Date.now()}-${Math.random()}`,
      topicId: 'numbers_10000_100000',
      topicName: 'Số Trong Phạm Vi 100.000 & Phép Tính',
      difficulty,
      prompt: `Tính kết quả: ${a.toLocaleString('vi-VN')} - ${b.toLocaleString('vi-VN')} = ?`,
      options: opts.options,
      correctIndex: opts.correctIndex,
      explanation: `Đặt tính dọc thẳng hàng rồi trừ từ phải sang trái: ${a.toLocaleString('vi-VN')} - ${b.toLocaleString('vi-VN')} = ${ans}.`,
      hint: `Nếu hàng nào không trừ được thì mượn 1 ở hàng liền kề bên trái nhé!`,
    };
  }
};

/**
 * TOPIC 3: Hình học & Đo lường (Chu vi, diện tích, góc vuông, tiền VN, đo lường)
 */
const generateGeometryMeasurement = (difficulty: 'easy' | 'medium' | 'hard'): Question => {
  const type = randInt(1, 5);

  if (type === 1) {
    // Chu vi hoặc diện tích hình chữ nhật
    const isArea = Math.random() > 0.5;
    const length = randInt(6, 15);
    const width = randInt(3, length - 1);

    if (isArea) {
      const ansVal = length * width;
      const ans = `${ansVal} cm²`;
      const distractors = [`${(length + width) * 2} cm²`, `${ansVal + 4} cm²`, `${length * (width + 1)} cm²`];
      const opts = createOptions(ans, distractors);

      return {
        id: `geo-rect-area-${Date.now()}-${Math.random()}`,
        topicId: 'geometry_measurement',
        topicName: 'Hình Học & Đo Lường (Chu vi, Diện tích)',
        difficulty,
        prompt: `Một hình chữ nhật có chiều dài ${length} cm và chiều rộng ${width} cm. Tính diện tích hình chữ nhật đó.`,
        visual: {
          type: 'geometry',
          geometry: {
            shape: 'rectangle',
            width: length,
            height: width,
            unit: 'cm',
            showAreaFormula: true,
          },
        },
        options: opts.options,
        correctIndex: opts.correctIndex,
        explanation: `Diện tích hình chữ nhật = Chiều dài × Chiều rộng: ${length} × ${width} = ${ansVal} cm².`,
        hint: `Quy tắc: Diện tích hình chữ nhật bằng chiều dài nhân với chiều rộng (cùng đơn vị đo).`,
      };
    } else {
      const ansVal = (length + width) * 2;
      const ans = `${ansVal} cm`;
      const distractors = [`${length * width} cm`, `${length + width} cm`, `${ansVal + 4} cm`];
      const opts = createOptions(ans, distractors);

      return {
        id: `geo-rect-perim-${Date.now()}-${Math.random()}`,
        topicId: 'geometry_measurement',
        topicName: 'Hình Học & Đo Lường (Chu vi, Diện tích)',
        difficulty,
        prompt: `Một mảnh vườn hình chữ nhật có chiều dài ${length} cm và chiều rộng ${width} cm. Chu vi của hình đó là:`,
        visual: {
          type: 'geometry',
          geometry: {
            shape: 'rectangle',
            width: length,
            height: width,
            unit: 'cm',
            showPerimeterFormula: true,
          },
        },
        options: opts.options,
        correctIndex: opts.correctIndex,
        explanation: `Chu vi hình chữ nhật = (Chiều dài + Chiều rộng) × 2: (${length} + ${width}) × 2 = ${ansVal} cm.`,
        hint: `Công thức tính chu vi hình chữ nhật: (dài + rộng) rồi nhân với 2.`,
      };
    }
  } else if (type === 2) {
    // Chu vi & diện tích hình vuông
    const side = randInt(4, 9);
    const isPerim = Math.random() > 0.5;

    if (isPerim) {
      const ansVal = side * 4;
      const ans = `${ansVal} cm`;
      const distractors = [`${side * side} cm`, `${side * 2} cm`, `${ansVal + 4} cm`];
      const opts = createOptions(ans, distractors);

      return {
        id: `geo-square-perim-${Date.now()}-${Math.random()}`,
        topicId: 'geometry_measurement',
        topicName: 'Hình Học & Đo Lường (Chu vi, Diện tích)',
        difficulty,
        prompt: `Một chiếc khăn tay hình vuông có cạnh dài ${side} cm. Chu vi chiếc khăn tay đó là:`,
        visual: {
          type: 'geometry',
          geometry: {
            shape: 'square',
            side: side,
            unit: 'cm',
          },
        },
        options: opts.options,
        correctIndex: opts.correctIndex,
        explanation: `Chu vi hình vuông = Độ dài một cạnh × 4: ${side} × 4 = ${ansVal} cm.`,
        hint: `Hình vuông có 4 cạnh bằng nhau, chu vi bằng cạnh nhân 4.`,
      };
    } else {
      const ansVal = side * side;
      const ans = `${ansVal} cm²`;
      const distractors = [`${side * 4} cm²`, `${ansVal + side} cm²`, `${(side + 1) * side} cm²`];
      const opts = createOptions(ans, distractors);

      return {
        id: `geo-square-area-${Date.now()}-${Math.random()}`,
        topicId: 'geometry_measurement',
        topicName: 'Hình Học & Đo Lường (Chu vi, Diện tích)',
        difficulty,
        prompt: `Tính diện tích hình vuông có cạnh bằng ${side} cm.`,
        visual: {
          type: 'geometry',
          geometry: {
            shape: 'square',
            side: side,
            unit: 'cm',
          },
        },
        options: opts.options,
        correctIndex: opts.correctIndex,
        explanation: `Diện tích hình vuông = Cạnh × Cạnh: ${side} × ${side} = ${ansVal} cm².`,
        hint: `Diện tích hình vuông bằng độ dài một cạnh nhân với chính nó.`,
      };
    }
  } else if (type === 3) {
    // Đổi đơn vị đo độ dài, khối lượng, thể tích
    const subType = randInt(1, 3);
    if (subType === 1) {
      // Độ dài: m, dm, cm, mm
      const m = randInt(2, 8);
      const dm = randInt(1, 9);
      const ansVal = m * 10 + dm;
      const ans = `${ansVal} dm`;
      const distractors = [`${m * 100 + dm} dm`, `${m + dm} dm`, `${ansVal + 10} dm`];
      const opts = createOptions(ans, distractors);

      return {
        id: `meas-len-${Date.now()}-${Math.random()}`,
        topicId: 'geometry_measurement',
        topicName: 'Hình Học & Đo Lường (Chu vi, Diện tích)',
        difficulty,
        prompt: `Điền số thích hợp vào chỗ trống: ${m} m ${dm} dm = ... dm?`,
        options: opts.options,
        correctIndex: opts.correctIndex,
        explanation: `Vì 1 m = 10 dm nên ${m} m = ${m * 10} dm. Vậy ${m} m ${dm} dm = ${m * 10} + ${dm} = ${ansVal} dm.`,
        hint: `Đổi ${m} mét ra đề-xi-mét (nhân 10) rồi cộng thêm ${dm} dm.`,
      };
    } else if (subType === 2) {
      // Khối lượng: kg và g
      const kg = randInt(2, 5);
      const g = randInt(150, 850);
      const ansVal = kg * 1000 + g;
      const ans = `${ansVal.toLocaleString('vi-VN')} g`;
      const distractors = [
        `${(kg * 100 + g).toLocaleString('vi-VN')} g`,
        `${(ansVal - 100).toLocaleString('vi-VN')} g`,
        `${(kg + g).toLocaleString('vi-VN')} g`,
      ];
      const opts = createOptions(ans, distractors);

      return {
        id: `meas-weight-${Date.now()}-${Math.random()}`,
        topicId: 'geometry_measurement',
        topicName: 'Hình Học & Đo Lường (Chu vi, Diện tích)',
        difficulty,
        prompt: `Đổi đơn vị đo: ${kg} kg ${g} g = ... g?`,
        options: opts.options,
        correctIndex: opts.correctIndex,
        explanation: `Vì 1 kg = 1000 g nên ${kg} kg = ${kg * 1000} g. Vậy ${kg} kg ${g} g = ${kg * 1000} + ${g} = ${ansVal.toLocaleString('vi-VN')} g.`,
        hint: `Nhớ rằng: 1 ki-lô-gam = 1.000 gam.`,
      };
    } else {
      // Dung tích: l và ml
      const l = randInt(2, 4);
      const ml = randInt(200, 600);
      const ansVal = l * 1000 - ml;
      const ans = `${ansVal.toLocaleString('vi-VN')} ml`;
      const distractors = [
        `${(ansVal + 100).toLocaleString('vi-VN')} ml`,
        `${(ansVal - 200).toLocaleString('vi-VN')} ml`,
        `${(l * 100 - ml).toLocaleString('vi-VN')} ml`,
      ];
      const opts = createOptions(ans, distractors);

      return {
        id: `meas-vol-${Date.now()}-${Math.random()}`,
        topicId: 'geometry_measurement',
        topicName: 'Hình Học & Đo Lường (Chu vi, Diện tích)',
        difficulty,
        prompt: `Một bình nước có ${l} l nước. Rót ra một ca ${ml} ml. Trong bình còn lại bao nhiêu mi-li-lít nước?`,
        options: opts.options,
        correctIndex: opts.correctIndex,
        explanation: `Đổi ${l} l = ${l * 1000} ml. Lượng nước còn lại trong bình là: ${l * 1000} - ${ml} = ${ansVal.toLocaleString('vi-VN')} ml.`,
        hint: `Đổi ${l} lít ra mi-li-lít trước khi làm phép trừ (1 l = 1000 ml).`,
      };
    }
  } else if (type === 4) {
    // Tiền Việt Nam
    const bill10k = randInt(1, 3);
    const bill20k = randInt(1, 2);
    const bill5k = randInt(1, 4);
    const total = bill10k * 10000 + bill20k * 20000 + bill5k * 5000;
    const ans = `${total.toLocaleString('vi-VN')} đồng`;
    const distractors = [
      `${(total + 10000).toLocaleString('vi-VN')} đồng`,
      `${(total - 5000).toLocaleString('vi-VN')} đồng`,
      `${(total + 5000).toLocaleString('vi-VN')} đồng`,
    ];
    const opts = createOptions(ans, distractors);

    return {
      id: `money-${Date.now()}-${Math.random()}`,
      topicId: 'geometry_measurement',
      topicName: 'Hình Học & Đo Lường (Chu vi, Diện tích)',
      difficulty,
      prompt: `Bạn Nam có ${bill10k} tờ 10.000 đồng, ${bill20k} tờ 20.000 đồng và ${bill5k} tờ 5.000 đồng. Hỏi bạn Nam có tất cả bao nhiêu tiền?`,
      visual: {
        type: 'money',
        money: {
          bills: [
            { value: 10000, count: bill10k },
            { value: 20000, count: bill20k },
            { value: 5000, count: bill5k },
          ],
        },
      },
      options: opts.options,
      correctIndex: opts.correctIndex,
      explanation: `Tính tổng: (${bill10k} × 10.000) + (${bill20k} × 20.000) + (${bill5k} × 5.000) = ${bill10k * 10000} + ${bill20k * 20000} + ${bill5k * 5000} = ${ans}.`,
      hint: `Tính số tiền của từng loại tờ tiền rồi cộng lại với nhau.`,
    };
  } else {
    // Góc vuông, điểm ở giữa, trung điểm
    return {
      id: `geo-midpoint-${Date.now()}-${Math.random()}`,
      topicId: 'geometry_measurement',
      topicName: 'Hình Học & Đo Lường (Chu vi, Diện tích)',
      difficulty,
      prompt: `Đoạn thẳng AB dài 18 cm. Điểm M là trung điểm của đoạn thẳng AB. Độ dài đoạn thẳng AM là:`,
      options: ['9 cm', '18 cm', '6 cm', '8 cm'],
      correctIndex: 0,
      explanation: `Vì M là trung điểm của AB nên M chia đoạn thẳng AB thành hai phần bằng nhau. Ta có: AM = 18 : 2 = 9 cm.`,
      hint: `Trung điểm chia đoạn thẳng thành 2 đoạn có độ dài bằng nhau (chia đôi cho 2).`,
    };
  }
};

/**
 * TOPIC 4: Thời gian, xem đồng hồ & xem lịch
 */
const generateTimeCalendar = (difficulty: 'easy' | 'medium' | 'hard'): Question => {
  const type = randInt(1, 3);

  if (type === 1) {
    // Xem đồng hồ kim (giờ hơn hoặc giờ kém)
    const hours = randInt(1, 12);
    // Use minute multiples of 5 for clear primary school clock readings
    const minuteMultiples = [10, 15, 20, 30, 40, 45, 50];
    const minutes = minuteMultiples[randInt(0, minuteMultiples.length - 1)];

    let ans = '';
    let distractors: string[] = [];

    if (minutes > 30 && Math.random() > 0.4) {
      // Giờ kém
      const nextHour = hours === 12 ? 1 : hours + 1;
      const diffMinutes = 60 - minutes;
      ans = `${nextHour} giờ kém ${diffMinutes} phút`;
      distractors = [
        `${hours} giờ ${minutes} phút`,
        `${hours} giờ kém ${diffMinutes} phút`,
        `${nextHour} giờ kém ${diffMinutes + 5} phút`,
      ];
    } else {
      ans = `${hours} giờ ${minutes} phút`;
      const wrongHour = hours === 12 ? 1 : hours + 1;
      distractors = [
        `${wrongHour} giờ ${minutes} phút`,
        `${hours} giờ ${minutes === 15 ? 45 : minutes === 45 ? 15 : minutes + 10} phút`,
        `${hours} giờ ${Math.max(5, minutes - 10)} phút`,
      ];
    }

    const opts = createOptions(ans, distractors);

    return {
      id: `clock-${Date.now()}-${Math.random()}`,
      topicId: 'time_calendar',
      topicName: 'Thời Gian & Xem Đồng Hồ, Xem Lịch',
      difficulty,
      prompt: 'Đồng hồ dưới đây đang chỉ mấy giờ?',
      visual: {
        type: 'clock',
        clock: {
          hours,
          minutes,
        },
      },
      options: opts.options,
      correctIndex: opts.correctIndex,
      explanation: `Kim ngắn chỉ qua số ${hours}, kim dài chỉ vào vạch ${minutes} phút. Vậy đồng hồ chỉ: ${ans}.`,
      hint: `Kim ngắn chỉ GIỜ, kim dài chỉ PHÚT. Mỗi khoảng cách giữa hai số là 5 phút.`,
    };
  } else if (type === 2) {
    // Số ngày trong các tháng
    const monthsWith31 = [1, 3, 5, 7, 8, 10, 12];
    const monthsWith30 = [4, 6, 9, 11];

    const pick31 = Math.random() > 0.5;
    if (pick31) {
      const month = monthsWith31[randInt(0, monthsWith31.length - 1)];
      const ans = '31 ngày';
      const opts = createOptions(ans, ['30 ngày', '28 ngày', '29 ngày']);
      return {
        id: `cal-31-${Date.now()}-${Math.random()}`,
        topicId: 'time_calendar',
        topicName: 'Thời Gian & Xem Đồng Hồ, Xem Lịch',
        difficulty,
        prompt: `Trong một năm, tháng ${month} có bao nhiêu ngày?`,
        options: opts.options,
        correctIndex: opts.correctIndex,
        explanation: `Các tháng có 31 ngày trong năm gồm: Tháng 1, 3, 5, 7, 8, 10, 12. Vậy tháng ${month} có 31 ngày.`,
        hint: `Bạn có thể dùng quy tắc đếm trên các khớp đốt ngón tay để nhớ các tháng có 31 ngày nhé!`,
      };
    } else {
      const month = monthsWith30[randInt(0, monthsWith30.length - 1)];
      const ans = '30 ngày';
      const opts = createOptions(ans, ['31 ngày', '28 ngày', '29 ngày']);
      return {
        id: `cal-30-${Date.now()}-${Math.random()}`,
        topicId: 'time_calendar',
        topicName: 'Thời Gian & Xem Đồng Hồ, Xem Lịch',
        difficulty,
        prompt: `Trong một năm, tháng ${month} có bao nhiêu ngày?`,
        options: opts.options,
        correctIndex: opts.correctIndex,
        explanation: `Các tháng có 30 ngày trong năm gồm: Tháng 4, 6, 9, 11. Vậy tháng ${month} có 30 ngày.`,
        hint: `Tháng 4, 6, 9 và 11 là các tháng có 30 ngày.`,
      };
    }
  } else {
    // Khoảng thời gian
    const startHour = randInt(7, 9);
    const startMin = 15;
    const duration = [30, 45, 60][randInt(0, 2)];
    const endTotalMin = startHour * 60 + startMin + duration;
    const endHour = Math.floor(endTotalMin / 60);
    const endMin = endTotalMin % 60;
    const endStr = `${endHour} giờ ${endMin === 0 ? 'đúng' : `${endMin} phút`}`;

    const ans = endStr;
    const distractors = [
      `${endHour} giờ ${endMin + 15} phút`,
      `${endHour + 1} giờ ${endMin} phút`,
      `${startHour} giờ ${startMin + 10} phút`,
    ];
    const opts = createOptions(ans, distractors);

    return {
      id: `time-elapsed-${Date.now()}-${Math.random()}`,
      topicId: 'time_calendar',
      topicName: 'Thời Gian & Xem Đồng Hồ, Xem Lịch',
      difficulty,
      prompt: `Tiết học Toán bắt đầu lúc ${startHour} giờ ${startMin} phút và kéo dài trong ${duration} phút. Hỏi tiết học kết thúc lúc mấy giờ?`,
      options: opts.options,
      correctIndex: opts.correctIndex,
      explanation: `Lấy thời gian bắt đầu cộng thêm thời lượng: ${startHour} giờ ${startMin} phút + ${duration} phút = ${ans}.`,
      hint: `Cộng số phút lại với nhau: ${startMin} + ${duration} = ${startMin + duration} phút.`,
    };
  }
};

/**
 * TOPIC 5: Toán có lời văn (Bài toán 2 bước tính)
 */
const generateWordProblems = (difficulty: 'easy' | 'medium' | 'hard'): Question => {
  const type = randInt(1, 3);

  if (type === 1) {
    // Bài toán rút về đơn vị
    const countA = randInt(3, 5);
    const unitPrice = [3000, 4000, 5000, 6000, 8000][randInt(0, 4)];
    const totalA = countA * unitPrice;
    const countB = randInt(6, 9);
    const totalB = countB * unitPrice;

    const ans = `${totalB.toLocaleString('vi-VN')} đồng`;
    const distractors = [
      `${(totalB + unitPrice).toLocaleString('vi-VN')} đồng`,
      `${(totalB - unitPrice).toLocaleString('vi-VN')} đồng`,
      `${(totalA * 2).toLocaleString('vi-VN')} đồng`,
    ];
    const opts = createOptions(ans, distractors);

    return {
      id: `wp-unit-${Date.now()}-${Math.random()}`,
      topicId: 'word_problems',
      topicName: 'Toán Có Lời Văn (Giải 2 Bước)',
      difficulty,
      prompt: `Mua ${countA} quyển vở cùng loại hết ${totalA.toLocaleString('vi-VN')} đồng. Hỏi mua ${countB} quyển vở như thế hết bao nhiêu tiền?`,
      options: opts.options,
      correctIndex: opts.correctIndex,
      explanation: `Bước 1 (Rút về đơn vị): Giá tiền 1 quyển vở là: ${totalA.toLocaleString('vi-VN')} : ${countA} = ${unitPrice.toLocaleString('vi-VN')} đồng.\nBước 2: Mua ${countB} quyển vở hết: ${unitPrice.toLocaleString('vi-VN')} × ${countB} = ${ans}.`,
      hint: `Bước 1: Tính giá của MỘT quyển vở trước, sau đó nhân với số lượng cần mua.`,
    };
  } else if (type === 2) {
    // Bài toán gấp lên nhiều lần rồi tính cả hai
    const valA = randInt(12, 28);
    const multiplier = randInt(3, 5);
    const valB = valA * multiplier;
    const total = valA + valB;

    const ans = `${total} bông hoa`;
    const distractors = [`${valB} bông hoa`, `${valA * 2} bông hoa`, `${total + 5} bông hoa`];
    const opts = createOptions(ans, distractors);

    return {
      id: `wp-scale-total-${Date.now()}-${Math.random()}`,
      topicId: 'word_problems',
      topicName: 'Toán Có Lời Văn (Giải 2 Bước)',
      difficulty,
      prompt: `Bạn Lan hái được ${valA} bông hoa. Bạn Mai hái được gấp ${multiplier} lần số hoa của Lan. Hỏi cả hai bạn hái được tất cả bao nhiêu bông hoa?`,
      options: opts.options,
      correctIndex: opts.correctIndex,
      explanation: `Bước 1: Số hoa của bạn Mai là: ${valA} × ${multiplier} = ${valB} (bông hoa).\nBước 2: Cả hai bạn hái được: ${valA} + ${valB} = ${total} (bông hoa).`,
      hint: `Đừng quên bài toán hỏi CẢ HAI BẠN, nên phải tìm số hoa của Mai rồi cộng với hoa của Lan nhé!`,
    };
  } else {
    // Bài toán chia đều rồi bớt/thêm
    const boxes = randInt(4, 6);
    const itemsPerBox = randInt(8, 15);
    const totalItems = boxes * itemsPerBox;
    const givenAway = randInt(5, 12);
    const remaining = totalItems - givenAway;

    const ans = `${remaining} viên kẹo`;
    const distractors = [`${totalItems} viên kẹo`, `${remaining + 5} viên kẹo`, `${totalItems - itemsPerBox} viên kẹo`];
    const opts = createOptions(ans, distractors);

    return {
      id: `wp-box-minus-${Date.now()}-${Math.random()}`,
      topicId: 'word_problems',
      topicName: 'Toán Có Lời Văn (Giải 2 Bước)',
      difficulty,
      prompt: `Mẹ có ${boxes} hộp kẹo, mỗi hộp có ${itemsPerBox} viên kẹo. Mẹ cho các bạn ${givenAway} viên kẹo. Hỏi mẹ còn lại bao nhiêu viên kẹo?`,
      options: opts.options,
      correctIndex: opts.correctIndex,
      explanation: `Bước 1: Tổng số kẹo mẹ có là: ${boxes} × ${itemsPerBox} = ${totalItems} (viên kẹo).\nBước 2: Số kẹo còn lại là: ${totalItems} - ${givenAway} = ${remaining} (viên kẹo).`,
      hint: `Bước 1: Tính tổng số kẹo trong cả ${boxes} hộp. Bước 2: Trừ đi số kẹo đã cho.`,
    };
  }
};

/**
 * TOPIC 6: Thống kê, biểu đồ & khả năng xảy ra
 */
const generateStatisticsProbability = (difficulty: 'easy' | 'medium' | 'hard'): Question => {
  const type = randInt(1, 2);

  if (type === 1) {
    // Đọc bảng thống kê
    const students = [
      { name: 'Tổ 1', books: randInt(18, 30) },
      { name: 'Tổ 2', books: randInt(18, 30) },
      { name: 'Tổ 3', books: randInt(18, 30) },
      { name: 'Tổ 4', books: randInt(18, 30) },
    ];
    // Ensure one has distinct max
    students[2].books = Math.max(...students.map((s) => s.books)) + randInt(3, 8);

    const maxGroup = students.reduce((prev, current) => (prev.books > current.books ? prev : current));

    const ans = maxGroup.name;
    const distractors = students.filter((s) => s.name !== maxGroup.name).map((s) => s.name);
    const opts = createOptions(ans, distractors);

    return {
      id: `stat-table-${Date.now()}-${Math.random()}`,
      topicId: 'statistics_probability',
      topicName: 'Thống Kê, Biểu Đồ & Khả Năng Xảy Ra',
      difficulty,
      prompt: 'Dựa vào bảng số liệu về số quyển sách các tổ quyên góp được dưới đây, tổ nào quyên góp được nhiều sách nhất?',
      visual: {
        type: 'pictograph',
        tableData: {
          headers: ['Tên tổ', 'Số quyển sách'],
          rows: students.map((s) => [s.name, `${s.books} quyển`]),
        },
      },
      options: opts.options,
      correctIndex: opts.correctIndex,
      explanation: `So sánh số sách: ${students.map((s) => `${s.name}: ${s.books}`).join(', ')}. Số lớn nhất là ${maxGroup.books} quyển của ${maxGroup.name}.`,
      hint: `Quan sát cột số quyển sách và tìm số lớn nhất.`,
    };
  } else {
    // Khả năng xảy ra của một sự kiện: "Chắc chắn", "Có thể", "Không thể"
    const subType = randInt(1, 3);
    let prompt = '';
    let ans = '';
    let explanation = '';

    if (subType === 1) {
      prompt = 'Trong hộp chỉ có 5 viên bi màu đỏ. Nếu nhắm mắt lấy ra 1 viên bi thì sự kiện "Lấy được viên bi màu đỏ" là:';
      ans = 'Chắc chắn';
      explanation = 'Vì trong hộp chỉ toàn bi màu đỏ nên khi lấy ra 1 viên bi chắc chắn sẽ là bi màu đỏ.';
    } else if (subType === 2) {
      prompt = 'Gieo một con xúc xắc 6 mặt (các mặt ghi số từ 1 đến 6). Sự kiện "Xuất hiện mặt có 8 chấm" là:';
      ans = 'Không thể';
      explanation = 'Vì con xúc xắc chỉ có các mặt từ 1 đến 6 chấm, không có mặt nào 8 chấm nên sự kiện này không thể xảy ra.';
    } else {
      prompt = 'Trong túi có 3 viên kẹo màu xanh và 4 viên kẹo màu vàng. Lấy ngẫu nhiên 1 viên kẹo. Sự kiện "Lấy được kẹo màu xanh" là:';
      ans = 'Có thể';
      explanation = 'Vì trong túi có cả kẹo xanh và kẹo vàng nên ta có thể lấy được kẹo màu xanh hoặc kẹo màu vàng.';
    }

    const opts = createOptions(ans, ['Chắc chắn', 'Có thể', 'Không thể']);

    return {
      id: `prob-event-${Date.now()}-${Math.random()}`,
      topicId: 'statistics_probability',
      topicName: 'Thống Kê, Biểu Đồ & Khả Năng Xảy Ra',
      difficulty,
      prompt,
      options: opts.options,
      correctIndex: opts.correctIndex,
      explanation,
      hint: `Xem xét điều kiện trong đề bài: có xảy ra 100% không, hay chỉ là ngẫu nhiên, hay hoàn toàn không thể có?`,
    };
  }
};

/**
 * Main Question Generator function
 */
export const generateQuestion = (topicId: TopicId = 'all', difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Question => {
  let targetTopic = topicId;

  if (targetTopic === 'all') {
    const topicPool: TopicId[] = [
      'multiplication_division',
      'numbers_10000_100000',
      'geometry_measurement',
      'time_calendar',
      'word_problems',
      'statistics_probability',
    ];
    targetTopic = topicPool[randInt(0, topicPool.length - 1)];
  }

  switch (targetTopic) {
    case 'multiplication_division':
      return generateMultiplicationDivision(difficulty);
    case 'numbers_10000_100000':
      return generateNumbers10000To100000(difficulty);
    case 'geometry_measurement':
      return generateGeometryMeasurement(difficulty);
    case 'time_calendar':
      return generateTimeCalendar(difficulty);
    case 'word_problems':
      return generateWordProblems(difficulty);
    case 'statistics_probability':
      return generateStatisticsProbability(difficulty);
    default:
      return generateMultiplicationDivision(difficulty);
  }
};

/**
 * Generate a full game round of N unique questions
 */
export const generateGameRound = (count: number = 10, topicId: TopicId = 'all', difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Question[] => {
  const list: Question[] = [];
  for (let i = 0; i < count; i++) {
    list.push(generateQuestion(topicId, difficulty));
  }
  return list;
};
