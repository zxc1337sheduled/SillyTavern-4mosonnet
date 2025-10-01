// Настройки по умолчанию
const defaultSettings = {
  filterTopP: false,
  filterTemperature: false
};

let settings = { ...defaultSettings };

// Загрузка настроек
async function loadSettings() {
  try {
    const saved = await SillyTavern.getContext().extensionSettings['parameter-filter'];
    if (saved) {
      settings = { ...defaultSettings, ...saved };
    }
  } catch (e) {
    console.log('Parameter Filter: Using default settings');
  }
  updateUI();
}

// Сохранение настроек
async function saveSettings() {
  try {
    SillyTavern.getContext().extensionSettings['parameter-filter'] = settings;
    await SillyTavern.getContext().saveSettingsDebounced();
  } catch (e) {
    console.error('Parameter Filter: Failed to save settings', e);
  }
}

// Обновление UI
function updateUI() {
  const topPCheckbox = document.getElementById('param-filter-top-p');
  const tempCheckbox = document.getElementById('param-filter-temperature');
  
  if (topPCheckbox) topPCheckbox.checked = settings.filterTopP;
  if (tempCheckbox) tempCheckbox.checked = settings.filterTemperature;
}

// Определяем функцию-перехватчик в глобальной области
globalThis.parameterFilterInterceptor = function(chat, contextSize, abort, type) {
  // Этот перехватчик можно оставить пустым или использовать для логирования
};

// Инициализация расширения
const { eventSource, event_types } = SillyTavern.getContext();

// Перехватываем API запросы один раз при загрузке
interceptAPIRequests();

// Загружаем настройки при старте
loadSettings();

// Настройка обработчиков событий для UI
eventSource.on(event_types.APP_READY, () => {
  setupEventHandlers();
});

function setupEventHandlers() {
  const topPCheckbox = document.getElementById('param-filter-top-p');
  const tempCheckbox = document.getElementById('param-filter-temperature');
  
  if (topPCheckbox) {
    topPCheckbox.addEventListener('change', (e) => {
      settings.filterTopP = e.target.checked;
      saveSettings();
    });
  }
  
  if (tempCheckbox) {
    tempCheckbox.addEventListener('change', (e) => {
      settings.filterTemperature = e.target.checked;
      saveSettings();
    });
  }
}

function interceptAPIRequests() {
  const originalFetch = window.fetch;
  
  window.fetch = function(url, options) {
    if (options && options.body) {
      try {
        const body = JSON.parse(options.body);
        
        // Проверяем настройки и удаляем параметры при необходимости
        if (settings.filterTopP && body.top_p !== undefined) {
          delete body.top_p;
          console.log('Parameter Filter: Removed top_p');
        }
        
        if (settings.filterTemperature && body.temperature !== undefined) {
          delete body.temperature;
          console.log('Parameter Filter: Removed temperature');
        }
        
        options.body = JSON.stringify(body);
      } catch (e) {
        // Игнорируем ошибки парсинга
      }
    }
    
    return originalFetch.call(this, url, options);
  };
}
