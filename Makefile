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
	$(CYPRESS) run --record --key $(CYPRESS_RECORD_KEY)


.PHONY: all
all:
	@make clean && make init && make start && ($(CYPRESS) run || true) && make stop

.PHONY: wait
wait:
	@while ! curl http://localhost:3000/ 2>/dev/null; \
	do \
		echo "Retrying ..."; \
		sleep 2; \
	done

.PHONY: open
open:
	$(CYPRESS) open --browser chrome --e2e

.PHONY: clean
clean:
	@rm -rf output && rm -f dsw/docker-compose.yml

.PHONY: ci
ci:
	make clean
	make init
	make start
	make wait
	make run
	make stop
