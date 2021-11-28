import { Base64 } from '../util/base64';
import { cyrb53 } from '../util/cyrb53';

// Version 1 Fragment Format (UNSTABLE)
//
// fragment  → "1", [ "." ], selection, { ",",  selection } ;
// selection → sel-long | sel-short;
// sel-long  → hash, ":", offset, ".", hash, ":", offset |
//             hash, ":", offset, "~", offset, ".", hash, ":", offset |
//             hash, ":", offset, ".", hash, ":", offset, "~", offset ;
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
// the text.
//
// The reason for the "~" and second offset in the long selection format is to
// deal with the case where multiple text nodes in the document have the same
// text contents, and thus the same hash. In that case, the offset after the
// tilde describes the number of nodes with a given hash that should be skipped
// (either before or after, depending on whether the offset is attached to the
// starting node or the ending one)
//
// This purposefully does not deal with the case where both the starting and
// ending node are ambiguous, nor the case where only one node is selected.
// Those may be dealt with in the future, but they're significantly more
// complicated.
//
// The short selection format is used when both hashes refer to the same node.
//
// The hash formula is cyrb53, which is just a thing some rando on stack
// overflow made, base64-encoded (using a non-standard alphabet). In practice,
// a hash can be at most nine characters, since cyrb53 is a 53-bit hash (due to
// silly javascript fun).
//
// The hash that comes first in the url must also be first in the document.
//
// This has a few problems — the non-handled ambiguous node cases mentioned
// above, and the fact tha changing a single character in a long paragraph
// breaks all links to that paragraph — but it's pretty good for a lot of
// cases.

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
  let startHash, startOffset, startDupeOffset = 0, endHash, endOffset, endDupeOffset = 0;
  if (split.length == 1) {
    [[startHash, startOffset, endOffset]] = split;
    [startOffset, endOffset] = [startOffset, endOffset].map(parseFloat);
    endHash = startHash;
  } else {
    [[startHash, startOffset], [endHash, endOffset]] = split;
    const parseOffsets = (x: string) => x.split('~').map(parseFloat);
    [startOffset, startDupeOffset] = parseOffsets(startOffset);
    [endOffset, endDupeOffset] = parseOffsets(endOffset);
  }

  // the boolean represents whether it's a start node (true) or end node (false)
  const nodes: [Text, boolean][] = [];

  let numEndNodes = 0;

  // eslint-disable-next-line prefer-const
  let node, walk = document.createTreeWalker(document.body, NODEFILTER_SHOW_TEXT, null);
  while (node = walk.nextNode() as Text) { // eslint-disable-line no-cond-assign
    const hash = hashNode(node);
    if (hash == startHash) {
      nodes.push([node, true]);
    }
    // will it make things simpler down the line to not append end nodes if
    // they come before the first start node?
    if (hash == endHash) {
      nodes.push([node, false]);
      numEndNodes++;
    }
  }

  let startNode, endNode;

  const offset = (endDupeOffset+1) || -(startDupeOffset+1);
  if (!isNaN(offset)) { // at least one DupeOffset is given
    const uniqueNodeIndex = nodes.findIndex(e => e[1] == (offset > 0));
    startNode = nodes[uniqueNodeIndex + ((offset < 0) ? offset : 0)];
    endNode = nodes[uniqueNodeIndex + ((offset > 0) ? offset : 0)];
  }

  if (!startNode || !endNode) {
    // If there's more than one end node, start with the start node.  This
    // ensures that in cases where both nodes are ambiguous, the first pair is
    // selected.
    const anchorNodeType = numEndNodes > 1;
    const anchorNodeIndex = nodes.findIndex(e => e[1] == anchorNodeType);
    startNode = nodes[anchorNodeType ? anchorNodeIndex : anchorNodeIndex - 1];
    endNode = nodes[anchorNodeType ? anchorNodeIndex + 1: anchorNodeIndex];
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
