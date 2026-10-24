/**
 * EL TESORO DE MAMÁ - LÓGICA DE INTERACCIÓN Y REPRODUCTOR SINGLE-PLAYER
 */

document.addEventListener('DOMContentLoaded', () => {
  // Estado global de la aplicación
  let memoriesData = [];
  let currentIndex = 0;
  let activeAudio = null;
  let activeAudioBtn = null;

  // Elementos DOM
  const btnOpenChest = document.getElementById('btn-open-chest');
  const chestViewer = document.getElementById('chest-viewer');
  const revealSection = document.getElementById('reveal-section');
  const memoriesSection = document.getElementById('memories-section');
  const floatingStage = document.getElementById('floating-stage');

  const memoryCard = document.getElementById('active-memory-card');
  const memoryCounter = document.getElementById('memory-counter');
  const btnPrev = document.getElementById('btn-prev-memory');
  const btnNext = document.getElementById('btn-next-memory');

  const objectDialog = document.getElementById('object-dialog');
  const dialogBody = document.getElementById('dialog-body');
  const dialogCloseBtn = document.getElementById('dialog-close-btn');

  // Inicializar
  init();

  async function init() {
    await loadMemoriesData();
    setupEventListeners();
  }

  /* ==========================================================================
     1. CARGA Y ORDENAMIENTO DE DATOS (memories.json)
     ========================================================================== */
  async function loadMemoriesData() {
    try {
      const response = await fetch('memories.json');
      if (!response.ok) throw new Error('Error al cargar memories.json');
      const data = await response.json();
      
      // Garantizar orden secuencial según la clave "orden"
      memoriesData = data.sort((a, b) => a.orden - b.orden);
    } catch (err) {
      console.warn('Cargando registros de respaldo...', err);
      memoriesData = [
        {
          id: 1, orden: 1, familiar: "Pareja", nombre: "Cristian", foto: "",
          mensaje: "Gracias por compartir tantos años, momentos, aprendizajes y recuerdos.", audio: ""
        },
        {
          id: 2, orden: 2, familiar: "Hijo", nombre: "Saúl", foto: "",
          mensaje: "Mamá, gracias por todo lo que me has enseñado.", audio: ""
        }
      ];
    }
  }

  /* ==========================================================================
     2. CONFIGURACIÓN DE EVENTOS
     ========================================================================== */
  function setupEventListeners() {
    // Activación del Cofre
    btnOpenChest.addEventListener('click', handleChestOpening);
    if (chestViewer) {
      chestViewer.addEventListener('click', handleChestOpening);
    }

    // Navegación de tarjetas de felicitación
    btnPrev.addEventListener('click', () => navigateMemory(-1));
    btnNext.addEventListener('click', () => navigateMemory(1));

    // Navegación con teclado
    document.addEventListener('keydown', (e) => {
      if (memoriesSection.classList.contains('hidden')) return;
      if (e.key === 'ArrowLeft') navigateMemory(-1);
      if (e.key === 'ArrowRight') navigateMemory(1);
    });

    // Control Táctil (Swipe horizontal en móvil)
    let touchStartX = 0;
    memoryCard.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    memoryCard.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      if (touchStartX - touchEndX > 45) navigateMemory(1);
      if (touchEndX - touchStartX > 45) navigateMemory(-1);
    }, { passive: true });

    // Clics en la colección de objetos de mamá
    document.querySelectorAll('.object-card').forEach(card => {
      card.addEventListener('click', () => {
        const type = card.getAttribute('data-object');
        openObjectModal(type);
      });
    });

    // Cierre de modal de objetos
    dialogCloseBtn.addEventListener('click', () => objectDialog.close());
    objectDialog.addEventListener('click', (e) => {
      if (e.target === objectDialog) objectDialog.close();
    });

    // Detener audio al ocultar la página / cambiar de pestaña
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopActiveAudio();
    });
  }

  /* ==========================================================================
     3. EL GRAN REVELADO Y FOTOS FLOTANTES
     ========================================================================== */
  function handleChestOpening() {
    // Activar sección de revelado narrativo
    revealSection.classList.remove('hidden');
    revealSection.classList.add('reveal-active');

    // Reacción visual suave en el visor 3D
    if (chestViewer) {
      chestViewer.cameraOrbit = '30deg 70deg 105%';
    }

    // Lluvia / Arribo de recuerdos flotantes
    generateFloatingPhotos();

    // Transición suave hacia las felicitaciones
    setTimeout(() => {
      memoriesSection.classList.remove('hidden');
      renderActiveMemoryCard();
      memoriesSection.scrollIntoView({ behavior: 'smooth' });
    }, 3200);
  }

  function generateFloatingPhotos() {
    floatingStage.innerHTML = '';

    memoriesData.forEach((item, index) => {
      const photoEl = document.createElement('div');
      photoEl.className = 'floating-photo';

      const targetX = (index % 2 === 0 ? 1 : -1) * (50 + index * 38) + 'px';
      const targetRot = (index % 2 === 0 ? 6 : -6) + 'deg';

      photoEl.style.setProperty('--target-x', targetX);
      photoEl.style.setProperty('--target-rot', targetRot);
      photoEl.style.animationDelay = `${index * 0.35}s`;

      const imgSrc = item.foto && item.foto.trim() !== '' ? item.foto : getPlaceholderSVG(item.familiar);
      
      photoEl.innerHTML = `<img src="${imgSrc}" alt="Foto de ${item.nombre}">`;
      floatingStage.appendChild(photoEl);
    });
  }

  /* ==========================================================================
     4. RENDERIZADO Y NAVEGACIÓN DE TARJETAS
     ========================================================================== */
  function navigateMemory(direction) {
    stopActiveAudio();
    currentIndex = (currentIndex + direction + memoriesData.length) % memoriesData.length;

    memoryCard.style.opacity = '0';
    memoryCard.style.transform = 'scale(0.98)';

    setTimeout(() => {
      renderActiveMemoryCard();
      memoryCard.style.opacity = '1';
      memoryCard.style.transform = 'scale(1)';
    }, 200);
  }

  function renderActiveMemoryCard() {
    const item = memoriesData[currentIndex];
    const imgSrc = item.foto && item.foto.trim() !== '' ? item.foto : getPlaceholderSVG(item.familiar);

    memoryCard.innerHTML = `
      <div class="card-photo-wrapper">
        <img src="${imgSrc}" alt="Fotografía de ${item.nombre}">
      </div>

      <div class="card-info">
        <span class="kinship-badge">${item.familiar}</span>
        <h3 class="person-name">${item.nombre}</h3>
        <p class="card-message">"${item.mensaje}"</p>

        <div class="custom-audio-player">
          <button class="btn-play-toggle" aria-label="Escuchar mensaje de voz de ${item.nombre}">▶</button>
          <div class="audio-text-group">
            <span class="audio-label">Escuchar mensaje</span>
            <span class="audio-status">${item.audio ? 'Toca para reproducir' : 'Audio próximamente'}</span>
          </div>
          ${item.audio ? `<audio src="${item.audio}" preload="metadata"></audio>` : ''}
        </div>
      </div>
    `;

    memoryCounter.textContent = `${currentIndex + 1} de ${memoriesData.length}`;

    if (item.audio) {
      setupAudioPlayer(memoryCard.querySelector('.custom-audio-player'));
    }
  }

  /* ==========================================================================
     5. REPRODUCTOR SINGLE-PLAYER SEGURO
     ========================================================================== */
  function setupAudioPlayer(container) {
    const btn = container.querySelector('.btn-play-toggle');
    const audio = container.querySelector('audio');
    const statusLabel = container.querySelector('.audio-status');

    if (!audio) return;

    btn.addEventListener('click', () => {
      // Regla Single-Player: Pausar cualquier otro audio sonando
      if (activeAudio && activeAudio !== audio) {
        stopActiveAudio();
      }

      if (audio.paused) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              activeAudio = audio;
              activeAudioBtn = btn;
              btn.textContent = 'Ⅱ';
              statusLabel.textContent = 'Pausar mensaje';
            })
            .catch(err => {
              console.warn('Reproducción restringida por navegador o recurso no encontrado:', err);
              statusLabel.textContent = 'Audio próximamente';
            });
        }
      } else {
        audio.pause();
        btn.textContent = '▶';
        statusLabel.textContent = 'Escuchar mensaje';
        activeAudio = null;
        activeAudioBtn = null;
      }
    });

    audio.addEventListener('ended', () => {
      btn.textContent = '▶';
      statusLabel.textContent = 'Volver a escuchar';
      activeAudio = null;
      activeAudioBtn = null;
    });
  }

  function stopActiveAudio() {
    if (activeAudio) {
      activeAudio.pause();
      if (activeAudioBtn) activeAudioBtn.textContent = '▶';
      activeAudio = null;
      activeAudioBtn = null;
    }
  }

  /* ==========================================================================
     6. DETALLES CONCEPTUALES DE OBJETOS
     ========================================================================== */
  function openObjectModal(type) {
    const objectTexts = {
      album: {
        title: "Álbum de recuerdos",
        phrase: "“Porque hay momentos que merecen volver a mirarse una y otra vez.”",
        detail: "Un espacio reservado para los instantes más valiosos que han marcado la historia de nuestra familia."
      },
      bastet: {
        title: "Bastet",
        phrase: "“Porque tu curiosidad por Egipto siempre ha sido parte de ti.”",
        detail: "Símbolo de elegancia, misticismo y fascinación por la historia antigua que siempre te ha caracterizado."
      },
      caballo: {
        title: "El caballo",
        phrase: "“Porque la naturaleza, los caballos y esa sensación de libertad también hablan de lo que disfrutas.”",
        detail: "Representa la fuerza noble y la conexión con el campo que llena de paz tu espíritu."
      },
      libros: {
        title: "Los libros",
        phrase: "“Porque entre páginas también se guardan mundos, ideas y momentos de calma.”",
        detail: "Para la persona que encuentra refugio, sabiduría e inspiración constante en la lectura."
      }
    };

    const data = objectTexts[type] || { title: "Objeto Especial", phrase: "Un detalle único.", detail: "" };

    dialogBody.innerHTML = `
      <span style="font-size: 0.72rem; font-weight: 700; color: var(--gold-dark); letter-spacing: 1.5px;">PIEZA DE COLECCIÓN</span>
      <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--text-dark); margin: 4px 0 10px 0;">${data.title}</h3>
      <p style="color: var(--primary-rose-dark); font-size: 1rem; font-style: italic; margin-bottom: 12px; line-height: 1.5;">${data.phrase}</p>
      <p style="color: var(--text-muted); font-size: 0.92rem; line-height: 1.6;">${data.detail}</p>
    `;

    objectDialog.showModal();
  }

  // Placeholder SVG dinámico cuando falta foto
  function getPlaceholderSVG(text) {
    const encodedText = encodeURIComponent(text || 'Recuerdo');
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="%23f9f1e1"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Georgia, serif" font-size="20" fill="%23d47a85">❤️ ${encodedText}</text></svg>`;
  }
});
