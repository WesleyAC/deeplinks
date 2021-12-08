export function randomlySelect() {
  // https://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range/29246176#29246176
  // random number from zero (inclusive) to max (exclusive)
  function randInt(max) {
    return Math.floor(Math.random() * max);
  }

  const nodes = [];
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT ^ NodeFilter.SHOW_ELEMENT);
  let node;
  while (node = walk.nextNode()) { // eslint-disable-line no-cond-assign
    nodes.push(node);
  }

  let [startIndex, endIndex] = [randInt(nodes.length), randInt(nodes.length)].sort();
  let [startNode, endNode] = [nodes[startIndex], nodes[endIndex]];
  let startOffset, endOffset;
  if (startNode.nodeType == Node.TEXT_NODE) {
    startOffset = randInt(startNode.wholeText.length);
  } else {
    startOffset = randInt(startNode.childNodes.length + 1);
  }
  if (endNode.nodeType == Node.TEXT_NODE) {
    endOffset = randInt(endNode.wholeText.length);
  } else {
    endOffset = randInt(endNode.childNodes.length + 1);
  }

  document.getSelection().setBaseAndExtent(startNode, startOffset, endNode, endOffset);

  return `let nodes=[],walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT^NodeFilter.SHOW_ELEMENT),node;while(node=walk.nextNode()){nodes.push(node)};document.getSelection().setBaseAndExtent(nodes[${startIndex}],${startOffset},nodes[${endIndex}],${endOffset});`;
}

export function getLocation() {
  return window.location.href;
}

export function getLocationFragment() {
  return window.location.hash;
}

export function getSelection() {
  return document.getSelection().toString();
}
