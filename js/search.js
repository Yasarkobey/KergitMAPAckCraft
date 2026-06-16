const SearchManager = {
  input: null,
  results: null,

  init() {
    this.input = document.getElementById('searchInput');
    this.results = document.getElementById('searchResults');

    this.input.addEventListener('input', () => this.onInput());
    this.input.addEventListener('focus', () => {
      if (this.input.value.trim()) this.showResults();
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-container')) {
        this.results.classList.remove('active');
      }
    });
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.results.classList.remove('active');
        this.input.blur();
      }
      if (e.key === 'Enter') {
        const first = this.results.querySelector('.search-result-item');
        if (first) first.click();
      }
    });
  },

  onInput() {
    const query = this.input.value.trim().toLowerCase();
    if (query.length < 1) {
      this.results.classList.remove('active');
      return;
    }
    this.showResults(query);
  },

  showResults(query) {
    const q = (query || this.input.value.trim().toLowerCase());
    if (q.length < 1) return;

    const townResults = DataManager.towns.filter(t =>
      t.name.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    );

    const nationResults = DataManager.nations.filter(n =>
      n.name.toLowerCase().includes(q) ||
      (n.description && n.description.toLowerCase().includes(q))
    );

    const regionResults = DataManager.regions.filter(r =>
      r.name.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q))
    );

    this.results.innerHTML = '';

    if (townResults.length === 0 && nationResults.length === 0 && regionResults.length === 0) {
      this.results.innerHTML = '<div class="search-result-item" style="color:var(--text-muted)">Sonuç bulunamadı</div>';
      this.results.classList.add('active');
      return;
    }

    townResults.forEach(town => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      item.innerHTML = `
        <span class="sr-icon">🏘️</span>
        <span class="sr-name">${this.escapeHtml(town.name)}</span>
        <span class="sr-type">Town</span>
      `;
      item.addEventListener('click', () => {
        MapSystem.focusOn(town.x, town.y);
        UIManager.showTownInfo(town);
        this.results.classList.remove('active');
        this.input.value = '';
      });
      this.results.appendChild(item);
    });

    nationResults.forEach(nation => {
      const towns = DataManager.getTownsByNation(nation.id);
      let cx = 0, cy = 0;
      if (towns.length > 0) {
        cx = towns.reduce((s, t) => s + t.x, 0) / towns.length;
        cy = towns.reduce((s, t) => s + t.y, 0) / towns.length;
      }
      const item = document.createElement('div');
      item.className = 'search-result-item';
      item.innerHTML = `
        <span class="sr-icon">🏰</span>
        <span class="sr-name" style="color:${nation.color}">${this.escapeHtml(nation.name)}</span>
        <span class="sr-type">Ulus</span>
      `;
      item.addEventListener('click', () => {
        if (towns.length > 0) {
          MapSystem.focusOn(cx, cy);
        }
        this.results.classList.remove('active');
        this.input.value = '';
      });
      this.results.appendChild(item);
    });

    regionResults.forEach(region => {
      if (!region.points || region.points.length === 0) return;
      const cx = region.points.reduce((s, p) => s + p.x, 0) / region.points.length;
      const cy = region.points.reduce((s, p) => s + p.y, 0) / region.points.length;
      const item = document.createElement('div');
      item.className = 'search-result-item';
      item.innerHTML = `
        <span class="sr-icon">📍</span>
        <span class="sr-name">${this.escapeHtml(region.name)}</span>
        <span class="sr-type">Bölge</span>
      `;
      item.addEventListener('click', () => {
        MapSystem.focusOn(cx, cy);
        UIManager.showRegionInfo(region);
        this.results.classList.remove('active');
        this.input.value = '';
      });
      this.results.appendChild(item);
    });

    this.results.classList.add('active');
  },

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

window.SearchManager = SearchManager;
