/* SIRI.DEV */
let activeLocks = 0;
let originalOverflow = '';

// A preview may open above an existing form or application-detail dialog.
export function lockDialogScroll(): () => void {
  if (activeLocks === 0) originalOverflow = document.body.style.overflow;
  activeLocks += 1;
  document.body.style.overflow = 'hidden';
  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeLocks -= 1;
    if (activeLocks === 0) document.body.style.overflow = originalOverflow;
  };
}
