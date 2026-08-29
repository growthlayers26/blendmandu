/* ============================================================
   BLENDMANDU — shop config + catalogue
   EDIT THIS FILE to change brand name, phone, prices, menu.
   ============================================================ */

const SHOP = {
  brand:      'BLENDMANDU',
  // ---- CHANGE THIS to your real domain (no trailing slash) ----
  url:        'https://blendmandu-ktm.vercel.app',
  brandLine1: 'BLEND',
  brandLine2: 'MANDU',
  brandTab:   'KTM',

  // ---- CHANGE THIS to your real WhatsApp number (country code, no +) ----
  whatsapp:   '9779842579959',
  phone:      '+977 9842579959',
  email:      'order@blendmandu.com',
  instagram:  'https://instagram.com/',

  currency:   'Rs',
  freeDeliveryOver: 1500,

  // 24/7 delivery, Kathmandu only
  zones: [
    { id: 'core',   name: 'Thamel / Durbar Marg / Lazimpat / Naxal', fee: 100 },
    { id: 'inner',  name: 'Baluwatar / Maharajgunj / Chabahil / Baneshwor', fee: 120 },
    { id: 'outer',  name: 'Kalanki / Swayambhu / Gongabu / Koteshwor', fee: 150 },
  ],

  /* Conversion UI you may want to turn off. Set either to false and the
     element is never created — no hidden markup, no CSS left behind. */
  stickyCartBar: true,   // persistent cart + free-delivery progress
  whatsappFloat: true,   // floating WhatsApp button

  /* Business details for LocalBusiness structured data — this is what
     powers "smoothie delivery near me", your 24/7 hours and your delivery
     area in Google. A cloud kitchen has no shopfront, so there is no street
     address here by default: add your real kitchen address only if you also
     register a Google Business Profile against it. */
  business: {
    legalName:   'Blendmandu',
    locality:    'Kathmandu',
    region:      'Bagmati',
    country:     'NP',
    street:      '',              // leave empty unless publicly listed
    postalCode:  '',
    latitude:    27.7172,         // Kathmandu; replace with the kitchen if listed
    longitude:   85.3240,
    priceRange:  'Rs 150 to Rs 590',
    cuisine:     ['Smoothies', 'Juice', 'Healthy'],
  },

  /* Analytics is OFF until you paste an ID here. While these are empty no
     third-party script loads, no cookie banner appears, and the claim in
     cookies.html stays true. Fill one in and the consent banner turns
     itself on — update cookies.html at the same time. */
  analytics: {
    ga4:       '',   // e.g. 'G-XXXXXXXXXX'
    metaPixel: '',   // e.g. '123456789012345'
  },

  /* Newsletter endpoint. Leave empty and the form validates but does not
     send. Works with Formspree, Brevo, Mailchimp — anything taking a POST.
     IMPORTANT: also add the host to connect-src in _headers and vercel.json,
     or the CSP blocks the request and sign-ups disappear silently. */
  newsletterEndpoint: '',

  payments: [
    { id: 'cod',    label: 'Cash on delivery', note: 'Pay the rider when it arrives.' },
    { id: 'esewa',  label: 'eSewa',            note: 'We send a payment request after you confirm.' },
    { id: 'khalti', label: 'Khalti',           note: 'We send a payment request after you confirm.' },
    { id: 'fonepay',label: 'Fonepay QR',       note: 'Scan the QR we send on WhatsApp.' },
  ],
};

/* ---------- catalogue ----------
   cup:  'tall' (smoothie), 'bowl' (bowl), 'bottle' (juice), 'shot' (wellness shot)
   c1/c2: gradient colours for the drink
------------------------------------ */
const PRODUCTS = [
  // --- smoothies ---
  { id:'himalayan-berry', cat:'smoothies', name:'Himalayan Berry', meta:'400 ml · 280 kcal',
    price:380, cup:'tall', c1:'#B5417C', c2:'#6E2450', tag:'Bestseller',
    blurb:'Seasonal Himalayan berries, banana and thick yoghurt with a spoon of Nepali honey. Our most ordered blend, and the one people come back for.', allergens:'Dairy (yoghurt), honey' },
  { id:'mango-sunrise', cat:'smoothies', name:'Mango Sunrise', meta:'400 ml · 265 kcal',
    price:350, cup:'tall', c1:'#F5A93C', c2:'#DE6A24',
    blurb:'Ripe mango, passionfruit and coconut milk. Naturally sweet, so we add no sugar at all.', allergens:'None' },
  { id:'green-machine', cat:'smoothies', name:'Green Machine', meta:'400 ml · 190 kcal',
    price:390, cup:'tall', c1:'#7FBF5A', c2:'#3E7A38', tag:'Vegan',
    blurb:'Spinach, kale, green apple, cucumber, lime and ginger. Six vegetables that somehow taste like a treat.', allergens:'None' },
  { id:'peanut-banana', cat:'smoothies', name:'Peanut Butter Banana', meta:'400 ml · 410 kcal',
    price:360, cup:'tall', c1:'#D9A25E', c2:'#95602F', tag:'High protein',
    blurb:'Banana, roasted peanut butter, oats and dates. Breakfast in a cup, and it keeps you full until lunch.', allergens:'Peanuts, oats (gluten)' },
  { id:'cacao-almond', cat:'smoothies', name:'Cacao Almond', meta:'400 ml · 380 kcal',
    price:420, cup:'tall', c1:'#8A5A3B', c2:'#4A2C1C',
    blurb:'Raw cacao, almond milk, dates and a pinch of Himalayan salt. Tastes like dessert, built like fuel.', allergens:'Tree nuts (almond)' },
  { id:'tropical-turmeric', cat:'smoothies', name:'Tropical Turmeric', meta:'400 ml · 240 kcal',
    price:370, cup:'tall', c1:'#F2C14E', c2:'#C9812A',
    blurb:'Pineapple, mango, turmeric and black pepper. The pepper is there on purpose, because it helps your body use the turmeric.', allergens:'None' },

  // --- bowls ---
  { id:'acai-bowl', cat:'bowls', name:'Acai Bowl', meta:'450 ml · granola + fruit',
    price:550, cup:'bowl', c1:'#7B3F9E', c2:'#3D1D57', tag:'Bestseller',
    blurb:'A thick acai base under granola, banana, coconut flakes and chia. Eaten with a spoon, and heavy enough to be lunch.', allergens:'Oats (gluten), coconut' },
  { id:'dragonfruit-bowl', cat:'bowls', name:'Dragonfruit Bowl', meta:'450 ml · granola + fruit',
    price:520, cup:'bowl', c1:'#E4568D', c2:'#9C2757',
    blurb:'Pitaya, mango and banana under toasted oats and pumpkin seeds. The brightest thing on the menu.', allergens:'Oats (gluten), pumpkin seeds' },
  { id:'protein-bowl', cat:'bowls', name:'Peanut Protein Bowl', meta:'450 ml · 34 g protein',
    price:590, cup:'bowl', c1:'#C08B4E', c2:'#7A4A22', tag:'High protein',
    blurb:'Whey or pea protein with peanut butter, banana, oats and cacao nibs. Thirty four grams of protein, no chalky aftertaste.', allergens:'Peanuts, oats (gluten), milk (whey option)' },

  // --- cold-pressed juice ---
  { id:'beet-ginger', cat:'juices', name:'Beet & Ginger', meta:'300 ml · cold-pressed',
    price:320, cup:'bottle', c1:'#C33A5C', c2:'#6E1730',
    blurb:'Beetroot, carrot, apple and a hard hit of raw ginger. Cold pressed to order, never from concentrate.', allergens:'None' },
  { id:'citrus-immunity', cat:'juices', name:'Citrus Immunity', meta:'300 ml · cold-pressed',
    price:300, cup:'bottle', c1:'#F0B23C', c2:'#D2762A', tag:'Vitamin C',
    blurb:'Orange, lemon, amla and honey, pressed the moment you order. More vitamin C than you will get from a whole orange.', allergens:'Honey' },
  { id:'green-press', cat:'juices', name:'Green Press', meta:'300 ml · cold-pressed',
    price:340, cup:'bottle', c1:'#79B85A', c2:'#3B6E33', tag:'Vegan',
    blurb:'Cucumber, celery, spinach, green apple and mint. Light, clean and properly cold pressed.', allergens:'None' },

  // --- wellness shots ---
  { id:'ginger-turmeric-shot', cat:'shots', name:'Ginger Turmeric Shot', meta:'60 ml · daily shot',
    price:150, cup:'shot', c1:'#EFA92F', c2:'#C1701D',
    blurb:'Raw ginger, turmeric, lemon and cayenne. Sharp on purpose, and gone in one swallow.', allergens:'None' },
  { id:'wheatgrass-shot', cat:'shots', name:'Wheatgrass Shot', meta:'60 ml · daily shot',
    price:180, cup:'shot', c1:'#6BAE4C', c2:'#33642B', tag:'Vegan',
    blurb:'Single origin wheatgrass, cut and pressed the same morning it reaches you.', allergens:'None' },
  { id:'amla-shot', cat:'shots', name:'Amla Immunity Shot', meta:'60 ml · daily shot',
    price:160, cup:'shot', c1:'#98C24E', c2:'#4F7A2A',
    blurb:'Nepali amla with lemon and honey. One of the richest natural sources of vitamin C there is.', allergens:'Honey' },
];

const CATEGORIES = [
  { id:'all',       label:'All products' },
  { id:'smoothies', label:'Smoothies' },
  { id:'bowls',     label:'Bowls' },
  { id:'juices',    label:'Cold-pressed' },
  { id:'shots',     label:'Wellness shots' },
];

/* ============================================================
   Product artwork — original inline SVG, one shape per format.
   No stock photos needed; colours come from the product.
   ============================================================ */
function productArt(p) {
  const g = `g-${p.id}`;
  const defs = `
    <defs>
      <linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"  stop-color="${p.c1}"/>
        <stop offset="100%" stop-color="${p.c2}"/>
      </linearGradient>
    </defs>`;
  const badge = (x, y) => `
    <g transform="translate(${x} ${y})" opacity=".92">
      <rect x="-19" y="-13" width="38" height="26" rx="3" fill="none" stroke="#fff" stroke-width="1.6"/>
      <text x="0" y="-2" text-anchor="middle" font-family="Righteous, sans-serif" font-size="8" fill="#fff">BLEND</text>
      <text x="0" y="8"  text-anchor="middle" font-family="Righteous, sans-serif" font-size="8" fill="#fff">MANDU</text>
    </g>`;

  if (p.cup === 'bowl') {
    return `<svg viewBox="0 0 200 240" role="img" aria-label="${p.name}">${defs}
      <ellipse cx="100" cy="196" rx="62" ry="9" fill="rgba(0,0,0,.09)"/>
      <path d="M38 108 h124 a62 62 0 0 1-124 0 z" fill="url(#${g})"/>
      <ellipse cx="100" cy="108" rx="62" ry="15" fill="${p.c1}"/>
      <ellipse cx="100" cy="108" rx="62" ry="15" fill="none" stroke="#191917" stroke-width="2.4"/>
      <path d="M38 108 h124 a62 62 0 0 1-124 0 z" fill="none" stroke="#191917" stroke-width="2.4"/>
      <circle cx="76"  cy="104" r="8"   fill="#F6E7C4"/>
      <circle cx="100" cy="100" r="6.5" fill="#fff" opacity=".85"/>
      <circle cx="124" cy="105" r="7.5" fill="#F2B14C"/>
      <circle cx="112" cy="112" r="5"   fill="#8FBF63"/>
      <circle cx="86"  cy="113" r="4.5" fill="#E0616F"/>
      ${badge(100, 150)}
    </svg>`;
  }

  if (p.cup === 'bottle') {
    return `<svg viewBox="0 0 200 240" role="img" aria-label="${p.name}">${defs}
      <ellipse cx="100" cy="218" rx="42" ry="7" fill="rgba(0,0,0,.09)"/>
      <rect x="86" y="22" width="28" height="22" rx="4" fill="#191917"/>
      <path d="M88 44 h24 l14 26 v134 a10 10 0 0 1-10 10 H84 a10 10 0 0 1-10-10 V70 z" fill="url(#${g})"/>
      <path d="M88 44 h24 l14 26 v134 a10 10 0 0 1-10 10 H84 a10 10 0 0 1-10-10 V70 z" fill="none" stroke="#191917" stroke-width="2.6"/>
      <rect x="74" y="104" width="52" height="54" fill="#F8F2E2" opacity=".95"/>
      <rect x="74" y="104" width="52" height="54" fill="none" stroke="#191917" stroke-width="2"/>
      <text x="100" y="126" text-anchor="middle" font-family="Righteous, sans-serif" font-size="10" fill="#191917">BLEND</text>
      <text x="100" y="139" text-anchor="middle" font-family="Righteous, sans-serif" font-size="10" fill="#191917">MANDU</text>
      <text x="100" y="151" text-anchor="middle" font-family="Righteous, sans-serif" font-size="6.5" fill="${p.c2}">COLD PRESSED</text>
    </svg>`;
  }

  if (p.cup === 'shot') {
    return `<svg viewBox="0 0 200 240" role="img" aria-label="${p.name}">${defs}
      <ellipse cx="100" cy="206" rx="34" ry="6" fill="rgba(0,0,0,.09)"/>
      <rect x="78" y="60" width="44" height="14" rx="3" fill="#191917"/>
      <path d="M78 74 h44 v118 a10 10 0 0 1-10 10 H88 a10 10 0 0 1-10-10 z" fill="url(#${g})"/>
      <path d="M78 74 h44 v118 a10 10 0 0 1-10 10 H88 a10 10 0 0 1-10-10 z" fill="none" stroke="#191917" stroke-width="2.6"/>
      <rect x="78" y="118" width="44" height="42" fill="#F8F2E2"/>
      <rect x="78" y="118" width="44" height="42" fill="none" stroke="#191917" stroke-width="2"/>
      <text x="100" y="136" text-anchor="middle" font-family="Righteous, sans-serif" font-size="8.5" fill="#191917">BLEND</text>
      <text x="100" y="147" text-anchor="middle" font-family="Righteous, sans-serif" font-size="8.5" fill="#191917">MANDU</text>
      <text x="100" y="156" text-anchor="middle" font-family="Righteous, sans-serif" font-size="5.5" fill="${p.c2}">60 ML SHOT</text>
    </svg>`;
  }

  // tall smoothie cup with dome lid + straw
  return `<svg viewBox="0 0 200 240" role="img" aria-label="${p.name}">${defs}
    <ellipse cx="100" cy="222" rx="46" ry="7" fill="rgba(0,0,0,.09)"/>
    <rect x="112" y="8" width="9" height="44" rx="4" fill="#191917" transform="rotate(9 116 30)"/>
    <path d="M64 52 a36 22 0 0 1 72 0 z" fill="#DCD3BC"/>
    <path d="M64 52 a36 22 0 0 1 72 0 z" fill="none" stroke="#191917" stroke-width="2.4"/>
    <rect x="60" y="50" width="80" height="12" rx="4" fill="#EFE7D2" stroke="#191917" stroke-width="2.4"/>
    <path d="M64 62 h72 l-11 142 a10 10 0 0 1-10 9 H85 a10 10 0 0 1-10-9 z" fill="url(#${g})"/>
    <path d="M64 62 h72 l-11 142 a10 10 0 0 1-10 9 H85 a10 10 0 0 1-10-9 z" fill="none" stroke="#191917" stroke-width="2.6"/>
    <path d="M74 78 h52 l-2 26 H76 z" fill="#F8F2E2" opacity=".16"/>
    <rect x="70" y="112" width="60" height="56" rx="3" fill="#F8F2E2" opacity=".96"/>
    <rect x="70" y="112" width="60" height="56" rx="3" fill="none" stroke="#191917" stroke-width="2"/>
    <text x="100" y="133" text-anchor="middle" font-family="Righteous, sans-serif" font-size="12" fill="#191917">BLEND</text>
    <text x="100" y="148" text-anchor="middle" font-family="Righteous, sans-serif" font-size="12" fill="#191917">MANDU</text>
    <text x="100" y="160" text-anchor="middle" font-family="Righteous, sans-serif" font-size="6.5" fill="${p.c2}">KATHMANDU · 24/7</text>
  </svg>`;
}

/* ============================================================
   Nepali product copy.

   Product NAMES stay in English on purpose: customers order by
   name over WhatsApp, and a Nepali-only name creates confusion
   at the kitchen. Descriptions, units and allergens translate.
   ============================================================ */
const PRODUCT_I18N = {
  ne: {
    'himalayan-berry':     { blurb: 'स्थानीय मौसमी बेरी, केरा, दही र एक चम्चा नेपाली मह।', meta: '400 मिलि · 280 क्यालोरी', allergens: 'दुग्धजन्य (दही), मह', tag: 'सबैभन्दा लोकप्रिय' },
    'mango-sunrise':       { blurb: 'पाकेको आँप, प्यासनफ्रुट र नरिवलको दूध। थप चिनी छैन।', meta: '400 मिलि · 265 क्यालोरी', allergens: 'छैन' },
    'green-machine':       { blurb: 'पालुंगो, केल, हरियो स्याउ, काँक्रो, कागती र अदुवा।', meta: '400 मिलि · 190 क्यालोरी', allergens: 'छैन', tag: 'भेगन' },
    'peanut-banana':       { blurb: 'केरा, भुटेको बदाम पेस्ट, ओट्स र छोहडा। कपमै नास्ता।', meta: '400 मिलि · 410 क्यालोरी', allergens: 'बदाम, ओट्स (ग्लुटेन)', tag: 'उच्च प्रोटिन' },
    'cacao-almond':        { blurb: 'काँचो काकाओ, बदामको दूध, छोहडा र चुटिकी हिमाली नुन।', meta: '400 मिलि · 380 क्यालोरी', allergens: 'बदाम (रुखे)' },
    'tropical-turmeric':   { blurb: 'भुइँकटहर, आँप, बेसार र कालो मरिच। सुनिश्चित ताजगी।', meta: '400 मिलि · 240 क्यालोरी', allergens: 'छैन' },
    'acai-bowl':           { blurb: 'असाई बेसमा ग्रानोला, केरा, नरिवल र चिया सिड।', meta: '450 मिलि · ग्रानोला + फलफूल', allergens: 'ओट्स (ग्लुटेन), नरिवल', tag: 'सबैभन्दा लोकप्रिय' },
    'dragonfruit-bowl':    { blurb: 'ड्र्यागनफ्रुट, आँप र केरामाथि भुटेको ओट्स र फर्सीको बियाँ।', meta: '450 मिलि · ग्रानोला + फलफूल', allergens: 'ओट्स (ग्लुटेन), फर्सीको बियाँ' },
    'protein-bowl':        { blurb: 'ह्वे वा मटरको प्रोटिन, बदाम पेस्ट, केरा, ओट्स र काकाओ निब्स।', meta: '450 मिलि · 34 ग्राम प्रोटिन', allergens: 'बदाम, ओट्स (ग्लुटेन), दूध (ह्वे विकल्प)', tag: 'उच्च प्रोटिन' },
    'beet-ginger':         { blurb: 'चुकन्दर, गाजर, स्याउ र कडा काँचो अदुवा।', meta: '300 मिलि · कोल्ड-प्रेस्ड', allergens: 'छैन' },
    'citrus-immunity':     { blurb: 'सुन्तला, कागती, अमला र मह। अर्डरपछि मात्र निचोरिन्छ।', meta: '300 मिलि · कोल्ड-प्रेस्ड', allergens: 'मह', tag: 'भिटामिन सी' },
    'green-press':         { blurb: 'काँक्रो, सेलेरी, पालुंगो, हरियो स्याउ र पुदिना।', meta: '300 मिलि · कोल्ड-प्रेस्ड', allergens: 'छैन', tag: 'भेगन' },
    'ginger-turmeric-shot':{ blurb: 'काँचो अदुवा, बेसार, कागती र खुर्सानी। जानाजान चर्को।', meta: '60 मिलि · दैनिक सट', allergens: 'छैन' },
    'wheatgrass-shot':     { blurb: 'एकै ठाउँको गहुँको जमरा, बिहानै काटेर निचोरिएको।', meta: '60 मिलि · दैनिक सट', allergens: 'छैन', tag: 'भेगन' },
    'amla-shot':           { blurb: 'नेपाली अमला, कागती र मह। सुन्तलाभन्दा बढी भिटामिन सी।', meta: '60 मिलि · दैनिक सट', allergens: 'मह' },
  },
};

const CATEGORY_I18N = {
  ne: {
    all: 'सबै उत्पादन', smoothies: 'स्मुदी', bowls: 'बाउल',
    juices: 'कोल्ड-प्रेस्ड', shots: 'वेलनेस सट',
  },
};

const ZONE_I18N = {
  ne: {
    core:  'ठमेल / दरबारमार्ग / लाजिम्पाट / नक्साल',
    inner: 'बालुवाटार / महाराजगन्ज / चाबहिल / बानेश्वर',
    outer: 'कलंकी / स्वयम्भू / गोंगबु / कोटेश्वर',
  },
};

const PAYMENT_I18N = {
  ne: {
    cod:     { label: 'डेलिभरीमा नगद',  note: 'राइडर आएपछि तिर्नुहोस्।' },
    esewa:   { label: 'इसेवा',           note: 'पुष्टि गरेपछि भुक्तानी अनुरोध पठाउँछौं।' },
    khalti:  { label: 'खल्ती',           note: 'पुष्टि गरेपछि भुक्तानी अनुरोध पठाउँछौं।' },
    fonepay: { label: 'फोनपे QR',        note: 'व्हाट्सएपमा पठाएको QR स्क्यान गर्नुहोस्।' },
  },
};

/* localised accessors — fall back to English whenever a string is missing */
function tr(obj, id, field, fallback) {
  const L = (typeof document !== 'undefined' && document.documentElement.dataset.lang) || 'en';
  return (obj[L] && obj[L][id] && obj[L][id][field]) || fallback;
}
const pName      = p => p.name;                                   // names stay English
const pBlurb     = p => tr(PRODUCT_I18N, p.id, 'blurb', p.blurb);
const pMeta      = p => tr(PRODUCT_I18N, p.id, 'meta', p.meta);
const pAllergens = p => tr(PRODUCT_I18N, p.id, 'allergens', p.allergens);
const pTag       = p => tr(PRODUCT_I18N, p.id, 'tag', p.tag);
const cLabel     = c => {
  const L = (typeof document !== 'undefined' && document.documentElement.dataset.lang) || 'en';
  return (CATEGORY_I18N[L] && CATEGORY_I18N[L][c.id]) || c.label;
};
