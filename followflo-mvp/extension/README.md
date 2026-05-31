# FLOWFLLOW Browser Extension

A browser extension that brings FLOWFLLOW action item tracking directly into Notion, Asana, and other productivity tools.

## Features

- **Notion Integration**: See FLOWFLLOW completion status badges directly in Notion database rows
- **Asana Integration**: Track action items within Asana task lists
- **Popup Dashboard**: Quick access to recent tasks and team statistics
- **Real-time Updates**: Automatic sync with FLOWFLLOW backend
- **Overdue Alerts**: Notifications for overdue action items
- **Customizable API URL**: Connect to any FLOWFLLOW instance

## Installation

### Chrome/Edge
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension` folder
5. The FLOWFLLOW icon will appear in your toolbar

### Firefox
1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select any file from the `extension` folder
4. The FLOWFLLOW icon will appear in your toolbar

## Configuration

1. Click the FLOWFLLOW icon in your toolbar
2. In the popup, enter your FLOWFLLOW API server URL (default: `http://localhost:3000`)
3. Click "Save"

## How It Works

### Notion Integration
- Automatically detects task database rows
- Adds status indicators:
  - ✅ Completed tasks
  - ⏳ Pending tasks
  - 🚨 Overdue tasks
- Hover over badges to see full task details

### Asana Integration
- Monitors task lists for action items
- Displays inline status icons
- Shows task completion percentage
- Syncs with FLOWFLLOW completion proofs

### Popup Dashboard
- View recent pending tasks
- See team completion statistics
- Check overall project progress
- Quick access to task details

## Status Indicators

| Icon | Status | Color |
|------|--------|-------|
| ✅ | Completed | Green |
| ⏳ | Pending | Orange |
| 🚨 | Overdue | Red |

## Architecture

```
extension/
├── manifest.json         # Extension configuration
├── popup.html           # Popup UI
├── popup.js             # Popup logic
├── background.js        # Service worker
├── content-script.js    # Notion/Asana integration
├── styles.css           # Styling
├── icons/               # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## API Endpoints Used

- `GET /api/action-items` - Fetch all action items
- `GET /api/dashboard/summary` - Get overall statistics
- `GET /api/tasks/overdue` - Get overdue items
- `GET /api/completion-proofs/:actionItemId` - Get completion proofs

## Development

### Testing the Extension

1. Make sure FLOWFLLOW backend is running on `http://localhost:3000`
2. Load the extension in Chrome DevTools
3. Open a Notion or Asana page
4. You should see status badges appear on tasks

### Debugging

1. Right-click the extension icon → "Manage extension"
2. Click "Service worker" to view console logs
3. Use the browser DevTools to inspect content script behavior

## Permissions

The extension requests the following permissions:

- `activeTab`: Access current tab information
- `scripting`: Inject content scripts
- `storage`: Store API configuration
- Host permissions: Access to Notion, Asana, Slack, and FLOWFLLOW backend

## Future Enhancements

- [ ] Google Calendar integration
- [ ] Slack message status sync
- [ ] Drag-and-drop task reorganization
- [ ] Batch completion marking
- [ ] Custom status indicators
- [ ] Dark mode support
- [ ] Multi-language support
