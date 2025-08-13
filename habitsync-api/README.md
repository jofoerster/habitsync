# TODOs

- [ ] complete/fix notification system
  - [ ] send notification when someone wants to join
  - [ ] show notification on challenge view to vote
  - [ ] push notifications on phone
  - [ ] show notification count on every page
  - [ ] check timezone of server
- [ ] delete connections to shared habits when habit is deleted
- [ ] allow pictures as part of shared habit/habit progress

# Deployment

```bash
mvn clean install
```

```bash
mvn spring-boot:build-image
```

Copy images to server locally
```bash
docker save docker.io/library/syncserver:0.0.1-SNAPSHOT | ssh ubuntu1 'docker load'
```

Auto deploy
```bash
(mvn spring-boot:build-image) && docker save docker.io/library/syncserver:0.0.1-SNAPSHOT | ssh ubuntu1 'docker load && cd ~/configurations/habitsync && docker compose up -d'
```
