(function() {
    'use strict';

    const EXPORTER_VERSION = "2.2.0";
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
                alert("Pop-up blocked! Please allow pop-ups.");
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
                                <p class="text-slate-400 text-sm">Source: <a href="${GITHUB_REPO}" target="_blank">GitHub</a></p>
                            </div>
                            <div class="flex flex-wrap justify-center gap-3">
                                <button id="copyBtn" class="btn bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-semibold shadow-lg">📋 Copy Markdown</button>
                                <button id="downloadMdBtn" class="btn bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-semibold shadow-lg">💾 Download .md</button>
                                <button id="downloadTxtBtn" class="btn bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-lg font-semibold shadow-lg">📄 Download .txt</button>
                            </div>
                        </header>
                        <pre id="mdContent" class="shadow-2xl text-slate-300">${markdown.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</pre>
                    </div>
                    <script>
                        const text = document.getElementById('mdContent').innerText;
                        const fileName = 'lmarena-chat-' + Date.now();

                        document.getElementById('copyBtn').onclick = () => {
                            navigator.clipboard.writeText(text).then(() => {
                                const btn = document.getElementById('copyBtn');
                                const originalText = btn.innerText;
                                btn.innerText = '✅ Copied!';
                                setTimeout(() => btn.innerText = originalText, 2000);
                            });
                        };

                        document.getElementById('downloadMdBtn').onclick = () => {
                            const blob = new Blob([text], {type: 'text/markdown'});
                            const a = document.createElement('a');
                            a.href = URL.createObjectURL(blob);
                            a.download = fileName + '.md';
                            a.click();
                        };

                        document.getElementById('downloadTxtBtn').onclick = () => {
                            // Limpa os símbolos de Markdown para um TXT mais puro
                            const txtContent = text.replace(/#{1,6}\s/g, '').replace(/\\*\\*/g, '');
                            const blob = new Blob([txtContent], {type: 'text/plain'});
                            const a = document.createElement('a');
                            a.href = URL.createObjectURL(blob);
                            a.download = fileName + '.txt';
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
            alert("❌ No messages found.");
            return;
        }
        const markdown = UI.renderMarkdown(messages);
        const success = await Utils.copy(markdown);
        if (success) {
            if(confirm("✅ Chat copied to clipboard!\n\nWould you like to open the formatted preview/download page?")) {
                UI.showExportPage(markdown);
            }
        } else {
            UI.showExportPage(markdown);
        }
    }

    run();
})();
