# Base Image mit sbt + JDK17
FROM sbtscala/scala-sbt:eclipse-temurin-focal-17.0.9_9_1.9.7_3.3.1

WORKDIR /app

# Projekt kopieren
COPY . .

# Production Build
RUN sbt wizardweb/stage

# RAM Limits für Free Dyno
ENV JAVA_OPTS="-Xms128m -Xmx384m -XX:MaxMetaspaceSize=128m"

# Production Start
CMD ["sh", "-c", "./wizardweb/target/universal/stage/bin/wizard-web -Dhttp.port=$PORT $JAVA_OPTS"]
