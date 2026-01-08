FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app

# Node für sbt-web
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get install -y nodejs unzip curl

# SBT (Weil max Memory erreicht)
RUN apt-get update && apt-get install -y curl unzip \
 && curl -L -o sbt.zip https://github.com/sbt/sbt/releases/download/v1.11.7/sbt-1.11.7.zip \
 && unzip sbt.zip -d /opt/ \
 && ln -s /opt/sbt/bin/sbt /usr/local/bin/sbt

COPY build.sbt /app/
COPY project /app/project/
COPY wizardweb /app/wizardweb
COPY wizardweb/public/dist /app/wizardweb/public/dist

WORKDIR /app
RUN sbt "clean; compile; stage"

ENV PORT 9000
EXPOSE 9000

CMD ["./wizardweb/target/universal/stage/bin/wizardweb", "-Dplay.http.secret.key=${PLAY_SECRET}", "-Dhttp.port=${PORT}"]
