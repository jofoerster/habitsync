FROM node:18-alpine AS ui-builder
WORKDIR /app/ui

COPY habitsync-ui/package.json habitsync-ui/package-lock.json* ./
RUN npm ci

COPY habitsync-ui/ ./

RUN npx expo export --platform web

FROM maven:3.9-eclipse-temurin-21-alpine AS api-builder
WORKDIR /app/api

COPY habitsync-api/pom.xml ./
RUN mvn dependency:go-offline -B

COPY habitsync-api/src ./src

COPY --from=ui-builder /app/ui/dist ./src/main/resources/static/

RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine AS runtime

ARG TARGETARCH

RUN apk add --no-cache wget dumb-init tzdata su-exec curl tar xz

RUN if [ "$TARGETARCH" = "arm64" ]; then WT_ARCH="aarch64"; \
    elif [ "$TARGETARCH" = "amd64" ]; then WT_ARCH="x86_64"; \
    else echo "Unsupported architecture: $TARGETARCH" && exit 1; fi && \
    WT_VERSION="v36.0.12" && \
    curl -L "https://github.com/bytecodealliance/wasmtime/releases/download/${WT_VERSION}/wasmtime-${WT_VERSION}-${WT_ARCH}-linux.tar.xz" | tar -xJ && \
    mv "wasmtime-${WT_VERSION}-${WT_ARCH}-linux/wasmtime" /usr/local/bin/wasmtime && \
    rm -rf "wasmtime-${WT_VERSION}-${WT_ARCH}-linux"

RUN ln -snf /usr/share/zoneinfo/UTC /etc/localtime && echo UTC > /etc/timezone

RUN mkdir -p /data

COPY --from=api-builder /app/api/target/habitsync-api-*.jar /app/app.jar
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 6842

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:6842/actuator/health || exit 1

ENTRYPOINT ["dumb-init", "--", "/docker-entrypoint.sh"]
CMD []