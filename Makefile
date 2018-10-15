.PHONY: install
install:
	@make install


.PHONY: start
start:
	@cd dsw && docker-compose up -d


.PHONY: stop
stop:
	@cd dsw && docker-compose stop && docker-compose rm -f


.PHONY: run
run:
	@npx cucumber-js


.PHONY: all
all:
	@make start && make run && make stop
