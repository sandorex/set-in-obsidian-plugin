import Calendar from '@event-calendar/core';
import DayGrid from '@event-calendar/day-grid';
import ListGrid from '@event-calendar/list';
import TimeGrid from '@event-calendar/time-grid';
import { View, WorkspaceLeaf } from "obsidian";
import SetInObsidianPlugin, { TIMELINE_VIEW_ICON, TIMELINE_VIEW_TYPE } from "./main";

export class TimelineView extends View {
	plugin: SetInObsidianPlugin;
	calendar?: any = null;

	constructor(leaf: WorkspaceLeaf, plugin: SetInObsidianPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.navigation = true;
		this.icon = TIMELINE_VIEW_ICON;
	}

	async onOpen(): Promise<void> {
		this.containerEl.empty();

		// the calendar is contained inside the wrapper so it overflows and you can scroll
		this.containerEl.createDiv({ cls: 'set-in-obsidian-wrapper', }, wrapper => {
			var currentRange = wrapper.createEl('h4', { text: 'UNDEFINED' });

			wrapper.createDiv({ cls: 'set-in-obsidian-timeline', }, elem => {
				this.calendar = new Calendar({
					target: elem,
					props: {
						plugins: [TimeGrid, DayGrid, ListGrid],
						options: {
							view: 'timeGridDay',
							// allDaySlot: false,
							nowIndicator: true,
							headerToolbar: {
								start: 'today',
								center: 'dayGridMonth timeGridWeek,listWeek timeGridDay',
								end: 'prev,next'
							},
							buttonText: {
								today: 'Today',
								dayGridMonth: 'Month',
								listDay: 'List',
								listWeek: 'List',
								listMonth: 'List',
								listYear: 'List',
								resourceTimeGridDay: 'Day',
								resourceTimeGridWeek: 'Week',
								timeGridDay: 'Day',
								timeGridWeek: 'Week'
							},
							// overrides per view
							views: {},
							// sets class names for html elements
							theme: (theme: any) => {
								// remove today highlighting, easier than doing css
								theme.today = '';
								return theme;
							},
							// use event calendar format for ranges but display them in header above
							datesSet: (_info: any) => currentRange.setText(this.calendar.getView().title),
							eventClick: (info: any) => {
								// TODO: go to the place in file when clicked
								// console.log('clicked', info.event, info.event.extendedProps);
							}
						}
					}
				});
			});
		});
	}

	async update(): Promise<void> {
		this.calendar.setOption("events", await this.plugin.getAllEvents());
	}

	getViewType(): string {
		return TIMELINE_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'SIO Timeline';
	}
}
