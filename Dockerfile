FROM eclipse-temurin:17-jdk-jammy

WORKDIR /app

# SBT Metadaten kopieren
COPY wizardweb/build.sbt /app/
COPY wizardweb/project /app/project/

# App sources kopieren
COPY wizardweb/ /app/

# Compile + stage
RUN sbt clean compile stage

# Expose Heroku Port
EXPOSE 9000

# CMD für Free-Heroku: einfacher Secret Key
CMD ["./target/universal/stage/bin/wizardweb", "-Dplay.http.secret.key=devkey123", "-Dhttp.port=${PORT}"]
