const ChineseWebTranslator = (() => {
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

  const SKIP_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "TEXTAREA",
    "SELECT",
    "OPTION",
    "CODE",
    "PRE",
    "KBD",
    "SAMP",
    "SVG",
    "CANVAS",
    "IFRAME"
  ]);
  const ATTRIBUTES_TO_TRANSLATE = ["title", "alt", "placeholder", "aria-label"];
  const CHINESE_RE = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/u;
  const CHINESE_GLOBAL_RE = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/gu;
  const LATIN_RE = /[A-Za-zÀ-ÖØ-öø-ÿ]/u;
  const LATIN_GLOBAL_RE = /[A-Za-zÀ-ÖØ-öø-ÿ]/gu;

  let settings = { ...DEFAULT_SETTINGS };
  let observer = null;
  let mutationTimer = null;
  let isTranslating = false;
  let status = {
    translated: 0,
    pending: 0,
    errors: [],
    lastRunAt: null
  };

  const originalTextNodes = new WeakMap();
  const translatedTextNodes = new WeakSet();
  const originalAttrs = new WeakMap();

  init();

  function init() {
    getSettings().then((loaded) => {
      settings = loaded;
      setupObserver();
      if (settings.enabled && settings.autoTranslate) {
        queueTranslate(document.body);
      }
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!message || !message.type) {
        return false;
      }

      if (message.type === "translateNow") {
        settings.enabled = true;
        chrome.storage.local.set({ enabled: true });
        translatePage(document.body)
          .then(() => sendResponse({ ok: true, status }))
          .catch((error) => sendResponse({ ok: false, error: readableError(error), status }));
        return true;
      }

      if (message.type === "restorePage") {
        restorePage();
        sendResponse({ ok: true, status });
        return false;
      }

      if (message.type === "getStatus") {
        sendResponse({ ok: true, status, settings });
        return false;
      }

      return false;
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") {
        return;
      }
      for (const [key, change] of Object.entries(changes)) {
        settings[key] = change.newValue;
      }
      setupObserver();
      if (settings.enabled && settings.autoTranslate) {
        queueTranslate(document.body);
      }
    });
  }

  function getSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(DEFAULT_SETTINGS, (items) => {
        resolve({ ...DEFAULT_SETTINGS, ...items });
      });
    });
  }

  function setupObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }

    if (!settings.enabled || !settings.translateDynamicContent) {
      return;
    }

    observer = new MutationObserver((mutations) => {
      if (isTranslating) {
        return;
      }
      const hasUsefulAddition = mutations.some((mutation) => {
        return Array.from(mutation.addedNodes || []).some((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            return isWorthTranslating(node.textContent || "");
          }
          if (node.nodeType === Node.ELEMENT_NODE) {
            return isWorthTranslating(node.textContent || "");
          }
          return false;
        });
      });
      if (hasUsefulAddition) {
        queueTranslate(document.body);
      }
    });

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  function queueTranslate(root) {
    clearTimeout(mutationTimer);
    mutationTimer = setTimeout(() => {
      translatePage(root).catch((error) => recordError(error));
    }, 700);
  }

  async function translatePage(root) {
    if (!settings.enabled || isTranslating || !root) {
      return;
    }

    isTranslating = true;
    status.errors = [];
    status.lastRunAt = new Date().toISOString();

    try {
      const textJobs = collectTextJobs(root);
      const attrJobs = collectAttributeJobs(root);
      const allJobs = textJobs.concat(attrJobs).slice(0, settings.maxNodesPerPass);
      status.pending = allJobs.length;

      for (const batch of createBatches(allJobs)) {
        const translations = await requestTranslations(batch.map((job) => job.text));
        translations.forEach((translation, index) => {
          applyTranslation(batch[index], translation);
          status.translated += 1;
          status.pending = Math.max(0, status.pending - 1);
        });
      }
    } catch (error) {
      recordError(error);
      throw error;
    } finally {
      isTranslating = false;
      status.pending = 0;
    }
  }

  function collectTextJobs(root) {
    const jobs = [];
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (jobs.length >= settings.maxNodesPerPass) {
            return NodeFilter.FILTER_REJECT;
          }
          if (translatedTextNodes.has(node) || originalTextNodes.has(node)) {
            return NodeFilter.FILTER_REJECT;
          }
          if (shouldSkipTextNode(node)) {
            return NodeFilter.FILTER_REJECT;
          }
          if (!isWorthTranslating(node.textContent || "")) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node = walker.nextNode();
    while (node) {
      const parts = splitEdgeWhitespace(node.textContent || "");
      if (parts.core) {
        jobs.push({
          kind: "text",
          node,
          text: parts.core,
          leading: parts.leading,
          trailing: parts.trailing
        });
      }
      node = walker.nextNode();
    }

    return jobs;
  }

  function collectAttributeJobs(root) {
    if (root.nodeType !== Node.ELEMENT_NODE) {
      return [];
    }

    const elements = [root].concat(Array.from(root.querySelectorAll("*")));
    const jobs = [];

    for (const element of elements) {
      if (shouldSkipElement(element, { allowInputs: true })) {
        continue;
      }

      for (const attr of ATTRIBUTES_TO_TRANSLATE) {
        const value = element.getAttribute(attr);
        if (!value || !isWorthTranslating(value)) {
          continue;
        }
        const saved = originalAttrs.get(element);
        if (saved && saved[attr] !== undefined) {
          continue;
        }
        jobs.push({
          kind: "attr",
          element,
          attr,
          text: value.trim(),
          original: value
        });
        if (jobs.length >= settings.maxNodesPerPass) {
          return jobs;
        }
      }
    }

    return jobs;
  }

  function createBatches(jobs) {
    const batches = [];
    let current = [];
    let currentChars = 0;

    for (const job of jobs) {
      const jobChars = job.text.length;
      const wouldOverflow =
        current.length >= settings.batchSize ||
        (current.length > 0 && currentChars + jobChars > settings.maxCharsPerBatch);

      if (wouldOverflow) {
        batches.push(current);
        current = [];
        currentChars = 0;
      }

      current.push(job);
      currentChars += jobChars;
    }

    if (current.length > 0) {
      batches.push(current);
    }

    return batches;
  }

  function requestTranslations(texts) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "translateBatch", texts }, (response) => {
        const lastError = chrome.runtime.lastError;
        if (lastError) {
          reject(new Error(lastError.message));
          return;
        }
        if (!response || !response.ok) {
          reject(new Error((response && response.error) || "Translation failed"));
          return;
        }
        resolve(response.translations);
      });
    });
  }

  function applyTranslation(job, translation) {
    const cleanTranslation = normalizeTranslation(translation);
    if (!cleanTranslation) {
      return;
    }

    if (job.kind === "text") {
      if (!originalTextNodes.has(job.node)) {
        originalTextNodes.set(job.node, job.node.textContent || "");
      }
      job.node.textContent = `${job.leading}${cleanTranslation}${job.trailing}`;
      translatedTextNodes.add(job.node);

      const parent = job.node.parentElement;
      if (parent) {
        parent.classList.add("zh-lens-translated");
        if (settings.showOriginalOnHover && !parent.getAttribute("data-zh-lens-original-title")) {
          parent.setAttribute("data-zh-lens-original-title", parent.getAttribute("title") || "");
          parent.setAttribute("title", job.text);
        }
      }
      return;
    }

    if (job.kind === "attr") {
      const saved = originalAttrs.get(job.element) || {};
      if (saved[job.attr] === undefined) {
        saved[job.attr] = job.original;
        originalAttrs.set(job.element, saved);
      }
      job.element.setAttribute(job.attr, cleanTranslation);
    }
  }

  function restorePage() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      if (originalTextNodes.has(node)) {
        node.textContent = originalTextNodes.get(node);
      }
      node = walker.nextNode();
    }

    document.querySelectorAll(".zh-lens-translated").forEach((element) => {
      element.classList.remove("zh-lens-translated");
      const previousTitle = element.getAttribute("data-zh-lens-original-title");
      if (previousTitle !== null) {
        if (previousTitle) {
          element.setAttribute("title", previousTitle);
        } else {
          element.removeAttribute("title");
        }
        element.removeAttribute("data-zh-lens-original-title");
      }
    });

    document.querySelectorAll("*").forEach((element) => {
      const saved = originalAttrs.get(element);
      if (!saved) {
        return;
      }
      for (const [attr, value] of Object.entries(saved)) {
        element.setAttribute(attr, value);
      }
    });

    status = {
      translated: 0,
      pending: 0,
      errors: [],
      lastRunAt: null
    };
  }

  function shouldSkipTextNode(node) {
    if (!node.parentElement) {
      return true;
    }
    return shouldSkipElement(node.parentElement);
  }

  function shouldSkipElement(element, options = {}) {
    let current = element;
    while (current && current !== document.body) {
      if (current.id === "zh-lens-status") {
        return true;
      }
      if (SKIP_TAGS.has(current.tagName)) {
        return true;
      }
      if (!options.allowInputs && current.tagName === "INPUT") {
        return true;
      }
      if (current.isContentEditable) {
        return true;
      }
      if (current.classList && current.classList.contains("notranslate")) {
        return true;
      }
      if (current.getAttribute && current.getAttribute("translate") === "no") {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  }

  function isWorthTranslating(text) {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    if (clean.length < 2) {
      return false;
    }

    if (isChineseSource(settings.sourceLang)) {
      return isWorthTranslatingChinese(clean);
    }

    return isWorthTranslatingLatin(clean);
  }

  function isChineseSource(sourceLang) {
    return String(sourceLang || "").startsWith("zh");
  }

  function isWorthTranslatingChinese(clean) {
    if (!CHINESE_RE.test(clean)) {
      return false;
    }

    const chineseChars = clean.match(CHINESE_GLOBAL_RE) || [];
    if (chineseChars.length >= 2) {
      return true;
    }

    return chineseChars.length / Math.max(clean.length, 1) > 0.2;
  }

  function isWorthTranslatingLatin(clean) {
    if (!LATIN_RE.test(clean) || CHINESE_RE.test(clean)) {
      return false;
    }
    const latinChars = clean.match(LATIN_GLOBAL_RE) || [];
    const words = clean.match(/[A-Za-zÀ-ÖØ-öø-ÿ]{2,}/gu) || [];
    if (words.length < 2 && latinChars.length < 8) {
      return false;
    }
    return latinChars.length / Math.max(clean.length, 1) > 0.45;
  }

  function splitEdgeWhitespace(text) {
    const match = String(text || "").match(/^(\s*)([\s\S]*?)(\s*)$/);
    return {
      leading: match ? match[1] : "",
      core: match ? match[2] : text,
      trailing: match ? match[3] : ""
    };
  }

  function normalizeTranslation(translation) {
    return String(translation || "")
      .replace(/^["'“”]+|["'“”]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function recordError(error) {
    const message = readableError(error);
    status.errors.unshift(message);
    status.errors = status.errors.slice(0, 5);
    console.warn("[Chinese Web Translator]", message);
  }

  function readableError(error) {
    if (!error) {
      return "Unknown error";
    }
    if (error.name === "AbortError") {
      return "Translation backend timed out";
    }
    return error.message || String(error);
  }

  return {
    translatePage,
    restorePage
  };
})();
