# Blatently stole... borrowed... yeah... borrowed from Alex Edwards @ https://www.alexedwards.net/blog/a-time-saving-makefile-for-your-go-projects

# Change these variables as necessary.
MAIN_PACKAGE_PATH := ./cmd/web
BINARY_NAME := williams

# ==================================================================================== #
# HELPERS
# ==================================================================================== #

## help: print this help message
.PHONY: help
help:
	@echo 'Usage:'
	@sed -n 's/^##//p' ${MAKEFILE_LIST} | column -t -s ':' |  sed -e 's/^/ /'

.PHONY: confirm
confirm:
	@echo -n 'Are you sure? [y/N] ' && read ans && [ $${ans:-N} = y ]

.PHONY: no-dirty
no-dirty:
	git diff --exit-code


# ==================================================================================== #
# QUALITY CONTROL
# ==================================================================================== #

## tidy: format code and tidy modfile
.PHONY: tidy
tidy:
	go fmt ./...
	go mod tidy -v

## audit: run quality control checks
.PHONY: audit
audit:
	go mod verify
	go vet ./...
	go run honnef.co/go/tools/cmd/staticcheck@latest -checks=all,-ST1000,-U1000 ./...
	go run golang.org/x/vuln/cmd/govulncheck@latest ./...
	go test -race -buildvcs -vet=off ./...


# ==================================================================================== #
# DEVELOPMENT
# ==================================================================================== #

## test: run all tests
.PHONY: test
test:
	go test -v -race -buildvcs ./...

## test/cover: run all tests and display coverage
.PHONY: test/cover
test/cover:
	go test -v -race -buildvcs -coverprofile=/tmp/coverage.out ./...
	go tool cover -html=/tmp/coverage.out

## build: build the application
.PHONY: build
build:
	# Include additional build steps, like TypeScript, SCSS or Tailwind compilation here...
	go build -o=/tmp/bin/${BINARY_NAME} ${MAIN_PACKAGE_PATH}

## run: run the  application
.PHONY: run
run: build
	/tmp/bin/${BINARY_NAME}

## run/live: run the application with reloading on file changes
.PHONY: run/live
run/live:
	go run github.com/cosmtrek/air@v1.43.0 \
		--build.cmd "make build" --build.bin "/tmp/bin/${BINARY_NAME}" --build.delay "100" \
		--build.exclude_dir "" \
		--build.include_ext "go, tpl, tmpl, html, css, scss, js, ts, sql, jpeg, jpg, gif, png, bmp, svg, webp, ico" \
		--build.stop_on_error "true" \
		--misc.clean_on_exit "true"

## db/connect: create to the local database
.PHONY: db/connect
db/connect:
	sqlite3 -column -header db.sqlite

## db/connect: create to the local database
.PHONY: db/wipe
db/wipe: confirm
	rm db.sqlite
	make db/migrations/up

## db/migrations/new name=$1: create a new migration
.PHONY: db/migrations/new
db/migrations/new:
	go run -tags 'sqlite3' github.com/golang-migrate/migrate/v4/cmd/migrate@latest create -seq -ext=.sql -dir=./resources/migrations/sqlite ${name}

## db/migrations/up: apply all up migrations
.PHONY: db/migrations/up
db/migrations/up:
	go run -tags 'sqlite3' github.com/golang-migrate/migrate/v4/cmd/migrate@latest -path=./resources/migrations/sqlite -database="sqlite3://db.sqlite" up

## db/migrations/down: apply all down migrations
.PHONY: db/migrations/down
db/migrations/down: confirm
	go run -tags 'sqlite3' github.com/golang-migrate/migrate/v4/cmd/migrate@latest -path=./resources/migrations/sqlite -database="sqlite3://db.sqlite" down

## db/migrations/goto version=$1: migrate to a specific version number
.PHONY: db/migrations/goto
db/migrations/goto: confirm
	go run -tags 'sqlite3' github.com/golang-migrate/migrate/v4/cmd/migrate@latest -path=./resources/migrations/sqlite -database="sqlite3://db.sqlite" goto ${version}

## db/migrations/force version=$1: force database migration version number
.PHONY: db/migrations/force
db/migrations/force: confirm
	go run -tags 'sqlite3' github.com/golang-migrate/migrate/v4/cmd/migrate@latest -path=./resources/migrations/sqlite -database="sqlite3://db.sqlite" force ${version}

## db/migrations/version: print the current migration version
.PHONY: db/migrations/version
db/migrations/version:
	go run -tags 'sqlite3' github.com/golang-migrate/migrate/v4/cmd/migrate@latest -path=./resources/migrations/sqlite -database="sqlite3://db.sqlite" version

# ==================================================================================== #
# OPERATIONS
# ==================================================================================== #

## push: push changes to the remote Git repository
.PHONY: push
push: tidy audit no-dirty
	git push

## production/deploy: deploy the application to production
.PHONY: production/deploy
production/deploy: confirm tidy audit no-dirty
	GOOS=linux GOARCH=amd64 go build -ldflags='-s' -o=/tmp/bin/linux_amd64/${BINARY_NAME} ${MAIN_PACKAGE_PATH}
	upx -5 /tmp/bin/linux_amd64/${BINARY_NAME}
	# Include additional deployment steps here...