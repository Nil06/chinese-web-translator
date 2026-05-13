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

chrome.runtime.onInstalled.addListener((details) => {
  chrome.storage.local.get(DEFAULT_SETTINGS, (settings) => {
    if (settings.backendUrl === "http://127.0.0.1:8787/translate") {
      settings.backendUrl = DEFAULT_SETTINGS.backendUrl;
    }
    if (settings.sourceLang === "zh" || settings.sourceLang === "zh-CN") {
      settings.sourceLang = DEFAULT_SETTINGS.sourceLang;
    }
    if (details.reason === "update" && settings.sourceLang === "zh-Hans" && settings.targetLang === "fr") {
      settings.targetLang = DEFAULT_SETTINGS.targetLang;
    }
    chrome.storage.local.set(settings);
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "translateBatch") {
    return false;
  }

  chrome.storage.local.get(DEFAULT_SETTINGS, async (settings) => {
    try {
      const normalizedSettings = normalizeSettings(settings);
      const translations = await translateBatch(message.texts || [], normalizedSettings);
      sendResponse({ ok: true, translations });
    } catch (error) {
      sendResponse({
        ok: false,
        error: error && error.message ? error.message : String(error)
      });
    }
  });

  return true;
});

async function translateBatch(texts, settings) {
  const cleanTexts = texts.map((text) => String(text || ""));
  if (cleanTexts.length === 0) {
    return [];
  }
  assertLocalBackendUrl(settings.backendUrl);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch(settings.backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: normalizeSourceLang(settings.sourceLang),
        to: settings.targetLang,
        texts: cleanTexts,
        html: false
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Backend HTTP ${response.status}: ${text.slice(0, 180)}`);
    }

    const payload = await response.json();
    const translations = payload.results || payload.translations;
    if (!Array.isArray(translations)) {
      throw new Error("Backend response does not contain results[] or translations[]");
    }
    if (translations.length !== cleanTexts.length) {
      throw new Error(
        `Backend returned ${translations.length} translations for ${cleanTexts.length} texts`
      );
    }

    return translations.map((translation) => String(translation || ""));
  } finally {
    clearTimeout(timeoutId);
  }
}

function assertLocalBackendUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Backend URL is invalid");
  }

  const localHosts = new Set(["127.0.0.1", "localhost", "[::1]"]);
  if (parsed.protocol !== "http:" || !localHosts.has(parsed.hostname)) {
    throw new Error("Backend URL must be a local HTTP endpoint");
  }
}

function normalizeSettings(settings) {
  const normalized = { ...DEFAULT_SETTINGS, ...settings };
  if (normalized.backendUrl === "http://127.0.0.1:8787/translate") {
    normalized.backendUrl = DEFAULT_SETTINGS.backendUrl;
    chrome.storage.local.set({ backendUrl: normalized.backendUrl });
  }
  normalized.sourceLang = normalizeSourceLang(normalized.sourceLang);
  if (normalized.sourceLang !== settings.sourceLang) {
    chrome.storage.local.set({ sourceLang: normalized.sourceLang });
  }
  return normalized;
}

function normalizeSourceLang(lang) {
  if (lang === "zh" || lang === "zh-CN" || lang === "zh-Hans") {
    return "zh-Hans";
  }
  if (lang === "zh-TW" || lang === "zh-Hant") {
    return "zh-Hant";
  }
  return lang;
}
