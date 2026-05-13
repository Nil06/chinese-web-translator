# Contributing

Thanks for helping improve Chinese Web Translator.

## Local Development

Start the backend:

```bash
docker compose up -d --build
```

Load the extension from the `extension` directory in Chrome or Firefox developer mode.

After changing extension files, reload the extension from the browser extensions page and reload the target tab.

## Checks

Run JavaScript syntax checks:

```bash
node --check extension/background.js
node --check extension/contentScript.js
node --check extension/popup.js
node --check extension/options.js
```

Test the backend:

```bash
curl -s http://127.0.0.1:8989/health
```

Package the extension:

```bash
./scripts/package-extension.sh
```

## Scope

Keep the extension small and auditable. Do not add paid API dependencies or send page content to cloud services by default.
