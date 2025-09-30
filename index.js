// Определяем функцию-перехватчик в глобальной области
globalThis.parameterFilterInterceptor = function(chat, contextSize, abort, type) {
  // Здесь можно модифицировать chat массив перед отправкой
  // Но это не влияет на параметры запроса напрямую
  
  // Для изменения параметров нужно использовать другой подход
};

// Перехватываем API запросы через модификацию генерации
const { eventSource, event_types } = SillyTavern.getContext();

eventSource.on(event_types.GENERATION_AFTER_COMMANDS, () => {
  // Перехватываем запросы на уровне браузера
  interceptAPIRequests();
});

function interceptAPIRequests() {
  // Перехватываем fetch запросы
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    if (options && options.body) {
      try {
        const body = JSON.parse(options.body);
        
        // Удаляем или устанавливаем параметры в undefined
        if (body.top_p !== undefined) {
          delete body.top_p; // или body.top_p = undefined;
        }
        if (body.temperature !== undefined) {
          delete body.temperature; // или body.temperature = undefined;
        }
        
        options.body = JSON.stringify(body);
      } catch (e) {
        // Игнорируем ошибки парсинга
      }
    }
    
    return originalFetch.call(this, url, options);
  };
}
