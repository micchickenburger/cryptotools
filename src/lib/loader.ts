/**
 * @file Contains functionality for the animated loader
 * @author Micah Henning <hello@micah.soy>
 * @copyright (C) 2024 Micah Henning
 * license GPL-3.0-or-later
 *
 * The loader is a 1 rem thick bar at the top of the page which
 * means to convey a sense of progress for long operations.
 */

const loader = document.querySelector<HTMLElement>('#loader');

/**
 * Fill the progress bar at the top of the page
 * @param pct Percentage to fill (0 to 100)
 */
const load = (pct: number) => {
  if (loader && pct >= 0 && pct <= 100) loader.style.width = `${pct}%`;
  if (pct === 0) loader?.classList.remove('animate');
  else loader?.classList.add('animate');
};

export default load;
