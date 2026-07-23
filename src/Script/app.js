const openSidebarBtn = document.getElementById('openSidebar');
const closeSidebarBtn = document.getElementById('closeSidebar');
const sidebar = document.getElementById('sidebarMenu');
const overlay = document.getElementById('sidebarOverlay');
const filterButtons = Array.from(document.querySelectorAll('.filter-link'));
const resultsLabel = document.querySelector('.section-head span');
const scrollTopBtn = document.getElementById('scrollTopBtn');
const productosGrid = document.getElementById('productosGrid');
const productosDataScript = document.getElementById('productos-data');
let productos = [];
let productosVisibles = [];

function toggleSidebar(force) {
  const shouldOpen = typeof force === 'boolean' ? force : !sidebar.classList.contains('is-open');
  sidebar.classList.toggle('is-open', shouldOpen);
  overlay.classList.toggle('is-visible', shouldOpen);
  openSidebarBtn?.setAttribute('aria-expanded', String(shouldOpen));
}

function renderProductos(productosAMostrar) {
  if (!productosGrid) return;

  productosGrid.innerHTML = '';
  productosVisibles = productosAMostrar;

  productosAMostrar.forEach((producto) => {
    const article = document.createElement('article');
    article.className = 'card';
    article.dataset.brand = producto.marca;
    article.dataset.gender = producto.genero;

    article.innerHTML = `
      <div class="card-top">
        <div class="image-carousel" aria-label="Carrusel de imágenes del perfume ${producto.nombre}">
          <button class="carousel-btn prev" type="button" aria-label="Ver imagen anterior">‹</button>
          <div class="carousel-viewport">
            ${producto.imagenes.map((image, index) => `
              <div class="carousel-image ${index === 0 ? 'is-active' : ''}" style="background-image: url('${image}');">
                <span>${producto.nombre}</span>
              </div>
            `).join('')}
          </div>
          <button class="carousel-btn next" type="button" aria-label="Ver imagen siguiente">›</button>
        </div>
        <div>
          <h3>${producto.nombre}</h3>
          <div class="meta">
            <span class="tag">${producto.marca}</span>
            <span class="tag">${producto.tamano}</span>
          </div>
          <p class="desc">${producto.descripcion}</p>
        </div>
      </div>
      <div class="bottom">
        <div class="price">$${producto.precioFrasco.toLocaleString('es-AR')}</div>
        <div class="price decant">Decant $${producto.precioDecant.toLocaleString('es-AR')}</div>
        <div class="stock ${producto.stockClase}">${producto.stockTexto}</div>
      </div>
    `;

    productosGrid.appendChild(article);
  });

  setupCarousels();
  updateResultsLabel();
}

function updateResultsLabel() {
  if (!resultsLabel) return;
  resultsLabel.textContent = `${productosVisibles.length} perfumes disponibles`;
}

function applyFilter(filterType, value) {
  let productosFiltrados = [...productos];

  if (filterType === 'brand') {
    productosFiltrados = productos.filter((producto) => producto.marca === value);
  } else if (filterType === 'gender') {
    productosFiltrados = productos.filter((producto) => producto.genero === value);
  }

  renderProductos(productosFiltrados);
}

function setupCarousels() {
  const carousels = Array.from(document.querySelectorAll('.image-carousel'));

  carousels.forEach((carousel) => {
    const images = Array.from(carousel.querySelectorAll('.carousel-image'));
    const prevBtn = carousel.querySelector('.carousel-btn.prev');
    const nextBtn = carousel.querySelector('.carousel-btn.next');
    let activeIndex = 0;

    const updateCarousel = () => {
      images.forEach((image, index) => {
        image.classList.toggle('is-active', index === activeIndex);
      });
    };

    prevBtn?.addEventListener('click', () => {
      activeIndex = (activeIndex - 1 + images.length) % images.length;
      updateCarousel();
    });

    nextBtn?.addEventListener('click', () => {
      activeIndex = (activeIndex + 1) % images.length;
      updateCarousel();
    });

    updateCarousel();
  });
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const filterType = button.dataset.filter || 'all';
    const value = button.dataset.value || '';

    filterButtons.forEach((item) => {
      item.classList.toggle(
        'active',
        item === button || (filterType === 'all' && item.dataset.filter === 'all')
      );
    });

    if (filterType === 'all') {
      renderProductos(productos);
    } else {
      applyFilter(filterType, value);
    }

    toggleSidebar(false);
  });
});

window.addEventListener('scroll', () => {
  if (window.scrollY > 400) {
    scrollTopBtn?.classList.add('is-visible');
  } else {
    scrollTopBtn?.classList.remove('is-visible');
  }
});

scrollTopBtn?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

async function cargarProductos() {
  if (productosDataScript) {
    try {
      const data = JSON.parse(productosDataScript.textContent);
      productos = data.productos;
      renderProductos(productos);
      return;
    } catch (error) {
      console.warn('No se pudo leer el JSON embebido:', error);
    }
  }

  const rutas = [
    new URL('./src/data/productos.json', window.location.href).toString(),
    new URL('../data/productos.json', window.location.href).toString(),
    new URL('./data/productos.json', window.location.href).toString()
  ];

  for (const ruta of rutas) {
    try {
      const response = await fetch(ruta);
      if (!response.ok) continue;

      const data = await response.json();
      productos = data.productos;
      renderProductos(productos);
      return;
    } catch (error) {
      console.warn(`No se pudo cargar el JSON desde ${ruta}:`, error);
    }
  }

  console.error('No se pudieron cargar los productos');
  if (resultsLabel) {
    resultsLabel.textContent = 'No se pudieron cargar los perfumes';
  }
}

cargarProductos();

openSidebarBtn?.addEventListener('click', () => toggleSidebar(true));
closeSidebarBtn?.addEventListener('click', () => toggleSidebar(false));
overlay?.addEventListener('click', () => toggleSidebar(false));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && sidebar?.classList.contains('is-open')) {
    toggleSidebar(false);
  }
});

applyFilter('all', '');
