import { App, Editor, Modal, Notice } from 'obsidian';

import { Datepicker } from 'vanillajs-datepicker';
import { DatepickerOptions } from 'vanillajs-datepicker/Datepicker';

import { formatDate, hasDateToken, parseDate } from './dateFormat.js';
import { LOCALES } from './locales.js';
import { DEFAULT_SETTINGS, DateFormatSpec, Settings } from './settings.js';

Object.assign(Datepicker.locales, LOCALES);

export class CalendarModal extends Modal {
  private _isSelected = false;
  private _isClosed = false;
  private _format = '';

  constructor(
    app: App,
    private _settings: Settings,
    private _editor?: Editor,
  ) {
    super(app);
  }

  onOpen(): void {
    this.modalEl.addClass('date-inserter-modal');
    if (this._settings.weekNumbers !== 0) {
      this.modalEl.addClass('has-week-numbers');
    }

    const inputEl = this.contentEl.createEl('input');
    inputEl.addClass('invisible-input');
    inputEl.setAttrs({ type: 'text', readonly: true });

    const options = this.generateOptions(this._settings);
    const datepicker = new Datepicker(inputEl, options);
    datepicker.show();

    inputEl.addEventListener('hide', (ev) => {
      const { viewDate } = (ev as CustomEvent<{ viewDate: Date }>).detail;
      window.setTimeout(() => {
        if (!this._isClosed) {
          datepicker.show();
          datepicker.setFocusedDate(viewDate);
        }
      }, 0);
    });
    inputEl.addEventListener('changeDate', (ev) => {
      if (!this._isSelected) {
        const { date: selectedDate } = (ev as CustomEvent<{ date: Date }>).detail;
        const date = formatDate(selectedDate.getTime(), this._format, this._settings.language);
        this._isSelected = true;
        if (this._editor) {
          this.insertDateToCursorPosition(date, this._editor);
        } else {
          if (navigator.clipboard) {
            navigator.clipboard
              .writeText(date)
              .then(() => new Notice('Date copied to clipboard.'))
              .catch(() => new Notice('Failed to copy date to clipboard.'));
          }
        }
        window.setTimeout(() => this.close(), 0);
      }
    });

    if (this._settings.dateFormatSpecs.filter(({ format }) => format).length > 1) {
      this.setupFormatButtons();
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
    const daysOfWeekHighlighted = [sun, mon, tue, wed, thu, fri, sat].filter(
      (val) => val !== undefined,
    ) as number[];
    const format = settings.dateFormatSpecs[0].format;
    this._format = hasDateToken(format) ? format : DEFAULT_SETTINGS.dateFormatSpecs[0].format;
    const options: DatepickerOptions = {
      language: settings.language,
      daysOfWeekHighlighted,
      weekStart: settings.weekStart,
      weekNumbers: settings.weekNumbers,
      todayHighlight: settings.todayHighlight,
      defaultViewDate: this.getStartDate(
        settings.dateFormatSpecs,
        settings.defaultDate === 'today',
      ),
    };
    return options;
  }

  private getStartDate(
    dateFormatSpecs: DateFormatSpec[],
    isDefaultToday: boolean,
  ): number | undefined {
    const editor = this._editor;
    if (!editor) {
      return;
    }
    const selection = editor.getSelection();
    const { line: lineNo, ch } = editor.getCursor();
    const text = selection || editor.getLine(lineNo);

    let widestRange: [number, number] | undefined;
    let widestParsed: number | undefined;

    for (const dateFormatSpec of dateFormatSpecs) {
      const range = this.calcParseRange(dateFormatSpec, text, ch, !!selection);
      const parsed = this.parseSelection(dateFormatSpec.format, text.substring(...range));

      if (parsed && (!widestRange || range[1] - range[0] > widestRange[1] - widestRange[0])) {
        widestRange = range;
        widestParsed = parsed;
      }
    }

    if (widestRange && !selection) {
      editor.setSelection({ line: lineNo, ch: widestRange[0] }, { line: lineNo, ch: widestRange[1] });
    }

    return isDefaultToday ? undefined : widestParsed;
  }

  private calcParseRange(
    dateFormatSpec: DateFormatSpec,
    text: string,
    cursorPos: number,
    isSelection = false,
  ): [number, number] {
    if (text.length < dateFormatSpec.minLength) {
      return [cursorPos, cursorPos];
    }
    const [minPos, maxPos] = isSelection
      ? [0, text.length]
      : this.calcSearchRange(dateFormatSpec, cursorPos);
    const searchText = text.slice(minPos, maxPos);

    for (const match of searchText.matchAll(new RegExp(dateFormatSpec.regex, 'g'))) {
      const matchStartPos = minPos + (match.index || 0);
      const matchEndPos = minPos + (match.index || 0) + match[0].length;
      if (isSelection || (matchStartPos <= cursorPos && cursorPos <= matchEndPos)) {
        return [matchStartPos, matchEndPos];
      }
    }

    return [cursorPos, cursorPos];
  }

  private parseSelection(format: string, selection: string): number | undefined {
    const locale = this._settings.language || DEFAULT_SETTINGS.language;
    try {
      const parsed = parseDate(selection, format, locale);
      return parsed && formatDate(parsed, format, locale) === selection ? parsed : undefined;
    } catch {
      // Both throw on a format without any date tokens (e.g. "abc").
      return undefined;
    }
  }

  private calcSearchRange(dateFormatSpec: DateFormatSpec, cursorPos: number): [number, number] {
    const maxLength = dateFormatSpec.maxLength;
    const min = Math.max(0, cursorPos - maxLength);
    const max = maxLength + cursorPos;
    return [min, max];
  }

  private setupFormatButtons(): void {
    this.contentEl.createDiv('format-buttons', (el) => {
      const buttons = this._settings.dateFormatSpecs.map(({ format }) => {
        const button = el.createEl('button');
        button.createSpan('').textContent = format;
        button.addEventListener('click', () => {
          this._format = format;
          buttons.forEach((other) => other.removeClass('selected'));
          button.addClass('selected');
        });
        return button;
      });
      buttons[0].addClass('selected');

      this.modalEl.addEventListener('keyup', (ev) => {
        buttons[Number(ev.key) - 1]?.click();
      });
    });
  }
}
