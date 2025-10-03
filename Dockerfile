# Multi-stage Dockerfile for Williams

# --- Backend build stage ---
FROM golang:1.25.1-alpine3.22 AS backend-builder
WORKDIR /app/backend
# Install build dependencies for CGO and sqlite3
RUN apk add gcc musl-dev sqlite-dev
# Copy go.mod and go.sum first for better build caching
COPY backend/go.mod backend/go.sum ./
RUN go mod download
# Copy the rest of the backend source
COPY backend/ .
# Build with CGO enabled for go-sqlite3
ARG VERSION="dev"
RUN go build -ldflags "-X github.com/cryptk/williams/internal/config.Version=${VERSION}" -o /app/williams ./cmd/server

# --- Frontend build stage ---
FROM node:24-alpine3.22 AS frontend-builder
WORKDIR /app/frontend
COPY frontend/ .
ARG VERSION="dev"
RUN npm install && VERSION=${VERSION} npm run build

# --- Final minimal image ---
FROM alpine:3.22
# Set environment variable for static assets path
ENV WILLIAMS_SERVER_STATIC_ASSETS_PATH="./dist"
ENV WILLIAMS_SERVER_HOST="0.0.0.0"
# Install runtime dependencies for sqlite3
RUN apk add --no-cache sqlite-libs
WORKDIR /opt/williams
# Copy backend binary
COPY --from=backend-builder /app/williams williams
# Copy frontend build assets
COPY --from=frontend-builder /app/frontend/dist ./dist
EXPOSE 8080
ENTRYPOINT ["/opt/williams/williams"]
