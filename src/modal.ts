import { App, Editor, Modal, Notice } from 'obsidian';

import { Datepicker } from 'vanillajs-datepicker';
import { DatepickerOptions } from 'vanillajs-datepicker/Datepicker';

import { LOCALES } from './locales';
import { DEFAULT_SETTINGS, Settings } from './settings.js';

Object.assign(Datepicker.locales, LOCALES);

export class CalendarModal extends Modal {
	private _isSelected = false;
	private _isClosed = false;

	constructor(app: App, private _settings: Settings, private _editor?: Editor) {
		super(app);
	}

	onOpen(): void {
		this.modalEl.addClass('date-inserter-modal');
		
		const inputEl = this.contentEl.createEl('input');
		inputEl.addClass('invisible-input');
		inputEl.setAttrs({ type: 'text', readonly: true });

		const options = this.generateOptions(this._settings);
		const datepicker = new Datepicker(inputEl, options);
		datepicker.show();

		inputEl.addEventListener('hide', (ev: Event & { detail: { viewDate: Date }}) => {
			setTimeout(() => {
				if (!this._isClosed) {
					datepicker.show();
					datepicker.setFocusedDate(ev.detail.viewDate);
				}
			}, 0);
		});
		inputEl.addEventListener('changeDate', () => {
			if (!this._isSelected) {
				this._isSelected = true;
				if (this._editor) {
					this.insertDateToCursorPosition(inputEl.value, this._editor);
				} else {
					if (navigator.clipboard) {
						navigator.clipboard.writeText(inputEl.value).then(() => new Notice('Date copied to clipboard.'));
					}
				}
				setTimeout(() => this.close(), 0);
			}
		});

		if (this._settings.format2) {
			this.setupFormatButtons(datepicker);
		}
	}

	onClose(): void {
		this._isClosed = true;
		this.contentEl.empty();
	}

	private insertDateToCursorPosition(date: string, editor: Editor): void {
		const from = editor.getCursor('from');
		const to = editor.getCursor('to');
		editor.replaceRange(date, from, to);
		editor.setCursor(from.line, from.ch + date.length);
	}

	private generateOptions(settings: Settings): DatepickerOptions {
		const { sun, mon, tue, wed, thu, fri, sat } = settings.daysOfWeekHighlighted;
		const daysOfWeekHighlighted = [sun, mon, tue, wed, thu, fri, sat].filter(val => val !== undefined) as number[];
		const format = settings.format || DEFAULT_SETTINGS.format;
		const options: DatepickerOptions = {
			language: settings.language,
			daysOfWeekHighlighted,
			weekStart: settings.weekStart,
			todayHighlight: settings.todayHighlight,
			format,
			defaultViewDate: this.getStartDate([settings.format, settings.format2]),
		};
		return options;
	}

	private getStartDate(formats: string[]): number | undefined {
		const editor = this._editor;
		if (!editor) {
			return;
		}
		const selection = editor.getSelection();
		if (selection) {
			return this.parseSelection(formats, selection);
		} else {
			const lineNo = editor.getCursor().line;
			const line = editor.getLine(lineNo);
			const range = this.calcSelectionRange(formats, line, editor.getCursor().ch);
			const parsed = this.parseSelection(formats, line.substring(...range));
			if (parsed) {
				editor.setSelection({ line: lineNo, ch: range[0] }, { line: lineNo, ch: range[1] });
			}
			return parsed;
		}
	}

	private parseSelection(formats: string[], selection: string): number | undefined {
		const locale = this._settings.language || DEFAULT_SETTINGS.language;
		const items = formats.map(format => ({ format, parsed: Datepicker.parseDate(selection, format, locale) }));
		return items.find(({ format, parsed }) => parsed && Datepicker.formatDate(parsed, format, locale) === selection)?.parsed;
	}

	private calcSelectionRange(formats: string[], str: string, cursorPos: number): [number, number] {
		if (formats.every(format => str.length < format.length)) {
			return [cursorPos, cursorPos];
		}
		const [minPos, maxPos] = this.calcSearchRange(formats, cursorPos);
		for (let start = minPos; start <= cursorPos; start++) {
			for (let end = cursorPos; end <= maxPos; end++) {
				const selection = str.substring(start, end);
				const parsed = this.parseSelection(formats, selection);
				if (parsed) {
					return [start, end];
				}
			}
			if (cursorPos <= start) {
				break;
			}
		}
		return [cursorPos, cursorPos];
	}

	private calcSearchRange(formats: string[], cursorPos: number): [number, number] {
		const { days, months } = LOCALES[this._settings.language] || DEFAULT_SETTINGS.language;
		const maxLength = Math.max(...formats.map(format => format.length)) + Math.max(...days.map(day => day.length)) + Math.max(...months.map(month => month.length));
		const min = Math.max(0, cursorPos - maxLength);
		const max = maxLength + cursorPos;
		return [min, max];
	}
	
	private setupFormatButtons(datepicker: Datepicker): void {
		this.contentEl.createDiv('format-buttons', el => {
			const { format, format2 } = this._settings;
			
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
