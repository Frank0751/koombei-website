document.addEventListener('DOMContentLoaded', () => {

  // Mobile nav toggle
  // The hamburger is now the only navigation at every width, so it has to
  // behave like a real menu: announce its state, close on Escape, and close
  // when a click lands outside it.
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    if (!links.id) links.id = 'kbNavPanel';
    toggle.setAttribute('aria-controls', links.id);
    toggle.setAttribute('aria-expanded', 'false');

    const setOpen = (open) => {
      links.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      setOpen(!links.classList.contains('open'));
    });

    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => setOpen(false));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && links.classList.contains('open')) {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', (e) => {
      if (!links.classList.contains('open')) return;
      if (links.contains(e.target) || toggle.contains(e.target)) return;
      setOpen(false);
    });
  }

  // Active nav link
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href').split('/').pop();
    if (href === path) a.classList.add('active');
  });

  // Fade-in on scroll. Reveal on entry (threshold 0), not at a visibility
  // ratio: a ratio threshold can never be met by anything taller than
  // viewport / ratio. The portfolio grid is 9,554px on a 375x812 phone, so
  // at 0.1 it could never be 10% visible, which can leave the whole grid at
  // opacity 0. The -40px margin keeps normal-sized cards revealing at about
  // the same point as before.
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

});
