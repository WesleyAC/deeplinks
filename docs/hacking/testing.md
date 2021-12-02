# Testing

There are two main approaches to testing `deeplinks.js`: hardcoded end-to-end tests, and generative testing.

# Hardcoded end-to-end tests

These mostly take some hardcoded URL fragment and verify that the text that's selected is what's expected. They can be run with `yarn test`.

# Generative tests

Generative testing is a approach where rather than hardcoding the test cases, random test cases are made up on the fly. This is also frequently called "property-based testing."

Right now, the generative tests are pretty simple — they select some range of text on the page, look at what the URL fragment is set to, open a new page with that fragment, and check that the same text is selected in both cases.

The generative tests can be run with `yarn proptest`. This will keep running until a bug is found, so you'll probably want to kill it at some point once you're satisfied that it's unlikely to find anything.
