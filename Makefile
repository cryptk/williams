# Williams Project Makefile

.PHONY: all build build/frontend build/backend run/frontend run/backend clean clean/frontend clean/backend lint/frontend lint/backend test/frontend test/backend help


all: build/frontend build/backend
run: build/frontend build/backend
	if [ -e ./build/config.yaml ]; then \
		echo "Using existing config.yaml"; \
	elif [ -e ./backend/configs/config.yaml ]; then \
		echo "Copying personalized config.yaml from backend/configs"; \
		cp ./backend/configs/config.yaml ./build/config.yaml; \
	else \
		echo "No personalized config.yaml found, copying default config"; \
		cp ./backend/configs/config.example.yaml ./build/config.yaml; \
	fi
	cd ./build && ./williams

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
clean: clean/frontend clean/backend

clean/deep: clean/frontend/deep clean/backend/deep
	rm -rf build

clean/frontend:
	rm -rf build/dist frontend/dist

clean/frontend/deep: clean/frontend
	rm -rf frontend/node_modules

clean/backend:
	rm -f build/williams backend/williams backend/server

clean/backend/deep: clean/backend
	rm -f backend/williams.db

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
	@echo "  run               Build everything and run the backend binary from build/"
	@echo "  clean             Remove all build artifacts in build/"
	@echo "  clean/frontend    Remove frontend build artifacts (build/dist)"
	@echo "  clean/backend     Remove backend build binary (build/williams)"
	@echo "  lint/frontend     Lint frontend code"
	@echo "  lint/backend      Lint backend code"
	@echo "  test/frontend     Run frontend tests"
	@echo "  test/backend      Run backend tests"
	@echo "  help              Show this help message"
