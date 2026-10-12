/* Kampfsportakademie Chemnitz — interactions & motion
   Dezent, kein Leuchten. Gated hinter .js + prefers-reduced-motion. */
document.documentElement.classList.add('js');

/* ---------- header: kleiner Schatten/Position beim Scrollen ---------- */
(function(){
  const header = document.getElementById('header');
  if(!header) return;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 30);
  onScroll();
  window.addEventListener('scroll', onScroll, {passive:true});
})();

/* ---------- mobiles Menü ---------- */
(function(){
  const burger = document.getElementById('burger');
  const menu   = document.getElementById('mobileMenu');
  const scrim  = document.getElementById('scrim');
  if(!burger || !menu) return;
  const close = () => { menu.classList.remove('open'); scrim && scrim.classList.remove('show'); document.body.classList.remove('menu-open'); };
  const toggle = () => {
    const open = menu.classList.toggle('open');
    scrim && scrim.classList.toggle('show', open);
    document.body.classList.toggle('menu-open', open);
  };
  burger.addEventListener('click', toggle);
  scrim && scrim.addEventListener('click', close);
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
})();

/* ---------- Scroll-Reveal (gestaffelt, eine Kurve) ---------- */
(function(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Kinder in Gruppen automatisch staffeln
  [['.bento','.bento__item'],['.grid-3','.ocard'],['.grid-3','.ph'],['.cols-3','.why'],['.tst-grid','.tst'],['.steps','.step'],['.doubts','li'],['.stack','.infobox'],['.age-groups','.age-card'],['.creds','li'],['.loc-list','li']]
    .forEach(([par, child]) => {
      document.querySelectorAll(par).forEach(p =>
        p.querySelectorAll(':scope > '+child).forEach((el,i) => {
          el.classList.add('reveal');
          el.style.setProperty('--d', (i*0.1).toFixed(2)+'s');
        }));
    });

  const io = new IntersectionObserver(es => es.forEach(e => {
    if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
  }), {threshold:.15, rootMargin:'0px 0px -10% 0px'});
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
})();

/* ---------- weiches Scrollen für Anker mit Header-Offset ---------- */
(function(){
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if(id === '#' || id.length < 2) return;
      const t = document.querySelector(id);
      if(!t) return;
      e.preventDefault();
      const y = t.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({top:y, behavior:'smooth'});
    });
  });
})();

/* ---------- Rundgang-Video: Fassade, Player wird erst beim Klick geladen (Datenschutz) ---------- */
(function(){
  const box = document.getElementById('rundgang');
  if(!box) return;
  const poster = box.querySelector('.hero-video__poster');
  poster.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = box.dataset.video;
    f.title = 'Rundgang durch die Kampfsportakademie Chemnitz';
    f.setAttribute('allow', 'accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;fullscreen;');
    f.setAttribute('allowfullscreen', 'true');
    box.replaceChild(f, poster);
  });
})();

/* ---------- Standortkarte: Liste und Pins gegenseitig hervorheben ---------- */
(function(){
  document.querySelectorAll('.loc-grid').forEach(grid => {
    const set = (loc, on) => grid.querySelectorAll('[data-loc="'+loc+'"]').forEach(el => el.classList.toggle('is-hot', on));
    grid.querySelectorAll('[data-loc]').forEach(el => {
      el.addEventListener('mouseenter', () => set(el.dataset.loc, true));
      el.addEventListener('mouseleave', () => set(el.dataset.loc, false));
    });
  });
})();

/* ---------- CTA-Hintergrundvideos ----------
   Laden erst kurz bevor die Sektion ins Bild kommt, laufen nur solange sichtbar.
   Hochformat-Sektion (Handy) → eigenes 4:5-Video. Reduzierte Bewegung / Datensparmodus → nur Standbild. */
(function(){
  const secs = [...document.querySelectorAll('.cta-video, .hero--video')];
  if(!secs.length) return;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches ||
               (navigator.connection && navigator.connection.saveData);
  secs.forEach(sec => {
    const v = sec.querySelector('video');
    const btn = sec.querySelector('.cta-video__toggle');
    if(!v) return;
    const portrait = sec.clientWidth / Math.max(sec.clientHeight,1) < 1.15;
    if(portrait && v.dataset.posterMobile) v.poster = v.dataset.posterMobile;
    if(calm){ sec.classList.add('in-view'); return; }

    let loaded = false, visible = false, userPaused = false;
    const load = () => {
      if(loaded) return; loaded = true;
      v.preload = 'auto';
      v.src = (portrait && sec.dataset.videoMobile) ? sec.dataset.videoMobile : sec.dataset.video;
      sec.classList.add('has-video');
    };
    const sync = () => {
      if(visible && loaded && !userPaused && !document.hidden){ const p = v.play(); if(p) p.catch(()=>{}); }
      else v.pause();
    };
    v.addEventListener('error', () => sec.classList.remove('has-video', 'is-playing'));
    v.addEventListener('playing', () => sec.classList.add('is-playing'));
    new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting){ load(); sync(); } }),
      {rootMargin:'500px 0px'}).observe(sec);
    new IntersectionObserver(es => es.forEach(e => {
      visible = e.isIntersecting;
      if(visible) sec.classList.add('in-view');
      sync();
    }), {threshold:0.05}).observe(sec);
    document.addEventListener('visibilitychange', sync);
    if(btn) btn.addEventListener('click', () => {
      userPaused = !userPaused;
      btn.setAttribute('aria-pressed', String(userPaused));
      btn.setAttribute('aria-label', userPaused ? 'Hintergrundvideo abspielen' : 'Hintergrundvideo pausieren');
      sync();
    });
  });
})();

/* ---------- Bildreihen ausblenden, solange keines ihrer Fotos existiert ---------- */
(function(){
  document.querySelectorAll('.gallery-row').forEach(row => {
    const imgs=[...row.querySelectorAll('img')];
    const check=()=>{ if(imgs.every(i=>i.complete && i.naturalWidth===0)) row.classList.add('is-empty'); };
    imgs.forEach(i=>{ i.addEventListener('error',check); i.addEventListener('load',check); });
    check();
  });
})();
