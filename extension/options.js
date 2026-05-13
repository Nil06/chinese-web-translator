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

const form = {
  backendUrl: document.getElementById("backendUrl"),
  direction: document.getElementById("direction"),
  batchSize: document.getElementById("batchSize"),
  maxCharsPerBatch: document.getElementById("maxCharsPerBatch"),
  maxNodesPerPass: document.getElementById("maxNodesPerPass"),
  translateDynamicContent: document.getElementById("translateDynamicContent"),
  showOriginalOnHover: document.getElementById("showOriginalOnHover"),
  save: document.getElementById("save"),
  saved: document.getElementById("saved")
};

chrome.storage.local.get(DEFAULT_SETTINGS, (settings) => {
  form.backendUrl.value = settings.backendUrl;
  form.direction.value = `${settings.sourceLang}|${settings.targetLang}`;
  if (!form.direction.value) {
    form.direction.value = `${DEFAULT_SETTINGS.sourceLang}|${DEFAULT_SETTINGS.targetLang}`;
  }
  form.batchSize.value = settings.batchSize;
  form.maxCharsPerBatch.value = settings.maxCharsPerBatch;
  form.maxNodesPerPass.value = settings.maxNodesPerPass;
  form.translateDynamicContent.checked = Boolean(settings.translateDynamicContent);
  form.showOriginalOnHover.checked = Boolean(settings.showOriginalOnHover);
});

form.save.addEventListener("click", () => {
  const [sourceLang, targetLang] = form.direction.value.split("|");
  chrome.storage.local.set(
    {
      backendUrl: form.backendUrl.value.trim(),
      sourceLang,
      targetLang,
      batchSize: Number(form.batchSize.value),
      maxCharsPerBatch: Number(form.maxCharsPerBatch.value),
      maxNodesPerPass: Number(form.maxNodesPerPass.value),
      translateDynamicContent: form.translateDynamicContent.checked,
      showOriginalOnHover: form.showOriginalOnHover.checked
    },
    () => {
      form.saved.textContent = "Settings saved.";
      setTimeout(() => {
        form.saved.textContent = "";
      }, 1800);
    }
  );
});
