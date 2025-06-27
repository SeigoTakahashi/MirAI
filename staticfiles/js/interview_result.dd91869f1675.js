// スコア管理クラス
class InterviewScoreManager {
    constructor() {
        this.scores = {
            volume: [],
            smile: [],
            posture: [],
            content: 0
        };
        this.isRecording = false;
    }
    
    startScoring() {
        this.isRecording = true;
        this.scores.volume = [];
        this.scores.smile = [];
        this.scores.posture = [];
    }
    
    stopScoring() {
        this.isRecording = false;
    }
    
    updateScores(volume, happyScore, postureDiff, referenceLandmarks, currentLandmarks) {
        if (!this.isRecording) return;
        
        const volumeScore = this.calculateVolumeScore(volume);
        this.scores.volume.push(volumeScore);
        
        const smileScore = this.calculateSmileScore(happyScore);
        this.scores.smile.push(smileScore);
        
        const postureResult = this.calculatePostureScore(postureDiff, referenceLandmarks, currentLandmarks);
        this.scores.posture.push(postureResult);
    }
    
    calculateVolumeScore(volume) {
        if (volume == null || volume <= 0) return 0;

        const minVolume = 0.0005; // より低音量も評価
        const maxVolume = 0.3;    // 過剰な声量でもスコアが下がりすぎない

        const clamped = Math.max(minVolume, Math.min(volume, maxVolume));
        const normalized = (clamped - minVolume) / (maxVolume - minVolume);

        // 甘め評価にするため、0.5以上で60点以上を保証
        return Math.round(40 + normalized * 60); // 出力スコア：40〜100
    }
    
    calculateSmileScore(happyScore) {
        if (happyScore === null || happyScore === undefined) return 0;
        
        const score = happyScore * 100;

        if (score >= 30 && score <= 85) {
            return Math.min(100, score + 15); // 幅広くボーナス対象に
        }

        if (score < 30) {
            return Math.max(20, score * 1.2); // 最低20点保証＋やや甘め
        }

        // 85以上の「満面の笑み」も減点を緩く
        return Math.max(70, 100 - (score - 85) * 1.2);
    }
    
    calculatePostureScore(diff, referenceLandmarks, currentLandmarks) {
        // 基準姿勢が保存されていない場合
        if (!referenceLandmarks) {
            return { score: 0, status: 'not_saved' };
        }
        
        // 現在の顔が検出されていない場合
        if (!currentLandmarks) {
            return { score: 0, status: 'no_face' };
        }
        
        // 基準姿勢が保存されている場合、閾値を使って0-100でスコアリング
        const postureThreshold = 20000; // 既存の閾値を使用
        
        // 完全に正しい姿勢（差が閾値以下）
        if (diff <= postureThreshold) {
            return { score: 100, status: 'excellent' };
        }
        
        // 閾値を超えた場合、差が大きくなるほど点数を下げる
        // 閾値の3倍まで徐々に減点、それ以上は0点
        const maxDiff = postureThreshold * 3;
        
        if (diff >= maxDiff) {
            return { score: 0, status: 'poor' };
        }
        
        // 線形で減点：閾値超過分に応じて100点から0点まで減点
        const excessDiff = diff - postureThreshold;
        const excessRatio = excessDiff / (maxDiff - postureThreshold);
        const score = Math.round(100 * (1 - excessRatio));
        
        return { 
            score: Math.max(0, score), 
            status: score >= 60 ? 'good' : 'fair' 
        };
    }
    
    getFinalScores() {
        return {
            volume: this.getAverageScore(this.scores.volume),
            smile: this.getAverageScore(this.scores.smile),
            posture: this.getPostureScore(),
            content: this.scores.content
        };
    }
    
    getAverageScore(scoreArray) {
        if (scoreArray.length === 0) return 0;
        const sum = scoreArray.reduce((acc, score) => acc + score, 0);
        return Math.round(sum / scoreArray.length);
    }
    
    getPostureScore() {
        if (this.scores.posture.length === 0) {
            return { score: 0, status: 'no_data' };
        }
        
        // 基準姿勢が保存されていないケースが多い場合
        const notSavedCount = this.scores.posture.filter(p => p.status === 'not_saved').length;
        if (notSavedCount > this.scores.posture.length * 0.5) {
            return { score: 0, status: 'not_saved' };
        }
        
        // 顔が検出されないケースが多い場合
        const noFaceCount = this.scores.posture.filter(p => p.status === 'no_face').length;
        if (noFaceCount > this.scores.posture.length * 0.5) {
            return { score: 0, status: 'no_face' };
        }
        
        // 有効なスコアのみを抽出して平均を計算
        const validScores = this.scores.posture
            .filter(p => p.status !== 'not_saved' && p.status !== 'no_face')
            .map(p => p.score);
            
        if (validScores.length === 0) {
            return { score: 0, status: 'no_valid_data' };
        }
        
        const avgScore = Math.round(validScores.reduce((acc, score) => acc + score, 0) / validScores.length);
        return { score: avgScore, status: 'valid' };
    }
        
    setContentScore(score) {
        this.scores.content = score;
    }
}

// 状態メッセージ
const postureStatusMessages = {
    'not_saved': '姿勢未保存',
    'no_face': '顔未検出',
    'no_data': 'データなし',
    'no_valid_data': '有効データなし',
    'excellent': '優秀',
    'good': '良好',
    'fair': '要改善',
    'poor': '不良',
    'valid': '有効'
};

// ドーナツチャートのアニメーション関数
function animateDonutChart(elementId, score, isValid = true) {
    const circle = document.getElementById(elementId);
    const radius = 40;
    const circumference = 2 * Math.PI * radius;

    // 共通のdasharray設定（円を描くための準備）
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    
    if (!isValid || score === 0) {
        // 無効な場合はグレーアウト
        circle.style.stroke = '#6c757d';
        circle.style.strokeDashoffset = 0;
        return;
    }
    
    // スコアに応じた色設定
    let color = '#28a745'; // 緑（良好）
    if (score < 40) {
        color = '#dc3545'; // 赤（不良）
    } else if (score < 70) {
        color = '#ffc107'; // 黄（要改善）
    }
    circle.style.stroke = color;
    
    const progress = (score / 100) * circumference;
    
    // 初期設定
    circle.style.strokeDashoffset = circumference;
    
    // アニメーション開始
    setTimeout(() => {
        circle.style.strokeDashoffset = circumference - progress;
    }, 100);
}

// スコア表示更新
function updateScoreDisplay(finalScores) {
    // 音量
    document.getElementById('volume-score').textContent = finalScores.volume;
    animateDonutChart('volume-progress', finalScores.volume);
    
    // 笑顔
    document.getElementById('smile-score').textContent = finalScores.smile;
    animateDonutChart('smile-progress', finalScores.smile);
    
    // 姿勢
    const postureScore = finalScores.posture;
    if (typeof postureScore === 'object') {
        if (postureScore.status !== 'valid') {
            document.getElementById('posture-score').textContent = "--";
            animateDonutChart('posture-progress', 0, false);
        } else {
            document.getElementById('posture-score').textContent = postureScore.score;
            animateDonutChart('posture-progress', postureScore.score);
        }
    } else {
        document.getElementById('posture-score').textContent = postureScore;
        animateDonutChart('posture-progress', postureScore);
    }
    
    // 内容
    document.getElementById('content-score').textContent = finalScores.content;
    animateDonutChart('content-progress', finalScores.content);
}

// 面接終了時の処理
function endInterview() {
    // 最終スコア取得
    const finalScores = scoreManager.getFinalScores();
    
    // 内容スコアを仮で設定（実際はGemini AIから取得）
    finalScores.content = Math.floor(Math.random() * 40) + 60; // 60-100のランダム
    
    console.log('最終スコア:', finalScores);
    
    // モーダル表示
    const modalElement = document.getElementById('interviewResultModal');
    const modal = new bootstrap.Modal(modalElement);
    
    // モーダルが完全に表示された後にスコア更新
    modalElement.addEventListener('shown.bs.modal', function () {
        updateScoreDisplay(finalScores);
    }, { once: true });
    
    modal.show();
}