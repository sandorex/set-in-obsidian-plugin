// sandorex/set-in-obsidian-plugin
// Copyright (C) 2022 Aleksandar Radivojević
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { CalendarOptions } from '@fullcalendar/core';
import { createDuration } from '@fullcalendar/core/internal';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import rrulePlugin from '@fullcalendar/rrule';
import timeGridPlugin from '@fullcalendar/timegrid';

/**
 * Options for FullCalendar, always applied before user provided options as defaults
 */
export const CALENDAR_OPTIONS: CalendarOptions = {
	views: {
		timeGridDay: {
			slotDuration: createDuration(30, 'minute'),
		}
	},
	expandRows: true,
	allDaySlot: false,
	nowIndicator: true,
	headerToolbar: {
		left: 'today',
		center: 'dayGridMonth timeGridWeek,listWeek timeGridDay',
		right: 'prev,next'
	},
	buttonText: {
		day: 'Day',
		month: 'Month',
		today: 'Today',
		week: 'Week',
		list: 'List',
	},
	eventTimeFormat: {
		hour12: false,
		hour: '2-digit',
		minute: '2-digit'
	},
	slotLabelFormat: {
		hour12: false,
		hour: '2-digit',
		minute: '2-digit'
	}
};

/**
 * Options for FullCalendar, always applied last to ensure license and plugins are set
 */
export const CALENDAR_OPTIONS_AFTER: CalendarOptions = {
	schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
	plugins: [
		dayGridPlugin,
		listPlugin,
		timeGridPlugin,
		resourceTimelinePlugin,
		rrulePlugin
	],
}

/**
 * Signifies different default options for FullCalendar
 */
export enum EmbeddedCalendarMode {
	DEFAULT,
	CUSTOM,
	MINIMAL,
}

// TODO: property to show certain date range instead of showing current date
export interface EmbeddedCalendarOptions {
	/**
	 * If false no date range will be shown
	 */
	showCurrentRange: boolean;

	/**
	 * If false no buttons will be shown
	 */
	showHeader: boolean;

	/**
	 * Show text instead of date range
	 */
	headerTitle?: string;

	/**
	 * If false only `events` and events gathered from `files` will be shown
	 */
	showGlobalEvents: boolean;

	/**
	 * Default view to open, if you want to embed minimal monthly calendar for example
	 */
	defaultView?: string;

	/**
	 * Paths to files which should be read, ignores frontmatter ignore
	 */
	files: string[];

	/**
	 * Get events from the file where calendar is embedded
	 */
	useThisFile: boolean;

	/**
	 * Events as raw string, same as task items just without the dash '-'
	 */
	events: string[];

	/**
	 * Raw options of FullCalendar `Calendar`
	 */
	fullcalendar: CalendarOptions;
}

export const ECALENDAR_OPTIONS_DEFAULTS: EmbeddedCalendarOptions = {
	showCurrentRange: true,
	showHeader: true,
	showGlobalEvents: true,
	useThisFile: false,
	files: [],
	events: [],
	fullcalendar: {},
};

export const ECALENDAR_OPTIONS_CUSTOM: EmbeddedCalendarOptions = {
	...ECALENDAR_OPTIONS_DEFAULTS,
	showGlobalEvents: false,
};

export const ECALENDAR_OPTIONS_MINIMAL: EmbeddedCalendarOptions = {
	...ECALENDAR_OPTIONS_DEFAULTS,
	showCurrentRange: false,
	showHeader: false,
	showGlobalEvents: false,
};
