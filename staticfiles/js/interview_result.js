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
        const minVolume = 0.05;
        const maxVolume = 0.5;
        const optimalMin = 0.15;
        const optimalMax = 0.35;
        
        if (volume < minVolume) return 0;
        if (volume > maxVolume) return Math.max(0, 100 - ((volume - maxVolume) * 200));
        if (volume >= optimalMin && volume <= optimalMax) return 100;
        
        if (volume < optimalMin) {
            return 50 + ((volume - minVolume) / (optimalMin - minVolume)) * 50;
        } else {
            return 100 - ((volume - optimalMax) / (maxVolume - optimalMax)) * 30;
        }
    }
    
    calculateSmileScore(happyScore) {
        if (happyScore === null || happyScore === undefined) return 0;
        
        const baseScore = happyScore * 100;
        const optimalMin = 30;
        const optimalMax = 80;
        
        if (baseScore >= optimalMin && baseScore <= optimalMax) {
            return Math.min(100, baseScore + 20);
        } else if (baseScore < optimalMin) {
            return Math.max(0, baseScore * 0.8);
        } else {
            return Math.max(60, 100 - (baseScore - optimalMax));
        }
    }
    
    calculatePostureScore(diff, referenceLandmarks, currentLandmarks) {
        if (!referenceLandmarks) return { score: 0, status: 'no_reference' };
        if (!currentLandmarks) return { score: 0, status: 'no_face' };
        
        const postureThreshold = 20000;
        if (diff > postureThreshold * 5) return { score: 0, status: 'too_far' };
        
        const maxAcceptableDiff = postureThreshold * 2;
        
        if (diff <= postureThreshold) {
            return { score: 100, status: 'excellent' };
        } else if (diff <= maxAcceptableDiff) {
            const score = 100 - ((diff - postureThreshold) / (maxAcceptableDiff - postureThreshold)) * 40;
            return { score: Math.round(score), status: 'good' };
        } else {
            const score = Math.max(0, 60 - ((diff - maxAcceptableDiff) / postureThreshold) * 30);
            return { score: Math.round(score), status: 'poor' };
        }
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
        if (this.scores.posture.length === 0) return { score: 0, status: 'no_data' };
        
        const invalidCount = this.scores.posture.filter(p => p.status === 'no_face' || p.status === 'too_far').length;
        const invalidRatio = invalidCount / this.scores.posture.length;
        
        if (invalidRatio > 0.5) {
            return { score: 0, status: 'mostly_invalid' };
        }
        
        const validScores = this.scores.posture.filter(p => p.score > 0).map(p => p.score);
        if (validScores.length === 0) return { score: 0, status: 'no_valid_data' };
        
        const avgScore = Math.round(validScores.reduce((acc, score) => acc + score, 0) / validScores.length);
        return { score: avgScore, status: 'valid' };
    }
        
    setContentScore(score) {
        this.scores.content = score;
    }
}

// グローバルスコア管理インスタンス
const scoreManager = new InterviewScoreManager();

// 無効状態メッセージ
const invalidMessages = {
    'no_reference': '姿勢未設定',
    'no_face': '顔未検出',
    'too_far': '距離が遠い',
    'mostly_invalid': 'データ不足',
    'no_valid_data': '有効データなし',
    'no_data': 'データなし'
};

// ドーナツチャートのアニメーション関数
function animateDonutChart(elementId, score, isValid = true) {
    const circle = document.getElementById(elementId);
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    
    if (!isValid || score === 0) {
        // 無効な場合はグレーアウト
        circle.style.stroke = '#6c757d';
        circle.style.strokeDasharray = '5,5';
        circle.style.strokeDashoffset = 0;
        return;
    }
    
    const progress = (score / 100) * circumference;
    
    // 初期設定
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
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
    if (typeof postureScore === 'object' && postureScore.status !== 'valid') {
        document.getElementById('posture-score').textContent = "--";
        animateDonutChart('posture-progress', 0, false);
    } else {
        const score = typeof postureScore === 'object' ? postureScore.score : postureScore;
        document.getElementById('posture-score').textContent = score;
        animateDonutChart('posture-progress', score);
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