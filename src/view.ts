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

import { Calendar, CalendarOptions } from '@fullcalendar/core';
import { EditorPosition, EventRef, ItemView, MarkdownView, Notice, Platform, WorkspaceLeaf } from 'obsidian';
import { CALENDAR_OPTIONS, CALENDAR_OPTIONS_AFTER } from './calendar';
import SetInObsidianPlugin, { CALENDAR_VIEW_ICON, CALENDAR_VIEW_TYPE } from './main';
import { gatherGlobalEvents } from './parser';

export class CalendarView extends ItemView {
	private resolvedEventRef: EventRef | null;

	plugin: SetInObsidianPlugin;
	fullcalendar: Calendar | null;

	constructor(leaf: WorkspaceLeaf, plugin: SetInObsidianPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.navigation = true;
		this.icon = CALENDAR_VIEW_ICON;
	}

	async onOpen(): Promise<void> {
		this.containerEl.empty();

		// the calendar is contained inside the wrapper so it overflows and you can scroll
		this.containerEl.createDiv({ cls: ['set-in-obsidian-wrapper', 'set-in-obsidian-wrapper-view'], }, wrapper => {
			const currentRange = wrapper.createEl('h4', { text: 'UNDEFINED' });

			wrapper.createDiv({ cls: 'set-in-obsidian-timeline', }, elem => {
				let options: CalendarOptions = {
					...CALENDAR_OPTIONS,
					...this.plugin.settings.calendarOverrideOptions,
					...CALENDAR_OPTIONS_AFTER
				};

				options.initialView = this.plugin.settings.defaultView;

				// gather globla events and use external sources
				options.eventSources = [
					gatherGlobalEvents,
					this.plugin.externalSources
				];

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

				this.fullcalendar = new Calendar(elem, options);
				this.fullcalendar.render();
			});
		});
	}

	async onClose(): Promise<void> {
		if (this.resolvedEventRef != null)
			app.metadataCache.offref(this.resolvedEventRef);
	}

	private isVisible(): boolean {
		// i have no idea how this works but it does
		// source: https://stackoverflow.com/a/21696585
		return this.containerEl.offsetParent !== null;
	}

	onResize(): void {
		// force calendar to resize
		if (this.isVisible())
			this.fullcalendar?.setOption('aspectRatio', this.fullcalendar?.getOption('aspectRatio'));

		// NOTE: update when files change only if the view becomes visible again
		if (this.isVisible() && this.resolvedEventRef == null) {
			this.fullcalendar?.refetchEvents();

			// NOTE: does fire on renames contrary to 'changed'
			this.resolvedEventRef = app.metadataCache.on('resolved', () => this.fullcalendar?.refetchEvents());
		} else if (!this.isVisible() && this.resolvedEventRef != null) {
			app.metadataCache.offref(this.resolvedEventRef);
			this.resolvedEventRef = null;
		}
	}

	getViewType(): string {
		return CALENDAR_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'SIO Calendar';
	}
}
