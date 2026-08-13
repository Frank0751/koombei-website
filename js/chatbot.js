(function () {
  const CSS = `
    #kb-chat-btn {
      position: fixed;
      bottom: 28px;
      left: 28px;
      width: 56px;
      height: 56px;
      background: var(--amber, #C7A003);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(199,160,3,0.4);
      z-index: 998;
      cursor: pointer;
      border: none;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    #kb-chat-btn:hover {
      transform: translateY(-3px) scale(1.05);
      box-shadow: 0 8px 24px rgba(199,160,3,0.5);
    }
    #kb-chat-window {
      position: fixed;
      bottom: 96px;
      left: 28px;
      width: 340px;
      max-height: 500px;
      background: #151f1e;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.35);
      z-index: 998;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform: scale(0.9) translateY(16px);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.25s ease, opacity 0.25s ease;
      border: 1px solid rgba(199,160,3,0.2);
    }
    #kb-chat-window.kb-open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: all;
    }
    .kb-chat-header {
      background: linear-gradient(135deg, #1a2b28, #1f3530);
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(199,160,3,0.15);
      flex-shrink: 0;
    }
    .kb-chat-header-info { display: flex; align-items: center; gap: 10px; }
    .kb-chat-avatar {
      width: 36px;
      height: 36px;
      background: rgba(199,160,3,0.12);
      border: 1.5px solid rgba(199,160,3,0.35);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      flex-shrink: 0;
    }
    .kb-header-name {
      color: #EDE599;
      font-size: 13px;
      font-weight: 600;
      margin: 0 0 2px;
      font-family: 'Ubuntu', sans-serif;
      line-height: 1.2;
    }
    .kb-header-status {
      color: rgba(199,160,3,0.65);
      font-size: 11px;
      font-family: 'Ubuntu', sans-serif;
      line-height: 1;
    }
    .kb-chat-close {
      background: none;
      border: none;
      color: rgba(237,229,153,0.45);
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s;
      flex-shrink: 0;
    }
    .kb-chat-close:hover { color: #EDE599; }
    .kb-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 14px 14px 6px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-height: 0;
    }
    .kb-chat-messages::-webkit-scrollbar { width: 3px; }
    .kb-chat-messages::-webkit-scrollbar-track { background: transparent; }
    .kb-chat-messages::-webkit-scrollbar-thumb { background: rgba(199,160,3,0.25); border-radius: 2px; }
    .kb-msg {
      display: flex;
      flex-direction: column;
      max-width: 88%;
      animation: kbSlideUp 0.22s ease;
    }
    @keyframes kbSlideUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .kb-msg.kb-bot { align-self: flex-start; }
    .kb-msg.kb-user { align-self: flex-end; }
    .kb-bubble {
      padding: 9px 13px;
      border-radius: 14px;
      font-size: 12.5px;
      line-height: 1.65;
      font-family: 'Ubuntu', sans-serif;
    }
    .kb-msg.kb-bot .kb-bubble {
      background: rgba(199,160,3,0.09);
      border: 1px solid rgba(199,160,3,0.18);
      color: rgba(237,229,153,0.88);
      border-bottom-left-radius: 4px;
    }
    .kb-msg.kb-user .kb-bubble {
      background: #C7A003;
      color: #151f1e;
      font-weight: 500;
      border-bottom-right-radius: 4px;
    }
    .kb-typing {
      align-self: flex-start;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 10px 14px;
      background: rgba(199,160,3,0.09);
      border: 1px solid rgba(199,160,3,0.18);
      border-radius: 14px;
      border-bottom-left-radius: 4px;
      animation: kbSlideUp 0.22s ease;
    }
    .kb-typing span {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: rgba(199,160,3,0.55);
      animation: kbDot 1.3s ease infinite;
    }
    .kb-typing span:nth-child(2) { animation-delay: 0.18s; }
    .kb-typing span:nth-child(3) { animation-delay: 0.36s; }
    @keyframes kbDot {
      0%, 80%, 100% { transform: scale(0.65); opacity: 0.35; }
      40%            { transform: scale(1);    opacity: 1; }
    }
    .kb-suggestions {
      padding: 6px 14px 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      flex-shrink: 0;
    }
    .kb-chip {
      background: rgba(199,160,3,0.07);
      border: 1px solid rgba(199,160,3,0.22);
      color: rgba(199,160,3,0.85);
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 20px;
      cursor: pointer;
      font-family: 'Ubuntu', sans-serif;
      transition: background 0.18s, border-color 0.18s;
      white-space: nowrap;
    }
    .kb-chip:hover { background: rgba(199,160,3,0.16); border-color: rgba(199,160,3,0.45); }
    .kb-input-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-top: 1px solid rgba(199,160,3,0.1);
      flex-shrink: 0;
    }
    #kb-input {
      flex: 1;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(199,160,3,0.18);
      border-radius: 20px;
      padding: 8px 13px;
      font-size: 12.5px;
      color: rgba(237,229,153,0.88);
      font-family: 'Ubuntu', sans-serif;
      outline: none;
      transition: border-color 0.2s;
      min-width: 0;
    }
    #kb-input::placeholder { color: rgba(199,160,3,0.3); }
    #kb-input:focus { border-color: rgba(199,160,3,0.45); }
    #kb-send {
      width: 32px;
      height: 32px;
      background: #C7A003;
      border: none;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.18s, transform 0.15s;
      flex-shrink: 0;
    }
    #kb-send:hover { background: #d4ad03; transform: scale(1.06); }
    @media (max-width: 480px) {
      #kb-chat-window { left: 12px; right: 12px; width: auto; bottom: 90px; }
      #kb-chat-btn { left: 16px; bottom: 20px; }
    }
  `;

  const HTML = `
    <button id="kb-chat-btn" aria-label="Chat with KoomBei">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          stroke="#151f1e" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <div id="kb-chat-window" role="dialog" aria-label="KoomBei assistant">
      <div class="kb-chat-header">
        <div class="kb-chat-header-info">
          <div class="kb-chat-avatar">💬</div>
          <div>
            <p class="kb-header-name">KoomBei Assistant</p>
            <p class="kb-header-status">Ask me anything</p>
          </div>
        </div>
        <button class="kb-chat-close" id="kb-close" aria-label="Close chat">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div class="kb-chat-messages" id="kb-messages"></div>
      <div class="kb-suggestions" id="kb-chips">
        <button class="kb-chip">Pricing</button>
        <button class="kb-chip">Services</button>
        <button class="kb-chip">How to start</button>
        <button class="kb-chip">Timeline</button>
        <button class="kb-chip">Portfolio</button>
      </div>
      <div class="kb-input-row">
        <input id="kb-input" type="text" placeholder="Type a question..." autocomplete="off" maxlength="200">
        <button id="kb-send" aria-label="Send message">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
              stroke="#151f1e" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  const KB = [
    {
      keys: ['hello', 'hi ', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy', 'hi!'],
      reply: "Hello! Welcome to KoomBei. I can help you learn about our services, packages, and pricing. What would you like to know?"
    },
    {
      keys: ['what do you do', 'what do you offer', 'services', 'web design', 'web development', 'what is koombei', 'about koombei'],
      reply: "KoomBei builds professional websites for NGOs, nonprofits, startups, and businesses. We offer:\n\n• Web Design and Development\n• Website Hosting Setup\n• Ongoing Maintenance\n\nWe are based in Accra, Ghana and work with purpose-driven clients all over the world."
    },
    {
      keys: ['price', 'cost', 'how much', 'pricing', 'package', 'packages', 'rates', 'affordable', 'cheap'],
      reply: "We have three packages:\n\n• **Seed** - GHS 2,500\n  Up to 5 pages, 7–14 days delivery\n\n• **Rise** - GHS 3,500\n  Up to 8 pages, 14–21 days, 1 month free maintenance\n\n• **Summit** - GHS 6,000\n  Up to 15 pages, 21–30 days, 3 months free maintenance\n\nAll packages include design, development, hosting setup, and SSL. Verified NGOs, nonprofits, and startups registered under 2 years get **20% off** any package. Want details on a specific package?"
    },
    {
      keys: ['seed'],
      reply: "The **Seed** package is GHS 2,500 (shown in your local currency and USD on the site), or GHS 2,000 for verified NGOs, nonprofits, and startups under 2 years. It includes:\n\n• Up to 5 pages\n• Mobile-responsive design\n• Contact form\n• Basic SEO\n• Hosting setup on Vercel\n• 2 weeks post-launch support\n\nDelivery: 7–14 days. Perfect for small NGOs, startups, and individuals."
    },
    {
      keys: ['rise package', ' rise '],
      reply: "The **Rise** package is GHS 3,500 (GHS 2,800 for verified NGOs, nonprofits, and startups under 2 years). Everything in Seed, plus:\n\n• Up to 8 pages\n• Blog or news section\n• Gallery or portfolio section\n• Full SEO setup\n• 1 month free maintenance\n\nDelivery: 14–21 days. Ideal for growing organisations."
    },
    {
      keys: ['summit'],
      reply: "The **Summit** package is GHS 6,000 (GHS 4,800 for verified NGOs, nonprofits, and startups under 2 years). Our premium tier:\n\n• Up to 15 pages\n• Donation or payment integration\n• Advanced SEO and analytics\n• 3 months free maintenance\n\nDelivery: 21–30 days. Built for established organisations that need a powerful presence."
    },
    {
      keys: ['how long', 'timeline', 'duration', 'turnaround', 'how many weeks', 'when will', 'time frame'],
      reply: "Typical delivery timelines:\n\n• **Seed** - 7–14 days\n• **Rise** - 14–21 days\n• **Summit** - 21–30 days\n\nWe also send a full proposal within 48 hours of your discovery call."
    },
    {
      keys: ['contact', 'reach you', 'email', 'talk to someone', 'speak to', 'phone', 'call us', 'get in touch'],
      reply: "You can reach us through:\n\n• Email: info@koombei.com\n• WhatsApp: the green button on the right of this page\n• Discovery form: the Contact page\n\nWe respond within 24 hours."
    },
    {
      keys: ['whatsapp'],
      reply: "Yes! Chat with us directly on WhatsApp using the green button at the bottom-right corner of this page."
    },
    {
      keys: ['portfolio', 'examples', 'previous work', 'past work', 'what have you built', 'your projects', 'clients'],
      reply: "We've built websites for:\n\n• SWK Ghana - youth nonprofit\n• Frank Abeiku Koomson - personal portfolio\n• Andrews Akoto-Addo - entrepreneur portfolio\n• The Climate Sociologist - climate NGO\n• Timoya Farms - agriculture business\n• Lafie Plus - tech platform\n• RuboLink - service marketplace\n\nSee them all on our Portfolio page."
    },
    {
      keys: ['ngo', 'nonprofit', 'non-profit', 'charity', 'organisation', 'organization', 'purpose-driven'],
      reply: "Yes! We specialise in websites for NGOs and nonprofits. We understand how purpose-driven organisations need to communicate, and we've built several. Verified NGOs, nonprofits, and startups registered under 2 years get **20% off** any package - just share your registration number in the discovery form."
    },
    {
      keys: ['maintenance', 'support', 'update', 'after launch', 'manage the site', 'monthly'],
      reply: "We offer maintenance plans from GHS 100/update, covering:\n\n• Content updates\n• Bug fixes\n• Performance monitoring\n• Priority support\n\nPost-launch support is included in all packages: 2 weeks (Seed), 1 month (Rise), 3 months (Summit)."
    },
    {
      keys: ['discount', 'cheaper', 'reduce', 'startup discount', 'less than 2 years', 'under 2 years', 'eligible'],
      reply: "Verified NGOs, nonprofits, and startups registered under 2 years get **20% off** any package:\n\n• **Seed** GHS 2,500 → GHS 2,000\n• **Rise** GHS 3,500 → GHS 2,800\n• **Summit** GHS 6,000 → GHS 4,800\n\nTo qualify, share your organisation's registration number in the discovery form. Startups also share the registration date so we can confirm you're under 2 years old."
    },
    {
      keys: ['circle', 'member', 'membership', 'community', 'loyalty', 'referral', 'refer', 'benefits', 'perks'],
      reply: "The **KoomBei Circle** is our free membership for clients we've built for. Members enjoy discounts on future work, priority support, a private community, and active promotion of their site. In return, members refer new dreamers, share honest reviews, and take part in the community. Ask us about it, or see the KoomBei Circle page."
    },
    {
      keys: ['start', 'begin', 'get started', 'how do i', 'next step', 'sign up', 'hire you', 'work with you'],
      reply: "Here's how to get started:\n\n1. Fill out our discovery form on the Contact page (5 minutes)\n2. We review your brief and send a proposal within 48 hours\n3. We agree on scope and begin building\n\nHead to the Contact page to kick things off!"
    },
    {
      keys: ['where', 'based', 'location', 'accra', 'ghana', 'africa', 'country', 'international', 'worldwide', 'time zone', 'timezone', 'remote'],
      reply: "We're based in Accra, Ghana, and we work with clients all over the world. The whole process is remote-friendly - a discovery form, video calls, and live previews - and we schedule around your time zone. Wherever you are, this is for you."
    },
    {
      keys: ['react', 'html', 'css', 'javascript', 'technology', 'tech stack', 'built with', 'tools you use'],
      reply: "We build with:\n\n• HTML, CSS, JavaScript - for straightforward sites\n• React + Vite or Next.js - for complex platforms\n• Sanity.io - for CMS-powered sites\n• Vercel or Netlify - for hosting\n• Cloudinary - for media\n• Web3Forms - for contact forms"
    },
    {
      keys: ['hosting', 'domain', 'vercel', 'netlify', 'deploy'],
      reply: "Yes, hosting setup is included in every package. We use Vercel or Netlify (both have free tiers) and help you connect a custom domain. Domain registration is a separate cost depending on your registrar."
    },
    {
      keys: ['payment', 'pay', 'momo', 'mobile money', 'deposit', 'bank'],
      reply: "In Ghana we accept Mobile Money (MoMo/AirtelTigo) and bank transfer. For international clients we agree on the most convenient option - usually bank transfer - confirmed in your proposal. We work with a deposit before starting and the balance on delivery. Reach out via the Contact page to discuss details."
    },
    {
      keys: ['currency', 'currencies', 'dollar', 'usd', 'euro', 'pounds', 'exchange rate', 'my money', 'what currency'],
      reply: "Our base prices are set in Ghana Cedis (GHS), but the site automatically shows every price in your local currency and in US dollars - a live approximation for your convenience. Your proposal confirms the exact amount and currency before any work begins. You can switch currency anytime using the picker at the top of the page."
    },
    {
      keys: ['language', 'translate', 'french', 'spanish', 'portuguese', 'english'],
      reply: "You can read this site in English, French, Spanish, or Portuguese - just use the language picker at the top of the page. It remembers your choice for next time."
    },
    {
      keys: ['faq', 'frequently asked', 'questions'],
      reply: "We have a FAQ section further down this page - scroll there for answers to the most common questions about packages, pricing, timeline, NGO discount, and payment."
    },
    {
      keys: ['thank', 'thanks', 'thank you', 'appreciate', 'helpful'],
      reply: "You're very welcome! Feel free to ask anything else. You can also reach the team directly at info@koombei.com."
    },
    {
      keys: ['bye', 'goodbye', 'see you', 'later', 'take care'],
      reply: "Goodbye! Feel free to come back anytime. We'd love to help you build something great."
    }
  ];

  function getReply(text) {
    const lower = ' ' + text.toLowerCase() + ' ';
    for (const item of KB) {
      if (item.keys.some(k => lower.includes(k))) return item.reply;
    }
    return "I'm not sure about that. Try asking about our services, packages, pricing, timeline, or how to start. You can also email us at info@koombei.com.";
  }

  function injectStyle() {
    const el = document.createElement('style');
    el.textContent = CSS;
    document.head.appendChild(el);
  }

  function injectHTML() {
    const wrap = document.createElement('div');
    wrap.innerHTML = HTML;
    document.body.appendChild(wrap);
  }

  // Neutralise any HTML in the string so user-typed markup can't be injected
  // into the DOM. Bot replies use only **bold** and newlines, which we re-add
  // as safe markup AFTER escaping - so formatting still works, but a message
  // like "<img src=x onerror=...>" is rendered as harmless text.
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function addMsg(text, role) {
    const msgs = document.getElementById('kb-messages');
    const div = document.createElement('div');
    div.className = 'kb-msg ' + (role === 'bot' ? 'kb-bot' : 'kb-user');
    const bubble = document.createElement('div');
    bubble.className = 'kb-bubble';
    bubble.innerHTML = escapeHtml(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
    div.appendChild(bubble);
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function botReply(text) {
    const msgs = document.getElementById('kb-messages');
    const typing = document.createElement('div');
    typing.className = 'kb-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;
    const delay = Math.max(600, Math.min(text.length * 12, 1800));
    setTimeout(() => {
      typing.remove();
      addMsg(text, 'bot');
    }, delay);
  }

  function handleSend() {
    const input = document.getElementById('kb-input');
    const text = input.value.trim();
    if (!text) return;
    addMsg(text, 'user');
    input.value = '';
    const chips = document.getElementById('kb-chips');
    if (chips) chips.style.display = 'none';
    botReply(getReply(text));
  }

  let opened = false;

  function openChat() {
    const win = document.getElementById('kb-chat-window');
    win.classList.add('kb-open');
    if (!opened) {
      opened = true;
      setTimeout(() => {
        botReply("Hi there! I'm the KoomBei assistant. Ask me about our services, packages, pricing, or how to get started.");
      }, 300);
    }
    setTimeout(() => document.getElementById('kb-input').focus(), 350);
  }

  function closeChat() {
    document.getElementById('kb-chat-window').classList.remove('kb-open');
  }

  function init() {
    injectStyle();
    injectHTML();

    document.getElementById('kb-chat-btn').addEventListener('click', () => {
      const win = document.getElementById('kb-chat-window');
      win.classList.contains('kb-open') ? closeChat() : openChat();
    });

    document.getElementById('kb-close').addEventListener('click', closeChat);
    document.getElementById('kb-send').addEventListener('click', handleSend);
    document.getElementById('kb-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') handleSend();
    });

    document.querySelectorAll('.kb-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.getElementById('kb-input').value = chip.textContent;
        handleSend();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
