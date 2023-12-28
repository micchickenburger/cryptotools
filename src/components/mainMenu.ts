/**
 * @file Contains functionality for the main menu
 * @author Micah Henning
 * @copyright (C) 2023 Micah Henning
 * @license GPL-3.0-or-later
 */

import { hideResult } from '../lib/result';

const menuItems = document.querySelectorAll('#main-menu li') as unknown as HTMLElement[];
const sections = document.querySelectorAll('main section') as unknown as HTMLElement[];

menuItems.forEach((item) => item.addEventListener('click', (event) => {
  menuItems.forEach(i => i.classList.remove('active'));
  sections.forEach(i => i.classList.remove('active'));
  item.classList.add('active');
  if (item.dataset.target) document.querySelector(item.dataset.target)?.classList.add('active');
  hideResult();
}));
