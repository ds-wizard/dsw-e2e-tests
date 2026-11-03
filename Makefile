CYPRESS=./node_modules/.bin/cypress


.PHONY: install
install:
	@npm install


.PHONY: init
init:
	@scripts/init.sh


.PHONY: start
start:
	@scripts/start.sh


.PHONY: stop
stop:
	@cd dsw && docker compose down


.PHONY: run
run:
	@$(CYPRESS) run


.PHONY: all
all:
	@make clean && make init && make start && ($(CYPRESS) run || true) && make stop


.PHONY: open
open:
	@$(CYPRESS) open --browser chrome --e2e


.PHONY: clean
clean:
	@rm -rf output && rm -f dsw/docker-compose.yml


.PHONY: templates
templates:
	@scripts/build-templates.sh
