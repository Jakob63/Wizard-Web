# Base JDK
FROM eclipse-temurin:17-jdk-jammy

WORKDIR /app

# Node.js + curl + SBT
RUN apt-get update && apt-get install -y curl gnupg2 software-properties-common unzip && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    echo "deb https://repo.scala-sbt.org/scalasbt/debian all main" | tee /etc/apt/sources.list.d/sbt.list && \
    curl -sL "https://keyserver.ubuntu.com/pks/lookup?op=get&search=0x99E82A75642AC823" | apt-key add && \
    apt-get update && apt-get install -y sbt && \
    rm -rf /var/lib/apt/lists/*

# Copy project metadata
COPY build.sbt /app/
COPY project /app/project/

# Copy the Play app
COPY wizardweb /app/wizardweb

# Compile + stage
RUN sbt -no-colors clean compile stage

# Expose Play default port
EXPOSE 9000

# Start the Play app (Heroku Free)
CMD ["./wizardweb/target/universal/stage/bin/wizardweb", "-Dplay.http.secret.key=devkey123", "-Dhttp.port=${PORT}"]
