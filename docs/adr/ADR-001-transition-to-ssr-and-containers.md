# ADR-001: Transition from Static Site to Containerized SSR Runtime

## Status

Accepted (Date: 2026-10-21)

## Context

Until now, the site has been fully static: Astro pre-builds every page to HTML at build time, and the files are hosted on Amazon S3 behind CloudFront.

The next stage of the project needs things a static site cannot do:

- A live `/api/health` endpoint that reports whether the application is running, so a container platform (AWS ECS) can check its health.
- Structured JSON logs for each request, so they can be searched in Amazon CloudWatch.
- A Node.js server that can be packaged as a Docker container.

Static hosting on S3 can only serve files. It cannot run server-side code.

## Decision

We will add the official `@astrojs/node` adapter in `standalone` mode, so the build produces a self-contained Node.js server (`dist/server/entry.mjs`) that listens on a port (4321).

We will use **per-route rendering** rather than making every page server-rendered:

- Content pages (home, blog, about, soccer) stay **pre-rendered** at build time.
- Only API routes such as `/api/health` opt in to on-demand rendering with `export const prerender = false`.

Structured JSON logging is added as Astro middleware (`src/middleware.ts`).

Because the build output is now split into `dist/client` (static files) and `dist/server` (server code), the CDK `BucketDeployment` source changes from `../dist` to `../dist/client`, so the existing S3 and CloudFront site keeps working.

In later weeks the Node server will be packaged as a Docker image and run on AWS ECS.

## Consequences

**Positive**

- Enables live API routes and operational health checks.
- Structured logs make production problems easier to search and diagnose.
- Pages stay fast and cheap, because they are still pre-built and can still be served from the CDN.
- The static S3/CloudFront site keeps working alongside the new server.

**Negative**

- More operational complexity: there is now a running server to build, deploy, monitor and keep healthy.
- Running a container costs more than hosting static files.
- Request logging only covers routes rendered on the server, not pre-built pages.