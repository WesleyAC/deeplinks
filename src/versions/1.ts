import { Base64 } from '../util/base64';
import { cyrb53 } from '../util/cyrb53';

// hash format version 1:
// 1.[hash]:[offset].[hash]:[offset]
//
// the hashes are the hash of the text content of the selected node. the hash
// formula is cyrb53, which is just a thing some rando on stack overflow made,
// base64-encoded (with a non-standard alphabet). the offsets are character
// offsets into the text in the node. nodes must be text nodes. the hash that
// comes first in the url must also be first in the document.
//
// the main problem this has is that if there are multiple text nodes with the
// same value, there's no differentiation between them. it's also not very
// robust to the text changing — a single character difference in a paragraph
// of text can cause all links to that paragraph to break, even if the section
// being linked to didn't change!
//
// the dot after the version number is optional. in the case where both hashes
// are the same, the following format may be used instead:
//
// 1.[hash]:[offset]:[offset]
//
// multi-select is also supported, with the following format:
//
// 1.[hash]:[offset].[hash]:[offset],[hash]:[offset]:[offset]
//
// (you may mix and match either of the previous two formats described)

function hashNode(n: Text): string {
  return Base64.fromNumber(cyrb53(n.wholeText));
}

function findTextNode(node: Node, first: boolean): Text | null {
  if (node.nodeType == Node.TEXT_NODE) {
    return node as Text;
  } else {
    const children = [...node.childNodes];
    if (!first) {
      children.reverse();
    }
    for (const child of children) {
      const result = findTextNode(child, first);
      if (result) {
        return result;
      }
    }
  }
  return null;
}

function normalizeSelectionPart(node: Node, offset: number, first: boolean): [string, number] {
  if (node.nodeType == Node.TEXT_NODE) {
    return [hashNode(node as Text), offset];
  } else {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const textNode = findTextNode(node, first)!;
    return [hashNode(textNode), first ? 0 : textNode.length];
  }
}

export function handleSelectionChange() {
  const range = window.getSelection()?.getRangeAt(0);

  if (!range || range.collapsed) {
    history.replaceState(null, '', window.location.pathname);
    return;
  }

  const [startHash, startOffset] = normalizeSelectionPart(range.startContainer, range.startOffset, true);
  const [endHash, endOffset] = normalizeSelectionPart(range.endContainer, range.endOffset, false);
  let hash;
  if (startHash === endHash) {
    hash = `#1${startHash}:${startOffset}:${endOffset}`;
  } else {
    hash = `#1${startHash}:${startOffset}.${endHash}:${endOffset}`;
  }
  history.replaceState(null, '', hash);
}

function getRangeFromHashPart(hashpart: string): Range {
  const split = hashpart.split('.').map((x) => x.split(':'));
  let startHash, startOffset, endHash, endOffset;
  if (split.length == 1) {
    [[startHash, startOffset, endOffset]] = split;
    [[endHash]] = split;
  } else {
    [[startHash, startOffset], [endHash, endOffset]] = split;
  }
  let startNode, endNode;
  // eslint-disable-next-line prefer-const
  let node, walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
  while (node = walk.nextNode() as Text) { // eslint-disable-line no-cond-assign
    const hash = hashNode(node);
    if (hash == startHash) { startNode = node; }
    if (hash == endHash) { endNode = node; }
  }
  const range = new Range();
  if (startNode && endNode) {
    range.setStart(startNode, parseInt(startOffset));
    range.setEnd(endNode, parseInt(endOffset));
  }
  return range;
}

export function loadHash(hash: string) {
  const hashSansVersion = hash.replace(/^1\.?/gm, '');
  const hashParts = hashSansVersion.split(',');
  const ranges = hashParts.map(getRangeFromHashPart);
  const selection = document.getSelection() as Selection;
  selection.removeAllRanges();
  for (const range of ranges) {
    selection.addRange(range);
  }
  ranges[0].startContainer.parentElement?.scrollIntoView();
  if (selection.rangeCount !== ranges.length) {
    alert('You opened a link that highlighted multiple selections of text, but your browser does not support this — only the first selection is being shown.');
  }
}
