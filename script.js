/* ========================================
   NOVARA - Landing Page Scripts
   ======================================== */

document.addEventListener('DOMContentLoaded', async () => {

  // --- Header scroll effect ---
  const header = document.getElementById('header');
  const handleHeaderScroll = () => {
    header.classList.toggle('header--scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', handleHeaderScroll, { passive: true });

  // --- Mobile menu toggle ---
  const burgerBtn = document.getElementById('burgerBtn');
  const mainNav = document.getElementById('mainNav');

  burgerBtn.addEventListener('click', () => {
    burgerBtn.classList.toggle('active');
    mainNav.classList.toggle('open');
  });

  mainNav.querySelectorAll('.header__nav-link').forEach(link => {
    link.addEventListener('click', () => {
      burgerBtn.classList.remove('active');
      mainNav.classList.remove('open');
    });
  });

  // --- Active nav link on scroll ---
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.header__nav-link');

  const updateActiveNav = () => {
    const scrollPos = window.scrollY + 120;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  };
  window.addEventListener('scroll', updateActiveNav, { passive: true });

  // --- Floating WhatsApp visibility ---
  const whatsappFloat = document.getElementById('whatsappFloat');
  const handleFloatVisibility = () => {
    whatsappFloat.classList.toggle('visible', window.scrollY > 400);
  };
  window.addEventListener('scroll', handleFloatVisibility, { passive: true });

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // --- Scroll animations helper ---
  function initScrollAnimations() {
    const targets = document.querySelectorAll(
      '.product-card, .diff-card, .section-header, .hero__content, .hero__visual, .cta-section__inner'
    );
    targets.forEach(el => el.classList.add('animate-on-scroll'));

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('animated');
          }, index * 80);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(el => observer.observe(el));
  }

  // --- Load WhatsApp config from Firestore ---
  try {
    const config = await fetchConfig();
    if (config && config.whatsappNumber) {
      updateWhatsAppLinks(config.whatsappNumber);
    }

    // Hero image
    if (config && config.heroImage) {
      const heroImg = document.getElementById('heroImage');
      const heroFallback = document.getElementById('heroFallbackSvg');
      if (heroImg && config.heroImage) {
        heroImg.src = config.heroImage;
        heroImg.style.display = 'block';
        if (heroFallback) heroFallback.style.display = 'none';
      }
    }

    // Hero badges
    if (config && config.heroBadge1) {
      const badge1 = document.getElementById('heroBadge1');
      if (badge1) {
        const span = badge1.querySelector('span:last-child');
        if (span) span.textContent = config.heroBadge1;
      }
    }
    if (config && config.heroBadge2) {
      const badge2 = document.getElementById('heroBadge2');
      if (badge2) {
        const span = badge2.querySelector('span:last-child');
        if (span) span.textContent = config.heroBadge2;
      }
    }
  } catch (err) {
    console.warn('Config nao carregada:', err.message);
  }

  // --- Load and render products from Firestore ---
  const productsGrid = document.getElementById('productsGrid');
  const productsEmpty = document.getElementById('productsEmpty');
  const productsError = document.getElementById('productsError');

  try {
    const products = await fetchProducts();

    if (products.length === 0) {
      productsGrid.style.display = 'none';
      productsEmpty.style.display = 'block';
    } else {
      const phone = document.querySelector('a[href*="wa.me/"]');
      const href = phone ? phone.getAttribute('href') : '';
      const match = href.match(/wa\.me\/(\d+)/);
      const whatsappNumber = match ? match[1] : '5500000000000';

      productsGrid.innerHTML = products.map(p => renderProductCard(p, whatsappNumber)).join('');
      initCarousels();
      initVerMaisButtons();
      initLightbox();
    }
  } catch (err) {
    console.error('Erro ao carregar produtos:', err);
    productsGrid.style.display = 'none';
    productsError.style.display = 'block';
  }

  // Initialize scroll animations after products render
  initScrollAnimations();

});

// --- "Ver Mais" overflow detection ---
function initVerMaisButtons() {
  document.querySelectorAll('.product-card').forEach(card => {
    const desc = card.querySelector('.product-card__desc');
    const btn = card.querySelector('.product-card__ver-mais');
    if (!desc || !btn) return;

    if (desc.scrollHeight > desc.clientHeight + 1) {
      btn.style.display = 'block';
    }
  });
}

// --- Product Lightbox ---
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const overlay = document.getElementById('lightboxOverlay');
  const closeBtn = document.getElementById('lightboxClose');
  const track = document.getElementById('lightboxTrack');
  const dotsContainer = document.getElementById('lightboxDots');
  const prevBtn = document.getElementById('lightboxPrev');
  const nextBtn = document.getElementById('lightboxNext');
  const titleEl = document.getElementById('lightboxTitle');
  const descEl = document.getElementById('lightboxDesc');
  const whatsappBtn = document.getElementById('lightboxWhatsApp');

  let current = 0;
  let total = 0;

  function goTo(index) {
    current = ((index % total) + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    dotsContainer.querySelectorAll('.lightbox__dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  function openLightbox(card) {
    const fotos = JSON.parse(card.dataset.fotos || '[]');
    const titulo = card.dataset.titulo || '';
    const descricao = card.dataset.descricao || '';
    const waLink = card.dataset.walink || '#';

    if (fotos.length === 0) return;

    total = fotos.length;
    current = 0;

    track.innerHTML = fotos.map(url =>
      `<img src="${url}" alt="${titulo}">`
    ).join('');

    dotsContainer.innerHTML = fotos.map((_, i) =>
      `<button class="lightbox__dot${i === 0 ? ' active' : ''}" data-index="${i}"></button>`
    ).join('');

    titleEl.textContent = titulo;
    descEl.textContent = descricao;
    whatsappBtn.href = waLink;

    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';

    prevBtn.style.display = total <= 1 ? 'none' : 'flex';
    nextBtn.style.display = total <= 1 ? 'none' : 'flex';

    dotsContainer.querySelectorAll('.lightbox__dot').forEach(dot => {
      dot.addEventListener('click', () => goTo(parseInt(dot.dataset.index)));
    });
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.lightbox-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const card = trigger.closest('.product-card');
      if (card) openLightbox(card);
    });
  });

  closeBtn.addEventListener('click', closeLightbox);
  overlay.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  });

  let touchStartX = 0;
  lightbox.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  lightbox.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goTo(current + 1) : goTo(current - 1);
    }
  }, { passive: true });
}
