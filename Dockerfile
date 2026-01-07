FROM sbtscala/scala-sbt:eclipse-temurin-focal-17.0.9_9_1.9.7_3.3.1

WORKDIR /app

# Node.js für sbt-web
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get install -y nodejs

# SBT Metadaten kopieren für Caching
COPY build.sbt /app/
COPY project /app/project/

# Dependencies herunterladen
RUN sbt update

# Alles kopieren
COPY . .

# Alle Projekte bauen + stage
RUN sbt clean compile stage

# Free-Heroku RAM limit
ENV JAVA_OPTS="-Xms128m -Xmx384m -XX:MaxMetaspaceSize=128m"

# Start
CMD ["sh", "-c", "./wizardweb/target/universal/stage/bin/wizard-web -Dhttp.port=$PORT $JAVA_OPTS"]
