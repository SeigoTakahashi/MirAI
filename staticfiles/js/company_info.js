document.addEventListener('DOMContentLoaded', () => {
    // 要素の取得
    const tbody = document.getElementById("company-info-body");
    const openModalBtn = document.getElementById("openModal");
    const addRowBtn = document.getElementById("addRowBtn");
    const itemNameInput = document.getElementById("itemNameInput");
    const itemValueInput = document.getElementById("itemValueInput");
    const modalEl = document.getElementById("addRowModal");
    const modal = new bootstrap.Modal(modalEl);
    const deleteBtn = document.getElementById("delete-company-btn");


    // モーダルを開く
    openModalBtn.addEventListener("click", (e) => {
        e.preventDefault();
        modal.show();
    });

    // 行を追加する
    addRowBtn.addEventListener("click", () => {
        const item = itemNameInput.value.trim();
        const value = itemValueInput.value.trim();
        const companyId = document.getElementById("companyId").value;

        if (!item || !value) {
            alert("項目名と情報を入力してください");
            return;
        }

        // 行を追加するAPIを呼び出す
        fetch('/information/add_custom_field/', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: new URLSearchParams({
                field_name: item,
                field_value: value,
                company_id: companyId
            })
        }).then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                const newRow = document.createElement("tr");
                newRow.classList.add("custom-row");
                newRow.dataset.fieldId = data.field_id; 
                newRow.innerHTML = `
                    <th class="fs-sm-9">${item}</th>
                    <td class="fs-sm-9" data-model="custom_field" data-id="${data.field_id}" data-field="field_value">${value}</td>
                    <td class="text-end">
                    <a class="delete-row"><i class="bi bi-x-circle-fill text-danger fs-6 p-1"></i></a>
                    </td>
                `;
                tbody.appendChild(newRow);
                attachEditableEventToCell(newRow.cells[1]);
                itemNameInput.value = "";
                itemValueInput.value = "";
                modal.hide();
            } else {
                alert("保存に失敗しました。");
            }
        });
    });

    // 個別行削除（委譲イベント）
    tbody.addEventListener("click", (e) => {
        if (e.target.closest(".delete-row")) {
            const row = e.target.closest("tr");
            if (row.classList.contains("custom-row")) {
                const fieldId = row.dataset.fieldId;
                
                // 行を削除するAPIを呼び出す
                fetch("/information/custom_field_delete/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({ "field_id": fieldId })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        row.remove();
                    } else {
                        console.error("削除に失敗しました:", data.error);
                    }
                })
                .catch(error => {
                    console.error("通信エラー:", error);
                });
            } else {
                console.error("削除ボタンが見つかりません");
            }
        }
    });

    // 会社情報を削除する
    if (deleteBtn) {
        deleteBtn.addEventListener("click", function () {
            Swal.fire({
                title: '確認',
                text: '会社情報を削除しますか？',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: '削除する',
                cancelButtonText: 'キャンセル',
                confirmButtonColor: '#d33',
                cancelButtonColor: '#6c757d',
            }).then((result) => {
                if (result.isConfirmed) {
    
                    const companyId = document.getElementById("companyId").value;
                    
                    // 会社情報を削除するAPIを呼び出す
                    fetch(`/information/information_delete/${companyId}/`, {
                        method: "POST",
                        headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        },
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.redirect_url) {
                            window.location.href = data.redirect_url;
                        } else {
                            console.error("リダイレクトURLが見つかりません");
                        }
                    })
                    .catch(error => {
                        console.error("エラー:", error);
                    });
                }
                    
            });
                    
        });
            
    }
});
