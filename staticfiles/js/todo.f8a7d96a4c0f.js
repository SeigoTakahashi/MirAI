// 完了済みタスクの表示/非表示を切り替えるためのフラグ
let showCompleted = true;

// ロード時にタスクを取得して表示
document.addEventListener('DOMContentLoaded', () => {
    fetchAndRenderTodos();
});

// タスクの表示のイベントリスナー
function fetchAndRenderTodos() {
    fetch('/todo/api/list/')
      .then(res => res.json())
      .then(data => {
          const container = document.getElementById('todoList');
          container.innerHTML = '';
          data.forEach(todo => {
              if (!showCompleted && todo.completed) return;
              addTodoElement(todo.id, todo.task, todo.completed);
          });
      });
}

// CSRFトークンを取得する
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const trimmed = cookie.trim();
            if (trimmed.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(trimmed.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// タスクを追加する
function addTodo() {
    const task = document.getElementById('taskInput').value;
    if (!task.trim()) return;
    fetch('/todo/add/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ task: task })
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById('taskInput').value = '';
        fetchAndRenderTodos();
    });
}

// タスクの要素を追加する
function addTodoElement(id, task, completed) {
    const container = document.createElement('div');
    container.className = "d-flex align-items-center border-bottom py-2";
    container.id = 'todo-' + id;

    const checkbox = document.createElement('input');
    checkbox.className = "form-check-input m-0";
    checkbox.type = 'checkbox';
    checkbox.checked = completed;
    checkbox.onchange = () => toggleComplete(id, checkbox.checked);

    const taskWrapper = document.createElement('div');
    taskWrapper.className = "w-100 ms-3";

    const taskRow = document.createElement('div');
    taskRow.className = "d-flex w-100 align-items-center justify-content-between";

    const taskText = document.createElement('span');
    taskText.textContent = task;
    if (completed) {
        taskText.style.textDecoration = 'line-through';
        taskText.style.color = 'gray';
    }

    const delBtn = document.createElement('button');
    delBtn.className = "btn btn-sm";
    delBtn.innerHTML = '<i class="fa fa-times"></i>';
    delBtn.onclick = () => deleteTodo(id);

    taskRow.appendChild(taskText);
    taskRow.appendChild(delBtn);
    taskWrapper.appendChild(taskRow);

    container.appendChild(checkbox);
    container.appendChild(taskWrapper);

    document.getElementById('todoList').appendChild(container);
}

// タスクを削除する
function deleteTodo(id) {
    fetch(`/todo/delete/${id}/`, {
        method: 'DELETE',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.deleted) {
            document.getElementById('todo-' + id).remove();
        }
    });
}

// タスクの完了状態を切り替える
function toggleComplete(id, completed) {
    fetch(`/todo/toggle/${id}/`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ completed: completed })
    })
    .then(res => res.json())
    .then(() => fetchAndRenderTodos());
}

// 完了済みタスクの表示/非表示を切り替える
function toggleCompletedVisibility() {
    showCompleted = !showCompleted;
    document.getElementById('toggleBtn').textContent = showCompleted ? '完了済みタスクを非表示' : 'すべてのタスクを表示';
    fetchAndRenderTodos();
}