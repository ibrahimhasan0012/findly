const state = {
  products: [],
  query: ""
};

const dom = {
  grid: document.getElementById("product-grid"),
  searchInput: document.getElementById("search-input"),
  summary: document.getElementById("result-summary")
};

function normalizeText(value) {
  return String(value || "").toLowerCase().trim();
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0
  }).format(amount);
}

function getFilteredProducts() {
  const query = normalizeText(state.query);
  if (!query) return state.products;

  return state.products.filter(item => {
    const searchable = `${item.title} ${item.store} ${item.category} ${item.brand || ""}`.toLowerCase();
    return searchable.includes(query);
  });
}

function renderProducts() {
  const filtered = getFilteredProducts();
  const total = state.products.length;
  
  dom.summary.textContent = `Showing ${filtered.length} of ${total} results`;

  if (!filtered.length) {
    dom.grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: var(--text-secondary);">No products found matching "${state.query}"</div>`;
    return;
  }

  dom.grid.innerHTML = filtered.map(item => {
    return `
      <a href="${item.dealUrl}" target="_blank" rel="noopener noreferrer" class="product-card">
        <div class="product-media">
          <img src="${item.image}" loading="lazy" alt="${item.title}">
        </div>
        <div class="product-body">
          <span class="product-store">${item.store}</span>
          <h3 class="product-title">${item.title}</h3>
          <p class="product-price">${formatCurrency(item.price)}</p>
        </div>
      </a>
    `;
  }).join("");
}

function debounce(callback, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(...args), delay);
  };
}

async function init() {
  try {
    const response = await fetch("data/products.json");
    if (!response.ok) throw new Error("Failed to fetch products");
    state.products = await response.json();
    
    // Bind search
    const debouncedSearch = debounce((value) => {
      state.query = value;
      renderProducts();
    }, 150);

    if (dom.searchInput) {
      dom.searchInput.addEventListener("input", (e) => {
        debouncedSearch(e.target.value);
      });
      dom.searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          dom.searchInput.blur();
        }
      });
    }

    renderProducts();
  } catch (error) {
    dom.grid.innerHTML = `<div style="grid-column: 1 / -1; padding: 48px;">Error loading products.</div>`;
    console.error(error);
  }
}

init();
