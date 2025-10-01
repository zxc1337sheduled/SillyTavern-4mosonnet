import { saveSettingsDebounced, eventSource, event_types } from '../../../../script.js';
import { extension_settings, renderExtensionTemplateAsync } from '../../../extensions.js';

const extensionName = 'parameter-filter';
const extensionFolder = `third-party/${extensionName}`;

// Настройки по умолчанию
const defaultSettings = {
  filterTopP: false,
  filterTemperature: false
};

let settings = { ...defaultSettings };

// Загрузка настроек
function loadSettings() {
  if (!extension_settings[extensionName]) {
    extension_settings[extensionName] = { ...defaultSettings };
  }
  
  settings = extension_settings[extensionName];
  updateUI();
}

// Сохранение настроек
function saveSettings() {
  extension_settings[extensionName] = settings;
  saveSettingsDebounced();
}

// Обновление UI
function updateUI() {
  $('#param-filter-top-p').prop('checked', settings.filterTopP);
  $('#param-filter-temperature').prop('checked', settings.filterTemperature);
}

// Настройка обработчиков событий
function setupEventHandlers() {
  $('#param-filter-top-p').off('change').on('change', function() {
    settings.filterTopP = $(this).prop('checked');
    saveSettings();
    console.log('Parameter Filter: Top P filter', settings.filterTopP ? 'enabled' : 'disabled');
  });
  
  $('#param-filter-temperature').off('change').on('change', function() {
    settings.filterTemperature = $(this).prop('checked');
    saveSettings();
    console.log('Parameter Filter: Temperature filter', settings.filterTemperature ? 'enabled' : 'disabled');
  });
}

// Перехват API запросов
function interceptAPIRequests() {
  const originalFetch = window.fetch;
  
  window.fetch = function(url, options) {
    if (options && options.body) {
      try {
        const body = JSON.parse(options.body);
        
        // Проверяем настройки и удаляем параметры при необходимости
        if (settings.filterTopP && body.top_p !== undefined) {
          delete body.top_p;
          console.log('Parameter Filter: Removed top_p from request');
        }
        
        if (settings.filterTemperature && body.temperature !== undefined) {
          delete body.temperature;
          console.log('Parameter Filter: Removed temperature from request');
        }
        
        options.body = JSON.stringify(body);
      } catch (e) {
        // Игнорируем ошибки парсинга
      }
    }
    
    return originalFetch.call(this, url, options);
  };
}

// Определяем функцию-перехватчик в глобальной области
globalThis.parameterFilterInterceptor = function(chat, contextSize, abort, type) {
  // Этот перехватчик можно оставить пустым или использовать для логирования
};

// Инициализация расширения
jQuery(async () => {
  // Добавляем HTML настроек
  const settingsHtml = await renderExtensionTemplateAsync(extensionFolder, 'settings');
  $('#extensions_settings2').append(settingsHtml);
  
  // Загружаем настройки
  loadSettings();
  
  // Настраиваем обработчики
  setupEventHandlers();
  
  // Перехватываем fetch один раз при загрузке
  interceptAPIRequests();
  
  console.log('Parameter Filter: Extension loaded');
});
