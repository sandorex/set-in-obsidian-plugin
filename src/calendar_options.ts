import { CalendarOptions } from '@fullcalendar/core';
import { createDuration } from '@fullcalendar/core/internal';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import rrulePlugin from '@fullcalendar/rrule';
import timeGridPlugin from '@fullcalendar/timegrid';

export const CALENDAR_OPTIONS: CalendarOptions = {
	initialView: 'listWeek',
	plugins: [
		dayGridPlugin,
		listPlugin,
		timeGridPlugin,
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
