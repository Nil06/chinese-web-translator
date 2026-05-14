<div align="center">

# Chinese Web Translator

用于探索中文互联网的私有、本地、零成本网页翻译工具。

<p>
  <a href="README.md">English</a> · <a href="README.fr.md">Français</a> · <strong>简体中文</strong>
</p>

<p>
  <img alt="Chrome" src="https://img.shields.io/badge/Chrome-WebExtension-4285F4">
  <img alt="Firefox" src="https://img.shields.io/badge/Firefox-WebExtension-FF7139">
  <img alt="Backend" src="https://img.shields.io/badge/Backend-MTranServer-0B7285">
  <img alt="Offline" src="https://img.shields.io/badge/Runs-local%20%26%20offline-2F9E44">
  <img alt="Cost" src="https://img.shields.io/badge/API%20cost-%240-37B24D">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-black">
</p>

<p>
  使用本地 CPU 模型，在浏览器里直接翻译中文、英文和法文网页。
  不需要付费 API，不需要 token，没有用量计费，也不会把页面内容发送到云端翻译服务。
</p>

</div>

---

## 亮点

<table>
  <tr>
    <td><strong>免费运行</strong></td>
    <td>不需要 API key、token 预算、订阅或按页计费。</td>
  </tr>
  <tr>
    <td><strong>本地优先</strong></td>
    <td>浏览器扩展只和 <code>127.0.0.1</code> 上的后端通信。翻译模型保留在你的电脑上。</td>
  </tr>
  <tr>
    <td><strong>为日常浏览设计</strong></td>
    <td>直接在页面中替换文本，继续阅读，需要时还可以恢复原文。</td>
  </tr>
  <tr>
    <td><strong>双向翻译</strong></td>
    <td>默认方向是 <code>中文 -> 英文</code>，同时包含反向翻译和法文方向。</td>
  </tr>
  <tr>
    <td><strong>自动模式</strong></td>
    <td>浏览时自动翻译页面以及动态加载的内容。</td>
  </tr>
  <tr>
    <td><strong>一条命令启动后端</strong></td>
    <td>可以用 Docker Compose、原生 <code>npx</code>，或 Linux 用户服务运行后端。</td>
  </tr>
</table>

## 为什么做这个项目

中文互联网内容庞大、更新很快，但语言门槛常常让探索变得困难。浏览器自带翻译有帮助，不过很多方案依赖专有云服务、存在额度限制，或者会把页面文本发到你的机器之外。

Chinese Web Translator 是一个务实的本地替代方案:

- 浏览中文代码托管平台、论坛、文档、博客、商店和项目页面;
- 模型下载之后，翻译成本保持为零;
- 扩展本身保持小而清晰，便于审计;
- 翻译后端由你自己运行。

它并不试图在所有细微语义上击败 DeepL 或 Google Translate。它的目标是让日常浏览更私密、更便宜、更舒服。

## 支持的翻译方向

默认方向:

- `中文 -> 英文`
- `英文 -> 中文`

额外内置方向:

- `中文 -> 法文`
- `法文 -> 中文`

默认目标语言是英文，这样项目可以服务更广泛的用户。反向路径方便中文用户浏览英文网页，法文路径也覆盖法语用户的使用场景。

## 工作原理

```text
网页
  -> content script 查找可翻译文本
  -> 扩展后台 worker 批量发送文本
  -> http://127.0.0.1:8989/translate/batch
  -> 本地 MTranServer
  -> Mozilla/Bergamot 风格的 CPU 翻译模型
```

这种拆分是有意设计的:

- 扩展保持为轻量 WebExtension;
- 后端可以独立更新;
- 模型文件保存在本地;
- 浏览器标签页不需要直接访问模型文件。

## 安全模型

Chinese Web Translator 采用本地优先设计，但它仍然是一个浏览器扩展: 启用时可以读取页面文本。

项目用于降低风险的做法:

- 原生模式下，后端绑定到 `127.0.0.1`。
- Docker 只把后端发布到 `127.0.0.1`，不会暴露到局域网。
- 扩展只接受本地 HTTP 后端地址: `127.0.0.1`、`localhost` 或 `[::1]`。
- 默认情况下，不会向云端 API 发送翻译请求。
- Docker 容器使用非特权 `node` 用户运行。
- 扩展不会使用 `eval`、远程脚本或 `innerHTML` 写入翻译内容。

重要取舍:

- content script 匹配所有 URL，才能翻译任意页面。如果你不希望敏感网站的文本发送到本地后端，请在这些网站上关闭自动翻译。

## 快速开始

### 1. 启动本地后端

Docker 是最简单的方式:

```bash
docker compose up -d --build
```

第一次运行会把模型下载到持久化 Docker volume:

```text
zh-Hans_en
en_zh-Hans
en_fr
fr_en
```

检查后端是否可用:

```bash
curl -s http://127.0.0.1:8989/health
```

预期响应:

```json
{"status":"ok"}
```

Docker 配置了 `restart: unless-stopped`，所以 Docker 启动后，后端也会自动恢复。

### 2. 加载扩展

Chrome 或 Chromium:

1. 打开 `chrome://extensions`。
2. 启用开发者模式。
3. 点击 `Load unpacked`。
4. 选择 `extension` 目录。

Firefox:

1. 打开 `about:debugging#/runtime/this-firefox`。
2. 点击 `Load Temporary Add-on`。
3. 选择 `extension/manifest.json`。

### 3. 开始浏览

打开中文、英文或法文页面，点击扩展图标，选择翻译方向，然后翻译页面。

如果希望打开页面后自动翻译，请启用 `Auto translate`。

## 原生后端

推荐使用 Docker，但也支持通过 `npx` 原生运行。

先下载模型:

```bash
./download-models.sh
```

启动后端:

```bash
./start-local-server.sh
```

安装 Linux 用户服务:

```bash
./scripts/install-systemd-user.sh
```

查看服务:

```bash
systemctl --user status chinese-web-translator.service
journalctl --user -u chinese-web-translator.service -f
```

移除服务:

```bash
./scripts/uninstall-systemd-user.sh
```

## 扩展功能

| 功能 | 说明 |
| --- | --- |
| 页面内翻译 | 直接替换页面中的文本节点。 |
| 恢复模式 | 将已翻译文本恢复为页面原文。 |
| 悬停查看原文 | 通过浏览器原生 hover title 保留源文本。 |
| 动态内容 | 自动模式下监听新插入内容并翻译。 |
| 批量请求 | 每次请求发送多个短文本，减少后端开销。 |
| 本地后端 URL | 默认值为 `http://127.0.0.1:8989/translate/batch`。 |

## 模型体积

当前配置下模型的大致本地体积:

| 方向 | 体积 |
| --- | ---: |
| `zh-Hans_en` | 53 MB |
| `en_zh-Hans` | 50 MB |
| `en_fr` | 36 MB |
| `fr_en` | 36 MB |

第一次下载后，模型可以离线使用。

## 打包扩展

```bash
./scripts/package-extension.sh
```

zip 文件会写入 `dist/`。

## 故障排查

后端没有响应:

```bash
curl -s http://127.0.0.1:8989/health
```

Chrome 仍然显示旧行为:

1. 打开 `chrome://extensions`。
2. 重新加载 `Chinese Web Translator`。
3. 重新加载目标标签页。

MTranServer 返回 HTTP 500 通常表示 endpoint 或 payload 不正确。endpoint 必须是:

```text
http://127.0.0.1:8989/translate/batch
```

## 当前限制

- 繁体中文需要在模型集中加入 `zh-Hant_en` 方向。
- 图片中的文字不会进行 OCR。
- Closed Shadow DOM 和部分 iframe 不会被翻译。
- 非常动态的页面可能需要手动重新执行翻译。
- 本地机器翻译通常不如高端云翻译系统细腻。
- MTranServer 是第三方后端依赖。项目使用固定版本，但升级前仍应审查新版本。

## 仓库结构

```text
extension/                    WebExtension 源码
docker/entrypoint.sh          容器入口脚本
docker-compose.yml            一条命令启动本地后端
Dockerfile                    MTranServer 容器镜像
download-models.sh            原生模型下载脚本
start-local-server.sh         原生后端启动脚本
scripts/install-systemd-user.sh
scripts/uninstall-systemd-user.sh
scripts/package-extension.sh
systemd/chinese-web-translator.service
```

## 贡献

欢迎贡献。核心原则很简单: 本地优先、免费运行、易于审计。

请参阅 [CONTRIBUTING.md](CONTRIBUTING.md)。
