const DEFAULT_API_URL = 'http://localhost:3000';

// Load settings on popup open
document.addEventListener('DOMContentLoaded', async () => {
  const { apiUrl } = await chrome.storage.local.get(['apiUrl']);
  const url = apiUrl || DEFAULT_API_URL;
  document.getElementById('api-url').value = url;

  loadTasks(url);
  loadStats(url);
});

async function loadTasks(apiUrl) {
  const container = document.getElementById('tasks-container');
  try {
    const response = await fetch(`${apiUrl}/api/action-items?status=pending`);
    const tasks = await response.json();

    if (!Array.isArray(tasks) || tasks.length === 0) {
      container.innerHTML = '<div class="empty">No pending tasks</div>';
      return;
    }

    let html = '';
    tasks.slice(0, 5).forEach(task => {
      const isOverdue = new Date(task.deadline) < new Date();
      const statusClass = isOverdue ? 'status-overdue' : 'status-pending';
      const statusLabel = isOverdue ? '🚨 期限超過' : '⏳ 保留中';

      html += `
        <div class="task-item">
          <div class="task-name">${task.task_name}</div>
          <div class="task-status">
            <span class="status-badge ${statusClass}">${statusLabel}</span>
          </div>
          <div style="font-size: 11px; color: #999; margin-top: 6px;">
            ${new Date(task.deadline).toLocaleDateString('ja-JP')}
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = `<div class="error">Error loading tasks: ${error.message}</div>`;
  }
}

async function loadStats(apiUrl) {
  const container = document.getElementById('stats-container');
  try {
    const response = await fetch(`${apiUrl}/api/dashboard/summary`);
    const data = await response.json();

    const total = data.globalStats.totalTasks;
    const completed = data.globalStats.completedTasks;
    const rate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;

    let html = `
      <div class="task-item">
        <div class="task-name">Overall Completion</div>
        <div class="score">${rate}% (${completed}/${total})</div>
      </div>
    `;

    if (data.team && data.team.length > 0) {
      const topPerformer = data.team.reduce((a, b) =>
        a.completion_rate > b.completion_rate ? a : b
      );
      html += `
        <div class="task-item">
          <div class="task-name">Top Performer</div>
          <div class="task-status">${topPerformer.user_id}</div>
          <div class="score">${topPerformer.completion_rate.toFixed(1)}%</div>
        </div>
      `;
    }

    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = `<div class="error">Error loading stats: ${error.message}</div>`;
  }
}

async function saveSettings() {
  const apiUrl = document.getElementById('api-url').value;
  await chrome.storage.local.set({ apiUrl });

  // Reload data with new API URL
  loadTasks(apiUrl);
  loadStats(apiUrl);

  alert('Settings saved!');
}
