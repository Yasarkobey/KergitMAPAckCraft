const UIManager = {
  init() {
    document.getElementById('btnCloseInfo').addEventListener('click', () => this.hideInfo());
    document.getElementById('btnFullscreen').addEventListener('click', this.toggleFullscreen.bind(this));
  },

  showTownInfo(town) {
    const panel = document.getElementById('infoPanel');
    panel.classList.remove('hidden');

    const nation = town.nationId ? DataManager.getNation(town.nationId) : null;

    let nationHtml = '';
    if (nation) {
      nationHtml = `<span class="info-nation-badge" style="background:${nation.color}">${this.escapeHtml(nation.name)}</span>`;
    } else {
      nationHtml = '<span class="text-muted">Bağımsız</span>';
    }

    let flagHtml = '';
    if (town.flag) {
      flagHtml = `<img class="info-flag" src="${town.flag}" alt="${this.escapeHtml(town.name)} bayrağı">`;
    } else {
      flagHtml = '<div class="info-flag-placeholder">🏳️</div>';
    }

    const content = document.getElementById('infoContent');
    content.innerHTML = `
      <div class="info-card">
        ${flagHtml}
        <div class="info-name">${this.escapeHtml(town.name)}</div>
        <div class="info-description">${this.escapeHtml(town.description || 'Açıklama yok')}</div>
        <div class="info-detail">
          <div class="info-detail-item">
            <span class="info-label">Ulus</span>
            <span class="info-value">${nationHtml}</span>
          </div>
          <div class="info-detail-item">
            <span class="info-label">Nüfus</span>
            <span class="info-value">${town.population || 0}</span>
          </div>
          <div class="info-detail-item">
            <span class="info-label">Kuruluş</span>
            <span class="info-value">${town.founded || 'Bilinmiyor'}</span>
          </div>
          <div class="info-detail-item">
            <span class="info-label">Konum</span>
            <span class="info-value">${town.x}, ${town.y}</span>
          </div>
          ${town.discord ? `
          <div class="info-detail-item">
            <span class="info-label">Discord</span>
            <span class="info-value"><a class="info-link" href="${this.escapeHtml(town.discord)}" target="_blank">Katıl</a></span>
          </div>` : ''}
          ${town.website ? `
          <div class="info-detail-item">
            <span class="info-label">Web</span>
            <span class="info-value"><a class="info-link" href="${this.escapeHtml(town.website)}" target="_blank">Ziyaret Et</a></span>
          </div>` : ''}
          ${town.notes ? `
          <div class="info-detail-item">
            <span class="info-label">Notlar</span>
            <span class="info-value">${this.escapeHtml(town.notes)}</span>
          </div>` : ''}
        </div>
      </div>
    `;

    document.getElementById('infoTitle').textContent = `🏘️ ${town.name}`;
  },

  showRegionInfo(region) {
    const panel = document.getElementById('infoPanel');
    panel.classList.remove('hidden');

    const regionType = DataManager.getRegionTypeLabel(region.type);

    let nationInfo = '';
    if (region.nationId) {
      const nation = DataManager.getNation(region.nationId);
      if (nation) {
        nationInfo = `
          <div class="info-detail-item">
            <span class="info-label">Ulus</span>
            <span class="info-value"><span class="info-nation-badge" style="background:${nation.color}">${this.escapeHtml(nation.name)}</span></span>
          </div>`;
      }
    }

    const content = document.getElementById('infoContent');
    content.innerHTML = `
      <div class="info-card">
        <div style="height:6px;background:${region.color || '#4A90D9'};border-radius:4px;margin-bottom:8px;"></div>
        <div class="info-name">${this.escapeHtml(region.name)}</div>
        <div class="info-description">${this.escapeHtml(region.description || 'Açıklama yok')}</div>
        <div class="info-detail">
          <div class="info-detail-item">
            <span class="info-label">Tür</span>
            <span class="info-value">${regionType}</span>
          </div>
          ${nationInfo}
          <div class="info-detail-item">
            <span class="info-label">Nokta Sayısı</span>
            <span class="info-value">${region.points ? region.points.length : 0}</span>
          </div>
          <div class="info-detail-item">
            <span class="info-label">Renk</span>
            <span class="info-value"><span class="info-color-preview" style="background:${region.color || '#4A90D9'}"></span></span>
          </div>
        </div>
      </div>
    `;

    document.getElementById('infoTitle').textContent = `📍 ${region.name}`;
  },

  hideInfo() {
    document.getElementById('infoPanel').classList.add('hidden');
  },

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  },

  showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  showConfirm(title, message, onConfirm) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmModal').classList.remove('hidden');

    const yesBtn = document.getElementById('btnConfirmYes');
    const closeModal = () => {
      document.getElementById('confirmModal').classList.add('hidden');
    };

    const newYes = yesBtn.cloneNode(true);
    yesBtn.parentNode.replaceChild(newYes, yesBtn);

    newYes.addEventListener('click', () => {
      closeModal();
      if (onConfirm) onConfirm();
    });

    document.querySelectorAll('#confirmModal .modal-close').forEach(el => {
      const newEl = el.cloneNode(true);
      el.parentNode.replaceChild(newEl, el);
      newEl.addEventListener('click', closeModal);
    });
  },

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

window.UIManager = UIManager;
