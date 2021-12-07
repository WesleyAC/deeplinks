import { cyrb53 } from '../util/cyrb53';
import { fromNumber } from '../util/base64';

// See docs/spec/v2.md for what this code implements.

// See https://dom.spec.whatwg.org/#interface-node
// The minifier isn't smart enough to know this, so do it ourselves and save
// the, uh 26 bytes...
const TEXT_NODE = 3;
// Same as above, see https://dom.spec.whatwg.org/#interface-nodefilter
const NODEFILTER_SHOW_TEXT = 0x04;

function hashNode(n: Text): string {
  return fromNumber(cyrb53(n.wholeText));
}

// Take a range, and return a new range containing the same text, but ensuring
// that the start and end are both non-whitespace-only text nodes.
function normalizeRange(range: Range) {
  // We start off by picking start and end nodes. If the start node is a text
  // node, we can just use it as is. If it's a element node, though, we need to
  // use the offset to figure out which child node is the one that's actually
  // selected.
  //
  // There's a additional hiccup that the offsets used by Range represent the
  // spaces in between child nodes, while the TreeWalker API operates on the
  // nodes directly. Because of this, we need to keep track of whether the
  // selected text starts/ends before or after the start/end node. The
  // startOffset/endOffset variables do double duty in this regard — if the
  // startNode/endNode is a text node, the startOffset/endOffset is a text
  // offset, but if the startNode/endNode is a element node, they represent
  // whether the selection starts/ends before the node (0) or after the node
  // (1).

  const makeNodeAndOffset = (initNode: Node, initOffset: number): [Node, number] => {
    let node, offset;
    if (initNode.nodeType == TEXT_NODE || initNode.childNodes.length == 0) {
      node = initNode;
      offset = initOffset;
    } else {
      node = initNode.childNodes[Math.min(initOffset, initNode.childNodes.length - 1)];
      if (node.nodeType == TEXT_NODE) {
        offset = (initOffset == initNode.childNodes.length) ? (node as Text).wholeText.length : 0;
      } else {
        offset = (initOffset == initNode.childNodes.length) ? 1 : 0;
      }
    }
    return [node, offset];
  };

  const [startNode, startOffset] = makeNodeAndOffset(range.startContainer, range.startOffset);
  const [endNode, endOffset] = makeNodeAndOffset(range.endContainer, range.endOffset);

  const newRange = new Range();
  const treeWalker = document.createTreeWalker(range.commonAncestorContainer);
  // stages:
  // 0 = Looking for startNode.
  // 1 = startNode found, but it wasn't a non-empty text node — looking for a
  //     non-empty text node.
  // 2 = Looking for endNode.
  let stage = 0;
  let node: Node | null = treeWalker.currentNode;
  let prevEndNode = endNode;
  while (node) {
    if (stage == 0 && node == startNode) {
      if (node.nodeType != TEXT_NODE && startOffset != 0) {
        node = treeWalker.nextNode();
        if (!node) {
          return null;
        }
      }
      stage = 1;
    }
    if (node.nodeType == TEXT_NODE && (node as Text).wholeText.trim() != '') {
      if (stage == 1) {
        newRange.setStart(node, (node == startNode) ? startOffset : 0);
        stage = 2;
      }
      if (stage == 2) {
        prevEndNode = newRange.endContainer;
        newRange.setEnd(node, (node as Text).wholeText.length);
      }
    }
    if (stage == 2 && node == endNode) {
      if (node.nodeType == TEXT_NODE && (node as Text).wholeText.trim() != '') {
        newRange.setEnd(node, endOffset);
        return newRange;
      }
      if (node == newRange.endContainer && endOffset == 0) {
        newRange.setEnd(prevEndNode, (prevEndNode as Text).wholeText.length);
      }
      return newRange;
    }
    node = treeWalker.nextNode();
  }

  return null;
}

export function selectionToFragment(selection: Selection): string {
  type HashNodeOffset = [string, Text, number];
  type DupeData = [boolean[], number, number];
  const ranges: [HashNodeOffset, HashNodeOffset, DupeData][] = [];
  for (let i = 0; i < selection.rangeCount; i++) {
    const range = normalizeRange(selection.getRangeAt(i));
    if (range && !range.collapsed) {
      const [startNode, endNode] = [range.startContainer, range.endContainer];
      if (startNode.nodeType == TEXT_NODE && endNode.nodeType == TEXT_NODE) {
        ranges.push([
          [hashNode(startNode as Text), startNode as Text, range.startOffset],
          [hashNode(endNode as Text), endNode as Text, range.endOffset],
          [[], 0, 0],
        ]);
      }
    }
  }

  if (ranges.length == 0) {
    return '';
  }

  const walk = document.createTreeWalker(document.body, NODEFILTER_SHOW_TEXT);
  let node;
  while (node = walk.nextNode() as Text) { // eslint-disable-line no-cond-assign
    const hash = hashNode(node);
    for (const [[startHash, startNode], [endHash, endNode], dupes] of ranges) {
      if (startNode == node) {
        dupes[1] = dupes[0].length;
      }
      if (endNode == node) {
        dupes[2] = dupes[0].length;
      }
      if (startHash == hash) {
        dupes[0].push(true);
      } else if (endHash == hash) {
        dupes[0].push(false);
      }
    }
  }

  const fragmentParts = ranges.map(([[startHash, , startOffset], [endHash, , endOffset], [dupes, startDupeOffset, endDupeOffset]]) => {
    let fragmentPart;
    if (startHash == endHash) {
      fragmentPart= `${startHash}:${startOffset}:${endOffset}`;
    } else {
      fragmentPart= `${startHash}:${startOffset}.${endHash}:${endOffset}`;
    }
    if (new Set(dupes).size != dupes.length) {
      const dupesString = dupes.map(x => x ? 's' : 'e').join('');
      fragmentPart += `~${dupesString}~${startDupeOffset}~${endDupeOffset}`;
    }
    return fragmentPart;
  });

  return `#2${fragmentParts.join()}`;
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
  return fragment.substring(1).split(',').map(getRangeFromFragmentPart);
}
