import { Calendar, CalendarOptions } from '@fullcalendar/core';
import { MarkdownRenderChild, TFile } from 'obsidian';
import { CALENDAR_OPTIONS, CALENDAR_OPTIONS_AFTER, EmbeddedCalendarOptions } from './calendar';
import SetInObsidianPlugin from './main';
import { gatherEventsFromFiles, gatherGlobalEvents, parseListItem } from './parser';

// TODO: better errors in case of invalid options etc
// TODO: make code more readable
export class EmbeddedCalendar extends MarkdownRenderChild {
	readonly plugin: SetInObsidianPlugin;
	readonly calendar: Calendar;

	constructor(containerEl: HTMLElement, eoptions: EmbeddedCalendarOptions, filePath: string, plugin: SetInObsidianPlugin) {
		super(containerEl);
		this.plugin = plugin;

		if (eoptions.useThisFile)
			eoptions.files.push(filePath);

		let options: CalendarOptions = {
			...CALENDAR_OPTIONS,
			...this.plugin.settings.calendarOverrideOptions
		}

		if (eoptions.defaultView != null)
			options.initialView = eoptions.defaultView;
		else
			options.initialView = this.plugin.settings.defaultView;

		options.events = [];

		if (eoptions.events.length > 0) {
			const events = eoptions.events.map(str => parseListItem(str)).filter(e => e != null);
			console.log(events);

			for (const event of events) {
				options.events.push(event as Record<any, any>);
			}
		}

		options.eventSources = [];

		if (eoptions.showGlobalEvents) {
			options.eventSources.push(gatherGlobalEvents);

			for (const source of this.plugin.externalSources) {
				options.eventSources.push(source);
			}
		}

		if (eoptions.files.length > 0) {
			const files = eoptions.files.map(path => app.vault.getAbstractFileByPath(path))
				.filter(afile => afile instanceof TFile)
				.map(afile => afile as TFile);

			options.eventSources.push(async (..._args: any) => gatherEventsFromFiles(files, false));
		}

		// hide header
		if (!eoptions.showHeader)
			options.headerToolbar = false;

		// the calendar is contained inside the wrapper so it overflows and you can scroll
		const wrapper = this.containerEl.createDiv({ cls: ['set-in-obsidian-wrapper', 'set-in-obsidian-wrapper-embedded'] });

		let currentRange = wrapper.createEl('h4', { text: 'UNDEFINED' });

		if (eoptions.headerTitle != null)
			currentRange.setText(eoptions.headerTitle);
		else if (!eoptions.showCurrentRange)
			currentRange.style.display = 'none';

		const timeline = wrapper.createDiv({ cls: 'set-in-obsidian-timeline' });

		// update the range header
		if (eoptions.headerTitle == null)
			options.datesSet = (info) => currentRange.setText(info.view.title);

		// NOTE: in this case user can override everything except plugins and license key
		this.calendar = new Calendar(timeline, {
			...options,
			...eoptions.fullcalendar,
			...CALENDAR_OPTIONS_AFTER
		});
	}

	onload() {
		this.calendar.render();

		// TODO FIXME: cant get fullcalendar to render properly without this
		window.dispatchEvent(new Event('resize'));
	}
}
