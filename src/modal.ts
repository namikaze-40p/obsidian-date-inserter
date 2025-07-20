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
		const options: DatepickerOptions = {
			language: settings.language,
			daysOfWeekHighlighted,
			weekStart: settings.weekStart,
			todayHighlight: settings.todayHighlight,
		};
		const format = settings.format || DEFAULT_SETTINGS.format;
		options.format = format;
		const startDate = this.getStartDate(format);
		if (startDate !== null) {
			options.defaultViewDate = startDate;
		}
		return options;
	}

	private getStartDate(format: string): number | null {
		const editor = this._editor;
		if (!editor) return null
		const selection = editor.getSelection();
		if (selection) {
			const parsed = Datepicker.parseDate(selection, format)
			if (Datepicker.formatDate(parsed, format) === selection) {
				return parsed
			}
		} else {
			// will try to find a date around the cursor
			const lineIdx = editor.getCursor().line
			const line = editor.getLine(lineIdx)
			const range = this.findWhitespacedTokenRange(line, editor.getCursor().ch)
			const selection = line.substring(range[0], range[1]);
			const parsed = Datepicker.parseDate(selection, format)
			if (Datepicker.formatDate(parsed, format) === selection) {
				editor.setSelection({ line: lineIdx, ch: range[0] }, { line: lineIdx, ch: range[1] });
				return parsed
			}
		}
		return null
	}


	// find in s around i positon, the part that is surrounded by whitespaces and return its range
	// (or start and end of s)
	private findWhitespacedTokenRange(s: string, i: number): [number,number] {
		let from = i;
		let to = i;
		while (from > 0 && !s[from - 1].match(/\s/)) {
			from--;
		}
		while (to < s.length && !s[to].match(/\s/)) {
			to++;
		}
		return [from, to];
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
