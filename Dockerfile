# Leichtgewichtiges JDK 17 für Play
FROM eclipse-temurin:17-jdk-jammy

WORKDIR /app

# Node.js (für sbt-web falls du Assets hast)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get install -y nodejs

# Kopiere Build-Dateien für Caching
COPY build.sbt /app/
COPY project /app/project/

# Kopiere die gesamte Play App
COPY wizardweb /app/wizardweb

# SBT installieren (falls nicht in Base Image)
RUN apt-get update && apt-get install -y curl unzip
RUN curl -L -o sbt.zip https://github.com/sbt/sbt/releases/download/v1.11.7/sbt-1.11.7.zip \
 && unzip sbt.zip -d /opt/ \
 && ln -s /opt/sbt/bin/sbt /usr/local/bin/sbt

# Compile + stage
WORKDIR /app
RUN sbt "clean compile stage"

# Heroku port
ENV PORT 9000

EXPOSE 9000

# Starte die Play App
CMD ["./wizardweb/target/universal/stage/bin/wizardweb", "-Dplay.http.secret.key=devkey123", "-Dhttp.port=${PORT}"]
