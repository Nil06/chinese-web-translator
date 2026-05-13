const DEFAULT_SETTINGS = {
  enabled: false,
  autoTranslate: false,
  backendUrl: "http://127.0.0.1:8989/translate/batch",
  sourceLang: "zh-Hans",
  targetLang: "en",
  batchSize: 10,
  maxCharsPerBatch: 2200,
  maxNodesPerPass: 500,
  translateDynamicContent: true,
  showOriginalOnHover: true
};

const controls = {
  enabled: document.getElementById("enabled"),
  direction: document.getElementById("direction"),
  backendUrl: document.getElementById("backendUrl"),
  translate: document.getElementById("translate"),
  restore: document.getElementById("restore"),
  state: document.getElementById("state"),
  status: document.getElementById("status")
};

load();

controls.enabled.addEventListener("change", () => {
  chrome.storage.local.set({
    enabled: controls.enabled.checked,
    autoTranslate: controls.enabled.checked
  });
  renderState();
});

controls.direction.addEventListener("change", () => {
  const [sourceLang, targetLang] = controls.direction.value.split("|");
  chrome.storage.local.set({ sourceLang, targetLang });
});

controls.backendUrl.addEventListener("change", () => {
  chrome.storage.local.set({ backendUrl: controls.backendUrl.value.trim() });
});

controls.translate.addEventListener("click", async () => {
  await chrome.storage.local.set({ enabled: true });
  controls.enabled.checked = true;
  renderState("Translating...");
  const response = await sendToActiveTab({ type: "translateNow" });
  renderResponse(response);
});

controls.restore.addEventListener("click", async () => {
  const response = await sendToActiveTab({ type: "restorePage" });
  renderResponse(response, "Page restored.");
});

async function load() {
  const settings = await storageGet(DEFAULT_SETTINGS);
  controls.enabled.checked = Boolean(settings.enabled);
  controls.direction.value = `${settings.sourceLang}|${settings.targetLang}`;
  if (!controls.direction.value) {
    controls.direction.value = `${DEFAULT_SETTINGS.sourceLang}|${DEFAULT_SETTINGS.targetLang}`;
  }
  controls.backendUrl.value = settings.backendUrl;
  renderState();

  const response = await sendToActiveTab({ type: "getStatus" }).catch(() => null);
  if (response && response.status) {
    renderResponse(response);
  }
}

function storageGet(defaults) {
  return new Promise((resolve) => {
    chrome.storage.local.get(defaults, (items) => resolve({ ...defaults, ...items }));
  });
}

function sendToActiveTab(message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs && tabs[0];
      if (!tab || !tab.id) {
        reject(new Error("Aucun onglet actif."));
        return;
      }
      chrome.tabs.sendMessage(tab.id, message, (response) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }
        resolve(response);
      });
    });
  });
}

function renderState(text) {
  controls.state.textContent = text || (controls.enabled.checked ? "On" : "Off");
}

function renderResponse(response, successText) {
  if (!response || !response.ok) {
    controls.status.textContent =
      (response && response.error) || "Could not reach the page script.";
    return;
  }

  const translated = response.status ? response.status.translated : 0;
  const pending = response.status ? response.status.pending : 0;
  const error = response.status && response.status.errors && response.status.errors[0];
  controls.status.textContent =
    error || successText || `${translated} items translated, ${pending} pending.`;
  renderState();
}
