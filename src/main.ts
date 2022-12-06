import { ListItemCache, Plugin, TFile } from "obsidian";
import { DEFAULT_SETTINGS, SetInObsidianSettings, SetInObsidianSettingsTab } from "./settings";
import { TimelineView } from "./view";

import type moment from "moment";
import { EventPeriod } from "./parser";

declare global {
	interface Window {
		moment: typeof moment;
	}
}

export const TIMELINE_VIEW_TYPE = "set-in-obsidian-timeline";
export const TIMELINE_VIEW_ICON = "calendar-clock";

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
			items.set(file, this.app.metadataCache.getFileCache(file).listItems.map(item => {
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

	async onload() {
		await this.loadSettings();

		this.registerView(TIMELINE_VIEW_TYPE, leaf => new TimelineView(leaf, this));

		// this.addRibbonIcon(TIMELINE_VIEW_ICON, "SIO Timeline", () => this.activateView());
		this.addRibbonIcon(TIMELINE_VIEW_ICON, "SIO Timeline", async () => {
			var items = await this.getListItems([this.app.workspace.getActiveFile()])


			for (const [file, item] of items) {
				console.log(item[0][1], EventPeriod.parse(item[0][1]));
			}
			// parseTimeFromListItem
			// console.log(await this.getListItems([this.app.workspace.getActiveFile()]));
		});

		this.addSettingTab(new SetInObsidianSettingsTab(this.app, this));
	}

	async activateView() {
		this.app.workspace.detachLeavesOfType(TIMELINE_VIEW_TYPE);

		await this.app.workspace.getRightLeaf(false).setViewState({
			type: TIMELINE_VIEW_TYPE,
			active: true,
		});

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
