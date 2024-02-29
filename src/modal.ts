import { App, Editor, Modal } from 'obsidian';

import { Datepicker } from 'vanillajs-datepicker';
import { DatepickerOptions } from 'vanillajs-datepicker/Datepicker';

import locales from './locales';
import { Settings } from './settings.js';

Object.assign(Datepicker.locales, locales);

export class CalendarModal extends Modal {
	settings: Settings;
	editor: Editor;

	constructor(app: App, settings: Settings, editor: Editor) {
		super(app);
		this.settings = settings;
		this.editor = editor;
	}

	onOpen() {
		this.modalEl.addClass('date-inserter-modal');
		const { contentEl } = this;
		
		const inputEl = contentEl.createEl('input');
		inputEl.addClass('invisible-input');
		inputEl.setAttrs({ type: 'text' });

		const options = this.generateOptions(this.settings);
		const datepicker = new Datepicker(inputEl, options);
		datepicker.show();

		inputEl.addEventListener('hide', () => this.close());
		inputEl.addEventListener('changeDate', () => {
			this.insertDateToCursorPosition(inputEl.value);
			setTimeout(() => this.close(), 0);
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	private insertDateToCursorPosition(date: string): void {
		const { line, ch } = this.editor.getCursor('from');
		this.editor.replaceRange(date, { line, ch });
		this.editor.setCursor(line, ch + date.length);
	}

	private generateOptions(settings: Settings): DatepickerOptions {
		const { sun, mon, tue, wed, thu, fri, sat } = settings.daysOfWeekHighlighted;
		const daysOfWeekHighlighted = [sun, mon, tue, wed, thu, fri, sat].filter(val => val !== undefined) as number[];
		const options: DatepickerOptions = {
			language: settings.language,
			daysOfWeekHighlighted,
			weekStart: settings.weekStart,
			todayHighlight: settings.todayHighlight,
		};
		if (settings.format) {
			options.format = settings.format;
		}
		return options;
	}
}
