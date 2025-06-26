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
    const isUrl = cell.dataset.type === "url";

    cell.title = isUrl && cell.textContent.trim().startsWith("http")
        ? "クリックして編集（Ctrl/Cmd+クリックで遷移）"
        : "クリックして編集";

    cell.addEventListener("click", function (event) {
        // 既に編集中なら何もしない
        if (cell.querySelector("input")) return;

        const currentText = cell.textContent.trim(); // ← 毎回最新値を取得
        const isMetaClick = event.metaKey || event.ctrlKey;

        // Ctrl/Cmd+クリックで遷移（URLの場合）
        if (isMetaClick && isUrl && currentText.startsWith("http")) {
            window.open(currentText, "_blank");
            return;
        }

        const input = document.createElement("input");
        input.type = "text";
        input.className = "form-control form-control-sm";
        input.value = currentText;
        cell.textContent = "";
        cell.appendChild(input);
        input.focus();

        function save() {
            const newValue = input.value.trim();
            cell.textContent = newValue || currentText;

            if (newValue !== currentText) {
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
                        cell.textContent = currentText;
                    } else {
                        // ✅ URL判定を再適用
                        if (isUrl && newValue.startsWith("http")) {
                            cell.title = "クリックして編集（Ctrl/Cmd+クリックで遷移）";
                        } else {
                            cell.title = "クリックして編集";
                        }

                        // ✅ 古いイベントをクリアし再設定（完全に更新）
                        const newCell = cell;
                        const newCellClone = newCell.cloneNode(true);
                        newCell.parentNode.replaceChild(newCellClone, newCell);
                        attachEditableEventToCell(newCellClone);
                    }
                })
                .catch(err => {
                    console.error("通信エラー:", err);
                    cell.textContent = currentText;
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
