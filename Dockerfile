# Multi-stage Dockerfile for Williams

# --- Backend build stage ---
FROM golang:1.25.1-alpine3.22 AS backend-builder
WORKDIR /app
# Install build dependencies for CGO and sqlite3
RUN apk add --no-cache gcc musl-dev sqlite-dev
# Copy go.mod and go.sum first for better build caching
COPY backend/go.mod backend/go.sum ./
RUN go mod download
# Copy the rest of the backend source
COPY backend/ ./backend/
WORKDIR /app/backend
# Build with CGO enabled for go-sqlite3
RUN go build -o /williams ./cmd/server

# --- Frontend build stage ---
FROM node:24-alpine3.22 AS frontend-builder
WORKDIR /app
COPY frontend/ ./frontend/
WORKDIR /app/frontend
RUN npm install && npm run build

# --- Final minimal image ---
FROM alpine:3.22
# Install runtime dependencies for sqlite3
RUN apk add --no-cache sqlite-libs
# Copy backend binary
COPY --from=backend-builder /williams /williams
# Copy frontend build assets
COPY --from=frontend-builder /app/frontend/dist /build/dist
EXPOSE 8080
ENTRYPOINT ["/williams"]
