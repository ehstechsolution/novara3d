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
    }
  } catch (err) {
    console.error('Erro ao carregar produtos:', err);
    productsGrid.style.display = 'none';
    productsError.style.display = 'block';
  }

  // Initialize scroll animations after products render
  initScrollAnimations();

});
