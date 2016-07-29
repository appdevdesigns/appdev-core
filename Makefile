REPORTER = dot

test:
	@NODE_ENV=test PORT=9999 ./node_modules/.bin/mocha \
    --reporter $(REPORTER) \
    test/bootstrap.test.js \
    test/**/*.js

    @NODE_ENV=test mocha-phantomjs \
    -R $(REPORTER) \
    assets/appdev/test/test-reauth.html

    @NODE_ENV=test mocha-phantomjs \
    -R $(REPORTER) \
    assets/appdev/test/test-all.html

.PHONY: test
