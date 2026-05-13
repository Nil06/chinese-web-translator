FROM node:22-bookworm-slim

ARG MTRANSERVER_VERSION=4.0.33

ENV MT_HOST=0.0.0.0 \
    MT_PORT=8989 \
    MT_CONFIG_DIR=/data/config \
    MT_MODEL_DIR=/data/models \
    MT_LOG_DIR=/data/logs \
    MT_LOG_LEVEL=warn \
    MT_CHECK_UPDATE=false \
    CWT_MODELS="zh-Hans_en en_zh-Hans en_fr fr_en" \
    CWT_OFFLINE_ONLY=0

RUN npm install -g "mtranserver@${MTRANSERVER_VERSION}" \
    && mkdir -p /data \
    && chown -R node:node /data

COPY docker/entrypoint.sh /usr/local/bin/chinese-web-translator-entrypoint
RUN chmod +x /usr/local/bin/chinese-web-translator-entrypoint

USER node

VOLUME ["/data"]
EXPOSE 8989

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.MT_PORT || 8989) + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

ENTRYPOINT ["chinese-web-translator-entrypoint"]
