// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  products: [],
  query: '',
  category: 'All',
  minPrice: 0,
  maxPrice: Infinity,
  sort: 'default',
  filtersOpen: false,
  modalProduct: null,
};

// ── DOM refs ──────────────────────────────────────────────────────────────────
const dom = {
  grid        : document.getElementById('product-grid'),
  searchInput : document.getElementById('search-input'),
  summary     : document.getElementById('result-summary'),
  filterBtn   : document.querySelector('.filter-btn'),
  filterPanel : document.getElementById('filter-panel'),
  catSelect   : document.getElementById('filter-category'),
  minInput    : document.getElementById('filter-min'),
  maxInput    : document.getElementById('filter-max'),
  sortSelect  : document.getElementById('filter-sort'),
  clearBtn    : document.getElementById('filter-clear'),
  modal       : document.getElementById('product-modal'),
  modalImg    : document.getElementById('modal-img'),
  modalStore  : document.getElementById('modal-store'),
  modalTitle  : document.getElementById('modal-title'),
  modalCat    : document.getElementById('modal-cat'),
  modalPrice  : document.getElementById('modal-price'),
  modalLink   : document.getElementById('modal-link'),
  modalClose  : document.getElementById('modal-close'),
  modalOverlay: document.getElementById('modal-overlay'),
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const norm = v => String(v || '').toLowerCase().trim();

function formatPrice(n) {
  return '৳ ' + new Intl.NumberFormat('en-BD', { maximumFractionDigits: 0 }).format(n);
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ── Filtering ─────────────────────────────────────────────────────────────────
function getFiltered() {
  const q = norm(state.query);
  return state.products.filter(p => {
    if (q && !`${p.title} ${p.store} ${p.category}`.toLowerCase().includes(q)) return false;
    if (state.category !== 'All' && p.category !== state.category) return false;
    if (p.price < state.minPrice) return false;
    if (state.maxPrice !== Infinity && p.price > state.maxPrice) return false;
    return true;
  }).sort((a, b) => {
    if (state.sort === 'price-asc')  return a.price - b.price;
    if (state.sort === 'price-desc') return b.price - a.price;
    return 0;
  });
}

// ── Render grid ───────────────────────────────────────────────────────────────
function render() {
  const filtered = getFiltered();
  dom.summary.textContent = `Showing ${filtered.length} of ${state.products.length} results`;

  if (!filtered.length) {
    dom.grid.innerHTML = `<div class="empty-state">No results for "${state.query}"</div>`;
    return;
  }

  dom.grid.innerHTML = filtered.map((p, i) => `
    <div class="product-card" data-index="${i}" style="animation-delay:${Math.min(i * 30, 300)}ms">
      <div class="product-media">
        <img src="${p.image}" loading="lazy" alt="${p.title}" onerror="this.src='https://placehold.co/300x300/f1f5f9/94a3b8?text=No+Image'">
      </div>
      <div class="product-body">
        <span class="product-store">${p.store}</span>
        <h3 class="product-title">${p.title}</h3>
        <div class="product-pricing">
          <span class="price-label">Price</span>
          <p class="product-price">${formatPrice(p.price)}</p>
        </div>
      </div>
    </div>
  `).join('');

  // Attach click → modal (store filtered array on grid for lookup)
  dom.grid._filtered = filtered;
  dom.grid.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', () => openModal(filtered[+card.dataset.index]));
  });
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function openModal(p) {
  state.modalProduct = p;
  dom.modalImg.src   = p.image;
  dom.modalImg.onerror = () => { dom.modalImg.src = 'https://placehold.co/400x400/f1f5f9/94a3b8?text=No+Image'; };
  dom.modalStore.textContent = p.store;
  dom.modalTitle.textContent = p.title;
  dom.modalCat.textContent   = p.category;
  dom.modalPrice.textContent = formatPrice(p.price);
  dom.modalLink.href         = p.dealUrl;
  dom.modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  dom.modal.classList.remove('open');
  document.body.style.overflow = '';
  state.modalProduct = null;
}

// ── Filter panel ──────────────────────────────────────────────────────────────
function buildCategoryOptions() {
  const cats = ['All', ...new Set(state.products.map(p => p.category))].sort();
  dom.catSelect.innerHTML = cats.map(c =>
    `<option value="${c}">${c}</option>`
  ).join('');
}

function toggleFilters() {
  state.filtersOpen = !state.filtersOpen;
  dom.filterPanel.classList.toggle('open', state.filtersOpen);
  dom.filterBtn.classList.toggle('active', state.filtersOpen);
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  try {
    const res = await fetch('data/products.json');
    if (!res.ok) throw new Error('Failed to load products');
    state.products = await res.json();
    buildCategoryOptions();
    render();

    // Search
    dom.searchInput.addEventListener('input', debounce(e => {
      state.query = e.target.value;
      render();
    }, 150));

    // Filter toggle
    dom.filterBtn.addEventListener('click', toggleFilters);

    // Category
    dom.catSelect.addEventListener('change', e => {
      state.category = e.target.value;
      render();
    });

    // Price range
    dom.minInput.addEventListener('input', debounce(e => {
      state.minPrice = parseFloat(e.target.value) || 0;
      render();
    }, 300));
    dom.maxInput.addEventListener('input', debounce(e => {
      state.maxPrice = parseFloat(e.target.value) || Infinity;
      render();
    }, 300));

    // Sort
    dom.sortSelect.addEventListener('change', e => {
      state.sort = e.target.value;
      render();
    });

    // Clear filters
    dom.clearBtn.addEventListener('click', () => {
      state.category = 'All';
      state.minPrice = 0;
      state.maxPrice = Infinity;
      state.sort = 'default';
      dom.catSelect.value  = 'All';
      dom.minInput.value   = '';
      dom.maxInput.value   = '';
      dom.sortSelect.value = 'default';
      render();
    });

    // Modal close
    dom.modalClose.addEventListener('click', closeModal);
    dom.modalOverlay.addEventListener('click', closeModal);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  } catch (err) {
    dom.grid.innerHTML = `<div class="empty-state">Error loading products. Please try again.</div>`;
    console.error(err);
  }
}

init();
