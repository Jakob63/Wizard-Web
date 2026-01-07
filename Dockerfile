# Base Image mit sbt + JDK17
FROM sbtscala/scala-sbt:eclipse-temurin-focal-17.0.9_9_1.9.7_3.3.1

WORKDIR /app

# 1️⃣ Zuerst alles kopieren, was SBT für Dependency Caching braucht
COPY build.sbt /app/
COPY project /app/project/
COPY wizard /app/wizard
COPY wizardweb /app/wizardweb

# Dependencies auflösen (cached)
RUN sbt update

# 2️⃣ Dann komplettes Projekt kopieren (für Templates / Assets)
COPY . .

# 3️⃣ Production Build für Multi-Project aus Root
RUN sbt stage

# 4️⃣ RAM Limits für Free Dyno
ENV JAVA_OPTS="-Xms128m -Xmx384m -XX:MaxMetaspaceSize=128m"

# 5️⃣ Production Start
CMD ["sh", "-c", "./wizardweb/target/universal/stage/bin/wizard-web -Dhttp.port=$PORT $JAVA_OPTS"]
