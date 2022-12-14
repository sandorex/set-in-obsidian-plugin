import { Calendar } from '@fullcalendar/core';
import { EditorPosition, EventRef, MarkdownView, Notice, Platform, TFile, View, WorkspaceLeaf } from 'obsidian';
import { CALENDAR_OPTIONS } from './calendar_options';
import SetInObsidianPlugin, { TIMELINE_VIEW_ICON, TIMELINE_VIEW_TYPE } from './main';
import { extractListItems, parseListItem } from './parser';

const FILE_SIZE_LIMIT = 5_000_000; // 5mb

export class TimelineView extends View {
	private resolvedEventRef: EventRef | null;

	plugin: SetInObsidianPlugin;

	/**
	 * @public
	 * The instance of fullcalendar
	 */
	calendar: Calendar | null;

	constructor(leaf: WorkspaceLeaf, plugin: SetInObsidianPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.navigation = true;
		this.icon = TIMELINE_VIEW_ICON;
	}

	/**
	 * Filters files by removing files without list items, files that are too large and some special cases
	 */
	filterMarkdownFiles(files: TFile[]): TFile[] {
		return files.filter(file => {
			// restrict file size
			if (file.stat.size > FILE_SIZE_LIMIT)
				return false;

			const cache = app.metadataCache.getFileCache(file);

			// if it does not have any list items it's useless
			if (cache?.listItems && cache.listItems.length <= 0)
				return false;

			// explicitly ignored files, could be useful for huge files
			if (cache?.frontmatter?.['set-in-obsidian-ignore'] == true)
				return false;

			// excalidraw files can be pretty huge so ignore them as well
			if (cache?.frontmatter?.['excalidraw-plugin'] !== undefined)
				return false;

			return true;
		});
	}

	async getListItemsFromFiles() {
		return extractListItems(this.filterMarkdownFiles(this.app.vault.getMarkdownFiles()));
	}

	/**
	 * @returns all events from filtered files
	 */
	async gatherEvents(): Promise<Record<any, any>[]> {
		const listItemFiles = await this.getListItemsFromFiles();

		var events: Record<any, any>[] = [];

		for (const file of listItemFiles) {
			for (const [metadata, rawText] of file.listItems) {
				const results = parseListItem(rawText);

				if (results == null)
					continue;

				// TODO: color done tasks, but only border or text so that rrule tasks can be different

				var event: Record<any, any> = {
					...results,

					// NOTE: these are used to open the file where the event was found
					extendedProps: {
						file: file,
						line: metadata.position.start.line,
						col: metadata.position.start.col
					}
				};

				if (event.rrule != null)
					event.color = '#eb8d1a'; // TODO: set the colors in options

				if (file.fileCache.frontmatter?.['set-in-obsidian-color'] != null)
					event.color = file.fileCache.frontmatter['set-in-obsidian-color'];

				events.push(event);
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

	/**
	 * @returns is the view visible to the user
	 */
	private isVisible(): boolean {
		// i have no idea how this works but it does
		// source: https://stackoverflow.com/a/21696585
		return this.containerEl.offsetParent !== null;
	}

	onResize(): void {
		// NOTE: update when files change only if the view becomes visible again
		if (this.isVisible() && this.resolvedEventRef == null) {
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
