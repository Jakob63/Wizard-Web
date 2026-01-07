FROM openjdk:17-jdk-slim

WORKDIR /app

# Node.js für sbt-web
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get install -y nodejs

# SBT Metadaten kopieren für Caching
COPY build.sbt /app/
COPY project /app/project/

# Copy the main Scala sources
COPY wizard/src/main/scala /app/src/main/scala

# Copy the Play web app
COPY wizardweb/app /app/app
COPY wizardweb/conf /app/conf
COPY wizardweb/public /app/public

# Install Node.js (optional, needed for frontend assets)
RUN apt-get update && apt-get install -y nodejs

# Compile and stage the Play app
RUN sbt clean compile stage

# Expose Play default port
EXPOSE 9000

# Start the Play app
CMD ["target/universal/stage/bin/wizardweb", "-Dplay.http.secret.key=changeme"]
