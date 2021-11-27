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

document.addEventListener('DOMContentLoaded', () => {
  const hash = location.hash.slice(1);

  if (hash && document.getElementById(hash) === null) {
    if (hash[0] === '1') {
      selectRanges(v1.hashToRangeList(hash));
    }
  }

  // This is in a setTimeout to ensure that the code above does all of its
  // selection-changing before this executes. This ensures that we don't
  // clobber changes that we just made (for instance, in the case of a user
  // on Chrome attempting to open a multiselect url).
  //
  // This also allows us to make more careful decisions about rewriting urls
  // in general — we can explicitly decide when and how to do version bumps,
  // for instance.
  setTimeout(() => {
    document.addEventListener('selectionchange', () => {
      const hash = v1.selectionToHash(document.getSelection() as Selection);
      history.replaceState(null, '', hash ?? location.pathname);
    });
  }, 0);
});
