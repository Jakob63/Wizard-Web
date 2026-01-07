# === Stage 1: Build Frontend ===
FROM node:20 AS frontend-build
WORKDIR /app/frontend

# Package.json für caching kopieren
COPY wizardweb-frontend/package*.json ./

# Node-Modules installieren
RUN npm ci

# Frontend-Code kopieren
COPY wizardweb-frontend/ ./

# Build ausführen (erzeugt dist/)
RUN npm run build

# === Stage 2: Backend + Assets ===
FROM eclipse-temurin:17-jdk-jammy

WORKDIR /app

# Node.js für sbt-web falls nötig (optional, kann man auch weglassen)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get install -y nodejs unzip curl

# SBT installieren
RUN curl -L -o sbt.zip https://github.com/sbt/sbt/releases/download/v1.11.7/sbt-1.11.7.zip \
 && unzip sbt.zip -d /opt/ \
 && ln -s /opt/sbt/bin/sbt /usr/local/bin/sbt

# Play App kopieren
COPY wizardweb /app/wizardweb

# Frontend-Build aus Stage 1 ins Backend kopieren
# Wir nehmen die dist-Dateien und legen sie in public/dist
RUN mkdir -p /app/wizardweb/public/dist
COPY --from=frontend-build /app/frontend/dist/ /app/wizardweb/public/dist/

# Builden + Stage
WORKDIR /app/wizardweb
RUN sbt "clean; compile; stage"

# Heroku Port
ENV PORT 9000

EXPOSE 9000

# CMD mit Secret Key
CMD ["./target/universal/stage/bin/wizardweb", "-Dplay.http.secret.key=$PLAY_SECRET", "-Dhttp.port=$PORT"]
