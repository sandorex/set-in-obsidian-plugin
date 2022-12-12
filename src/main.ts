import { Plugin, WorkspaceLeaf } from 'obsidian';
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
		this.registerView(TIMELINE_VIEW_TYPE, leaf => new TimelineView(leaf, this));
		this.addRibbonIcon(TIMELINE_VIEW_ICON, 'SIO Timeline', () => this.revealView());
	}

	async revealView() {
		var leaf = this.getTimelineLeaf();
		if (leaf == null) {
			// create it if it does not exist already
			await this.app.workspace.getRightLeaf(false).setViewState({
				type: TIMELINE_VIEW_TYPE,
				active: true,
			});
		}

		leaf = this.getTimelineLeaf();
		if (leaf != null)
			this.app.workspace.revealLeaf(leaf);
	}

	getTimelineLeaf(): WorkspaceLeaf | null {
		// there should only ever be one
		var leafs = this.app.workspace.getLeavesOfType(TIMELINE_VIEW_TYPE);

		if (leafs.length == 0)
			return null;

		return leafs[0];
	}

	getTimelineView(): TimelineView | null {
		var leaf = this.getTimelineLeaf();

		if (leaf == null)
			return null;

		return leaf.view as TimelineView;
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(TIMELINE_VIEW_TYPE);
	}
}
