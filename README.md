# Text Editor - A browser based notepad

A lightweight, vanilla JavaScript web application for creating, managing, and formatting text documents. This project focuses on simplicity, data persistence via Local Storage, and a clean, responsive user interface.
Try it out at budross.github.io/Text-Editor

## Features

### Document Management
- **Multi-Document Support**: Create and manage multiple documents through a dedicated sidebar.
- **CRUD Operations**: Effortlessly create, read, and delete documents.
- **Auto-Save**: Every change to the title or content is automatically saved to Local Storage every second.
- **Last Modified Tracking**: Documents are sorted by their last modified timestamp, and the relative time (e.g., "Just now", "5 mins ago") is displayed in the list.

### Rich Text Editing
- **Formatting Controls**: Toggle **Bold** and *Italic* text using a custom implementation that ensures consistent behavior even when starting a new document.
- **Smart Formatting**: Uses a zero-width space (`\u200B`) strategy to maintain formatting state in empty editable containers.
- **Font Scaling**: Adjust the editor's font size (Small, Medium, Large) to suit your preference.

### UI Customization
- **Dynamic Themes**: Choose a custom header color. The application automatically calculates a muted version of your chosen color for the overall page background to maintain visual harmony.
- **Responsive Design**: Includes a layout that adapts for mobile devices, including a collapsible-style sidebar logic.
- **Interactive UI**: Active documents are highlighted in the sidebar using your chosen accent color.

## Technical Details

### Technologies Used
- **HTML**: Semantic structure and `contenteditable` regions for the editor.
- **CSS**: Custom properties (CSS variables), Flexbox, and Fixed positioning for the sidebar/footer layout.
- **Vanilla JavaScript**: All logic is handled without third-party frameworks or libraries.
- **Web Storage API**: Utilizes `localStorage` for persistent data storage across sessions.

## Getting Started

1.  Clone or download the repository.
2.  Open `TextEditor.html` in any modern web browser.
3.  Start typing! Your progress is saved automatically.

## Project Structure

- `TextEditor.html`: The main entry point and structure.
- `app.js`: Core logic, state management, and event handling.
- `style.css`: All layout and component styling.
