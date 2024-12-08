import { App, Editor, Modal } from 'obsidian';

import { Datepicker } from 'vanillajs-datepicker';
import { DatepickerOptions } from 'vanillajs-datepicker/Datepicker';

import { LOCALES } from './locales';
import { DEFAULT_SETTINGS, Settings } from './settings.js';

Object.assign(Datepicker.locales, LOCALES);

export class CalendarModal extends Modal {
	settings: Settings;
	editor: Editor;
	isSelected = false;
	isClosed = false;

	constructor(app: App, settings: Settings, editor: Editor) {
		super(app);
		this.settings = settings;
		this.editor = editor;
	}

	onOpen() {
		this.modalEl.addClass('date-inserter-modal');
		
		const inputEl = this.contentEl.createEl('input');
		inputEl.addClass('invisible-input');
		inputEl.setAttrs({ type: 'text', readonly: true });

		const options = this.generateOptions(this.settings);
		const datepicker = new Datepicker(inputEl, options);
		datepicker.show();

		inputEl.addEventListener('hide', (ev: Event & { detail: { viewDate: Date }}) => {
			setTimeout(() => {
				if (!this.isClosed) {
					datepicker.show();
					datepicker.setFocusedDate(ev.detail.viewDate);
				}
			}, 0);
		});
		inputEl.addEventListener('changeDate', () => {
			if (!this.isSelected) {
				this.isSelected = true;
				this.insertDateToCursorPosition(inputEl.value);
				setTimeout(() => this.close(), 0);
			}
		});

		if (this.settings.format2) {
			this.setupFormatButtons(datepicker);
		}
	}

	onClose() {
		this.isClosed = true;
		this.contentEl.empty();
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

	private setupFormatButtons(datepicker: Datepicker): void {
		this.contentEl.createDiv('format-buttons', el => {
			const { format, format2 } = this.settings;
			
			const formatBtn1 = el.createEl('button');
			formatBtn1.createSpan('').textContent = format || DEFAULT_SETTINGS.format;
			formatBtn1.addEventListener('click', () => {
				datepicker.config.format = format;
				formatBtn1.addClass('selected');
				formatBtn2.removeClass('selected');
			});
			formatBtn1.addClass('selected');

			const formatBtn2 = el.createEl('button');
			formatBtn2.createSpan('').textContent = format2;
			formatBtn2.addEventListener('click', () => {
				datepicker.config.format = format2
				formatBtn2.addClass('selected');
				formatBtn1.removeClass('selected');
			});
	
			this.modalEl.addEventListener('keyup', (ev) => {
				switch (ev.key) {
					case '1':
						formatBtn1.click();
						break;
					case '2':
						formatBtn2.click();
						break;
					default:
						// nop
				}
			});
		});
	}
}
