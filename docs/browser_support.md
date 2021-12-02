# Browser Support

`deeplinks.js` uses the [Selection API](https://caniuse.com/selection-api) and [ES6 modules](https://caniuse.com/es6-module) with [dynamic imports](https://caniuse.com/es6-module-dynamic-import). This is supported by around 94% of browsers in 2021, according to [caniuse](https://caniuse.com/), including modern (2019 and later) versions of Chrome, Firefox, Safari, Edge, Opera, Samsung Internet, and QQ Browser (including mobile versions, where applicable). The most widely used **unsupported** browsers are Opera Mini (1.09% global share), UC Browser (0.98%), Internet Explorer (0.87%), and KaiOS Browser (0.06%). Note that while Opera Mini is unsupported, that's different from Opera Mobile, which should work fine — Opera Mini is [well-understood](https://dev.opera.com/articles/opera-mini-and-javascript/) to break many things that are dependent on Javascript.

The end-to-end test suite is currently run on Chrome and Firefox, but bugs will be fixed for any browsers that have support for the necessary APIs.

[Multi-select](https://developer.mozilla.org/en-US/docs/Web/API/Selection/rangeCount) works on supported browsers (I *think* this means only Firefox, but possibly other browsers as well). Trying to open a multi-selected link on a browser that does not have multi-select support will result in a error message, and only the first selection being selected.
