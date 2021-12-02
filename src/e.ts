// This is the error when a multiline link is not opened, because the browser
// doesn't support it. The name is a single letter, because Rollup's
// minifyInternalExports doesn't seem to work in this case yet. This module is
// 'e' rather than 'error' for the same reason :/
export const m = (ranges: Range[]) => { // eslint-disable-line @typescript-eslint/no-unused-vars
  alert('You opened a link that highlighted multiple selections of text, but your browser does not support this — only the first selection is being shown.');
};
