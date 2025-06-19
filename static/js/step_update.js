document.addEventListener('DOMContentLoaded', function () {
    // 進捗管理用の変数intに変換
    let currentActive = parseInt(CURRENT_ACTIVE_INDEX) || 0; 

    // チェックボックスIDとラベルのマッピング
    const labelMapping = {
        'dropdownCheck1': '応募',
        'dropdownCheck2': '説明',
        'dropdownCheck3': '書類',
        'dropdownCheck4': '適性',
        'dropdownCheck5': '1次',
        'dropdownCheck6': '2次',
        'dropdownCheck7': '3次',
        'dropdownCheck8': '最終',
        'dropdownCheck9': '内定'
    };
    // チェックボックス要素をすべて取得
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const progressContainer = document.querySelector('.progress-container');
    const labelContainer = document.querySelector('.d-flex.justify-content-between');
    const progressBar = document.querySelector('.js-progress');
    const circles = document.querySelectorAll('.step-circle');
    const prevBtn = document.getElementById('prev');
    const nextBtn = document.getElementById('next');

    // プログレスバーの幅を更新
    if (circles.length > 1) {
        const percent = currentActive / (circles.length - 1) * 100;
        progressBar.style.width = percent + '%';
    } else {
        progressBar.style.width = '0%';
    }

    // ボタンの状態を制御
    controlButtons(circles.length);

    // 全チェックボックスに変更イベントを設定
    checkboxes.forEach(cb => {
        cb.addEventListener('change', updateCirclesAndLabels);
    });

    // チェックボックスの状態に応じてサークルとラベルを更新する関数
    function updateCirclesAndLabels(event) {
        // 古いサークルをすべて削除
        const oldCircles = document.querySelectorAll('.step-circle');
        oldCircles.forEach(circle => circle.remove());

        // 古いラベルをすべて削除
        const oldLabels = document.querySelectorAll('.step-label');
        oldLabels.forEach(label => label.remove());

        // チェックされた項目だけを取得（元の順番を保持）
        const checkedBoxes = Array.from(checkboxes).filter(cb => cb.checked);

        // 新しいサークルを追加（最初は非アクティブ状態）
        checkedBoxes.forEach((cb, index) => {
            const circle = document.createElement('div');
            circle.className = 'step-circle';
            circle.textContent = index + 1;

            // チェックボックスから step-id を取得して circle に設定
            const stepId = cb.dataset.stepId;
            if (stepId) {
                circle.dataset.stepId = stepId;
            }

            progressContainer.appendChild(circle);
        });

        // 新しいラベルを追加
        checkedBoxes.forEach(cb => {
            const label = document.createElement('small');
            label.className = 'step-label';
            label.textContent = labelMapping[cb.id] || 'その他';
            labelContainer.appendChild(label);
        });


        // fetchでバックエンドに反映
        if (event && event.target && event.target.type === 'checkbox') {

            const checkbox = event.target;
            const stepId = checkbox.dataset.stepId;
            const checked = checkbox.checked;
            const companyId = checkbox.dataset.companyId;
            
            // バックエンドに送信
            fetch(`/information/update_step_selection/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    step_id: stepId,
                    company_id: companyId,
                    checked: checked
                })
            }).then(response => {
                if (!response.ok) throw new Error('Network response was not ok.');
                return response.json();
            }).then(data => {
                console.log('Updated:', data);
            }).catch(error => {
                console.error('Error updating step selection:', error);
            });
        }

        // 進捗を初期化
        resetProgress();
    }

    // 進捗を初期化する関数
    function resetProgress() {
        // 進捗管理用の変数
        currentActive = 0;
        // バックエンドのcurrentStepをリセット
        fetch('/information/reset_current_step/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                progress_id: PROGRESS_ID
            })
        })

        // プログレスバーを初期化
        progressBar.style.width = '0%';

        // アクティブ属性を追加
        const circles = document.querySelectorAll('.step-circle');
        circles.forEach((circle, idx) => {
            if (idx <= currentActive) {
                circle.classList.add('is-active');
            } else {
                circle.classList.remove('is-active');
            }
        });

    }

    // 次へボタンのイベントリスナー
    nextBtn.addEventListener('click', () => {
        // 現在のステップの更新
        const circles = document.querySelectorAll('.step-circle');
        currentActive = Math.min(currentActive + 1, circles.length - 1);
        
        updateProgress();

        const stepId = circles[currentActive].dataset.stepId;
        updateCurrentStep(stepId, PROGRESS_ID);
    });

    // 戻るボタンのイベントリスナー
    prevBtn.addEventListener('click', () => {
        // 現在のステップの更新
        currentActive = Math.max(currentActive - 1, 0);  
        updateProgress();

        const stepId = circles[currentActive].dataset.stepId;
        updateCurrentStep(stepId, PROGRESS_ID);
    });

    // 進捗バーとサークルの状態を更新する関数
    function updateProgress() {
        // サークルの状態の更新
        const circles = document.querySelectorAll('.step-circle');
        circles.forEach((circle, idx) => {
            if (idx <= currentActive) {
                circle.classList.add('is-active');
            } else {
                circle.classList.remove('is-active');
            }
        });

        // プログレスバーの幅を更新
        if (circles.length > 1) {
            const percent = currentActive / (circles.length - 1) * 100;
            progressBar.style.width = percent + '%';
        } else {
            progressBar.style.width = '0%';
        }

        // ボタンの状態を制御
        controlButtons(circles.length);
    }

    // バックエンドの現在ステップの更新関数
    function updateCurrentStep(stepId, progressId) {
        // バックエンドに送信
        fetch('/information/update_current_step/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                step_id: stepId,
                progress_id: progressId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (!data.status || data.status !== 'ok') {
                console.error('Error updating step:', data.error);
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
        });
    }

    // ボタンの有効/無効を制御する関数
    function controlButtons(totalSteps) {
        // 前があるとき、戻るを有効に
        prevBtn.disabled = (currentActive <= 0);

        // 次があるとき、次へを有効に
        nextBtn.disabled = (currentActive >= totalSteps - 1);
    }



});

