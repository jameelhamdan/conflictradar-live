import type { Language } from '../contexts/LanguageContext'

export interface UIStrings {
  // Nav
  about: string
  newsletter: string
  subscribe: string
  // Time filters
  filter6h: string
  filter24h: string
  filter7d: string
  filter30d: string
  // Event list
  events: string
  loading: string
  noEvents: string
  showArticles: string
  hideArticles: string
  // Mobile tabs
  mapTab: string
  listTab: string
  briefingsTab: string
  // Layer toggles
  notams: string
  earthquakes: string
  locations: string
  // Time-ago (functions)
  minutesAgo: (n: number) => string
  hoursAgo: (n: number) => string
  daysAgo: (n: number) => string
  justNow: string
  // Counts
  articleCount: (n: number) => string
  eventCount: (n: number) => string
  // Subscribe popup
  subscribeTitle: string
  subscribeTagline: string
  checkEmailConfirm: string
  subscribingLabel: string
  // Markets / PriceTicker
  markets: string
  symbolCol: string
  priceCol: string
  changeCol: string
  noDataYet: string
  streamKeys: { stock: string; crypto: string; commodity: string; forex: string; bond: string }
  // Newsletter page
  pastBriefings: string
  selectBriefing: string
  noBriefingsYet: string
  back: string
  imageCredit: string
  // About page
  openSourceRealtime: string
  aboutHeroTagline: string
  aboutWhatWeDoTitle: string
  aboutWhatWeDo: string
  aboutLegendTitle: string
  aboutContactTitle: string
  aboutContactFooter: string
  contactLabelGeneral: string
  contactLabelData: string
  contactLabelPress: string
  contactNoteData: string
  contactNotePress: string
  categoryDescs: Record<string, string>
  // Page titles (visible h1s)
  privacyPageTitle: string
  termsPageTitle: string
  lastUpdated: string
  // Footer links
  termsLink: string
  privacyLink: string
}

export const UI: Record<Language, UIStrings> = {
  en: {
    about: 'About',
    newsletter: 'Newsletter',
    subscribe: 'Subscribe',
    filter6h: '6h',
    filter24h: '24h',
    filter7d: '7d',
    filter30d: '30d',
    events: 'events',
    loading: 'Loading…',
    noEvents: 'No events found.',
    showArticles: 'Show articles ▾',
    hideArticles: 'Hide articles ▴',
    mapTab: 'Map',
    listTab: 'Events',
    briefingsTab: 'Briefings',
    notams: 'NOTAMs',
    earthquakes: 'Earthquakes',
    locations: 'Locations',
    minutesAgo: (n) => `${n}m ago`,
    hoursAgo: (n) => `${n}h ago`,
    daysAgo: (n) => `${n}d ago`,
    justNow: 'just now',
    articleCount: (n) => `${n} article${n !== 1 ? 's' : ''}`,
    eventCount: (n) => `${n} event${n !== 1 ? 's' : ''}`,
    subscribeTitle: 'Daily Briefings',
    subscribeTagline: 'Get the day\'s top conflict intelligence in your inbox.',
    checkEmailConfirm: 'Check your email to confirm.',
    subscribingLabel: 'Subscribing…',
    markets: 'Markets',
    symbolCol: 'Symbol',
    priceCol: 'Price',
    changeCol: 'Chg%',
    noDataYet: 'No data yet',
    streamKeys: {
      stock: 'Stocks',
      crypto: 'Crypto',
      commodity: 'Commodities',
      forex: 'Forex',
      bond: 'Bonds',
    },
    pastBriefings: 'Past briefings',
    selectBriefing: 'Select a briefing on the left to read.',
    noBriefingsYet: 'No newsletters published yet.',
    back: '← Back',
    imageCredit: 'Image:',
    openSourceRealtime: 'Open-source · Real-time',
    aboutHeroTagline: 'A real-time intelligence platform that turns raw news into a global conflict picture.',
    aboutWhatWeDoTitle: 'What we do',
    aboutWhatWeDo: 'conflictradar.live monitors hundreds of news sources — Telegram channels, wire feeds, and regional outlets — and uses natural language processing to extract, classify, and geolocate events as they happen. The result is an interactive live map where you can explore ongoing conflicts, protests, disasters, and political developments anywhere in the world.',
    aboutLegendTitle: 'Category legend',
    aboutContactTitle: 'Contact',
    aboutContactFooter: 'conflictradar.live is a small independent project. We aim to respond within 48 hours but cannot guarantee replies to every message. For urgent operational matters, include "URGENT" in the subject line.',
    contactLabelGeneral: 'General enquiries',
    contactLabelData: 'Source & data requests',
    contactLabelPress: 'Press & media',
    contactNoteData: 'Want us to track a specific region, outlet, or Telegram channel? Send us the details.',
    contactNotePress: 'For media use of our data or map embeds, please reach out before publishing.',
    categoryDescs: {
      conflict: 'Armed clashes, military operations, airstrikes',
      protest: 'Demonstrations, civil unrest, strikes',
      disaster: 'Natural disasters, industrial accidents',
      political: 'Elections, diplomacy, government decisions',
      economic: 'Sanctions, market events, trade disruptions',
      crime: 'High-profile crime, organized crime, arrests',
      general: 'Other noteworthy events',
    },
    privacyPageTitle: 'Privacy Policy',
    termsPageTitle: 'Terms of Service',
    lastUpdated: 'Last updated:',
    termsLink: 'Terms of Service',
    privacyLink: 'Privacy Policy',
  },
  ar: {
    about: 'حول',
    newsletter: 'النشرة',
    subscribe: 'اشتراك',
    filter6h: '٦س',
    filter24h: '٢٤س',
    filter7d: '٧أ',
    filter30d: '٣٠أ',
    events: 'أحداث',
    loading: 'جارٍ التحميل…',
    noEvents: 'لا توجد أحداث.',
    showArticles: 'عرض المقالات ▾',
    hideArticles: 'إخفاء المقالات ▴',
    mapTab: 'الخريطة',
    listTab: 'الأحداث',
    briefingsTab: 'النشرات',
    notams: 'نوتام',
    earthquakes: 'زلازل',
    locations: 'مواقع',
    minutesAgo: (n) => `منذ ${n} د`,
    hoursAgo: (n) => `منذ ${n} س`,
    daysAgo: (n) => `منذ ${n} ي`,
    justNow: 'الآن',
    articleCount: (n) => `${n} مقال${n !== 1 ? 'ات' : ''}`,
    eventCount: (n) => `${n} حدث${n !== 1 ? ' ًا' : ''}`,
    subscribeTitle: 'النشرات اليومية',
    subscribeTagline: 'احصل على أبرز أخبار النزاعات في بريدك الإلكتروني يومياً.',
    checkEmailConfirm: 'تحقق من بريدك الإلكتروني للتأكيد.',
    subscribingLabel: 'جارٍ الاشتراك…',
    markets: 'الأسواق',
    symbolCol: 'رمز',
    priceCol: 'السعر',
    changeCol: 'تغيير%',
    noDataYet: 'لا بيانات بعد',
    streamKeys: {
      stock: 'أسهم',
      crypto: 'كريبتو',
      commodity: 'سلع',
      forex: 'فوركس',
      bond: 'سندات',
    },
    pastBriefings: 'النشرات السابقة',
    selectBriefing: 'اختر نشرة من القائمة للقراءة.',
    noBriefingsYet: 'لا توجد نشرات منشورة بعد.',
    back: 'رجوع',
    imageCredit: 'الصورة:',
    openSourceRealtime: 'مفتوح المصدر · مباشر',
    aboutHeroTagline: 'منصة استخبارات آنية تحول الأخبار الخام إلى صورة شاملة للنزاعات العالمية.',
    aboutWhatWeDoTitle: 'ما نفعله',
    aboutWhatWeDo: 'ترصد conflictradar.live مئات المصادر الإخبارية — قنوات تيليغرام ووكالات الأنباء والمنافذ الإقليمية — وتستخدم معالجة اللغة الطبيعية لاستخلاص الأحداث وتصنيفها وتحديد مواقعها الجغرافية فور وقوعها. والنتيجة خريطة تفاعلية حية يمكنك من خلالها استكشاف النزاعات والاحتجاجات والكوارث والتطورات السياسية في أي مكان من العالم.',
    aboutLegendTitle: 'دليل التصنيفات',
    aboutContactTitle: 'تواصل معنا',
    aboutContactFooter: 'conflictradar.live مشروع مستقل صغير. نسعى للرد خلال ٤٨ ساعة، لكن لا نستطيع ضمان الرد على جميع الرسائل. للأمور العاجلة، يرجى كتابة «عاجل» في سطر الموضوع.',
    contactLabelGeneral: 'استفسارات عامة',
    contactLabelData: 'طلبات المصادر والبيانات',
    contactLabelPress: 'الإعلام والصحافة',
    contactNoteData: 'هل تريد منا تتبع منطقة أو منفذ إعلامي أو قناة تيليغرام معينة؟ أرسل لنا التفاصيل.',
    contactNotePress: 'لاستخدام بياناتنا أو تضمين خرائطنا إعلامياً، يرجى التواصل معنا قبل النشر.',
    categoryDescs: {
      conflict: 'اشتباكات مسلحة، عمليات عسكرية، غارات جوية',
      protest: 'مظاهرات، اضطرابات مدنية، إضرابات',
      disaster: 'كوارث طبيعية، حوادث صناعية',
      political: 'انتخابات، دبلوماسية، قرارات حكومية',
      economic: 'عقوبات، أحداث اقتصادية، اضطرابات تجارية',
      crime: 'جرائم بارزة، جريمة منظمة، اعتقالات',
      general: 'أحداث جديرة بالاهتمام',
    },
    privacyPageTitle: 'سياسة الخصوصية',
    termsPageTitle: 'شروط الخدمة',
    lastUpdated: 'آخر تحديث:',
    termsLink: 'شروط الخدمة',
    privacyLink: 'سياسة الخصوصية',
  },
}
