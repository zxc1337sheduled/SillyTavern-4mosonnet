// Настройки расширения
const extensionName = "parameter-filter";
const defaultSettings = {
  disableTopP: false,
  disableTemperature: false
};

let settings = defaultSettings;

// Загрузка настроек
async function loadSettings() {
  const saved = await SillyTavern.getContext().extensionSettings[extensionName];
  settings = Object.assign({}, defaultSettings, saved);
  updateUI();
}

// Сохранение настроек
async function saveSettings() {
  const context = SillyTavern.getContext();
  context.extensionSettings[extensionName] = settings;
  context.saveSettingsDebounced();
}

// Обновление UI
function updateUI() {
  $('#parameter_filter_top_p').prop('checked', settings.disableTopP);
  $('#parameter_filter_temperature').prop('checked', settings.disableTemperature);
}

// Определяем функцию-перехватчик в глобальной области
globalThis.parameterFilterInterceptor = function(chat, contextSize, abort, type) {
  // Здесь можно модифицировать chat массив перед отправкой
  // Но это не влияет на параметры запроса напрямую
};

// Перехватываем API запросы через модификацию генерации
const { eventSource, event_types } = SillyTavern.getContext();

eventSource.on(event_types.GENERATION_AFTER_COMMANDS, () => {
  interceptAPIRequests();
});

function interceptAPIRequests() {
  // Перехватываем fetch запросы
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    if (options && options.body) {
      try {
        const body = JSON.parse(options.body);
        
        // Удаляем параметры согласно настройкам
        if (settings.disableTopP && body.top_p !== undefined) {
          delete body.top_p;
        }
        if (settings.disableTemperature && body.temperature !== undefined) {
          delete body.temperature;
        }
        
        options.body = JSON.stringify(body);
      } catch (e) {
        // Игнорируем ошибки парсинга
      }
    }
    
    return originalFetch.call(this, url, options);
  };
}

// Инициализация при загрузке расширения
jQuery(async () => {
  // Создаём HTML для настроек
  const settingsHtml = `
    <div class="parameter-filter-settings">
      <div class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
          <b>Parameter Filter</b>
          <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">
          <label class="checkbox_label" for="parameter_filter_top_p">
            <input type="checkbox" id="parameter_filter_top_p" />
            <span>Отключить Top P</span>
          </label>
          <label class="checkbox_label" for="parameter_filter_temperature">
            <input type="checkbox" id="parameter_filter_temperature" />
            <span>Отключить Temperature</span>
          </label>
          <small class="notes">Отмеченные параметры не будут отправляться на API</small>
        </div>
      </div>
    </div>
  `;

  // Добавляем настройки в панель расширений
  $('#extensions_settings2').append(settingsHtml);

  // Загружаем сохранённые настройки
  await loadSettings();

  // Обработчики изменений
  $('#parameter_filter_top_p').on('change', function() {
    settings.disableTopP = $(this).prop('checked');
    saveSettings();
  });

  $('#parameter_filter_temperature').on('change', function() {
    settings.disableTemperature = $(this).prop('checked');
    saveSettings();
  });
});
