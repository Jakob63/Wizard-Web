# Base Image mit sbt + JDK17
FROM hseeberger/scala-sbt:17.0.8_1.9.8_2.13.12

WORKDIR /app

# Projekt kopieren
COPY . .

# Production Build
RUN sbt wizardweb/stage

# RAM Limits für Free Dyno
ENV JAVA_OPTS="-Xms128m -Xmx384m -XX:MaxMetaspaceSize=128m"

# Production Start
CMD ["sh", "-c", "./wizardweb/target/universal/stage/bin/wizard-web -Dhttp.port=$PORT $JAVA_OPTS"]
