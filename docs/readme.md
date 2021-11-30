# `deeplinks.js`

`deeplinks.js` is a script that allows users to easily link directly to any text selection on your website. [Here's](https://notebook.wesleyac.com/what-hypertext-could-be/#1.GHfGDDIwx:21.GHfGDDIwx:62) an example of what one of these links looks like. It's intended mostly for blogs and other such websites, although it is relatively agnostic to the environment it's running in.

Users can select text on the site as the normally would, and when they do, the [fragment identifier](https://en.wikipedia.org/wiki/URI_fragment) (the thing that comes after the `#` in the URL) changes. If they want to share the text they have selected, they simply copy the URL, including the fragment identifier. When someone else visits that URL, the same bit of text will be selected and scrolled into view.

That description makes it sound a little complicated, but it's actually pretty simple and intuitive once you start playing with it — go check it out! If you're interested in knowing the details of how it works under the hood, check out [`docs/design/`](/docs/design).

## Goals

* Plug-and-play. Copy the files, drop `<script type="module" src="/deeplinks/deeplinks.js"></script>` in your website, and it works.
* Robust. Updates will not break links to older URLs.
* Short links. Long URLs are ugly and frequently mangled by messaging apps. URLs should be short and not contain characters likely to be mangled by misbehaving apps.
* Subtle. It shouldn't get in the reader's way. It doesn't break normal fragment-identifier links.
* Reasonably small. It's around 2kb right now (~1.1kb gziped), and shouldn't grow too much more.
* Fast. This isn't hard, but it's worth making explicit.

## Non-goals

* Handling very-frequently-changing content, such as wikis. It should be robust to occasional small edits, but if you want truly robust deep linking, you really need CRDTs.
* Working for every usecase. I have specific things that I want in a script like this, and other people will have other things they want. Those people should build their own similar scripts — diversity is good!

## Installation

First, consider whether you really want to do this. If you do, you are making new URLs, which will break if you ever remove the script from your site. Breaking URLs makes me sad, so you should think about whether you're really committed to this or not, and maybe play with it locally for a little while to see how it feels before you really deploy it.

Once you're sure:

```
$ yarn build
$ cp -r dist/ ~/your-webiste/deeplinks/
```

Then, add this snippet to pages you want to enable deep-linking on:

```html
<script type="module" src="/deeplinks/deeplinks.js"></script>
```
