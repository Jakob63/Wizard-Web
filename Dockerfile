# --- Backend Build ---
FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app

# Node.js für sbt-web (optional, falls Assets benötigt)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get install -y nodejs unzip curl

# SBT installieren
RUN apt-get update && apt-get install -y curl unzip \
 && curl -L -o sbt.zip https://github.com/sbt/sbt/releases/download/v1.11.7/sbt-1.11.7.zip \
 && unzip sbt.zip -d /opt/ \
 && ln -s /opt/sbt/bin/sbt /usr/local/bin/sbt

# Backend Build-Dateien kopieren
COPY build.sbt /app/
COPY project /app/project/

# Backend Code kopieren
COPY wizardweb /app/wizardweb

# Frontend Dist aus Stage 1 kopieren
COPY --from=frontend-build /app/frontend/dist /app/wizardweb/public/dist

# Compile + stage
WORKDIR /app
RUN sbt "clean; compile; stage"

# Heroku Port
ENV PORT 9000
EXPOSE 9000

# Starte die Play App
CMD ["./wizardweb/target/universal/stage/bin/wizardweb", "-Dplay.http.secret.key=${PLAY_SECRET}", "-Dhttp.port=${PORT}"]
