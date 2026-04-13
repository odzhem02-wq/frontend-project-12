install:
	npm install
	cd frontend && npm install

build:
	npm run build

start:
	npx start-server -s frontend/dist