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
import type moment from 'moment';
import { Plugin, WorkspaceLeaf } from 'obsidian';
import { EmbeddedCalendarMode } from './calendar';
import { EmbeddedCalendar } from './embedded';
import { parseEmbeddedOptions } from './parser';
import { DEFAULT_SETTINGS, SetInObsidianSettings, SetInObsidianSettingsTab } from './settings';
import { CalendarView } from './view';

declare global {
	interface Window {
		moment: typeof moment;
	}
}

export const FILE_SIZE_LIMIT = 5_000_000; // 5mb

export const CALENDAR_VIEW_TYPE = 'set-in-obsidian-calendar';
export const CALENDAR_VIEW_ICON = 'calendar-clock';

export default class SetInObsidianPlugin extends Plugin {
	settings: SetInObsidianSettings;
	externalSources: any[] = [];

	async onload() {
		await this.loadSettings();

		if (this.settings.devOptions)
			console.log('set-in-obsidian plugin developer options enabled, here be dragons');

		this.registerView(CALENDAR_VIEW_TYPE, leaf => new CalendarView(leaf, this));
		this.addSettingTab(new SetInObsidianSettingsTab(this.app, this));

		this.addCommand({
			id: 'calendar-view',
			name: 'Show Calendar',
			callback: () => this.revealCalendarView(true)
		});

		this.addRibbonIcon(CALENDAR_VIEW_ICON, 'SIO Timeline', async () => await this.revealCalendarView());

		if (this.settings.openTimelineOnStartup)
			this.app.workspace.onLayoutReady(() => this.revealCalendarView(false));

		this.registerMarkdownCodeBlockProcessor('set-in-obsidian', (source, el, ctx) => {
			const result = parseEmbeddedOptions(EmbeddedCalendarMode.DEFAULT, source);
			if (typeof result == "string") {
				el.textContent = result;
				return;
			}

			try {
				ctx.addChild(new EmbeddedCalendar(el, result, ctx.sourcePath, this));
			} catch (error) {
				el.textContent = error;
			}
		});

		this.registerMarkdownCodeBlockProcessor('set-in-obsidian-custom', (source, el, ctx) => {
			const result = parseEmbeddedOptions(EmbeddedCalendarMode.CUSTOM, source);
			if (typeof result == "string") {
				el.textContent = result;
				return;
			}

			try {
				ctx.addChild(new EmbeddedCalendar(el, result, ctx.sourcePath, this));
			} catch (error) {
				el.textContent = error;
			}
		});

		this.registerMarkdownCodeBlockProcessor('set-in-obsidian-minimal', (source, el, ctx) => {
			const result = parseEmbeddedOptions(EmbeddedCalendarMode.MINIMAL, source);
			if (typeof result == "string") {
				el.textContent = result;
				return;
			}

			try {
				ctx.addChild(new EmbeddedCalendar(el, result, ctx.sourcePath, this));
			} catch (error) {
				el.textContent = error;
			}
		});
	}

	/**
	 * @public
	 * Add a FullCalendar source to global calendar
	 */
	addExternalCalendarSource(source: any) {
		this.externalSources.push(source);
	}

	/**
	 * @public
	 * Creates the timeline view if it does not exist already
	 * @param reveal focuses the view if true
	 */
	async revealCalendarView(reveal: boolean = true) {
		const leaf = this.getCalendarViewLeaf();

		// create it if it does not exist already
		if (leaf == null)
			await this.app.workspace.getRightLeaf(false).setViewState({
				type: CALENDAR_VIEW_TYPE,
				active: reveal,
			});
		else if (reveal)
			this.app.workspace.revealLeaf(leaf);
	}

	/**
	 * @public
	 * Access to FullCalendar object directly
	 */
	getCalendar(): Calendar | null | undefined {
		return this.getCalendarView()?.fullcalendar;
	}

	getCalendarViewLeaf(): WorkspaceLeaf | undefined {
		return this.app.workspace.getLeavesOfType(CALENDAR_VIEW_TYPE)[0];
	}

	getCalendarView(): CalendarView | null {
		return this.getCalendarViewLeaf()?.view as CalendarView;
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(CALENDAR_VIEW_TYPE);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
