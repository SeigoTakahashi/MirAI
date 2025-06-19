// テキストエリアの文字数をカウントする
document.addEventListener('DOMContentLoaded', function () {
    const textarea = document.getElementById('jobdocTextarea');
    const charCount = document.getElementById('charCount');

    if (textarea && charCount) {
        const updateCharCount = () => {
            charCount.textContent = textarea.value.length;
        };

        // 初期表示時に更新
        updateCharCount();

        // 入力変更時にも更新（念のため）
        textarea.addEventListener('input', updateCharCount);
    }
});