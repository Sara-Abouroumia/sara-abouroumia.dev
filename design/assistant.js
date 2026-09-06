// <site-assistant> — Mochi: an original chibi pink cat with long bunny ears.
// Peeks in from the right screen edge; three taps coax her out. Then she sits
// bottom-right, flicks her tail, grooms, comments on page changes, and opens a
// help balloon on click. Add entries to ACTIVITIES to give her more to do.
(function () {
  const QUIPS = [
    'Go on, I’m listening.',
    'Walk me through it slowly.',
    'What did you expect to happen?',
    'And what actually happened?',
    'Say that part out loud again.',
    'Right. So where does it break?',
  ];

  const TIPS = {
    about: 'You’re at the start — Sara in one paragraph. That map behind her name is where people read this from.',
    experience: 'Her roles, newest first. Keep scrolling for the volunteering bit.',
    projects: 'Kayseri Social Run is the one she built solo — schema, auth, deploy, all of it.',
    products: 'These are working demos. Tick the ones you like and send them over in one go.',
    research: 'Kaggle writeups will live here. Nothing published yet, so don’t judge her.',
    writing: 'Newest post sits on top. Click a title and it opens properly.',
    contact: 'That form just opens your own mail app. Nothing is stored here.',
    review: 'Anything a referee or a business sends waits here for your yes.',
  };

  const HELP = {
    about: 'Want the tour, or are you after something specific?',
    experience: 'Backend work, or the machine learning side?',
    projects: 'Want the live site, or the story behind it?',
    products: 'Running a business? Tell me the trade and I’ll point at one.',
    research: 'Thin in here for now. Projects page has more to chew on.',
    writing: 'Reading today, or writing something new?',
    contact: 'Email, LinkedIn, or the form — your pick.',
    review: 'Approve what you trust. The rest never shows up publicly.',
  };

  const ACTIVITIES = [
    { name: 'wave', ms: 2000, say: 'Still here if you need me.' },
    { name: 'wave', ms: 1800, say: 'Solid CV, right?' },
    { name: 'wave', ms: 1600 },
    { name: 'groom', ms: 2200 },
    { name: 'look', ms: 1800 },
  ];

  const LIGHT = {
    'g-coat-0': '#fff0f6', 'g-coat-1': '#fcc9dd', 'g-coat-2': '#f2a3c2', 'g-coat-3': '#d97ba3',
    'g-ear-0': '#fbb6cb', 'g-ear-1': '#e07fa4',
    'g-snout-0': '#fffafc', 'g-snout-1': '#fde4ee',
    'g-eye-0': '#fff3b0', 'g-eye-1': '#f7c53a', 'g-eye-2': '#d19410',
  };
  const DARK = {
    'g-coat-0': '#f0cbdc', 'g-coat-1': '#dda2bd', 'g-coat-2': '#b8779a', 'g-coat-3': '#8f587a',
    'g-ear-0': '#d894ac', 'g-ear-1': '#a95d7e',
    'g-snout-0': '#ecd9e2', 'g-snout-1': '#d3b3c3',
    'g-eye-0': '#8fb6e8', 'g-eye-1': '#3a63ad', 'g-eye-2': '#16265c',
  };

  class SiteAssistant extends HTMLElement {
    static get observedAttributes() { return ['theme', 'page']; }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.activity = null;
      this.activityUntil = 0;
      this.nextIdle = performance.now() + 4000;
      this.nextBlink = performance.now() + 2500;
      this.blinkUntil = 0;
      this.quipIndex = -1;
      this.nudges = 0;
      this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    connectedCallback() {
      this.shadowRoot.innerHTML = `
        <style>
          *, *::before, *::after { box-sizing:border-box; }
          :host { position:fixed; left:0; bottom:0; z-index:40; pointer-events:none; }

          .cat { position:fixed; bottom:6px; right:48px; width:86px; height:86px; cursor:pointer; pointer-events:auto; }
          .bed { position:fixed; bottom:10px; right:0; width:86px; height:92px; cursor:pointer; pointer-events:auto; }
          .peeker { transition:transform .45s cubic-bezier(.34,1.4,.64,1); }
          .bed.stir .peeker { animation:stir .8s ease-in-out; }
          @keyframes stir {
            0%,100% { transform:translateX(var(--peek-x, 48px)) rotate(0deg); }
            25% { transform:translateX(calc(var(--peek-x, 48px) - 7px)) rotate(-5deg); }
            55% { transform:translateX(calc(var(--peek-x, 48px) + 3px)) rotate(4deg); }
            80% { transform:translateX(calc(var(--peek-x, 48px) - 3px)) rotate(-2deg); }
          }

          .bubble, .bed-bubble {
            position:fixed; width:max-content; max-width:min(240px, calc(100vw - 28px));
            font:400 13px/1.5 Inter, system-ui, sans-serif; padding:11px 14px; border-radius:14px;
            opacity:0; transition:opacity .18s; pointer-events:none; text-align:left;
            background:var(--bub-bg); color:var(--bub-fg); border:1.5px solid var(--bub-border);
            box-shadow:0 4px 16px var(--bub-shadow); }
          .bubble { bottom:100px; left:0; }
          .bed-bubble { bottom:110px; left:0; }
          .bubble.show { opacity:1; pointer-events:auto; }
          .bed-bubble.show { opacity:1; }
          .bubble::before, .bubble::after, .bed-bubble::before, .bed-bubble::after {
            content:''; position:absolute; width:0; height:0;
            border-left:9px solid transparent; border-right:9px solid transparent;
            left:var(--tail-x, 50%); margin-left:-9px; }
          .bubble::before, .bed-bubble::before { bottom:-11px; border-top:11px solid var(--bub-border); }
          .bubble::after, .bed-bubble::after { bottom:-8px; border-top:10px solid var(--bub-bg); }
          .bubble .acts { display:flex; flex-direction:column; gap:5px; margin-top:9px; }
          .bubble button { font:500 12px/1.3 Inter, system-ui, sans-serif; text-align:left; padding:5px 8px;
            border-radius:6px; border:1px solid currentColor; background:none; color:inherit; cursor:pointer; opacity:0.85; }
          .bubble button:hover { opacity:1; }

          .badge { position:fixed; bottom:14px; left:14px; width:30px; height:30px; border-radius:50%;
            background:#fcc9dd; border:2px solid #c4658a; cursor:pointer; pointer-events:auto; display:none;
            box-shadow:0 1px 4px rgba(0,0,0,0.25); }
          :host(.hidden) .cat { display:none; }
          :host(.hidden) .badge { display:block; }
          :host(.awake) .bed { display:none; }
          :host(:not(.awake)) .cat { display:none; }
          :host(:not(.awake)) .badge { display:none; }
        </style>

        <div class="bed-bubble"></div>
        <div class="bed" role="button" tabindex="0" aria-label="Coax Mochi out">
          <svg viewBox="0 0 86 92" width="86" height="92">
            <defs>
              <radialGradient id="coatA" cx="34%" cy="22%" r="80%">
                <stop class="g-coat-0" offset="0%" stop-color="#fff0f6"></stop>
                <stop class="g-coat-1" offset="46%" stop-color="#fcc9dd"></stop>
                <stop class="g-coat-2" offset="84%" stop-color="#f2a3c2"></stop>
                <stop class="g-coat-3" offset="100%" stop-color="#d97ba3"></stop>
              </radialGradient>
              <radialGradient id="earA" cx="36%" cy="24%" r="82%">
                <stop class="g-ear-0" offset="0%" stop-color="#fbb6cb"></stop>
                <stop class="g-ear-1" offset="100%" stop-color="#e07fa4"></stop>
              </radialGradient>
              <radialGradient id="snoutA" cx="36%" cy="26%" r="80%">
                <stop class="g-snout-0" offset="0%" stop-color="#fffafc"></stop>
                <stop class="g-snout-1" offset="100%" stop-color="#fde4ee"></stop>
              </radialGradient>
              <radialGradient id="eyeA" cx="34%" cy="26%" r="82%">
                <stop class="g-eye-0" offset="0%" stop-color="#fff3b0"></stop>
                <stop class="g-eye-1" offset="55%" stop-color="#f7c53a"></stop>
                <stop class="g-eye-2" offset="100%" stop-color="#d19410"></stop>
              </radialGradient>
              <filter id="s1" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"></feGaussianBlur></filter>
            </defs>

            <g class="peeker">
              <g class="peek-paw">
                <ellipse cx="58" cy="86" rx="12" ry="5.6" fill="url(#coatA)"></ellipse>
                <path d="M50,84 q3,-3 6,0 M57,83 q3,-3 6,0" fill="none" stroke="#d4849f" stroke-width="1.3" stroke-linecap="round" opacity="0.65"></path>
              </g>

              <g class="peek-head">
                <g class="peek-ear-l">
                  <path d="M26,44 q-9,-24 -3,-36 q4,-8 9,-1 q5,13 4,36 Z" fill="url(#coatA)"></path>
                  <path d="M27.5,40 q-6,-19 -2,-29 q2,-4 4,-0.5 q3,11 2.5,29 Z" fill="url(#earA)"></path>
                </g>
                <g class="peek-ear-r" transform="rotate(70 50 44)">
                  <path d="M56,44 q9,-24 3,-36 q-4,-8 -9,-1 q-5,13 -4,36 Z" fill="url(#coatA)"></path>
                  <path d="M54.5,40 q6,-19 2,-29 q-2,-4 -4,-0.5 q-3,11 -2.5,29 Z" fill="url(#earA)"></path>
                </g>

                <ellipse cx="41" cy="58" rx="34" ry="30" fill="url(#coatA)"></ellipse>
                <ellipse class="peek-spec" cx="24" cy="40" rx="14" ry="9" fill="#ffffff" opacity="0.5" filter="url(#s1)" transform="rotate(-26 24 40)"></ellipse>

                <ellipse cx="26" cy="58" rx="9" ry="10.5" fill="url(#eyeA)"></ellipse>
                <ellipse cx="56" cy="58" rx="9" ry="10.5" fill="url(#eyeA)"></ellipse>
                <ellipse cx="26" cy="58" rx="2.4" ry="7.4" fill="#1b1420"></ellipse>
                <ellipse cx="56" cy="58" rx="2.4" ry="7.4" fill="#1b1420"></ellipse>
                <circle cx="22.6" cy="53.4" r="3.2" fill="#ffffff" opacity="0.95"></circle>
                <circle cx="52.6" cy="53.4" r="3.2" fill="#ffffff" opacity="0.95"></circle>
                <circle cx="29.4" cy="63" r="1.6" fill="#ffffff" opacity="0.5"></circle>
                <circle cx="59.4" cy="63" r="1.6" fill="#ffffff" opacity="0.5"></circle>

                <ellipse cx="15" cy="68" rx="6.6" ry="4" fill="#f4869f" opacity="0.5" filter="url(#s1)"></ellipse>
                <ellipse cx="66" cy="68" rx="6.6" ry="4" fill="#f4869f" opacity="0.5" filter="url(#s1)"></ellipse>
                <path d="M37.6,70 L44.4,70 L41,74 Z" fill="#d4708c"></path>
                <path d="M41,74 L41,79 M41,79 q-7,5 -10.5,-1 M41,79 q7,5 10.5,-1" fill="none" stroke="#c4657f" stroke-width="2.2" stroke-linecap="round"></path>
              </g>
            </g>
          </svg>
        </div>

        <button class="badge" title="Bring back Mochi" aria-label="Bring back Mochi"></button>

        <div class="bubble"></div>
        <div class="cat">
          <svg viewBox="0 0 120 128" width="86" height="92">
            <defs>
              <radialGradient id="coatGrad" cx="34%" cy="22%" r="80%">
                <stop class="g-coat-0" offset="0%" stop-color="#fff0f6"></stop>
                <stop class="g-coat-1" offset="46%" stop-color="#fcc9dd"></stop>
                <stop class="g-coat-2" offset="84%" stop-color="#f2a3c2"></stop>
                <stop class="g-coat-3" offset="100%" stop-color="#d97ba3"></stop>
              </radialGradient>
              <radialGradient id="innerEar" cx="36%" cy="24%" r="82%">
                <stop class="g-ear-0" offset="0%" stop-color="#fbb6cb"></stop>
                <stop class="g-ear-1" offset="100%" stop-color="#e07fa4"></stop>
              </radialGradient>
              <radialGradient id="snoutGrad" cx="36%" cy="26%" r="80%">
                <stop class="g-snout-0" offset="0%" stop-color="#fffafc"></stop>
                <stop class="g-snout-1" offset="100%" stop-color="#fde4ee"></stop>
              </radialGradient>
              <radialGradient id="catEye" cx="34%" cy="26%" r="82%">
                <stop class="g-eye-0" offset="0%" stop-color="#fff3b0"></stop>
                <stop class="g-eye-1" offset="55%" stop-color="#f7c53a"></stop>
                <stop class="g-eye-2" offset="100%" stop-color="#d19410"></stop>
              </radialGradient>
              <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"></feGaussianBlur></filter>
              <filter id="softer" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"></feGaussianBlur></filter>
            </defs>

            <ellipse class="shadow" cx="60" cy="122" rx="25" ry="4.4" fill="rgba(0,0,0,0.18)" filter="url(#soft)"></ellipse>

            <g class="whole">
              <g class="tail">
                <path d="M84,110 q17,4 21,-8 q3,-10 -7,-11" fill="none" stroke="#f0a8c4" stroke-width="8" stroke-linecap="round"></path>
              </g>

              <g class="leg-a"><ellipse cx="49" cy="116" rx="8" ry="4.2" fill="url(#coatGrad)"></ellipse><ellipse cx="47.4" cy="114.8" rx="3.2" ry="1.4" fill="#fff2f7" opacity="0.55"></ellipse></g>
              <g class="leg-b"><ellipse cx="71" cy="116" rx="8" ry="4.2" fill="url(#coatGrad)"></ellipse><ellipse cx="69.4" cy="114.8" rx="3.2" ry="1.4" fill="#fff2f7" opacity="0.55"></ellipse></g>

              <g class="arm-far">
                <ellipse cx="40" cy="104" rx="6.6" ry="9.4" fill="url(#coatGrad)"></ellipse>
              </g>

              <g class="bodyg">
                <ellipse cx="60" cy="104" rx="19" ry="15" fill="url(#coatGrad)"></ellipse>
                <ellipse class="belly" cx="60" cy="108" rx="11" ry="8" fill="#fff4f9" opacity="0.5" filter="url(#soft)"></ellipse>
                <path class="rim" d="M77,100 A19,15 0 0 1 70,117" fill="none" stroke="#fff0f7" stroke-width="3.4" stroke-linecap="round" opacity="0.4" filter="url(#soft)"></path>
              </g>

              <g class="arm-wave">
                <g class="paw">
                  <ellipse cx="80" cy="104" rx="6.6" ry="9.4" fill="url(#coatGrad)"></ellipse>
                  <ellipse cx="80" cy="98" rx="2.6" ry="4" fill="#fff4f9" opacity="0.55"></ellipse>
                </g>
              </g>

              <g class="head">
                <g class="ear-l">
                  <path d="M45,44 q-10,-26 -3,-39 q4,-9 10,-1 q5,14 4,39 Z" fill="url(#coatGrad)"></path>
                  <path d="M46.6,40 q-7,-21 -2.5,-31 q2,-4.5 4.5,-0.5 q3,12 3,31 Z" fill="url(#innerEar)"></path>
                </g>
                <g class="ear-r">
                  <path d="M75,44 q10,-26 3,-39 q-4,-9 -10,-1 q-5,14 -4,39 Z" fill="url(#coatGrad)"></path>
                  <path d="M73.4,40 q7,-21 2.5,-31 q-2,-4.5 -4.5,-0.5 q-3,12 -3,31 Z" fill="url(#innerEar)"></path>
                </g>

                <ellipse cx="60" cy="58" rx="36" ry="32" fill="url(#coatGrad)"></ellipse>
                <ellipse cx="60" cy="86" rx="24" ry="11" fill="#a8547a" opacity="0.16" filter="url(#softer)"></ellipse>
                <ellipse class="spec-broad" cx="42" cy="38" rx="15" ry="10" fill="#ffffff" opacity="0.5" filter="url(#soft)" transform="rotate(-26 42 38)"></ellipse>

                <ellipse class="cheek cheek-l" cx="32" cy="70" rx="7" ry="4.2" fill="#f4869f" opacity="0" filter="url(#soft)"></ellipse>
                <ellipse class="cheek cheek-r" cx="88" cy="70" rx="7" ry="4.2" fill="#f4869f" opacity="0" filter="url(#soft)"></ellipse>

                <ellipse class="eye-white eye-l" cx="44" cy="58" rx="9.5" ry="11" fill="url(#catEye)"></ellipse>
                <ellipse class="eye-white eye-r" cx="76" cy="58" rx="9.5" ry="11" fill="url(#catEye)"></ellipse>
                <ellipse class="slit slit-l" cx="44" cy="58" rx="2.5" ry="7.8" fill="#1b1420"></ellipse>
                <ellipse class="slit slit-r" cx="76" cy="58" rx="2.5" ry="7.8" fill="#1b1420"></ellipse>
                <circle class="pupil pupil-l" cx="40.6" cy="53.4" r="3.4" fill="#ffffff" opacity="0.95"></circle>
                <circle class="pupil pupil-r" cx="72.6" cy="53.4" r="3.4" fill="#ffffff" opacity="0.95"></circle>
                <circle class="glint glint-l" cx="47.4" cy="63" r="1.7" fill="#ffffff" opacity="0.5"></circle>
                <circle class="glint glint-r" cx="79.4" cy="63" r="1.7" fill="#ffffff" opacity="0.5"></circle>

                <path class="nose" d="M56.6,70 L63.4,70 L60,74 Z" fill="#d4708c"></path>
                <path class="mouth" d="M60,74 L60,79 M60,79 q-7,5 -10.5,-1 M60,79 q7,5 10.5,-1" fill="none" stroke="#c4657f" stroke-width="2.2" stroke-linecap="round"></path>
                <path class="tongue" d="M56,79 q4,7 8,0 q-4,2.4 -8,0 Z" fill="#e0757f" opacity="0"></path>
                <g class="whiskers" stroke="#f0c7d6" stroke-width="1.2" stroke-linecap="round" fill="none">
                  <path d="M48,72 L34,68 M48,76 L34,77 M72,72 L86,68 M72,76 L86,77"></path>
                </g>
              </g>
            </g>
          </svg>
        </div>`;

      const q = (s) => this.shadowRoot.querySelector(s);
      this.el = q('.cat');
      this.bubble = q('.bubble');
      this.bed = q('.bed');
      this.bedBubble = q('.bed-bubble');
      this.peeker = q('.peeker');
      this.parts = {
        whole: q('.whole'), body: q('.bodyg'), head: q('.head'), tail: q('.tail'),
        armWave: q('.arm-wave'), paw: q('.paw'), armFar: q('.arm-far'),
        legA: q('.leg-a'), legB: q('.leg-b'), earL: q('.ear-l'), earR: q('.ear-r'),
        eyeL: q('.eye-l'), eyeR: q('.eye-r'), slitL: q('.slit-l'), slitR: q('.slit-r'),
        pupilL: q('.pupil-l'), pupilR: q('.pupil-r'), glintL: q('.glint-l'), glintR: q('.glint-r'),
        cheekL: q('.cheek-l'), cheekR: q('.cheek-r'), tongue: q('.tongue'),
        shadow: q('.shadow'),
      };

      this.setPeek();
      this.applyTheme();
      this.el.addEventListener('click', (e) => { if (e.target.tagName !== 'BUTTON') this.onClick(); });
      this.bed.addEventListener('click', () => this.nudge());
      this.bed.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.nudge(); } });
      this.badge = q('.badge');
      this.badge.addEventListener('click', () => {
        this.classList.remove('hidden');
        this.start('wave', 1700);
        this.say('Missed me? Right — what are we after?', 2800);
      });

      this.peekTimer = setInterval(() => {
        if (this.classList.contains('awake')) { clearInterval(this.peekTimer); return; }
        this.bed.classList.remove('stir');
        void this.bed.offsetWidth;
        this.bed.classList.add('stir');
      }, 2800);
      setTimeout(() => { if (!this.classList.contains('awake')) this.bedSay('Psst — over here.', 4200); }, 1600);

      this.onResize = () => {
        if (this.bubble.classList.contains('show')) this.place(this.bubble, this.center(this.el));
        if (this.bedBubble.classList.contains('show')) this.place(this.bedBubble, this.center(this.bed));
      };
      window.addEventListener('resize', this.onResize);
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.tick);
    }

    disconnectedCallback() {
      window.removeEventListener('resize', this.onResize);
      clearInterval(this.peekTimer);
      cancelAnimationFrame(this.raf);
    }

    attributeChangedCallback(name, oldV, newV) {
      if (!this.bubble) return;
      if (name === 'theme') this.applyTheme();
      if (name === 'page' && oldV && oldV !== newV && this.classList.contains('awake')) this.onPage(newV);
    }

    applyTheme() {
      const dark = this.getAttribute('theme') === 'dark';
      const host = this.shadowRoot.host.style;
      host.setProperty('--bub-bg', dark ? '#23272e' : '#fffdf4');
      host.setProperty('--bub-fg', dark ? '#f3f1ea' : '#1c1c1a');
      host.setProperty('--bub-border', dark ? '#454c57' : '#c7bfa9');
      host.setProperty('--bub-shadow', dark ? 'rgba(0,0,0,0.5)' : 'rgba(28,28,26,0.18)');

      for (const [cls, color] of Object.entries(dark ? DARK : LIGHT)) {
        for (const stop of this.shadowRoot.querySelectorAll('.' + cls)) stop.setAttribute('stop-color', color);
      }

      const dim = (sel, l, d) => {
        for (const el of this.shadowRoot.querySelectorAll(sel)) el.setAttribute('opacity', String(dark ? d : l));
      };
      dim('.spec-broad, .peek-spec', 0.5, 0.32);
      dim('.belly', 0.5, 0.34);
      dim('.rim', 0.4, 0.72);
      const rim = this.shadowRoot.querySelector('.rim');
      if (rim) rim.setAttribute('stroke', dark ? '#cfe0f2' : '#fff0f7');
      for (const wh of this.shadowRoot.querySelectorAll('.whiskers')) {
        wh.setAttribute('stroke', dark ? '#d7b3c2' : '#f0c7d6');
      }
      this.parts.shadow.setAttribute('fill', dark ? 'rgba(0,0,0,0.48)' : 'rgba(0,0,0,0.18)');
    }

    setPeek() {
      const x = [48, 32, 15][Math.min(this.nudges, 2)];
      this.bed.style.setProperty('--peek-x', x + 'px');
      this.peeker.style.transform = 'translateX(' + x + 'px)';
    }

    center(el) {
      const r = el.getBoundingClientRect();
      return r.left + r.width / 2;
    }

    place(el, anchorCenterX) {
      el.style.left = '0px';
      const w = el.offsetWidth;
      const left = Math.max(10, Math.min(window.innerWidth - w - 10, Math.round(anchorCenterX - w / 2)));
      el.style.left = left + 'px';
      const tail = Math.max(18, Math.min(w - 18, anchorCenterX - left));
      el.style.setProperty('--tail-x', tail + 'px');
    }

    bedSay(text, ms) {
      this.bedBubble.textContent = text;
      this.bedBubble.classList.add('show');
      this.place(this.bedBubble, this.center(this.bed));
      clearTimeout(this.bedTimer);
      this.bedTimer = setTimeout(() => this.bedBubble.classList.remove('show'), ms);
    }

    say(text, ms) {
      this.bubble.innerHTML = '';
      this.bubble.textContent = text;
      this.bubble.classList.add('show');
      this.place(this.bubble, this.center(this.el));
      clearTimeout(this.bubbleTimer);
      this.bubbleTimer = setTimeout(() => this.bubble.classList.remove('show'), ms);
    }

    start(name, ms) {
      this.activity = name;
      this.activityUntil = performance.now() + ms;
    }

    nudge() {
      if (this.classList.contains('awake')) return;
      this.bed.classList.remove('stir');
      void this.bed.offsetWidth;
      this.bed.classList.add('stir');
      this.nudges += 1;
      this.setPeek();
      if (this.nudges === 1) this.bedSay('Oh. You can see me.', 2600);
      else if (this.nudges === 2) this.bedSay('Coming out, hold on.', 2200);
      else this.wake();
    }

    wake() {
      this.classList.add('awake');
      clearInterval(this.peekTimer);
      this.start('excited', 1000);
      this.say('Made it. I’m Mochi.', 3200);
      setTimeout(() => {
        this.start('wave', 2000);
        this.say('I give tours and let you explain bugs at me. Tap me.', 4600);
      }, 3400);
    }

    onPage(page) {
      const tip = TIPS[page];
      if (!tip || this.classList.contains('hidden')) return;
      clearTimeout(this.pageTimer);
      this.pageTimer = setTimeout(() => { this.start('look', 1600); this.say(tip, 4200); }, 700);
    }

    emit(name, detail) { window.dispatchEvent(new CustomEvent(name, { detail })); }

    openHelp() {
      const page = this.getAttribute('page') || 'about';
      this.bubble.innerHTML = '';
      const p = document.createElement('div');
      p.textContent = HELP[page] || HELP.about;
      this.bubble.appendChild(p);
      const acts = document.createElement('div');
      acts.className = 'acts';
      const options = [
        { label: 'Show me what she’s built', run: () => this.emit('duck-nav', { page: 'projects' }) },
        { label: 'I need a website like these', run: () => this.emit('duck-nav', { page: 'products' }) },
        { label: 'I’ll put in a good word', run: () => this.emit('duck-reference', {}) },
        { label: 'How do I reach her?', run: () => this.emit('duck-nav', { page: 'contact' }) },
        { label: 'I’m fine — go nap', run: () => { this.classList.add('hidden'); this.bubble.classList.remove('show'); } },
      ];
      for (const o of options) {
        const b = document.createElement('button');
        b.textContent = o.label;
        b.addEventListener('click', (e) => { e.stopPropagation(); o.run(); this.bubble.classList.remove('show'); });
        acts.appendChild(b);
      }
      this.bubble.appendChild(acts);
      this.bubble.classList.add('show');
      this.place(this.bubble, this.center(this.el));
      clearTimeout(this.bubbleTimer);
      this.bubbleTimer = setTimeout(() => this.bubble.classList.remove('show'), 9000);
    }

    onClick() {
      this.start('excited', 900);
      if (this.bubble.classList.contains('show') && this.bubble.querySelector('.acts')) {
        this.quipIndex = (this.quipIndex + 1) % QUIPS.length;
        this.say(QUIPS[this.quipIndex], 2400);
      } else {
        this.openHelp();
      }
    }

    tick = (now) => {
      this.last = now;
      const p = this.parts;
      const awake = this.classList.contains('awake');

      if (this.activity && now > this.activityUntil) this.activity = null;

      if (awake && !this.activity && !this.reduced && now > this.nextIdle) {
        const pick = ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];
        this.start(pick.name, pick.ms);
        if (pick.say) this.say(pick.say, pick.ms);
        this.nextIdle = now + 8000 + Math.random() * 6000;
      }

      if (now > this.nextBlink) { this.blinkUntil = now + 130; this.nextBlink = now + 2600 + Math.random() * 3200; }
      const blinking = now < this.blinkUntil;

      let bodyRot = Math.sin(now / 900) * 1.1, lift = 0, headRot = 0;
      let armWave = 0, pawRot = 0, armFar = 0;
      let tailRot = Math.sin(now / 900) * 9, earRot = 0;
      let pupilDx = 0, pupilDy = 0, eyeScale = 1, slitScale = 1, cheek = 0, tongue = 0;

      if (this.activity === 'wave') {
        armWave = -104;
        pawRot = Math.sin(now / 95) * 22;
        headRot = -3;
        tailRot = Math.sin(now / 260) * 20;
        earRot = Math.sin(now / 300) * 5;
        cheek = 0.9;
        pupilDy = -0.6;
        slitScale = 0.85;
      } else if (this.activity === 'excited') {
        const t = 1 - (this.activityUntil - now) / 900;
        lift = Math.sin(t * Math.PI * 2) * 13;
        bodyRot = Math.sin(t * Math.PI * 3) * 6;
        armWave = -118;
        armFar = 118;
        tailRot = Math.sin(now / 150) * 26;
        earRot = Math.sin(now / 130) * 9;
        eyeScale = 1.14;
        slitScale = 1.4;
        cheek = 1;
        tongue = 0.85;
      } else if (this.activity === 'groom') {
        headRot = Math.sin(now / 200) * 9 - 3;
        armWave = -140;
        pawRot = Math.sin(now / 150) * 14;
        tailRot = Math.sin(now / 700) * 6;
        earRot = Math.sin(now / 400) * 6;
        tongue = 0.9;
        cheek = 0.4;
        slitScale = 0.7;
      } else if (this.activity === 'look') {
        const sn = Math.sin(now / 700);
        pupilDx = sn * 2.6;
        headRot = sn * 5;
        earRot = sn * 10;
      }

      this.el.style.transform = `translateY(${-lift}px)`;
      if (this.bubble.classList.contains('show')) this.place(this.bubble, this.center(this.el));

      p.whole.setAttribute('transform', `rotate(${bodyRot} 60 118)`);
      p.head.setAttribute('transform', `rotate(${headRot} 60 86)`);
      p.tail.setAttribute('transform', `rotate(${tailRot} 84 110)`);
      p.armWave.setAttribute('transform', `rotate(${armWave} 80 98)`);
      p.paw.setAttribute('transform', `rotate(${pawRot} 80 98)`);
      p.armFar.setAttribute('transform', `rotate(${armFar} 40 98)`);
      p.earL.setAttribute('transform', `rotate(${-earRot} 48 44)`);
      p.earR.setAttribute('transform', `rotate(${72 + earRot * 0.35} 72 44)`);
      p.cheekL.setAttribute('opacity', String(0.35 + cheek * 0.4));
      p.cheekR.setAttribute('opacity', String(0.35 + cheek * 0.4));
      p.tongue.setAttribute('opacity', String(tongue));

      for (const el of [p.pupilL, p.pupilR, p.slitL, p.slitR, p.glintL, p.glintR]) {
        el.setAttribute('transform', `translate(${pupilDx} ${pupilDy})`);
      }
      p.slitL.setAttribute('rx', String(2.5 * slitScale));
      p.slitR.setAttribute('rx', String(2.5 * slitScale));

      const ry = blinking ? 1 : 11 * eyeScale;
      p.eyeL.setAttribute('ry', String(ry));
      p.eyeR.setAttribute('ry', String(ry));
      p.eyeL.setAttribute('rx', String(9.5 * eyeScale));
      p.eyeR.setAttribute('rx', String(9.5 * eyeScale));
      p.slitL.setAttribute('opacity', blinking ? '0' : '1');
      p.slitR.setAttribute('opacity', blinking ? '0' : '1');
      p.pupilL.setAttribute('opacity', blinking ? '0' : '0.95');
      p.pupilR.setAttribute('opacity', blinking ? '0' : '0.95');
      p.glintL.setAttribute('opacity', blinking ? '0' : '0.5');
      p.glintR.setAttribute('opacity', blinking ? '0' : '0.5');

      this.raf = requestAnimationFrame(this.tick);
    };
  }

  if (!customElements.get('site-assistant')) customElements.define('site-assistant', SiteAssistant);
})();
