# Étape 1 : Utiliser une image Bun officielle légère
FROM oven/bun:1.1.8-slim

# Installer dépendances nécessaires à Puppeteer pour Chromium
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    libu2f-udev \
    libvulkan1 \
    chromium \
    --no-install-recommends && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Définir le chemin d'exécution de Chromium pour Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

USER bun

# Définir le dossier de travail
WORKDIR /app

# Copier les fichiers
COPY . .

# Installer les dépendances avec Bun
RUN bun install

# Lancer le script avec Bun
CMD ["bun", "generate.ts"]
