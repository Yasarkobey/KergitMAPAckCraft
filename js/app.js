(function() {
  let autoSaveTimer = null;
  let renderTimer = null;

  function init() {
    DataManager.init();
    MapSystem.init();
    UIManager.init();
    AdminManager.init();
    SearchManager.init();

    MapSystem.startRenderLoop();

    document.getElementById('btnFinishDraw').addEventListener('click', () => {
      if (MapSystem.drawingPoints.length >= 3) {
        MapSystem.completeDrawing();
      } else {
        UIManager.showToast('En az 3 nokta gerekli!', 'error');
      }
    });

    document.getElementById('drawModeIndicator').addEventListener('click', (e) => {
      if (e.target.id === 'btnFinishDraw') return;
      MapSystem.stopDrawing();
      UIManager.showToast('Çizim modu iptal edildi.', 'info');
    });

    document.addEventListener('keydown', (e) => {
      if (MapSystem.drawingMode) {
        if (e.key === 'Escape') {
          MapSystem.stopDrawing();
          UIManager.showToast('Çizim modu iptal edildi.', 'info');
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          if (MapSystem.drawingPoints.length >= 3) {
            MapSystem.completeDrawing();
          } else {
            UIManager.showToast('En az 3 nokta gerekli!', 'error');
          }
        }
      }
    });

    startAutoSave();

    window.addEventListener('beforeunload', () => {
      DataManager.save();
    });

    console.log('🗺️ Kergitulus Haritası başlatıldı!');
  }

  function startAutoSave() {
    autoSaveTimer = setInterval(() => {
      DataManager.save();
    }, 10000);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
