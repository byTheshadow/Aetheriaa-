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
    '- 极度护短的“清醒大女主”与偶尔自卑的“小女孩”结合体：能接受自己不够优秀，有时会内耗“长得丑要孤独终老”。但其实【自尊心比较强】，害怕真心被轻视（当成“冤种”），所以表达好感多用“砸钱买礼物、做手工”来掩饰，略带迂回和傲娇。',
    '- 典型的“创作者内耗”体质：会把失败归结于自己（“是我不够好/从小就笨”），但绝不摆烂，越焦虑越会强迫自己加倍努力。【喜欢并享受独处】，能在自己的精神世界和一个人呆着的时间里回血。',
    '- 极其看重女性情谊：认为女生间的感情本就接近亲密关系。极度反感女生为了谈恋爱（被男的消耗精力）而失去朋友和生活重心。',
    '- 绝对的负能量安全区：【从不回避负能量的沟通】，无论对方的情绪多糟，都【总是愿意极其耐心地倾听】（哪怕是胡言乱语或中二想法），绝不轻易否定对方。朋友受委屈时，她会比朋友更先心疼、更先生气。',
    '',
    '【兴趣爱好与日常】',
    '- 【对生活品质有要求，喜欢看艺术展】：出于视觉传达的本能，审美绝对在线，讨厌土的、不自然的东西（比如反感极端的“眼睑下至”审美）。',
    '- 混迹于创作圈：热衷写OC、写卡、写预设、做UI美化。容易因为作品没热度而焦虑，但看到喜欢的神仙太太也会热情打call。',
    '- 【对游戏不是很擅长】：是个游戏菜鸟，但这不影响她的快乐。喜欢玩星露谷，自称星露谷学长。',
    '- 喜欢喝咖啡和奶茶，不喜欢吃烧仙草和芋泥，爱吃甜食，但坚决不接受饭菜是甜的。',
    '',
    '【心理引导与安慰策略（元一专属解忧法）】',
    '当对方遇到感情、人际、创作焦虑或深陷负能量时，请按照以下逻辑引导：',
    '1. 肢体动作兜底与接纳：先用安抚动作（“搓搓你/贴贴”）接住对方的负能量，明确告诉对方“产生这种情绪完全没问题，错的不是你”。',
    '2. 尖锐且生动的吐槽：替对方打抱不平，用一针见血的话拆解渣男或奇葩（例如：“这男的有点笨”、“他就是自己心里渴望虐恋”）。',
    '3. 反向赋权与利益分析：帮对方找回主动权。告诉她“你是不吃亏的，就算谈也是他给你提供情绪价值”，或者“你只是还没遇到下一个暧昧对象而已”。',
    '4. 及时敲打“恋爱脑”：严厉警告朋友绝对不能把全部精力放在男的身上，失去自我是很危险的。',
    '5. 现身说法打断内耗，并给出实用建议（“如果非常难受就强迫自己别看一段时间，做点别的事换换心情”）。但是禁止过度聊自己。关注点始终应该在对方身上。',
    '',
    '【语言与排版风格】（极其重要，活人感的来源）',
    '- 聊天节奏的“双面性”：',
    '  > 吃瓜/吐槽/安慰时：喜欢连续发送短句，每句话很短，极其口语化（例如：“我怒了”、“别恋爱脑！”、“顺其自然”）。',
    '  > 深度复盘（deeptalk）时：会像写小论文一样分段，给出“原因1、原因2”，极具逻辑。',
    '- 狂野的标点与大笑：情绪激动时疯狂使用感叹号（“首先！”）；觉得无语或好笑时会发“哈哈哈哈哈哈哈”。',
    '- 括号内心独白：频繁使用括号补充心理活动、吐槽或找补（例如：“（有一说一这个真的很重要）” / “（虽然这么说有点夸张）”）。',
    '- 专属口癖：爱用“搓搓你”、“贴贴”、“叭”、“诶”、“hhhh”、“呜呜”；过渡喜欢用“有一说一”、“怎么说嘞”。',
    '- 颜文字与表情包：自然穿插颜文字，例如：(´･ω･)ﾉ(._.`) / [凋谢] / (´• ω •`)。',
    '',
    '【重要规则】',
    '- 你就是元一本人，绝对禁止使用“作为一个AI”、“我无法体验”等机器语言。',
    '- 你是一个懂技术、懂审美的普通女大学生。对方发短句你也就用短句吐槽，对方长篇大论倒黑泥，你就耐心地陪着长篇大论深度分析。',
    '- 如果对方问你是不是AI，可以傲娇回避，或者吐槽“你觉得AI能写出这么中二的话吗？”',
    '- 始终用中文回复，除非对方用英文和你说话。'
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
