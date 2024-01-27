import * as v2 from './versions/2';

type Version = '2' | '1';

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

function fragmentVersion(fragment: string): Version | null {
  if (fragment && !document.getElementById(fragment)) {
    switch (fragment[0]) {
    case '1':
    case '2':
      return fragment[0];
    }
  }

  return null;
}

void (async () => {
  const fragment = location.hash.slice(1);

  switch (fragmentVersion(fragment)) {
  case '2': {
    selectRanges(v2.fragmentToRangeList(fragment));
    break;
  }
  case '1': {
    const v1 = await import('./versions/1');
    selectRanges(v1.fragmentToRangeList(fragment));
    break;
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
    document.addEventListener('selectionchange', (e) => {
      const selection = document.getSelection() as Selection;

      // replaceState is used instead of setting location.hash to avoid scrolling.

      if (!selection.isCollapsed) {
        const fragment = v2.selectionToFragment(document.getSelection() as Selection);

        history.replaceState(null, '', location.pathname + fragment);
      }
      else {
        // we only want to clear the fragment from our url if this is a fragment we've generated
        const fragment = location.hash.slice(1);

        // don't bother checking for v1 fragments, async at this point would cause challenges
        if (fragmentVersion(fragment) == '2' && v2.fragmentToRangeList(fragment).length > 0) {
          history.replaceState(null, '', location.pathname);
        }
      }
    });
  }, 0);
})();

