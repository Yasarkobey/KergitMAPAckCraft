const MapSystem = {
  canvas: null,
  drawCanvas: null,
  ctx: null,
  drawCtx: null,
  miniCanvas: null,
  miniCtx: null,

  worldWidth: 2000,
  worldHeight: 2000,
  bgImage: null,
  bgReady: false,

  camera: {
    x: 1000,
    y: 1000,
    zoom: 1
  },

  minZoom: 0.1,
  maxZoom: 5,
  fitZoom: 1,

  isDragging: false,
  dragStart: { x: 0, y: 0 },
  cameraStart: { x: 0, y: 0 },
  draggingTown: null,
  draggingTownStart: { x: 0, y: 0 },

  layers: {
    towns: true,
    nations: true,
    regions: true,
    grid: true,
    labels: true,
    regionLabels: true
  },

  hoveredTown: null,
  hoveredRegion: null,
  selectedItem: null,

  drawingMode: false,
  drawingPoints: [],
  drawingType: 'town',
  drawingColor: '#4A90D9',
  onDrawingComplete: null,

  animationId: null,
  needsRender: true,

  init() {
    this.canvas = document.getElementById('mapCanvas');
    this.drawCanvas = document.getElementById('drawCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.drawCtx = this.drawCanvas.getContext('2d');
    this.miniCanvas = document.getElementById('miniMapCanvas');
    this.miniCtx = this.miniCanvas.getContext('2d');

    this.resize();
    this.updateBounds();
    this.setupEvents();
    this.setupLayerToggles();

    window.addEventListener('resize', () => {
      this.resize();
      this.updateBounds();
      this.needsRender = true;
    });

    this.bgImage = new Image();
    this.bgImage.onload = () => {
      this.worldWidth = this.bgImage.naturalWidth;
      this.worldHeight = this.bgImage.naturalHeight;
      this.bgReady = true;
      this.resize();
      this.updateBounds();
      this.resetView();
      document.getElementById('statusInfo').textContent = `Harita: ${this.worldWidth}×${this.worldHeight}`;
      console.log('✅ Arkaplan harita yüklendi:', this.worldWidth, 'x', this.worldHeight);
    };
    this.bgImage.onerror = () => {
      console.warn('⚠️ image.png yüklenemedi - dosya mevcut değil. Varsayılan arkaplan kullanılıyor.');
      document.getElementById('statusInfo').textContent = 'image.png bulunamadı';
    };
    this.bgImage.src = 'image.png';

    this.render();
  },

  resize() {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
    this.drawCanvas.width = this.drawCanvas.clientWidth;
    this.drawCanvas.height = this.drawCanvas.clientHeight;

    const miniContainer = document.getElementById('miniMap');
    if (miniContainer) {
      this.miniCanvas.width = miniContainer.clientWidth;
      this.miniCanvas.height = miniContainer.clientHeight;
    }
  },

  setupEvents() {
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', (e) => {
      if (this.draggingTown) {
        delete this.draggingTown._dragOrigX;
        delete this.draggingTown._dragOrigY;
        DataManager.save();
        this.draggingTown = null;
      }
      this.onMouseUp(e);
    });
    this.canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    this.canvas.addEventListener('click', this.onClick.bind(this));
    this.canvas.addEventListener('dblclick', this.onDblClick.bind(this));
    this.canvas.addEventListener('contextmenu', this.onContextMenu.bind(this));
    this.canvas.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.drawingMode) {
        if (this.drawingPoints.length >= 3) {
          this.completeDrawing();
        }
      }
    });
    this.canvas.setAttribute('tabindex', '0');

    this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));

    document.getElementById('btnZoomIn').addEventListener('click', () => this.zoomAtCenter(1.3));
    document.getElementById('btnZoomOut').addEventListener('click', () => this.zoomAtCenter(1 / 1.3));
    document.getElementById('btnResetView').addEventListener('click', () => this.resetView());

    document.getElementById('miniMap').addEventListener('click', (e) => {
      const rect = this.miniCanvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const scaleX = this.worldWidth / this.miniCanvas.width;
      const scaleY = this.worldHeight / this.miniCanvas.height;
      this.camera.x = mx * scaleX;
      this.camera.y = my * scaleY;
      this.clampCamera();
      this.needsRender = true;
    });
  },

  setupLayerToggles() {
    document.querySelectorAll('[data-layer]').forEach(cb => {
      cb.addEventListener('change', (e) => {
        this.layers[e.target.dataset.layer] = e.target.checked;
        this.needsRender = true;
      });
    });
  },

  /* Coordinate transforms */
  worldToScreen(wx, wy) {
    const sx = (wx - this.camera.x) * this.camera.zoom + this.canvas.width / 2;
    const sy = (wy - this.camera.y) * this.camera.zoom + this.canvas.height / 2;
    return { x: sx, y: sy };
  },

  screenToWorld(sx, sy) {
    const wx = (sx - this.canvas.width / 2) / this.camera.zoom + this.camera.x;
    const wy = (sy - this.canvas.height / 2) / this.camera.zoom + this.camera.y;
    return { x: wx, y: wy };
  },

  updateBounds() {
    this.fitZoom = Math.min(
      this.canvas.width / this.worldWidth,
      this.canvas.height / this.worldHeight
    );
    this.minZoom = 0.23;
    this.clampCamera();
  },

  clampCamera() {
    const vw = this.canvas.width / this.camera.zoom;
    const vh = this.canvas.height / this.camera.zoom;
    const maxX = this.worldWidth - vw / 2;
    const maxY = this.worldHeight - vh / 2;
    const minX = vw / 2;
    const minY = vh / 2;

    if (vw >= this.worldWidth) {
      this.camera.x = this.worldWidth / 2;
    } else {
      this.camera.x = Math.max(minX, Math.min(maxX, this.camera.x));
    }
    if (vh >= this.worldHeight) {
      this.camera.y = this.worldHeight / 2;
    } else {
      this.camera.y = Math.max(minY, Math.min(maxY, this.camera.y));
    }
  },

  zoomAtCenter(factor) {
    const newZoom = Math.min(this.maxZoom, Math.max(this.minZoom, this.camera.zoom * factor));
    this.camera.zoom = newZoom;
    this.clampCamera();
    this.updateStatus();
    this.needsRender = true;
  },

  resetView() {
    this.camera.x = this.worldWidth / 2;
    this.camera.y = this.worldHeight / 2;
    this.camera.zoom = this.fitZoom;
    this.clampCamera();
    this.updateStatus();
    this.needsRender = true;
  },

  focusOn(wx, wy) {
    this.camera.x = wx;
    this.camera.y = wy;
    this.camera.zoom = Math.max(this.fitZoom * 1.5, 2);
    this.clampCamera();
    this.updateStatus();
    this.needsRender = true;
  },

  /* Mouse events */
  onMouseDown(e) {
    if (e.button === 0) {
      if (this.drawingMode) return;
      const rect = this.canvas.getBoundingClientRect();
      const world = this.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      const hit = this.hitTest(world.x, world.y);
      if (hit && hit.type === 'town' && typeof AdminManager !== 'undefined' && AdminManager.isAdmin) {
        this.draggingTown = hit.item;
        this.draggingTown._dragOrigX = hit.item.x;
        this.draggingTown._dragOrigY = hit.item.y;
        this.draggingTownStart = { x: e.clientX, y: e.clientY };
        this.canvas.style.cursor = 'grabbing';
        return;
      }
      this.isDragging = true;
      this.dragStart = { x: e.clientX, y: e.clientY };
      this.cameraStart = { x: this.camera.x, y: this.camera.y };
      this.canvas.style.cursor = 'grabbing';
    }
  },

  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const world = this.screenToWorld(mx, my);

    document.getElementById('statusCoords').textContent = `Koordinat: ${Math.round(world.x)}, ${Math.round(world.y)}`;

    if (this.draggingTown) {
      const dx = (e.clientX - this.draggingTownStart.x) / this.camera.zoom;
      const dy = (e.clientY - this.draggingTownStart.y) / this.camera.zoom;
      this.draggingTown.x = this.draggingTown._dragOrigX + dx;
      this.draggingTown.y = this.draggingTown._dragOrigY + dy;
      this.needsRender = true;
      return;
    }
    if (this.isDragging && !this.drawingMode) {
      const dx = (e.clientX - this.dragStart.x) / this.camera.zoom;
      const dy = (e.clientY - this.dragStart.y) / this.camera.zoom;
      this.camera.x = this.cameraStart.x - dx;
      this.camera.y = this.cameraStart.y - dy;
      this.clampCamera();
      this.needsRender = true;
    }

    if (this.drawingMode) {
      this.drawingMousePos = world;
      this.needsRender = true;
    }

    const hit = this.hitTest(world.x, world.y);
    if (hit) {
      const isAdmin = typeof AdminManager !== 'undefined' && AdminManager.isAdmin;
      this.canvas.style.cursor = this.drawingMode ? 'crosshair' : 'pointer';
      this.hoveredTown = hit.type === 'town' ? hit.item : null;
      this.hoveredRegion = hit.type === 'region' ? hit.item : null;
      if (hit.type === 'town' && isAdmin) {
        document.getElementById('statusInfo').textContent = '🏘️ Sürüklemek için tıklayın';
      }
    } else {
      this.canvas.style.cursor = this.drawingMode ? 'crosshair' : 'grab';
      this.hoveredTown = null;
      this.hoveredRegion = null;
      if (!this.draggingTown) {
        document.getElementById('statusInfo').textContent = '';
      }
    }

    if (this.hoveredTown || this.hoveredRegion) {
      this.needsRender = true;
    }
  },

  onMouseUp() {
    if (this.draggingTown) {
      delete this.draggingTown._dragOrigX;
      delete this.draggingTown._dragOrigY;
      DataManager.save();
      this.draggingTown = null;
      this.canvas.style.cursor = this.drawingMode ? 'crosshair' : 'grab';
      return;
    }
    if (this.isDragging) {
      this.isDragging = false;
      this.canvas.style.cursor = this.drawingMode ? 'crosshair' : 'grab';
    }
  },

  onWheel(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const world = this.screenToWorld(mx, my);

    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const newZoom = Math.min(this.maxZoom, Math.max(this.minZoom, this.camera.zoom * factor));

      this.camera.x = world.x - (mx - this.canvas.width / 2) / newZoom;
      this.camera.y = world.y - (my - this.canvas.height / 2) / newZoom;
      this.camera.zoom = newZoom;
      this.clampCamera();

      this.updateStatus();
    this.needsRender = true;
  },

  onClick(e) {
    if (this.isDragging) {
      const dx = Math.abs(e.clientX - this.dragStart.x);
      const dy = Math.abs(e.clientY - this.dragStart.y);
      if (dx > 5 || dy > 5) return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const world = this.screenToWorld(mx, my);

    if (this.drawingMode) {
      this.drawingPoints.push({ x: world.x, y: world.y });
      document.getElementById('drawPointCount').textContent = this.drawingPoints.length;
      this.needsRender = true;
      return;
    }

    const hit = this.hitTest(world.x, world.y);
    if (hit) {
      this.selectedItem = hit;
      this.showInfo(hit);
    } else {
      this.selectedItem = null;
      UIManager.hideInfo();
    }
  },

  onDblClick(e) {
    if (!this.drawingMode) return;
    this.completeDrawing();
  },

  onContextMenu(e) {
    e.preventDefault();
    if (this.drawingMode && this.drawingPoints.length > 0) {
      this.drawingPoints.pop();
      document.getElementById('drawPointCount').textContent = this.drawingPoints.length;
      this.needsRender = true;
    }
  },

  /* Touch events */
  onTouchStart(e) {
    if (e.touches.length === 1 && !this.drawingMode) {
      this.isDragging = true;
      this.dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      this.cameraStart = { x: this.camera.x, y: this.camera.y };
    }
    if (e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0], t2 = e.touches[1];
      this.lastTouchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    }
  },

  onTouchMove(e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0], t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      if (this.lastTouchDist && this.lastTouchDist > 0) {
        const factor = dist / this.lastTouchDist;
        const rect = this.canvas.getBoundingClientRect();
        const mx = (t1.clientX + t2.clientX) / 2 - rect.left;
        const my = (t1.clientY + t2.clientY) / 2 - rect.top;
        const world = this.screenToWorld(mx, my);
        const newZoom = Math.min(this.maxZoom, Math.max(this.minZoom, this.camera.zoom * factor));
        this.camera.x = world.x - (mx - this.canvas.width / 2) / newZoom;
        this.camera.y = world.y - (my - this.canvas.height / 2) / newZoom;
        this.camera.zoom = newZoom;
        this.clampCamera();
        this.needsRender = true;
      }
      this.lastTouchDist = dist;
      return;
    }
    if (e.touches.length === 1 && this.isDragging) {
      const dx = Math.abs(e.touches[0].clientX - this.dragStart.x);
      const dy = Math.abs(e.touches[0].clientY - this.dragStart.y);
      if (dx > 5 || dy > 5) {
        e.preventDefault();
        const moveX = (e.touches[0].clientX - this.dragStart.x) / this.camera.zoom;
        const moveY = (e.touches[0].clientY - this.dragStart.y) / this.camera.zoom;
        this.camera.x = this.cameraStart.x - moveX;
        this.camera.y = this.cameraStart.y - moveY;
        this.clampCamera();
        this.needsRender = true;
      }
    }
  },

  onTouchEnd() {
    this.isDragging = false;
    this.lastTouchDist = null;
  },

  /* Hit testing - towns first (on top), then regions */
  hitTest(wx, wy) {
    const towns = DataManager.towns || [];
    for (let i = towns.length - 1; i >= 0; i--) {
      const town = towns[i];
      const dist = Math.hypot(wx - town.x, wy - town.y);
      if (dist < 20 / this.camera.zoom + 8) {
        return { type: 'town', item: town };
      }
    }
    const regions = DataManager.regions || [];
    for (let i = regions.length - 1; i >= 0; i--) {
      const region = regions[i];
      if (region.points && this.pointInPolygon(wx, wy, region.points)) {
        return { type: 'region', item: region };
      }
    }
    return null;
  },

  pointInPolygon(px, py, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  },

  showInfo(hit) {
    if (hit.type === 'town') {
      UIManager.showTownInfo(hit.item);
    } else if (hit.type === 'region') {
      UIManager.showRegionInfo(hit.item);
    }
  },

  updateStatus() {
    document.getElementById('statusZoom').textContent = `Zoom: %${Math.round(this.camera.zoom * 100)}`;
    document.getElementById('zoomLevel').textContent = `%${Math.round(this.camera.zoom * 100)}`;
  },

  /* Main Render Loop */
  render() {
    this.updateStatus();

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    this.drawBackground(ctx, w, h);

    if (this.layers.grid) {
      this.drawGrid(ctx, w, h);
    }

    if (this.layers.regions) {
      this.drawRegions(ctx);
    }

    if (this.layers.nations) {
      this.drawNationBorders(ctx);
    }

    if (this.layers.towns) {
      this.drawTowns(ctx);
    }

    if (this.layers.labels) {
      this.drawLabels(ctx);
    }

    this.drawDrawingPreview(ctx);
    this.renderMiniMap();

    if (this.needsRender) {
      this.needsRender = false;
    }
  },

  drawBackground(ctx, w, h) {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    const dx = (0 - this.camera.x) * this.camera.zoom + w / 2;
    const dy = (0 - this.camera.y) * this.camera.zoom + h / 2;
    const dw = this.worldWidth * this.camera.zoom;
    const dh = this.worldHeight * this.camera.zoom;

    if (this.bgReady && this.bgImage) {
      ctx.drawImage(this.bgImage, dx, dy, dw, dh);
    } else {
      ctx.fillStyle = '#141a24';
      ctx.fillRect(dx, dy, dw, dh);
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 2;
    ctx.strokeRect(dx, dy, dw, dh);
  },

  drawGrid(ctx, w, h) {
    const gridSize = 100;
    const startX = Math.floor((this.camera.x - w / 2 / this.camera.zoom) / gridSize) * gridSize;
    const startY = Math.floor((this.camera.y - h / 2 / this.camera.zoom) / gridSize) * gridSize;
    const endX = this.camera.x + w / 2 / this.camera.zoom;
    const endY = this.camera.y + h / 2 / this.camera.zoom;

    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = startX; x <= endX; x += gridSize) {
      const sx = (x - this.camera.x) * this.camera.zoom + w / 2;
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
    }

    for (let y = startY; y <= endY; y += gridSize) {
      const sy = (y - this.camera.y) * this.camera.zoom + h / 2;
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
    }

    ctx.stroke();
  },

  drawRegions(ctx) {
    const regions = DataManager.regions || [];

    regions.forEach(region => {
      if (!region.points || region.points.length < 3) return;

      const screenPoints = region.points.map(p => this.worldToScreen(p.x, p.y));

      ctx.beginPath();
      ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
      for (let i = 1; i < screenPoints.length; i++) {
        ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
      }
      ctx.closePath();

      ctx.fillStyle = region.color || '#4A90D9';
      ctx.globalAlpha = region.opacity || 0.2;
      ctx.fill();
      ctx.globalAlpha = 1;

      const isHovered = this.hoveredRegion && this.hoveredRegion.id === region.id;
      ctx.strokeStyle = isHovered ? '#fff' : (region.color || '#4A90D9');
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.stroke();
    });
  },

  drawNationBorders(ctx) {
    const nations = DataManager.nations || [];
    const w = this.canvas.width;
    const h = this.canvas.height;

    nations.forEach(nation => {
      const towns = DataManager.getTownsByNation(nation.id);
      if (towns.length < 2) return;

      const centerX = towns.reduce((sum, t) => sum + t.x, 0) / towns.length;
      const centerY = towns.reduce((sum, t) => sum + t.y, 0) / towns.length;

      const sCenter = this.worldToScreen(centerX, centerY);
      if (sCenter.x < -200 || sCenter.x > w + 200 || sCenter.y < -200 || sCenter.y > h + 200) return;

      const radius = Math.max(
        ...towns.map(t => Math.hypot(t.x - centerX, t.y - centerY))
      ) * this.camera.zoom + 30;

      ctx.beginPath();
      ctx.arc(sCenter.x, sCenter.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = nation.color;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = nation.color;
      ctx.globalAlpha = 0.05;
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  },

  drawTowns(ctx) {
    const towns = DataManager.towns || [];
    const w = this.canvas.width;
    const h = this.canvas.height;

    towns.forEach(town => {
      const sp = this.worldToScreen(town.x, town.y);
      if (sp.x < -50 || sp.x > w + 50 || sp.y < -50 || sp.y > h + 50) return;

      const size = Math.max(6, 10 * Math.min(1, this.camera.zoom * 0.5 + 0.5));
      const isHovered = this.hoveredTown && this.hoveredTown.id === town.id;

      ctx.beginPath();
      ctx.arc(sp.x, sp.y, isHovered ? size + 3 : size, 0, Math.PI * 2);
      ctx.fillStyle = town.color || '#95A5A6';
      ctx.fill();

      ctx.strokeStyle = isHovered ? '#fff' : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.stroke();
    });
  },

  drawLabels(ctx) {
    const towns = DataManager.towns || [];
    const w = this.canvas.width;
    const h = this.canvas.height;

    if (this.camera.zoom < 0.3) return;

    ctx.font = `${Math.max(11, Math.min(14, 14 * this.camera.zoom * 0.6))}px 'Segoe UI', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    towns.forEach(town => {
      const sp = this.worldToScreen(town.x, town.y);
      if (sp.x < -50 || sp.x > w + 50 || sp.y < -50 || sp.y > h + 50) return;

      const labelY = sp.y - 12 - Math.max(6, 10 * Math.min(1, this.camera.zoom * 0.5 + 0.5));

      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      const metrics = ctx.measureText(town.name);
      const pad = 4;
      ctx.fillRect(sp.x - metrics.width / 2 - pad, labelY - 12, metrics.width + pad * 2, 18);

      ctx.fillStyle = '#fff';
      ctx.fillText(town.name, sp.x, labelY);
    });

    const nations = DataManager.nations || [];
    nations.forEach(nation => {
      const towns = DataManager.getTownsByNation(nation.id);
      if (towns.length === 0) return;

      const cx = towns.reduce((s, t) => s + t.x, 0) / towns.length;
      const cy = towns.reduce((s, t) => s + t.y, 0) / towns.length;
      const sp = this.worldToScreen(cx, cy - 20);
      if (sp.x < -50 || sp.x > w + 50 || sp.y < -50 || sp.y > h + 50) return;

      ctx.font = `bold ${Math.max(12, Math.min(16, 16 * this.camera.zoom * 0.5))}px 'Segoe UI', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';

      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      const metrics = ctx.measureText(nation.name);
      ctx.fillRect(sp.x - metrics.width / 2 - 6, sp.y - 16, metrics.width + 12, 22);

      ctx.fillStyle = nation.color || '#fff';
      ctx.fillText(nation.name, sp.x, sp.y);
    });

    if (this.layers.regionLabels) {
      const regions = DataManager.regions || [];
      regions.forEach(region => {
        if (!region.points || region.points.length < 3) return;
        const cx = region.points.reduce((s, p) => s + p.x, 0) / region.points.length;
        const cy = region.points.reduce((s, p) => s + p.y, 0) / region.points.length;
        const sp = this.worldToScreen(cx, cy);
        if (sp.x < -50 || sp.x > w + 50 || sp.y < -50 || sp.y > h + 50) return;

        ctx.font = `bold ${Math.max(10, Math.min(13, 13 * this.camera.zoom * 0.5))}px 'Segoe UI', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        const metrics = ctx.measureText(region.name);
        const pad = 5;
        ctx.fillRect(sp.x - metrics.width / 2 - pad, sp.y - 10, metrics.width + pad * 2, 20);

        ctx.fillStyle = region.color || '#fff';
        ctx.fillText(region.name, sp.x, sp.y);
      });
    }
  },

  drawDrawingPreview(ctx) {
    if (!this.drawingMode || this.drawingPoints.length === 0) return;

    if (!this.drawingMousePos) return;

    const screenPoints = this.drawingPoints.map(p => this.worldToScreen(p.x, p.y));
    const mouseScreen = this.worldToScreen(this.drawingMousePos.x, this.drawingMousePos.y);

    ctx.beginPath();
    ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
    for (let i = 1; i < screenPoints.length; i++) {
      ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
    }
    ctx.lineTo(mouseScreen.x, mouseScreen.y);
    ctx.strokeStyle = this.drawingColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    if (screenPoints.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
      for (let i = 1; i < screenPoints.length; i++) {
        ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
      }
      ctx.strokeStyle = this.drawingColor;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.fillStyle = this.drawingColor;
      ctx.globalAlpha = 0.1;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    screenPoints.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = this.drawingColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  },

  renderMiniMap() {
    const mctx = this.miniCtx;
    const mw = this.miniCanvas.width;
    const mh = this.miniCanvas.height;

    mctx.fillStyle = '#0d1117';
    mctx.fillRect(0, 0, mw, mh);

    const scaleX = mw / this.worldWidth;
    const scaleY = mh / this.worldHeight;

    const regions = DataManager.regions || [];
    regions.forEach(region => {
      if (!region.points || region.points.length < 3) return;
      mctx.beginPath();
      mctx.moveTo(region.points[0].x * scaleX, region.points[0].y * scaleY);
      for (let i = 1; i < region.points.length; i++) {
        mctx.lineTo(region.points[i].x * scaleX, region.points[i].y * scaleY);
      }
      mctx.closePath();
      mctx.fillStyle = region.color || '#4A90D9';
      mctx.globalAlpha = 0.3;
      mctx.fill();
      mctx.globalAlpha = 1;
      mctx.strokeStyle = region.color || '#4A90D9';
      mctx.lineWidth = 1;
      mctx.stroke();
    });

    const towns = DataManager.towns || [];
    towns.forEach(town => {
      mctx.beginPath();
      mctx.arc(town.x * scaleX, town.y * scaleY, 3, 0, Math.PI * 2);
      mctx.fillStyle = town.color || '#95A5A6';
      mctx.fill();
    });

    const vw = this.canvas.width / this.camera.zoom * scaleX;
    const vh = this.canvas.height / this.camera.zoom * scaleY;
    const vx = (this.camera.x - this.canvas.width / 2 / this.camera.zoom) * scaleX;
    const vy = (this.camera.y - this.canvas.height / 2 / this.camera.zoom) * scaleY;

    mctx.strokeStyle = 'rgba(255,255,255,0.5)';
    mctx.lineWidth = 1;
    mctx.strokeRect(vx, vy, vw, vh);
  },

  startDrawing(type, color, onComplete) {
    this.drawingMode = true;
    this.drawingPoints = [];
    this.drawingType = type || 'town';
    this.drawingColor = color || '#4A90D9';
    this.onDrawingComplete = onComplete || null;
    this.canvas.style.cursor = 'crosshair';
    document.getElementById('drawModeIndicator').classList.add('active');
    this.needsRender = true;
  },

  completeDrawing() {
    if (!this.drawingMode || this.drawingPoints.length < 3) return;
    const points = [...this.drawingPoints];
    const result = { points, color: this.drawingColor, type: this.drawingType };
    this.drawingMode = false;
    this.needsRender = true;
    document.getElementById('drawModeIndicator').classList.remove('active');
    if (this.onDrawingComplete) {
      this.onDrawingComplete(result);
    } else {
      this.stopDrawing();
    }
  },

  stopDrawing() {
    this.drawingMode = false;
    this.drawingPoints = [];
    this.onDrawingComplete = null;
    this.canvas.style.cursor = 'grab';
    document.getElementById('drawModeIndicator').classList.remove('active');
    this.needsRender = true;
  },

  startRenderLoop() {
    const loop = () => {
      this.render();
      this.animationId = requestAnimationFrame(loop);
    };
    loop();
  }
};

window.MapSystem = MapSystem;
