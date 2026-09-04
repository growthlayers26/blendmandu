/* ============================================================
   Structured data.

   Product schema alone tells Google what you sell but not that you
   are a business that delivers in Kathmandu 24 hours a day. That is
   what LocalBusiness carries, and it is the piece local search
   actually reads.
   ============================================================ */
module.exports = ({ SHOP, ORIGIN, urlFor, T, money, PRODUCTS, CATEGORIES, catLabel, FAQ }) => {

  const B = SHOP.business;
  const bizId = `${ORIGIN}/#business`;

  const address = {
    '@type': 'PostalAddress',
    addressLocality: B.locality,
    addressRegion: B.region,
    addressCountry: B.country,
  };
  if (B.street) address.streetAddress = B.street;
  if (B.postalCode) address.postalCode = B.postalCode;

  /* FoodEstablishment is the honest subtype: we prepare and deliver food
     but have no dining room, so no `acceptsReservations`, no seating. */
  const business = lang => ({
    '@context': 'https://schema.org',
    '@type': ['FoodEstablishment', 'LocalBusiness'],
    '@id': bizId,
    name: SHOP.brand,
    legalName: B.legalName,
    url: urlFor(lang, ''),
    telephone: SHOP.phone,
    ...(SHOP.email ? { email: SHOP.email } : {}),   // omitted while the domain is not owned
    image: `${ORIGIN}/og-image.png`,
    logo: `${ORIGIN}/icon-512.png`,
    priceRange: B.priceRange,
    currenciesAccepted: 'NPR',
    paymentAccepted: 'Cash, eSewa, Khalti, Fonepay',
    servesCuisine: B.cuisine,
    address,
    geo: { '@type': 'GeoCoordinates', latitude: B.latitude, longitude: B.longitude },
    /* Derived from the real delivery zones so the two can never drift.
        "smoothie delivery Baneshwor" is the query that converts, not
        "smoothie delivery Nepal". */
    areaServed: [
      { '@type': 'City', name: 'Kathmandu', addressCountry: 'NP' },
      ...SHOP.zones.flatMap(z => z.name.split(' / ')).map(n => ({
        '@type': 'Place', name: n,
        address: { '@type': 'PostalAddress', addressLocality: n,
                   addressRegion: 'Bagmati', addressCountry: 'NP' },
      })),
    ],
    hasMenu: urlFor(lang, 'shop.html'),
    // 24/7 — the whole proposition, and invisible to Google without this
    openingHoursSpecification: [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
      opens: '00:00',
      closes: '23:59',
    }],
    /* Only real profile URLs belong here. A link to a network's home page
        is not a sameAs and is worse than omitting the property. */
    ...(function(){ const s=[SHOP.instagram,SHOP.facebook,SHOP.tiktok]
          .filter(u => u && /\/[^/]+\/?$/.test(u.replace(/^https?:\/\//,'').replace(/^[^/]+/,'')));
        return s.length ? { sameAs: s } : {}; })(),
  });

  /* WebSite + SearchAction gives the sitelinks search box. We have a real
     search, so this is a claim we can actually back. */
  const website = lang => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${ORIGIN}/#website`,
    url: urlFor(lang, ''),
    name: SHOP.brand,
    inLanguage: lang === 'ne' ? 'ne-NP' : 'en',
    publisher: { '@id': bizId },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${urlFor(lang, 'shop.html')}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  });

  const faq = lang => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ[lang].map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  });

  const menu = lang => ({
    '@context': 'https://schema.org',
    '@type': 'Menu',
    '@id': `${ORIGIN}/#menu`,
    name: T(lang, 'nav.menu'),
    inLanguage: lang === 'ne' ? 'ne-NP' : 'en',
    hasMenuSection: CATEGORIES.filter(c => c.id !== 'all').map(c => ({
      '@type': 'MenuSection',
      name: catLabel(lang, c),
      hasMenuItem: PRODUCTS.filter(p => p.cat === c.id).map(p => ({
        '@type': 'MenuItem',
        name: p.name,
        url: urlFor(lang, `product/${p.id}.html`),
        offers: { '@type': 'Offer', price: String(p.price), priceCurrency: 'NPR' },
      })),
    })),
  });

  const contactPage = lang => ({
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    url: urlFor(lang, 'contact.html'),
    mainEntity: { '@id': bizId },
  });

  return { business, website, faq, menu, contactPage };
};
