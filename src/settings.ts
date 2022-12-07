import { App, PluginSettingTab } from 'obsidian';
import SetInObsidianPlugin from './main';

export interface SetInObsidianSettings {
}

export const DEFAULT_SETTINGS: SetInObsidianSettings = {
}

export class SetInObsidianSettingsTab extends PluginSettingTab {
	plugin: SetInObsidianPlugin;

	constructor(app: App, plugin: SetInObsidianPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h3', {
			attr: {
				'style': 'text-align: center;',
			},
			text: 'Set In Obsidian Plugin Settings'
		});
	}
}
