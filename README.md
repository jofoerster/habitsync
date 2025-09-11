# HabitSync

A simple self hostable habit tracking application with social features, allowing users to track personal habits and participate in
shared challenges with others.

Demo Server available under: [https://demo.habitsync.de](https://demo.habitsync.de) (very limited resources)

<div>
  <img src="images/1.gif" width="30%" style="margin: 5px;">
  <img src="images/2.gif" width="30%" style="margin: 5px;">
  <img src="images/3.gif" width="30%" style="margin: 5px;">
</div>
<div>
  <img src="images/4.gif" width="30%" style="margin: 5px;">
  <img src="images/5.gif" width="30%" style="margin: 5px;">
  <img src="images/6.gif" width="30%" style="margin: 5px;">
</div>

## Features

- Simple personal habit tracking with goals and progress visualization
- Shared habits to compare progress with friends (monthly medals for top 3)
- One monthly challenge to compete, including leaderboard and voting for the next challenge
- SSO OIDC authentication (optional: require confirmation for new users, multiple issuers possible)
- Email/Apprise notifications as habit reminders
- Dark/Light mode support
- Simple docker setup for deployment
- React Native frontend, web app installable as pwa (mobile apps coming soon)

## Deployment

### Docker (Quickstart for testing)

Start locally using Docker with the following command:
```
docker run \
  -p 6842:6842 \
  -e BASE_URL=http://localhost:6842 \
  -e 'APP_SECURITY_BASIC-AUTH-USERS_test=$2y$10$EyuJ.fL/PzCTMMKTONEquuFLxAR8SAzl9iXF2v.qDZYCh5K2m78fS' \
  ghcr.io/jofoerster/habitsync:latest
```
When started, login under `http://localhost:6842` with username `test` and
password `PASSWORD`.

### Docker Compose (Recommended for production use)

See `docker-compose.yml` for more details on how to run the application using Docker Compose.

```
services:
  web:
    image: ghcr.io/jofoerster/habitsync:latest
    environment:
      - BASE_URL=https://your-domain.com/
      # Choose one or more of the following authentication methods:
      # OIDC Issuers (tested with Authelia, Google), use public client settings (PKCE flow), set BASE_URL/auth-callback as redirect
      # more than one issuer can be configured
      - APP_SECURITY_ISSUERS_<YOUR-ISSUER_NAME>_URL=<issuer-url>
      - APP_SECURITY_ISSUERS_<YOUR-ISSUER_NAME>_CLIENT-ID=<client-id>
      - APP_SECURITY_ISSUERS_<YOUR-ISSUER_NAME>_NEEDS-CONFIRMATION=true # New users need to to be 'let in' by other user, default: true 
      # Google: Use normal web client settings, set CLIENT-SECRET as workaround for Google
      - APP_SECURITY_ISSUERS_GOOGLE_URL=https://accounts.google.com
      - APP_SECURITY_ISSUERS_GOOGLE_CLIENT-ID=<client-id>
      - APP_SECURITY_ISSUERS_GOOGLE_CLIENT-SECRET=<client-secret> # ONLY AS WORKAROUND FOR GOOGLE, PUBLICALLY AVAILABLE TO CLIENTS!
      # Login using username and password (basic auth), recommended for api access
      # Create hash using: htpasswd -bnBC 10 "" password123 | tr -d ':\n' | sed 's/\$/\$\$/g'
      # $ get replaced with $$ to work in env variables. This might be different in other environments
      - APP_SECURITY_BASIC-AUTH-USERS_<username>=<bcrypt-password-hash>
      # Mail setup for notifications
      - SPRING_MAIL_HOST=<mail-host>
      - SPRING_MAIL_USERNAME=<mail-username>
      - SPRING_MAIL_PASSWORD=<mail-password>
      - SPRING_MAIL_PORT=587
       # optional SHA-512 hash of your secret key, generate with `openssl rand -base64 64`. Needed to keep sessions across restarts
      - JWT_SECRET=<your-jwt-secret>
      - APPRISE_API_URL=<your-apprise-url> # optional, see Notifications section below
    volumes:
      - <path-to-database-file-location>:/data #optional for direct access to database, user 6842:6842 needs access
    user: "6842:6842" # optional, run as user with id 6842, same as the application user in the container
    ports:
      - "6842:6842" # Application accessible under this port
      - "9092:9092" # For database access, optional
```

### Notifications (Apprise)
To enable notifications via [Apprise Api](https://github.com/caronc/apprise-api), set the following environment variables:
```
- APPRISE_API_URL=<your-apprise-url> # e.g. http://apprise-api:8000
```
For a complete example, see `examples/docker-compose-apprise.yml`.

## Development Setup

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

## Database and Backups

The application uses H2 database by default with file-based storage. The database file `habittracker-db.mv.db`
optionally can be mounted as a volume in production and can be backed up by copying the file.
You can also connect to the database using a database client on port `9092`.
To use a different database (not tested), set the appropriate Spring datasource environment variables.

## API Documentation

There is currently no official API documentation. The API is incomplete and may change.

## Contributing

All contributions are welcome!

## Known Issues / TODOs

### Backend

- Improve shared habit connection cleanup

### Frontend

- Add push notifications support
- Support for mobile apps

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
