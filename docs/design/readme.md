# Design

The fragment identifier is made of a hash of the contents of the [text node](https://developer.mozilla.org/en-US/docs/Web/API/Text) in the DOM. For instance, imagine the following html:

```html
<span>Example text, with some <strong>bold</strong> and <em>italics</em>!</span>
```

If the user selected starting at the word `text` and ending at the word `italics` (but not including the exclamation mark), the fragment identifier would contain two hashes: one of the string `Example text with some `, and the other of `italics`. It would also contain two offsets: 8 for the index of the start of the selection (`text` starts at position 8 in the string `Example text, with some `), and 7 for the end of the selection in the sting `italics`. There is also a version number, which is used so that the exact format can change as needed, while still supporting old links.

This has some obvious drawbacks — if you have very large paragraphs, changing any text within them will break all links to that paragraph. I have some ideas for reasonable solutions to this, but haven't started implementing them yet.

Handling of nodes with the same text contents (and thus the same hash) is described [here](/docs/design/ambiguous_nodes.md).

The exact details of the hashing and format are unimportant, but are commented in the code for the curious.
