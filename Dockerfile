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

RUN apk add --no-cache wget dumb-init tzdata su-exec

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
