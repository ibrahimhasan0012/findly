// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  query      : '',
  sort       : 'default',
  minPrice   : 0,
  maxPrice   : Infinity,
  results    : [],
  filtersOpen: false,
  loading    : false,
};

// ── DOM ───────────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const dom = {
  home            : $('home'),
  resultsContainer: $('results-container'),
  searchHome      : $('search-input'),
  searchResults   : $('search-input-results'),
  grid            : $('product-grid'),
  summary         : $('result-summary'),
  filterBtn       : $('filter-btn'),
  filterPanel     : $('filter-panel'),
  minInput        : $('filter-min'),
  maxInput        : $('filter-max'),
  sortSelect      : $('filter-sort'),
  clearBtn        : $('filter-clear'),
  modal           : $('product-modal'),
  modalOverlay    : $('modal-overlay'),
  modalImg        : $('modal-img'),
  modalStore      : $('modal-store'),
  modalTitle      : $('modal-title'),
  modalSnippet    : $('modal-snippet'),
  modalPrice      : $('modal-price'),
  modalLink       : $('modal-link'),
  modalClose      : $('modal-close'),
  darkToggle      : $('dark-toggle'),
  tChips          : document.querySelectorAll('.t-chip'),
  pagination      : $('pagination'),
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = n => n > 0
  ? '৳ ' + new Intl.NumberFormat('en-BD', { maximumFractionDigits: 0 }).format(n)
  : null;

function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

// ── Dark mode ─────────────────────────────────────────────────────────────────
function initDarkMode() {
  const saved = localStorage.getItem('findly-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', saved || (prefersDark ? 'dark' : 'light'));
  dom.darkToggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('findly-theme', next);
  });
}

// ── Search ────────────────────────────────────────────────────────────────────
async function search(query) {
  if (!query || query.trim().length < 2) return;
  state.query   = query.trim();
  state.loading = true;

  // Switch to results view
  dom.home.style.display             = 'none';
  dom.resultsContainer.style.display = 'block';
  dom.searchResults.value            = state.query;

  // Show spinner
  dom.grid.innerHTML    = `<div class="loading-state"><div class="spinner"></div>Searching BD stores...</div>`;
  dom.summary.textContent = '';
  dom.pagination.innerHTML = '';

  try {
    const res  = await fetch(`/api/search?q=${encodeURIComponent(state.query)}`);
    const data = await res.json();

    if (data.error) throw new Error(data.error);
    state.results = data.items || [];
    renderResults();

  } catch (e) {
    dom.grid.innerHTML = `<div class="empty-state">Search failed. Please try again.<br><small>${e.message}</small></div>`;
    dom.summary.textContent = '';
  }

  state.loading = false;
}

// ── Filter + render ───────────────────────────────────────────────────────────
function getFiltered() {
  return state.results.filter(p => {
    if (state.minPrice > 0 && p.price < state.minPrice) return false;
    if (state.maxPrice < Infinity && p.price > state.maxPrice) return false;
    return true;
  }).sort((a, b) => {
    if (state.sort === 'price-asc')  return a.price - b.price;
    if (state.sort === 'price-desc') return b.price - a.price;
    return 0;
  });
}

function renderResults() {
  const items = getFiltered();
  dom.summary.textContent = `${items.length} result${items.length !== 1 ? 's' : ''} for "${state.query}"`;

  if (!items.length) {
    dom.grid.innerHTML = `<div class="empty-state">No results found for "<strong>${state.query}</strong>".<br>Try a different search term.</div>`;
    return;
  }

  dom.grid.innerHTML = items.map((p, i) => `
    <div class="product-card" data-index="${i}" style="animation-delay:${Math.min(i * 25, 500)}ms">
      <div class="product-media">
        <img src="${p.image}" loading="lazy" alt="${p.title}"
          onerror="this.src='https://placehold.co/300x300/f1f5f9/94a3b8?text=${encodeURIComponent(p.store)}'">
      </div>
      <div class="product-body">
        <span class="product-store">${p.store}</span>
        <h3 class="product-title">${p.title}</h3>
        <p class="product-price">${fmt(p.price) || '<span class="no-price">See store for price</span>'}</p>
      </div>
    </div>
  `).join('');

  dom.grid.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', () => openModal(items[+card.dataset.index]));
  });
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function openModal(p) {
  dom.modalImg.src             = p.image || `https://placehold.co/300x300/f1f5f9/94a3b8?text=${encodeURIComponent(p.store)}`;
  dom.modalImg.onerror         = () => { dom.modalImg.src = `https://placehold.co/300x300/f1f5f9/94a3b8?text=${encodeURIComponent(p.store)}`; };
  dom.modalStore.textContent   = p.store;
  dom.modalTitle.textContent   = p.title;
  dom.modalSnippet.textContent = p.snippet || '';
  dom.modalPrice.textContent   = fmt(p.price) || 'See store for price';
  dom.modalLink.href            = p.dealUrl;
  dom.modal.classList.add('open');
  dom.modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  dom.modal.classList.remove('open');
  dom.modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ── Back to home ──────────────────────────────────────────────────────────────
function goHome() {
  dom.resultsContainer.style.display = 'none';
  dom.home.style.display             = 'flex';
  dom.searchHome.value               = '';
  dom.searchHome.focus();
  state.query   = '';
  state.results = [];
}

// ── Init ──────────────────────────────────────────────────────────────────────
function init() {
  initDarkMode();

  // Hide results container on load
  dom.resultsContainer.style.display = 'none';

  // Logo click → go home
  document.querySelector('.logo').style.cursor = 'pointer';
  document.querySelector('.logo').addEventListener('click', goHome);

  // Home search input
  dom.searchHome.addEventListener('keydown', e => {
    if (e.key === 'Enter' && dom.searchHome.value.trim()) {
      search(dom.searchHome.value.trim());
    }
  });

  // Results search input
  dom.searchResults.addEventListener('keydown', e => {
    if (e.key === 'Enter' && dom.searchResults.value.trim()) {
      search(dom.searchResults.value.trim());
    }
  });

  // Trending chips
  dom.tChips.forEach(chip => {
    chip.addEventListener('click', () => search(chip.dataset.q));
  });

  // Filters
  dom.filterBtn.addEventListener('click', () => {
    state.filtersOpen = !state.filtersOpen;
    dom.filterPanel.classList.toggle('open', state.filtersOpen);
    dom.filterBtn.classList.toggle('active', state.filtersOpen);
  });

  dom.minInput.addEventListener('input', debounce(e => {
    state.minPrice = parseFloat(e.target.value) || 0;
    renderResults();
  }, 300));

  dom.maxInput.addEventListener('input', debounce(e => {
    state.maxPrice = parseFloat(e.target.value) || Infinity;
    renderResults();
  }, 300));

  dom.sortSelect.addEventListener('change', e => {
    state.sort = e.target.value;
    renderResults();
  });

  dom.clearBtn.addEventListener('click', () => {
    state.minPrice = 0; state.maxPrice = Infinity; state.sort = 'default';
    dom.minInput.value = ''; dom.maxInput.value = ''; dom.sortSelect.value = 'default';
    renderResults();
  });

  // Modal
  dom.modalClose.addEventListener('click', closeModal);
  dom.modalOverlay.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

init();
