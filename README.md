# Social Media API POC

This repository contains a proof-of-concept REST API for a minimalist social network. It is built with **Node.js**, **Express**, and **MongoDB** using Mongoose for data modelling. The codebase demonstrates JWT-based authentication, cursor-driven pagination for infinite scrolling, and like toggling on posts. A Postman/Newman collection is provided to verify the end-to-end flows.

## Features

- User registration with salted password hashing and JWT issuance
- Email/password login that returns a short user profile and access token
- Authenticated post creation with automatic like counts
- Cursor-based pagination that avoids duplicates when new posts are published between requests
- Like/unlike toggling backed by MongoDB ObjectIds to keep operations idempotent
- Comprehensive Newman test suite covering auth, pagination, and likes

## Project structure

```
.
├── newman/                          # Postman environment + automated test collection
├── src/
│   ├── app.js                       # Express application wiring
│   ├── server.js                    # Server bootstrap + database lifecycle
│   ├── config/database.js           # MongoDB connection helpers
│   ├── controllers/                 # Thin HTTP controllers delegating to services
│   ├── middleware/                  # Shared Express middleware (e.g. JWT auth)
│   ├── models/                      # Mongoose schemas for users and posts
│   ├── routes/                      # Route definitions per resource
│   ├── services/                    # Business logic for auth and posts
│   └── utils/                       # Small shared helpers (HttpError, etc.)
├── docker-compose.yml               # Optional Docker stack for API + MongoDB
└── package.json                     # Scripts and dependencies
```

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB instance (local or remote)
- Optional: Docker and Docker Compose if you prefer containerised setup

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure the environment:
   - Copy `.env.example` to `.env` (or create one) and set `MONGODB_URI` plus `JWT_SECRET`.
   - Defaults fall back to `mongodb://localhost:27017/social-media-api` and a demo JWT secret.

3. Start MongoDB locally or run `docker-compose up -d` to launch the API and database together.

4. Start the development server:
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:3000` by default.

## Running the Newman test suite

The Postman collection exercises registration, login, post creation, cursor pagination, and like toggling. Ensure the API and MongoDB are running, then execute:

```bash
npm run test:postman
```

The command runs `newman/Social_Media_API_cursor.postman_collection.json` with the shared environment file. Tests are stateful within a run and clean up their environment variables automatically between major steps.

## API overview

| Method | Endpoint                         | Description                                | Auth |
| ------ | -------------------------------- | ------------------------------------------ | ---- |
| POST   | `/api/auth/register`             | Register a new user and return JWT         | No   |
| POST   | `/api/auth/login`                | Authenticate and issue a JWT               | No   |
| POST   | `/api/posts`                     | Create a new post                          | Yes  |
| GET    | `/api/posts?limit=&cursor=`      | Fetch posts using cursor pagination        | Yes  |
| POST   | `/api/posts/:postId/like`        | Toggle like/unlike for the authenticated user | Yes |

You can import the Postman collection located in the `newman/` directory to explore the endpoints interactively.

## Development tips

- Controllers remain thin and delegate to services; add new domain logic in `src/services/` and surface it via controllers.
- Global error handling uses a shared `HttpError` helper so services can throw status-aware errors.
- Cursor pagination encodes MongoDB ObjectIds in base64; when extending feeds, reuse `encodeCursor`/`decodeCursor` patterns for consistency.

Happy hacking!
