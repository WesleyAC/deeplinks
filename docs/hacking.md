# How to hack on `deeplinks.js`

First, install the dependencies. If you're using [NixOS](https://nixos.org/), there's a [`shell.nix`](../shell.nix) file provided. Otherwise, I *think* just [installing `yarn`](https://yarnpkg.com/getting-started/install) should do. You'll need to have Firefox, Chrome, and Python 3 installed to run the end-to-end tests, as well.

Once you've done that, you can `yarn build` to generate the code in `dist/`, `yarn lint` to run the linter, and `yarn test` to run the end-to-end tests (which will automatically run the lint and build steps first).

I usually work in one of two modes: if I already have tests written for the code I'm working on, I just make some edits and run `yarn test` when I think I've gotten something working. If I don't yet have tests written for the thing that I'm working on, I'll run `python3 -m http.server` in the project root directory, and then go to [http://localhost:8000/tests/html/e2e.html](http://localhost:8000/tests/html/e2e.html) in order to manually try it out.
