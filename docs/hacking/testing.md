# Testing

There are two main approaches to testing `deeplinks.js`: hardcoded end-to-end tests, and generative testing.

# Hardcoded end-to-end tests

These mostly take some hardcoded URL fragment and verify that the text that's selected is what's expected. They can be run with `yarn test`. These tests currently don't test the `selectionToFragment` code — if you're modifying that, you should use the generative tests desribed below, which do exercise that code.

# Generative tests

Generative testing is a approach where rather than hardcoding the test cases, random test cases are made up on the fly. This is also frequently called "property-based testing."

Right now, the generative tests are pretty simple — they select some range of text on the page, look at what the URL fragment is set to, open a new page with that fragment, and check that the same text is selected in both cases.

The generative tests can be run with `yarn proptest`. You can also specify a number of runs, like `yarn proptest 1000`. You can choose what browsers are used with the `--firefox` and `--chromium` flags — chromium is default, since it's significantly faster.
