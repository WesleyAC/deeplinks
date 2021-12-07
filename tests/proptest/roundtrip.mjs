import { chromium, firefox } from 'playwright';
import process from 'process';

function randomlySelect() {
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

function getLocation() {
  return window.location.href;
}

function getSelection() {
  return document.getSelection().toString();
}

export default async (port, browserType, runs) => {
  const url = `http://localhost:${port}/tests/html/e2e.html`;
  const browser = browserType === 'chromium' ? await chromium.launch() : await firefox.launch();
  const page = await browser.newPage();
  let testsRun = 0;
  for (;;) {
    await page.goto(url);

    let replication = await page.evaluate(randomlySelect);
    let origSelection = await page.evaluate(getSelection);
    let location = await page.evaluate(getLocation);

    await page.goto('about:blank');
    await page.goto(location);

    let newSelection = await page.evaluate(getSelection);

    let origSelectionTest, newSelectionTest;
    if (browserType === 'firefox') {
      // Firefox includes whitespace for element node selections, but not for
      // text node selections. Since we convert all selections to text node
      // selections, we need to trim this.
      origSelectionTest = origSelection.split('\n').map(line => line.trim()).filter(line => line.length > 0).join('\n').trim();
      newSelectionTest = newSelection.split('\n').map(line => line.trim()).filter(line => line.length > 0).join('\n').trim();
    } else {
      origSelectionTest = origSelection.trim();
      newSelectionTest = newSelection.trim();
    }

    if (origSelectionTest !== newSelectionTest) {
      console.log(`\nFAILED!\n${location}\n--- EXPECTED: ---\n${origSelectionTest}\n--- RECEIVED: ---\n${newSelectionTest}\n--- REPLICATION: ---\n${replication}`);
      return false;
    }

    testsRun++;
    process.stdout.write(`tests run: ${testsRun}\r`);
    if (testsRun === runs) {
      console.log('');
      return true;
    }
  }
};

