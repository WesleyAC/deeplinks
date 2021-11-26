import { Base64 } from '../util/base64';
import { cyrb53 } from '../util/cyrb53';

// hash format version 1:
// 1.[hash]:[offset].[hash]:[offset]
//
// the hashes are the hash of the text content of the selected node. the hash
// formula is cyrb53, which is just a thing some rando on stack overflow made,
// base64-encoded. the offsets are character offsets into the text in the node.
// nodes must be text nodes. the hash that comes first in the url must also be
// first in the document.
//
// the dot after the version number is optional. in the case where both hashes
// are the same, the following format may be used instead:
//
// 1.[hash]:[offset]:[offset]
//
// this has a couple problems. the main one is that if there are multiple text
// nodes with the same value, there's no differentiation between them. it's
// also not very robust to the text changing — a single character difference in
// a paragraph of text can cause all links to that paragraph to break, even if
// the section being linked to didn't change! finally, it only supports a
// single selection, despite firefox implementing multiselect.

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

export function loadHash(hash: string) {
  const split = hash.replace(/^1\.?/gm, '').split('.').map((x) => x.split(':'));
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
  if (startNode && endNode) {
    document.getSelection()?.setBaseAndExtent(startNode, parseInt(startOffset), endNode, parseInt(endOffset));
    startNode.parentElement?.scrollIntoView();
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
