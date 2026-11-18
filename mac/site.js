(() => {
  document.getElementById('year').textContent = new Date().getFullYear();

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const { gsap, ScrollTrigger, LocomotiveScroll } = window;

  // Wire between phone and Mac window (drawn on any layout change).
  const stage = document.getElementById('stage'), wire = document.getElementById('wirePath');
  const drawWire = () => {
    const s = stage.getBoundingClientRect(), p = document.getElementById('phone').getBoundingClientRect(), q = document.getElementById('qrwin').getBoundingClientRect();
    const x1 = p.right - s.left, y1 = p.top - s.top + p.height * .3, x2 = q.left - s.left, y2 = q.top - s.top + q.height * .32;
    const mx = (x1 + x2) / 2;
    wire.setAttribute('d', `M${x1} ${y1} C${mx} ${y1 - 80} ${mx} ${y2 + 80} ${x2} ${y2}`);
  };
  addEventListener('resize', drawWire);
  addEventListener('load', drawWire);
  drawWire();

  // FAQ: one open at a time, animated height.
  document.querySelectorAll('.faq details').forEach(d => {
    const sum = d.querySelector('summary'), ans = d.querySelector('.ans');
    sum.addEventListener('click', e => {
      if (reduce || !gsap) return;
      e.preventDefault();
      if (d.open) {
        gsap.to(ans, { height: 0, duration: .35, ease: 'power2.inOut', onComplete: () => { d.open = false; ans.style.height = ''; ScrollTrigger?.refresh(); } });
      } else {
        document.querySelectorAll('.faq details[open]').forEach(o => o !== d && o.querySelector('summary').click());
        d.open = true;
        gsap.fromTo(ans, { height: 0 }, { height: 'auto', duration: .45, ease: 'power3.out', onComplete: () => ScrollTrigger?.refresh() });
      }
    });
  });

  if (reduce || !gsap || !ScrollTrigger) return; // content is fully visible without motion
  gsap.registerPlugin(ScrollTrigger);

  // Smooth scroll (Locomotive v5, Lenis under the hood); ScrollTrigger reads native scroll so just keep it in sync.
  let loco = null;
  if (LocomotiveScroll) {
    loco = new LocomotiveScroll({ lenisOptions: { lerp: 0.1, smoothWheel: true } });
    loco.lenisInstance?.on('scroll', ScrollTrigger.update);
  }
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    loco ? loco.scrollTo(t, { offset: -90 }) : t.scrollIntoView({ behavior: 'smooth' });
    t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true });
  }));

  // Nav hides on scroll down, returns on scroll up.
  const nav = document.getElementById('nav');
  ScrollTrigger.create({ start: 120, end: 'max', onUpdate: s => nav.classList.toggle('hide', s.direction === 1) });

  // Hero: the Mac window tilts back and flattens as you scroll; cartridges fall into it.
  gsap.fromTo('#heroMac .screen', { rotateX: 16, scale: .9, y: 30 }, {
    rotateX: 0, scale: 1, y: 0, ease: 'none',
    scrollTrigger: { trigger: '#heroMac', start: 'top 95%', end: 'top 25%', scrub: true }
  });
  gsap.timeline({ scrollTrigger: { trigger: '.carts', start: 'top 60%', end: 'top -10%', scrub: true } })
    .to('.cart', { y: (i) => 170 + (i % 3) * 30, rotate: (i) => (i % 2 ? 10 : -10), scale: .55, stagger: .03, ease: 'power1.in', duration: 1 })
    .to('.cart', { opacity: 0, stagger: .03, duration: .3 }, .7);

  // Marquee speeds up with scroll velocity and flips with direction.
  const mq = gsap.to('#marquee', { xPercent: -50, repeat: -1, duration: 28, ease: 'none' });
  ScrollTrigger.create({
    onUpdate: s => {
      const v = gsap.utils.clamp(-6, 6, s.getVelocity() / 300);
      gsap.to(mq, { timeScale: (s.direction === 1 ? 1 : -1) * (1 + Math.abs(v)), duration: .25, overwrite: true });
    }
  });

  // Reveals.
  gsap.utils.toArray('[data-reveal]').forEach(el => gsap.from(el, {
    y: 48, opacity: 0, duration: .9, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 88%', once: true }
  }));

  // Horizontal tour on wide screens only; stacked on phones.
  gsap.matchMedia().add('(min-width: 900px)', () => {
    {
      const track = document.getElementById('tourTrack');
      const dist = () => track.scrollWidth - innerWidth;
      gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '#tour', start: 'top top', end: () => '+=' + dist(), pin: true, pinSpacing: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 }
      });
      gsap.utils.toArray('.panel figure img').forEach(img => gsap.fromTo(img, { scale: 1.12 }, {
        scale: 1, ease: 'none', scrollTrigger: { trigger: '#tour', start: 'top top', end: () => '+=' + dist(), scrub: true }
      }));
    }
  });

  // Controller stage: phone slides in from the left, window from the right.
  gsap.from('#phone', { x: -80, rotate: -8, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '#stage', start: 'top 80%', once: true } });
  gsap.from('#qrwin', { x: 80, rotate: 6, opacity: 0, duration: 1, delay: .1, ease: 'power3.out', scrollTrigger: { trigger: '#stage', start: 'top 80%', once: true }, onComplete: drawWire });
  gsap.from('.wire', { opacity: 0, duration: .6, delay: .9, scrollTrigger: { trigger: '#stage', start: 'top 80%', once: true } });

  // Bento cards: hard shadow pops in.
  gsap.utils.toArray('.card').forEach(c => gsap.from(c, { boxShadow: '0px 0px 0 #0E3B26', duration: .6, ease: 'back.out(3)', scrollTrigger: { trigger: c, start: 'top 85%', once: true } }));

  // Count-up stats.
  gsap.utils.toArray('[data-count]').forEach(el => {
    const n = +el.dataset.count, o = { v: n === 0 ? 99 : 0 };
    gsap.to(o, { v: n, duration: 1.4, ease: 'power2.out', onUpdate: () => el.textContent = Math.round(o.v), scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  // Final section: icon bobs on scroll.
  gsap.fromTo('.final .big-icon', { rotate: -12, y: 40 }, { rotate: 6, y: -20, ease: 'none', scrollTrigger: { trigger: '.final', start: 'top bottom', end: 'bottom top', scrub: true } });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
