const pdfContainer = document.getElementById('pdf-container');
const fontSizeInput = document.getElementById('font-size');
let fontSize = parseInt(fontSizeInput.value, 10);
const uploadImageInput = document.getElementById('upload-image');
const uploadPdfInput = document.getElementById('upload-pdf');
const saveBtn = document.getElementById('save-pdf');
let selectedBox = null;
const scale = 1.5;

uploadPdfInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.includes('pdf')) return;
    const arrayBuffer = await file.arrayBuffer();
    loadPDF(arrayBuffer);
    saveBtn.style.display = 'block';
});

async function loadPDF(data) {
    pdfContainer.innerHTML = '';
    const pdf = await pdfjsLib.getDocument({ data }).promise;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const pageDiv = document.createElement('div');
        pageDiv.className = 'page-container';
        pageDiv.dataset.page = pageNum;

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        pageDiv.appendChild(canvas);
        pdfContainer.appendChild(pageDiv);

        pageDiv.addEventListener('dblclick', (e) => {
            if (e.target !== canvas) return;
            const rect = canvas.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            fontSize = parseInt(fontSizeInput.value, 10);

            const box = document.createElement('div');
            box.className = 'text-box';
            box.contentEditable = true;
            box.style.left = x + '%';
            box.style.top = y + '%';
            box.style.fontSize = fontSize + 'px';
            box.innerText = 'テキスト';

            // 既存のテキストをダブルクリックしたら編集モードに
            box.addEventListener('dblclick', (event) => {
                event.stopPropagation(); // 親要素に伝播しないように
                box.contentEditable = true;
                box.focus();

                const range = document.createRange();
                range.selectNodeContents(box);
                range.collapse(false);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            });

            pageDiv.appendChild(box);
            box.focus();

            const range = document.createRange();
            range.selectNodeContents(box);
            range.collapse(false);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);

            box.addEventListener('click', (event) => {
                event.stopPropagation();
                if (selectedBox && selectedBox !== box) {
                    selectedBox.classList.remove('selected');
                }
                selectedBox = box;
                box.classList.add('selected');
            });

            enableDrag(box, pageDiv);
        });

        pageDiv.addEventListener('click', () => {
            if (selectedBox) {
                selectedBox.classList.remove('selected');
                selectedBox = null;
            }
        });
    }
}

function enableDrag(el, container) {
    let offsetX = 0, offsetY = 0, isDragging = false;

    el.addEventListener('mousedown', (e) => {
        // 👉 追加: リサイズハンドルからのドラッグを無視
        const style = window.getComputedStyle(el);
        const resize = style.getPropertyValue('resize');
        const isResizingArea = (e.offsetX > el.clientWidth - fontSize && e.offsetY > el.clientHeight - fontSize);
        if (resize !== 'none' && isResizingArea) return;

        if (!el.contains(e.target)) return;

        isDragging = true;
        const rect = el.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        e.preventDefault();
        e.stopPropagation();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const rect = container.getBoundingClientRect();
        const left = ((e.clientX - rect.left - offsetX) / rect.width) * 100;
        const top = ((e.clientY - rect.top - offsetY) / rect.height) * 100;
        el.style.left = left + '%';
        el.style.top = top + '%';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

uploadImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target.result;

        const box = document.createElement('div');
        box.className = 'image-box';
        box.style.left = '10%';
        box.style.top = '10%';
        box.style.width = '100px';
        box.style.height = '100px';
        box.appendChild(img);

        const page = document.querySelector('.page-container');
        if (page) {
            page.appendChild(box);
            enableDrag(box, page);

            box.addEventListener('click', (event) => {
                event.stopPropagation();
                if (selectedBox && selectedBox !== box) {
                    selectedBox.classList.remove('selected');
                }
                selectedBox = box;
                box.classList.add('selected');
            });
        }
    };
    reader.readAsDataURL(file);
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' && selectedBox) {
        selectedBox.remove();
        selectedBox = null;
    }
});

saveBtn.addEventListener('click', async () => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const pages = document.querySelectorAll('.page-container');

    for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], { scale: 2 });
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const aspectRatio = canvas.height / canvas.width;
        const imgHeight = pdfWidth * aspectRatio;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight);
    }

    pdf.save('履歴書.pdf');
});

fontSizeInput.addEventListener('input', () => {
    fontSize = parseInt(fontSizeInput.value, 10);
    if (selectedBox && selectedBox.classList.contains('text-box')) {
        selectedBox.style.fontSize = fontSize + 'px';
    }
});

