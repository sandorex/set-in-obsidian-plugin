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

import { CalendarOptions } from '@fullcalendar/core';
import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import SetInObsidianPlugin from './main';

export interface SetInObsidianSettings {
	openTimelineOnStartup: boolean;
	showRibbonIcon: boolean;
	useTimeline: boolean;
	defaultView: string;
	defaultEventColor: string;

	// dev
	devOptions: boolean;
	calendarOverrideOptions: CalendarOptions;
}

export const DEFAULT_SETTINGS: SetInObsidianSettings = {
	openTimelineOnStartup: true,
	showRibbonIcon: true,
	useTimeline: false,
	defaultView: 'listWeek',
	defaultEventColor: '#7d5bed',

	// dev
	devOptions: false,
	calendarOverrideOptions: {},
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
				style: 'text-align: center;',
			},
			text: 'Set In Obsidian Plugin Settings'
		});


		new Setting(containerEl)
			.setName('Open Timeline On Startup')
			.setDesc('Opens timeline on startup in background, it makes opening it faster but may lag the application a bit')
			.addToggle(btn =>
				btn.setValue(this.plugin.settings.openTimelineOnStartup)
					.onChange(async value => {
						this.plugin.settings.openTimelineOnStartup = value;

						await this.plugin.saveSettings();
					}));


		new Setting(containerEl)
			.setName('Show Timeline Ribbon Icon')
			.setDesc('Shows ribbon icon to open the timeline view, you can always open the timeline with the command')
			.addToggle(btn =>
				btn.setValue(this.plugin.settings.showRibbonIcon)
					.onChange(async value => {
						this.plugin.settings.showRibbonIcon = value;

						await this.plugin.saveSettings();
					}));

		new Setting(containerEl)
			.setName('Horizontal Timeline')
			.setDesc('Uses timeline view instead of timeGrid view')
			.addToggle(btn =>
				btn.setValue(this.plugin.settings.useTimeline)
					.onChange(async value => {
						this.plugin.settings.useTimeline = value;

						await this.plugin.saveSettings();
					}));

		// new Setting(containerEl)
		// 	.setName('Default FullCalendar View')
		// 	.setDesc('View that will be shown whenever timeline is opened')
		// 	.addDropdown(dd => {
		// 		dd.addOption('dayGridMonth', 'Month');

		// 		if (this.plugin.settings.useTimeline)
		// 			dd.addOption('timeGridWeek', 'Week');
		// 		else
		// 			dd.addOption('timelineWeek', 'Week');

		// 		dd.addOption('listWeek', 'Week List');

		// 		if (this.plugin.settings.useTimeline)
		// 			dd.addOption('timeGridDay', 'Day');
		// 		else
		// 			dd.addOption('timelineDay', 'Day');

		// 		dd.setValue(this.plugin.settings.defaultView);

		// 		dd.onChange(async value => {
		// 			this.plugin.settings.defaultView = value;
		// 			await this.plugin.saveSettings();
		// 		});
		// 	});

		var eventColorSetting = new Setting(containerEl)
			.setName('Default Event Color');

		eventColorSetting.addColorPicker(cp => {
			eventColorSetting.addText(text => {
				text.setDisabled(true);
				text.setValue(this.plugin.settings.defaultEventColor);
				cp.setValue(this.plugin.settings.defaultEventColor);

				cp.onChange(async value => {
					text.setValue(value);
					this.plugin.settings.defaultEventColor = value;

					await this.plugin.saveSettings();
				});
			});
		});

		new Setting(containerEl)
			.setClass('set-in-obsidian-developer-settings')
			.setName('Enable developer settings')
			.setDesc('THESE SETTINGS WILL BREAK THE ADDON IF CONFIGURED WRONGLY')
			.addToggle(btn =>
				btn.setValue(this.plugin.settings.devOptions)
					.onChange(async value => {
						if (!value) {
							// reset all dev options after disabling
							this.plugin.settings.calendarOverrideOptions = DEFAULT_SETTINGS.calendarOverrideOptions;
						}

						this.plugin.settings.devOptions = value;

						await this.plugin.saveSettings();

						// reset the screen to show the dev options
						this.display();
					}));

		if (this.plugin.settings.devOptions) {
			containerEl.createEl('h2', {
				attr: {
					style: 'color: red; font-weight: bold'
				},
				text: '⚠ DEVELOPER SETTINGS ⚠'
			});

			new Setting(containerEl)
				.setClass('set-in-obsidian-fullcalendar-options')
				.setName('FullCalendar Options')
				.addTextArea(txt => {
					function setSuccess(value: boolean) {
						if (value) {
							txt.inputEl.removeClass('set-in-obsidian-fail');
							txt.inputEl.addClass('set-in-obsidian-success');
						} else {
							txt.inputEl.removeClass('set-in-obsidian-success');
							txt.inputEl.addClass('set-in-obsidian-fail');
						}
					}

					try {
						txt.setValue(JSON.stringify(this.plugin.settings.calendarOverrideOptions, null, 4))
						setSuccess(true);
					} catch (ex) {
						setSuccess(false);
						console.error("error compiling JSON", ex);
						new Notice("Error compiling JSON please check the console for details");
					}

					txt.inputEl.addEventListener('focusout', async _ev => {
						try {
							setSuccess(true);
							this.plugin.settings.calendarOverrideOptions = JSON.parse(txt.getValue());
							await this.plugin.saveSettings();
						} catch (ex) {
							setSuccess(false);
							console.error("error compiling JSON", ex);
							new Notice("Error compiling JSON please check the console for details");
						}
					});
				})
				.setDesc('Override default options in JSON format, if you break something just delete everything and it will reset. '
					+ 'For more information what options are available ')
				.descEl.createEl('a', {
					text: 'click here',
					href: 'https://fullcalendar.io/docs/v6',
				});
		}
	}
}
