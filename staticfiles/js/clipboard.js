// コピーJS
const clipboard = new ClipboardJS('.copy-btn');

// クリップボードにコピーするボタンをクリックしたときの処理
clipboard.on('success', function (e) {
    // 成功時の処理
    navigator.clipboard.writeText(e.text); // 明示的なコピー（安全のため）
    Swal.fire({
        text: "クリップボードにコピー",
        timer: 3000,
        showConfirmButton: false,
        position: 'bottom',
        icon: 'success',
        toast: true,
        customClass: {
            popup: 'swal-responsive' // レスポンシブなスタイルを適用
        }
    });
}).on('error', function (e) {
    // エラー時の処理
    Swal.fire({
        text: "クリップボードへのコピーが失敗",
        timer: 3000,
        showConfirmButton: false,
        position: 'bottom',
        icon: 'error',
        toast: true,
        customClass: {
            popup: 'swal-responsive' // レスポンシブなスタイルを適用
        }
    });
});

