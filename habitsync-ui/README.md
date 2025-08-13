# Run locally

To run the frontend locally, use the following command: `npm run web`. Use the `.env` file to set 
environment variables such as the *API URL*.

# TODOs
 - fix timezone issues
 - fix sorting of habits in habit list
 - improve color selection for habits
 - add push notifications 

# Installation + Deployment

## Option 1: Build locally then Docker

Build with environment variables:

```bash
npx expo export --platform web
```

```bash
docker build -t habitsync-ui .
```

Auto Deploy to server:

```bash
npx expo export --platform web && docker build -t habitsync-ui:0.0.1-SNAPSHOT . && docker save habitsync-ui:0.0.1-SNAPSHOT | ssh ubuntu1 'docker load && cd ~/configurations/habitsync && docker compose up -d'
```