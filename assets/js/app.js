/* ============================================================
   BLENDMANDU — shell, cart, shop, checkout
   ============================================================ */

/* Product pages live one directory down, so every internal link is written
   relative to this. Each page sets it before app.js loads. */
const BASE = document.documentElement.dataset.base || '';

const CART_KEY = 'blendmandu.cart.v1';
const GATE_KEY = 'blendmandu.zone.v1';

/* ---------- helpers ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = n => `${SHOP.currency} ${n.toLocaleString('en-IN')}`;
const byId  = id => PRODUCTS.find(p => p.id === id);
const esc   = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- storage ----------
   Touching localStorage THROWS (not returns null) when site data is
   blocked — Safari's "Block All Cookies", hardened privacy settings, some
   embedded webviews. Every access goes through these so a blocked browser
   loses persistence but still gets a working shop. */
const store = {
  get(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key, val) {
    try { localStorage.setItem(key, val); return true; } catch { return false; }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch {}
  },
};

/* ---------- cart store ---------- */
function readCart() {
  try { return JSON.parse(store.get(CART_KEY)) || {}; }
  catch { return {}; }
}
function writeCart(c) {
  store.set(CART_KEY, JSON.stringify(c));
  paintCount();
  document.dispatchEvent(new CustomEvent('cart:change'));
}
const cartCount    = () => Object.values(readCart()).reduce((a, b) => a + b, 0);
const cartSubtotal = () => Object.entries(readCart())
  .reduce((sum, [id, q]) => sum + ((byId(id)?.price || 0) * q), 0);

function addToCart(id, qty = 1) {
  const c = readCart();
  c[id] = (c[id] || 0) + qty;
  writeCart(c);
  toast(t('toast.added', { name: byId(id).name }));
  track('add_to_cart', { item_id: id, quantity: qty, value: byId(id).price * qty, currency: 'NPR' });
}
function setQty(id, qty) {
  const c = readCart();
  if (qty <= 0) delete c[id]; else c[id] = qty;
  writeCart(c);
}

function paintCount() {
  paintCartBar();
  const n = cartCount();
  $$('.cart-count').forEach(el => {
    el.textContent = n;
    el.classList.toggle('is-on', n > 0);
  });
}

/* ---------- toast ---------- */
let toastTimer;
function toast(msg) {
  let t = $('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    document.body.appendChild(t);
  }
  t.textContent = msg;
  requestAnimationFrame(() => t.classList.add('is-up'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-up'), 2200);
}

/* ============================================================
   SHELL — header, ticker, footer, bolts
   ============================================================ */
/* The same page in the other language. English lives at the site root,
   Nepali under /ne/, so it is a prefix swap on the current path. */
function altLangHref() {
  let p = location.pathname;
  if (!p || p.endsWith('/')) p += 'index.html';
  return LANG === 'ne'
    ? p.replace(/^\/ne(\/|$)/, '/')
    : '/ne' + p;
}

const BOLT = `<svg class="bolt bolt--%SIDE%" viewBox="0 0 120 60" aria-hidden="true">
  <path d="M4 40 L46 4 L38 26 L74 14 L34 56 L44 34 Z" fill="currentColor"/>
  <path d="M62 46 L92 20 L86 36 L116 28 L84 58 L92 42 Z" fill="currentColor" opacity=".75"/>
</svg>`;

function renderShell(active) {
  const TICKER = [
    t('ticker.open'), t('ticker.area'), t('ticker.fresh'),
    t('ticker.free', { amount: money(SHOP.freeDeliveryOver) }), t('ticker.pay'),
  ].join('&nbsp;&nbsp;') + '&nbsp;';

  document.body.insertAdjacentHTML('afterbegin', `
    <header class="masthead">
      <div class="masthead__grid">
        <div class="masthead__side">
          <a class="navlink" href="${BASE}index.html">${t('nav.home')}</a>
          <a class="pill pill--accent" href="${BASE}shop.html">${t('nav.order')}</a>
        </div>

        <a class="badge" href="${BASE}index.html" aria-label="${SHOP.brand} home">
          <span class="badge__box">
            <span class="badge__line">${SHOP.brandLine1}</span>
            <span class="badge__line">${SHOP.brandLine2}</span>
          </span>
          <span class="badge__tab">${SHOP.brandTab}</span>
        </a>

        <div class="masthead__side masthead__side--right">
          <button class="navlink menu-btn" id="menu-open" aria-expanded="false" aria-controls="menu-overlay">
            ${t('nav.menu')}
            <span class="burger" aria-hidden="true"><i></i><i></i><i></i></span>
          </button>
          <a class="circle-btn lang-btn" href="${altLangHref()}" hreflang="${LANG === 'en' ? 'ne' : 'en'}"
             data-lang-switch lang="${LANG === 'en' ? 'ne' : 'en'}" aria-label="${LANG === 'en' ? 'Nepali / नेपाली' : 'English'}">${LANG === 'en' ? 'NE' : 'EN'}</a>
          <a class="circle-btn cart-btn" href="${BASE}cart.html" aria-label="${t('nav.cart')}">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>
            </svg>
            <span class="cart-count">0</span>
          </a>
        </div>
      </div>

      <div class="ticker" aria-hidden="true">
        <div class="ticker__track">
          <span>${TICKER}</span>
          <span>${TICKER}</span>
        </div>
      </div>
    </header>
  `);

  document.body.insertAdjacentHTML('beforeend', `
    <footer class="footer">
      <div class="shell">
        <div class="footer__cols">
          <div>
            <div class="footer__title">${SHOP.brand}</div>
            <p style="font-size:.95rem">${t('footer.blurb')}</p>
          </div>
          <div>
            <div class="footer__title">${t('footer.menu')}</div>
            <ul class="footer__list">
              ${CATEGORIES.filter(c => c.id !== 'all')
                .map(c => `<li><a href="${BASE}shop.html#${c.id}">${cLabel(c)}</a></li>`).join('')}
            </ul>
          </div>
          <div>
            <div class="footer__title">${t('footer.order')}</div>
            <ul class="footer__list">
              <li><a href="https://wa.me/${SHOP.whatsapp}">WhatsApp ${SHOP.phone}</a></li>
              <li><a href="mailto:${SHOP.email}">${SHOP.email}</a></li>
              <li><a href="${SHOP.instagram}">Instagram</a></li>
              <li><a href="${BASE}cart.html">${t('nav.cart')}</a></li>
            </ul>
          </div>
          <div>
            <div class="footer__title">${t('footer.drop')}</div>
            <p style="font-size:.95rem;margin-bottom:12px">${t('footer.dropBlurb')}</p>
            ${newsletterHTML('news-footer')}
          </div>
        </div>
        <div class="footer__bar">
          <span>${t('footer.rights', { year: new Date().getFullYear(), brand: SHOP.brand })}</span>
          <nav class="footer__legal" aria-label="${t('footer.legal')}">
            <a href="${BASE}cookies.html">${t('footer.cookies')}</a>
            <a href="${BASE}privacy-policy.html">${t('footer.privacy')}</a>
            <a href="${BASE}return-policy.html">${t('footer.refunds')}</a>
            <a href="${BASE}terms.html">${t('footer.terms')}</a>
            <a href="${BASE}contact.html">${t('nav.contact')}</a>
          </nav>
        </div>
      </div>
    </footer>
    ${BOLT.replace('%SIDE%', 'l')}
    ${BOLT.replace('%SIDE%', 'r')}

    <div class="menu-overlay" id="menu-overlay" role="dialog" aria-modal="true"
         aria-label="${t('nav.menu')}" aria-hidden="true">
      <button class="menu-close" id="menu-close" aria-label="${t('nav.close')}">&times;</button>
      <nav class="menu-nav">
        ${[
          [`${BASE}index.html`, t('nav.home')],
          [`${BASE}shop.html`, t('nav.order')],
          [`${BASE}index.html#about`, t('nav.about')],
          [`${BASE}index.html#how`, t('nav.how')],
          [`${BASE}cart.html`, t('nav.cart')],
          [`${BASE}contact.html`, t('nav.contact')],
        ].map(([href, label], i) =>
          `<a href="${href}" style="--i:${i}">${label}</a>`).join('')}
      </nav>
      <div class="menu-foot">
        <a href="https://wa.me/${SHOP.whatsapp}">WhatsApp ${SHOP.phone}</a>
        <span>${t('ticker.open')} &middot; ${t('ticker.area')}</span>
      </div>
    </div>
  `);

  initMenu();
  paintCount();
  $('[data-lang-switch]')?.addEventListener('click', () =>
    track('language_switch', { from: LANG, to: LANG === 'en' ? 'ne' : 'en' }));
}

/* ---- modal plumbing ----
   A full-screen overlay that leaves the page behind it tabbable is not a
   dialog, it is a picture of one: a keyboard or screen-reader user tabs
   straight off the menu into content they cannot see. `inert` removes the
   background from the accessibility tree and the tab order in one go, and
   the Tab handler is the fallback for browsers without it. */
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

function openModal(el, firstFocus) {
  el._prevFocus = document.activeElement;
  [...document.body.children].forEach(c => {
    if (c === el || c.contains(el)) return;
    if ('inert' in HTMLElement.prototype) c.inert = true;
    else { c.setAttribute('aria-hidden', 'true'); c.dataset.wasHidden = '1'; }
  });
  document.body.style.overflow = 'hidden';
  lenis?.stop();
  (firstFocus || el.querySelector(FOCUSABLE))?.focus();
  el._keydown = e => {
    if (e.key !== 'Tab') return;
    const f = [...el.querySelectorAll(FOCUSABLE)].filter(n => n.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  el.addEventListener('keydown', el._keydown);
}

function closeModal(el) {
  [...document.body.children].forEach(c => {
    if ('inert' in HTMLElement.prototype) c.inert = false;
    if (c.dataset.wasHidden) { c.removeAttribute('aria-hidden'); delete c.dataset.wasHidden; }
  });
  document.body.style.overflow = '';
  lenis?.start();
  if (el._keydown) el.removeEventListener('keydown', el._keydown);
  el._prevFocus?.focus?.();
}

/* ---- full-screen menu overlay ---- */
function initMenu() {
  const overlay = $('#menu-overlay');
  const openBtn = $('#menu-open');
  if (!overlay || !openBtn) return;

  function open() {
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    openBtn.setAttribute('aria-expanded', 'true');
    openModal(overlay, $('#menu-close'));
  }
  function close() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    openBtn.setAttribute('aria-expanded', 'false');
    closeModal(overlay);
  }

  openBtn.addEventListener('click', open);
  $('#menu-close')?.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  overlay.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
  });
}

/* ============================================================
   GATE — "are you inside Kathmandu?" (the delivery-area check)
   ============================================================ */
function renderGate() {
  if (store.get(GATE_KEY) === 'in') return;

  const el = document.createElement('div');
  el.className = 'gate';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', t('gate.ask'));
  el.innerHTML = `
    <div class="gate__inner">
      <div class="gate__ask">
        <p class="eyebrow">${t('gate.ask')}</p>
        <h1>${t('gate.title')}</h1>
        <div class="gate__btns">
          <button class="pill pill--accent" data-in>${t('gate.yes')}</button>
          <button class="pill pill--ink" data-out>${t('gate.no')}</button>
        </div>
        <p class="lede" style="margin-inline:auto">${t('gate.blurb')}</p>
      </div>
      <div class="gate__no">
        <p class="eyebrow eyebrow--accent">${t('gate.out.eyebrow')}</p>
        <h1>${t('gate.out.title')}</h1>
        <p class="lede" style="margin-inline:auto">${t('gate.out.blurb')}</p>
        ${newsletterHTML('news-gate')}
        <p style="margin-top:20px"><button class="pill pill--ghost" data-back>${t('gate.out.back')}</button></p>
      </div>
    </div>`;
  document.body.appendChild(el);
  openModal(el);

  el.addEventListener('click', e => {
    if (e.target.closest('[data-in]'))   { store.set(GATE_KEY, 'in'); closeModal(el); el.remove(); }
    if (e.target.closest('[data-out]'))  { el.classList.add('is-out'); }
    if (e.target.closest('[data-back]')) { el.classList.remove('is-out'); }
  });
}

/* ============================================================
   SHOP PAGE
   ============================================================ */
function cardHTML(p) {
  return `
    <article class="card">
      <div class="card__art">
        ${pTag(p) ? `<span class="card__tag">${esc(pTag(p))}</span>` : ''}
        ${productArt(p)}
      </div>
      <h3 class="card__name">${esc(pName(p))}</h3>
      <p class="card__meta meta">${esc(pMeta(p))}</p>
      <div class="card__foot">
        <span class="card__price">${money(p.price)}</span>
        <button class="pill pill--accent" data-add="${p.id}">${t('product.add')}</button>
      </div>
    </article>`;
}

function initShop() {
  const grid    = $('#grid');
  const filters = $('#filters');
  if (!grid) return;

  const input = $('#q');
  const clear = $('#search-clear');
  const count = $('#search-count');

  let cat = 'all';
  let query = '';

  filters.innerHTML = CATEGORIES.map(c =>
    `<li><button class="filters__btn" data-cat="${c.id}">${cLabel(c)}</button></li>`).join('');

  const label = id => {
    const c = CATEGORIES.find(x => x.id === id);
    return c ? cLabel(c) : '';
  };

  /* Match across everything a customer might reasonably type: the name,
     the description, the category, the tag, even the allergen line
     ("peanut" should find the peanut butter blend). */
  function matches(p, q) {
    if (!q) return true;
    // search both languages so "mango" finds it on the Nepali page too
    const hay = [p.name, p.blurb, p.meta, p.tag, p.allergens,
                 pBlurb(p), pMeta(p), pTag(p), pAllergens(p), label(p.cat)]
      .filter(Boolean).join(' ').toLowerCase();
    return q.toLowerCase().split(/\s+/).filter(Boolean).every(t => hay.includes(t));
  }

  function draw() {
    const list = PRODUCTS
      .filter(p => cat === 'all' || p.cat === cat)
      .filter(p => matches(p, query));

    grid.innerHTML = list.length
      ? list.map(cardHTML).join('')
      : `<div class="empty" style="grid-column:1/-1">
           <p class="eyebrow eyebrow--accent">${t('shop.noneEyebrow')}</p>
           <h3>${esc(t('shop.noneTitle', { q: query }))}</h3>
           <p class="lede" style="margin-inline:auto">${t('shop.noneBlurb')}</p>
           <button class="pill pill--accent" data-reset-search>${t('shop.showAll')}</button>
         </div>`;

    $$('.filters__btn', filters).forEach(b =>
      b.classList.toggle('is-active', b.dataset.cat === cat));

    if (count) {
      count.textContent = query
        ? t(list.length === 1 ? 'shop.result' : 'shop.results', { n: list.length, q: query })
        : '';
    }
    if (clear) clear.hidden = !query;

    // keep the URL shareable: ?q=mango#smoothies
    const qs = query ? `?q=${encodeURIComponent(query)}` : '';
    const hash = cat === 'all' ? '' : `#${cat}`;
    history.replaceState(null, '', location.pathname + qs + hash);
  }

  filters.addEventListener('click', e => {
    const b = e.target.closest('[data-cat]');
    if (b) { cat = b.dataset.cat; draw(); }
  });

  grid.addEventListener('click', e => {
    const b = e.target.closest('[data-add]');
    if (b) { addToCart(b.dataset.add); return; }
    if (e.target.closest('[data-reset-search]')) {
      query = ''; cat = 'all';
      if (input) input.value = '';
      draw();
    }
  });

  if (input) {
    let t;
    input.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        query = input.value.trim();
        draw();
        if (query.length > 2) track('search', { search_term: query });
      }, 120);
    });
    $('#search-form')?.addEventListener('submit', e => e.preventDefault());
    clear?.addEventListener('click', () => {
      input.value = ''; query = ''; draw(); input.focus();
    });
    // "/" focuses search, the way every search-forward site behaves
    document.addEventListener('keydown', e => {
      if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
        e.preventDefault(); input.focus(); input.select();
      }
      if (e.key === 'Escape' && document.activeElement === input) {
        input.value = ''; query = ''; draw(); input.blur();
      }
    });
  }

  // restore state from the URL so a shared link lands on the same view
  const startCat = location.hash.slice(1);
  if (CATEGORIES.some(c => c.id === startCat)) cat = startCat;
  const startQ = new URLSearchParams(location.search).get('q');
  if (startQ) { query = startQ; if (input) input.value = startQ; }

  draw();
}

/* ---------- featured strip on the home page ---------- */
function initFeatured() {
  const strip = $('#featured');
  if (!strip) return;
  strip.innerHTML = PRODUCTS.filter(p => p.tag === 'Bestseller' || p.id === 'green-machine')
    .slice(0, 4).map(cardHTML).join('');
  strip.addEventListener('click', e => {
    const b = e.target.closest('[data-add]');
    if (b) addToCart(b.dataset.add);
  });
}

/* ============================================================
   CART + CHECKOUT
   ============================================================ */
const zoneName = z => (ZONE_I18N[LANG] && ZONE_I18N[LANG][z.id]) || z.name;
const payLabel = m => (PAYMENT_I18N[LANG] && PAYMENT_I18N[LANG][m.id] && PAYMENT_I18N[LANG][m.id].label) || m.label;
const payNote  = m => (PAYMENT_I18N[LANG] && PAYMENT_I18N[LANG][m.id] && PAYMENT_I18N[LANG][m.id].note)  || m.note;

function deliveryFee() {
  const zoneId = $('#zone')?.value;
  const zone = SHOP.zones.find(z => z.id === zoneId) || SHOP.zones[0];
  return cartSubtotal() >= SHOP.freeDeliveryOver ? 0 : zone.fee;
}

function initCart() {
  const lines = $('#lines');
  if (!lines) return;

  $('#zone').innerHTML = SHOP.zones
    .map(z => `<option value="${z.id}">${esc(zoneName(z))} — ${money(z.fee)}</option>`).join('');

  $('#pay').innerHTML = SHOP.payments.map((m, i) => `
    <label class="choice">
      <input type="radio" name="pay" value="${m.id}" ${i === 0 ? 'checked' : ''}>
      <span>
        <span class="choice__label">${esc(payLabel(m))}</span><br>
        <span class="choice__note">${esc(payNote(m))}</span>
      </span>
    </label>`).join('');

  function draw() {
    const cart = readCart();
    const ids = Object.keys(cart);

    if (!ids.length) {
      $('#cart-body').hidden = true;
      $('#cart-empty').hidden = false;
      return;
    }
    $('#cart-body').hidden = false;
    $('#cart-empty').hidden = true;

    lines.innerHTML = ids.map(id => {
      const p = byId(id); if (!p) return '';
      const q = cart[id];
      return `
        <div class="cartline">
          <div class="cartline__art">${productArt(p)}</div>
          <div>
            <div class="cartline__name">${esc(pName(p))}</div>
            <div class="meta">${esc(pMeta(p))} · ${money(p.price)}</div>
          </div>
          <div class="cartline__side" style="display:flex;gap:14px;align-items:center">
            <span class="qty">
              <button data-dec="${id}" aria-label="${t('cart.decrease')}">&minus;</button>
              <span>${q}</span>
              <button data-inc="${id}" aria-label="${t('cart.increase')}">+</button>
            </span>
            <strong class="card__price">${money(p.price * q)}</strong>
          </div>
        </div>`;
    }).join('');

    const sub  = cartSubtotal();
    const ship = deliveryFee();
    $('#sub').textContent  = money(sub);
    $('#ship').textContent = ship === 0 ? t('cart.free') : money(ship);
    $('#grand').textContent = money(sub + ship);
    $('#free-hint').textContent = sub >= SHOP.freeDeliveryOver
      ? t('cart.freeDone')
      : t('cart.freeHint', { amount: money(SHOP.freeDeliveryOver - sub) });
  }

  lines.addEventListener('click', e => {
    const inc = e.target.closest('[data-inc]');
    const dec = e.target.closest('[data-dec]');
    const c = readCart();
    if (inc) setQty(inc.dataset.inc, Math.min(20, (c[inc.dataset.inc] || 0) + 1));
    if (dec) setQty(dec.dataset.dec, (c[dec.dataset.dec] || 0) - 1);
  });

  $('#zone').addEventListener('change', draw);
  document.addEventListener('cart:change', draw);

  // "now" vs "schedule"
  $('#when').addEventListener('change', () => {
    $('#when-later').hidden = $('#when').value !== 'later';
  });

  let checkoutStarted = false;
  $('#checkout').addEventListener('focusin', () => {
    if (checkoutStarted) return;
    checkoutStarted = true;
    track('begin_checkout', { value: cartSubtotal(), currency: 'NPR', items: cartCount() });
  });

  $('#checkout').addEventListener('submit', e => {
    e.preventDefault();
    placeOrder();
  });

  draw();
}

function placeOrder() {
  const cart = readCart();
  const ids = Object.keys(cart);
  if (!ids.length) return toast(t('toast.cartEmpty'));

  /* A toast alone tells a screen-reader user that *something* is wrong but
     not which field or why. aria-invalid plus a message wired through
     aria-describedby puts the error on the field itself. */
  const clearError = el => {
    el.removeAttribute('aria-invalid');
    const msg = document.getElementById(`${el.id}-err`);
    if (msg) msg.remove();
    el.removeAttribute('aria-describedby');
  };
  const setError = (el, why) => {
    el.setAttribute('aria-invalid', 'true');
    let msg = document.getElementById(`${el.id}-err`);
    if (!msg) {
      msg = document.createElement('p');
      msg.id = `${el.id}-err`;
      msg.className = 'field__error';
      el.insertAdjacentElement('afterend', msg);
    }
    msg.textContent = why;
    el.setAttribute('aria-describedby', msg.id);
    el.focus();
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    toast(why);
  };

  ['#name', '#phone', '#address', '#when-at'].forEach(sel => {
    const el = $(sel); if (el) clearError(el);
  });

  const required = [
    ['#name',    t('toast.needName')],
    ['#phone',   t('toast.needPhone')],
    ['#address', t('toast.needAddress')],
  ];
  for (const [sel, why] of required) {
    const el = $(sel);
    if (!el.value.trim()) return setError(el, why);
  }
  if (!/^(\+?977)?[\s-]?9\d{8,9}$/.test($('#phone').value.replace(/[\s-]/g, ''))) {
    return setError($('#phone'), t('toast.badPhone'));
  }
  if ($('#when').value === 'later' && !$('#when-at').value) {
    return setError($('#when-at'), t('toast.needTime'));
  }

  const zone = SHOP.zones.find(z => z.id === $('#zone').value);
  const pay  = SHOP.payments.find(m => m.id === $('input[name="pay"]:checked').value);
  const sub  = cartSubtotal();
  const ship = deliveryFee();

  const when = $('#when').value === 'later'
    ? t('order.scheduled', { time: $('#when-at').value || t('order.timeTbc') })
    : t('order.asap');

  const lines = ids.map(id => {
    const p = byId(id);
    return `• ${cart[id]} x ${p.name} — ${money(p.price * cart[id])}`;
  }).join('\n');

  const msg =
`${t('order.heading')} — ${SHOP.brand}

${lines}

${t('order.subtotal')}: ${money(sub)}
${t('order.delivery')}: ${ship === 0 ? t('cart.free') : money(ship)}
${t('order.total')}: ${money(sub + ship)}

${t('order.name')}: ${$('#name').value}
${t('order.phone')}: ${$('#phone').value}
${t('order.area')}: ${zoneName(zone)}
${t('order.address')}: ${$('#address').value}
${t('order.landmark')}: ${$('#landmark').value || '—'}
${t('order.when')}: ${when}
${t('order.payment')}: ${payLabel(pay)}
${t('order.notes')}: ${$('#notes').value || '—'}`;

  saveLastOrder(cart);
  track('order_sent', {
    value: sub + ship, currency: 'NPR',
    items: ids.length, units: cartCount(),
    payment: pay.id, zone: zone.id, lang: LANG,
  });

  window.open(`https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  toast(t('toast.opening'));
}


/* ============================================================
   MOTION
   ============================================================ */
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- smooth scroll ----
   Lenis, same as the reference build. A hand-rolled version fought every
   scroll it didn't originate (anchor jumps, restored positions, the
   scrollbar) and sent the page wandering. Lenis drives the REAL document
   scroll, so position:sticky and the pinned sections keep working.
------------------------------------------------------------- */
let lenis = null;

function initSmoothScroll() {
  if (REDUCED || typeof Lenis === 'undefined') return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  lenis = new Lenis({
    duration: 1.05,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    syncTouch: false,          // native momentum already wins on phones
  });

  const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href') === '#') return;
    const dest = document.querySelector(a.getAttribute('href'));
    if (!dest) return;
    e.preventDefault();
    lenis.scrollTo(dest, { offset: -110 });
  });
}

/* ---- scroll reveals (the cheap half of what GSAP does for them) ----
   Three rules learned the hard way, because a stuck reveal means a blank
   shop page and a lost order:
     1. threshold 0, never a ratio. A 4000px-tall container can never show
        8% of its own area in an 863px viewport, so it would hide forever.
     2. anything already on screen at load is revealed synchronously.
     3. a failsafe timer reveals everything regardless, so a missed
        observer degrades to "no animation", never to "no content".
------------------------------------------------------------- */
function initReveals(root = document) {
  const items = $$('[data-reveal]', root).filter(el => !el.classList.contains('is-in'));
  if (!items.length) return;

  const showAll = () => items.forEach(el => el.classList.add('is-in'));

  if (REDUCED || !('IntersectionObserver' in window)) return showAll();

  // already in view? show it now — don't wait on an observer callback
  items.forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in');
  });

  const pending = items.filter(el => !el.classList.contains('is-in'));
  if (!pending.length) return;

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      obs.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });

  pending.forEach(el => io.observe(el));

  clearTimeout(initReveals._failsafe);
  initReveals._failsafe = setTimeout(showAll, 2500);
}

/* Tag what's worth revealing. Containers taller than the viewport are
   skipped — fading a 4000px block in as one unit looks wrong anyway, and
   its children carry the animation instead. */
function markReveals(root = document) {
  const candidates = [
    ...$$('.section > *', root),
    ...$$('.hero > *', root),
  ];
  candidates.forEach(el => {
    if (el.offsetHeight > innerHeight * 0.9) return;
    el.setAttribute('data-reveal', '');
  });

  $$('.grid', root).forEach(grid => {
    grid.removeAttribute('data-reveal');
    $$('.card', grid).forEach((c, i) => {
      c.setAttribute('data-reveal', '');
      c.style.setProperty('--i', String(i % 4));
    });
  });
}


/* ---------- newsletter ----------
   No reCAPTCHA: it needs Google keys, adds a third-party dependency and
   punishes people on slow connections. A honeypot plus a time trap stops
   the naive bots that actually hit a form this small.
--------------------------------------------------- */
function newsletterHTML(id) {
  return `<form class="newsletter" data-newsletter id="${id}" novalidate>
      <input class="input" type="email" name="email" required
             placeholder="${t('footer.email')}" aria-label="${t('footer.email')}" autocomplete="email">
      <input class="hp" type="text" name="company" tabindex="-1" autocomplete="off" aria-hidden="true">
      <input type="hidden" name="ts" value="${Date.now()}">
      <button class="pill pill--ink" type="submit">${t('footer.join')}</button>
    </form>`;
}

function initNewsletter() {
  document.addEventListener('submit', async e => {
    const form = e.target.closest('[data-newsletter]');
    if (!form) return;
    e.preventDefault();

    if (form.querySelector('[name="company"]').value) return;          // honeypot filled → bot
    const age = Date.now() - Number(form.querySelector('[name="ts"]').value || 0);
    if (age < 2500) return;                                            // submitted too fast → bot

    const email = form.querySelector('[name="email"]').value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) return toast(t('news.invalid'));

    const btn = form.querySelector('button');
    const label = btn.textContent;

    if (!SHOP.newsletterEndpoint) {                                    // not wired up yet
      toast(t('toast.subscribed'));
      track('newsletter_signup', { configured: false });
      form.reset();
      return;
    }

    btn.disabled = true; btn.textContent = t('news.sending');
    try {
      const res = await fetch(SHOP.newsletterEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, lang: LANG }),
      });
      if (!res.ok) throw new Error(res.status);
      toast(t('toast.subscribed'));
      track('newsletter_signup', { configured: true });
      form.reset();
    } catch {
      toast(t('news.error'));
    } finally {
      btn.disabled = false; btn.textContent = label;
    }
  });
}

/* ---------- sticky cart bar ----------
   On a phone the header cart icon scrolls to a 20px target. This keeps the
   running total and a real tap target on screen the whole way down. */
function renderCartBar() {
  if (SHOP.stickyCartBar === false) return;
  if (document.body.dataset.page === 'cart') return;
  const bar = document.createElement('a');
  bar.className = 'cartbar';
  bar.href = `${BASE}cart.html`;
  bar.id = 'cartbar';
  document.body.appendChild(bar);
  paintCartBar();
}

function paintCartBar() {
  const bar = $('#cartbar');
  if (!bar) return;
  const n = cartCount();
  const sub = cartSubtotal();
  const left = SHOP.freeDeliveryOver - sub;

  bar.classList.toggle('is-up', n > 0);
  if (!n) return;

  const pct = Math.min(100, Math.round((sub / SHOP.freeDeliveryOver) * 100));
  bar.innerHTML = `
    <span class="cartbar__progress" style="--pct:${pct}%"></span>
    <span class="cartbar__body">
      <span class="cartbar__count">${n}</span>
      <span class="cartbar__label">${t('cart.viewCart')}</span>
      <span class="cartbar__note">${left > 0
        ? t('cart.freeProgress', { amount: money(left) })
        : t('cart.freeReached')}</span>
      <span class="cartbar__total">${money(sub)}</span>
    </span>`;
}

/* ---------- floating WhatsApp ----------
   Plenty of people in Kathmandu would rather just message than fill a form.
   Making that the always-available escape hatch converts better than
   forcing everyone down the cart flow. */
function renderWhatsApp() {
  if (SHOP.whatsappFloat === false) return;
  const a = document.createElement('a');
  a.className = 'wafloat';
  a.href = `https://wa.me/${SHOP.whatsapp}`;
  a.target = '_blank';
  a.rel = 'noopener';
  a.setAttribute('aria-label', t('wa.float'));
  a.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2A9.9 9.9 0 0 0 2.1 11.9a9.8 9.8 0 0 0 1.35 4.95L2 22l5.3-1.38a9.9 9.9 0 0 0 4.74 1.2h.01A9.9 9.9 0 0 0 22 11.92 9.9 9.9 0 0 0 12.04 2Zm5.8 14.06c-.24.68-1.4 1.3-1.94 1.35-.5.05-.98.23-3.3-.69-2.78-1.1-4.55-3.94-4.69-4.12-.13-.18-1.12-1.49-1.12-2.84 0-1.35.7-2.02.95-2.29a1 1 0 0 1 .72-.34h.52c.17 0 .4-.06.62.47.24.57.8 1.97.87 2.11.07.14.11.31.02.5-.09.18-.14.29-.27.45-.14.16-.29.36-.41.48-.14.14-.28.29-.12.57.16.27.71 1.17 1.52 1.9 1.05.93 1.93 1.22 2.2 1.36.28.14.44.12.6-.07.17-.2.7-.81.88-1.09.18-.27.36-.23.61-.14.25.09 1.6.75 1.87.89.28.13.46.2.53.31.07.11.07.64-.17 1.32Z"/></svg>`;
  document.body.appendChild(a);
}

/* ---------- order again ---------- */
const LAST_ORDER_KEY = 'blendmandu.lastOrder.v1';
function saveLastOrder(cart) {
  store.set(LAST_ORDER_KEY, JSON.stringify({ cart, at: Date.now() }));
}
function renderOrderAgain() {
  const host = $('#cart-empty');
  if (!host) return;
  let last;
  try { last = JSON.parse(store.get(LAST_ORDER_KEY)); } catch {}
  if (!last || !last.cart || !Object.keys(last.cart).length) return;

  const valid = Object.entries(last.cart).filter(([id]) => byId(id));
  if (!valid.length) return;

  const el = document.createElement('div');
  el.className = 'panel';
  el.style.cssText = 'margin-top:34px;text-align:left;max-width:440px;margin-inline:auto';
  el.innerHTML = `
    <p class="eyebrow eyebrow--accent">${t('cart.again')}</p>
    <p class="field__hint" style="margin-bottom:14px">${t('cart.againBlurb')}</p>
    <ul class="footer__list" style="margin-bottom:16px">
      ${valid.map(([id, q]) => `<li>${q} × ${esc(pName(byId(id)))}</li>`).join('')}
    </ul>
    <button class="pill pill--accent pill--wide" data-reorder>${t('cart.again')}</button>`;
  host.appendChild(el);

  el.querySelector('[data-reorder]').addEventListener('click', () => {
    const c = readCart();
    valid.forEach(([id, q]) => { c[id] = (c[id] || 0) + q; });
    writeCart(c);
    track('reorder', { items: valid.length });
  });
}

/* ============================================================
   PRODUCT DETAIL PAGE
   ============================================================ */
function initPDP() {
  const qtyEl = $('#pdp-qty');
  if (qtyEl) {
    document.addEventListener('click', e => {
      if (e.target.closest('[data-pdp-inc]'))
        qtyEl.textContent = Math.min(20, +qtyEl.textContent + 1);
      if (e.target.closest('[data-pdp-dec]'))
        qtyEl.textContent = Math.max(1, +qtyEl.textContent - 1);
    });
  }

  const rel = $('#related');
  const relIds = (rel?.dataset.related || '').split(',').filter(Boolean);
  if (rel && relIds.length) {
    rel.innerHTML = relIds.map(id => {
      const p = byId(id);
      return p ? cardHTML(p) : '';
    }).join('');
  }

  // one delegated handler covers the PDP button and every related card
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-add]');
    if (!b || b.closest('#grid') || b.closest('#featured')) return;
    const src = b.dataset.qtyFrom ? $(b.dataset.qtyFrom) : null;
    addToCart(b.dataset.add, src ? +src.textContent : 1);
  });
}

/* make product cards link through to their detail page */
function linkifyCards(root = document) {
  $$('.card', root).forEach(card => {
    const btn = card.querySelector('[data-add]');
    if (!btn || card.querySelector('.card__link')) return;
    const id = btn.dataset.add;
    const name = card.querySelector('.card__name');
    if (name && !name.querySelector('a')) {
      name.innerHTML = `<a class="card__link" href="${BASE}product/${id}.html">${name.textContent}</a>`;
    }
    const art = card.querySelector('.card__art');
    if (art && !art.querySelector('.card__artlink')) {
      const a = document.createElement('a');
      a.className = 'card__artlink';
      a.href = `${BASE}product/${id}.html`;
      a.setAttribute('aria-label', name ? name.textContent : 'View product');
      art.appendChild(a);
    }
  });
}

/* ============================================================
   BOOT
   ============================================================ */
/* Run each step in isolation. Previously a single throw in step 2 took out
   the product grid, the cart and checkout with it — a blank shop, no error
   the customer could act on. Now a broken step costs only itself. */
function boot(steps) {
  for (const [name, fn] of steps) {
    try { fn(); }
    catch (err) { console.error(`[blendmandu] ${name} failed:`, err); }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  boot([
    ['renderShell', renderShell],
    ['renderGate', renderGate],
    ['initShop', initShop],
    ['initFeatured', initFeatured],
    ['initCart', initCart],
    ['initPDP', initPDP],
    ['initNewsletter', initNewsletter],
    ['renderCartBar', renderCartBar],
    ['renderWhatsApp', renderWhatsApp],
    ['renderOrderAgain', renderOrderAgain],
    ['renderConsent', renderConsent],
    ['initSmoothScroll', initSmoothScroll],
    ['linkifyCards', linkifyCards],
    ['markReveals', markReveals],
    ['initReveals', initReveals],
  ]);

  /* Service worker: makes repeat visits work on a flaky connection, which
     in Kathmandu is most of them. Registered last so a failure here can
     never delay the shop rendering. */
  const secure = location.protocol === 'https:' ||
                 ['localhost', '127.0.0.1'].includes(location.hostname);
  if ('serviceWorker' in navigator && secure) {
    navigator.serviceWorker.register('/sw.js').catch(err =>
      console.warn('[blendmandu] service worker not registered:', err));
  }

  // a11y: let keyboard users jump the masthead
  const skip = document.createElement('a');
  skip.className = 'skiplink';
  skip.href = '#main';
  skip.textContent = t('a11y.skip');
  document.body.prepend(skip);
  const main = document.querySelector('main');
  if (main && !main.id) main.id = 'main';

  // page-level events
  if ($('#pdp-qty')) {
    const id = $('[data-add]')?.dataset.add;
    const p = id && byId(id);
    if (p) track('view_item', { item_id: p.id, value: p.price, currency: 'NPR' });
  }
  if (document.body.dataset.page === 'cart') {
    track('view_cart', { value: cartSubtotal(), currency: 'NPR', items: cartCount() });
  }

  // flat art sits under the WebGL stage; cup3d hides it once the canvas is live
  const fb = $('#cup-fallback');
  if (fb) fb.innerHTML = productArt(byId('himalayan-berry'));
});

/* cards are drawn after boot (filtering, cart edits) — re-arm reveals for them */
const _drawn = new MutationObserver(() => { linkifyCards(); markReveals(); initReveals(); });
document.addEventListener('DOMContentLoaded', () => {
  const grid = $('#grid') || $('#featured');
  if (grid) _drawn.observe(grid, { childList: true });
});
