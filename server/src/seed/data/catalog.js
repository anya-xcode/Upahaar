export const CATEGORIES = [
  { name: 'Cakes', slug: 'cakes', icon: 'cakes', accent: { from: '#F8EFE9', to: '#FDF8F4' }, description: 'Freshly baked, delivered in the hour.', isFeatured: true },
  { name: 'Flowers', slug: 'flowers', icon: 'flowers', accent: { from: '#F9EDEF', to: '#FDF6F6' }, description: 'Hand-tied bouquets from local florists.', isFeatured: true },
  { name: 'Chocolates', slug: 'chocolates', icon: 'chocolates', accent: { from: '#F3EBE4', to: '#FBF6F1' }, description: 'Artisan chocolate, made close to you.', isFeatured: true },
  { name: 'Gift Hampers', slug: 'gift-hampers', icon: 'gift-hampers', accent: { from: '#F6EFE6', to: '#FCF8F2' }, description: 'Beautifully curated, ready to gift.', isFeatured: true },
  { name: 'Personalized Gifts', slug: 'personalized-gifts', icon: 'personalized-gifts', accent: { from: '#F0EDF5', to: '#F9F7FB' }, description: 'Add a name, a photo, a memory.', isFeatured: true },
  { name: 'Soft Toys', slug: 'soft-toys', icon: 'soft-toys', accent: { from: '#F7F0E6', to: '#FDF8F1' }, description: 'Cuddly companions for every age.', isFeatured: true },
  { name: 'Anniversary Gifts', slug: 'anniversary-gifts', icon: 'anniversary-gifts', accent: { from: '#F8ECEF', to: '#FDF6F7' }, description: 'For the years you have shared.' },
  { name: 'Birthday Gifts', slug: 'birthday-gifts', icon: 'birthday-gifts', accent: { from: '#EBF0F5', to: '#F7FAFC' }, description: 'Make their day unforgettable.' },
  { name: "Mother's Day", slug: 'mothers-day', icon: 'mothers-day', accent: { from: '#F9EEF1', to: '#FDF7F9' }, description: 'Because she never asks for anything.' },
  { name: "Father's Day", slug: 'fathers-day', icon: 'fathers-day', accent: { from: '#ECEFF4', to: '#F8FAFC' }, description: 'For the quiet hero at home.' },
  { name: "Valentine's Day", slug: 'valentines-day', icon: 'valentines-day', accent: { from: '#F8EAEC', to: '#FDF5F6' }, description: 'Say it properly this year.' },
  { name: 'Wedding Gifts', slug: 'wedding-gifts', icon: 'wedding-gifts', accent: { from: '#F7F1E4', to: '#FDFAF2' }, description: 'Elegant gifting for the big day.' },
  { name: 'Baby Gifts', slug: 'baby-gifts', icon: 'baby-gifts', accent: { from: '#E9F2EF', to: '#F6FBF9' }, description: 'Welcome the newest arrival.' },
  { name: 'Corporate Gifts', slug: 'corporate-gifts', icon: 'corporate-gifts', accent: { from: '#EEEFF2', to: '#F9FAFB' }, description: 'Thoughtful gifting, at scale.' },
  { name: 'Festival Gifts', slug: 'festival-gifts', icon: 'festival-gifts', accent: { from: '#F8F0E2', to: '#FDF8EF' }, description: 'Diwali, Rakhi, Eid and everything between.' },
].map((c, i) => ({ ...c, displayOrder: i, isActive: true }));

export const OCCASIONS = [
  { name: 'Birthday', slug: 'birthday', icon: 'birthday', tagline: 'Another year of them' },
  { name: 'Anniversary', slug: 'anniversary', icon: 'anniversary', tagline: 'Celebrate the years' },
  { name: 'Wedding', slug: 'wedding', icon: 'wedding', tagline: 'For the new beginning' },
  { name: "Valentine's Day", slug: 'valentines-day', icon: 'valentines-day', tagline: 'Love, delivered', month: 2, day: 14 },
  { name: "Mother's Day", slug: 'mothers-day', icon: 'mothers-day', tagline: 'For Maa', month: 5, day: 11 },
  { name: "Father's Day", slug: 'fathers-day', icon: 'fathers-day', tagline: 'For Papa', month: 6, day: 15 },
  { name: 'Congratulations', slug: 'congratulations', icon: 'congratulations', tagline: 'They did it!' },
  { name: 'Thank You', slug: 'thank-you', icon: 'thank-you', tagline: 'A little gratitude' },
  { name: 'Get Well Soon', slug: 'get-well-soon', icon: 'get-well-soon', tagline: 'Sending warmth' },
  { name: 'New Baby', slug: 'new-baby', icon: 'new-baby', tagline: 'Tiny feet, big joy' },
  { name: 'House Warming', slug: 'house-warming', icon: 'house-warming', tagline: 'To new beginnings' },
  { name: 'Diwali', slug: 'diwali', icon: 'diwali', tagline: 'Light up their day', month: 10, day: 20 },
  { name: 'Raksha Bandhan', slug: 'raksha-bandhan', icon: 'raksha-bandhan', tagline: 'For your sibling', month: 8, day: 9 },
  { name: 'Corporate', slug: 'corporate', icon: 'corporate', tagline: 'Business, warmly done' },
  { name: 'Just Because', slug: 'just-because', icon: 'just-because', tagline: 'No reason needed' },
].map((o, i) => ({ ...o, displayOrder: i, isActive: true }));

export const FAQS = [
  {
    question: 'How does 60-minute delivery work?',
    answer:
      'When you enter your PIN code we look for sellers who are open right now, hold the item in stock, and sit inside delivery range. If a gift can be prepared and reach you within the hour, it appears under Deliver in 60 Minutes. Nothing is shown that we cannot actually deliver.',
    category: 'Delivery',
  },
  {
    question: 'Why do I see different gifts than my friend in another city?',
    answer:
      'Upahaar is a local-first marketplace. Your feed is built from sellers who serve your exact PIN code, so what you see is genuinely deliverable to you.',
    category: 'Delivery',
  },
  {
    question: 'Can I schedule a gift for a specific date and time?',
    answer:
      'Yes. On the product page choose your delivery date and time window. For birthdays and anniversaries you can also set a Gift Reminder and we will nudge you a week ahead.',
    category: 'Orders',
  },
  {
    question: 'Can I hide the price from the person receiving the gift?',
    answer: 'Always. Tick "Hide price from recipient" at checkout and the invoice is left out of the parcel.',
    category: 'Orders',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'UPI, credit and debit cards, net banking and wallets. Cash on delivery is available in most serviceable PIN codes.',
    category: 'Payments',
  },
  {
    question: 'Can I cancel an order?',
    answer:
      'You can cancel free of charge until the seller marks it ready for pickup. After that, please reach out to support and we will help you sort it out.',
    category: 'Orders',
  },
  {
    question: 'How do I sell on Upahaar?',
    answer:
      'Create a seller account, add your store details, the PIN codes you serve and your delivery radius, then upload your KYC. Most stores are approved within two working days.',
    category: 'Sellers',
  },
  {
    question: 'How is the delivery fee calculated?',
    answer:
      'Express (60 minutes) is ₹99, Priority (3 hours) is ₹49 and Standard (tomorrow onwards) is free. Some PIN codes have their own rates, which are always shown before you pay.',
    category: 'Payments',
  },
].map((f, i) => ({ ...f, displayOrder: i, isActive: true }));

export const POSTS = [
  {
    title: '12 Last-Minute Birthday Gifts That Arrive in Under an Hour',
    slug: '12-last-minute-birthday-gifts',
    kind: 'GIFT_GUIDE',
    excerpt: 'Forgot until this morning? These land at their door before the candles are lit.',
    coverImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
    tags: ['birthday', 'express', 'last-minute'],
    readMinutes: 4,
    body:
      "We have all done it — the reminder pops up and the day is already half gone. The good news is that a thoughtful gift does not need a week of planning, it needs a seller down the road.\n\nEverything in this guide is stocked by sellers who deliver within the hour in most metro PIN codes. Enter your code on the homepage and the list rearranges itself around you.",
  },
  {
    title: 'The Art of Corporate Gifting in India',
    slug: 'art-of-corporate-gifting-india',
    kind: 'GIFT_GUIDE',
    excerpt: 'Diwali hampers that do not end up in a drawer. A practical guide for teams of 10 to 1,000.',
    coverImage: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=1200&q=80',
    tags: ['corporate', 'diwali', 'bulk'],
    readMinutes: 6,
    body:
      'Corporate gifting fails for one reason: it feels procured rather than chosen. The fix is not a bigger budget — it is a smaller, better-considered box.\n\nStart with something edible and regional, add one object that survives the season, and always include a card that names the person rather than the department.',
  },
  {
    title: 'How We Deliver a Cake in 47 Minutes',
    slug: 'how-we-deliver-a-cake-in-47-minutes',
    kind: 'BLOG',
    excerpt: 'A look inside the routing, prep-time maths and rider network behind the 60-minute promise.',
    coverImage: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=1200&q=80',
    tags: ['engineering', 'delivery'],
    readMinutes: 5,
    body:
      'Every product on Upahaar carries a preparation time set by the person who actually makes it. We add the seller dispatch buffer, then the real travel time between their kitchen and your PIN code.\n\nOnly if that total lands under sixty minutes do you see the 60-minute badge. It is a promise, so we would rather show you a three-hour gift that arrives than a sixty-minute one that does not.',
  },
  {
    title: "A Gift Guide for Mothers Who Say 'Don't Get Me Anything'",
    slug: 'gift-guide-for-mothers',
    kind: 'GIFT_GUIDE',
    excerpt: 'She means it. Get her something anyway — here is how to get it right.',
    coverImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80',
    tags: ['mothers-day', 'personalised'],
    readMinutes: 4,
    body:
      'The trick with mothers is specificity. A generic bouquet says you remembered the date; a photo-printed frame of a day she loved says you remembered her.\n\nOur personalised category lets you add names, dates and photographs to almost anything — most of it still arrives the next morning.',
  },
].map((p) => ({ ...p, isPublished: true, author: 'Team Upahaar', publishedAt: new Date() }));
