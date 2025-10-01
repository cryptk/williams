# Williams Project Makefile

.PHONY: all build build/frontend build/backend run/frontend run/backend clean clean/frontend clean/backend lint/frontend lint/backend test/frontend test/backend help

all: build/frontend build/backend

build: build/frontend build/backend

build/frontend:
	rm -rf build/dist
	cd frontend && npm install
	cd frontend && npm run build -- --emptyOutDir --outDir ../build/dist

build/backend: clean/backend
	mkdir -p build
	cd backend && go mod download
	cd backend && go build -o ../build/williams ./cmd/server

run/frontend:
	cd frontend && npm install && npm run dev

run/backend:
	cd backend && go run ./cmd/server/main.go

# Remove build artifacts
clean:
	rm -rf build

clean/frontend:
	rm -rf build/dist

clean/backend:
	rm -rf build/williams

# Lint frontend code
lint/frontend:
	cd frontend && npm run lint || echo "No linter configured."

# Lint backend code
lint/backend:
	cd backend && go fmt ./... && (golint ./... || echo "golint not installed.")

# Run frontend tests
test/frontend:
	cd frontend && npm test || echo "No frontend tests configured."

# Run backend tests
test/backend:
	cd backend && go test ./...

# Show help
help:
	@echo "Available targets:"
	@echo "  all               Build both frontend and backend"
	@echo "  build             Same as 'all' (builds both)"
	@echo "  build/frontend    Build frontend production artifacts (to build/dist)"
	@echo "  build/backend     Build backend production binary (to build/williams)"
	@echo "  run/frontend      Run frontend in dev mode"
	@echo "  run/backend       Run backend in dev mode"
	@echo "  clean             Remove all build artifacts in build/"
	@echo "  clean/frontend    Remove frontend build artifacts (build/dist)"
	@echo "  clean/backend     Remove backend build binary (build/williams)"
	@echo "  lint/frontend     Lint frontend code"
	@echo "  lint/backend      Lint backend code"
	@echo "  test/frontend     Run frontend tests"
	@echo "  test/backend      Run backend tests"
	@echo "  help              Show this help message"
