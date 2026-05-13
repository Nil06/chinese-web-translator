<div align="center">

# Chinese Web Translator

Private, local, no-cost webpage translation for exploring the Chinese internet.

<p>
  <img alt="Chrome" src="https://img.shields.io/badge/Chrome-WebExtension-4285F4">
  <img alt="Firefox" src="https://img.shields.io/badge/Firefox-WebExtension-FF7139">
  <img alt="Backend" src="https://img.shields.io/badge/Backend-MTranServer-0B7285">
  <img alt="Offline" src="https://img.shields.io/badge/Runs-local%20%26%20offline-2F9E44">
  <img alt="Cost" src="https://img.shields.io/badge/API%20cost-%240-37B24D">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-black">
</p>

<p>
  Translate Chinese and English websites directly in the browser using local CPU models.
  No paid API, no token, no usage meter, no page content sent to a cloud translation service.
</p>

</div>

---

## Highlights

<table>
  <tr>
    <td><strong>Free to run</strong></td>
    <td>No API keys, token budgets, subscriptions, or per-page billing.</td>
  </tr>
  <tr>
    <td><strong>Local first</strong></td>
    <td>The browser extension talks to a backend on <code>127.0.0.1</code>. Translation models stay on your machine.</td>
  </tr>
  <tr>
    <td><strong>Made for browsing</strong></td>
    <td>Translate text in-place, keep reading, restore originals when needed.</td>
  </tr>
  <tr>
    <td><strong>Bidirectional</strong></td>
    <td>Default route is <code>Chinese -> English</code>, with <code>English -> Chinese</code> for Chinese readers.</td>
  </tr>
  <tr>
    <td><strong>Auto mode</strong></td>
    <td>Automatically translates pages and dynamic content as you browse.</td>
  </tr>
  <tr>
    <td><strong>One-command backend</strong></td>
    <td>Run with Docker Compose, native <code>npx</code>, or a Linux user service.</td>
  </tr>
</table>

## Why This Exists

The Chinese web is huge, fast-moving, and often locked behind language friction. Browser translation helps, but many workflows either depend on proprietary cloud services, have quotas, or send page text away from your machine.

Chinese Web Translator is a pragmatic local alternative:

- browse Chinese code forges, forums, docs, blogs, shops, and project pages;
- keep translation costs at zero after model download;
- keep the extension small and auditable;
- run the translation backend yourself.

It is not trying to beat DeepL or Google Translate on every nuance. It is trying to make everyday browsing private, cheap, and comfortable.

## What It Can Translate

Default directions:

- `Chinese -> English`
- `English -> Chinese`

Additional bundled directions:

- `Chinese -> French`
- `French -> Chinese`

The default target is English so the project is useful to the widest audience. The reverse path is included so Chinese-speaking users can browse English pages too.

## How It Works

```text
Web page
  -> content script finds translatable text
  -> extension background worker batches text
  -> http://127.0.0.1:8989/translate/batch
  -> local MTranServer
  -> Mozilla/Bergamot-style CPU translation models
```

The split is intentional:

- the extension remains a small WebExtension;
- the backend can be updated independently;
- models are stored locally;
- no browser tab needs direct access to model files.

## Quick Start

### 1. Start The Local Backend

Docker is the easiest path:

```bash
docker compose up -d --build
```

The first run downloads models into a persistent Docker volume:

```text
zh-Hans_en
en_zh-Hans
en_fr
fr_en
```

Check that the backend is alive:

```bash
curl -s http://127.0.0.1:8989/health
```

Expected response:

```json
{"status":"ok"}
```

Docker is configured with `restart: unless-stopped`, so the backend comes back when Docker starts.

### 2. Load The Extension

Chrome or Chromium:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click `Load unpacked`.
4. Select the `extension` directory.

Firefox:

1. Open `about:debugging#/runtime/this-firefox`.
2. Click `Load Temporary Add-on`.
3. Select `extension/manifest.json`.

### 3. Browse

Open a Chinese or English page, click the extension icon, choose the translation direction, then translate the page.

Enable `Auto translate` if you want pages translated as soon as you arrive.

## Native Backend

Docker is recommended, but native `npx` is supported.

Download models once:

```bash
./download-models.sh
```

Start the backend:

```bash
./start-local-server.sh
```

Install a Linux user service:

```bash
./scripts/install-systemd-user.sh
```

Inspect the service:

```bash
systemctl --user status chinese-web-translator.service
journalctl --user -u chinese-web-translator.service -f
```

Remove it:

```bash
./scripts/uninstall-systemd-user.sh
```

## Extension Features

| Feature | Details |
| --- | --- |
| In-page translation | Replaces text nodes directly where they appear. |
| Restore mode | Reverts translated nodes back to the original page text. |
| Original on hover | Keeps original source text available via native browser hover titles. |
| Dynamic content | Watches for newly inserted content and translates it in auto mode. |
| Batch requests | Sends multiple short texts per request to reduce backend overhead. |
| Local backend URL | Defaults to `http://127.0.0.1:8989/translate/batch`. |

## Model Footprint

Approximate local model sizes from the current setup:

| Route | Size |
| --- | ---: |
| `zh-Hans_en` | 53 MB |
| `en_zh-Hans` | 50 MB |
| `en_fr` | 36 MB |
| `fr_en` | 36 MB |

After the first download, models can be used offline.

## Package The Extension

```bash
./scripts/package-extension.sh
```

The zip is written to `dist/`.

## Troubleshooting

Backend not responding:

```bash
curl -s http://127.0.0.1:8989/health
```

Chrome still showing old behavior:

1. Open `chrome://extensions`.
2. Reload `Chinese Web Translator`.
3. Reload the target tab.

HTTP 500 from MTranServer usually means the endpoint or payload is wrong. The endpoint must be:

```text
http://127.0.0.1:8989/translate/batch
```

## Current Limits

- Traditional Chinese needs the `zh-Hant_en` route added to the model set.
- Text inside images is not OCR'd.
- Closed Shadow DOM and some iframes are not translated.
- Very dynamic pages may need a manual re-run.
- Local MT is usually less nuanced than high-end cloud translation systems.

## Repository Layout

```text
extension/                    WebExtension source
docker/entrypoint.sh          Container entrypoint
docker-compose.yml            One-command local backend
Dockerfile                    MTranServer container image
download-models.sh            Native model download helper
start-local-server.sh         Native backend launcher
scripts/install-systemd-user.sh
scripts/uninstall-systemd-user.sh
scripts/package-extension.sh
systemd/chinese-web-translator.service
```

## Contributing

Contributions are welcome. The main principle is simple: keep it local-first, free to run, and easy to audit.

See [CONTRIBUTING.md](CONTRIBUTING.md).
