import { chromium } from 'playwright';

const url = 'http://localhost:25381/tests/html/e2e.html';

function randomlySelect() {
  // https://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range/29246176#29246176
  // random number from zero (inclusive) to max (exclusive)
  function randInt(max) {
    return Math.floor(Math.random() * max);
  }

  const nodes = [];
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
  let node;
  while (node = walk.nextNode()) { // eslint-disable-line no-cond-assign
    nodes.push(node);
  }

  let [startIndex, endIndex] = [randInt(nodes.length), randInt(nodes.length)].sort();
  let [startNode, endNode] = [nodes[startIndex], nodes[endIndex]];

  document.getSelection().setBaseAndExtent(startNode, randInt(startNode.wholeText.length), endNode, randInt(endNode.wholeText.length));
}

function getLocation() {
  return window.location.href;
}

function getSelection() {
  return document.getSelection().toString();
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let testsRun = 0;
  for (;;) {
    await page.goto(url);

    await page.evaluate(randomlySelect);
    let origSelection = await page.evaluate(getSelection);
    let location = await page.evaluate(getLocation);

    await page.goto('about:blank');
    await page.goto(location);

    let newSelection = await page.evaluate(getSelection);

    if (origSelection !== newSelection) {
      console.log(`FAILED!\n${location}\n--- EXPECTED: ---\n${origSelection}\n--- RECEIVED: ---\n${newSelection}`);
      process.exit(); // eslint-disable-line no-undef
    }

    testsRun++;
    process.stdout.write(`tests run: ${testsRun}\r`); // eslint-disable-line no-undef
  }
})();

