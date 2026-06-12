install:
	npm install
	cd frontend && npm install

build:
	cd frontend && npm run build

start:
	npx start-server -s ./frontend/dist
