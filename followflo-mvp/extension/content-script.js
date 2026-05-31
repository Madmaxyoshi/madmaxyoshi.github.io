// Content script that runs in Notion/Asana pages
const DEFAULT_API_URL = 'http://localhost:3000';

// Get API URL from storage
chrome.storage.local.get(['apiUrl'], (result) => {
  const apiUrl = result.apiUrl || DEFAULT_API_URL;
  initContentScript(apiUrl);
});

async function initContentScript(apiUrl) {
  const hostname = window.location.hostname;

  if (hostname.includes('notion.so')) {
    initNotionIntegration(apiUrl);
  } else if (hostname.includes('asana.com')) {
    initAsanaIntegration(apiUrl);
  }
}

async function initNotionIntegration(apiUrl) {
  // Detect Notion database pages with tasks
  const observer = new MutationObserver(() => {
    const taskRows = document.querySelectorAll('[role="row"]');
    taskRows.forEach(row => {
      if (!row.dataset.flowflowProcessed) {
        processNotionRow(row, apiUrl);
        row.dataset.flowflowProcessed = 'true';
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Initial check
  const taskRows = document.querySelectorAll('[role="row"]');
  taskRows.forEach(row => processNotionRow(row, apiUrl));
}

async function processNotionRow(row, apiUrl) {
  try {
    // Extract task name from row
    const taskNameElement = row.querySelector('[role="gridcell"]');
    if (!taskNameElement) return;

    const taskName = taskNameElement.textContent.trim();
    if (!taskName) return;

    // Create indicator badge
    const badge = document.createElement('div');
    badge.className = 'flowfllow-badge notion-badge';
    badge.innerHTML = '📊';
    badge.title = 'FLOWFLLOW - Loading...';

    // Fetch task status from API
    const tasksResponse = await fetch(`${apiUrl}/api/action-items`);
    const tasks = await tasksResponse.json();
    const matchingTask = tasks.find(t =>
      t.task_name.toLowerCase().includes(taskName.toLowerCase()) ||
      taskName.toLowerCase().includes(t.task_name.toLowerCase())
    );

    if (matchingTask) {
      const isCompleted = matchingTask.status === 'completed';
      const isOverdue = new Date(matchingTask.deadline) < new Date();
      badge.className = `flowfllow-badge notion-badge ${
        isCompleted ? 'status-completed' : isOverdue ? 'status-overdue' : 'status-pending'
      }`;
      badge.innerHTML = isCompleted ? '✅' : isOverdue ? '🚨' : '⏳';
      badge.title = `${matchingTask.task_name} - ${matchingTask.status}`;
    }

    // Append badge to row
    const firstCell = row.querySelector('[role="gridcell"]');
    if (firstCell && !firstCell.querySelector('.flowfllow-badge')) {
      firstCell.appendChild(badge);
    }
  } catch (error) {
    console.error('FLOWFLLOW: Error processing Notion row', error);
  }
}

async function initAsanaIntegration(apiUrl) {
  // Detect Asana task items
  const observer = new MutationObserver(() => {
    const taskItems = document.querySelectorAll('[role="button"][aria-label*="task"], [data-task-id]');
    taskItems.forEach(item => {
      if (!item.dataset.flowflowProcessed) {
        processAsanaTask(item, apiUrl);
        item.dataset.flowflowProcessed = 'true';
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Initial check
  const taskItems = document.querySelectorAll('[role="button"][aria-label*="task"], [data-task-id]');
  taskItems.forEach(item => processAsanaTask(item, apiUrl));
}

async function processAsanaTask(item, apiUrl) {
  try {
    // Extract task name from Asana element
    const taskNameElement = item.querySelector('[role="heading"]') || item;
    const taskName = taskNameElement.textContent.trim();

    if (!taskName) return;

    // Fetch task status from API
    const tasksResponse = await fetch(`${apiUrl}/api/action-items`);
    const tasks = await tasksResponse.json();
    const matchingTask = tasks.find(t =>
      t.task_name.toLowerCase().includes(taskName.toLowerCase()) ||
      taskName.toLowerCase().includes(t.task_name.toLowerCase())
    );

    if (matchingTask) {
      // Create status indicator
      const indicator = document.createElement('div');
      indicator.className = 'flowfllow-indicator asana-indicator';
      indicator.style.display = 'inline-block';
      indicator.style.marginLeft = '8px';
      indicator.style.fontSize = '14px';

      const isCompleted = matchingTask.status === 'completed';
      const isOverdue = new Date(matchingTask.deadline) < new Date();
      indicator.innerHTML = isCompleted ? '✅' : isOverdue ? '🚨' : '⏳';
      indicator.title = `FLOWFLLOW: ${matchingTask.task_name} - ${matchingTask.status}`;

      // Append to task item
      if (!item.querySelector('.flowfllow-indicator')) {
        item.appendChild(indicator);
      }
    }
  } catch (error) {
    console.error('FLOWFLLOW: Error processing Asana task', error);
  }
}

// Create styles dynamically
const styleElement = document.createElement('style');
styleElement.textContent = `
  .flowfllow-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    margin-left: 8px;
  }

  .flowfllow-badge.status-completed {
    background: #e8f5e9;
    color: #2e7d32;
  }

  .flowfllow-badge.status-pending {
    background: #fff3e0;
    color: #e65100;
  }

  .flowfllow-badge.status-overdue {
    background: #ffebee;
    color: #c62828;
  }

  .flowfllow-indicator {
    cursor: pointer;
    transition: transform 0.2s;
  }

  .flowfllow-indicator:hover {
    transform: scale(1.2);
  }
`;
document.head.appendChild(styleElement);
