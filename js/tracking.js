/* Kampfsportakademie Chemnitz — Einwilligung, Meta-Pixel, Anzeigen-Herkunft
   Der Pixel lädt erst nach „Akzeptieren“. Ohne Entscheidung oder bei „Nur notwendige“
   wird keine Verbindung zu Meta aufgebaut. */
(function(){
  const PIXEL_ID = '145826282717086';
  const KEY      = 'kac_consent';            // 'granted' | 'denied' (nur die Entscheidung, sonst nichts)
  const LEAD     = 'kac_lead';               // Merker Formular → Danke-Seite (nur mit Einwilligung)
  const PARAMS   = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid'];

  const get = (s, k) => { try { return s.getItem(k); } catch(e){ return null; } };
  const set = (s, k, v) => { try { v === null ? s.removeItem(k) : s.setItem(k, v); } catch(e){} };
  const consent = () => get(localStorage, KEY);

  /* ---------- Meta-Pixel ---------- */
  let loaded = false;
  const loadPixel = () => {
    if(loaded) return; loaded = true;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', PIXEL_ID);
    fbq('track', 'PageView');

    // Danke-Seite: Lead nur nach echter Formular-Einsendung, genau einmal (Reload zählt nicht)
    const lead = get(sessionStorage, LEAD);
    if(lead && document.body.hasAttribute('data-lead-page')){
      set(sessionStorage, LEAD, null);
      let d = {}; try { d = JSON.parse(lead); } catch(e){}
      fbq('track', 'Lead', {content_name: d.typ || 'Probetraining', content_category: d.standort || ''}, {eventID: d.id});
    }
  };

  /* ---------- Banner ---------- */
  const css = `
.cc{position:fixed;left:16px;right:16px;bottom:max(16px,env(safe-area-inset-bottom));z-index:9999;max-width:560px;margin:0 auto;
  background:#fff;color:#050234;border-radius:22px;box-shadow:0 18px 50px rgba(5,2,52,.28);padding:20px 20px 18px;
  font-family:'SK Modernist',system-ui,sans-serif;font-size:15px;line-height:1.45}
.cc[hidden]{display:none}
.cc h2{font-size:18px;margin:0 0 6px;line-height:1.2;color:#050234}
.cc p{margin:0 0 14px}
.cc a{color:#050234;text-decoration:underline}
.cc__btns{display:flex;gap:10px;flex-wrap:wrap}
.cc__btns button{flex:1 1 160px;min-height:48px;border-radius:999px;border:2px solid #df0226;font:700 15px/1.2 'SK Modernist',system-ui,sans-serif;cursor:pointer}
.cc__yes{background:#df0226;color:#fff}
.cc__no{background:#fff;color:#df0226}
.cc__btns button:focus-visible{outline:3px solid #050234;outline-offset:2px}`;

  const banner = () => {
    let el = document.getElementById('cc');
    if(el) return el;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    el = document.createElement('div');
    el.id = 'cc'; el.className = 'cc'; el.hidden = true;
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-live', 'polite'); el.setAttribute('aria-label', 'Cookie-Einstellungen');
    el.innerHTML = '<h2>Cookies &amp; Werbung</h2>'
      + '<p>Mit Deiner Zustimmung nutzen wir das Meta-Pixel, um zu messen, wie gut unsere Anzeigen auf Facebook und Instagram funktionieren. '
      + 'Du kannst Deine Wahl jederzeit unter „Cookie-Einstellungen“ ändern. Mehr in der <a href="datenschutz.html">Datenschutzerklärung</a>.</p>'
      + '<div class="cc__btns"><button type="button" class="cc__no" data-cc="denied">Nur notwendige</button>'
      + '<button type="button" class="cc__yes" data-cc="granted">Akzeptieren</button></div>';
    el.querySelectorAll('[data-cc]').forEach(b => b.addEventListener('click', () => {
      const v = b.dataset.cc, before = consent();
      set(localStorage, KEY, v);
      el.hidden = true;
      if(v === 'granted') loadPixel();
      else if(before === 'granted') location.reload();   // Widerruf: Pixel aus der laufenden Seite entfernen
    }));
    document.body.appendChild(el);
    return el;
  };
  const open = () => { banner().hidden = false; };

  /* ---------- Anzeigen-Herkunft: UTM/fbclid aus der Adresse an interne Links und ins Formular ---------- */
  const q = new URLSearchParams(location.search);
  const carry = PARAMS.filter(p => q.get(p));
  if(carry.length){
    document.querySelectorAll('a[href]').forEach(a => {
      const h = a.getAttribute('href');
      if(!/^(index|kinder|anfrage)\.html/.test(h) && !/^\/(kinder|anfrage)?(\?|#|$)/.test(h)) return;
      const u = new URL(h, location.href);
      carry.forEach(p => { if(!u.searchParams.has(p)) u.searchParams.set(p, q.get(p)); });
      a.setAttribute('href', u.pathname.replace(/^\//, '') + u.search + u.hash);
    });
  }
  PARAMS.forEach(p => { const f = document.querySelector('form input[name="'+p+'"]'); if(f && q.get(p)) f.value = q.get(p); });

  /* ---------- Formular: Merker für die Danke-Seite ---------- */
  const form = document.querySelector('form[name="probetraining"]');
  if(form) form.addEventListener('submit', e => {
    if(e.defaultPrevented || consent() !== 'granted') return;
    const val = n => (form.querySelector('[name="'+n+'"]') || {}).value || '';
    set(sessionStorage, LEAD, JSON.stringify({
      id: 'lead-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      typ: val('sportart') === 'Kinderunterricht' ? 'Probetraining Kinder' : 'Probetraining Erwachsene',
      standort: val('standort')
    }));
  });

  /* ---------- Start ---------- */
  document.querySelectorAll('[data-cc-open]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); open(); }));
  const c = consent();
  if(c === 'granted') loadPixel();
  else if(c !== 'denied') open();
})();
