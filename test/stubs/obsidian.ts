// Obsidian adds these helpers to every element at runtime.
Object.assign(HTMLElement.prototype, {
  addClass(this: HTMLElement, name: string) {
    this.classList.add(name);
  },
  removeClass(this: HTMLElement, name: string) {
    this.classList.remove(name);
  },
  setAttrs(this: HTMLElement, attrs: Record<string, string | boolean>) {
    Object.entries(attrs).forEach(([key, value]) => this.setAttribute(key, String(value)));
  },
  empty(this: HTMLElement) {
    this.replaceChildren();
  },
  createEl(this: HTMLElement, tag: string) {
    return this.appendChild(document.createElement(tag));
  },
  createSpan(this: HTMLElement) {
    return this.appendChild(document.createElement('span'));
  },
  createDiv(this: HTMLElement, name: string, callback?: (el: HTMLElement) => void) {
    const el = this.appendChild(document.createElement('div'));
    el.classList.add(name);
    callback?.(el);
    return el;
  },
});

export class Modal {
  modalEl = document.body.appendChild(document.createElement('div'));
  contentEl = this.modalEl.appendChild(document.createElement('div'));

  constructor(public app: unknown) {}

  open(): void {
    this.onOpen();
  }

  close(): void {
    this.onClose();
    this.modalEl.remove();
  }

  onOpen(): void {}

  onClose(): void {}
}

export class Notice {
  static messages: string[] = [];

  constructor(message: string) {
    Notice.messages.push(message);
  }
}

export class Plugin {}

export class PluginSettingTab {}

export class Setting {}

export const debounce = <T>(fn: T): T => fn;
