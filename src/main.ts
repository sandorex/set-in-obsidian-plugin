// sandorex/set-in-obsidian-plugin
// Copyright (C) 2022 Aleksandar Radivojević
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

import type moment from 'moment';
import { Plugin, WorkspaceLeaf } from 'obsidian';
import { DEFAULT_SETTINGS, SetInObsidianSettings, SetInObsidianSettingsTab } from './settings';
import { TimelineView } from './view';

declare global {
	interface Window {
		moment: typeof moment;
	}
}

export const TIMELINE_VIEW_TYPE = 'set-in-obsidian-timeline';
export const TIMELINE_VIEW_ICON = 'calendar-clock';

export default class SetInObsidianPlugin extends Plugin {
	settings: SetInObsidianSettings;

	async onload() {
		await this.loadSettings();

		if (this.calendarOverideModified())
			console.log("set-in-obsidian plugin calendar options modified, beware");

		this.registerView(TIMELINE_VIEW_TYPE, leaf => new TimelineView(leaf, this));
		this.addSettingTab(new SetInObsidianSettingsTab(this.app, this));

		this.addCommand({
			id: 'set-in-obsidian-timeline',
			name: 'Show Timeline',
			callback: () => this.revealView(true)
		});

		if (this.settings.showRibbonIcon)
			this.addRibbonIcon(TIMELINE_VIEW_ICON, 'SIO Timeline', async () => await this.revealView());

		if (this.settings.openTimelineOnStartup)
			this.app.workspace.onLayoutReady(() => this.revealView(false));
	}

	calendarOverideModified(): boolean {
		return Object.keys(this.settings.calendarOverrideOptions).length != 0;
	}

	// TODO: this function takes a really long time for some reason
	async revealView(reveal: boolean = true) {
		var leaf = this.getTimelineLeaf();
		if (leaf == null) {
			// create it if it does not exist already
			await this.app.workspace.getRightLeaf(false).setViewState({
				type: TIMELINE_VIEW_TYPE,
				active: reveal,
			});
		} else if (reveal)
			this.app.workspace.revealLeaf(leaf);
	}

	getTimelineLeaf(): WorkspaceLeaf | undefined {
		return this.app.workspace.getLeavesOfType(TIMELINE_VIEW_TYPE)[0];
	}

	getTimelineView(): TimelineView | null {
		return this.getTimelineLeaf()?.view as TimelineView;
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
