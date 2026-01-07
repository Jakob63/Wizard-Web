# 1️⃣ Base Image mit sbt + JDK17
FROM sbtscala/scala-sbt:eclipse-temurin-focal-17.0.9_9_1.9.7_3.3.1

# 2️⃣ Arbeitsverzeichnis
WORKDIR /app

# 3️⃣ Nur SBT Metadaten für Cache kopieren (build.sbt + project/)
COPY build.sbt /app/
COPY project /app/project/

# 4️⃣ Dependencies herunterladen
RUN sbt update

# 5️⃣ **Gesamtes Projekt kopieren** (wizard + wizardweb)
COPY . .

# 6️⃣ Production Build für wizardweb (Stage)
RUN sbt wizardweb/stage

# 7️⃣ Free-Heroku RAM Limits
ENV JAVA_OPTS="-Xms128m -Xmx384m -XX:MaxMetaspaceSize=128m"

# 8️⃣ Production Start
CMD ["sh", "-c", "./wizardweb/target/universal/stage/bin/wizard-web -Dhttp.port=$PORT $JAVA_OPTS"]
