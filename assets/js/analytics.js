/* ============================================================
   BLENDMANDU — analytics

   Vendor-agnostic. Nothing loads and nothing is stored until an ID
   is set in SHOP.analytics AND the visitor consents. With no ID
   configured this file is inert, which keeps cookies.html honest.

   The conversion worth measuring here is `order_sent` — the WhatsApp
   handoff. There is no payment gateway to fire a purchase event, so
   that handoff is the closest thing to a sale the site can observe.
   ============================================================ */

const CONSENT_KEY = 'blendmandu.consent.v1';
const A = (typeof SHOP !== 'undefined' && SHOP.analytics) || {};
const HAS_PROVIDER = Boolean(A.ga4 || A.metaPixel);

let consent = null;
try { consent = localStorage.getItem(CONSENT_KEY); } catch {}

/* a local ring buffer so events are debuggable with no vendor attached */
const _events = [];
window.__events = _events;

function loadScript(src, attrs = {}) {
  const s = document.createElement('script');
  s.async = true; s.src = src;
  for (const k in attrs) s.setAttribute(k, attrs[k]);
  document.head.appendChild(s);
  return s;
}

let booted = false;
function bootProviders() {
  if (booted || !HAS_PROVIDER || consent !== 'granted') return;
  booted = true;

  if (A.ga4) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', A.ga4, { anonymize_ip: true });
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${A.ga4}`);
  }

  if (A.metaPixel) {
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
      (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    fbq('init', A.metaPixel);
    fbq('track', 'PageView');
  }

  // flush anything captured before consent
  _events.filter(e => !e._sent).forEach(send);
}

const META_MAP = {
  view_item: 'ViewContent',
  add_to_cart: 'AddToCart',
  begin_checkout: 'InitiateCheckout',
  order_sent: 'Purchase',
  search: 'Search',
};

function send(e) {
  e._sent = true;
  if (!booted) return;
  if (A.ga4 && window.gtag) gtag('event', e.name, e.params);
  if (A.metaPixel && window.fbq && META_MAP[e.name]) fbq('track', META_MAP[e.name], e.params);
}

function track(name, params = {}) {
  const e = { name, params, at: Date.now(), _sent: false };
  _events.push(e);
  if (_events.length > 200) _events.shift();
  if (booted) send(e);
}

/* ---------- consent banner (only when a provider is configured) ---------- */
function renderConsent() {
  if (!HAS_PROVIDER || consent) return;

  const el = document.createElement('div');
  el.className = 'consent';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', t('consent.title'));
  el.innerHTML = `
    <div class="consent__inner">
      <div>
        <strong class="consent__title">${t('consent.title')}</strong>
        <p class="consent__text">${t('consent.text')}
          <a href="${BASE}cookies.html">${t('footer.cookies')}</a></p>
      </div>
      <div class="consent__btns">
        <button class="pill pill--ghost" data-consent="denied">${t('consent.decline')}</button>
        <button class="pill pill--accent" data-consent="granted">${t('consent.accept')}</button>
      </div>
    </div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('is-up'));

  el.addEventListener('click', e => {
    const b = e.target.closest('[data-consent]');
    if (!b) return;
    consent = b.dataset.consent;
    try { localStorage.setItem(CONSENT_KEY, consent); } catch {}
    el.classList.remove('is-up');
    setTimeout(() => el.remove(), 350);
    bootProviders();
  });
}

bootProviders();
