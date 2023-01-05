// sandorex/set-in-obsidian-plugin
// Copyright (C) 2022-2023 Aleksandar Radivojević
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Calendar } from '@fullcalendar/core';
import { EditorPosition, EventRef, ItemView, MarkdownView, Notice, Platform, WorkspaceLeaf } from 'obsidian';
import { CALENDAR_OPTIONS, CALENDAR_OPTIONS_AFTER } from './calendar_options';
import SetInObsidianPlugin, { TIMELINE_VIEW_ICON, TIMELINE_VIEW_TYPE } from './main';
import { extractListItems, filterMarkdownFiles, parseListItem } from './parser';

export class TimelineView extends ItemView {
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

	async getListItemsFromFiles() {
		return extractListItems(filterMarkdownFiles(this.app.vault.getMarkdownFiles()));
	}

	/**
	 * @returns all events from filtered files
	 */
	async gatherEvents(): Promise<Record<any, any>[]> {
		const listItemFiles = await this.getListItemsFromFiles();

		let events: Record<any, any>[] = [];

		for (const file of listItemFiles) {
			for (const [metadata, rawText] of file.listItems) {
				const results = parseListItem(rawText);

				if (results == null)
					continue;

				// TODO: color done tasks, but only border or text so that rrule tasks can be different

				const event: Record<any, any> = {
					...results,

					// NOTE: these are used to open the file where the event was found
					extendedProps: {
						file: file.file,
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
			const currentRange = wrapper.createEl('h4', { text: 'UNDEFINED' });

			wrapper.createDiv({ cls: 'set-in-obsidian-timeline', }, elem => {
				const options = {
					// overridable defaults
					...CALENDAR_OPTIONS,

					// user provided overrides
					...this.plugin.settings.calendarOverrideOptions,

					// defaults that should not be changed
					...CALENDAR_OPTIONS_AFTER,
				};

				options.initialView = this.plugin.settings.defaultView;

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
						const leaf = app.workspace.getLeaf('tab');
						await leaf.openFile(file);

						const view = leaf.view as MarkdownView;
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

	update() {
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
		// force calendar to resize
		if (this.isVisible())
			this.calendar?.setOption('aspectRatio', this.calendar?.getOption('aspectRatio'));

		// NOTE: update when files change only if the view becomes visible again
		if (this.isVisible() && this.resolvedEventRef == null) {
			this.update();

			// NOTE: does fire on renames contrary to 'changed'
			this.resolvedEventRef = app.metadataCache.on('resolved', () => this.update());
		} else if (!this.isVisible() && this.resolvedEventRef != null) {
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
