/* =========================================================
   STANEPARTY 2.1 — CONFIGURAÇÃO CENTRAL
   ========================================================= */
const CONFIG = {
  evento: {
    titulo: 'stanevinteum',

    dataISO: '2026-12-09T20:00:00-04:00',
    dataExibicao: '9 de dezembro · 20h00',

    local: 'R. Marrocos, 324, Flores',
    localUrl: 'https://maps.app.goo.gl/Hxved2VTaoYvZLmD6',

    dresscode: {
      nome: 'Blue Old Brother-core',
      descricao: 'agora é hora daquelas inspirações que tinhas quando tinha 16!',
      url: 'https://br.pinterest.com/search/pins/?q=y2k%20older%20brother%20style&rs=typed'
    },

    calendarioUrl: '',

    calendario: {
      nome: 'festa jadeística',
      descricao: 'aniversário de jade (09/12)',
      data: '9 de dezembro de 2026, 20h00 (horário de Manaus)',
      local: 'R. Marrocos, 324 - Flores, Manaus - AM, 69028-080'
    }
  },

  storage: {
    splashSeenKey: 'staneparty-2.1-splash-seen'
  },

  transicao: {
    duracaoMs: 2400,
    trocarPaginaMs: 1200
  }
};

/* =========================================================
   ELEMENTOS DO DOM
   ========================================================= */
const DOM = {
  pages: document.querySelector('#pages'),
  splash: document.querySelector('#pageSplash'),
  main: document.querySelector('#pageMain'),
  enterButton: document.querySelector('#enterButton'),
  rsvpButton: document.querySelector('#rsvpButton'),
  splashDays: document.querySelector('#splashDays'),
  footerCountdown: document.querySelector('#footerCountdown'),
  eventDate: document.querySelector('#eventDate'),
  venueLink: document.querySelector('#venueLink'),
  dresscodeLink: document.querySelector('#dresscodeLink'),
  statusMessage: document.querySelector('#statusMessage'),
  transitionLight: document.querySelector('#transitionLight')
};

let countdownTimer = null;

/* =========================================================
   UTILITÁRIOS & STORAGE
   ========================================================= */
const pad = (value) => String(value).padStart(2, '0');

function hasSeenSplash() {
  try {
    return localStorage.getItem(CONFIG.storage.splashSeenKey) === '1';
  } catch (_) {
    return false;
  }
}

function markSplashSeen() {
  try {
    localStorage.setItem(CONFIG.storage.splashSeenKey, '1');
  } catch (_) {}
}

/**
 * Zera o registro de entrada para testar o Splash novamente.
 * Pode ser chamado via console: `resetSplash()`
 */
function resetSplash() {
  try {
    localStorage.removeItem(CONFIG.storage.splashSeenKey);
    console.log('Staneparty: Splash resetado.');
    window.location.reload();
  } catch (err) {
    console.error('Staneparty: Erro ao resetar storage.', err);
  }
}

// Expõe no escopo global para facilitar testes no navegador
window.resetSplash = resetSplash;

/* =========================================================
   CONTAGEM REGRESSIVA
   ========================================================= */
function getTimeLeft() {
  const target = new Date(CONFIG.evento.dataISO).getTime();
  const diff = Math.max(0, target - Date.now());
  const totalSeconds = Math.floor(diff / 1000);

  return {
    diff,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60
  };
}

function updateCountdown() {
  const time = getTimeLeft();

  if (DOM.splashDays) {
    DOM.splashDays.textContent = time.days;
  }

  if (DOM.footerCountdown) {
    if (time.diff <= 0) {
      DOM.footerCountdown.textContent = 'chegou a hora.';
      if (countdownTimer) clearInterval(countdownTimer);
      return;
    }
    DOM.footerCountdown.textContent = `${time.days} dias e ${pad(time.hours)} horas restantes.`;
  }
}

/* =========================================================
   DETALHES DO EVENTO & CALENDÁRIO
   ========================================================= */
function populateEventDetails() {
  if (DOM.eventDate) {
    DOM.eventDate.textContent = CONFIG.evento.dataExibicao;
  }

  if (DOM.venueLink) {
    DOM.venueLink.textContent = CONFIG.evento.local;
    DOM.venueLink.href = CONFIG.evento.localUrl || '#';
  }

  if (DOM.dresscodeLink) {
    DOM.dresscodeLink.textContent = CONFIG.evento.dresscode.nome;
    DOM.dresscodeLink.href = CONFIG.evento.dresscode.url || '#';
    if (CONFIG.evento.dresscode.descricao) {
      DOM.dresscodeLink.title = CONFIG.evento.dresscode.descricao;
    }
  }
}

function createGoogleCalendarUrl() {
  const start = new Date(CONFIG.evento.dataISO);
  const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);
  const fmt = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

  const location = CONFIG.evento.calendario.local || CONFIG.evento.local;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: CONFIG.evento.calendario.nome,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: CONFIG.evento.calendario.descricao,
    location: location
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function handleRsvp() {
  const url = CONFIG.evento.calendarioUrl || createGoogleCalendarUrl();

  if (url && url !== '#') {
    window.open(url, '_blank', 'noopener,noreferrer');
    if (DOM.statusMessage) {
      DOM.statusMessage.textContent = 'Convite de calendário aberto.';
    }
  }
}

/* =========================================================
   TRANSIÇÕES DE PÁGINA
   ========================================================= */
function setPage(activePage) {
  const showMain = activePage === 'main';

  if (DOM.splash) {
    DOM.splash.classList.toggle('is-active', !showMain);
    DOM.splash.setAttribute('aria-hidden', String(showMain));
    if (showMain) DOM.splash.setAttribute('inert', '');
    else DOM.splash.removeAttribute('inert');
  }

  if (DOM.main) {
    DOM.main.classList.toggle('is-active', showMain);
    DOM.main.setAttribute('aria-hidden', String(!showMain));
    if (showMain) DOM.main.removeAttribute('inert');
    else DOM.main.setAttribute('inert', '');
  }
}

function transitionToMain() {
  const light = DOM.transitionLight;

  if (!light) {
    console.error('STANEPARTY: #transitionLight não foi encontrado.');
    markSplashSeen();
    setPage('main');
    return;
  }

  if (light.classList.contains('is-active')) return;

  markSplashSeen();

  if (DOM.enterButton) {
    DOM.enterButton.disabled = true;
  }

  /* A luz começa a atravessar a tela */
  light.classList.add('is-active');

  /*
   * Quando a luz estiver no centro,
   * trocamos o conteúdo por baixo dela.
   */
  window.setTimeout(() => {
    setPage('main');
  }, CONFIG.transicao.trocarPaginaMs);

  /*
   * A luz termina de atravessar.
   */
  window.setTimeout(() => {
    light.classList.remove('is-active');

    if (DOM.enterButton) {
      DOM.enterButton.disabled = false;
    }
  }, CONFIG.transicao.duracaoMs);
}

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */
function init() {
  // Suporte a URL de teste: adicione ?reset na URL para limpar o storage automaticamente
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('reset')) {
    localStorage.removeItem(CONFIG.storage.splashSeenKey);
  }

  // Event Listeners
  DOM.enterButton?.addEventListener('click', transitionToMain);
  DOM.rsvpButton?.addEventListener('click', handleRsvp);

  // Renderização e Contadores
  populateEventDetails();
  updateCountdown();
  countdownTimer = window.setInterval(updateCountdown, 1000);

  // Estado Inicial da Página
  setPage(hasSeenSplash() ? 'main' : 'splash');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}