# Dependencies 

While the `deeplinks.js` bundle itself has no dependencies, I rely on several tools and libraries to build it. This document lists those, and provides the justification for using each one.

## [Yarn](https://yarnpkg.com/)

I chose Yarn instead of NPM primarily because my most recent experience with javascript projects (mostly [zulip-mobile](https://github.com/zulip/zulip-mobile/)) was with yarn, and I was happy enough with it, especially compared to my (albeit older) experience with NPM. My impression is that which one you choose doesn't really matter for a project of this size.

I'm using Yarn 2 because it seems like that's what you're supposed to do these days?

## [TypeScript](https://www.typescriptlang.org/)

I'm using TypeScript because, despite having a significantly worse type system than [Flow](https://flow.org/), the community support is much better — libraries tend to have TypeScript annotations, and Playwright works with it by default. I'm a bit astonished by how many things it doesn't catch for me, even in strict mode, but I *think* this tradeoff is worth it.

## [Rollup](https://rollupjs.org)

I'm using Rollup as my bundler because it seemed to have good support for outputting ES6 modules, and because my past experiences with Webpack have not been good. I don't have many complaints so far, but I also haven't been exercising it very much.

## [Playwright](https://playwright.dev/)

I'm using Playwright for end-to-end tests because [Julia said it was nice](https://twitter.com/b0rk/status/1463916765541507080). So far, it mostly has been nice!

## [Terser](https://terser.org/)

I'm using Terser because it appears to be the only serious minifier that supports ES6. I'm not terribly happy with its performance — I often have to rewrite my code to get minifications that seem like they should be simple to implement programmatically — but it seems like the best thing at the moment.

## [ESLint](https://eslint.org/)

I'm using ESLint because I've had experiences with it in the past that haven't been terrible, and because it allows me to configure it. I'm frustrated by the non-aggressive defaults, byzantine configuration system, and lackluster TypeScript support, but haven't bothered to try to find something else.

## [`cyrb53` hash](https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript/52171480#52171480)

I'm using the [`cyrb53` hash function](https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript/52171480#52171480) primarily because I was in a lazy copy-shit-from-stackoverflow mood when I was first writing `deeplinks.js`. However, upon further evaluation, it seems to provide a very reasonable tradeoff between collision probability and code size — because of this, I've chosen to keep using it for the moment, although I may end up selecting a different function in the future if I find one that's better.

## [radix64 encoding](https://stackoverflow.com/questions/6213227/fastest-way-to-convert-a-number-to-radix-64-in-javascript/6573119#6573119)

I chose [this implementation](https://stackoverflow.com/questions/6213227/fastest-way-to-convert-a-number-to-radix-64-in-javascript/6573119#6573119) of radix64 encoding, since it was the most reasonable implementation I could quickly find, in terms of not having glaringly obvious bugs, and being quite small. I've since made several modifications, but the core of it is the same.
