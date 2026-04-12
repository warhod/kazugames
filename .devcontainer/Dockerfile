FROM mcr.microsoft.com/devcontainers/javascript-node:dev-24

ENV BUN_INSTALL=/bun
ARG BUN_VERSION=1.3.11
RUN sudo mkdir -p ${BUN_INSTALL} \
    && curl -fsSL https://bun.com/install | bash -s "bun-v${BUN_VERSION}" \
    && chown -R node:node /bun

# Install Just
COPY --from=ghcr.io/casey/just:latest /just /usr/local/bin/

ENV PATH=${BUN_INSTALL}/bin:${PATH}
