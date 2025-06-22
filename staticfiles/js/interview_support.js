// ドキュメントの読み込み
const video = document.getElementById("camera");
const canvas = document.getElementById("canvas");
const cameraArea = document.getElementById("cameraArea");
const ctx = canvas.getContext("2d");
const smileIcon = document.getElementById("smileIcon");
const volumeIcon = document.getElementById("volumeIcon");
const savePoseBtn = document.getElementById("savePoseBtn");
const postureMessage = document.getElementById("postureMessage");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const actionBtn = document.getElementById('actionBtn');
const dialogBtn = document.getElementById('dialogBtn'); 
const question = document.getElementById('question');
const feedback = document.getElementById('feedback');
const transcript = document.getElementById('transcript');

// パラメータの初期化
let referenceLandmarks = null;
let audioContext;
let mediaStreamSource;
let meter;
let stream = null;
let faceAnalysisInterval = null;
const postureThreshold = 20000; // 姿勢のしきい値
let recognition;
let step = 'question'; // question, recording, feedback, reading_feedback, reading_question, dialog, dialog_recording
let questionText = "";
let tempTranscript = "";
let currentAnswer = ""; // 現在の回答を保存
let dialogHistory = []; // 対話履歴を保存

// カメラの初期化
async function startCamera() {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    video.srcObject = stream;

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    mediaStreamSource = audioContext.createMediaStreamSource(stream);
    meter = createAudioMeter(audioContext);
    mediaStreamSource.connect(meter);
}

// サイズの初期化
function setVideoAndCanvasSize() {
    const width = video.videoWidth;
    const height = video.videoHeight;
    video.width = width;
    video.height = height;
    canvas.width = width;
    canvas.height = height;
}

// カメラの停止
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        stream = null;
    }

    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }

    if (meter && meter.shutdown) {
        meter.shutdown();
        meter = null;
    }

    if (faceAnalysisInterval) {
        clearInterval(faceAnalysisInterval);
        faceAnalysisInterval = null;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    volumeIcon.style.bottom = "0px";
    smileIcon.style.bottom = "0px";
    postureMessage.textContent = "";
    cameraArea.style.border = "none";
}

// 音声メーターの作成
function createAudioMeter(audioContext, clipLevel = 0.98, averaging = 0.95, clipLag = 750) {
    const processor = audioContext.createScriptProcessor(512);
    processor.onaudioprocess = volumeAudioProcess;
    processor.clipping = false;
    processor.lastClip = 0;
    processor.volume = 0;
    processor.clipLevel = clipLevel;
    processor.averaging = averaging;
    processor.clipLag = clipLag;
    processor.connect(audioContext.destination);

    processor.checkClipping = function () {
        if (!this.clipping) return false;
        if ((this.lastClip + this.clipLag) < window.performance.now()) {
            this.clipping = false;
        }
        return this.clipping;
    };

    processor.shutdown = function () {
        this.disconnect();
        this.onaudioprocess = null;
    };

    return processor;
}

// 音声メーターの処理
function volumeAudioProcess(event) {
    const buf = event.inputBuffer.getChannelData(0);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) {
        const x = buf[i];
        if (Math.abs(x) >= this.clipLevel) {
            this.clipping = true;
            this.lastClip = window.performance.now();
        }
        sum += x * x;
    }
    const rms = Math.sqrt(sum / buf.length);
    this.volume = Math.max(rms, this.volume * this.averaging);

    volumeIcon.style.bottom = (this.volume * 1800) + "px";
}

// 顔認識の処理
async function startFaceAnalysis() {
    const modelPath = window.MODEL_PATH || "/static/models/";
    await faceapi.nets.tinyFaceDetector.loadFromUri(modelPath);
    await faceapi.nets.faceExpressionNet.loadFromUri(modelPath);
    await faceapi.nets.faceLandmark68TinyNet.loadFromUri(modelPath);

    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    faceAnalysisInterval = setInterval(async () => {
        const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks(new faceapi.FaceLandmark68TinyNet())
            .withFaceExpressions();

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detection) {
            const resized = faceapi.resizeResults(detection, displaySize);
            // === 左右反転開始 ===
            ctx.save();
            ctx.scale(-1, 1);
            ctx.translate(-canvas.width, 0);

            // ランドマーク描画
            faceapi.draw.drawFaceLandmarks(canvas, resized);

            // === 左右反転終了 ===
            ctx.restore();

            const happyScore = resized.expressions.happy;
            smileIcon.style.bottom = (happyScore * 440) + "px";

            if (referenceLandmarks) {
                const current = resized.landmarks.positions;
                let diff = 0;
                for (let i = 0; i < current.length; i++) {
                    const dx = current[i].x - referenceLandmarks[i].x;
                    const dy = current[i].y - referenceLandmarks[i].y;
                    diff += dx * dx + dy * dy;
                }
                const isGoodPosture = diff < postureThreshold;
                cameraArea.style.border = isGoodPosture ? "4px solid green" : "4px solid red";
                postureMessage.textContent = isGoodPosture ? "✔️ 正しい姿勢です" : "⚠️ 姿勢が崩れています";
                postureMessage.style.color = isGoodPosture ? "green" : "red";
            }
        }
    }, 300);
}

// 姿勢保存ボタンの処理
savePoseBtn.addEventListener("click", async () => {
    const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks(new faceapi.FaceLandmark68TinyNet());
    if (detection) {
        referenceLandmarks = detection.landmarks.positions;
        Swal.fire({
            text: "正しい姿勢を保存しました！",
            timer: 3000,
            showConfirmButton: false,
            position: 'top',
            toast: true,
            icon: 'success',
            width: '30%'
        });
    } else {
        Swal.fire({
            text: "顔が検出できませんでした。",
            timer: 3000,
            showConfirmButton: false,
            position: 'top',
            toast: true,
            icon: 'error',
            width: '30%'
        });
    }
});

// スタートボタンの処理
startBtn.addEventListener("click", async () => {
    stopBtn.style.display = "block";
    startBtn.style.display = "none";
    savePoseBtn.style.display = "inline-block";
    actionBtn.style.display = "inline-block";
    dialogBtn.style.display = "none"; // 初期は非表示
    step = 'question'; // ステップを質問に戻す
    actionBtn.innerText = '▶ 質問＆録音開始';
    actionBtn.classList.remove('btn-outline-danger', 'btn-outline-dark');
    actionBtn.classList.add('btn-outline-success');
    actionBtn.disabled = false; // ボタンを有効化

    // 履歴をリセット
    dialogHistory = [];
    currentAnswer = "";

    await startCamera();
    // ビデオがロードされてからサイズ設定
    video.addEventListener('loadedmetadata', () => {
        setVideoAndCanvasSize();
        startFaceAnalysis(); // 顔検出はここでスタート
    });
});

// 録音処理
function startRecording() {
    recognition = new webkitSpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.continuous = true;
    recognition.interimResults = false;

    // 録音中の処理
    recognition.onresult = (event) => {
        if (step !== 'recording' && step !== 'dialog_recording') return;
        const result = event.results[event.results.length - 1][0].transcript;
        tempTranscript += result;
        transcript.textContent = `${tempTranscript}`;
    };

    // 録音終了時の処理
    recognition.onend = () => {
        if (step === 'recording') {
            // 録音中にonendになったらフィードバックモードへ
            step = 'feedback';
            actionBtn.innerText = '講評中…';
            actionBtn.classList.remove('btn-outline-danger', 'btn-outline-success');
            actionBtn.classList.add('btn-outline-dark');
            actionBtn.disabled = true; // 講評中はボタン無効
        } else if (step === 'dialog_recording') {
            // 対話モードの録音終了
            step = 'dialog';
            actionBtn.innerText = '回答中…';
            actionBtn.classList.remove('btn-outline-danger', 'btn-outline-success');
            actionBtn.classList.add('btn-outline-dark');
            actionBtn.disabled = true;
        }
    };

    recognition.start();
}

// 質問取得と音声読み上げ、録音開始
function fetchQuestionAndSpeakThenRecord() {
    const companySelectElement = document.getElementById('companySelect');
    const selectedCompanyId = companySelectElement ? companySelectElement.value : null;

    fetch(`/support/get-question/?company_id=${encodeURIComponent(selectedCompanyId ?? '')}`)
        .then(res => res.json())
        .then(data => {
            questionText = data.question;
            question.textContent = questionText.replace('質問：', '');

            const synth = window.speechSynthesis;
            const utter = new SpeechSynthesisUtterance(questionText.replace('質問：', ''));
            utter.lang = 'ja-JP';

            utter.onend = () => {
                if (step === 'reading_question') {
                    startRecording();
                    step = 'recording';
                    actionBtn.innerText = '⏹ 録音停止';
                    actionBtn.classList.remove('btn-outline-success', 'btn-outline-dark');
                    actionBtn.classList.add('btn-outline-danger');
                    actionBtn.disabled = false; // 質問読み上げ後にボタン有効
                }
            };

            synth.speak(utter);
        });
}

// 対話用の深掘り質問取得
async function getDialogQuestion(userAnswer) {
    try {
        const res = await fetch('/support/get-dialog-question/', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: new URLSearchParams({
                original_question: questionText,
                user_answer: userAnswer,
                dialog_history: JSON.stringify(dialogHistory)
            })
        });

        const data = await res.json();
        return data.question;
    } catch (error) {
        console.error('対話質問の取得に失敗:', error);
        return "もう少し詳しく教えてください。";
    }
}

// 音声読み上げ
function speakText(text) {
    const synth = window.speechSynthesis;
    synth.cancel(); // 保険で読み上げ停止
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'ja-JP';

    utter.onend = () => {
        if (step === 'reading_feedback') {
            // フィードバック読み上げ後は対話モードと次の質問を選択可能に
            step = 'dialog';
            dialogBtn.style.display = "inline-block"; // 対話ボタンを表示

            dialogBtn.innerText = '💬 深掘り質問';
            dialogBtn.classList.remove('btn-outline-danger', 'btn-outline-dark');
            dialogBtn.classList.add('btn-outline-primary');
            dialogBtn.disabled = false;

            actionBtn.innerText = '▶ 次の質問';
            actionBtn.classList.remove('btn-outline-dark', 'btn-outline-danger');
            actionBtn.classList.add('btn-outline-success');
            actionBtn.disabled = false;

            // 初回の回答を保存
            currentAnswer = tempTranscript;
            dialogHistory.push({
                question: questionText,
                answer: currentAnswer
            });

        } else if (step === 'reading_dialog') {
            // 対話質問読み上げ後は録音開始
            startRecording();
            step = 'dialog_recording';
            dialogBtn.innerText = '⏹ 録音停止';
            dialogBtn.classList.remove('btn-outline-primary', 'btn-outline-dark');
            dialogBtn.classList.add('btn-outline-danger');
            dialogBtn.disabled = false;
            actionBtn.disabled = true; // 録音中は次の質問ボタンを無効化
        }
    };

    synth.speak(utter);
}

// ストップボタンの処理
stopBtn.addEventListener("click", () => {
    stopBtn.style.display = "none";
    startBtn.style.display = "block";
    savePoseBtn.style.display = "none";
    actionBtn.style.display = "none";
    dialogBtn.style.display = "none"; // 対話ボタンも非表示
    window.speechSynthesis.cancel(); // 読み上げをキャンセル
    question.textContent = "";
    feedback.textContent = "";
    transcript.textContent = "";

    // 対話履歴もリセット
    dialogHistory = [];
    currentAnswer = "";

    stopCamera();
});

// インタビュー履歴保存（既存機能を再利用）
function saveInterviewHistory(questionText, answerText, feedbackText) {
    if (isLogin == "true") {
        fetch('/support/interview_history_save/', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: new URLSearchParams({
                question: questionText,
                answer: answerText,
                feedback: feedbackText
            })
        }).then(res => res.json()).then(data => {
            if (data.success) {
                console.log("インタビューが保存されました");
            } else {
                console.error("インタビューの保存に失敗しました");
                console.error(data.error);
            }
        });
    }
}

// アクションボタンの処理
actionBtn.addEventListener('click', async () => {
    if (step === 'question') {
        question.textContent = "";
        feedback.textContent = "";
        transcript.textContent = "";
        fetchQuestionAndSpeakThenRecord();
        step = 'reading_question'; // 質問読み上げ中にステップ変更
        actionBtn.innerText = '質問中…';
        actionBtn.disabled = true; // 読み上げ中はボタン無効

    } else if (step === 'recording') {
        // 録音停止ボタンが押された時
        recognition.stop(); // 録音停止
        step = 'feedback';
        actionBtn.innerText = '講評中…';
        actionBtn.classList.remove('btn-outline-danger', 'btn-outline-success');
        actionBtn.classList.add('btn-outline-dark');
        actionBtn.disabled = true; // 講評中もボタン無効

        // 講評取得処理
        const res = await fetch('/support/get-feedback/', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: new URLSearchParams({
                text: tempTranscript,
                question: questionText
            })
        });

        const data = await res.json();
        const feedbackText = `${data.feedback}`;
        feedback.textContent = feedbackText;
        speakText(data.feedback); // 講評を読み上げる
        step = 'reading_feedback'; // 講評読み上げ中にステップ変更

        // 従来の保存機能を維持
        saveInterviewHistory(
            questionText.replace('質問：', ''),
            tempTranscript,
            feedbackText
        );

        // リセット
        tempTranscript = "";

    } else if (step === 'dialog') {
        // 次の質問に移行
        step = 'question';
        dialogBtn.style.display = "none"; // 対話ボタンを非表示

        actionBtn.innerText = '▶ 次の質問';
        actionBtn.classList.remove('btn-outline-primary', 'btn-outline-danger', 'btn-outline-dark');
        actionBtn.classList.add('btn-outline-success');
        actionBtn.disabled = false;

        // 対話履歴をリセット
        dialogHistory = [];
        currentAnswer = "";
        question.textContent = "";
        feedback.textContent = "";
        transcript.textContent = "";
    }
});

// 対話モードボタンの処理
dialogBtn.addEventListener('click', async () => {
    if (step === 'dialog') {
        // 対話モード：深掘り質問を開始
        const dialogQuestion = await getDialogQuestion(currentAnswer);
        question.textContent = dialogQuestion;
        transcript.textContent = "";

        // 深掘り質問を読み上げ
        dialogBtn.innerText = '質問中…';
        dialogBtn.disabled = true;
        actionBtn.disabled = true;
        step = 'reading_dialog';
        speakText(dialogQuestion);

    } else if (step === 'dialog_recording') {
        // 対話モードの録音停止
        recognition.stop();

        // 対話履歴に追加
        dialogHistory.push({
            question: question.textContent,
            answer: tempTranscript
        });

        // 次の対話準備
        currentAnswer = tempTranscript;
        tempTranscript = "";

        step = 'dialog';
        dialogBtn.innerText = '💬 さらに深掘り';
        dialogBtn.classList.remove('btn-outline-danger');
        dialogBtn.classList.add('btn-outline-primary');
        dialogBtn.disabled = false;
        actionBtn.disabled = false; // 次の質問ボタンを再度有効化
    }
});