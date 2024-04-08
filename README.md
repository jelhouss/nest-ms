# Implementation of a Nest.js Microservice: Authentication

This Nest.js backend handles authentication (JWT), it manages tokens while connecting to a microservice (mailing TCP service).

It's made just for the exploration of Nest.js features.
Implementing a TCP microservice follows the same techniques to implement other transports/microservices in Nest.js (e.g. Kafka, RabbitMQ). This was just to understand working with Nest.js features (booting an app, validating a request payload, implementing a guard, injecting modules, working with a monorepo).

### Docker

Simply run `pnpm run compose` to run all services and Prisma migrations using Docker, and see it in action.

### Routes

- `GET /user`: Return all users **(protected)**
- `GET /user/:id`: Return a user by id **(protected)**
- `POST /auth/signup`: Register a user
- `POST /auth/signout/:id`: Logout a user **(protected)**
- `POST /auth/signin`: Login a user
- `POST /auth/refresh/:id`: Refresh access token **(protected)**

Authentication service is running on port **4001** by default (set `AUTH_PORT` and check your `.env` file)

For more, read about it here: https://blog-jelhouss.vercel.app/posts/nest-ms
