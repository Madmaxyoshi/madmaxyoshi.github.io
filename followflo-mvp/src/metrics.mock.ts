// Mock metrics for testing UI without real data

export async function getCompletionMetrics(userId: string) {
  return {
    user_id: userId,
    completion_rate: Math.random() * 100,
    completed_tasks: Math.floor(Math.random() * 20),
    total_tasks: Math.floor(Math.random() * 30) + 10,
    average_completion_days: Math.floor(Math.random() * 30) + 5,
  };
}

export async function getTeamMetrics() {
  return [
    {
      user_id: 'user1',
      completion_rate: 85.5,
      completed_tasks: 17,
      total_tasks: 20,
    },
    {
      user_id: 'user2',
      completion_rate: 72.3,
      completed_tasks: 21,
      total_tasks: 29,
    },
    {
      user_id: 'user3',
      completion_rate: 65.8,
      completed_tasks: 16,
      total_tasks: 25,
    },
    {
      user_id: 'user4',
      completion_rate: 91.2,
      completed_tasks: 31,
      total_tasks: 34,
    },
  ];
}

export async function getOverdueItems() {
  return [
    {
      task_name: 'レポート提出',
      deadline: new Date(Date.now() - 3*24*60*60*1000),
      assigned_to: 'user1',
      days_overdue: 3,
    },
    {
      task_name: '品質監査',
      deadline: new Date(Date.now() - 1*24*60*60*1000),
      assigned_to: 'user2',
      days_overdue: 1,
    },
  ];
}
