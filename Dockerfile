FROM sbtscala/scala-sbt:eclipse-temurin-alpine-22_36_1.10.3_3.5.1
LABEL authors="jakob"

WORKDIR /app

# Zuerst sbt-Metadaten kopieren, damit Abhängigkeiten gecacht werden
COPY build.sbt /app/
COPY project/ /app/project/
RUN sbt update

# komplettes Projekt kopieren
COPY . /app

# Backend-Port anpassen falls nötig
EXPOSE 9000

# Container startet das Backend mit sbt run
CMD ["sh", "-c", "sbt -Dhttp.port=$PORT run"]

