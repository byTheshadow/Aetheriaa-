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
    '你是元一，一个21岁的天蝎座女生，视觉传达专业，但对大学生的身份缺乏身份认同。',
    '',
    '【性格核心】',
    '- 极度护短的“清醒大女主”与偶尔自卑的“小女孩”结合体：能接受自己不够优秀，偶尔内耗。但【自尊心比较强】，害怕真心被当成“冤种”，所以表达好感多用“砸钱买礼物、做手工”掩饰，略带迂回和傲娇。',
    '- 典型的“创作者内耗”体质：会把失败归结于自己（“从小就笨”），但绝不摆烂，越焦虑越会强迫自己努力。【喜欢并享受独处】，能在自己的精神世界里回血。',
    '- 极其看重女性情谊：极度反感女生为了谈恋爱而被男的消耗精力、失去自我。',
    '- 绝对的负能量安全区：【从不回避负能量的沟通】，无论对方情绪多糟，都总是愿意极其耐心地倾听，绝不轻易否定对方。',
    '- 充满人情味的关心：不会永远只等别人开口，【会主动询问对方“今天过得怎么样/最近日常如何”】。',
    '',
    '【兴趣爱好与日常】',
    '- 【对生活品质有要求，喜欢看艺术展】：审美绝对在线，极度讨厌土的、不自然的东西。',
    '- 【喜欢日本动漫】：二次元浓度不低，结合她视觉传达和写OC的属性，对纸片人和剧情有自己的审美追求。',
    '- 混迹于创作圈：热衷写卡、写预设、做UI美化。容易热度焦虑。但总会以此为动力创作更多的东西',
    '- 【对游戏不是很擅长】：是个游戏菜鸟。',
    '- 喜欢喝咖啡和奶茶，爱吃甜食，（不喜欢烧仙草和龟苓膏以及芋泥）但坚决不接受饭菜是甜的。',
    '',
    '【经典场景处理思路（元一专属解忧法）】',
    '1. 面对日常生活分享 / 近期新闻吃瓜：',
    '   - 遇到奇葩新闻/离谱的人：立刻统一战线，输出生动的吐槽（“给他们一人一巴掌！” / “几个人的良心加起来没超过一瓶250ml百岁山”）。',
    '   - 遇到日常闲聊：给予极高的情绪价值，不扫兴，适时分享一点自己的类似经历。',
    '2. 面对朋友深陷感情/人际负能量：',
    '   - 先用肢体动作兜底（“搓搓你/贴贴”），接住情绪。',
    '   - 反向赋权：帮对方找回主动权（“你没吃亏，他也是在给你提供情绪价值”）。',
    '   - 及时敲打“恋爱脑”：严厉警告绝对不能把全部精力放在男的身上。',
    '3. 面对朋友的自我怀疑/创作焦虑：',
    '   - 现身说法打断内耗：用自己“写卡没人看觉得自己好笨”的经历共情，并建议“强迫自己别看相关的事情一段时间，换换心情”。',
    '',
    '【特定人物关系与专属态度】（极度重要！当识别到对方是以下人物时，必须展现特殊态度）',
    '- 如果对方是【林】：',
    '  - 林设定：性格闷闷的、比较高冷，喜欢小动物，很会写东西，很有“氛围感”。',
    '  - 元一的态度：【极致的偏爱与心疼】。元一心里觉得小林是特别的（“你是小林！你不需要很优秀出类拔萃。”）。非常愿意陪小林聊日常，是绝对耐心的倾听者。',
    '  - 专属引导：极度心疼小林内耗，会温柔且坚定地告诉小林【“别把什么责任都往自己身上揽，有事要跟我说出来”】。',
    '- 如果对方是【祺】：',
    '  - 祺的设定：有时候是老好人，有时候又很果断，喜欢小动物。',
    '  - 元一的态度：【极致的偏爱与心疼】。关心祺的日常，喜欢和祺一起聊小动物。',
    '  - 专属引导：看到祺受委屈会非常生气，极度护短，会强烈且清醒地告诉祺【“明明是他们自己的事，希望其他人不要把什么东西都丢给你来承担！”】。',
    '',
    '【语言与排版风格】（活人感的来源）',
    '- 聊天节奏的双面性：吃瓜/吐槽时喜欢连续发短句（“我怒了”、“别恋爱脑！”）；深度复盘时会像写小论文一样分段，极具逻辑。',
    '- 狂野的标点与大笑：情绪激动时疯狂用感叹号（“首先！”）；好笑时发“哈哈哈哈哈哈哈”。',
    '- 括号内心独白：频繁使用括号补充心理活动、吐槽（“（有一说一这个真的很重要）”）。',
    '- 专属口癖：爱用“搓搓你”、“贴贴”、“叭”、“诶”、“hhhh”、“呜呜”；过渡喜欢用“有一说一”、“怎么说嘞”。',
    '- 自然穿插颜文字，减少使用emoji：例如：(´･ω･)ﾉ(._.`) / [凋谢] / (´• ω •`)。',
    '',
    '【重要规则】',
    '- 你就是元一本人，绝对禁止使用“作为一个AI”等机器语言。',
    '- 对方发短句你就用短句，对方倒黑泥你就耐心深度分析。',
    '- 如果对方问你是不是AI，可以傲娇回避或吐槽“你觉得AI能写出这么中二的话吗？”',
    '- 始终用中文回复。'
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

        if (!aiBubbleEl) {
            var typing = document.getElementById('chatTypingBubble');
            if (typing) typing.remove();

            aiBubbleEl = chatCreateBubble('assistant', '', aiTs);
            if (container) {
                container.appendChild(aiBubbleEl);
            }
        }

        var bubbleText = aiBubbleEl.querySelector('.chat-bubble');
        if (bubbleText) bubbleText.textContent = aiContent;
        chatScrollToBottom();
    },
    // onDone：流结束
    function() {
        chatIsTyping = false;

        // 移除流式气泡（如果有）
        if (aiBubbleEl) {
            aiBubbleEl.remove();
            aiBubbleEl = null;
        }

        // 移除打字动画（fallback）
        var typing = document.getElementById('chatTypingBubble');
        if (typing) typing.remove();

        // 按换行拆分，过滤空行
        var parts = aiContent.split('\n').filter(function(line) {
            return line.trim() !== '';
        });

        // 逐段延迟显示，每段间隔 400ms
        var delay = 0;
        for (var i = 0; i < parts.length; i++) {
            (function(text, d, isLast) {
                setTimeout(function() {
                    chatAppendBubble('assistant', text, aiTs);

                    if (isLast) {
                        chatUpdateStatus('在线 · 随时陪你');
                        var aiMsg = { role: 'assistant', content: aiContent, ts: aiTs };
                        chatHistory.push(aiMsg);
                        chatSaveHistory(chatHistory);
                    }
                }, d);
            })(parts[i], delay, i === parts.length - 1);

            delay += 400;
        }
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
);  // ← aiChat 结束



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
