import { Plugin } from 'obsidian';
import { TimelineView } from './view';

import type moment from 'moment';
declare global {
	interface Window {
		moment: typeof moment;
	}
}

export const TIMELINE_VIEW_TYPE = 'set-in-obsidian-timeline';
export const TIMELINE_VIEW_ICON = 'calendar-clock';

export default class SetInObsidianPlugin extends Plugin {
	timelineView?: TimelineView;

	async onload() {
		this.registerView(TIMELINE_VIEW_TYPE, leaf => {
			this.timelineView = new TimelineView(leaf, this);
			return this.timelineView;
		});

		this.addRibbonIcon(TIMELINE_VIEW_ICON, 'SIO Timeline', () => this.revealView());
	}

	async revealView() {
		var leafs = this.app.workspace.getLeavesOfType(TIMELINE_VIEW_TYPE);
		if (leafs.length == 0) {
			// create it if it does not exist already
			await this.app.workspace.getRightLeaf(false).setViewState({
				type: TIMELINE_VIEW_TYPE,
				active: true,
			});
		}

		this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(TIMELINE_VIEW_TYPE)[0]);
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(TIMELINE_VIEW_TYPE);
	}
}
