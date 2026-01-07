# Production-ready OpenJDK 17
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Kopiere alle Projektdateien
COPY . .

# Stage den Play-Webapp Subproject (Production Mode)
RUN sbt wizardweb/stage

# JVM Limits für Free Dyno
ENV JAVA_OPTS="-Xms128m -Xmx384m -XX:MaxMetaspaceSize=128m"

# Start im Production Mode, Port aus Heroku-Env
CMD ["sh", "-c", "./wizardweb/target/universal/stage/bin/wizard-web -Dhttp.port=$PORT $JAVA_OPTS"]
