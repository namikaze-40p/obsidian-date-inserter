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
  createSpan(this: HTMLElement, options?: string | { text?: string }) {
    const el = this.appendChild(document.createElement('span'));
    el.textContent = (typeof options === 'object' && options.text) || '';
    return el;
  },
  createDiv(this: HTMLElement, name: string, callback?: (el: HTMLElement) => void) {
    const el = this.appendChild(document.createElement('div'));
    if (name) {
      el.classList.add(name);
    }
    callback?.(el);
    return el;
  },
  setText(this: HTMLElement, text: string) {
    this.textContent = text;
  },
  insertAfter(this: HTMLElement, node: Node, child: Node | null) {
    return this.insertBefore(node, child ? child.nextSibling : this.firstChild);
  },
});

Object.assign(globalThis, {
  createFragment(callback: (el: HTMLElement) => void) {
    const el = document.createElement('div');
    callback(el);
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

export class PluginSettingTab {
  containerEl = document.createElement('div');

  constructor(
    public app: unknown,
    public plugin: unknown,
  ) {}

  hide(): void {}
}

class Control {
  options: Record<string, string> = {};
  value: unknown;
  placeholder = '';
  inputEl = document.createElement('input');
  change: (value: never) => unknown = () => {};

  constructor(public type: string) {}

  addOptions(options: Record<string, string>): this {
    this.options = options;
    return this;
  }

  setValue(value: unknown): this {
    this.value = value;
    return this;
  }

  setPlaceholder(placeholder: string): this {
    this.placeholder = placeholder;
    return this;
  }

  onChange(change: (value: never) => unknown): this {
    this.change = change;
    return this;
  }
}

export class Setting {
  static instances: Setting[] = [];

  settingEl: HTMLElement;
  name = '';
  desc: string | HTMLElement = '';
  control?: Control;

  constructor(containerEl: HTMLElement) {
    this.settingEl = containerEl.appendChild(document.createElement('div'));
    Setting.instances.push(this);
  }

  setName(name: string): this {
    this.name = name;
    return this;
  }

  setDesc(desc: string | HTMLElement): this {
    this.desc = desc;
    return this;
  }

  private addControl(type: string, callback: (control: Control) => unknown): this {
    this.control = new Control(type);
    callback(this.control);
    return this;
  }

  addDropdown(callback: (control: Control) => unknown): this {
    return this.addControl('dropdown', callback);
  }

  addToggle(callback: (control: Control) => unknown): this {
    return this.addControl('toggle', callback);
  }

  addText(callback: (control: Control) => unknown): this {
    return this.addControl('text', callback);
  }
}

/** Only runs when flushed with `run`, so tests don't depend on the timeout. */
export const debounce = <T extends unknown[], V>(callback: (...args: T) => V) => {
  let pending: T | undefined;
  const debounced = (...args: T) => {
    pending = args;
    return debounced;
  };
  debounced.run = () => {
    if (pending) {
      const args = pending;
      pending = undefined;
      return callback(...args);
    }
  };
  return debounced;
};
