import Calendar from '@event-calendar/core';
import "@event-calendar/core/index.css";
import TimeGrid from '@event-calendar/time-grid';
import { View, WorkspaceLeaf } from "obsidian";
import { TIMELINE_VIEW_TYPE } from "./main";

export class TimelineView extends View {
	calendar?: any = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
		this.navigation = false;
		this.icon = "calendar-clock";
	}

	async onOpen(): Promise<void> {
		this.containerEl.empty();
		this.containerEl.createEl("h3", {
			attr: {
				"style": "text-align: center;",
			},
			text: "Set In Obsidian Timeline"
		});

		this.containerEl.createDiv({ cls: "set-in-obsidian-wrapper", }, wrapper =>
			wrapper.createDiv({ cls: "set-in-obsidian-timeline", }, elem => {
				this.calendar = new Calendar({
					target: elem,
					props: {
						plugins: [TimeGrid],
						options: {
							view: 'timeGridWeek',
							allDaySlot: false,
							eventClick: (info: any) => {
								console.log("clicked", info.event, info.event.extendedProps);
							}
						}
					}
				});

				this.calendar.addEvent({
					start: window.moment().toDate(),
					end: window.moment().add(30, "minutes").toDate(),
					title: "fuck yeah",
					extendedProps: {
						name: "event numero uno",
					}
				})
			})
		);
	}

	getViewType(): string {
		return TIMELINE_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Timeline";
	}
}
