/* ============================================================
   FAQ — one source for both the visible section and the FAQPage
   schema. Google requires the answers to be present on the page,
   so generating both from here means they can never drift apart.

   These answer real buying questions, so they carry the search
   terms people actually type: smoothie delivery Kathmandu, 24
   hour delivery, cash on delivery, eSewa, Khalti.
   ============================================================ */
module.exports = {
  en: [
    ['Do you really deliver 24 hours a day?',
     'Yes. The kitchen never closes. Order a smoothie at 3 AM in Kathmandu and we blend it at 3 AM. Delivery runs all day and all night, every day of the week, including public holidays.'],
    ['Which areas of Kathmandu do you deliver to?',
     'We deliver across Kathmandu. Thamel, Durbar Marg, Lazimpat and Naxal cost Rs 100. Baluwatar, Maharajgunj, Chabahil and Baneshwor cost Rs 120. Kalanki, Swayambhu, Gongabu and Koteshwor cost Rs 150. Delivery is free once your order passes Rs 1,500.'],
    ['How long does delivery take?',
     'Usually 30 to 45 minutes from the moment you send your order. That is not a guarantee, because weather, traffic and load shedding are real here, but if your order is running late we message you rather than leave you guessing.'],
    ['How do I pay?',
     'Cash on delivery, or eSewa, Khalti and Fonepay if you would rather settle it digitally. For digital payment we send a request once you confirm the order. There is no minimum order value.'],
    ['How do I place an order?',
     'Pick your blends, add them to the cart, and checkout writes the whole order into a WhatsApp message. Press send and we have it. No account, no app, no sign up, and nothing to install.'],
    ['Are the ingredients fresh, and do you list allergens?',
     'Every cup is blended after you order it, so nothing sits in a fridge losing its goodness. Every product page lists its allergens. We blend in a shared kitchen, so we cannot promise zero cross contact with dairy, peanuts, tree nuts or gluten. If a reaction would be serious, message us before ordering.'],
  ],
  ne: [
    ['के तपाईंहरू साँच्चै २४ घण्टै डेलिभरी गर्नुहुन्छ?',
     'हो। किचन कहिल्यै बन्द हुँदैन। काठमाडौंमा राति ३ बजे स्मुदी अर्डर गर्नुहोस्, राति ३ बजे नै ब्लेन्ड गर्छौं। डेलिभरी हप्ताको सातै दिन, सार्वजनिक बिदामा समेत, दिनरात चल्छ।'],
    ['काठमाडौंको कुन कुन ठाउँमा डेलिभरी हुन्छ?',
     'हामी काठमाडौंभर पुर्‍याउँछौं। ठमेल, दरबारमार्ग, लाजिम्पाट र नक्सालमा रु 100। बालुवाटार, महाराजगन्ज, चाबहिल र बानेश्वरमा रु 120। कलंकी, स्वयम्भू, गोंगबु र कोटेश्वरमा रु 150। अर्डर रु 1,500 नाघेपछि डेलिभरी निःशुल्क।'],
    ['डेलिभरीमा कति समय लाग्छ?',
     'अर्डर पठाएको क्षणदेखि सामान्यतया ३० देखि ४५ मिनेट। यो ग्यारेन्टी होइन, किनकि मौसम, ट्राफिक र लोडसेडिङ यहाँको वास्तविकता हो। तर ढिलो भएमा तपाईंलाई अन्योलमा नराखी खबर गर्छौं।'],
    ['भुक्तानी कसरी गर्ने?',
     'डेलिभरीमा नगद, वा डिजिटल तिर्न मन भए इसेवा, खल्ती र फोनपे। डिजिटल भुक्तानीका लागि अर्डर पुष्टि भएपछि अनुरोध पठाउँछौं। न्यूनतम अर्डर रकम छैन।'],
    ['अर्डर कसरी गर्ने?',
     'आफ्नो ब्लेन्ड छान्नुहोस्, कार्टमा थप्नुहोस्, र चेकआउटले पूरै अर्डर व्हाट्सएप सन्देशमा लेखिदिन्छ। पठाउनुहोस्, हामीले पायौं। खाता चाहिँदैन, एप चाहिँदैन, साइन अप चाहिँदैन।'],
    ['सामग्री ताजा हुन्छ? एलर्जेन उल्लेख हुन्छ?',
     'हरेक कप तपाईंले अर्डर गरेपछि मात्र ब्लेन्ड हुन्छ, त्यसैले फ्रिजमा बसेर गुण गुम्दैन। हरेक उत्पादन पृष्ठमा एलर्जेन उल्लेख छ। हामी साझा किचनमा ब्लेन्ड गर्छौं, त्यसैले दुग्धजन्य, बदाम, रुखे बदाम वा ग्लुटेनसँग सम्पर्क शून्य हुन्छ भन्न सक्दैनौं। प्रतिक्रिया गम्भीर हुने भए अर्डर गर्नुअघि सोध्नुहोस्।'],
  ],
};
