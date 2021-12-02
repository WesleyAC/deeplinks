import * as v1 from './versions/1';

function selectRanges(ranges: Range[]) {
  const selection = document.getSelection() as Selection;
  selection.removeAllRanges();
  for (const range of ranges) {
    selection.addRange(range);
  }
  ranges[0].startContainer.parentElement?.scrollIntoView();
  if (selection.rangeCount != ranges.length) {
    void import('./e').then(error => error.m(ranges));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const fragment = location.hash.slice(1);

  if (fragment && !document.getElementById(fragment)) {
    if (fragment[0] == '1') {
      selectRanges(v1.fragmentToRangeList(fragment));
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
      const fragment = v1.selectionToFragment(document.getSelection() as Selection);
      // replaceState is used instead of setting location.hash to avoid scrolling.
      history.replaceState(null, '', location.pathname + fragment);
    });
  }, 0);
});
