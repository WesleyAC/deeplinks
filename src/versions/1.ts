import { cyrb53 } from '../util/cyrb53';
import { fromNumber } from '../util/base64';

// Version 1 Fragment Format (UNSTABLE)
//
// fragment  → "1", [ "." ], selection, { ",",  selection } ;
// selection → sel-long | sel-short;
// sel-long  → hash, ":", offset, ".", hash, ":", offset, [ dedupe ] ;
// sel-short → hash, ":", offset, ":", offset, [ "~", dedupe ] ;
// dedupe    → "~", { "s" | "e" }-, "~", offset, "~", offset ;
// offset    → { "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" }- ;
// hash      → { "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" |
//               "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" |
//               "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" | "S" | "T" |
//               "U" | "V" | "W" | "X" | "Y" | "Z" | "a" | "b" | "c" | "d" |
//               "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m" | "n" |
//               "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" |
//               "y" | "z" | "-" | "_" }- ;
//
// A fragment describes a list of selections. A selection is stored as a hash
// of the text contents of a selected node, as well as a character offset into
// the text.
//
// The short selection format is used when both hashes refer to the same node.
//
// The hash formula is cyrb53, which is just a thing some rando on stack
// overflow made, base64-encoded (using a non-standard alphabet). In practice,
// a hash can be at most nine characters, since cyrb53 is a 53-bit hash (due to
// silly javascript fun).
//
// The deduplication section of the fragment is used in the case where there
// are multiple elements on the page with the same contents as the start or end
// node. It describes the full list of duplicate elements, and which ones are
// the correct start and end nodes. A "s" or "e" indicates a node with the same
// hash as the start or end node (respectively). The fist offset is the offset
// of the start node, and the second offset is the end node. In the case where
// the start and end nodes are the same, "s" must be used to describe the node
// (it's possible that in the future, a more condensed version of this will be
// used that simply uses three integers).
//
// The hash that comes first in the url must also be first in the document.
//
// The main problem this has is that changing a single character in a long
// paragraph breaks all links to that paragraph, but it works pretty well for a
// lot of cases.

// See https://dom.spec.whatwg.org/#interface-node
// The minifier isn't smart enough to know this, so do it ourselves and save
// the, uh 26 bytes...
const TEXT_NODE = 3;
// Same as above, see https://dom.spec.whatwg.org/#interface-nodefilter
const NODEFILTER_SHOW_TEXT = 0x04;

function hashNode(n: Text): string {
  return fromNumber(cyrb53(n.wholeText));
}

function findTextNode(node: Node, first: boolean): Text | null {
  if (node.nodeType == TEXT_NODE) {
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
  if (node.nodeType == TEXT_NODE) {
    return [hashNode(node as Text), offset];
  } else {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const textNode = findTextNode(node, first)!;
    return [hashNode(textNode), first ? 0 : textNode.length];
  }
}

function rangeToFragmentPart(range: Range): string | null {
  const [startHash, startOffset] = normalizeSelectionPart(range.startContainer, range.startOffset, true);
  const [endHash, endOffset] = normalizeSelectionPart(range.endContainer, range.endOffset, false);
  if (startHash === endHash) {
    return `${startHash}:${startOffset}:${endOffset}`;
  } else {
    return `${startHash}:${startOffset}.${endHash}:${endOffset}`;
  }
}

export function selectionToFragment(selection: Selection): string | null {
  const fragmentParts = [];
  for (let i = 0; i < selection.rangeCount; i++) {
    const range = selection.getRangeAt(i);
    if (!range.collapsed) {
      fragmentParts.push(rangeToFragmentPart(range));
    }
  }

  return fragmentParts.length === 0 ? null : `#1${fragmentParts.join()}`;
}

function getRangeFromFragmentPart(fragmentPart: string): Range {
  const [hashOffsetFragmentPart, dupeString, dupeStartOffset, dupeEndOffset] = fragmentPart.split('~');
  const split = hashOffsetFragmentPart.split('.').map((x) => x.split(':'));
  let startHash, startOffset, endHash, endOffset;
  if (split.length == 1) {
    [[startHash, startOffset, endOffset]] = split;
    endHash = startHash;
  } else {
    [[startHash, startOffset], [endHash, endOffset]] = split;
  }
  [startOffset, endOffset] = [startOffset, endOffset].map(parseFloat);

  // the boolean represents whether it's a start node (true) or end node (false)
  const nodes: [Text, boolean][] = [];

  const walk = document.createTreeWalker(document.body, NODEFILTER_SHOW_TEXT, null);
  let node, numEndNodes = 0;
  while (node = walk.nextNode() as Text) { // eslint-disable-line no-cond-assign
    const hash = hashNode(node);
    if (hash == startHash) {
      nodes.push([node, true]);
    } else if (hash == endHash) {
      nodes.push([node, false]);
      numEndNodes++;
    }
  }

  let startNode, endNode;

  if (dupeString && nodes.map(n => n[1] ? 's' : 'e').join('') == dupeString) {
    startNode = nodes[parseInt(dupeStartOffset)];
    endNode = nodes[parseInt(dupeEndOffset)];
  }

  if (!startNode || !endNode) {
    if (startHash == endHash) {
      startNode = nodes[0];
      endNode = startNode;
    } else {
      // If there's more than one end node, start with the start node.  This
      // ensures that in cases where both nodes are ambiguous, the first pair is
      // selected.
      const anchorNodeType = numEndNodes > 1;
      const anchorNodeIndex = nodes.findIndex(e => e[1] == anchorNodeType);
      startNode = nodes[anchorNodeType ? anchorNodeIndex : anchorNodeIndex - 1];
      endNode = nodes[anchorNodeType ? anchorNodeIndex + 1: anchorNodeIndex];
    }
  }

  const range = new Range();
  if (startNode && endNode) {
    range.setStart(startNode[0], startOffset);
    range.setEnd(endNode[0], endOffset);
  }
  return range;
}

export function fragmentToRangeList(fragment: string): Range[] {
  return fragment.replace(/^1\.?/gm, '').split(',').map(getRangeFromFragmentPart);
}
