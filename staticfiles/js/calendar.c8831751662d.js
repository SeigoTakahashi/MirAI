let clickedDateStr = ''; // グローバル変数として宣言
// 今日のイベントを表示する関数
function showTodayEvents(events) {
  const list = document.getElementById('today-event-list');
  list.innerHTML = '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const todayEvents = events.filter(e => {
    const start = new Date(e.start);
    const end = new Date(e.end);

    // イベントが今日に少しでもかかっていればOK
    return start < tomorrow && end > today;
  }).sort((a, b) => new Date(a.start) - new Date(b.start));

  if (todayEvents.length === 0) {
    list.innerHTML = '<li class="list-group-item">本日のイベントはありません。</li>';
    return;
  }

  todayEvents.forEach(e => {
    const time = e.allDay ? '終日' : e.start.toTimeString().slice(0, 5);
    const colorDot = `<span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color:${e.backgroundColor}; margin-right:8px;"></span>`;
    list.innerHTML += `<li class="list-group-item">${colorDot}${time} - ${e.title}</li>`;
  });
}
document.addEventListener('DOMContentLoaded', function() {
  // カレンダーの初期化
  let calendarEl = document.getElementById('calendar');
  if (!calendarEl) {
    return; // カレンダー要素が存在しない場合は処理を終了
  }
  let calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'title',
      center: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
      right: 'prev,today,next'
    },
    locale: 'ja',
    height: 'auto',
    eventMaxStack: 3,
    dayMaxEvents: 3,
    buttonText: {
        prev:     '<',
        next:     '>',
        prevYear: '<<',
        nextYear: '>>',
        today:    '今日',
        month:    '月',
        week:     '週',
        day:      '日',
        list:     '一覧',
    },
    allDayText: '終日',
    themeSystem: 'bootstrap5',
    businessHours: true,
    fixedWeekCount: false,
    events: '/dashboard/api/events/',
    eventsSet: showTodayEvents, // イベントセット時に今日のイベントを表示
    dayCellContent: function(arg){
      return arg.date.getDate();
    },
    eventClick: function(info) { // イベントクリック時の処理
      const e = info.event;
      
      // フォームモーダル表示（編集）
      const title = "予定を編集";
      showPopup(title, 'edit', {
        id: e.id,
        title: e.title,
        start: e.startStr,
        end: e.endStr,
        allDay: e.allDay,
        description: e.extendedProps.description,
        company: e.extendedProps.company_id,
        color: e.backgroundColor
      });
    },
    dateClick: function(info) { // 日付クリック時の処理

      const title = "予定を追加";
      const date = info.dateStr;

      // フォームモーダル表示（追加）
      showPopup(title, 'add', { 
        allDay: true,
        date: date,
      });
    }
    
  });

  // カレンダーを描画
  window.calendar = calendar;
  calendar.render();
});

// モーダル表示関数
function showPopup(title, mode, data) {
  const errorMessage = document.getElementById('error-message');
  errorMessage.textContent = ''; // エラーメッセージをクリア
  const modalEl = document.getElementById('eventModal');
  document.getElementById('eventModalLabel').innerHTML = title;
  const modal = new bootstrap.Modal(modalEl);
  const form = document.getElementById('event-form');
  form.reset();
  // モーダルのアクションURLを設定
  form.action = (mode === 'edit') ? `/dashboard/api/events/update/${data.id}/` : '/dashboard/api/events/create/';

  // クリックした日付をグローバル変数に保存
  clickedDateStr = data.date || ''; 
  // イベント定義
  modalEl.addEventListener('shown.bs.modal', function () {
    document.querySelector('[name="title"]').value = data.title || '';
    document.querySelector('[name="all_day"]').checked = data.allDay || false;
    // 日付・日時入力タイプの更新
    updateInputType(); 
    // 編集の場合はフォームをセット
    if (mode === 'edit') {
      document.querySelector('[name="start"]').value = formatDate(data.start, data.allDay);
      // endが未定義かnullなら補完（終日かつ1日イベントのため）
      let endDate = data.end;
      if (!endDate && data.allDay && data.start) {
        const d = new Date(data.start);
        d.setDate(d.getDate());
        endDate = d.toISOString();
      }
      document.querySelector('[name="end"]').value = formatDate(endDate, data.allDay);
      document.getElementById('event-description').value = data.description || '';
      document.querySelector('[name="company"]').value = data.company || '';
    }

    // カラーラジオボタンの設定
    const selectedColor = data.color || '#3788d8'; // デフォルト色を設定
    if (selectedColor) {
      const colorInput = document.querySelector(`input[name="color"][value="${selectedColor}"]`);
      if (colorInput) {
        colorInput.checked = true;

        // 対応するlabelにactiveクラスを付与
        const label = document.querySelector(`label[for="${colorInput.id}"]`);
        if (label) {

          label.classList.add('active');
        }
      }
    }
  }, { once: true });

  // 削除ボタンの設定
  const deleteBtn = document.getElementById('delete-event-btn');
  deleteBtn.style.display = mode === 'edit' ? 'inline-block' : 'none';
  deleteBtn.onclick = function () {
    Swal.fire({
        title: '確認',
        text: 'イベントを削除しますか？',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '削除する',
        cancelButtonText: 'キャンセル',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
    }).then((result) => {
        if (result.isConfirmed) {
          fetch(`/dashboard/api/events/delete/${data.id}/`, {
            method: 'POST',
          }).then(res => res.json()).then(data => {
            if (data.success) {
              calendar.refetchEvents();
            }
          });
          modal.hide();
        }
    });
  };

  // フォームの送信処理
  form.onsubmit = function (e) {
    e.preventDefault();

    // バリデーションチェック
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = '';

    const startInput = document.getElementById('event-start');
    const endInput = document.getElementById('event-end');

    const allDay = document.getElementById('all-day').checked;
    const start = new Date(startInput.value);
    const end = new Date(endInput.value);

    if (!startInput.value || !endInput.value) {
      errorMessage.textContent = "開始・終了日時を入力してください。";
      return;
    }

    if (allDay) {
      // 終日の場合：開始日 > 終了日はNG（同じはOK）
      if (start > end) {
        errorMessage.textContent = "開始日は終了日以前にしてください（終日イベント）。";
        return;
      }
    } else {
      // 通常の日時イベント：開始 >= 終了はNG
      if (start >= end) {
        errorMessage.textContent = "開始日時は終了日時より前にしてください。";
        return;
      }
    }
    const formData = new FormData(form);
    fetch(form.action, {
      method: 'POST',
      body: formData,
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        calendar.refetchEvents();
        modal.hide();
      } else {
        alert("エラー: " + JSON.stringify(data.errors));
      }
    });
  };
  modal.show();

  // 日付・日時入力タイプの更新
  function updateInputType() {
    const allDay = document.getElementById('all-day').checked;
    const startInput = document.getElementById('event-start');
    const endInput = document.getElementById('event-end');

    // 現在の時刻を取得
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const currentTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    if (allDay) {
      startInput.type = 'date';
      endInput.type = 'date';

      startInput.value = clickedDateStr;
      endInput.value = clickedDateStr;
    } else {
      startInput.type = 'datetime-local';
      endInput.type = 'datetime-local';

      // clickedDateStr: '2025-06-23' + 現在の時刻
      const combinedDateTime = `${clickedDateStr}T${currentTime}`;

      startInput.value = combinedDateTime;
      endInput.value = combinedDateTime;
    }
  }

  // 日付フォーマット関数
  function formatDate(dateStr, allDay) {
    if (!dateStr) return '';
    
    // 日本時間にするために9時間加算
    const date = new Date(dateStr);
    date.setHours(date.getHours() + 9);  // 9時間加算
    
    return allDay ? date.toISOString().slice(0, 10) : date.toISOString().slice(0, 16);
  }


  // 終日チェックボックスの変更イベント
  document.getElementById('all-day').addEventListener('change', updateInputType);
}

