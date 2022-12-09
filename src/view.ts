import Calendar from '@event-calendar/core';
import DayGrid from '@event-calendar/day-grid';
import ListGrid from '@event-calendar/list';
import TimeGrid from '@event-calendar/time-grid';
import { EditorPosition, EventRef, ListItemCache, MarkdownView, TFile, View, WorkspaceLeaf } from "obsidian";
import { EventPeriod } from './event';
import SetInObsidianPlugin, { TIMELINE_VIEW_ICON, TIMELINE_VIEW_TYPE } from "./main";

/** Generator that chains two arrays together into one generator
 *
 *  `array2` must be equal or larger in length than `array1`
 */
function* chain<K, V>(array1: K[], array2: V[]): Generator<[K, V]> {
	for (let i = 0; i < array1.length; i++) {
		yield [array1[i], array2[i]];
	}
}

async function readFiles(files: TFile[]): Promise<Map<TFile, String>> {
	return Promise.all(files.map(file => app.vault.cachedRead(file))).then(fileContents =>
		new Map<TFile, String>(chain(files, fileContents))
	);
}

async function extractListItems(files: TFile[]): Promise<Map<TFile, [ListItemCache, String][]>> {
	const fileContents = await readFiles(files);

	var items = new Map<TFile, [ListItemCache, String][]>();

	// extract each item as string
	fileContents.forEach((contents, file) => {
		const cache = app.metadataCache.getFileCache(file);

		if (cache.listItems == null)
			return;

		items.set(file, cache.listItems.map(item => {
			// all list items start with '- '
			var offset = 2;

			// remove the '[ ] ' from the task, you can use cache task property to check type
			if (item.task != null)
				offset += 4;

			return [
				item,
				contents.substring(item.position.start.offset + offset, item.position.end.offset).trim()
			];
		}));
	});

	return items;
}

export class TimelineView extends View {
	plugin: SetInObsidianPlugin;
	calendar?: any = null;
	resolvedEventRef?: EventRef = null;
	lastVisibility = false;

	constructor(leaf: WorkspaceLeaf, plugin: SetInObsidianPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.navigation = true;
		this.icon = TIMELINE_VIEW_ICON;
	}

	async getListItems(): Promise<Map<TFile, [ListItemCache, String][]>> {
		return extractListItems(this.app.vault.getMarkdownFiles());
	}

	async gatherEvents(): Promise<CalendarEvent[]> {
		const listItems = await this.getListItems();

		var events: CalendarEvent[] = [];

		for (const [file, items] of listItems) {
			for (const [metadata, rawText] of items) {
				const parseResults = EventPeriod.parse(rawText);

				if (parseResults == null)
					continue;

				const [period, itemText] = parseResults;

				if (period == null)
					continue;

				// TODO: make a new event class
				var event: CalendarEvent = {
					title: itemText,
					start: period.start,
					end: period.end,
					extendedProps: {
						file: file,
						line: metadata.position.start.line,
						col: metadata.position.start.col
					}
				};

				if (metadata.task != undefined) {
					// TODO: for now all completed tasks are green
					if (metadata.task != ' ')
						event.backgroundColor = 'green';
				} else
					// non task events are light blue
					event.backgroundColor = 'darkgray';

				events.push(event);
			}
		}

		return events;
	}

	clearEvents(): void {
		this.calendar.setOption("events", []);
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
							view: 'listWeek',
							allDaySlot: false,
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
							views: {
								timeGridDay: {
									slotDuration: '00:30'
								}
							},
							// sets class names for html elements
							theme: (theme: any) => {
								// remove today highlighting, easier than doing css
								theme.today = '';
								return theme;
							},
							eventTimeFormat: {
								hour: 'numeric',
								minute: '2-digit',
								hour12: false,
							},
							slotLabelFormat: {
								hour: 'numeric',
								minute: '2-digit',
								hour12: false,
							},
							// use event calendar format for ranges but display them in header above
							datesSet: (_info: any) => currentRange.setText(this.calendar.getView().title),
							eventClick: async (info: {
								event: {
									// NOTE: these are added in `gatherEvents` function!
									extendedProps: {
										file: TFile,
										line: number,
										col: number,
									}
								},
								jsEvent: { ctrlKey: Boolean }
							}) => {
								const file = info.event.extendedProps.file;
								const line = info.event.extendedProps.line;
								const col = info.event.extendedProps.col;

								// require ctrl to open the file
								if (info.jsEvent.ctrlKey) {
									var leaf = this.app.workspace.getLeaf('tab');
									await leaf.openFile(file);

									var view = leaf.view as MarkdownView;
									view.editor.setCursor({ line: line, ch: col } as EditorPosition);
									view.editor.scrollIntoView({
										from: { line: - 1, ch: col },
										to: { line: line + 1, ch: col },
									}, true);
								}
							}
						}
					}
				});
			});
		});
	}

	async onClose(): Promise<void> {
		app.metadataCache.offref(this.resolvedEventRef);
	}

	async update(): Promise<void> {
		// TODO: add debug option to monitor number of updates just in case
		this.calendar.setOption("events", await this.gatherEvents());
	}

	isVisible(): boolean {
		// i have no idea how this works but it does
		// source: https://stackoverflow.com/a/21696585
		return this.containerEl.offsetParent !== null;
	}

	onResize(): void {
		// NOTE: update when files change only if the view is visible!
		if (this.isVisible()) {
			// update it when the view is again visible
			if (this.lastVisibility == false)
				this.update();

			// NOTE: does fire on renames contrary to 'changed'
			this.resolvedEventRef = app.metadataCache.on('resolved', async () => await this.update());
		} else {
			app.metadataCache.offref(this.resolvedEventRef);

			// clean events to reduce memory usage as they are gonna be outdated anyways
			this.clearEvents();
		}

		this.lastVisibility = this.isVisible();
	}

	getViewType(): string {
		return TIMELINE_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'SIO Timeline';
	}
}
