// テンプレート選択時に表示内容を更新
document.getElementById('templateSelect')?.addEventListener('change', function () {
    const selectedFile = this.value;
    const display = document.getElementById('templateDisplay');
    const copyBtn = document.getElementById('copy-btn');

    if (selectedFile) {
        copyBtn.style.display = "block";  // コピーボタンを表示
        // Ajaxを使って静的ファイルを読み込む
        fetch(`${MailtemplatesPath}${selectedFile}.txt`)
            .then(response => response.text())
            .then(content => {
                display.value = content;  // ファイルの内容をテキストエリアに表示
                autoResizeTextarea(display);
            })
            .catch(error => {
                display.value = "選択したファイルを読み込めませんでした。";
                console.error("ファイル読み込みエラー:", error);
                autoResizeTextarea(display);
            });
    } else {
        display.value = "テンプレートの内容をここに表示";
        copyBtn.style.display = "none";  // コピーボタンを非表示
        autoResizeTextarea(display);
    }
});

// テキストエリアの自動リサイズ
document.getElementById('templateDisplay')?.addEventListener('input', function () {
    autoResizeTextarea(this);
});

// 高さ自動調整関数
function autoResizeTextarea(el) {
    el.style.height = 'auto';
    // 1回目のリサイズ
    requestAnimationFrame(() => {
        el.style.height = el.scrollHeight + 'px';
    });

    // 念のための2回目（遅延後）
    setTimeout(() => {
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
    }, 2000);
}