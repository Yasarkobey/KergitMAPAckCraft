const DataManager = {
  towns: [],
  nations: [],
  regions: [],

  defaultTowns: [],

  defaultNations: [],

  defaultRegions: [],

  regionTypes: {
    nation: { label: 'Ulus Bölgesi', color: '#4A90D9' },
    trade: { label: 'Ticaret Yolu', color: '#9B59B6' },
    military: { label: 'Askeri Bölge', color: '#E91E63' },
    special: { label: 'Özel Bölge', color: '#00BCD4' },
    town: { label: 'Town Bölgesi', color: '#2ECC71' },
    strategic: { label: 'Stratejik Hedef', color: '#FF6B35' }
  },

  init() {
    this.load();
  },

  load() {
    try {
      const saved = localStorage.getItem('kergitulus_map_v2');
      if (saved) {
        const data = JSON.parse(saved);
        this.towns = data.towns || [];
        this.nations = data.nations || [];
        this.regions = data.regions || [];
        return;
      }
    } catch (e) {
      console.warn('localStorage okunamadı, varsayılan kullanılıyor:', e);
    }
    this.resetToDefaults();
  },

  save() {
    try {
      const data = {
        towns: this.towns,
        nations: this.nations,
        regions: this.regions
      };
      localStorage.setItem('kergitulus_map_v2', JSON.stringify(data));
    } catch (e) {
      console.error('Veri kaydedilemedi:', e);
    }
  },

  resetToDefaults() {
    this.towns = JSON.parse(JSON.stringify(this.defaultTowns));
    this.nations = JSON.parse(JSON.stringify(this.defaultNations));
    this.regions = JSON.parse(JSON.stringify(this.defaultRegions));
    this.save();
  },

  generateId(prefix) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `${prefix}_${timestamp}${random}`;
  },

  /* Town Operations */
  getTown(id) {
    return this.towns.find(t => t.id === id);
  },

  getTownsByNation(nationId) {
    return this.towns.filter(t => t.nationId === nationId);
  },

  addTown(data) {
    const town = {
      id: this.generateId('town'),
      ...data,
      x: parseInt(data.x) || 0,
      y: parseInt(data.y) || 0,
      population: parseInt(data.population) || 0
    };
    this.towns.push(town);
    if (town.nationId) {
      const nation = this.getNation(town.nationId);
      if (nation && !nation.townIds.includes(town.id)) {
        nation.townIds.push(town.id);
      }
    }
    this.save();
    return town;
  },

  updateTown(id, data) {
    const idx = this.towns.findIndex(t => t.id === id);
    if (idx === -1) return null;

    const oldNationId = this.towns[idx].nationId;
    const newNationId = data.nationId || '';

    if (oldNationId !== newNationId) {
      const oldNation = this.getNation(oldNationId);
      if (oldNation) {
        oldNation.townIds = oldNation.townIds.filter(tid => tid !== id);
      }
      const newNation = this.getNation(newNationId);
      if (newNation && !newNation.townIds.includes(id)) {
        newNation.townIds.push(id);
      }
    }

    this.towns[idx] = { ...this.towns[idx], ...data };
    this.towns[idx].x = parseInt(this.towns[idx].x) || 0;
    this.towns[idx].y = parseInt(this.towns[idx].y) || 0;
    this.towns[idx].population = parseInt(this.towns[idx].population) || 0;
    this.save();
    return this.towns[idx];
  },

  deleteTown(id) {
    const town = this.getTown(id);
    if (!town) return;

    if (town.nationId) {
      const nation = this.getNation(town.nationId);
      if (nation) {
        nation.townIds = nation.townIds.filter(tid => tid !== id);
      }
    }

    this.regions = this.regions.filter(r => !(r.type === 'town' && r.townId === id));
    this.towns = this.towns.filter(t => t.id !== id);
    this.save();
  },

  /* Nation Operations */
  getNation(id) {
    return this.nations.find(n => n.id === id);
  },

  addNation(data) {
    const nation = {
      id: this.generateId('nation'),
      ...data,
      townIds: data.townIds || []
    };
    this.nations.push(nation);
    this.save();
    return nation;
  },

  updateNation(id, data) {
    const idx = this.nations.findIndex(n => n.id === id);
    if (idx === -1) return null;
    this.nations[idx] = { ...this.nations[idx], ...data };
    this.save();
    return this.nations[idx];
  },

  deleteNation(id) {
    const towns = this.getTownsByNation(id);
    towns.forEach(t => {
      t.nationId = '';
      t.color = '#95A5A6';
    });
    this.regions = this.regions.filter(r => !(r.type === 'nation' && r.nationId === id));
    this.nations = this.nations.filter(n => n.id !== id);
    this.save();
  },

  /* Region Operations */
  getRegion(id) {
    return this.regions.find(r => r.id === id);
  },

  addRegion(data) {
    const region = {
      id: this.generateId('region'),
      ...data,
      opacity: parseFloat(data.opacity) || 0.2
    };
    this.regions.push(region);
    this.save();
    return region;
  },

  updateRegion(id, data) {
    const idx = this.regions.findIndex(r => r.id === id);
    if (idx === -1) return null;
    if (data.opacity) data.opacity = parseFloat(data.opacity);
    this.regions[idx] = { ...this.regions[idx], ...data };
    this.save();
    return this.regions[idx];
  },

  deleteRegion(id) {
    this.regions = this.regions.filter(r => r.id !== id);
    this.save();
  },

  /* Export/Import */
  exportData() {
    return {
      towns: this.towns,
      nations: this.nations,
      regions: this.regions,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
  },

  importData(data) {
    if (!data.towns || !data.nations || !data.regions) {
      throw new Error('Geçersiz veri formatı');
    }
    this.towns = data.towns;
    this.nations = data.nations;
    this.regions = data.regions;
    this.save();
  },

  getRegionTypeLabel(type) {
    return this.regionTypes[type]?.label || type || 'Bilinmeyen';
  }
};

window.DataManager = DataManager;
