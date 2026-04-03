FROM mcr.microsoft.com/devcontainers/javascript-node:dev-24

# Install Bun
ENV BUN_INSTALL=/bun
RUN sudo mkdir -p ${BUN_INSTALL} \
    && curl -fsSL https://bun.sh/install | bash \
    && chown -R node:node /bun

# Install Just
COPY --from=ghcr.io/casey/just:latest /just /usr/local/bin/

ENV PATH=${BUN_INSTALL}/bin:${PATH}
