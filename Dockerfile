FROM eclipse-temurin:17
RUN mkdir /opt/app
COPY build/libs/project-name docker-app.jar
CMD ["java","-jar", "docker-app.jar"]
EXPOSE 8080
