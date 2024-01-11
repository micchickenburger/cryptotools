/**
 * @file Contains features for confirmation modals
 * @author Micah Henning
 * @copyright (C) 2023 Micah Henning
 * @license GPL-3.0-or-later
 */

const removeModal = (background: HTMLElement) => (event: Event) => {
  event.preventDefault();
  background.remove();
};

/**
 * Create Modal
 * @param iconSvg A string containing SVG markup for the modal icon
 * @param title The modal title, e.g.: "Are you sure?"
 * @param prompt A larger description of the impact
 * @param confirmationText The confirmation button text
 * @param callback The function to execute upon confirmation
 */
const showModal = (
  iconSvg: string,
  title: string,
  prompt: string,
  confirmationText: string,
  callback: Function,
) => {
  const background = document.createElement('div');
  background.classList.add('modal-background');

  const modal = document.createElement('aside');
  modal.classList.add('modal');
  background.appendChild(modal);

  const container = document.createElement('div');
  container.classList.add('container');
  modal.appendChild(container);

  const icon = document.createElement('span');
  icon.innerHTML = iconSvg;
  container.appendChild(icon);

  const content = document.createElement('div');
  content.classList.add('content');
  container.appendChild(content);

  const titleElement = document.createElement('span');
  titleElement.textContent = title;
  content.appendChild(titleElement);

  const p = document.createElement('p');
  p.textContent = prompt;
  content.appendChild(p);

  const actions = document.createElement('div');
  actions.classList.add('actions');
  modal.appendChild(actions);

  const cancel = document.createElement('button');
  cancel.classList.add('cancel');
  cancel.textContent = 'Cancel';
  cancel.addEventListener('click', removeModal(background));
  actions.appendChild(cancel);

  const confirm = document.createElement('button');
  confirm.classList.add('confirm');
  confirm.textContent = confirmationText;
  confirm.addEventListener('click', removeModal(background));
  confirm.addEventListener('click', () => callback());
  actions.appendChild(confirm);

  document.body.appendChild(background);
};

export default showModal;
