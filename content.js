/* ============================================================
   Page copy, per language. Edit here, then run `node build.js`.
   `body` is raw HTML; `h1` and `eyebrow` are escaped by the builder.
   ============================================================ */
module.exports = ({ wa, phone, email, instagram, freeOver }) => ({

  contact: {
    en: { file: 'contact.html', eyebrow: 'Contact', h1: 'Talk to us',
      title: 'Contact | Blendmandu',
      desc: `Reach Blendmandu on WhatsApp at ${phone}, any hour. We are a cloud kitchen delivering across Kathmandu 24/7.`,
      body: `
  <p class="lede">We are a cloud kitchen, so there is no counter to walk up to. Everything happens on WhatsApp, and someone is awake whatever time you are reading this.</p>
  <div class="panel" style="margin:30px 0">
    <dl class="pdp__facts" style="margin:0">
      <div><dt>WhatsApp</dt><dd><a href="${wa}">${phone}</a>. Fastest reply, open 24 hours</dd></div>
      <div><dt>Email</dt><dd><a href="mailto:${email}">${email}</a>. We reply within a day</dd></div>
      <div><dt>Instagram</dt><dd><a href="${instagram}">@blendmandu</a></dd></div>
      <div><dt>Delivery area</dt><dd>Inside Kathmandu only, 24 hours a day</dd></div>
    </dl>
  </div>
  <h2>Something wrong with an order?</h2>
  <p>Message us on WhatsApp with your order and a photo. If we got it wrong, spoiled or unreasonably late, we remake it or refund it. See the <a href="return-policy.html">refund policy</a>.</p>
  <h2>Allergies</h2>
  <p>Every product page lists its allergens. We blend in a shared kitchen, so we cannot promise zero cross-contact with dairy, peanuts, tree nuts or gluten. If a reaction would be serious, message us before you order.</p>
  <p style="margin-top:34px"><a class="pill pill--accent" href="${wa}">Message us on WhatsApp</a></p>` },
    ne: { file: 'contact.html', eyebrow: 'सम्पर्क', h1: 'हामीसँग कुरा गर्नुहोस्',
      title: 'सम्पर्क | Blendmandu',
      desc: `Blendmandu लाई व्हाट्सएप ${phone} मा जुनसुकै बेला सम्पर्क गर्नुहोस्। हामी काठमाडौंभर २४/७ पुर्‍याउने क्लाउड किचन हौं।`,
      body: `
  <p class="lede">हामी क्लाउड किचन हौं। आउनका लागि पसल छैन। सबै काम व्हाट्सएपमा हुन्छ, र तपाईं जुन बेला यो पढ्दै हुनुहुन्छ, कोही न कोही जागै छ।</p>
  <div class="panel" style="margin:30px 0">
    <dl class="pdp__facts" style="margin:0">
      <div><dt>व्हाट्सएप</dt><dd><a href="${wa}">${phone}</a>। सबैभन्दा छिटो, २४ घण्टा</dd></div>
      <div><dt>इमेल</dt><dd><a href="mailto:${email}">${email}</a>। एक दिनभित्र जवाफ</dd></div>
      <div><dt>इन्स्टाग्राम</dt><dd><a href="${instagram}">@blendmandu</a></dd></div>
      <div><dt>डेलिभरी क्षेत्र</dt><dd>काठमाडौंभित्र मात्र, दिनको २४ घण्टा</dd></div>
    </dl>
  </div>
  <h2>अर्डरमा केही बिग्रियो?</h2>
  <p>आफ्नो अर्डर र फोटोसहित व्हाट्सएपमा सन्देश पठाउनुहोस्। गलत, बिग्रिएको वा अनावश्यक ढिलो भएको भए हामी फेरि बनाइदिन्छौं वा पैसा फिर्ता गर्छौं। <a href="return-policy.html">फिर्ता नीति</a> हेर्नुहोस्।</p>
  <h2>एलर्जी</h2>
  <p>हरेक उत्पादन पृष्ठमा एलर्जेन उल्लेख छ। हामी साझा किचनमा ब्लेन्ड गर्छौं, त्यसैले दुग्धजन्य, बदाम, रुखे बदाम वा ग्लुटेनसँग सम्पर्क शून्य हुन्छ भन्ने ग्यारेन्टी गर्न सक्दैनौं। प्रतिक्रिया गम्भीर हुने भए अर्डर गर्नुअघि सोध्नुहोस्।</p>
  <p style="margin-top:34px"><a class="pill pill--accent" href="${wa}">व्हाट्सएपमा सन्देश पठाउनुहोस्</a></p>` },
  },

  notfound: {
    en: { file: '404.html', eyebrow: 'Error 404', h1: "That page isn't on the menu", noindex: true,
      title: 'Page not found | Blendmandu',
      desc: 'That page could not be found. Head back to the Blendmandu menu of smoothies, bowls and cold pressed juice, delivered 24 hours a day across Kathmandu.',
      body: `
  <p class="lede">The link is wrong, or we moved something. Neither is your problem. Here is the way back.</p>
  <p style="margin-top:28px;display:flex;gap:12px;flex-wrap:wrap">
    <a class="pill pill--accent" href="/shop.html">See the menu</a>
    <a class="pill pill--ghost" href="/">Home</a>
    <a class="pill pill--ghost" href="/contact.html">Contact us</a>
  </p>` },
    ne: { file: '404.html', eyebrow: 'त्रुटि 404', h1: 'यो पृष्ठ मेनुमा छैन', noindex: true,
      title: 'पृष्ठ भेटिएन | Blendmandu',
      desc: 'यो पृष्ठ भेटिएन। Blendmandu को मेनुमा फर्कनुहोस्। स्मुदी, बाउल र कोल्ड-प्रेस्ड, काठमाडौंभर २४/७ डेलिभरी।',
      body: `
  <p class="lede">लिंक गलत छ, वा हामीले केही सारेका छौं। दुवैमा तपाईंको दोष छैन। फर्कने बाटो यहाँ छ।</p>
  <p style="margin-top:28px;display:flex;gap:12px;flex-wrap:wrap">
    <a class="pill pill--accent" href="/ne/shop.html">मेनु हेर्नुहोस्</a>
    <a class="pill pill--ghost" href="/ne/">गृहपृष्ठ</a>
    <a class="pill pill--ghost" href="/ne/contact.html">सम्पर्क</a>
  </p>` },
  },

  refunds: {
    en: { file: 'return-policy.html', eyebrow: 'Refunds', h1: 'Refund & remake policy',
      title: 'Refund policy | Blendmandu',
      desc: 'Wrong, spoiled or badly late? We remake it or refund it. How refunds work at Blendmandu, Kathmandu.',
      body: `
  <p class="lede">Smoothies are fresh food, so we cannot take them back and resell them. That does not mean you are stuck with a bad order.</p>
  <h2>We remake or refund if</h2>
  <ul>
    <li>You got the wrong item.</li>
    <li>It arrived spoiled, separated, melted through, or leaking.</li>
    <li>It arrived far later than we told you, without us warning you.</li>
    <li>An allergen we listed was wrong.</li>
  </ul>
  <h2>How to claim</h2>
  <p>Message us on <a href="${wa}">WhatsApp</a> within <strong>2 hours</strong> of delivery with your order and a photo. Fresh food goes off quickly, which is why the window is short. It is not us being difficult.</p>
  <h2>How you get the money back</h2>
  <ul>
    <li><strong>Cash on delivery:</strong> we send it by eSewa, Khalti or Fonepay, or credit it against your next order. Your choice.</li>
    <li><strong>eSewa / Khalti / Fonepay:</strong> refunded to the same wallet, normally within 3 working days.</li>
  </ul>
  <h2>What we cannot refund</h2>
  <p>A blend you simply did not enjoy. Taste is personal and we would rather you tell us so we can recommend something better next time, but we will not refund it.</p>
  <h2>Cancelling</h2>
  <p>Message us before we start blending and we cancel it free. Once the blender is running the ingredients are gone, so we cannot.</p>` },
    ne: { file: 'return-policy.html', eyebrow: 'फिर्ता', h1: 'फिर्ता र पुनः बनाउने नीति',
      title: 'फिर्ता नीति | Blendmandu',
      desc: 'गलत, बिग्रिएको वा धेरै ढिलो? हामी फेरि बनाइदिन्छौं वा पैसा फिर्ता गर्छौं। Blendmandu, काठमाडौंको फिर्ता नीति।',
      body: `
  <p class="lede">स्मुदी ताजा खानेकुरा हो, त्यसैले फिर्ता लिएर पुनः बेच्न सक्दैनौं। तर बिग्रिएको अर्डरमा तपाईं अल्झिनुपर्दैन।</p>
  <h2>यी अवस्थामा फेरि बनाउँछौं वा पैसा फिर्ता गर्छौं</h2>
  <ul>
    <li>गलत सामान पुग्यो।</li>
    <li>बिग्रिएको, छुट्टिएको, पग्लिएको वा चुहिएको अवस्थामा पुग्यो।</li>
    <li>भनेकोभन्दा निकै ढिलो पुग्यो र हामीले पहिले खबर गरेनौं।</li>
    <li>हामीले उल्लेख गरेको एलर्जेन गलत थियो।</li>
  </ul>
  <h2>कसरी दाबी गर्ने</h2>
  <p>डेलिभरी भएको <strong>२ घण्टाभित्र</strong> आफ्नो अर्डर र फोटोसहित <a href="${wa}">व्हाट्सएप</a> मा सन्देश पठाउनुहोस्। ताजा खानेकुरा छिट्टै बिग्रिने भएकाले समय छोटो राखिएको हो। हामी अनावश्यक कडाइ गरेका होइनौं।</p>
  <h2>पैसा कसरी फिर्ता हुन्छ</h2>
  <ul>
    <li><strong>डेलिभरीमा नगद:</strong> इसेवा, खल्ती वा फोनपे मार्फत पठाउँछौं, अथवा अर्को अर्डरमा मिलाउँछौं। तपाईंको रोजाइ।</li>
    <li><strong>इसेवा / खल्ती / फोनपे:</strong> सोही वालेटमा, सामान्यतया ३ कार्य दिनभित्र।</li>
  </ul>
  <h2>के फिर्ता हुँदैन</h2>
  <p>मन नपरेको स्वाद। स्वाद व्यक्तिगत कुरा हो र हामी चाहन्छौं तपाईंले भन्नुभयोस् ताकि अर्को पटक राम्रो सुझाव दिन सकौं। तर त्यसको पैसा फिर्ता हुँदैन।</p>
  <h2>रद्द गर्ने</h2>
  <p>ब्लेन्ड सुरु गर्नुअघि सन्देश पठाउनुभयो भने निःशुल्क रद्द हुन्छ। ब्लेन्डर चलिसकेपछि सामग्री खर्च भइसक्छ, त्यसैले रद्द गर्न मिल्दैन।</p>` },
  },

  privacy: {
    en: { file: 'privacy-policy.html', eyebrow: 'Privacy', h1: 'What we do with your data',
      title: 'Privacy policy | Blendmandu',
      desc: 'What Blendmandu collects, why, and who else sees it. Short version: your name, phone and address, used to deliver your order.',
      body: `
  <p class="lede">Short version: we take your name, phone number and address so a rider can find you. We do not sell any of it.</p>
  <h2>What we collect</h2>
  <ul>
    <li><strong>Name, phone number, delivery address and landmark</strong>. You type these at checkout and they travel to us inside a WhatsApp message.</li>
    <li><strong>Your order and any notes</strong> you add.</li>
    <li><strong>Your cart</strong>, which is stored in your own browser and never sent to us until you place the order.</li>
    <li><strong>Your email</strong>, only if you hand it to the newsletter box.</li>
  </ul>
  <h2>Who else sees it</h2>
  <p>Your order reaches us through <strong>WhatsApp</strong>, which is operated by Meta and governed by their privacy terms, not ours. If you pay by <strong>eSewa, Khalti or Fonepay</strong>, that provider handles the payment. We never see your wallet credentials or card numbers. Our rider sees your name, phone and address, because otherwise they cannot deliver.</p>
  <h2>What we never do</h2>
  <p>We do not sell your details, rent them, or hand them to advertisers.</p>
  <h2>How long we keep it</h2>
  <p>Order messages stay in our WhatsApp history so we can handle complaints and repeat orders. Ask us to delete yours and we will.</p>
  <h2>Your choices</h2>
  <p>Message <a href="${wa}">${phone}</a> or email <a href="mailto:${email}">${email}</a> to see what we hold, correct it, or have it deleted. Unsubscribe from the newsletter using the link in any email.</p>` },
    ne: { file: 'privacy-policy.html', eyebrow: 'गोपनीयता', h1: 'तपाईंको डेटा हामी के गर्छौं',
      title: 'गोपनीयता नीति | Blendmandu',
      desc: 'Blendmandu ले के सङ्कलन गर्छ, किन, र अरू कसले देख्छ। छोटोमा: तपाईंको नाम, फोन र ठेगाना, अर्डर पुर्‍याउन मात्र।',
      body: `
  <p class="lede">छोटोमा: राइडरले तपाईंलाई भेट्न सकून् भनेर हामी तपाईंको नाम, फोन नम्बर र ठेगाना लिन्छौं। यीमध्ये केही पनि बेच्दैनौं।</p>
  <h2>हामी के लिन्छौं</h2>
  <ul>
    <li><strong>नाम, फोन नम्बर, डेलिभरी ठेगाना र ल्यान्डमार्क</strong>। चेकआउटमा तपाईंले टाइप गर्नुहुन्छ र व्हाट्सएप सन्देशभित्र हामीकहाँ आइपुग्छ।</li>
    <li><strong>तपाईंको अर्डर र थपिएका टिप्पणी।</strong></li>
    <li><strong>तपाईंको कार्ट</strong>, जुन तपाईंकै ब्राउजरमा रहन्छ र अर्डर नपठाएसम्म हामीकहाँ आउँदैन।</li>
    <li><strong>तपाईंको इमेल</strong>, न्यूजलेटरमा दिनुभएको खण्डमा मात्र।</li>
  </ul>
  <h2>अरू कसले देख्छ</h2>
  <p>तपाईंको अर्डर <strong>व्हाट्सएप</strong> मार्फत आउँछ, जुन Meta ले सञ्चालन गर्छ र त्यसको गोपनीयता सर्त हाम्रो होइन, उनीहरूकै लागू हुन्छ। <strong>इसेवा, खल्ती वा फोनपे</strong> बाट तिर्नुभयो भने भुक्तानी तिनै सेवाले सम्हाल्छन्। तपाईंको वालेट क्रेडेन्सियल वा कार्ड नम्बर हामी कहिल्यै देख्दैनौं। राइडरले तपाईंको नाम, फोन र ठेगाना देख्छन्, नत्र पुर्‍याउनै सक्दैनन्।</p>
  <h2>हामी कहिल्यै नगर्ने कुरा</h2>
  <p>तपाईंको विवरण बेच्दैनौं, भाडामा दिँदैनौं, वा विज्ञापनदातालाई दिँदैनौं।</p>
  <h2>कति समय राख्छौं</h2>
  <p>गुनासो र दोहोरिने अर्डर व्यवस्थापनका लागि अर्डर सन्देश हाम्रो व्हाट्सएप इतिहासमा रहन्छ। हटाउन भन्नुभयो भने हटाइदिन्छौं।</p>
  <h2>तपाईंका अधिकार</h2>
  <p>हामीसँग के छ हेर्न, सच्याउन वा हटाउन <a href="${wa}">${phone}</a> मा सन्देश पठाउनुहोस् वा <a href="mailto:${email}">${email}</a> मा इमेल गर्नुहोस्। न्यूजलेटरबाट हट्न कुनै पनि इमेलको लिंक प्रयोग गर्नुहोस्।</p>` },
  },

  terms: {
    en: { file: 'terms.html', eyebrow: 'Terms', h1: 'Terms of service',
      title: 'Terms | Blendmandu',
      desc: 'The terms you agree to when ordering from Blendmandu: pricing in NPR, Kathmandu-only delivery, payment and cancellation.',
      body: `
  <p class="lede">Plain terms for ordering from a cloud kitchen in Kathmandu.</p>
  <h2>Ordering</h2>
  <p>Adding items to the cart is not an order. The order exists once you send the WhatsApp message and we confirm it. We may decline an order if we are out of an ingredient, or the address is outside our area.</p>
  <h2>Prices</h2>
  <p>All prices are in Nepalese Rupees and include applicable taxes. Delivery is charged by area and shown before you send the order. Delivery is free above ${freeOver}. Prices can change; the price confirmed on WhatsApp is the price you pay.</p>
  <h2>Delivery</h2>
  <p>We deliver inside Kathmandu only, 24 hours a day. Typical delivery is 30 to 45 minutes but is not guaranteed, because weather, traffic and load shedding are real here. We will tell you if your order is running late.</p>
  <h2>Payment</h2>
  <p>Cash on delivery, eSewa, Khalti or Fonepay. For digital payment we send a request after you confirm the order.</p>
  <h2>Food and allergens</h2>
  <p>Allergens are listed on every product page. We blend in a shared kitchen and cannot guarantee the absence of cross-contact. If a reaction would be serious, ask us before ordering.</p>
  <h2>Cancelling and refunds</h2>
  <p>See the <a href="return-policy.html">refund policy</a>.</p>
  <h2>Governing law</h2>
  <p>These terms are governed by the laws of Nepal.</p>` },
    ne: { file: 'terms.html', eyebrow: 'सर्तहरू', h1: 'सेवाका सर्तहरू',
      title: 'सर्तहरू | Blendmandu',
      desc: 'Blendmandu बाट अर्डर गर्दा लागू हुने सर्तहरू: नेपाली रुपैयाँमा मूल्य, काठमाडौंभित्र मात्र डेलिभरी, भुक्तानी र रद्दीकरण।',
      body: `
  <p class="lede">काठमाडौंको क्लाउड किचनबाट अर्डर गर्दाका सोझा सर्तहरू।</p>
  <h2>अर्डर</h2>
  <p>कार्टमा सामान थप्नु अर्डर होइन। तपाईंले व्हाट्सएप सन्देश पठाएपछि र हामीले पुष्टि गरेपछि मात्र अर्डर बन्छ। सामग्री सकिएमा वा ठेगाना हाम्रो क्षेत्रबाहिर भएमा हामी अर्डर अस्वीकार गर्न सक्छौं।</p>
  <h2>मूल्य</h2>
  <p>सबै मूल्य नेपाली रुपैयाँमा छन् र लागू हुने कर समावेश छ। डेलिभरी शुल्क क्षेत्रअनुसार लाग्छ र अर्डर पठाउनुअघि देखिन्छ। ${freeOver} माथिको अर्डरमा डेलिभरी निःशुल्क। मूल्य परिवर्तन हुन सक्छ; व्हाट्सएपमा पुष्टि भएको मूल्य नै तपाईंले तिर्ने मूल्य हो।</p>
  <h2>डेलिभरी</h2>
  <p>हामी काठमाडौंभित्र मात्र, दिनको २४ घण्टा पुर्‍याउँछौं। सामान्यतया ३० to ४५ मिनेट लाग्छ तर ग्यारेन्टी छैन। मौसम, ट्राफिक र लोडसेडिङ यहाँको वास्तविकता हो। ढिलो भएमा हामी खबर गर्नेछौं।</p>
  <h2>भुक्तानी</h2>
  <p>डेलिभरीमा नगद, इसेवा, खल्ती वा फोनपे। डिजिटल भुक्तानीका लागि अर्डर पुष्टि भएपछि अनुरोध पठाउँछौं।</p>
  <h2>खाना र एलर्जेन</h2>
  <p>हरेक उत्पादन पृष्ठमा एलर्जेन उल्लेख छ। हामी साझा किचनमा ब्लेन्ड गर्छौं र सम्पर्क शून्य हुने ग्यारेन्टी दिन सक्दैनौं। प्रतिक्रिया गम्भीर हुने भए अर्डर गर्नुअघि सोध्नुहोस्।</p>
  <h2>रद्दीकरण र फिर्ता</h2>
  <p><a href="return-policy.html">फिर्ता नीति</a> हेर्नुहोस्।</p>
  <h2>लागू कानुन</h2>
  <p>यी सर्तहरू नेपालको कानुनअनुसार सञ्चालित हुनेछन्।</p>` },
  },

  cookies: {
    en: { file: 'cookies.html', eyebrow: 'Cookies', h1: 'Cookies & storage',
      title: 'Cookies | Blendmandu',
      desc: 'Blendmandu stores your cart in your own browser and sets no advertising cookies.',
      body: `
  <p class="lede">We use browser storage for exactly two things, and neither of them tracks you.</p>
  <h2>What we store</h2>
  <ul>
    <li><strong>Your cart</strong>. Kept in your browser&rsquo;s local storage so it survives a refresh. It never leaves your device until you send the order.</li>
    <li><strong>Your delivery area answer</strong>. This stops us asking whether you are in Kathmandu on every visit.</li>
  </ul>
  <h2>Analytics</h2>
  <p>We may switch on basic analytics to see which blends people actually order. If we do, <strong>a banner asks you first</strong> and nothing loads unless you say yes. Decline and no analytics script is fetched at all. It is never requested in the first place, not fetched and then ignored. Your answer is remembered in your browser.</p>
  <h2>What we don't do</h2>
  <p>No advertising cookies, no cross-site trackers, and nothing that follows you to other websites.</p>
  <h2>Fonts</h2>
  <p>Our typefaces load from Google Fonts, which means Google receives your IP address as part of that request. That is the only third party the pages contact.</p>
  <h2>Clearing it</h2>
  <p>Clear your browser&rsquo;s site data for this domain and everything above disappears, including your cart.</p>` },
    ne: { file: 'cookies.html', eyebrow: 'कुकिज', h1: 'कुकिज र स्टोरेज',
      title: 'कुकिज | Blendmandu',
      desc: 'Blendmandu ले तपाईंको कार्ट तपाईंकै ब्राउजरमा राख्छ र कुनै विज्ञापन कुकी प्रयोग गर्दैन।',
      body: `
  <p class="lede">हामी ब्राउजर स्टोरेज ठ्याक्कै दुई कामका लागि प्रयोग गर्छौं, र दुवैले तपाईंलाई ट्र्याक गर्दैनन्।</p>
  <h2>हामी के राख्छौं</h2>
  <ul>
    <li><strong>तपाईंको कार्ट</strong>। पृष्ठ रिफ्रेस गर्दा नहराओस् भनेर ब्राउजरको लोकल स्टोरेजमा राखिन्छ। अर्डर नपठाएसम्म यो तपाईंकै यन्त्रबाट बाहिर जाँदैन।</li>
    <li><strong>डेलिभरी क्षेत्रको जवाफ</strong>। हरेक पटक काठमाडौंमा हुनुहुन्छ कि भनेर नसोधौं भनेर।</li>
  </ul>
  <h2>एनालिटिक्स</h2>
  <p>कुन ब्लेन्ड मानिसले साँच्चै अर्डर गर्छन् हेर्न हामी आधारभूत एनालिटिक्स चलाउन सक्छौं। त्यसो गर्दा <strong>पहिले ब्यानरले तपाईंलाई सोध्छ</strong> र तपाईंले हुन्छ नभनेसम्म केही लोड हुँदैन। अस्वीकार गर्नुभयो भने कुनै एनालिटिक्स स्क्रिप्ट मगाइँदैन। लोड गरेर बेवास्ता गरिने होइन, बरु कहिल्यै मगाइँदैन। तपाईंको जवाफ ब्राउजरमै सम्झिन्छ।</p>
  <h2>हामी के गर्दैनौं</h2>
  <p>विज्ञापन कुकी छैन, क्रस-साइट ट्र्याकर छैन, र अन्य वेबसाइटसम्म पछ्याउने केही छैन।</p>
  <h2>फन्ट</h2>
  <p>हाम्रा टाइपफेस Google Fonts बाट लोड हुन्छन्, जसको अर्थ त्यो अनुरोधमा Google ले तपाईंको IP ठेगाना पाउँछ। पृष्ठले सम्पर्क गर्ने एक मात्र तेस्रो पक्ष त्यही हो।</p>
  <h2>हटाउने तरिका</h2>
  <p>यो डोमेनको साइट डेटा ब्राउजरबाट हटाउनुहोस्, माथिका सबै कुरा हराउँछन्। तपाईंको कार्टसहित।</p>` },
  },
});
