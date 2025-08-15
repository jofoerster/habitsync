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

RUN apk add --no-cache wget dumb-init

RUN addgroup -g 6842 -S appgroup && \
    adduser -u 6842 -S appuser -G appgroup

RUN mkdir -p /data && chown appuser:appgroup /data

COPY --from=api-builder /app/api/target/habitsync-api-*.jar /app/app.jar
RUN chown appuser:appgroup /app/app.jar

USER appuser

EXPOSE 6842

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:6842/api/actuator/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "/app/app.jar"]
