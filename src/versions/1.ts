import { Base64 } from '../util/base64';
import { cyrb53 } from '../util/cyrb53';

// Version 1 Fragment Format
//
// fragment  → "1", [ "." ], selection, { ",",  selection } ;
// selection → sel-long | sel-short;
// sel-long  → hash, ":", offset, ".", hash, ":", offset ;
// sel-short → hash, ":", offset, ":", offset ;
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
// the text. The hash formula is cyrb53, which is just a thing some rando on
// stack overflow made, base64-encoded (using a non-standard alphabet). The
// hash that comes first in the url must also be first in the document. The
// short selection format is used when both hashes refer to the same node. In
// practice, a hash can be at most nine characters, since cyrb53 is a 53-bit
// hash (due to silly javascript fun).
//
// The main problem this has is that if there are multiple text nodes with the
// same value, there's no differentiation between them. It's also not very
// robust to the text changing — a single character difference in a paragraph
// of text can cause all links to that paragraph to break, even if the section
// being linked to didn't change!

// See https://dom.spec.whatwg.org/#interface-node
// The minifier isn't smart enough to know this, so do it ourselves and save
// the, uh 26 bytes...
const TEXT_NODE = 3;
// Same as above, see https://dom.spec.whatwg.org/#interface-nodefilter
const NODEFILTER_SHOW_TEXT = 0x04;

function hashNode(n: Text): string {
  return Base64.fromNumber(cyrb53(n.wholeText));
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

export function selectionToFragment(selection: Selection): string | null {
  const fragmentParts = [];
  for (let i = 0; i < selection.rangeCount; i++) {
    const range = selection.getRangeAt(i);

    if (!range || range.collapsed) {
      continue;
    }

    const [startHash, startOffset] = normalizeSelectionPart(range.startContainer, range.startOffset, true);
    const [endHash, endOffset] = normalizeSelectionPart(range.endContainer, range.endOffset, false);
    if (startHash === endHash) {
      fragmentParts.push(`${startHash}:${startOffset}:${endOffset}`);
    } else {
      fragmentParts.push(`${startHash}:${startOffset}.${endHash}:${endOffset}`);
    }
  }

  return fragmentParts.length === 0 ? null : `#1${fragmentParts.join()}`;
}

function getRangeFromFragmentPart(fragmentPart: string): Range {
  const split = fragmentPart.split('.').map((x) => x.split(':'));
  let startHash, startOffset, endHash, endOffset;
  if (split.length == 1) {
    [[startHash, startOffset, endOffset]] = split;
    endHash = startHash;
  } else {
    [[startHash, startOffset], [endHash, endOffset]] = split;
  }
  let startNode, endNode;
  // eslint-disable-next-line prefer-const
  let node, walk = document.createTreeWalker(document.body, NODEFILTER_SHOW_TEXT, null);
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

export function fragmentToRangeList(fragment: string): Range[] {
  return fragment.replace(/^1\.?/gm, '').split(',').map(getRangeFromFragmentPart);
}
