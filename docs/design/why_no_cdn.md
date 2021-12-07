# Why `deeplinks.js` doesn't recommend using a CDN

Many javascript projects recommend that people use a CDN like [jsdelivr](https://www.jsdelivr.com/) or [unpkg](https://unpkg.com/) to include the code on their website. This has the advantage that it's quicker to get started with and potentially faster to load, since the code can be cached across multiple sites. However, it also has downsides when it comes to privacy, security, and systemic risk, and it may not be faster in all cases. Here's why I don't recommend using a CDN for `deeplinks.js` in my installation instructions.

## Systemic Risk

The big javascript CDNs are used by huge numbers of people — [jsdelivr serves nearly 100 billion requests per month](https://www.jsdelivr.com/blog/jsdelivr-keeps-growing-and-expanding/), [unpkg serves ~2.4 billion unique IP addresses per month](https://twitter.com/mjackson/status/1296147192411955200), and [cdnjs brags that it's on 12.5% of websites on the internet, and serves more that 200 billion requests per month](https://cdnjs.com/about). This means that one of these CDNs going down, or an attacker hacking one of them would have a huge impact all over society — we already see this with [large swaths of the internet going down every time cloudflare has an outage](https://techcrunch.com/2020/07/17/cloudflare-dns-goes-down-taking-a-large-piece-of-the-internet-with-it/).

There's a [fundamental tradeoff](https://notebook.wesleyac.com/efficiency-resiliency/#1.88jCJ_U1E:96.88jCJ_U1E:174) here between efficiency and resiliency, and when 12.5% of the internet can have an outage because of one provider going down, I think we've swung way too far away from resiliency, as a society.

## Privacy

The most major concern that stems from this centralization is that of privacy — in the normal case, the only people who know when you visit a website are the people running that website, and the operators of the internet infrastructure between your computer and the server (which is *also* shockingly centralized, but that's a story for another day). When a website includes a javascript file with a CDN, that CDN is then able to tell that you've visited that website. Most people realize that companies like Google keep a profile of nearly everywhere you go on the web, but normal people haven't even heard of Cloudflare, and despite that, they have a similarly complete picture of where you go on the internet. They [pinky promise](https://www.cloudflare.com/privacypolicy/) that they won't sell logs (privacy policy subject to unilateral change by them at any point, of course), and you just have to hope that they won't get hacked.

*(If you want to avoid getting tracked this way, [Decentraleyes](https://decentraleyes.org/) is a useful browser extension)*

## Security

Beyond just privacy, it's reasonable to be concerned that an attacker might be able to compromise end-users by hacking a CDN. Luckily, there is a way to protect against this — modern web browsers have a feature called [Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity), which allows you to specify a hash of the expected contents of a script tag (if you're using libraries via a CDN, you should be doing this! It's pretty simple, and has nothing but upside in terms of security).

Unfortunately, this doesn't work for `deeplinks.js`, since it uses [dynamic imports](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#dynamic_imports) to avoid loading code until it's needed — browsers do not yet provide any way to provide SRI hashes for dynamically imported content. There are [some hacks that could potentially work around this](https://github.com/WICG/import-maps/issues/174#issuecomment-987685643), but it doesn't seem worth the complexity given the other downsides to CDNs mentioned above.

## Speed

One of the significant benefits touted by CDNs is speed, but this doesn't make as much sense as it once did. First off, modern browsers [don't cache requests to CDNs across multiple domains](https://www.stefanjudis.com/notes/say-goodbye-to-resource-caching-across-sites-and-domains/), since that can be used to track users — this means that even if someone has already downloaded `deeplinks.js` from the CDN on one website, they'll have to download it again if it's included by another website. Note that this re-downloading doesn't actually protect against any of the privacy concerns mentioned above, it's just to stop random websites from being able to tell what other websites you've visited via cache timing attacks. Secondly, if you're using HTTP/2 or HTTP/3, it's likely going to be faster to download the javascript file from the same place the website is hosted due to [multiplexing](https://http2.github.io/faq/#why-is-http2-multiplexed) — particularly, DNS resolution and TLS setup often dominate the time taken to load the first connection to a new domain. Hosting the javascript files on the same server as the HTML allows you to avoid all of that, and thus will typically actually be faster for small files.

---

Given all of the above points, it doesn't make sense to recommend that people use a CDN for `deeplinks.js`, and probably for most other projects as well. This does mean that it'll be slightly more effort to install it on your site, but that's worth it for the privacy and security of your users, and for the reduction of the systemic risks of centralization.
