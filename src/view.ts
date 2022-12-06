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
		this.plugin.timelineView = this;

		this.containerEl.empty();
		this.containerEl.createEl("h3", {
			attr: {
				"style": "text-align: center;",
			},
			text: "Set In Obsidian"
		});

		// the calendar is contained inside the wrapper so it overflows and you can scroll
		this.containerEl.createDiv({ cls: "set-in-obsidian-wrapper", }, wrapper =>
			wrapper.createDiv({ cls: "set-in-obsidian-timeline", }, elem => {
				this.calendar = new Calendar({
					target: elem,
					props: {
						plugins: [TimeGrid, DayGrid, ListGrid],
						options: {
							view: 'listWeek',
							allDaySlot: false,
							nowIndicator: true,
							headerToolbar: {
								start: 'prev,next today',
								center: 'title',
								end: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
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
							// sets class names for html elements
							theme: (theme: any) => {
								// remove today highlighting, easier than doing css
								theme.today = '';
								return theme;
							},
							eventClick: (info: any) => {
								console.log("clicked", info.event, info.event.extendedProps);
							}
						}
					}
				});
			})
		);
	}

	async onClose(): Promise<void> {
		this.plugin.timelineView = null;
	}

	getViewType(): string {
		return TIMELINE_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "SIO Timeline";
	}
}
