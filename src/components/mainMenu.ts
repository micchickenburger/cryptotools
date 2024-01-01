/**
 * @file Contains functionality for the main menu
 * @author Micah Henning
 * @copyright (C) 2023 Micah Henning
 * @license GPL-3.0-or-later
 */

import { hideResults } from '../lib/result';

const menuItems = document.querySelectorAll<HTMLElement>('#main-menu li');
const sections = document.querySelectorAll<HTMLElement>('main section');

menuItems.forEach((item) => item.addEventListener('click', () => {
  menuItems.forEach((i) => i.classList.remove('active'));
  sections.forEach((i) => i.classList.remove('active'));
  item.classList.add('active');
  if (item.dataset.target) document.querySelector(item.dataset.target)?.classList.add('active');
  hideResults();
}));
