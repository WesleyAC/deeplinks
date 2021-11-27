import * as v1 from './versions/1';

function selectRanges(ranges: Range[]) {
  const selection = document.getSelection() as Selection;
  selection.removeAllRanges();
  for (const range of ranges) {
    selection.addRange(range);
  }
  ranges[0].startContainer.parentElement?.scrollIntoView();
  if (selection.rangeCount !== ranges.length) {
    alert('You opened a link that highlighted multiple selections of text, but your browser does not support this — only the first selection is being shown.');
  }
}

if (typeof(Range) !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('selectionchange', v1.handleSelectionChange);

    const hash = window.location.hash.slice(1);
    if (hash && document.getElementById(hash) === null) {
      if (hash[0] === '1') {
        selectRanges(v1.hashToRangeList(hash));
      }
    }
  });
}
