const colorCodes = [
    { name: "검정", value: 0, hex: "#000000" },
    { name: "갈색", value: 1, hex: "#8B4513" },
    { name: "빨강", value: 2, hex: "#FF0000" },
    { name: "주황", value: 3, hex: "#FFA500" },
    { name: "노랑", value: 4, hex: "#FFFF00" },
    { name: "초록", value: 5, hex: "#008000" },
    { name: "파랑", value: 6, hex: "#0000FF" },
    { name: "보라", value: 7, hex: "#782dad" },
    { name: "회색", value: 8, hex: "#808080" },
    { name: "흰색", value: 9, hex: "#FFFFFF" }
];

// 2. 문제 유형 정의
const quizTypes = [
    {
        id: "total_I",
        text: "회로 전체에 흐르는 전류(I)는 몇 A인가요?",
        unit: "A",
        getAnswer: (data) => data.v / data.rt
    },
    {
        id: "total_R",
        text: "회로의 전체 합성 저항(R)은 몇 Ω인가요?",
        unit: "Ω",
        getAnswer: (data) => data.rt
    },
    {
        id: "color_code",
        text: "그림에 표시된 4줄 색띠 저항의 값은 몇 Ω인가요?",
        unit: "Ω",
        getAnswer: (data) => data.colorVal
    },
    {
        id: "kirchhoff_v",
        text: "키르히호프 전압 법칙: 빈칸에 들어갈 전압(V)은?",
        unit: "V",
        getAnswer: (data) => data.kvlAns
    },
    {
        id: "kirchhoff_i",
        text: "키르히호프 전류 법칙: 물음표 방향으로 흐르는 전류(I)는?",
        unit: "A",
        getAnswer: (data) => data.kclAns
    }
];

// 3. 전역 상태 변수
const canvas = document.getElementById('quizCanvas');
const ctx = canvas.getContext('2d');
let currentQuiz = {};
let score = 0;
let highScore = localStorage.getItem('circuitHighScore') || 0;

document.getElementById('highScore').innerText = highScore;

// 합성 저항 계산
function calcRT(r1, r2, r3, mode) {
    if (mode === "직렬") return r1 + r2;
    if (mode === "병렬") return (r1 * r2) / (r1 + r2);
    if (mode === "혼합") return r1 + (r2 * r3) / (r2 + r3);
    return 0;
}

/**
 * 메인 문제 생성 엔진
 */
function generateQuiz() {
    const modes = ["직렬", "병렬", "혼합", "색띠", "키르히호프"];
    const mode = modes[Math.floor(Math.random() * modes.length)];
    
    // 랜덤 수치 세팅
    const v = (Math.floor(Math.random() * 5) + 1) * 10;
    const r1 = (Math.floor(Math.random() * 5) + 1) * 2;
    const r2 = (Math.floor(Math.random() * 5) + 1) * 2;
    const r3 = (Math.floor(Math.random() * 5) + 1) * 2;
    const rt = calcRT(r1, r2, r3, mode);

    const d1 = Math.floor(Math.random() * 9) + 1;
    const d2 = Math.floor(Math.random() * 10);
    const mult = Math.floor(Math.random() * 4);
    const colorVal = (d1 * 10 + d2) * Math.pow(10, mult);

    // 키르히호프용 수치
    const kclTotal = (Math.floor(Math.random() * 10) + 5);
    const kclIn = Math.floor(kclTotal * 0.6);
    const kvlTotal = v;
    const kvl1 = v * 0.3;

    let type;
    let explanation = "";

    // 모드 판정 및 해설 생성
    if (mode === "색띠") {
        type = quizTypes.find(t => t.id === "color_code");
        explanation = `색띠 읽기: (${d1}nd digit ${d1}, ${d2}nd digit ${d2}) × 10^${mult} = ${colorVal}Ω 입니다.`;
    } else if (mode === "키르히호프") {
        const isV = Math.random() > 0.5;
        type = quizTypes.find(t => t.id === (isV ? "kirchhoff_v" : "kirchhoff_i"));
        explanation = isV 
            ? `KVL에 의해 전체 ${kvlTotal}V = V1(${kvl1.toFixed(1)}V) + V2입니다. 따라서 V2 = ${(kvlTotal - kvl1).toFixed(2)}V입니다.`
            : `KCL에 의해 들어온 전류 ${kclTotal}A = 나간 전류1(${kclIn}A) + 나간 전류2입니다. 따라서 ${kclTotal - kclIn}A입니다.`;
    } else {
        type = quizTypes.filter(t => !t.id.includes("color") && !t.id.includes("kirchhoff"))[Math.floor(Math.random() * 2)];
        
        // 저항 계산 해설
        let rtExp = "";
        if (mode === "직렬") rtExp = `합성저항 R = R1+R2 = ${r1}+${r2} = ${rt}Ω`;
        else if (mode === "병렬") rtExp = `합성저항 R = (R1*R2)/(R1+R2) = ${(r1*r2)}/${(r1+r2)} = ${rt.toFixed(2)}Ω`;
        else if (mode === "혼합") rtExp = `합성저항 R = R1+(R2//R3) = ${r1}+${(rt-r1).toFixed(2)} = ${rt.toFixed(2)}Ω`;

        if (type.id === "total_I") {
            explanation = `${rtExp} 이고, 전체 전류 I = V/R = ${v}/${rt.toFixed(2)} = ${(v/rt).toFixed(2)}A 입니다.`;
        } else {
            explanation = `${rtExp} 입니다.`;
        }
    }

    currentQuiz = {
        answer: type.getAnswer({v, rt, r1, r2, r3, colorVal, kclAns: kclTotal - kclIn, kvlAns: kvlTotal - kvl1}).toFixed(2),
        unit: type.unit,
        explanation: explanation
    };

    // UI 업데이트
    document.getElementById('modeBadge').innerText = `모드: ${mode} 문제`;
    document.getElementById('questionArea').innerText = type.text;
    if (mode === "키르히호프") {
        const detail = type.id === "kirchhoff_v" 
            ? `전체 ${kvlTotal}V 중 저항1에 ${kvl1.toFixed(1)}V가 걸립니다.` 
            : `노드로 ${kclTotal}A가 들어오고, 한쪽으로 ${kclIn}A가 나갑니다.`;
        document.getElementById('questionArea').innerText += ` (${detail})`;
    }
    document.getElementById('unitText').innerText = type.unit;
    document.getElementById('feedback').innerText = "";
    document.getElementById('userAnswer').value = "";
    
    const helpBox = document.getElementById('colorHelp');
    if(helpBox) helpBox.style.display = (mode === "색띠") ? "block" : "none";

    // 그리기 분기
    if (mode === "색띠") drawColorResistor(d1, d2, mult);
    else if (mode === "키르히호프") drawKirchhoff(type.id === "kirchhoff_i");
    else drawCircuit(v, r1, r2, r3, mode);
}

/**
 * 시각화 함수들
 */
function drawKirchhoff(isKCL) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#333"; ctx.lineWidth = 3;
    ctx.font = "14px Arial"; ctx.fillStyle = "#333";
    if(isKCL) {
        ctx.beginPath(); ctx.arc(300, 150, 8, 0, Math.PI*2); ctx.fill(); 
        drawArrow(150, 150, 280, 150, "In");
        drawArrow(320, 130, 450, 80, "Out 1");
        drawArrow(320, 170, 450, 220, "?");
    } else {
        ctx.strokeRect(150, 80, 300, 140);
        ctx.fillText("V_total (Source)", 130, 150);
        ctx.fillText("V1 (Drop)", 300, 70);
        ctx.fillText("V2 (?)", 300, 240);
        ctx.beginPath(); ctx.arc(300, 150, 20, 0, Math.PI*1.5); ctx.stroke();
    }
}

function drawArrow(x1, y1, x2, y2, label) {
    const head = 15;
    const angle = Math.atan2(y2-y1, x2-x1);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.lineTo(x2-head*Math.cos(angle-Math.PI/6), y2-head*Math.sin(angle-Math.PI/6));
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2-head*Math.cos(angle+Math.PI/6), y2-head*Math.sin(angle+Math.PI/6));
    ctx.stroke();
    ctx.fillText(label, (x1+x2)/2, (y1+y2)/2 - 10);
}

function drawCircuit(v, r1, r2, r3, mode) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#333"; ctx.lineWidth = 3;
    ctx.font = "bold 15px sans-serif"; ctx.textAlign = "center";
    if (mode === "직렬") {
        ctx.strokeRect(120, 100, 360, 120);
        drawResistorBox(220, 100, `R1:${r1}Ω`);
        drawResistorBox(380, 100, `R2:${r2}Ω`);
    } else if (mode === "병렬") {
        ctx.strokeRect(120, 100, 180, 120);
        ctx.beginPath(); ctx.moveTo(300, 100); ctx.lineTo(450, 100); ctx.lineTo(450, 220); ctx.lineTo(300, 220); ctx.stroke();
        drawResistorBox(300, 135, `R1:${r1}Ω`, true);
        drawResistorBox(450, 135, `R2:${r2}Ω`, true);
    } else if (mode === "혼합") {
        ctx.beginPath(); ctx.moveTo(120, 160); ctx.lineTo(120, 100); ctx.lineTo(240, 100);
        ctx.moveTo(300, 100); ctx.lineTo(380, 100); ctx.stroke();
        ctx.strokeRect(380, 60, 140, 80); 
        ctx.beginPath(); ctx.moveTo(380, 140); ctx.lineTo(380, 220); ctx.lineTo(120, 220); ctx.lineTo(120, 160); ctx.stroke();
        drawResistorBox(240, 100, `R1:${r1}Ω`);
        drawResistorBox(450, 60, `R2:${r2}Ω`, true);
        drawResistorBox(450, 140, `R3:${r3}Ω`, true);
    }
    ctx.fillStyle = "white"; ctx.fillRect(105, 140, 30, 40); ctx.strokeRect(105, 140, 30, 40);
    ctx.fillStyle = "#e63946"; ctx.fillText(`${v}V`, 85, 165);
}

function drawColorResistor(d1, d2, mult) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#d2b48c"; ctx.beginPath(); ctx.roundRect(150, 120, 300, 60, 20); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(50, 150); ctx.lineTo(150, 150); ctx.moveTo(450, 150); ctx.lineTo(550, 150); ctx.stroke();
    const bands = [colorCodes[d1].hex, colorCodes[d2].hex, colorCodes[mult].hex, "#DAA520"];
    bands.forEach((color, i) => {
        ctx.fillStyle = color; ctx.fillRect(190 + (i * 60), 120, 25, 60); ctx.strokeRect(190 + (i * 60), 120, 25, 60);
    });
}

function drawResistorBox(x, y, label, vertical=false) {
    ctx.fillStyle = "white";
    if(vertical) {
        ctx.fillRect(x-15, y, 30, 50); ctx.strokeRect(x-15, y, 30, 50);
        ctx.fillStyle = "#1d3557"; ctx.fillText(label, x+45, y+30);
    } else {
        ctx.fillRect(x, y-15, 60, 30); ctx.strokeRect(x, y-15, 60, 30);
        ctx.fillStyle = "#1d3557"; ctx.fillText(label, x+30, y-25);
    }
}

/**
 * 정답 확인 로직 (해설 출력 추가)
 */
function checkAnswer() {
    let userInput = document.getElementById('userAnswer').value.trim();
    const feedback = document.getElementById('feedback');
    const scoreDisplay = document.getElementById('currentScore');
    const highDisplay = document.getElementById('highScore');

    if (!userInput) return;

    let calculatedVal;
    try {
        calculatedVal = Function(`return (${userInput})`)();
    } catch (e) {
        feedback.innerHTML = "수식을 확인해주세요. (예: 20/12)";
        feedback.className = "error";
        return;
    }

    // 오차범위 0.05 내외 정답 처리
    if (Math.abs(calculatedVal - currentQuiz.answer) < 0.05) {
        feedback.innerHTML = `정답입니다! (${currentQuiz.answer}${currentQuiz.unit})`;
        feedback.className = "success";
        score++;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('circuitHighScore', highScore);
            highDisplay.innerText = highScore;
        }
    } else {
        // 오답일 때 해설 포함
        feedback.innerHTML = `틀렸습니다! 정답: <b>${currentQuiz.answer}${currentQuiz.unit}</b><br>` + 
                             `<div style="font-size: 0.9em; margin-top: 5px; color: #555;">💡 해설: ${currentQuiz.explanation}</div>`;
        feedback.className = "error";
        score = 0;
    }
    scoreDisplay.innerText = score;
}

// 초기 실행
generateQuiz();