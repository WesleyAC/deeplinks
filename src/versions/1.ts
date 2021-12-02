import { cyrb53 } from '../util/cyrb53';
import { fromNumber } from '../util/base64';

// See docs/spec/v1.md for what this code implements.
// It must also be compatible with docs/spec/v0.md.

// See https://dom.spec.whatwg.org/#interface-node
// The minifier isn't smart enough to know this, so do it ourselves and save
// the, uh 26 bytes...
const TEXT_NODE = 3;
// Same as above, see https://dom.spec.whatwg.org/#interface-nodefilter
const NODEFILTER_SHOW_TEXT = 0x04;

function hashNode(n: Text): string {
  return fromNumber(cyrb53(n.wholeText));
}

export function selectionToFragment(selection: Selection): string {
  type HashNodeOffset = [string, Text, number];
  type DupeData = [boolean[], number, number];
  const ranges: [HashNodeOffset, HashNodeOffset, DupeData][] = [];
  for (let i = 0; i < selection.rangeCount; i++) {
    const range = selection.getRangeAt(i);
    if (!range.collapsed) {
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

  const walk = document.createTreeWalker(document.body, NODEFILTER_SHOW_TEXT, null);
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

  return `#1${fragmentParts.join()}`;
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
