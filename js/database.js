const DB = {
  KEYS: {
    PRODUCTS: 'store_products_v1',
    CATEGORIES: 'store_categories_v1',
    SETTINGS: 'store_settings_v1',
    CART: 'store_cart_v1',
    ORDERS: 'store_orders_v1',
    USERS: 'store_users_v1',
    OTP: 'store_otp_v1'
  },

  generateId(prefix = 'id') {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  },

  makeProductImage(name, color1, color2) {
    const shortName = name.length > 16 ? name.substring(0, 16) + '…' : name;
    const initial = (name || '?').trim().charAt(0);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${color1}"/><stop offset="100%" stop-color="${color2}"/></linearGradient></defs>
      <rect width="400" height="400" fill="url(#g)"/>
      <circle cx="200" cy="155" r="65" fill="rgba(255,255,255,0.15)"/>
      <text x="200" y="185" text-anchor="middle" font-family="Arial,sans-serif" font-size="78" font-weight="bold" fill="white">${initial}</text>
      <text x="200" y="325" text-anchor="middle" font-family="Arial,sans-serif" font-size="26" font-weight="600" fill="white">${shortName}</text>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  },

  init() {
    if (!localStorage.getItem(this.KEYS.CATEGORIES)) this.saveCategories(this.seedCategories());
    if (!localStorage.getItem(this.KEYS.PRODUCTS)) this.saveProducts(this.seedProducts());
    if (!localStorage.getItem(this.KEYS.SETTINGS)) this.saveSettings(this.seedSettings());
  },

  getProducts() { try { return JSON.parse(localStorage.getItem(this.KEYS.PRODUCTS)) || []; } catch { return []; } },
  getProduct(id) { return this.getProducts().find(p => p.id === id) || null; },
  saveProducts(products) { localStorage.setItem(this.KEYS.PRODUCTS, JSON.stringify(products)); },
  addProduct(product) { const p = this.getProducts(); product.id = product.id || this.generateId('p'); product.createdAt = product.createdAt || Date.now(); p.unshift(product); this.saveProducts(p); return product; },
  updateProduct(id, updates) { const p = this.getProducts(); const i = p.findIndex(x => x.id === id); if (i === -1) return null; p[i] = { ...p[i], ...updates, id }; this.saveProducts(p); return p[i]; },
  deleteProduct(id) { this.saveProducts(this.getProducts().filter(p => p.id !== id)); },

  getCategories() { try { return JSON.parse(localStorage.getItem(this.KEYS.CATEGORIES)) || []; } catch { return []; } },
  saveCategories(c) { localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(c)); },

  getSettings() { try { return JSON.parse(localStorage.getItem(this.KEYS.SETTINGS)) || this.seedSettings(); } catch { return this.seedSettings(); } },
  saveSettings(s) { localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(s)); },

  getCart() { try { return JSON.parse(localStorage.getItem(this.KEYS.CART)) || []; } catch { return []; } },
  saveCart(cart) { localStorage.setItem(this.KEYS.CART, JSON.stringify(cart)); window.dispatchEvent(new CustomEvent('cart:updated', { detail: cart })); },
  getCartCount() { return this.getCart().reduce((sum, item) => sum + item.qty, 0); },
  addToCart(productId, qty = 1) {
    const product = this.getProduct(productId);
    if (!product || product.stock <= 0) return { ok: false, message: 'المنتج غير متوفر' };
    const cart = this.getCart();
    const existing = cart.find(i => i.productId === productId);
    if (existing) {
      if (existing.qty + qty > product.stock) return { ok: false, message: 'الكمية المتوفرة: ' + product.stock };
      existing.qty += qty;
    } else {
      if (qty > product.stock) return { ok: false, message: 'الكمية المتوفرة: ' + product.stock };
      cart.push({ productId, qty });
    }
    this.saveCart(cart);
    return { ok: true, message: 'تمت الإضافة للسلة ✓' };
  },
  updateCartQty(id, qty) { const cart = this.getCart(); const item = cart.find(i => i.productId === id); if (!item) return; if (qty <= 0) cart.splice(cart.indexOf(item), 1); else item.qty = qty; this.saveCart(cart); },
  removeFromCart(id) { this.saveCart(this.getCart().filter(i => i.productId !== id)); },

  getUsers() { try { return JSON.parse(localStorage.getItem(this.KEYS.USERS)) || []; } catch { return []; } },
  saveUsers(u) { localStorage.setItem(this.KEYS.USERS, JSON.stringify(u)); },
  addUser(user) { const u = this.getUsers(); user.id = user.id || this.generateId('u'); user.createdAt = user.createdAt || Date.now(); u.push(user); this.saveUsers(u); return user; },
  deleteUser(id) { this.saveUsers(this.getUsers().filter(u => u.id !== id)); },
  findUserByEmail(email) { return this.getUsers().find(u => u.email && u.email.toLowerCase() === email.toLowerCase()); },

  saveOTP(email, code) { const otps = JSON.parse(localStorage.getItem(this.KEYS.OTP) || '{}'); otps[email] = { code, expires: Date.now() + 600000 }; localStorage.setItem(this.KEYS.OTP, JSON.stringify(otps)); },
  verifyOTP(email, code) { const otps = JSON.parse(localStorage.getItem(this.KEYS.OTP) || '{}'); const rec = otps[email]; if (!rec) return { ok: false, msg: 'لم يتم إرسال كود' }; if (Date.now() > rec.expires) return { ok: false, msg: 'انتهت الصلاحية' }; if (rec.code !== code) return { ok: false, msg: 'كود خاطئ' }; delete otps[email]; localStorage.setItem(this.KEYS.OTP, JSON.stringify(otps)); return { ok: true }; },

  getEmailConfig() { return JSON.parse(localStorage.getItem('emailjs_config_v1') || '{}'); },
  saveEmailConfig(c) { localStorage.setItem('emailjs_config_v1', JSON.stringify(c)); },
  getWhatsAppConfig() { return JSON.parse(localStorage.getItem('whatsapp_config_v1') || '{}'); },
  saveWhatsAppConfig(c) { localStorage.setItem('whatsapp_config_v1', JSON.stringify(c)); },
  getTelegramConfig() { return JSON.parse(localStorage.getItem('telegram_config_v1') || '{}'); },
  saveTelegramConfig(c) { localStorage.setItem('telegram_config_v1', JSON.stringify(c)); },

  seedCategories() {
    const icons = {
      electronics: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="6" y="2" width="12" height="20" rx="3"/><line x1="11" y1="18" x2="13" y2="18"/></svg>`,
      fashion: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 3L4 6v5h3v10h10V11h3V6l-4-3-2 2h-4L8 3z"/></svg>`,
      home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>`,
      beauty: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="6" y="9" width="12" height="12" rx="2"/><path d="M9 9V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3"/></svg>`,
      sports: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="3" y1="12" x2="21" y2="12"/><rect x="1" y="9" width="3" height="6" rx="1"/><rect x="20" y="9" width="3" height="6" rx="1"/></svg>`,
      books: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h10a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z"/><path d="M4 4v14"/></svg>`,
      watches: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="6" y="6" width="12" height="12" rx="6"/><path d="M9 2h6l-1 4"/><path d="M9 22h6l-1-4"/></svg>`,
      toys: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 10h12a4 4 0 0 1 4 4v2a4 4 0 0 1-7.2 2.4L14 17h-4l-.8 1.4A4 4 0 0 1 2 16v-2a4 4 0 0 1 4-4z"/></svg>`
    };
    return [
      { id: 'all', name: 'الكل', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>`, order: 0 },
      { id: 'electronics', name: 'إلكترونيات', icon: icons.electronics, order: 1 },
      { id: 'fashion', name: 'أزياء', icon: icons.fashion, order: 2 },
      { id: 'home', name: 'منزل ومطبخ', icon: icons.home, order: 3 },
      { id: 'beauty', name: 'عطور وجمال', icon: icons.beauty, order: 4 },
      { id: 'sports', name: 'رياضة', icon: icons.sports, order: 5 },
      { id: 'books', name: 'كتب', icon: icons.books, order: 6 },
      { id: 'watches', name: 'ساعات', icon: icons.watches, order: 7 },
      { id: 'toys', name: 'ألعاب', icon: icons.toys, order: 8 }
    ];
  },

  seedProducts() {
    const make = this.makeProductImage.bind(this);
    const products = [
      { name: 'سماعات لاسلكية فاخرة', category: 'electronics', price: 349, oldPrice: 499, rating: 4.8, stock: 25, status: 'offer', description: 'سماعات بلوتوث 5.3 بجودة صوت استوديو، عزل ضوضاء نشط، بطارية تدوم 30 ساعة.', c: ['#1e3a8a','#3b82f6'] },
      { name: 'ساعة ذكية برو', category: 'electronics', price: 899, oldPrice: 1200, rating: 4.6, stock: 12, status: 'offer', description: 'ساعة ذكية شاشة AMOLED، تتبع اللياقة والنوم، مقاومة للماء، بطارية 14 يوم.', c: ['#0f172a','#475569'] },
      { name: 'قميص قطني كلاسيكي', category: 'fashion', price: 189, oldPrice: null, rating: 4.5, stock: 40, status: 'normal', description: 'قميص قطني 100% بقصة عصرية مريحة، متوفر بعدة مقاسات.', c: ['#0891b2','#06b6d4'] },
      { name: 'حقيبة جلد أنيقة', category: 'fashion', price: 449, oldPrice: 599, rating: 4.7, stock: 18, status: 'offer', description: 'حقيبة جلد طبيعي بتصميم عصري، مساحة واسعة، أحزمة قابلة للتعديل.', c: ['#78350f','#a16207'] },
      { name: 'طقم فناجين قهوة', category: 'home', price: 129, oldPrice: null, rating: 4.4, stock: 30, status: 'new', description: 'طقم 6 فناجين بورسلان فاخر مع صحون، تصميم أنيق يناسب الضيافة الراقية.', c: ['#7c2d12','#c2410c'] },
      { name: 'عطر شرقي فاخر', category: 'beauty', price: 299, oldPrice: 399, rating: 4.9, stock: 22, status: 'offer', description: 'عطر شرقي بتركيبة عود ومسك، ثبات يدوم طويلاً، عبوة 100 مل.', c: ['#581c87','#9333ea'] },
      { name: 'دمبل قابل للتعديل', category: 'sports', price: 249, oldPrice: null, rating: 4.3, stock: 15, status: 'normal', description: 'دمبل قابل للتعديل من 2 إلى 20 كجم، مقبض مانع للانزلاق.', c: ['#064e3b','#10b981'] },
      { name: 'كتاب فن اللامبالاة', category: 'books', price: 79, oldPrice: null, rating: 4.6, stock: 50, status: 'normal', description: 'كتاب تطويري شهير للكاتب مارك مانسون.', c: ['#1e40af','#3b82f6'] },
      { name: 'ساعة كلاسيك جلد', category: 'watches', price: 599, oldPrice: 750, rating: 4.8, stock: 8, status: 'offer', description: 'ساعة كلاسيكية بسوار جلد طبيعي، حركة كوارتز يابانية.', c: ['#451a03','#92400e'] },
      { name: 'لعبة مكعبات تعليمية', category: 'toys', price: 119, oldPrice: null, rating: 4.5, stock: 35, status: 'new', description: 'لعبة مكعبات خشبية تنمي الذكاء والإبداع للأطفال.', c: ['#b91c1c','#ef4444'] }
    ];
    return products.map((p, i) => ({
      id: 'p_' + (i + 1), name: p.name, description: p.description, category: p.category, price: p.price, oldPrice: p.oldPrice, currency: 'ر.س', rating: p.rating, stock: p.stock, status: p.status, images: [make(p.name, p.c[0], p.c[1])], video: null, createdAt: Date.now() - i * 86400000
    }));
  },

  seedSettings() {
    return { storeName: 'متجر النخبة', storeTag: 'تسوق فاخر', logo: null, currency: 'ر.س', contact: { email: 'info@example.com', phone: '+966500000000', facebook: '#', telegram: '#', whatsapp: '#', instagram: '', twitter: '' }, design: { bgStart: '#0b0d1a', bgMid: '#151932', bgEnd: '#1a1035', cardStart: '#1f2141', cardEnd: '#16172d', primary: '#d4af37', secondary: '#f4d47c', backgroundImage: null, bannerImage: null } };
  }
};
DB.init();
