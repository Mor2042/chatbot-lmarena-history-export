# LMArena Chat Exporter

A lightweight utility to export full conversations from **LMArena (Chatbot Arena)** when session limits block further interaction.

---

## Problem

LMArena has a **token limit per session**.  
Once reached:

- Server returns a **400 error**
- UI often becomes **locked / unresponsive**
- You can’t continue the same chat

The only workaround is to **start a new session and manually copy context** — which is slow and messy.

---

## Solution

This script automates the entire process:

- Extracts the full conversation
- Preserves model names and structure
- Handles hidden "thinking" blocks
- Outputs everything as clean Markdown

---

## Features

- **Full Context Scraping**  
  Captures the entire conversation from the current page.

- **DeepSeek / o1 Support**  
  Includes hidden or difficult-to-copy "Thinking" blocks.

- **Battle Mode Awareness**  
  Detects and labels models in Arena comparisons.

- **Markdown Export**  
  Generates a clean, ready-to-use `.md` output.

---

## How to Use

1. Open your chat on **lmarena.ai**
2. Open DevTools  
   - `F12` or `Ctrl + Shift + I`
3. Paste the script from `exporter.js`
4. Press **Enter**

➡️ A new tab will open where you can:
- Copy the Markdown
- Download the `.md` file

---

## 🔓 The Exporter Script

```javascript
(function() {
    'use strict';

    const EXPORTER_VERSION = "2.1.0";
    const GITHUB_REPO = "https://github.com/JoaoMRB/chatbot-lmarena-history-export";

    console.log(
        `%c LMArena Chat Exporter v${EXPORTER_VERSION} %c ${GITHUB_REPO} `,
        "color: #fff; background: #5b21b6; font-weight: bold; font-size: 12px; padding: 4px; border-radius: 4px 0 0 4px;",
        "color: #fff; background: #1e293b; font-weight: normal; font-size: 12px; padding: 4px; border-radius: 0 4px 4px 0;"
    );

    const Utils = {
        getTimestamp: () => new Date().toLocaleString(),
        cleanText: (text) => text ? text.trim().replace(/\n{3,}/g, '\n\n') : '',
        copy: async (text) => {
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text);
                    return true;
                }
            } catch (e) { console.error("Clipboard API failed", e); }
            return false;
        }
    };

    const Scraper = {
        getMode: () => {
            const modeEl = document.querySelector('button[role="combobox"] p, .text-base.font-normal');
            return modeEl ? modeEl.innerText.trim() : "Direct Chat";
        },
        getThought: (container) => {
            const thoughtBtn = Array.from(container.querySelectorAll('button')).find(b => 
                /thought|thinking|pensamento/i.test(b.textContent)
            );
            if (!thoughtBtn) return null;
            const ariaId = thoughtBtn.getAttribute('aria-controls');
            let content = ariaId ? document.getElementById(ariaId) : null;
            if (!content) {
                content = thoughtBtn.closest('div').querySelector('.thought-content, [class*="thought"]');
            }
            return content ? content.innerText.trim() : null;
        },
        getModelName: (container) => {
            const nameEl = container.querySelector('span.truncate, .model-name, font[color]');
            return nameEl ? nameEl.innerText.trim() : "Assistant";
        },
        getMessages: () => {
            const containers = Array.from(document.querySelectorAll('div.bg-surface-primary, div.bg-surface-raised, [class*="message"]'));
            const data = [];
            containers.forEach(c => {
                const prose = c.querySelector('.prose, .markdown');
                if (!prose) return;
                const isAssistant = c.innerHTML.includes('sticky') || c.querySelector('button svg') || c.innerText.includes('Model'); 
                const role = isAssistant ? 'assistant' : 'user';
                const content = Utils.cleanText(prose.innerText);
                if (content) {
                    data.push({
                        role,
                        content,
                        model: isAssistant ? Scraper.getModelName(c) : null,
                        thought: isAssistant ? Scraper.getThought(c) : null
                    });
                }
            });
            return data.filter((msg, i, self) => 
                i === 0 || JSON.stringify(msg) !== JSON.stringify(self[i - 1])
            );
        }
    };

    const UI = {
        renderMarkdown: (messages) => {
            let md = `# LMArena Chat Export\n\n`;
            md += `- **Date:** ${Utils.getTimestamp()}\n`;
            md += `- **Mode:** ${Scraper.getMode()}\n`;
            md += `- **Messages:** ${messages.length}\n\n---\n\n`;
            messages.forEach((m) => {
                if (m.role === 'user') {
                    md += `### 👤 User\n\n${m.content}\n\n`;
                } else {
                    md += `### 🤖 Assistant (${m.model})\n\n`;
                    if (m.thought) {
                        md += `> **Thought Process:**\n> ${m.thought.replace(/\n/g, '\n> ')}\n\n`;
                    }
                    md += `${m.content}\n\n`;
                }
                md += `---\n\n`;
            });
            md += `*Exported via LMArena Chat Exporter*\n*GitHub: ${GITHUB_REPO}*`;
            return md;
        },
        showExportPage: (markdown) => {
            const win = window.open('', '_blank');
            if (!win) {
                alert("Pop-up blocked! Please allow pop-ups or check the console for the output.");
                console.log(markdown);
                return;
            }
            win.document.write(`
                <html>
                <head>
                    <title>Chat Export - LMArena</title>
                    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                    <style>
                        body { background: #0f172a; color: #e2e8f0; font-family: ui-sans-serif, system-ui, sans-serif; }
                        pre { background: #1e293b; border: 1px solid #334155; padding: 20px; border-radius: 8px; white-space: pre-wrap; word-break: break-word; }
                        .btn { transition: all 0.2s; cursor: pointer; }
                        .btn:active { transform: scale(0.95); }
                        a { color: #818cf8; text-decoration: none; }
                        a:hover { text-decoration: underline; }
                    </style>
                </head>
                <body class="p-4 md:p-12">
                    <div class="max-w-4xl mx-auto">
                        <header class="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-slate-700 pb-6">
                            <div>
                                <h1 class="text-3xl font-bold text-white">Export Successful</h1>
                                <p class="text-slate-400 text-sm">Source: <a href="${GITHUB_REPO}" target="_blank">GitHub Repository</a></p>
                            </div>
                            <div class="flex gap-3">
                                <button id="copyBtn" class="btn bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-semibold shadow-lg">📋 Copy Markdown</button>
                                <button id="downloadBtn" class="btn bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-semibold shadow-lg">💾 Download .md</button>
                            </div>
                        </header>
                        <pre id="mdContent" class="shadow-2xl text-slate-300">${markdown.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</pre>
                        <footer class="mt-8 text-center text-slate-500 text-xs gap-2 flex flex-col">
                            <p>LMArena Chat Exporter Utility v${EXPORTER_VERSION}</p>
                            <p><a href="${GITHUB_REPO}" target="_blank">View on GitHub</a></p>
                        </footer>
                    </div>
                    <script>
                        const text = document.getElementById('mdContent').innerText;
                        document.getElementById('copyBtn').onclick = () => {
                            navigator.clipboard.writeText(text).then(() => {
                                const originalText = document.getElementById('copyBtn').innerText;
                                document.getElementById('copyBtn').innerText = '✅ Copied!';
                                setTimeout(() => document.getElementById('copyBtn').innerText = originalText, 2000);
                            });
                        };
                        document.getElementById('downloadBtn').onclick = () => {
                            const blob = new Blob([text], {type: 'text/markdown'});
                            const a = document.createElement('a');
                            a.href = URL.createObjectURL(blob);
                            a.download = 'lmarena-chat-\${Date.now()}.md';
                            a.click();
                        };
                    <\/script>
                </body>
                </html>
            `);
            win.document.close();
        }
    };

    async function run() {
        const messages = Scraper.getMessages();
        if (messages.length === 0) {
            alert("❌ No messages found. Make sure the chat is visible on your screen.");
            return;
        }
        const markdown = UI.renderMarkdown(messages);
        const success = await Utils.copy(markdown);
        if (success) {
            if(confirm("✅ Chat copied to clipboard!\\n\\nWould you like to open the formatted preview/download page?")) {
                UI.showExportPage(markdown);
            }
        } else {
            UI.showExportPage(markdown);
        }
    }
    run();
})();
```

## Compatibility

- **Browsers:** Chrome, Edge, Brave, Firefox  
- **Platform:** LMArena (Chatbot Arena)

---

## Limitations

- Text-only export  
- Images and uploaded files are **not supported**

---

## Disclaimer

This is a **community-made tool** and is **not affiliated with LMSYS or LMArena**.

- Use only for **personal backups**
- May break if the site layout changes
