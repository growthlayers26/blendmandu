/* ============================================================
   Nepali copy for index / shop / cart.

   These three pages are hand-written HTML, so their prose is
   translated by exact string replacement at build time. Anything
   listed in `requiredIn` MUST be found or the build fails — that
   is what stops a half-translated page shipping.
   ============================================================ */
module.exports = {
  meta: {
    'index.html': {
      title: 'काठमाडौंमा स्मुदी डेलिभरी, २४ घण्टा खुला | Blendmandu',
      desc: 'ताजा स्मुदी, असाई बाउल र कोल्ड प्रेस्ड जुस, अर्डरपछि ब्लेन्ड गरी काठमाडौंभर ३० देखि ४५ मिनेटमा, दिनरात जुनसुकै बेला। व्हाट्सएपमा अर्डर गर्नुहोस्।',
    },
    'shop.html': {
      title: 'स्मुदी र जुस मेनु, काठमाडौं डेलिभरी | Blendmandu',
      desc: 'पन्ध्र स्मुदी, असाई बाउल, कोल्ड प्रेस्ड जुस र वेलनेस सट, रु 150 देखि। अर्डरपछि ब्लेन्ड गरी काठमाडौंभर २४ घण्टा डेलिभरी। रु 1,500 माथि निःशुल्क।',
    },
    'cart.html': {
      title: 'तपाईंको कार्ट | Blendmandu',
      desc: 'आफ्नो अर्डर हेरेर व्हाट्सएपमा पठाउनुहोस्। डेलिभरीमा नगद, इसेवा, खल्ती वा फोनपे।',
    },
  },

  /* [english, nepali] — applied in order, longest first is safest */
  strings: [
    // ---- index: hero ----
    ['Kathmandu &middot; open 24 hours', 'काठमाडौं &middot; २४ घण्टा खुला'],
    ['<span>Smoothies blended at 3 AM,</span> <span>delivered across Kathmandu</span>',
     '<span>राति ३ बजे ब्लेन्ड गरिएको स्मुदी,</span> <span>काठमाडौंभर पुर्‍याइन्छ</span>'],
    ['Fresh smoothies, acai bowls and cold pressed juice, blended after you order and at your door in 30 to 45 minutes. Anywhere in Kathmandu, any hour of the day or night. No app, no account, cash or eSewa on arrival.',
     'ताजा स्मुदी, असाई बाउल र कोल्ड प्रेस्ड जुस, अर्डरपछि ब्लेन्ड गरी ३० देखि ४५ मिनेटमा तपाईंको ढोकामा। काठमाडौंभर, दिनरात जुनसुकै बेला। एप चाहिँदैन, खाता चाहिँदैन, आइपुगेपछि नगद वा इसेवा।'],
    ['Drag to spin, or tap the cup to change flavour', 'घुमाउन तान्नुहोस् &middot; स्वाद बदल्न कपमा क्लिक गर्नुहोस्'],
    ['Three-dimensional smoothie cup. Drag to spin it, click to change flavour.', 'त्रि-आयामिक स्मुदी कप। घुमाउन तान्नुहोस्, स्वाद बदल्न क्लिक गर्नुहोस्।'],
    ['Previous flavour', 'अघिल्लो स्वाद'],
    ['Next flavour', 'अर्को स्वाद'],
    ['Add to cart', 'कार्टमा थप्नुहोस्'],
    ['See all 15 blends', 'पूरै मेनु हेर्नुहोस्'],

    // ---- index: pinned section ----
    ['How we blend', 'हामी कसरी ब्लेन्ड गर्छौं'],
    ['Fruit first', 'पहिले फलफूल'],
    ['Seasonal Nepali fruit wherever the season allows it, and nothing frozen months ago standing in for it.',
     'मौसमले दिएसम्म नेपाली मौसमी फलफूल। महिनौंअघि जमाइएको कुनै विकल्प होइन।'],
    ['Nothing pre-made', 'पहिल्यै बनाइएको केही छैन'],
    ["The blender does not start until your order lands. No batches sit in a fridge losing everything that made them worth drinking.",
     'तपाईंको अर्डर नआएसम्म ब्लेन्डर चल्दैन। फ्रिजमा राखेर स्वाद गुमाइरहेका ब्याच हामीसँग छैनन्।'],
    ['Sealed and sent', 'बन्द गरी पठाइन्छ'],
    ['Lidded, sleeved and on a bike within minutes. Thirty to forty five to your door, at any hour you care to ask.',
     'ढक्कन लगाएर, स्लिभ हालेर केही मिनेटमै बाइकमा। तीसदेखि पैँतालीस मिनेटमा तपाईंको ढोकामा, जुनसुकै बेला।'],

    // ---- index: sequence ----
    ['From fruit to cup', 'फलफूलदेखि कपसम्म'],
    ['Ninety seconds,', 'नब्बे सेकेन्ड,'],
    ['start to finish', 'सुरुदेखि अन्त्यसम्म'],

    // ---- index: about ----
    ['About us', 'हाम्रो बारेमा'],
    ['>Smoothie and juice menu, delivered across Kathmandu<', '>स्मुदी र जुस मेनु, काठमाडौंभर डेलिभरी<'],
    ['Welcome!', 'स्वागत छ!'],
    ["We started Blendmandu because good fruit is everywhere in this valley and a genuinely fresh smoothie somehow is not. So we skipped the shopfront, put the money into produce and a kitchen that never closes, and we bring it to you instead.",
     'हामीले Blendmandu सुरु गर्‍यौं किनभने यो उपत्यकामा राम्रो फलफूल जताततै छ, तर साँच्चै ताजा स्मुदी भने कतै छैन। त्यसैले पसल नखोली त्यो पैसा फलफूल र कहिल्यै नबन्द हुने किचनमा लगायौं, र तपाईंकहाँ पुर्‍याउन थाल्यौं।'],
    ["Every cup is blended after you order it, so nothing sits in a fridge waiting. Seasonal Nepali fruit where we can get it, no syrups, no powders you did not ask for, and honest labels on what is inside.",
     'हरेक कप तपाईंले अर्डर गरेपछि मात्र ब्लेन्ड हुन्छ, त्यसैले फ्रिजमा कुरेर बस्ने केही छैन। पाएसम्म नेपाली मौसमी फलफूल, कुनै सिरप छैन, नमागेको पाउडर छैन, र भित्र के छ भन्ने इमानदार लेबल।'],
    ['Always open', 'सधैं खुला'],
    ['Minutes, typical', 'मिनेट, सामान्यतया'],
    ['Added syrups', 'थपिएको सिरप'],
    ['Blends on the menu', 'मेनुमा ब्लेन्ड'],

    // ---- index: popular + how ----
    ['Most ordered', 'सबैभन्दा धेरै अर्डर'],
    ['Start here', 'यहाँबाट सुरु गर्नुहोस्'],
    ['How it works', 'कसरी काम गर्छ'],
    ['Four steps, no app', 'चार चरण, कुनै एप छैन'],
    ['Build your order', 'आफ्नो अर्डर बनाउनुहोस्'],
    ['Pick your blends from the menu and add them to the cart. No account, no sign-up.',
     'मेनुबाट आफ्नो ब्लेन्ड छानेर कार्टमा थप्नुहोस्। खाता चाहिँदैन, साइन-अप चाहिँदैन।'],
    ['Send it on WhatsApp', 'व्हाट्सएपमा पठाउनुहोस्'],
    ["Checkout writes your order into a WhatsApp message. Press send and we have it.",
     'चेकआउटले तपाईंको अर्डर व्हाट्सएप सन्देशमा लेखिदिन्छ। पठाउनुहोस्, हामीले पायौं।'],
    ['We blend it fresh', 'हामी ताजा ब्लेन्ड गर्छौं'],
    ['Nothing is made ahead. Your cup starts once the order lands in the kitchen.',
     'केही पनि पहिल्यै बनाइँदैन। अर्डर किचनमा पुगेपछि मात्र तपाईंको कप सुरु हुन्छ।'],
    ['Pay at the door', 'ढोकामै तिर्नुहोस्'],
    ["Cash on delivery, or eSewa, Khalti and Fonepay if you would rather settle it digitally.",
     'डेलिभरीमा नगद, वा डिजिटल तिर्न मन भए इसेवा, खल्ती र फोनपे।'],

    // ---- index: delivery ----
    ['Kathmandu only,', 'काठमाडौंमा मात्र,'],
    ['every hour', 'हरेक घण्टा'],
    ['We ride inside the Kathmandu ring road and the neighbourhoods just outside it. Delivery is free once your order passes Rs 1,500.',
     'हामी काठमाडौं रिङरोडभित्र र त्यसको वरिपरिका टोलहरूमा पुग्छौं। अर्डर रु 1,500 नाघेपछि डेलिभरी निःशुल्क।'],
    ['Areas &amp; fees', 'क्षेत्र र शुल्क'],
    ['Thamel · Durbar Marg · Lazimpat · Naxal', 'ठमेल · दरबारमार्ग · लाजिम्पाट · नक्साल'],
    ['Baluwatar · Maharajgunj · Chabahil · Baneshwor', 'बालुवाटार · महाराजगन्ज · चाबहिल · बानेश्वर'],
    ['Kalanki · Swayambhu · Gongabu · Koteshwor', 'कलंकी · स्वयम्भू · गोंगबु · कोटेश्वर'],

    // ---- shop ----
    ["Every smoothie, bowl and cold pressed juice below is blended after you order it, never before. Seasonal fruit, no syrups, no powders you did not ask for. Prices start at Rs 150, delivery anywhere in Kathmandu takes 30 to 45 minutes, and the kitchen never closes.",
     'तलका हरेक स्मुदी, बाउल र कोल्ड प्रेस्ड जुस तपाईंले अर्डर गरेपछि मात्र ब्लेन्ड हुन्छ, पहिले होइन। मौसमी फलफूल, कुनै सिरप छैन, नमागेको पाउडर छैन। मूल्य रु 150 देखि सुरु हुन्छ, काठमाडौंभर डेलिभरीमा ३० देखि ४५ मिनेट लाग्छ, र किचन कहिल्यै बन्द हुँदैन।'],
    ['>Search<', '>खोज्नुहोस्<'],
    ['mango, vegan, protein…', 'आँप, भेगन, प्रोटिन…'],
    ['Clear search', 'खोज हटाउनुहोस्'],
    ['>Categories<', '>वर्गहरू<'],

    // ---- cart ----
    ['>Your cart<', '>तपाईंको कार्ट<'],
    ['Nothing in here yet.', 'अहिलेसम्म केही छैन।'],
    ['Browse the menu', 'मेनु हेर्नुहोस्'],
    ['>Subtotal<', '>उप-जम्मा<'],
    ['>Delivery<', '>डेलिभरी<'],
    ['>Total<', '>जम्मा<'],
    ['>Checkout<', '>चेकआउट<'],
    ['Where to?', 'कहाँ पुर्‍याउने?'],
    ['Your name', 'तपाईंको नाम'],
    ['Phone number', 'फोन नम्बर'],
    ['Delivery area', 'डेलिभरी क्षेत्र'],
    ['We only deliver inside Kathmandu at the moment.', 'अहिले हामी काठमाडौंभित्र मात्र पुर्‍याउँछौं।'],
    ['>Address<', '>ठेगाना<'],
    ['Street, tole, house or flat number', 'सडक, टोल, घर वा फ्ल्याट नम्बर'],
    ['Nearest landmark', 'नजिकको ल्यान्डमार्क'],
    ['Helps the rider find you faster', 'राइडरलाई छिटो भेट्न सजिलो हुन्छ'],
    ['When do you want it?', 'कहिले चाहनुहुन्छ?'],
    ['Right now, 30 to 45 min', 'अहिले नै, ३० देखि ४५ मिनेट'],
    ['Schedule for later', 'पछिका लागि तय गर्नुहोस्'],
    ['Deliver at', 'यति बेला पुर्‍याउनुहोस्'],
    ['>Payment<', '>भुक्तानी<'],
    ['Anything else?', 'अरू केही?'],
    ['Allergies, no ice, extra ginger…', 'एलर्जी, बरफ नहाल्ने, बढी अदुवा…'],
    ['Send my order on WhatsApp', 'व्हाट्सएपमा अर्डर पठाउनुहोस्'],
    ['Your order is already written out. Press send and we start blending. Nothing is charged on this page.',
     'तपाईंको अर्डर भरिएको व्हाट्सएप खुल्छ। यहाँ कुनै रकम काटिँदैन।'],
  ],

  /* strings that MUST exist in each file — build fails if one goes missing,
     which is how a copy change on the English page gets caught */
  requiredIn: {
    'index.html': ['<span>Smoothies blended at 3 AM,</span>', 'How we blend', 'Welcome!', 'How it works',
                   'Areas &amp; fees', 'Four steps, no app'],
    'shop.html':  ['>Categories<', '>Search<'],
    'cart.html':  ['>Your cart<', 'Where to?', 'Send my order on WhatsApp'],
  },
};
