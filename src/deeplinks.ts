import * as v1 from './versions/1';

if (typeof(Range) !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('selectionchange', v1.handleSelectionChange);

    const hash = window.location.hash.slice(1);
    if (hash && document.getElementById(hash) === null) {
      if (hash[0] === '1') {
        v1.loadHash(hash);
      }
    }
  });
}
