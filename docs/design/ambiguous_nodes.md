# Handling ambiguous nodes

In some cases, multiple nodes in a document will have the same contents. In these cases, we need to have some way to disambiguate them.

Let's take the following HTML as a example:

```html
<p>paragraph</p>
<p>paragraph two with a italicised <em>word</em> and a bolded <strong>word</strong></p>
<p>paragraph</p>
```

Say the URL tells us that the text "`word`" is both the first and last node, with a offset of 0 for the first node, and 4 for the second. This could indicate either that the italicised `word` is selected, or the bolded one, or the entire phrase `word and a bolded word`.

There are two main approaches that are possible here: a offset based approach, or a tree based approach.

Using the offset approach, the URL would contain two offsets — one that describes the starting node, and another that describes the ending node. So, for instance, to describe the italicised `word` being highlighted, both offsets would be zero.

An improvement to this scheme is to include a list of duplicate nodes, so that you can tell if the document has changed, and have a better chance at correctly handling it if it does.

The tree approach is to describe not just the hash of the node, but also the hash of the parent nodes. With this system, we could disambiguate between the two `word`s, since one of them is the child of a `<em>` node, while the other is the child of a `<strong>` node. The text contents of the parent nodes should also be used for this approach.

The tree based approach is more philosophically sound, since it handles the case where a paragraph is moved better than the offset approach, but it doesn't work in the general case — for instance, if the `<p>paragraph</p>` was selected, since they have the same parent, there isn't a way to disambiguate them without using offsets.

Both of these approaches can be combined, which is probably a more generally robust approach — it's likely that I'll implement something like that in the future.
