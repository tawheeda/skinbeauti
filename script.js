// ---------------- Active nav link & footer year ----------------
(function(){
  const raw = location.pathname.split('/').pop();
  const path = raw && raw.length ? raw : 'index.html';

  document.querySelectorAll('nav a').forEach(a => {
    const href = a.getAttribute('href') || '';
    const file = href.includes('#') ? href.split('#')[0] : href;
    if ((!file && path === 'index.html') || file === path) {
      a.classList.add('active');
    }
  });

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();

// ---------------- Smooth scroll for in-page anchors -------------
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    // Skip if this link is a modal trigger or just "#"
    if (a.hasAttribute('data-modal-open') || a.getAttribute('href') === '#') return;

    const href = a.getAttribute('href');
    if (href.length > 1) {
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
});

// ---------------- Contact form handler (front-end only) --------
const form = document.getElementById('contactForm');
if (form) {
  const note = document.getElementById('formNote');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = (data.get('name')||'').trim();
    const email = (data.get('email')||'').trim();
    const message = (data.get('message')||'').trim();

    if (!name || !email || !message) {
      if (note) {
        note.textContent = 'Please complete the required fields.';
        note.style.color = '#b45309'; // amber-700
      }
      return;
    }

    if (note) {
      note.textContent = 'Thanks! Connect a form service to deliver emails to Info@skinbeauti.co.za.';
      note.style.color = '#047857'; // emerald-700
    }
    form.reset();
  });
}

// ---------------- Booking buttons → booking section ------------
// Works both on the same page (immediate prefill) and cross-page (via ?service=...).
document.querySelectorAll('[data-book]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const service = (btn.getAttribute('data-book') || '').trim();
    const target = document.querySelector('#booking');
    const message = document.getElementById('message');

    // If the booking form exists on this page, prefill immediately.
    if (service && message) {
      message.value = `I would like to book ${service}.`;
    }

    // If this button navigates to contact.html, ensure the URL has ?service=...
    const href = btn.getAttribute('href') || '';
    if (href && /contact\.html/i.test(href)) {
      // Use current page as base so it works on file:// and http(s):// and GH Pages subpaths
      const url = new URL(href, window.location.href);
      if (service) url.searchParams.set('service', service);
      url.hash = 'booking';
      // write full href (prevents file:///C:/ issue and wrong subpath on GH Pages)
      btn.setAttribute('href', url.href);
      // allow normal navigation
    } else {
      // Same page: smooth scroll to #booking if present
      if (target) target.scrollIntoView({ behavior: 'smooth' });
      // Prevent jump if the button has href="#"
      if (btn.getAttribute('href') === '#') e.preventDefault();
    }
  });
});

// ---------------- Prefill message from URL (?service=...) ------
// More robust for GH Pages: waits for DOM if needed and handles errors gracefully.
(function(){
  function prefillFromQuery(){
    try {
      const params = new URLSearchParams(window.location.search);
      const svc = params.get('service');
      if (!svc) return;

      const message = document.getElementById('message');
      if (message && !message.value.trim()) {
        message.value = `I would like to book ${svc}.`;
      }

      // Scroll to booking section if present
      const booking = document.getElementById('booking') || document.querySelector('#booking');
      if (booking) booking.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      console.warn('Prefill error:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', prefillFromQuery);
  } else {
    prefillFromQuery();
  }
})();

// ===================== Modals (Privacy / Terms) =====================
// HTML expects: links with [data-modal-open="privacy|terms"]
// and modals with ids: #modal-privacy, #modal-terms
(function(){
  const body = document.body;
  const openers = document.querySelectorAll('[data-modal-open]');
  let lastFocused = null;

  function getFocusable(container){
    return Array.from(container.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )).filter(el => !el.hasAttribute('inert') && !el.closest('[inert]'));
  }

  function openModal(id){
    const modal = document.getElementById('modal-' + id);
    if (!modal) return;

    lastFocused = document.activeElement;
    modal.classList.add('open');
    modal.removeAttribute('aria-hidden');
    body.classList.add('no-scroll');

    const focusables = getFocusable(modal);
    if (focusables.length) focusables[0].focus();

    // trap focus inside
    function trap(e){
      if (!modal.classList.contains('open')) {
        modal.removeEventListener('keydown', trap);
        return;
      }
      if (e.key !== 'Tab') return;
      const list = getFocusable(modal);
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
    modal.addEventListener('keydown', trap);
  }

  function closeModal(modal){
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    body.classList.remove('no-scroll');
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
  }

  // Open via buttons/links
  openers.forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      openModal(el.getAttribute('data-modal-open'));
    });
  });

  // ✅ Event delegation to handle ALL close actions reliably
  document.addEventListener('click', e => {
    // Backdrop click closes
    if (e.target.classList && e.target.classList.contains('modal') && e.target.classList.contains('open')) {
      closeModal(e.target);
      return;
    }
    // Any element (or its child) marked with data-modal-close
    const closer = e.target.closest('[data-modal-close]');
    if (closer) {
      const modal = closer.closest('.modal');
      closeModal(modal);
    }
  });

  // ESC to close any open modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.open').forEach(closeModal);
    }
  });
})();
