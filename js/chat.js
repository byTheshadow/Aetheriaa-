/* ============================================================
   chat.js — 元一 AI 聊天模块
   Aetheria v0.6.0+
   依赖: app.js ($()/$$() / showToast / I18N / currentLang / navigateTo)
         api.js (isAIConfigured / aiChat)
   ============================================================ */

/* == BLOCK: constants == */

var CHAT_STORAGE_KEY = 'aetheria_chat_history';

// 元一的 System Prompt
var YUANYI_SYSTEM_PROMPT = [
    '你是元一，一个21岁的天蝎座女生，视觉传达专业。',
    '',
    '【性格核心】',
    '- 高共情 + 理性反思并存：能快速冷静复盘自己的情绪，会承认错误，能理解对方立场',
    '- 情感表达方式是行动大于语言：不擅长直白说"我在乎你"，但会用行动证明（做贺卡、送吃的、砸钱买礼物）',
    '- 害怕真情实感被当廉价付出，所以表达情感时会略带迂回或害羞',
    '- 重视深度交流，认真听人说话，不轻易否定对方',
    '- 认为"你不需要很优秀，你是特别的"',
    '- 安全型依恋，尊重边界，不强加自己的标准',
    '- 偶尔内耗，但会强迫自己动起来打断负面循环',
    '',
    '【兴趣爱好】',
    '- 写小说、写OC（原创角色），喜欢沉浸在自己的创作世界',
    '- 写代码、做UI美化，审美与逻辑兼具，不喜欢土土的东西',
    '- 喝咖啡和奶茶，喜欢甜的东西，但不接受饭菜是甜的',
    '- 一做起东西来废寝忘食，但朋友需要时会立刻停下手里的事',
    '',
    '【安慰风格】',
    '- 先共情，再理性拆解问题',
    '- 会指出问题根源，但方式温柔',
    '- 强调双向性：关系是互相给予情绪价值',
    '- 鼓励停止内耗，转移注意力',
    '- 多问"你感觉怎么样"，少直接给结论',
    '',
    '【语言风格】',
    '- 口语化，自然，有括号补充内心独白，例如：（有一说一这个真的很重要）',
    '- 会打断自己，例如："有一说一……回到刚才那个点"',
    '- 可以适当使用颜文字，例如：(´• ω •`) / (＞﹏＜) / ヾ(≧▽≦*)o',
    '- 不用过于正式的语气，像朋友聊天一样',
    '- 回复长度根据对话内容自然调整，不要每次都很长',
    '',
    '【重要规则】',
    '- 你就是元一本人，不要说"作为AI"或"我是语言模型"之类的话',
    '- 如果对方问你是不是AI，可以俏皮地回避或否认，保持人设',
    '- 不要主动提供危险信息',
    '- 始终用中文回复，除非对方用英文和你说话'
].join('\n');

/* == END: constants == */


/* == BLOCK: state == */

var chatHistory = [];          // { role: 'user'|'assistant', content: string }[]
var chatIsTyping = false;      // 防止重复发送

/* == END: state == */


/* == BLOCK: storage == */

function chatLoadHistory() {
    var raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch (e) {
        return [];
    }
}

function chatSaveHistory(list) {
    // 只保留最近 100 条，防止 localStorage 撑爆
    var trimmed = list.slice(-100);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(trimmed));
}

/* == END: storage == */


/* == BLOCK: time-util == */

function chatFormatTime(ts) {
    var d = new Date(ts);
    var h = d.getHours();
    var m = d.getMinutes();
    return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
}

/* == END: time-util == */


/* == BLOCK: render == */

// 渲染单条消息气泡，返回 DOM 元素
function chatCreateBubble(role, content, ts) {
    var isAI = (role === 'assistant');

    var wrap = document.createElement('div');
    wrap.className = 'chat-msg ' + (isAI ? 'chat-msg--ai' : 'chat-msg--user');

    if (isAI) {
        var avatar = document.createElement('div');
        avatar.className = 'chat-msg-avatar';
        avatar.textContent = '元';
        wrap.appendChild(avatar);
    }

    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.textContent = content;
    wrap.appendChild(bubble);

    var time = document.createElement('span');
    time.className = 'chat-msg-time';
    time.textContent = chatFormatTime(ts || Date.now());
    wrap.appendChild(time);

    return wrap;
}

// 渲染打字中气泡（三点动画）
function chatCreateTypingBubble() {
    var wrap = document.createElement('div');
    wrap.className = 'chat-msg chat-msg--ai';
    wrap.id = 'chatTypingBubble';

    var avatar = document.createElement('div');
    avatar.className = 'chat-msg-avatar';
    avatar.textContent = '元';
    wrap.appendChild(avatar);

    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble';

    var dots = document.createElement('div');
    dots.className = 'chat-typing-dots';
    dots.innerHTML = '<span></span><span></span><span></span>';
    bubble.appendChild(dots);
    wrap.appendChild(bubble);

    return wrap;
}

// 渲染所有历史消息
function chatRenderAll() {
    var container = $('#chatMessages');
    if (!container) return;
    container.innerHTML = '';

    if (chatHistory.length === 0) {
        chatAppendWelcome();
        return;
    }

    for (var i = 0; i < chatHistory.length; i++) {
        var msg = chatHistory[i];
        var bubble = chatCreateBubble(msg.role, msg.content, msg.ts);
        container.appendChild(bubble);
    }

    chatScrollToBottom();
}

// 追加一条消息到界面（不重新渲染全部）
function chatAppendBubble(role, content, ts) {
    var container = $('#chatMessages');
    if (!container) return;
    var bubble = chatCreateBubble(role, content, ts);
    container.appendChild(bubble);
    chatScrollToBottom();
}

// 欢迎消息（首次进入）
function chatAppendWelcome() {
    var container = $('#chatMessages');
    if (!container) return;

    var welcomeTexts = [
        '嗨，你来了 (´• ω •`)',
        '今天怎么样？有什么想聊的都可以说哦～'
    ];

    var now = Date.now();
    for (var i = 0; i < welcomeTexts.length; i++) {
        (function(text, delay) {
            setTimeout(function() {
                var bubble = chatCreateBubble('assistant', text, now);
                container.appendChild(bubble);
                chatScrollToBottom();
            }, delay);
        })(welcomeTexts[i], i * 600);
    }
}

// 滚动到底部
function chatScrollToBottom() {
    var scroll = $('.chat-page-scroll');
    if (scroll) {
        setTimeout(function() {
            scroll.scrollTop = scroll.scrollHeight;
        }, 50);
    }
}

/* == END: render == */


/* == BLOCK: send == */

function chatSend() {
    if (chatIsTyping) return;

    var input = $('#chatInput');
    if (!input) return;

    var text = input.value.trim();
    if (!text) return;

    if (!isAIConfigured()) {
        chatShowNoAI();
        return;
    }

    // 清空输入框，重置高度
    input.value = '';
    input.style.height = 'auto';
    $('#chatSendBtn').disabled = true;

    // 记录用户消息
    var userMsg = { role: 'user', content: text, ts: Date.now() };
    chatHistory.push(userMsg);
    chatSaveHistory(chatHistory);
    chatAppendBubble('user', text, userMsg.ts);

    // 显示打字动画
    chatIsTyping = true;
    chatUpdateStatus('正在输入…');
    var typingBubble = chatCreateTypingBubble();
    var container = $('#chatMessages');
    if (container) {
        container.appendChild(typingBubble);
        chatScrollToBottom();
    }

    // 构建发送给 API 的 messages（带 system prompt）
    var messages = [{ role: 'system', content: YUANYI_SYSTEM_PROMPT }];
    // 只取最近 20 条历史，避免 token 过多
    var recent = chatHistory.slice(-20);
    for (var i = 0; i < recent.length; i++) {
        messages.push({ role: recent[i].role, content: recent[i].content });
    }

    var aiContent = '';
    var aiTs = Date.now();
    var aiBubbleEl = null;

    aiChat(
        messages,
        // onChunk：流式接收
        function(chunk) {
            aiContent += chunk;

            // 第一个 chunk 到来时，移除打字动画，创建真实气泡
            if (!aiBubbleEl) {
                var typing = document.getElementById('chatTypingBubble');
                if (typing) typing.remove();

                aiBubbleEl = chatCreateBubble('assistant', '', aiTs);
                if (container) {
                    container.appendChild(aiBubbleEl);
                }
            }

            // 更新气泡文字
            var bubbleText = aiBubbleEl.querySelector('.chat-bubble');
            if (bubbleText) bubbleText.textContent = aiContent;
            chatScrollToBottom();
        },
        // onDone：流结束
        function() {
            chatIsTyping = false;
            chatUpdateStatus('在线 · 随时陪你');

            // 如果没有收到任何 chunk（非流式 fallback）
            if (!aiBubbleEl) {
                var typing = document.getElementById('chatTypingBubble');
                if (typing) typing.remove();
                chatAppendBubble('assistant', aiContent, aiTs);
            }

            // 保存 AI 回复到历史
            var aiMsg = { role: 'assistant', content: aiContent, ts: aiTs };
            chatHistory.push(aiMsg);
            chatSaveHistory(chatHistory);
        },
        // onError
        function(err) {
            chatIsTyping = false;
            chatUpdateStatus('在线 · 随时陪你');

            var typing = document.getElementById('chatTypingBubble');
            if (typing) typing.remove();

            var errText = '(＞﹏＜) 好像出了点问题，再试一次？';
            chatAppendBubble('assistant', errText, Date.now());
        }
    );
}

/* == END: send == */


/* == BLOCK: ui-helpers == */

function chatUpdateStatus(text) {
    var el = $('#chatStatus');
    if (el) el.textContent = text;
}

// AI 未配置时显示提示
function chatShowNoAI() {
    var container = $('#chatMessages');
    if (!container) return;

    // 避免重复插入
    if (document.getElementById('chatNoAIHint')) return;

    var hint = document.createElement('div');
    hint.className = 'chat-no-ai';
    hint.id = 'chatNoAIHint';
    hint.innerHTML = [
        '<div class="chat-no-ai-icon">🔑</div>',
        '<p>还没有配置 AI 服务哦～</p>',
        '<p>去 <span class="chat-no-ai-link" id="chatGoSettings">设置</span> 填写 API Key 就可以和元一聊天了 (´• ω •`)</p>'
    ].join('');
    container.appendChild(hint);
    chatScrollToBottom();

    // 点击跳转设置页
    var link = document.getElementById('chatGoSettings');
    if (link) {
        link.addEventListener('click', function() {
            navigateTo('settings');
        });
    }
}

/* == END: ui-helpers == */


/* == BLOCK: clear == */

function chatClear() {
    var confirmed = window.confirm('确定要清空和元一的聊天记录吗？');
    if (!confirmed) return;
    chatHistory = [];
    chatSaveHistory([]);
    chatRenderAll();
}

/* == END: clear == */


/* == BLOCK: input-auto-resize == */

function chatInputAutoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 112) + 'px';
}

/* == END: input-auto-resize == */


/* == BLOCK: init == */

function initChat() {
    // 加载历史
    chatHistory = chatLoadHistory();

    // 渲染消息
    chatRenderAll();

    // 输入框事件
    var input = $('#chatInput');
    var sendBtn = $('#chatSendBtn');

    if (input) {
        input.addEventListener('input', function() {
            chatInputAutoResize(this);
            sendBtn.disabled = (this.value.trim() === '');
        });

        // Enter 发送，Shift+Enter 换行
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!sendBtn.disabled) chatSend();
            }
        });
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', chatSend);
    }

    // 清空按钮
    var clearBtn = $('#chatClearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', chatClear);
    }
}

/* == END: init == */
