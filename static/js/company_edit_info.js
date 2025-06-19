document.addEventListener("DOMContentLoaded", function () {
    const tableBody = document.getElementById("company-info-body");

    if (!tableBody) return;

    // 全ての行に対して、編集可能なセルにイベントを追加
    tableBody.querySelectorAll("tr").forEach(row => {
        const infoCell = row.cells[1];
        attachEditableEventToCell(infoCell);
    });
});

// セルを編集可能にする関数
function attachEditableEventToCell(cell) {
    cell.style.cursor = "pointer";
    cell.title = "クリックして編集";
    const isUrl = cell.dataset.type === "url";
    const originalText = cell.textContent.trim();
    if (isUrl && originalText.startsWith("http")) {
        cell.title = "クリックして編集（Ctrl/Cmd+クリックで遷移）";
    }

    cell.addEventListener("click", function (event) {
        if (cell.querySelector("input")) return;

        const isMetaClick = event.metaKey || event.ctrlKey;

        // Ctrl/Cmd+クリックで遷移（リンクとして）
        if (isMetaClick && isUrl && originalText.startsWith("http")) {
            window.open(originalText, "_blank");
            return;
        }

        const input = document.createElement("input");
        input.type = "text";
        input.className = "form-control form-control-sm";
        input.value = originalText;
        cell.textContent = "";
        cell.appendChild(input);
        input.focus();

        // セルの編集をDBに保存する関数
        function save() {
            const newValue = input.value.trim();
            cell.textContent = newValue || originalText;

            if (newValue !== originalText) {
                const model = cell.dataset.model;
                const id = cell.dataset.id;
                const field = cell.dataset.field;

                fetch("/information/inline_update/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({
                        model: model,
                        id: id,
                        field: field,
                        value: newValue
                    })
                })
                .then(res => res.json())
                .then(data => {
                    if (!data.success) {
                        console.error("保存に失敗しました");
                        cell.textContent = originalText; // 元に戻す
                    }
                })
                .catch(err => {
                    console.error("通信エラー:", err);
                    cell.textContent = originalText; // 元に戻す
                });
            }
        }

        input.addEventListener("blur", save);
        input.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                input.blur();
            }
        });
    });
}

