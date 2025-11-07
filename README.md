# Social Media API

A Node.js and Express proof of concept for a lightweight social media backend. It exposes endpoints to register and authenticate users, create and paginate posts, and toggle likes. MongoDB is used for persistence via Mongoose.

## Features

- User registration and JWT based authentication
- Post creation with cursor-based pagination
- Like/unlike toggle that tracks which users reacted to a post
- Ready-to-run Postman/Newman collection for automated regression checks

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB instance (local or remote)
- Optional: Docker and Docker Compose for containerised development

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file (or export environment variables) with at least:
   ```bash
   MONGODB_URI=mongodb://localhost:27017/social_media
   JWT_SECRET=your_jwt_secret_key
   ```
3. Start the API server:
   ```bash
   npm run dev
   ```
   The service listens on `http://localhost:3000` by default.

### Using Docker Compose

If you prefer containers, a `docker-compose.yml` is provided. It boots both the API and MongoDB services with sensible defaults:

```bash
docker-compose up --build
```

This command exposes the API on port `3000` and MongoDB on `27017`.

## Newman/Postman tests

Automated integration tests live under `newman/`. They cover the critical flows:

- Registering a user and storing the issued JWT
- Logging in with the created credentials
- Creating several posts and verifying cursor-based pagination (no duplicates across pages)
- Creating a post dedicated to like tests and asserting the like/unlike toggle updates counts correctly

Run the suite with Newman:

```bash
npm run test:postman
```

The command executes `newman/Test_API.postman_collection.json` against the base URL defined in `newman/Test_API.postman_environment.json`.

## Project structure

- `src/` – Express application source code (routes, controllers, models and utilities)
- `newman/` – Postman collection and environment files for automated tests
- `docker-compose.yml` – Development docker setup for the API and MongoDB

## Further reading

- [Express documentation](https://expressjs.com/)
- [Mongoose documentation](https://mongoosejs.com/)
- [Newman CLI](https://www.npmjs.com/package/newman)
