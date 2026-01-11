# Stage 1: Build
FROM eclipse-temurin:21 AS builder

WORKDIR /app

COPY mvnw .
COPY .mvn .mvn

COPY pom.xml .

RUN chmod +x mvnw

RUN ./mvnw dependency:go-offline

COPY src ./src

RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 3000

ENTRYPOINT ["java","-jar","app.jar"]