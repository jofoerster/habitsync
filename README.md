# DEPLOYMENT INSTRUCTIONS AND SETUP GUIDE AS WELL AS PUBLIC DOCKER IMAGES IN PROGRESS AND WILL BE AVAILABLE SOON

# HabitSync

A simple habit tracking application with social features, allowing users to track personal habits and participate in
shared challenges with others.

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

## Development Setup

## Prerequisites

- Java 21
- Maven 3.6+
- Node.js 18+
- npm or yarn
- Docker and Docker Compose (for deployment)

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

4. Run the development server:
   ```bash
   npm run web
   ```

5. The UI will be available at `http://localhost:8081`

## Configuration

### Manual Deployment

#### Backend

1. Build the Docker image:
   ```bash
   cd habitsync-api
   mvn spring-boot:build-image
   ```

#### Frontend

1. Build for web:
   ```bash
   cd habitsync-ui
   npx expo export --platform web
   docker build -t habitsync-ui:0.0.1-SNAPSHOT .
   ```

## Database

The application uses H2 database by default with file-based storage. The database file `habittracker-db.mv.db` should be
mounted as a volume in production and can be backed up by copying the file.

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
