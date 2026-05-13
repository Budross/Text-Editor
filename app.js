// ========== STATE ==========

let currentDocumentId = null;
let documents = [];
let isBoldActive = false;
let isItalicActive = false;

// Constants
const ZERO_WIDTH_SPACE = '\u200B';
const MINUTE = 60000;
const HOUR = 3600000;
const DAY = 86400000;
const WEEK = 604800000;
const DEFAULT_HEADER_COLOR = '#5b7c99';

// ========== INITIALIZATION ==========

function init() {
  migrateOldData();
  loadDocuments();

  if (documents.length === 0) {
    createNewDocument();
  } else {
    loadDocument(documents[0].id);
  }

  renderDocumentList();
  setupEventListeners();
  loadUserPreferences();
  startAutoSave();
}

// ========== DATA MIGRATION ==========

function migrateOldData() {
  const oldTitle = localStorage.getItem('title');
  const oldText = localStorage.getItem('text');

  if ((oldTitle || oldText) && !localStorage.getItem('documents')) {
    documents = [{
      id: generateId(),
      title: oldTitle || 'Text Editor by Brandon Ross',
      content: oldText || 'This text is automatically saved every second. You can format your text using the buttons in the menu below. Enjoy!',
      lastModified: Date.now(),
      headerColor: localStorage.getItem('headerColor') || DEFAULT_HEADER_COLOR
    }];

    saveDocuments();
    localStorage.removeItem('title');
    localStorage.removeItem('text');
  }
}

// ========== DOCUMENT CRUD ==========

function generateId() {
  return `doc_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function loadDocuments() {
  const stored = localStorage.getItem('documents');
  if (!stored) return;

  try {
    documents = JSON.parse(stored);

    // Add default headerColor to documents missing it
    const needsSave = documents.some(doc => {
      if (!doc.headerColor) {
        doc.headerColor = DEFAULT_HEADER_COLOR;
        return true;
      }
      return false;
    });

    documents.sort((a, b) => b.lastModified - a.lastModified);

    if (needsSave) saveDocuments();
  } catch (e) {
    console.error('Error loading documents:', e);
    documents = [];
  }
}

function saveDocuments() {
  try {
    localStorage.setItem('documents', JSON.stringify(documents));
  } catch (e) {
    console.error('Error saving documents:', e);
  }
}

function createNewDocument() {
  const newDoc = {
    id: generateId(),
    title: 'Untitled Document',
    content: ' ',
    lastModified: Date.now(),
    headerColor: DEFAULT_HEADER_COLOR
  };

  documents.unshift(newDoc);
  saveDocuments();
  loadDocument(newDoc.id);
  renderDocumentList();
  document.getElementById('heading').focus();
}

function loadDocument(docId) {
  const doc = documents.find(d => d.id === docId);
  if (!doc) {
    console.error('Document not found:', docId);
    return;
  }

  currentDocumentId = docId;

  document.getElementById('heading').innerHTML = doc.title;
  document.getElementById('content').innerHTML = doc.content || ' ';

  const headerColor = doc.headerColor || DEFAULT_HEADER_COLOR;
  changeHeaderColor(headerColor, false);
  document.getElementById('header-color').value = headerColor;

  renderDocumentList();
}

function saveCurrentDocument() {
  if (!currentDocumentId) return;

  const doc = documents.find(d => d.id === currentDocumentId);
  if (!doc) return;

  const title = document.getElementById('heading').innerHTML;
  const content = document.getElementById('content').innerHTML;
  const headerColorHex = rgbToHex(document.getElementById('heading').style.backgroundColor) 
                         || doc.headerColor 
                         || DEFAULT_HEADER_COLOR;

  if (doc.title === title && doc.content === content && doc.headerColor === headerColorHex) {
    return; // Nothing changed
  }

  doc.title = title || 'Untitled Document';
  doc.content = content;
  doc.headerColor = headerColorHex;
  doc.lastModified = Date.now();

  documents.sort((a, b) => b.lastModified - a.lastModified);
  saveDocuments();
  renderDocumentList();
}

function deleteDocument(doc) {
  if (documents.length <= 1) {
    alert('Cannot delete the last document.');
    return;
  }

  documents = documents.filter(d => d !== doc);
  saveDocuments();

  if (currentDocumentId === doc.id) {
    loadDocument(documents[0].id);
  }

  renderDocumentList();
}

// ========== UI RENDERING ==========

function renderDocumentList() {
  const listContainer = document.getElementById('document-list');

  if (documents.length === 0) {
    listContainer.innerHTML = '<div class="empty-state">No documents yet. Click + to create one.</div>';
    return;
  }

  listContainer.innerHTML = '';

  documents.forEach(doc => {
    const isActive = doc.id === currentDocumentId;
    const item = createDocumentItem(doc, isActive);
    listContainer.appendChild(item);
  });
}

function createDocumentItem(doc, isActive) {
  const item = document.createElement('div');
  item.className = `document-item ${isActive ? 'active' : ''}`;

  if (isActive && doc.headerColor) {
    item.style.backgroundColor = doc.headerColor;
  }

  const titleEl = document.createElement('p');
  titleEl.className = 'document-title';
  titleEl.textContent = stripHtml(doc.title) || 'Untitled Document';

  const metaEl = document.createElement('p');
  metaEl.className = 'document-meta';
  metaEl.textContent = formatDate(doc.lastModified);

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'document-delete-btn';
  deleteBtn.textContent = '×';
  deleteBtn.title = 'Delete document';
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteDocument(doc);
  });

  item.addEventListener('click', () => loadDocument(doc.id));

  item.appendChild(titleEl);
  item.appendChild(metaEl);
  item.appendChild(deleteBtn);

  return item;
}

// ========== EVENT LISTENERS ==========

function setupEventListeners() {
  document.getElementById('new-doc-btn').addEventListener('click', createNewDocument);

  // Font size
  document.getElementById('font-size').addEventListener('change', (e) => {
    changeFontSize(e.target.value);
  });

  // Bold/Italic (use mousedown to preserve text selection)
  document.getElementById('bold-btn').addEventListener('mousedown', (e) => {
    e.preventDefault();
    toggleFormatting('bold');
  });

  document.getElementById('italic-btn').addEventListener('mousedown', (e) => {
    e.preventDefault();
    toggleFormatting('italic');
  });

  document.getElementById('hr-btn').addEventListener('click', () => {
    const contentDiv = document.getElementById('content');
    document.execCommand('insertHorizontalRule', false, null);
  });

  // Header color picker
  const colorPicker = document.getElementById('header-color');
  colorPicker.addEventListener('input', (e) => changeHeaderColor(e.target.value));
  colorPicker.addEventListener('change', (e) => changeHeaderColor(e.target.value));

  // Apply formatting BEFORE character is inserted (keydown fires before the character appears)
  document.getElementById('content').addEventListener('keydown', (e) => {
    // Only handle printable characters (length 1), ignore control keys
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      syncFormattingState();
    }
  });

  document.getElementById('content-width').addEventListener('change', (e) => {
    const width = e.target.value;
    document.querySelector('.main-content').style.setProperty('--contentWidth', width);
    // Persist to local storage
    localStorage.setItem('contentWidth', width);
  });



  // Re-insert formatted zero-width space when content is deleted but formatting is still active
  document.getElementById('content').addEventListener('input', () => {
    const contentDiv = document.getElementById('content');
    const isEmpty = contentDiv.textContent.trim() === '' || contentDiv.textContent === ZERO_WIDTH_SPACE;
    
    if (isEmpty && (isBoldActive || isItalicActive)) {
      if (isBoldActive) {
        insertFormattedZeroWidthSpace(contentDiv, true, isItalicActive);
      } else {
        insertFormattedZeroWidthSpace(contentDiv, false, false);
      }
    }
  });
}

function syncFormattingState() {
  const currentBold = document.queryCommandState('bold');
  const currentItalic = document.queryCommandState('italic');

  if (isBoldActive !== currentBold) {
    document.execCommand('bold', false, null);
  }
  if (isItalicActive !== currentItalic) {
    document.execCommand('italic', false, null);
  }
}

// ========== FORMATTING CONTROLS ==========

function changeFontSize(size) {
  document.getElementById('content').style.fontSize = size + 'px';
  localStorage.setItem('fontSize', size);
}

function toggleFormatting(type) {
  const isBold = type === 'bold';
  const btnId = isBold ? 'bold-btn' : 'italic-btn';
  const tag = isBold ? 'b' : 'i';

  // Toggle state
  if (isBold) {
    isBoldActive = !isBoldActive;
  } else {
    isItalicActive = !isItalicActive;
  }

  const isActive = isBold ? isBoldActive : isItalicActive;
  const otherIsActive = isBold ? isItalicActive : isBoldActive;

  // Update button
  document.getElementById(btnId).classList.toggle('active', isActive);

  const contentDiv = document.getElementById('content');
  const selection = window.getSelection();

  // Apply to selection if text is selected
  if (selection && selection.toString().length > 0) {
    document.execCommand(type, false, null);
    contentDiv.focus();
    return;
  }

  // For collapsed selection (no text selected), insert zero-width space inside formatting tags
  if (isActive) {
    insertFormattedZeroWidthSpace(contentDiv, isBold, otherIsActive);
  }

  contentDiv.focus();
}

function insertFormattedZeroWidthSpace(contentDiv, isBold, otherIsActive) {
  const tag = isBold ? 'b' : 'i';
  
  // Create the formatted element with zero-width space
  let html;
  if (otherIsActive) {
    // Both formats active - nest the tags
    html = isBold ? `<b><i>${ZERO_WIDTH_SPACE}</i></b>` : `<i><b>${ZERO_WIDTH_SPACE}</b></i>`;
  } else {
    html = `<${tag}>${ZERO_WIDTH_SPACE}</${tag}>`;
  }

  // If content is empty or just whitespace, replace it entirely
  if (contentDiv.textContent.trim() === '') {
    contentDiv.innerHTML = html;
    positionCursorAfterZeroWidthSpace(contentDiv, otherIsActive);
    return;
  }

  // Otherwise, insert at current cursor position
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  range.deleteContents();

  // Create a temporary container to parse the HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;
  const formattedNode = temp.firstChild;

  range.insertNode(formattedNode);

  // Position cursor after the zero-width space (inside the formatted element)
  const newRange = document.createRange();
  let textNode = formattedNode;
  
  // Navigate to the innermost text node
  while (textNode.firstChild) {
    textNode = textNode.firstChild;
  }
  
  newRange.setStartAfter(textNode);
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);
}

function positionCursorAfterZeroWidthSpace(contentDiv, otherIsActive) {
  const range = document.createRange();
  const sel = window.getSelection();
  
  // Navigate to the innermost text node
  let targetNode = contentDiv.firstChild;
  while (targetNode.firstChild) {
    targetNode = targetNode.firstChild;
  }
  
  // Position after the zero-width space
  range.setStart(targetNode, 1);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

function changeHeaderColor(color, shouldSave = true) {
  document.getElementById('heading').style.backgroundColor = color;
  updateMutedBackground(color);
  document.documentElement.style.setProperty('--button-bg-color', color);

  if (shouldSave && currentDocumentId) {
    const doc = documents.find(d => d.id === currentDocumentId);
    if (doc) {
      doc.headerColor = color;
      saveDocuments();
      renderDocumentList();
    }
  }

  if (shouldSave) {
    localStorage.setItem('headerColor', color);
  }
}

function loadUserPreferences() {
  const savedFontSize = localStorage.getItem('fontSize');
  if (savedFontSize) {
    document.getElementById('content').style.fontSize = savedFontSize + 'px';
    document.getElementById('font-size').value = savedFontSize;
  }

  const savedHeaderColor = localStorage.getItem('headerColor');
  if (savedHeaderColor && currentDocumentId) {
    const doc = documents.find(d => d.id === currentDocumentId);
    if (doc && !doc.headerColor) {
      doc.headerColor = savedHeaderColor;
    }
  }
}

// ========== COLOR UTILITIES ==========

function hexToRgb(hex) {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) return null;
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16)
  };
}

function rgbToHex(rgb) {
  if (!rgb) return null;

  if (typeof rgb === 'string') {
    if (rgb.startsWith('#')) return rgb;

    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (match) {
      const [, r, g, b] = match.map(Number);
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
  }
  return null;
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: l * 100 };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    case b: h = ((r - g) / d + 4) / 6; break;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;

  if (s === 0) {
    const gray = Math.round(l * 255);
    return { r: gray, g: gray, b: gray };
  }

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1/3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1/3) * 255)
  };
}

function getMutedColor(hexColor) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return '#f0f0f0';

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.l = 92;
  hsl.s = Math.min(hsl.s, 30);

  const mutedRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(`rgb(${mutedRgb.r}, ${mutedRgb.g}, ${mutedRgb.b})`);
}

function updateMutedBackground(headerColor) {
  const mutedColor = getMutedColor(headerColor);
  document.body.style.backgroundColor = mutedColor;
  document.documentElement.style.setProperty('--muted-bg-color', mutedColor);
}

// ========== UTILITY FUNCTIONS ==========

function formatDate(timestamp) {
  const diff = Date.now() - timestamp;

  if (diff < MINUTE) return 'Just now';
  if (diff < HOUR) {
    const mins = Math.floor(diff / MINUTE);
    return `${mins} min${mins > 1 ? 's' : ''} ago`;
  }
  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  if (diff < WEEK) {
    const days = Math.floor(diff / DAY);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  return new Date(timestamp).toLocaleDateString();
}

function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

// ========== AUTO-SAVE ==========

function startAutoSave() {
  setInterval(saveCurrentDocument, 1000);
  setInterval(renderDocumentList, 10000);
}

// ========== START APP ==========

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}