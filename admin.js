/* ========================================
   NOVARA - Admin Panel Scripts
   ======================================== */

const ADMIN_PASSWORD = 'novara041293';
const CLOUDINARY_CLOUD_NAME = 'ubuknbvp';
const CLOUDINARY_UPLOAD_PRESET = 'novarap';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // DOM Elements
  // ==========================================
  const loginScreen = document.getElementById('loginScreen');
  const loginForm = document.getElementById('loginForm');
  const loginPassword = document.getElementById('loginPassword');
  const loginError = document.getElementById('loginError');
  const dashboard = document.getElementById('dashboard');
  const sidebar = document.getElementById('sidebar');
  const sidebarLinks = document.querySelectorAll('.sidebar__link');
  const logoutBtn = document.getElementById('logoutBtn');
  const mobileBurger = document.getElementById('mobileBurger');
  const mobileHeader = document.getElementById('mobileHeader');
  const productsSection = document.getElementById('productsSection');
  const configSection = document.getElementById('configSection');
  const productsList = document.getElementById('productsList');
  const productsEmpty = document.getElementById('productsEmpty');
  const productCount = document.getElementById('productCount');
  const addProductBtn = document.getElementById('addProductBtn');
  const productModal = document.getElementById('productModal');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalClose = document.getElementById('modalClose');
  const modalTitle = document.getElementById('modalTitle');
  const productForm = document.getElementById('productForm');
  const productTitle = document.getElementById('productTitle');
  const productDesc = document.getElementById('productDesc');
  const productOrder = document.getElementById('productOrder');
  const productActive = document.getElementById('productActive');
  const fileInput = document.getElementById('fileInput');
  const uploadArea = document.getElementById('uploadArea');
  const uploadPreview = document.getElementById('uploadPreview');
  const deleteModal = document.getElementById('deleteModal');
  const deleteOverlay = document.getElementById('deleteOverlay');
  const deleteModalClose = document.getElementById('deleteModalClose');
  const deleteProductName = document.getElementById('deleteProductName');
  const deleteCancelBtn = document.getElementById('deleteCancelBtn');
  const deleteConfirmBtn = document.getElementById('deleteConfirmBtn');
  const configForm = document.getElementById('configForm');
  const whatsappNumber = document.getElementById('whatsappNumber');
  const saveConfigBtn = document.getElementById('saveConfigBtn');
  const heroPreviewImg = document.getElementById('heroPreviewImg');
  const heroPreviewEmpty = document.getElementById('heroPreviewEmpty');
  const heroUploadArea = document.getElementById('heroUploadArea');
  const heroFileInput = document.getElementById('heroFileInput');
  const heroBadge1Text = document.getElementById('heroBadge1Text');
  const heroBadge2Text = document.getElementById('heroBadge2Text');
  const toast = document.getElementById('toast');
  const toastIcon = document.getElementById('toastIcon');
  const toastMessage = document.getElementById('toastMessage');

  // ==========================================
  // State
  // ==========================================
  let allProducts = [];
  let editingProductId = null;
  let pendingImages = [];
  let existingImages = [];
  let deletingProductId = null;
  let toastTimer = null;
  let heroImageUrl = null;

  // ==========================================
  // Auth
  // ==========================================
  function checkAuth() {
    const authed = sessionStorage.getItem('novara_admin_auth');
    if (authed === 'true') {
      showDashboard();
    } else {
      showLogin();
    }
  }

  function showLogin() {
    loginScreen.style.display = 'flex';
    dashboard.style.display = 'none';
    loginPassword.value = '';
    loginError.style.display = 'none';
  }

  function showDashboard() {
    loginScreen.style.display = 'none';
    dashboard.style.display = 'flex';
    loadProducts();
    loadConfig();
  }

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (loginPassword.value === ADMIN_PASSWORD) {
      sessionStorage.setItem('novara_admin_auth', 'true');
      loginError.style.display = 'none';
      showDashboard();
    } else {
      loginError.style.display = 'block';
      loginPassword.value = '';
      loginPassword.focus();
    }
  });

  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('novara_admin_auth');
    showLogin();
  });

  // ==========================================
  // Navigation
  // ==========================================
  sidebarLinks.forEach(link => {
    link.addEventListener('click', () => {
      const section = link.dataset.section;
      sidebarLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      if (section === 'products') {
        productsSection.style.display = 'block';
        configSection.style.display = 'none';
      } else {
        productsSection.style.display = 'none';
        configSection.style.display = 'block';
      }

      sidebar.classList.remove('open');
    });
  });

  mobileBurger.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        !mobileBurger.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });

  // ==========================================
  // Toast Notifications
  // ==========================================
  function showToast(message, type = 'success') {
    clearTimeout(toastTimer);
    toast.className = 'toast';

    const iconSvg = type === 'success'
      ? '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>';

    toastIcon.innerHTML = iconSvg;
    toastMessage.textContent = message;
    toast.classList.add(type === 'success' ? 'toast--success' : 'toast--error', 'visible');

    toastTimer = setTimeout(() => {
      toast.classList.remove('visible');
    }, 4000);
  }

  // ==========================================
  // Products - Load & Render
  // ==========================================
  async function loadProducts() {
    productsList.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Carregando produtos...</p></div>';
    productsEmpty.style.display = 'none';

    try {
      const snapshot = await db.collection('products').get();
      allProducts = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

      productCount.textContent = `${allProducts.length} produto${allProducts.length !== 1 ? 's' : ''} cadastrado${allProducts.length !== 1 ? 's' : ''}`;

      if (allProducts.length === 0) {
        productsList.innerHTML = '';
        productsEmpty.style.display = 'block';
      } else {
        renderProducts();
      }
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      productsList.innerHTML = '<div class="loading-spinner"><p>Erro ao carregar produtos. Tente novamente.</p></div>';
    }
  }

  function renderProducts() {
    productsList.innerHTML = allProducts.map(product => {
      const fotos = product.fotos || [];
      const thumbUrl = fotos.length > 0 ? fotos[0] : null;
      const isActive = product.ativo !== false;

      const thumbHTML = thumbUrl
        ? `<img src="${thumbUrl}" alt="${product.titulo || ''}">`
        : `<div class="product-item__thumb-placeholder"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg></div>`;

      return `
        <div class="product-item" data-id="${product.id}">
          <div class="product-item__thumb">${thumbHTML}</div>
          <div class="product-item__info">
            <div class="product-item__title">${product.titulo || 'Sem título'}</div>
            <div class="product-item__meta">
              <span class="product-item__badge ${isActive ? 'product-item__badge--active' : 'product-item__badge--inactive'}">
                ${isActive ? 'Ativo' : 'Inativo'}
              </span>
              <span class="product-item__order">Ordem: ${product.ordem || 0}</span>
              ${fotos.length > 0 ? `<span>${fotos.length} foto${fotos.length > 1 ? 's' : ''}</span>` : ''}
            </div>
          </div>
          <div class="product-item__actions">
            <label class="toggle product-item__toggle">
              <input type="checkbox" ${isActive ? 'checked' : ''} onchange="toggleProductActive('${product.id}', this.checked)">
              <span class="toggle__slider"></span>
            </label>
            <button class="product-item__btn" onclick="editProduct('${product.id}')" title="Editar">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            </button>
            <button class="product-item__btn product-item__btn--delete" onclick="openDeleteModal('${product.id}', '${(product.titulo || '').replace(/'/g, "\\'")}')" title="Excluir">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
          </div>
        </div>`;
    }).join('');
  }

  // ==========================================
  // Products - Toggle Active
  // ==========================================
  window.toggleProductActive = async (id, active) => {
    try {
      await db.collection('products').doc(id).update({ ativo: active });
      const product = allProducts.find(p => p.id === id);
      if (product) product.ativo = active;
      showToast(active ? 'Produto ativado' : 'Produto desativado');
    } catch (err) {
      console.error('Erro ao atualizar produto:', err);
      showToast('Erro ao atualizar produto', 'error');
      loadProducts();
    }
  };

  // ==========================================
  // Products - Modal (Add/Edit)
  // ==========================================
  addProductBtn.addEventListener('click', () => {
    editingProductId = null;
    modalTitle.textContent = 'Novo Produto';
    productForm.reset();
    productActive.checked = true;
    productOrder.value = '0';
    existingImages = [];
    pendingImages = [];
    uploadPreview.innerHTML = '';
    productModal.classList.add('open');
  });

  window.editProduct = (id) => {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    editingProductId = id;
    modalTitle.textContent = 'Editar Produto';
    productTitle.value = product.titulo || '';
    productDesc.value = product.descricao || '';
    productOrder.value = product.ordem || 0;
    productActive.checked = product.ativo !== false;

    existingImages = [...(product.fotos || [])];
    pendingImages = [];
    renderUploadPreview();
    productModal.classList.add('open');
  };

  function closeModal() {
    productModal.classList.remove('open');
    editingProductId = null;
    existingImages = [];
    pendingImages = [];
    uploadPreview.innerHTML = '';
    fileInput.value = '';
  }

  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', closeModal);

  // ==========================================
  // Upload - Drag & Drop + Click
  // ==========================================
  uploadArea.addEventListener('click', () => fileInput.click());

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });

  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    fileInput.value = '';
  });

  function handleFiles(files) {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 5 * 1024 * 1024) {
        showToast(`${file.name} excede 5MB`, 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        pendingImages.push({
          file,
          preview: e.target.result,
          uploading: false,
          uploaded: false,
          url: null
        });
        renderUploadPreview();
      };
      reader.readAsDataURL(file);
    });
  }

  function renderUploadPreview() {
    let html = '';

    existingImages.forEach((url, i) => {
      html += `
        <div class="preview-item preview-item--existing">
          <img src="${url}" alt="Imagem ${i + 1}">
          <button type="button" class="preview-item__remove" onclick="removeExistingImage(${i})">&times;</button>
        </div>`;
    });

    pendingImages.forEach((img, i) => {
      html += `<div class="preview-item">`;
      html += `<img src="${img.preview}" alt="Preview ${i + 1}">`;

      if (img.uploading) {
        html += `<div class="preview-item__uploading"><div class="spinner"></div></div>`;
      } else if (img.uploaded) {
        html += `<div class="preview-item__check"><svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></div>`;
      } else {
        html += `<button type="button" class="preview-item__remove" onclick="removePendingImage(${i})">&times;</button>`;
      }

      html += `</div>`;
    });

    uploadPreview.innerHTML = html;
  }

  window.removeExistingImage = (index) => {
    existingImages.splice(index, 1);
    renderUploadPreview();
  };

  window.removePendingImage = (index) => {
    pendingImages.splice(index, 1);
    renderUploadPreview();
  };

  // ==========================================
  // Upload - Cloudinary
  // ==========================================
  async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Erro no upload');
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      publicId: data.public_id
    };
  }

  async function uploadAllPendingImages() {
    const uploads = pendingImages
      .map((img, index) => ({ img, index }))
      .filter(({ img }) => !img.uploaded && !img.uploading);

    for (const { img, index } of uploads) {
      pendingImages[index].uploading = true;
      renderUploadPreview();

      try {
        const result = await uploadToCloudinary(img.file);
        pendingImages[index].uploading = false;
        pendingImages[index].uploaded = true;
        pendingImages[index].url = result.url;
        pendingImages[index].publicId = result.publicId;
      } catch (err) {
        pendingImages[index].uploading = false;
        showToast(`Erro ao enviar ${img.file.name}`, 'error');
        throw err;
      }
    }

    renderUploadPreview();
    return pendingImages.filter(img => img.uploaded).map(img => img.url);
  }

  // Nota: exclusão de imagens do Cloudinary requer API secret (server-side).
  // Imagens órfãs podem ser limpas manualmente no painel do Cloudinary.

  // ==========================================
  // Products - Save (Add/Edit)
  // ==========================================
  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const saveBtn = document.getElementById('modalSave');
    const originalHTML = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<div class="spinner" style="width:18px;height:18px;border-width:2px;margin:0"></div> Salvando...';

    try {
      const newImageUrls = await uploadAllPendingImages();
      const allImageUrls = [...existingImages, ...newImageUrls];

      const productData = {
        titulo: productTitle.value.trim(),
        descricao: productDesc.value.trim(),
        fotos: allImageUrls,
        ativo: productActive.checked,
        ordem: parseInt(productOrder.value) || 0
      };

      if (editingProductId) {
        await db.collection('products').doc(editingProductId).update(productData);
        showToast('Produto atualizado com sucesso');
      } else {
        await db.collection('products').add(productData);
        showToast('Produto criado com sucesso');
      }

      closeModal();
      await loadProducts();
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
      showToast('Erro ao salvar produto', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalHTML;
    }
  });

  // ==========================================
  // Products - Delete
  // ==========================================
  window.openDeleteModal = (id, name) => {
    deletingProductId = id;
    deleteProductName.textContent = name || 'este produto';
    deleteModal.classList.add('open');
  };

  function closeDeleteModal() {
    deleteModal.classList.remove('open');
    deletingProductId = null;
  }

  deleteModalClose.addEventListener('click', closeDeleteModal);
  deleteOverlay.addEventListener('click', closeDeleteModal);
  deleteCancelBtn.addEventListener('click', closeDeleteModal);

  deleteConfirmBtn.addEventListener('click', async () => {
    if (!deletingProductId) return;

    const originalHTML = deleteConfirmBtn.innerHTML;
    deleteConfirmBtn.disabled = true;
    deleteConfirmBtn.innerHTML = '<div class="spinner" style="width:18px;height:18px;border-width:2px;margin:0"></div> Excluindo...';

    try {
      await db.collection('products').doc(deletingProductId).delete();
      showToast('Produto excluído com sucesso');
      closeDeleteModal();
      await loadProducts();
    } catch (err) {
      console.error('Erro ao excluir produto:', err);
      showToast('Erro ao excluir produto', 'error');
    } finally {
      deleteConfirmBtn.disabled = false;
      deleteConfirmBtn.innerHTML = originalHTML;
    }
  });

  // ==========================================
  // Config
  // ==========================================
  function updateHeroPreview() {
    if (heroImageUrl) {
      heroPreviewImg.src = heroImageUrl;
      heroPreviewImg.style.display = 'block';
      heroPreviewEmpty.style.display = 'none';
    } else {
      heroPreviewImg.style.display = 'none';
      heroPreviewEmpty.style.display = 'flex';
    }
  }

  async function loadConfig() {
    try {
      const doc = await db.collection('config').doc('main').get();
      if (doc.exists) {
        const data = doc.data();
        whatsappNumber.value = data.whatsappNumber || '';
        heroImageUrl = data.heroImage || null;
        heroBadge1Text.value = data.heroBadge1 || '';
        heroBadge2Text.value = data.heroBadge2 || '';
        updateHeroPreview();
      }
    } catch (err) {
      console.error('Erro ao carregar config:', err);
    }
  }

  heroUploadArea.addEventListener('click', () => heroFileInput.click());

  heroFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Selecione uma imagem válida', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Imagem excede 5MB', 'error');
      return;
    }

    const originalHTML = heroUploadArea.innerHTML;
    heroUploadArea.innerHTML = '<div class="spinner" style="margin:0 auto"></div><p>Enviando...</p>';
    heroUploadArea.style.pointerEvents = 'none';

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Erro no upload');

      const data = await response.json();
      heroImageUrl = data.secure_url;
      updateHeroPreview();
      showToast('Imagem enviada com sucesso');
    } catch (err) {
      console.error('Erro ao enviar imagem:', err);
      showToast('Erro ao enviar imagem', 'error');
    } finally {
      heroUploadArea.innerHTML = originalHTML;
      heroUploadArea.style.pointerEvents = '';
      heroFileInput.value = '';
      heroUploadArea.addEventListener('click', () => heroFileInput.click());
    }
  });

  configForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const originalHTML = saveConfigBtn.innerHTML;
    saveConfigBtn.disabled = true;
    saveConfigBtn.innerHTML = '<div class="spinner" style="width:18px;height:18px;border-width:2px;margin:0"></div> Salvando...';

    try {
      await db.collection('config').doc('main').set({
        whatsappNumber: whatsappNumber.value.trim(),
        heroImage: heroImageUrl || '',
        heroBadge1: heroBadge1Text.value.trim(),
        heroBadge2: heroBadge2Text.value.trim()
      }, { merge: true });
      showToast('Configurações salvas com sucesso');
    } catch (err) {
      console.error('Erro ao salvar config:', err);
      showToast('Erro ao salvar configurações', 'error');
    } finally {
      saveConfigBtn.disabled = false;
      saveConfigBtn.innerHTML = originalHTML;
    }
  });

  // ==========================================
  // Keyboard Shortcuts
  // ==========================================
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (productModal.classList.contains('open')) closeModal();
      if (deleteModal.classList.contains('open')) closeDeleteModal();
    }
  });

  // ==========================================
  // Init
  // ==========================================
  checkAuth();

});