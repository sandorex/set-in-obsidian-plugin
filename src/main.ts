import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS, SetInObsidianSettings, SetInObsidianSettingsTab } from "./settings";
import { TimelineView } from "./view";

import type moment from "moment";

declare global {
	interface Window {
		moment: typeof moment;
	}
}

export const TIMELINE_VIEW_TYPE = "set-in-obsidian-timeline";

export default class SetInObsidianPlugin extends Plugin {
	settings: SetInObsidianSettings;

	async onload() {
		await this.loadSettings();

		this.registerView(TIMELINE_VIEW_TYPE, leaf => new TimelineView(leaf));

		this.addRibbonIcon("calendar-clock", "Set In Obsidian Timeline", () => {
			this.activateView();
		});

		// this.addCommand({
		// 	id: "nuke-orphaned-attachments",
		// 	name: "Trash orphaned attachments",
		// 	callback: () => {
		// 		console.log(this.app.metadataCache.getFileCache(this.app.workspace.getActiveFile()))
		// 		// this.app.workspace.getActiveFile()
		// 	},
		// });

		this.addSettingTab(new SetInObsidianSettingsTab(this.app, this));
	}

	async activateView() {
		this.app.workspace.detachLeavesOfType(TIMELINE_VIEW_TYPE);

		await this.app.workspace.getRightLeaf(false).setViewState({
			type: TIMELINE_VIEW_TYPE,
			active: true,
		});

		// this.app.workspace.getLeaf("split", "horizontal").setViewState({
		// 	type: TIMELINE_VIEW_TYPE,
		// 	active: true,
		// });

		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(TIMELINE_VIEW_TYPE)[0]
		);
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
