FROM sbtscala/scala-sbt:eclipse-temurin-focal-17.0.9_9_1.9.7_3.3.1

WORKDIR /app

# 1️⃣ sbt Metadaten für Dependency Caching
COPY build.sbt /app/
COPY project /app/project/
COPY wizard/build.sbt /app/wizard/
COPY wizardweb/build.sbt /app/wizardweb/

RUN sbt update

# 2️⃣ komplettes Projekt kopieren
COPY . .

# 3️⃣ Stage aus Root aufrufen (inkl. wizard)
RUN sbt stage

# 4️⃣ RAM Limits für Free Dyno
ENV JAVA_OPTS="-Xms128m -Xmx384m -XX:MaxMetaspaceSize=128m"

# 5️⃣ Production Start
CMD ["sh", "-c", "./wizardweb/target/universal/stage/bin/wizard-web -Dhttp.port=$PORT $JAVA_OPTS"]
