# Use Temurin JDK 17 Slim (klein, effizient)
FROM eclipse-temurin:17-jdk-jammy

WORKDIR /app

# Node.js für sbt-web (frontend assets)
RUN apt-get update && apt-get install -y curl nodejs npm && rm -rf /var/lib/apt/lists/*

# SBT Metadaten kopieren für Cache
COPY build.sbt /app/
COPY project /app/project/

# Play-App kopieren
COPY wizardweb /app/wizardweb

# Compile + stage
RUN sbt -no-colors clean compile stage

# Expose default Play port
EXPOSE 9000

# CMD für Heroku Free (PORT von Heroku)
# Secret key für Play ist notwendig, hier eine Dummy-Dev-Key
CMD ["./wizardweb/target/universal/stage/bin/wizardweb", "-Dplay.http.secret.key=devkey123", "-Dhttp.port=${PORT}"]
