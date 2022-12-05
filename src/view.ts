import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';
import { View, WorkspaceLeaf } from "obsidian";
// import 'vis-timeline/dist/vis-timeline-graph2d.min.css';
import '@fullcalendar/common/main.min.css';
import '@fullcalendar/daygrid/main.min.css';
import '@fullcalendar/list/main.min.css';
import '@fullcalendar/timegrid/main.min.css';
import { TIMELINE_VIEW_TYPE } from "./main";

export class TimelineView extends View {
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

		this.containerEl.createEl("div", {}, elem => {
			let calendar = new Calendar(elem, {
				plugins: [dayGridPlugin, timeGridPlugin, listPlugin],
				initialView: 'dayGridMonth',
				headerToolbar: {
					left: 'prev,next today',
					center: 'title',
					right: 'dayGridMonth,timeGridWeek,listWeek'
				}
			});

			// 	var items = new DataSet([
			// 		{ id: 1, content: 'item 1', start: '22:00', end: '22:30' },
			// 		{ id: 2, content: 'item 2', start: '22:35', end: '23:00' },
			// 	]);

			// 	var options = {};

			// 	var timeline = new Timeline(elem, items, options);
		});
	}

	getViewType(): string {
		return TIMELINE_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Timeline";
	}
}
