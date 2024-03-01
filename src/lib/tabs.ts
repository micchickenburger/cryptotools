/**
 * @file Handles tab logic
 * @author Micah Henning <hello@micah.soy>
 * @copyright (C) 2024 Micah Henning
 * license GPL-3.0-or-later
 */

import { hideResults } from './result';

const tabsElements = document.querySelectorAll('.tabs');

tabsElements.forEach((tabsElement) => {
  const tabs = Array.from(tabsElement.children) as HTMLElement[];
  const parent = tabsElement.parentElement!;
  const sections = parent.querySelectorAll(':scope [data-tab]');

  tabs.forEach((tab) => {
    if (tab.classList.contains('datum')) return; // don't interact with stats

    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      sections?.forEach((s) => s.classList.remove('active'));

      tab.classList.add('active');
      parent.querySelector(`[data-tab="${tab.dataset.target}"]`)?.classList.add('active');

      hideResults();
    });
  });
});
