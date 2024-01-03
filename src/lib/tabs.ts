/**
 * @file Handles tab logic
 * @author Micah Henning
 * @copyright (C) 2023 Micah Henning
 * @license GPL-3.0-or-later
 */

import { hideResults } from './result';

const tabsElements = document.querySelectorAll('.tabs');

tabsElements.forEach((tabsElement) => {
  const tabs = Array.from(tabsElement.children) as HTMLElement[];
  const parent = tabsElement.parentElement!;
  const sections = parent.querySelectorAll(':scope > .settings');

  tabs.forEach((tab) => tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('active'));
    sections?.forEach((s) => s.classList.remove('active'));

    tab.classList.add('active');
    parent.querySelector(`.settings.${tab.dataset.target}`)?.classList.add('active');

    hideResults();
  }));
});
