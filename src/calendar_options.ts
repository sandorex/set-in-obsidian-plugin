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

export const CALENDAR_OPTIONS: CalendarOptions = {
	schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
	initialView: 'listWeek',
	plugins: [
		dayGridPlugin,
		listPlugin,
		timeGridPlugin,
		resourceTimelinePlugin,
		rrulePlugin
	],
	views: {
		timeGridDay: {
			slotDuration: createDuration(30, 'minute'),
		}
	},
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
	eventSources: [],
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
