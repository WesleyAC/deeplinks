import process from 'process';
import roundtrip from './roundtrip.mjs';
import server from './server.mjs';

let browsers = new Set();
let runs = -1;

let args = process.argv.slice(2);

args.forEach((arg, index) => {
  if (arg === '--firefox') {
    browsers.add('firefox');
  } else if (arg === '--chromium') {
    browsers.add('chromium');
  } else if (index === args.length - 1 && !isNaN(parseInt(arg, 10))) {
    runs = parseInt(arg, 10);
  } else {
    console.log(`Inargid arg '${arg}'`);
    process.exit(1);
  }
});

if (browsers.size === 0) {
  browsers.add('chromium');
}

const port = 25381;
server(port);

for (let browser of browsers) {
  console.log(`Running roundtrip in ${browser}`);
  if (!await roundtrip(port, browser, runs)) {
    process.exit(2);
  }
}

process.exit(0);
