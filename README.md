# TakeWebNotes

TakeWebNotes is a fast, lightweight, and offline-capable Chrome extension that revolutionizes how you take notes while browsing. Instead of a messy, global notepad, it acts as a context-aware workspace, automatically tying your notes and task lists to the specific website or web app you are currently visiting.

## Features

* **Context-Aware Workspaces:** Automatically detects your active tab (e.g., github.com or youtube.com) and instantly loads the workspace dedicated to that domain.
* **Smart URL Parsing:** Intelligently separates complex web apps. (e.g., docs.google.com/document and docs.google.com/spreadsheets get their own distinct workspaces).
* **Persistent Side Panel:** Built using Chrome's Side Panel API, allowing you to read webpages and take notes simultaneously without the UI closing when you click away.
* **Global Dropdown Switcher:** Easily access and manage notes from any website using the "All Websites" view.
* **Instant Auto-Save:** Notes and tasks are saved in real-time. 
* **Seamless Cloud Syncing:** Uses Chrome's native chrome.storage.sync to back up and sync your notes across any device where you are logged into your browser.
* **Distraction-Free UI:** Clean, single-column layout with automatic Light & Dark mode support.

## Installation (Developer Mode)

If you want to load this extension locally for testing or development:

1. Clone or download this repository to your local machine.
2. Open Google Chrome and navigate to chrome://extensions/.
3. Enable Developer mode using the toggle switch in the top right corner.
4. Click the Load unpacked button in the top left.
5. Select the TakeWebNotes folder containing the manifest.json file.
6. The extension is now installed. Click the extension icon in your browser toolbar to open the side panel.

## Privacy & Security

TakeWebNotes is built with privacy as the core foundation:
* **100% Offline Capable:** The extension does not connect to any external databases, analytics trackers, or third-party servers.
* **No Telemetry:** We do not track your clicks, keystrokes, or browsing habits.
* **Local Data Only:** Your notes are stored entirely on your local machine and synced only via your personal, secure Google Chrome Sync account.

## Tech Stack

* Vanilla JavaScript (ES6+)
* HTML5 / Custom CSS
* Chrome Extension API (Manifest V3)
  * chrome.sidePanel
  * chrome.storage.sync
  * chrome.tabs
