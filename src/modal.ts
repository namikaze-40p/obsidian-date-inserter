import { App, Editor, Modal, Notice } from 'obsidian';

import { Datepicker } from 'vanillajs-datepicker';
import { DatepickerOptions } from 'vanillajs-datepicker/Datepicker';

import { LOCALES } from './locales';
import { DEFAULT_SETTINGS, DateFormatSpec, Settings } from './settings.js';

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

		if (this._settings.dateFormatSpecs.filter(({ format }) => format).length > 1) {
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
		const format = settings.dateFormatSpecs[0].format || DEFAULT_SETTINGS.dateFormatSpecs[0].format;
		const options: DatepickerOptions = {
			language: settings.language,
			daysOfWeekHighlighted,
			weekStart: settings.weekStart,
			todayHighlight: settings.todayHighlight,
			format,
			defaultViewDate: this.getStartDate(settings.dateFormatSpecs, settings.defaultDate === 'today'),
		};
		return options;
	}

	private getStartDate(dateFormatSpecs: DateFormatSpec[], isDefaultToday: boolean): number | undefined {
		const editor = this._editor;
		if (!editor) {
			return;
		}
		const selection = editor.getSelection();
		if (selection) {
			return isDefaultToday ? undefined : dateFormatSpecs.map(({ format }) => this.parseSelection(format, selection)).find(date => !!date);
		} else {
			const lineNo = editor.getCursor().line;
			const line = editor.getLine(lineNo);
			for (const dateFormatSpec of dateFormatSpecs) {
				const range = this.calcSelectionRange(dateFormatSpec, line, editor.getCursor().ch);
				const parsed = this.parseSelection(dateFormatSpec.format, line.substring(...range));
				if (parsed) {
					editor.setSelection({ line: lineNo, ch: range[0] }, { line: lineNo, ch: range[1] });
					return isDefaultToday ? undefined : parsed;
				}
			}
		}
	}

	private parseSelection(format: string, selection: string): number | undefined {
		const locale = this._settings.language || DEFAULT_SETTINGS.language;
		const parsed = Datepicker.parseDate(selection, format, locale);
		return parsed && Datepicker.formatDate(parsed, format, locale) === selection ? parsed : undefined;
	}

	private calcSelectionRange(dateFormatSpec: DateFormatSpec, line: string, cursorPos: number): [number, number] {
		if (line.length < dateFormatSpec.minLength) {
			return [cursorPos, cursorPos];
		}
		const [minPos, maxPos] = this.calcSearchRange(dateFormatSpec, cursorPos);
		const searchText = line.slice(minPos, maxPos);

		for (const match of searchText.matchAll(new RegExp(dateFormatSpec.regex, 'g'))) {
			const matchStartPos = minPos + (match.index || 0);
			const matchEndPos = minPos + (match.index || 0) + match[0].length;
			if (matchStartPos <= cursorPos && cursorPos <= matchEndPos) {
				return [matchStartPos, matchEndPos];
			}
		}

		return [cursorPos, cursorPos];
	}

	private calcSearchRange(dateFormatSpec: DateFormatSpec, cursorPos: number): [number, number] {
		const maxLength = dateFormatSpec.maxLength;
		const min = Math.max(0, cursorPos - maxLength);
		const max = maxLength + cursorPos;
		return [min, max];
	}
	
	private setupFormatButtons(datepicker: Datepicker): void {
		this.contentEl.createDiv('format-buttons', el => {
			const [format, format2] = this._settings.dateFormatSpecs.map(({ format }) => format);
			
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
