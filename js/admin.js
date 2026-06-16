const AdminManager = {
  isAdmin: false,
  password: 'Yahudiavcısı',

  init() {
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        DataManager.save();
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
      });
    });

    document.getElementById('btnAdmin').addEventListener('click', () => {
      if (this.isAdmin) {
        this.openPanel();
      } else {
        this.openLogin();
      }
    });

    document.getElementById('btnLogin').addEventListener('click', () => this.login());
    document.getElementById('loginPassword').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.login();
    });
    document.getElementById('btnLogout').addEventListener('click', () => this.logout());

    this.setupFormModalEvents();
    this.setupTabs();
    this.setupDataActions();
  },

  openLogin() {
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginModal').classList.remove('hidden');
    setTimeout(() => document.getElementById('loginPassword').focus(), 100);
  },

  login() {
    const pwd = document.getElementById('loginPassword').value;
    if (pwd === this.password) {
      this.isAdmin = true;
      document.getElementById('loginModal').classList.add('hidden');
      UIManager.showToast('Giriş başarılı!', 'success');
      this.openPanel();
      document.getElementById('btnAdmin').textContent = '👑 Panel';
    } else {
      UIManager.showToast('Hatalı şifre!', 'error');
    }
  },

  logout() {
    this.isAdmin = false;
    document.getElementById('adminModal').classList.add('hidden');
    UIManager.showToast('Çıkış yapıldı', 'info');
    document.getElementById('btnAdmin').textContent = '👑 Yönetim';
  },

  openPanel() {
    if (!this.isAdmin) return;
    this.refreshTables();
    document.getElementById('adminModal').classList.remove('hidden');
  },

  setupTabs() {
    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panel = document.getElementById(`panel${tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1)}`);
        if (panel) panel.classList.add('active');
        this.refreshTables();
      });
    });
  },

  refreshTables() {
    this.renderTownsTable();
    this.renderNationsTable();
    this.renderRegionsTable();
  },

  renderTownsTable() {
    const tbody = document.getElementById('townsTableBody');
    tbody.innerHTML = '';
    const towns = DataManager.towns;

    document.getElementById('townCount').textContent = `${towns.length} town`;

    towns.forEach(town => {
      const nation = town.nationId ? DataManager.getNation(town.nationId) : null;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${this.escapeHtml(town.name)}</strong></td>
        <td>${nation ? `<span style="color:${nation.color}">${this.escapeHtml(nation.name)}</span>` : '<span class="text-muted">Bağımsız</span>'}</td>
        <td>${town.population || 0}</td>
        <td class="text-muted">${town.x}, ${town.y}</td>
        <td>
          <div class="action-btns">
            <button class="btn btn-sm btn-edit" data-id="${town.id}" data-type="town">✏️</button>
            <button class="btn btn-sm btn-danger btn-delete" data-id="${town.id}" data-type="town">🗑️</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => this.editItem(btn.dataset.type, btn.dataset.id));
    });
    tbody.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => this.deleteItem(btn.dataset.type, btn.dataset.id));
    });

    document.getElementById('btnAddTown').onclick = () => this.showTownForm();
  },

  renderNationsTable() {
    const tbody = document.getElementById('nationsTableBody');
    tbody.innerHTML = '';
    const nations = DataManager.nations;

    document.getElementById('nationCount').textContent = `${nations.length} ulus`;

    nations.forEach(nation => {
      const townCount = DataManager.getTownsByNation(nation.id).length;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong style="color:${nation.color}">${this.escapeHtml(nation.name)}</strong></td>
        <td>${this.escapeHtml(nation.leader || '-')}</td>
        <td>${townCount}</td>
        <td><span class="color-dot" style="background:${nation.color}"></span></td>
        <td>
          <div class="action-btns">
            <button class="btn btn-sm btn-edit" data-id="${nation.id}" data-type="nation">✏️</button>
            <button class="btn btn-sm btn-danger btn-delete" data-id="${nation.id}" data-type="nation">🗑️</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => this.editItem(btn.dataset.type, btn.dataset.id));
    });
    tbody.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => this.deleteItem(btn.dataset.type, btn.dataset.id));
    });

    document.getElementById('btnAddNation').onclick = () => this.showNationForm();
  },

  renderRegionsTable() {
    const tbody = document.getElementById('regionsTableBody');
    tbody.innerHTML = '';
    const regions = DataManager.regions;

    document.getElementById('regionCount').textContent = `${regions.length} bölge`;

    regions.forEach(region => {
      const typeLabel = DataManager.getRegionTypeLabel(region.type);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${this.escapeHtml(region.name)}</strong></td>
        <td>${typeLabel}</td>
        <td>${region.points ? region.points.length : 0}</td>
        <td><span class="color-dot" style="background:${region.color || '#4A90D9'}"></span></td>
        <td>
          <div class="action-btns">
            <button class="btn btn-sm btn-edit" data-id="${region.id}" data-type="region">✏️</button>
            <button class="btn btn-sm btn-danger btn-delete" data-id="${region.id}" data-type="region">🗑️</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => this.editItem(btn.dataset.type, btn.dataset.id));
    });
    tbody.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => this.deleteItem(btn.dataset.type, btn.dataset.id));
    });

    document.getElementById('btnAddRegion').onclick = () => this.showRegionForm();
    const startDrawing = (type, color, label) => {
      document.getElementById('adminModal').classList.add('hidden');
      UIManager.showToast(`${label}: Haritada tıklayarak çizin, çift tıklayarak bitirin.`, 'info', 6000);
      MapSystem.startDrawing(type, color, (result) => {
        AdminManager.showRegionFormFromDrawing(result);
      });
    };

    document.getElementById('btnDrawRegion').onclick = () => startDrawing('town', '#4A90D9', 'Bölge çizimi');
    document.getElementById('btnDrawStrategic').onclick = () => startDrawing('strategic', '#FF6B35', 'Stratejik Hedef');
  },

  editItem(type, id) {
    if (type === 'town') {
      const town = DataManager.getTown(id);
      if (town) this.showTownForm(town);
    } else if (type === 'nation') {
      const nation = DataManager.getNation(id);
      if (nation) this.showNationForm(nation);
    } else if (type === 'region') {
      const region = DataManager.getRegion(id);
      if (region) this.showRegionForm(region);
    }
  },

  deleteItem(type, id) {
    let name = '';
    if (type === 'town') {
      const t = DataManager.getTown(id);
      name = t ? t.name : id;
    } else if (type === 'nation') {
      const n = DataManager.getNation(id);
      name = n ? n.name : id;
    } else {
      const r = DataManager.getRegion(id);
      name = r ? r.name : id;
    }

    UIManager.showConfirm(
      'Silme Onayı',
      `"${name}" silinecek. Emin misiniz?`,
      () => {
        if (type === 'town') {
          DataManager.deleteTown(id);
        } else if (type === 'nation') {
          DataManager.deleteNation(id);
        } else {
          DataManager.deleteRegion(id);
        }
        this.refreshTables();
        UIManager.showToast(`"${name}" silindi.`, 'success');
        MapSystem.needsRender = true;
      }
    );
  },

  setupFormModalEvents() {
    document.getElementById('btnFormSave').addEventListener('click', () => this.saveForm());
  },

  showTownForm(town) {
    const modal = document.getElementById('formModal');
    const title = document.getElementById('formModalTitle');
    title.textContent = town ? `✏️ ${town.name} Düzenle` : '🏘️ Yeni Town';

    const nations = DataManager.nations;
    const nationOptions = '<option value="">Bağımsız</option>' +
      nations.map(n => `<option value="${n.id}" style="color:${n.color}">${this.escapeHtml(n.name)}</option>`).join('');

    const body = document.getElementById('formModalBody');
    body.innerHTML = `
      <input type="hidden" id="formId" value="${town ? town.id : ''}">
      <input type="hidden" id="formType" value="town">
      <div class="form-group">
        <label>Town İsmi</label>
        <input type="text" id="fName" value="${town ? this.escapeHtml(town.name) : ''}" required>
      </div>
      <div class="form-group">
        <label>Açıklama</label>
        <textarea id="fDescription">${town ? this.escapeHtml(town.description || '') : ''}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Ulus</label>
          <select id="fNationId">${nationOptions}</select>
        </div>
        <div class="form-group">
          <label>Nüfus</label>
          <input type="number" id="fPopulation" value="${town ? town.population : 0}" min="0">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>X Koordinatı</label>
          <input type="number" id="fX" value="${town ? town.x : 500}">
        </div>
        <div class="form-group">
          <label>Y Koordinatı</label>
          <input type="number" id="fY" value="${town ? town.y : 500}">
        </div>
      </div>
      <div class="form-group">
        <label>Kuruluş Tarihi</label>
        <input type="date" id="fFounded" value="${town ? town.founded || '' : ''}">
      </div>
      <div class="form-group">
        <label>Bayrak Görseli (URL veya base64)</label>
        <input type="text" id="fFlag" value="${town ? this.escapeHtml(town.flag || '') : ''}" placeholder="Bayrak URL'si">
        <div class="form-help">Resim yüklemek için: <input type="file" id="fFlagUpload" accept="image/*" style="display:inline;width:auto;font-size:12px;padding:2px 4px;"></div>
      </div>
      <div class="form-group">
        <label>Discord Bağlantısı</label>
        <input type="url" id="fDiscord" value="${town ? this.escapeHtml(town.discord || '') : ''}" placeholder="https://discord.gg/...">
      </div>
      <div class="form-group">
        <label>Web Sitesi</label>
        <input type="url" id="fWebsite" value="${town ? this.escapeHtml(town.website || '') : ''}" placeholder="https://...">
      </div>
      <div class="form-group">
        <label>Ek Notlar</label>
        <textarea id="fNotes">${town ? this.escapeHtml(town.notes || '') : ''}</textarea>
      </div>
    `;

    if (town && town.nationId) {
      body.querySelector('#fNationId').value = town.nationId;
    }

    body.querySelector('#fFlagUpload').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          body.querySelector('#fFlag').value = ev.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    this.currentFormType = 'town';
    modal.classList.remove('hidden');
  },

  showNationForm(nation) {
    const modal = document.getElementById('formModal');
    const title = document.getElementById('formModalTitle');
    title.textContent = nation ? `✏️ ${nation.name} Düzenle` : '🏰 Yeni Ulus';

    const body = document.getElementById('formModalBody');
    body.innerHTML = `
      <input type="hidden" id="formId" value="${nation ? nation.id : ''}">
      <input type="hidden" id="formType" value="nation">
      <div class="form-group">
        <label>Ulus İsmi</label>
        <input type="text" id="fName" value="${nation ? this.escapeHtml(nation.name) : ''}" required>
      </div>
      <div class="form-group">
        <label>Açıklama</label>
        <textarea id="fDescription">${nation ? this.escapeHtml(nation.description || '') : ''}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Lider</label>
          <input type="text" id="fLeader" value="${nation ? this.escapeHtml(nation.leader || '') : ''}">
        </div>
        <div class="form-group">
          <label>Renk</label>
          <div class="color-input">
            <input type="color" id="fColor" value="${nation ? nation.color : '#4A90D9'}">
            <input type="text" id="fColorText" value="${nation ? nation.color : '#4A90D9'}">
          </div>
        </div>
      </div>
      <div class="form-group">
        <label>Bayrak Görseli (URL veya base64)</label>
        <input type="text" id="fFlag" value="${nation ? this.escapeHtml(nation.flag || '') : ''}" placeholder="Bayrak URL'si">
        <div class="form-help">Resim yüklemek için: <input type="file" id="fFlagUpload" accept="image/*" style="display:inline;width:auto;font-size:12px;"></div>
      </div>
      <div class="form-group">
        <label>Discord Bağlantısı</label>
        <input type="url" id="fDiscord" value="${nation ? this.escapeHtml(nation.discord || '') : ''}" placeholder="https://discord.gg/...">
      </div>
      <div class="form-group">
        <label>Diplomatik Notlar</label>
        <textarea id="fDiplomaticNotes">${nation ? this.escapeHtml(nation.diplomaticNotes || '') : ''}</textarea>
      </div>
    `;

    body.querySelector('#fFlagUpload').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          body.querySelector('#fFlag').value = ev.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    const colorInput = body.querySelector('#fColor');
    const colorText = body.querySelector('#fColorText');
    colorInput.addEventListener('input', () => { colorText.value = colorInput.value; });
    colorText.addEventListener('input', () => { colorInput.value = colorText.value; });

    this.currentFormType = 'nation';
    modal.classList.remove('hidden');
  },

  showRegionForm(region) {
    const modal = document.getElementById('formModal');
    const title = document.getElementById('formModalTitle');
    title.textContent = region ? `✏️ ${region.name} Düzenle` : '📍 Yeni Bölge';

    const regionTypes = Object.entries(DataManager.regionTypes)
      .map(([key, val]) => `<option value="${key}" ${region && region.type === key ? 'selected' : ''}>${val.label}</option>`)
      .join('');

    const nations = DataManager.nations;
    const nationOptions = '<option value="">Bağlı değil</option>' +
      nations.map(n => `<option value="${n.id}" ${region && region.nationId === n.id ? 'selected' : ''}>${this.escapeHtml(n.name)}</option>`).join('');

    const body = document.getElementById('formModalBody');
    body.innerHTML = `
      <input type="hidden" id="formId" value="${region ? region.id : ''}">
      <input type="hidden" id="formType" value="region">
      <div class="form-group">
        <label>Bölge İsmi</label>
        <input type="text" id="fName" value="${region ? this.escapeHtml(region.name) : ''}" required>
      </div>
      <div class="form-group">
        <label>Açıklama</label>
        <textarea id="fDescription">${region ? this.escapeHtml(region.description || '') : ''}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Bölge Türü</label>
          <select id="fType">${regionTypes}</select>
        </div>
        <div class="form-group">
          <label>Bağlı Ulus</label>
          <select id="fNationId">${nationOptions}</select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Renk</label>
          <div class="color-input">
            <input type="color" id="fColor" value="${region ? region.color : '#4A90D9'}">
            <input type="text" id="fColorText" value="${region ? region.color : '#4A90D9'}">
          </div>
        </div>
        <div class="form-group">
          <label>Opaklık (0-1)</label>
          <input type="number" id="fOpacity" value="${region ? region.opacity : 0.2}" min="0" max="1" step="0.05">
        </div>
      </div>
      <div class="form-group">
        <label>Noktalar (JSON formatı)</label>
        <textarea id="fPoints" rows="4" style="font-family:monospace;font-size:12px;">${region && region.points ? JSON.stringify(region.points) : '[{"x":0,"y":0},{"x":100,"y":0},{"x":100,"y":100},{"x":0,"y":100}]'}</textarea>
        <div class="form-help">Koordinat noktaları JSON dizisi formatında. Her nokta: {"x": sayı, "y": sayı}</div>
      </div>
    `;

    const colorInput = body.querySelector('#fColor');
    const colorText = body.querySelector('#fColorText');
    colorInput.addEventListener('input', () => { colorText.value = colorInput.value; });
    colorText.addEventListener('input', () => { colorInput.value = colorText.value; });

    this.currentFormType = 'region';
    modal.classList.remove('hidden');
  },

  showRegionFormFromDrawing(drawing) {
    const modal = document.getElementById('formModal');
    const title = document.getElementById('formModalTitle');
    title.textContent = '📍 Çizilen Bölgeyi Kaydet';

    const regionTypes = Object.entries(DataManager.regionTypes)
      .map(([key, val]) => `<option value="${key}" ${key === drawing.type ? 'selected' : ''}>${val.label}</option>`)
      .join('');

    const nations = DataManager.nations;
    const nationOptions = '<option value="">Bağlı değil</option>' +
      nations.map(n => `<option value="${n.id}">${this.escapeHtml(n.name)}</option>`).join('');

    const body = document.getElementById('formModalBody');
    body.innerHTML = `
      <input type="hidden" id="formId" value="">
      <input type="hidden" id="formType" value="region">
      <div class="form-group">
        <label>Bölge İsmi</label>
        <input type="text" id="fName" placeholder="Yeni Bölge" required>
      </div>
      <div class="form-group">
        <label>Açıklama</label>
        <textarea id="fDescription"></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Bölge Türü</label>
          <select id="fType">${regionTypes}</select>
        </div>
        <div class="form-group">
          <label>Bağlı Ulus</label>
          <select id="fNationId">${nationOptions}</select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Renk</label>
          <div class="color-input">
            <input type="color" id="fColor" value="${drawing.color}">
            <input type="text" id="fColorText" value="${drawing.color}">
          </div>
        </div>
        <div class="form-group">
          <label>Opaklık (0-1)</label>
          <input type="number" id="fOpacity" value="0.2" min="0" max="1" step="0.05">
        </div>
      </div>
      <div class="form-group">
        <label>Noktalar</label>
        <textarea id="fPoints" rows="4" style="font-family:monospace;font-size:12px;">${JSON.stringify(drawing.points)}</textarea>
      </div>
    `;

    const colorInput = body.querySelector('#fColor');
    const colorText = body.querySelector('#fColorText');
    colorInput.addEventListener('input', () => { colorText.value = colorInput.value; });
    colorText.addEventListener('input', () => { colorInput.value = colorText.value; });

    this.currentFormType = 'region';
    modal.classList.remove('hidden');
  },

  saveForm() {
    const type = document.getElementById('formType').value;
    const id = document.getElementById('formId').value;

    if (type === 'town') {
      const data = {
        name: document.getElementById('fName').value.trim(),
        description: document.getElementById('fDescription').value.trim(),
        nationId: document.getElementById('fNationId').value,
        population: parseInt(document.getElementById('fPopulation').value) || 0,
        x: parseInt(document.getElementById('fX').value) || 0,
        y: parseInt(document.getElementById('fY').value) || 0,
        founded: document.getElementById('fFounded').value,
        flag: document.getElementById('fFlag').value.trim(),
        discord: document.getElementById('fDiscord').value.trim(),
        website: document.getElementById('fWebsite').value.trim(),
        notes: document.getElementById('fNotes').value.trim()
      };

      if (!data.name) {
        UIManager.showToast('Town ismi gerekli!', 'error');
        return;
      }

      if (id) {
        DataManager.updateTown(id, data);
        UIManager.showToast('Town güncellendi!', 'success');
      } else {
        const nation = data.nationId ? DataManager.getNation(data.nationId) : null;
        if (nation) data.color = nation.color;
        DataManager.addTown(data);
        UIManager.showToast('Town eklendi!', 'success');
      }

    } else if (type === 'nation') {
      const data = {
        name: document.getElementById('fName').value.trim(),
        description: document.getElementById('fDescription').value.trim(),
        leader: document.getElementById('fLeader').value.trim(),
        color: document.getElementById('fColor').value,
        flag: document.getElementById('fFlag').value.trim(),
        discord: document.getElementById('fDiscord').value.trim(),
        diplomaticNotes: document.getElementById('fDiplomaticNotes').value.trim()
      };

      if (!data.name) {
        UIManager.showToast('Ulus ismi gerekli!', 'error');
        return;
      }

      if (id) {
        DataManager.updateNation(id, data);
        const towns = DataManager.getTownsByNation(id);
        towns.forEach(t => {
          t.color = data.color;
        });
        DataManager.save();
        UIManager.showToast('Ulus güncellendi!', 'success');
      } else {
        DataManager.addNation(data);
        UIManager.showToast('Ulus eklendi!', 'success');
      }

    } else if (type === 'region') {
      let points;
      try {
        points = JSON.parse(document.getElementById('fPoints').value.trim());
        if (!Array.isArray(points) || points.length < 3) throw 'invalid';
      } catch {
        UIManager.showToast('Geçersiz nokta formatı! En az 3 nokta girin.', 'error');
        return;
      }

      const data = {
        name: document.getElementById('fName').value.trim(),
        description: document.getElementById('fDescription').value.trim(),
        type: document.getElementById('fType').value,
        nationId: document.getElementById('fNationId').value,
        color: document.getElementById('fColor').value,
        opacity: parseFloat(document.getElementById('fOpacity').value) || 0.2,
        points: points
      };

      if (!data.name) {
        UIManager.showToast('Bölge ismi gerekli!', 'error');
        return;
      }

      if (id) {
        DataManager.updateRegion(id, data);
        UIManager.showToast('Bölge güncellendi!', 'success');
      } else {
        DataManager.addRegion(data);
        UIManager.showToast('Bölge eklendi!', 'success');
      }
    }

    document.getElementById('formModal').classList.add('hidden');
    this.refreshTables();
    MapSystem.needsRender = true;
  },

  setupDataActions() {
    document.getElementById('btnExport').addEventListener('click', () => {
      const data = DataManager.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kergitulus_yedek_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      UIManager.showToast('Veriler dışa aktarıldı!', 'success');
    });

    document.getElementById('btnImport').addEventListener('click', () => {
      const fileInput = document.getElementById('importFile');
      const file = fileInput.files[0];
      if (!file) {
        UIManager.showToast('Lütfen bir JSON dosyası seçin.', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          DataManager.importData(data);
          this.refreshTables();
          MapSystem.needsRender = true;
          UIManager.showToast('Veriler içe aktarıldı!', 'success');
          fileInput.value = '';
        } catch {
          UIManager.showToast('Geçersiz JSON dosyası!', 'error');
        }
      };
      reader.readAsText(file);
    });

    document.getElementById('btnResetData').addEventListener('click', () => {
      UIManager.showConfirm(
        'Veriyi Sıfırla',
        'Tüm veriler varsayılana sıfırlanacak. Bu işlem geri alınamaz! Emin misiniz?',
        () => {
          DataManager.resetToDefaults();
          MapSystem.needsRender = true;
          this.refreshTables();
          UIManager.showToast('Veriler sıfırlandı!', 'success');
        }
      );
    });
  },

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

window.AdminManager = AdminManager;
