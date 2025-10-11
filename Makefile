# Williams Project Makefile


# List of all targets for .PHONY
.PHONY: all build build/frontend build/backend run/frontend run/backend clean clean/frontend clean/backend lint/frontend lint/backend test/frontend test/backend help populate-demo frontend frontend-dev backend backend-dev frontend-backend frontend-backend-dev
.DEFAULT_GOAL := all

VERSION ?= $(shell git describe --tags --always --dirty)

GO_TARGET = build/williams
GO_SOURCES := $(shell find backend -name '*.go' -o -name 'go.mod' -o -name 'go.sum')
GO_MODULE_NAME := github.com/cryptk/williams
GO_LDFLAGS := -ldflags "-X github.com/cryptk/williams/internal/config.Version=${VERSION}"

FRONTEND_TARGET_JS = $(wildcard build/dist/assets/index-*.js)
FRONTEND_TARGET_CSS = $(wildcard build/dist/assets/index-*.css)
FRONTEND_SOURCES := $(shell find frontend/ -type f ! -path 'frontend/node_modules/*' -name '*.jsx' -o -name '*.css' -o -name '*.html' -o -name 'package.json' -o -name 'vite.config.js')


all: build/frontend build/backend ## Build both frontend and backend

build/docker: ## Build Docker image
	docker build --progress=plain --build-arg VERSION=${VERSION} -t williams:${VERSION} -t williams:latest .

$(GO_TARGET): $(GO_SOURCES) ## Build backend binary
	@echo "Building backend with VERSION=${VERSION}"
	cd backend && go mod download
	cd backend && go build ${GO_LDFLAGS} -o ../build/williams ./cmd/server
	@echo "Backend built successfully."

build/backend: build/williams ## Build backend binary

$(FRONTEND_TARGET_JS) $(FRONTEND_TARGET_CSS): $(FRONTEND_SOURCES) ## Ensure frontend is built
	@echo "Building frontend with VERSION=${VERSION}"
	cd frontend && npm install
	cd frontend && VERSION=${VERSION} npm run build -- --emptyOutDir --outDir ../build/dist
	@echo "Frontend built successfully."

build/frontend: $(FRONTEND_TARGET_JS) $(FRONTEND_TARGET_CSS) ## Build frontend production artifacts

configure: build/config.yaml ## Configure the application by setting up config.yaml
build/config.yaml: backend/configs/config.yaml backend/configs/config.example.yaml
	mkdir -p build
	@if [ -e ./build/config.yaml ]; then \
		echo "Using existing config.yaml"; \
	elif [ -e ./backend/configs/config.yaml ]; then \
		echo "Copying personalized config.yaml from backend/configs"; \
		cp ./backend/configs/config.yaml ./build/config.yaml; \
	else \
		echo "No personalized config.yaml found, copying default config"; \
		cp ./backend/configs/config.example.yaml ./build/config.yaml; \
	fi

run: build/frontend build/backend configure ## Build and run both frontend and backend
	cd ./build && ./williams

run/frontend: ## Run frontend in development mode
	cd frontend && npm install && npm run dev

run/backend: ## Run backend in development mode
	cd backend && go run ./cmd/server/main.go

clean: clean/frontend clean/backend ## Clean all build artifacts

clean/deep: clean/frontend/deep clean/backend/deep ## Deep clean all build artifacts including databases and node modules
	rm -rf build

clean/frontend: ## Clean frontend build artifacts
	rm -rf build/dist

clean/frontend/deep: clean/frontend ## Deep clean frontend including node modules
	rm -rf frontend/node_modules

clean/backend: ## Clean backend build artifacts
	rm build/williams

clean/backend/deep: clean/backend ## Deep clean backend including database
	rm backend/williams.db

lint/frontend: ## Lint frontend code
	cd frontend && npm run lint || echo "No linter configured."

lint/backend: ## Lint backend code
	cd backend && go fmt ./... && (golint ./... || echo "golint not installed.")

test/frontend: ## Run frontend tests
	cd frontend && npm test || echo "No frontend tests configured."

help: ## Show this help message
	@echo "Usage: make <target>"
	@echo ""
	@awk 'BEGIN {FS = ":| #"} /^[a-zA-Z0-9_./-]+:.*##/ { printf "\033[36m%-24s\033[0m %s\n", $$1, $$3 }' $(MAKEFILE_LIST)
	@echo ""
