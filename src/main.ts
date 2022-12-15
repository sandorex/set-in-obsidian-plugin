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
