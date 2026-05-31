// Service worker for FLOWFLLOW extension

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getTaskStatus') {
    getTaskStatus(request.taskName).then(sendResponse);
    return true; // Indicates we'll send response asynchronously
  }

  if (request.type === 'getSummary') {
    getSummary().then(sendResponse);
    return true;
  }
});

async function getTaskStatus(taskName) {
  try {
    const { apiUrl } = await chrome.storage.local.get(['apiUrl']);
    const url = apiUrl || 'http://localhost:3000';

    const response = await fetch(`${url}/api/action-items`);
    const tasks = await response.json();

    const matchingTask = tasks.find(t =>
      t.task_name.toLowerCase().includes(taskName.toLowerCase()) ||
      taskName.toLowerCase().includes(t.task_name.toLowerCase())
    );

    if (matchingTask) {
      return {
        found: true,
        status: matchingTask.status,
        deadline: matchingTask.deadline,
        assignedTo: matchingTask.assigned_to,
        verificationStage: matchingTask.ai_verification_stage,
      };
    }

    return { found: false };
  } catch (error) {
    console.error('FLOWFLLOW: Error fetching task status', error);
    return { error: error.message };
  }
}

async function getSummary() {
  try {
    const { apiUrl } = await chrome.storage.local.get(['apiUrl']);
    const url = apiUrl || 'http://localhost:3000';

    const response = await fetch(`${url}/api/dashboard/summary`);
    const data = await response.json();

    return {
      totalTasks: data.globalStats.totalTasks,
      completedTasks: data.globalStats.completedTasks,
      completionRate: (
        (data.globalStats.completedTasks / data.globalStats.totalTasks) * 100
      ).toFixed(1),
      overdueCount: data.overdue.length,
      teamSize: data.team.length,
    };
  } catch (error) {
    console.error('FLOWFLLOW: Error fetching summary', error);
    return { error: error.message };
  }
}

// Periodic sync to check for overdue items
chrome.alarms.create('checkOverdue', { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkOverdue') {
    checkOverdueItems();
  }
});

async function checkOverdueItems() {
  try {
    const { apiUrl } = await chrome.storage.local.get(['apiUrl']);
    const url = apiUrl || 'http://localhost:3000';

    const response = await fetch(`${url}/api/tasks/overdue`);
    const overdueItems = await response.json();

    if (overdueItems.length > 0) {
      // Create notification badge
      chrome.action.setBadgeText({ text: overdueItems.length.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#c62828' });

      // Show notification
      chrome.notifications.create('flowfllow-overdue', {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'FLOWFLLOW - Overdue Tasks',
        message: `You have ${overdueItems.length} overdue action items`,
      });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  } catch (error) {
    console.error('FLOWFLLOW: Error checking overdue items', error);
  }
}

// Clear badge on extension popup open
chrome.action.onClicked.addListener(() => {
  chrome.action.setBadgeText({ text: '' });
});
