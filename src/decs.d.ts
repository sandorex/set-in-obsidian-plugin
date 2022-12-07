declare module "@event-calendar/time-grid";
declare module "@event-calendar/day-grid";
declare module "@event-calendar/list";
declare module "@event-calendar/core";

declare interface CalendarEvent {
	id?: String | Number,
	resourceId?: String | Number,
	resourceIds?: (String | Number)[],
	allDay?: Boolean,
	start: Date,
	end?: Date,
	title?: String,
	titleHTML?: String,
	editable?: Boolean,
	startEditable?: Boolean,
	display?: String,
	backgroundColor?: String,
	color?: String,
	extendedProps?: object,
}
