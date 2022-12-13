import { Calendar } from '@fullcalendar/core';
import { EditorPosition, EventRef, ListItemCache, MarkdownView, Notice, Platform, TFile, View, WorkspaceLeaf } from 'obsidian';
import { CALENDAR_OPTIONS } from './calendar_options';
import SetInObsidianPlugin, { TIMELINE_VIEW_ICON, TIMELINE_VIEW_TYPE } from './main';
import { extractListItems, parseListItem } from './parser';

const FILE_SIZE_LIMIT = 5_000_000; // 5mb

export class TimelineView extends View {
	private resolvedEventRef: EventRef | null;

	plugin: SetInObsidianPlugin;

	/**
	 * @public
	 * the instance of fullcalendar
	 */
	calendar: Calendar | null;

	constructor(leaf: WorkspaceLeaf, plugin: SetInObsidianPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.navigation = true;
		this.icon = TIMELINE_VIEW_ICON;
	}

	filterMarkdownFiles(files: TFile[]): TFile[] {
		return files.filter(file => {
			const cache = app.metadataCache.getFileCache(file);

			// restrict file size
			if (file.stat.size > FILE_SIZE_LIMIT)
				return false;

			// if it does not have any list items it's useless
			if (cache?.listItems?.length || 0 <= 0)
				return false;

			const frontmatter = cache?.frontmatter;
			if (frontmatter != null) {
				// explicitly ignored files, could be useful for huge files
				if (frontmatter['set-in-obsidian-ignore'] == true)
					return false;

				// excalidraw files can be pretty huge so ignore them as well
				if (frontmatter['excalidraw-plugin'] !== undefined)
					return false;
			}

			return true;
		});
	}

	async getListItems(): Promise<Map<TFile, [ListItemCache, string][]>> {
		return extractListItems(this.filterMarkdownFiles(this.app.vault.getMarkdownFiles()));
	}

	async gatherEvents(): Promise<Record<any, any>[]> {
		const listItems = await this.getListItems();

		var events: Record<any, any>[] = [];

		for (const [file, items] of listItems) {
			for (const [metadata, rawText] of items) {
				const results = parseListItem(rawText);

				if (results == null)
					continue;

				// TODO: color done tasks, color recurring tasks too

				events.push({
					title: results.leftover,
					start: results.start,
					end: results.end,
					rrule: results.rrule,

					// NOTE: these are used to open the file where the event was found
					extendedProps: {
						file: file,
						line: metadata.position.start.line,
						col: metadata.position.start.col
					}
				});
			}
		}

		return events;
	}

	async onOpen(): Promise<void> {
		this.containerEl.empty();

		// the calendar is contained inside the wrapper so it overflows and you can scroll
		this.containerEl.createDiv({ cls: 'set-in-obsidian-wrapper', }, wrapper => {
			var currentRange = wrapper.createEl('h4', { text: 'UNDEFINED' });

			wrapper.createDiv({ cls: 'set-in-obsidian-timeline', }, elem => {
				var options = CALENDAR_OPTIONS;

				// gather events from this class as a source
				options.eventSources?.push(
					async (_info, _successCallback, _failureCallback) => this.gatherEvents()
				);

				// update the range header
				options.datesSet = (info) => currentRange.setText(info.view.title);

				// go to the file when clicked
				options.eventClick = async (arg) => {
					const file = arg.event.extendedProps.file;
					const line = arg.event.extendedProps.line;
					const col = arg.event.extendedProps.col;

					// require ctrl to open the file only on desktop
					if (arg.jsEvent.ctrlKey || Platform.isMobile) {
						var leaf = app.workspace.getLeaf('tab');
						await leaf.openFile(file);

						var view = leaf.view as MarkdownView;
						view.editor.setCursor({ line: line, ch: col } as EditorPosition);
						view.editor.scrollIntoView({
							from: { line: - 1, ch: col },
							to: { line: line + 1, ch: col },
						}, true);
					} else
						// TODO: try showing title on hover instead of this notice
						new Notice(arg.event.title);
				};

				this.calendar = new Calendar(elem, options);
				this.calendar.render();
			});
		});
	}

	async onClose(): Promise<void> {
		if (this.resolvedEventRef != null)
			app.metadataCache.offref(this.resolvedEventRef);
	}

	async update(): Promise<void> {
		// TODO: add debug option to monitor number of updates just in case
		this.calendar?.refetchEvents();
	}

	private isVisible(): boolean {
		// i have no idea how this works but it does
		// source: https://stackoverflow.com/a/21696585
		return this.containerEl.offsetParent !== null;
	}

	onResize(): void {
		// NOTE: update when files change only if the view is visible!
		if (this.isVisible() && this.resolvedEventRef == null) {
			// update it when the view is again visible
			this.update();

			// NOTE: does fire on renames contrary to 'changed'
			this.resolvedEventRef = app.metadataCache.on('resolved', async () => await this.update());
		} else if (this.resolvedEventRef != null) {
			app.metadataCache.offref(this.resolvedEventRef);
			this.resolvedEventRef = null;
		}
	}

	getViewType(): string {
		return TIMELINE_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'SIO Timeline';
	}
}
