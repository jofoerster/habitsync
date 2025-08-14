# DEPLOYMENT INSTRUCTIONS AND SETUP GUIDE AS WELL AS PUBLIC DOCKER IMAGES IN PROGRESS AND WILL BE AVAILABLE SOON

# HabitSync

A simple habit tracking application with social features, allowing users to track personal habits and participate in
shared challenges with others.

![image](images/img.png)

## Features

- Personal habit tracking with progress visualization
- Shared habits and challenges with other users
- SSO OIDC authentication
- Email notifications
- Cross-platform UI (Web, iOS, Android)
- Dark/Light mode support
- Simple docker setup for deployment

## Deployment

### Using Docker Compose

1. Update the environment variables in `docker-compose.yml` and start the application. That's all.

### Docker

```
docker run \
  -p 6842:6842 \
  -e BASE_URL=http://localhost:6842 \
  -e APP_SECURITY_BASIC_AUTH_USERS=test:$2y$10$xBSslnUjM3WUHE3/LnxQf.993lLLLrvhhYg/./DBUU9DXUpu9b8hGj \
  habitsync
```

## Development Setup

## Prerequisites

- Java
- Maven
- Node.js
- npm

### Backend API

1. Navigate to the API directory:
   ```bash
   cd habitsync-api
   ```

2. Install dependencies and run:
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```
3. The API will be available at `http://localhost:8080`

### Frontend UI

1. Navigate to the UI directory:
   ```bash
   cd habitsync-ui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```
   
3. Set necessary environment variables in `.env`

4. Run the development server:
   ```bash
   npm run web
   ```

5. The UI will be available at `http://localhost:8081`

## Database

The application uses H2 database by default with file-based storage. The database file `habittracker-db.mv.db`
optionally can be mounted as a volume in production and can be backed up by copying the file.

## API Documentation

[Add API documentation URL or swagger endpoint]

## Contributing

[Add contribution guidelines]

## Known Issues / TODOs

### Backend

- Complete notification system implementation
- Fix timezone handling
- Add support for habit progress pictures
- Improve shared habit connection cleanup

### Frontend

- Fix timezone issues
- Improve habit list sorting
- Enhance color selection for habits
- Add push notifications support

## Release Process

```bash
./release/prepare-release.sh 1.2.3
git push origin develop

git checkout main
git merge develop
git push origin main

# Release via GitHub Actions
# Go to Actions → "Release and Deploy" → Run workflow → Enter "1.2.3"

git checkout develop
./release/prepare-release.sh 1.3.0-SNAPSHOT
git push origin develop
```
