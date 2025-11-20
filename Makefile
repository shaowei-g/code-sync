.PHONY: all install build start dev

all: install build

install:
	@echo "Installing server dependencies..."
	cd server && npm install
	@echo "Installing extension dependencies..."
	cd extension && npm install

build:
	@echo "Building extension..."
	cd extension && npm run build

start:
	@echo "Starting server..."
	cd server && npm start

dev:
	@echo "Starting server in dev mode..."
	cd server && npm run dev
