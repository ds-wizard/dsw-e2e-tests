RUN_CMD=npx cypress run

.PHONY: install
install:
	@npm install


.PHONY: start
start:
	@cd dsw && docker-compose pull && docker-compose up -d


.PHONY: stop
stop:
	@cd dsw && docker-compose stop && docker-compose rm -f


.PHONY: run
run:
	@$(RUN_CMD)


.PHONY: all
all:
	@make clean && make start && ($(RUN_CMD) || true) && make stop


.PHONY: open
open:
	npx cypress open

.PHONY: clean
clean:
	@rm -rf output