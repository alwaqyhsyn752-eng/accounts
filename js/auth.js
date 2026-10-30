/* =========================================================
   نظام حسابات العملاء + التحقق OTP (بريد / واتساب / تلغرام)
   ========================================================= */

const AuthApp = {
  state: { mode: 'login', pendingEmail: '', pendingCode: '', pendingPhone: '', user: null },

  init() {
    this.loadConfig();
    const saved = localStorage.getItem('auth_current_user');
    if (saved) { try { this.state.user = JSON.parse(saved); } catch {} }
    this.render();
  },

  loadConfig() {
    this.emailCfg = DB.getEmailConfig();
    this.tgCfg = DB.getTelegramConfig();
    this.waCfg = DB.getWhatsAppConfig();
  },

  getEl() { return document.getElementById('authApp'); },
  toast(msg, type) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg; el.className = 'toast show ' + (type || '');
    clearTimeout(this._tt); this._tt = setTimeout(() => el.classList.remove('show'), 2800);
  },

  render() {
    if (this.state.user) return this.renderProfile();
    if (this.state.mode === 'otp') return this.renderOTP();
    if (this.state.mode === 'register') return this.renderRegister();
    return this.renderLogin();
  },

  renderLogin() {
    this.getEl().innerHTML = `
      <div class="admin-login-card">
        <div class="admin-login-logo">E</div>
        <h1 class="admin-login-title">تسجيل الدخول</h1>
        <p class="admin-login-subtitle">مرحباً بك في متجر النخبة</p>
        <div class="form-group"><label class="form-label">البريد الإلكتروني</label>
          <input type="email" id="loginEmail" class="form-input" placeholder="you@example.com"></div>
        <div class="form-group"><label class="form-label">كلمة المرور</label>
          <input type="password" id="loginPass" class="form-input" placeholder="••••••"></div>
        <button class="btn-primary btn-full" id="doLogin">دخول</button>
        <p style="text-align:center;margin-top:14px;font-size:13px;">
          <a href="#" id="toRegister" style="color:var(--gold);">إنشاء حساب جديد</a> ·
          <a href="index.html" style="color:var(--text-muted);">المتجر</a>
        </p>
      </div>`;
    document.getElementById('doLogin').onclick = () => this.handleLogin();
    document.getElementById('toRegister').onclick = (e) => { e.preventDefault(); this.state.mode='register'; this.render(); };
  },

  renderRegister() {
    this.getEl().innerHTML = `
      <div class="admin-login-card">
        <div class="admin-login-logo">+</div>
        <h1 class="admin-login-title">حساب جديد</h1>
        <p class="admin-login-subtitle">أدخل بياناتك ثم تحقق من بريدك أو هاتفك</p>
        <div class="form-group"><label class="form-label">الاسم الكامل</label>
          <input type="text" id="regName" class="form-input" placeholder="محمد أحمد"></div>
        <div class="form-group"><label class="form-label">البريد الإلكتروني</label>
          <input type="email" id="regEmail" class="form-input" placeholder="you@example.com"></div>
        <div class="form-group"><label class="form-label">رقم الهاتف (للواتساب)</label>
          <input type="tel" id="regPhone" class="form-input" placeholder="+9665..."></div>
        <div class="form-group"><label class="form-label">كلمة المرور</label>
          <input type="password" id="regPass" class="form-input" placeholder="6 أحرف على الأقل"></div>
        <div class="form-group"><label class="form-label">وسيلة التحقق</label>
          <select id="regMethod" class="form-select">
            <option value="email">البريد الإلكتروني</option>
            <option value="whatsapp">واتساب (رقم الهاتف)</option>
            <option value="telegram">تلغرام (إن كان مضافاً)</option>
          </select></div>
        <button class="btn-primary btn-full" id="doRegister">إنشاء وإرسال الكود</button>
        <p style="text-align:center;margin-top:14px;font-size:13px;">
          <a href="#" id="toLogin" style="color:var(--text-muted);">← لدي حساب بالفعل</a>
        </p>
      </div>`;
    document.getElementById('doRegister').onclick = () => this.handleRegister();
    document.getElementById('toLogin').onclick = (e) => { e.preventDefault(); this.state.mode='login'; this.render(); };
  },

  renderOTP() {
    this.getEl().innerHTML = `
      <div class="admin-login-card">
        <div class="admin-login-logo">✓</div>
        <h1 class="admin-login-title">التحقق</h1>
        <p class="admin-login-subtitle">أدخل الكود المرسل إلى <b>${this.state.pendingEmail || this.state.pendingPhone}</b></p>
        <div class="form-group"><label class="form-label">كود التحقق (6 أرقام)</label>
          <input type="text" id="otpCode" class="form-input" style="text-align:center;font-size:22px;letter-spacing:8px;" maxlength="6" placeholder="——————"></div>
        <button class="btn-primary btn-full" id="doVerify">تحقق</button>
        <button class="btn-secondary btn-full" id="resendOTP" style="margin-top:10px;">إعادة إرسال</button>
      </div>`;
    document.getElementById('doVerify').onclick = () => this.handleVerify();
    document.getElementById('resendOTP').onclick = () => this.handleResend();
  },

  renderProfile() {
    const u = this.state.user;
    this.getEl().innerHTML = `
      <div class="admin-login-card">
        <div class="admin-login-logo" style="background:linear-gradient(135deg,var(--gold),#a8842a);">${(u.name||'U')[0].toUpperCase()}</div>
        <h1 class="admin-login-title">${u.name}</h1>
        <p class="admin-login-subtitle">${u.email}</p>
        <div class="admin-notice" style="background:rgba(39,174,96,0.1);border-color:rgba(39,174,96,0.4);color:#2ecc71;">✅ حساب موثّق</div>
        <div class="btn-row">
          <a href="index.html" class="btn-primary" style="flex:1;text-align:center;line-height:44px;text-decoration:none;">تسوق الآن</a>
          <button class="btn-danger" id="logoutBtn">خروج</button>
        </div>
      </div>`;
    document.getElementById('logoutBtn').onclick = () => {
      localStorage.removeItem('auth_current_user');
      this.state.user = null; this.state.mode = 'login'; this.render();
    };
  },

  handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value;
    if (!email || !pass) return this.toast('املأ كل الحقول', 'error');
    const user = DB.findUserByEmail(email);
    if (!user) return this.toast('البريد غير مسجل', 'error');
    if (user.passwordHash !== this.hash(pass)) return this.toast('كلمة المرور خاطئة', 'error');
    if (!user.verified) return this.toast('الحساب غير موثق', 'error');
    this.state.user = user;
    localStorage.setItem('auth_current_user', JSON.stringify(user));
    this.toast('مرحباً بك ' + user.name, 'success');
    this.render();
  },

  async handleRegister() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const pass = document.getElementById('regPass').value;
    const method = document.getElementById('regMethod').value;
    if (!name || !email || !pass) return this.toast('الاسم والبريد وكلمة المرور مطلوبة', 'error');
    if (pass.length < 6) return this.toast('كلمة المرور 6 أحرف على الأقل', 'error');
    if (DB.findUserByEmail(email)) return this.toast('البريد مسجل مسبقاً', 'error');
    if (method === 'whatsapp' && !phone) return this.toast('أدخل رقم الهاتف للواتساب', 'error');

    this.state.pendingUser = { name, email, phone, passwordHash: this.hash(pass), verified: false, role: 'customer' };
    this.state.pendingEmail = email;
    this.state.pendingPhone = phone;
    this.state.pendingMethod = method;

    await this.sendOTP(email, phone, method);
  },

  async sendOTP(email, phone, method) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    DB.saveOTP(email, code, method);
    this.state.pendingCode = code;

    if (method === 'email') {
      const cfg = this.emailCfg;
      if (!cfg.serviceId || !cfg.templateId || !cfg.publicKey) {
        alert(`⚠️ لم يتم إعداد EmailJS.\nالكود التجريبي: ${code}\n\nأعدده من لوحة الأدمن -> التكامل.`);
        this.state.mode = 'otp'; this.render(); return;
      }
      try {
        emailjs.init(cfg.publicKey);
        await emailjs.send(cfg.serviceId, cfg.templateId, { to_email: email, otp_code: code, subject: 'كود التحقق' });
        this.toast('تم إرسال الكود إلى بريدك ✓', 'success');
      } catch (e) { this.toast('فشل الإرسال، الكود التجريبي: ' + code, 'error'); }
    } 
    else if (method === 'whatsapp') {
      const cfg = this.waCfg;
      if (!cfg.apiKey || !cfg.instanceId) { // افترضنا استخدام WALoops أو مشابه
        alert(`⚠️ لم يتم إعداد واتساب.\nالكود التجريبي: ${code}\n\nأعدده من لوحة الأدمن -> التكامل.`);
        this.state.mode = 'otp'; this.render(); return;
      }
      try {
        // مثال باستخدام WALoops API (قد يختلف حسب المزود)
        const res = await fetch(`https://api.waloops.com/v1/${cfg.instanceId}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cfg.apiKey}` },
          body: JSON.stringify({ to: phone, message: `كود التحقق الخاص بك: ${code}` })
        });
        if (!res.ok) throw new Error();
        this.toast('تم إرسال الكود إلى واتساب ✓', 'success');
      } catch { this.toast('فشل الإرسال عبر واتساب، الكود: ' + code, 'error'); }
    } 
    else {
      const cfg = this.tgCfg;
      if (!cfg.botToken || !cfg.chatId) {
        alert(`⚠️ لم يتم إعداد تلغرام.\nالكود التجريبي: ${code}`);
        this.state.mode = 'otp'; this.render(); return;
      }
      try {
        await fetch(`https://api.telegram.org/bot${cfg.botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: cfg.chatId, text: `كود التحقق: ${code}` })
        });
        this.toast('تم إرسال الكود إلى تلغرام ✓', 'success');
      } catch { this.toast('فشل الإرسال عبر تلغرام', 'error'); }
    }
    this.state.mode = 'otp';
    this.render();
  },

  async handleResend() {
    await this.sendOTP(this.state.pendingEmail, this.state.pendingPhone, this.state.pendingMethod || 'email');
  },

  handleVerify() {
    const code = document.getElementById('otpCode').value.trim();
    const res = DB.verifyOTP(this.state.pendingEmail, code);
    if (!res.ok) return this.toast(res.msg, 'error');

    const user = this.state.pendingUser;
    user.verified = true;
    DB.addUser(user);
    this.state.user = user;
    localStorage.setItem('auth_current_user', JSON.stringify(user));
    this.toast('تم إنشاء الحساب بنجاح 🎉', 'success');
    this.render();
  },

  hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h) + str.charCodeAt(i);
    return 'h' + (h >>> 0).toString(36);
  }
};

document.addEventListener('DOMContentLoaded', () => AuthApp.init());
