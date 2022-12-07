import { ListItemCache, Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import { EventPeriod } from './parser';
import { DEFAULT_SETTINGS, SetInObsidianSettings } from './settings';
import { TimelineView } from './view';

import type moment from 'moment';
declare global {
	interface Window {
		moment: typeof moment;
	}
}

export const TIMELINE_VIEW_TYPE = 'set-in-obsidian-timeline';
export const TIMELINE_VIEW_ICON = 'calendar-clock';

/** Generator that chains two arrays together into one generator
 *
 *  `array2` must be equal or larger in length than `array1`
 */
function* chain<K, V>(array1: K[], array2: V[]): Generator<[K, V]> {
	for (let i = 0; i < array1.length; i++) {
		yield [array1[i], array2[i]];
	}
}

export default class SetInObsidianPlugin extends Plugin {
	settings: SetInObsidianSettings;
	timelineView?: TimelineView;

	async readFiles(files: TFile[]): Promise<Map<TFile, String>> {
		return Promise.all(files.map(file => app.vault.cachedRead(file))).then(fileContents =>
			new Map<TFile, String>(chain(files, fileContents))
		);
	}

	async getListItems(files: TFile[]): Promise<Map<TFile, [ListItemCache, String][]>> {
		const fileContents = await this.readFiles(files);

		var items = new Map<TFile, [ListItemCache, String][]>();

		// extract each item as string
		fileContents.forEach((contents, file) => {
			const cache = this.app.metadataCache.getFileCache(file);

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

	async getAllEvents(): Promise<CalendarEvent[]> {
		const listItems = await this.getListItems(this.app.vault.getMarkdownFiles());

		var events: CalendarEvent[] = [];

		for (const [file, items] of listItems) {
			for (const [metadata, rawText] of items) {
				const parseResults = EventPeriod.parse(rawText);

				if (parseResults == null)
					continue;

				const [period, itemText] = parseResults;

				// TODO: make a new event class
				var event: CalendarEvent = {
					title: itemText,
					start: period.start,
					allDay: period.isAllDay(),
					extendedProps: {
						// TODO to be used for going to the list item
						file: file,
						line: metadata.position.start.line,
						offset: metadata.position.start.offset
					}
				};

				if (!period.isAllDay())
					event.end = period.end;

				// TODO: for now all completed tasks are green
				if (metadata.task != ' ')
					event.backgroundColor = 'green';

				events.push(event);
			}
		}

		return events;
	}

	async onload() {
		await this.loadSettings();

		this.registerView(TIMELINE_VIEW_TYPE, leaf => {
			this.timelineView = new TimelineView(leaf, this);
			return this.timelineView;
		});

		this.addRibbonIcon(TIMELINE_VIEW_ICON, 'SIO Timeline', () => this.revealView());

		this.registerEvent(this.app.workspace.on("active-leaf-change", async (leaf: WorkspaceLeaf | null) => {
			if (this.timelineView != null && leaf == this.timelineView.leaf)
				await this.timelineView.update();
		}));

		//this.addSettingTab(new SetInObsidianSettingsTab(this.app, this));
	}

	async revealView() {
		var leafs = this.app.workspace.getLeavesOfType(TIMELINE_VIEW_TYPE);
		if (leafs.length == 0) {
			// create it if it does not exist already
			await this.app.workspace.getRightLeaf(false).setViewState({
				type: TIMELINE_VIEW_TYPE,
				active: true,
			});
		}

		this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(TIMELINE_VIEW_TYPE)[0]);
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(TIMELINE_VIEW_TYPE);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
