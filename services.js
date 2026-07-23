/* ========================================
   NOVARA - Firebase Services
   ======================================== */

async function fetchProducts() {
  const snapshot = await db.collection('products').get();
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(p => p.ativo === true)
    .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
}

async function fetchConfig() {
  const doc = await db.collection('config').doc('main').get();
  return doc.exists ? doc.data() : null;
}

function phoneToWhatsApp(phone) {
  const numbers = phone.replace(/\D/g, '');
  return numbers.startsWith('55') ? numbers : '55' + numbers;
}

function getWhatsAppLink(phone, message) {
  const num = phoneToWhatsApp(phone);
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

const WHATSAPP_ICON_SM = '<svg class="icon-whatsapp" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';

function renderProductCard(product, whatsappNumber) {
  const fotos = product.fotos || [];
  const titulo = product.titulo || 'Produto';
  const descricao = product.descricao || '';
  const waMessage = `Olá! Tenho interesse no ${titulo}.`;
  const waLink = getWhatsAppLink(whatsappNumber, waMessage);

  let imageHTML = '';

  if (fotos.length === 0) {
    imageHTML = '<div class="product-card__placeholder"><svg viewBox="0 0 300 220" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="220" fill="#f0f4fa" rx="12"/><ellipse cx="150" cy="100" rx="40" ry="30" fill="none" stroke="#1a3a6e" stroke-width="1.5" opacity="0.2"/><text x="150" y="150" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="#1a3a6e" opacity="0.25">Sem imagem</text></svg></div>';
  } else if (fotos.length === 1) {
    imageHTML = `<img src="${fotos[0]}" alt="${titulo}" class="product-card__img" loading="lazy">`;
  } else {
    const slides = fotos.map(url =>
      `<img src="${url}" alt="${titulo}" class="product-card__img" loading="lazy">`
    ).join('');
    const dots = fotos.map((_, i) =>
      `<span class="carousel-dot${i === 0 ? ' active' : ''}" data-index="${i}"></span>`
    ).join('');
    imageHTML = `<div class="product-card__carousel" data-total="${fotos.length}"><div class="product-card__track">${slides}</div><button class="carousel-btn carousel-btn--prev" aria-label="Anterior">&#8249;</button><button class="carousel-btn carousel-btn--next" aria-label="Proximo">&#8250;</button><div class="carousel-dots">${dots}</div></div>`;
  }

  return `
    <div class="product-card" data-id="${product.id}">
      <div class="product-card__image">${imageHTML}</div>
      <div class="product-card__body">
        <h3 class="product-card__name">${titulo}</h3>
        <p class="product-card__desc">${descricao}</p>
        <a href="${waLink}" class="btn btn--primary btn--sm" target="_blank" rel="noopener">
          ${WHATSAPP_ICON_SM} Solicitar no WhatsApp
        </a>
      </div>
    </div>`;
}

function updateWhatsAppLinks(phone) {
  const num = phoneToWhatsApp(phone);
  document.querySelectorAll('a[href*="wa.me/SEUNUMERO"]').forEach(link => {
    link.setAttribute('href', link.getAttribute('href').replace('SEUNUMERO', num));
  });
}

function initCarousels() {
  document.querySelectorAll('.product-card__carousel').forEach(carousel => {
    const track = carousel.querySelector('.product-card__track');
    const dots = carousel.querySelectorAll('.carousel-dot');
    const prevBtn = carousel.querySelector('.carousel-btn--prev');
    const nextBtn = carousel.querySelector('.carousel-btn--next');
    const total = parseInt(carousel.dataset.total);
    let current = 0;
    let autoplayTimer;

    function goTo(index) {
      current = ((index % total) + total) % total;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    function startAutoplay() { stopAutoplay(); autoplayTimer = setInterval(next, 5000); }
    function stopAutoplay() { clearInterval(autoplayTimer); }

    prevBtn.addEventListener('click', () => { stopAutoplay(); prev(); startAutoplay(); });
    nextBtn.addEventListener('click', () => { stopAutoplay(); next(); startAutoplay(); });
    dots.forEach(dot => {
      dot.addEventListener('click', () => { stopAutoplay(); goTo(parseInt(dot.dataset.index)); startAutoplay(); });
    });

    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', startAutoplay);

    let touchStartX = 0;
    carousel.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    carousel.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 50) {
        stopAutoplay();
        diff > 0 ? next() : prev();
        startAutoplay();
      }
    }, { passive: true });

    startAutoplay();
  });
}
