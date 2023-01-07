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

import { CachedMetadata, ListItemCache, TFile } from 'obsidian';
import { RRule } from 'rrule';
import { ECALENDAR_OPTIONS_CUSTOM, ECALENDAR_OPTIONS_DEFAULTS, ECALENDAR_OPTIONS_MINIMAL, EmbeddedCalendarMode, EmbeddedCalendarOptions } from './calendar';
import { FILE_SIZE_LIMIT } from './main';

/**
 * Generator that chains two arrays together into one generator
 *
 * `array2` must be equal or larger in length than `array1`
 */
function* chain<K, V>(array1: K[], array2: V[]): Generator<[K, V]> {
	for (let i = 0; i < array1.length; i++) {
		yield [array1[i], array2[i]];
	}
}

async function readFilesCached(files: TFile[]): Promise<Map<TFile, String>> {
	return Promise.all(files.map(file => app.vault.cachedRead(file))).then(fileContents =>
		new Map<TFile, String>(chain(files, fileContents))
	);
}

/**
 * Filters files by removing files without list items, files that are too large and some special cases
 */
function filterMarkdownFiles(files: TFile[]): TFile[] {
	return files.filter(file => {
		// restrict file size
		if (file.stat.size > FILE_SIZE_LIMIT)
			return false;

		const cache = app.metadataCache.getFileCache(file);

		// if it does not have any list items it's useless
		if (cache?.listItems && cache.listItems.length <= 0)
			return false;

		// explicitly ignored files, could be useful for huge files
		if (cache?.frontmatter?.['set-in-obsidian-ignore'] == true)
			return false;

		// excalidraw files can be pretty huge so ignore them as well
		if (cache?.frontmatter?.['excalidraw-plugin'] !== undefined)
			return false;

		return true;
	});
}

/**
 * Parses list item into an event
 * @param raw raw list item without the leading dash and brackets in case of tasks
 * @returns parsable event object with set title, start/end/rrule properties, or null if any errors
 */
export function parseListItem(raw: string): {
	title: string,
	start: Date,
	end?: Date,
	rrule?: Record<any, any>
} | null {
	const momentParse = (input: string) => window.moment(input, window.moment.ISO_8601, true);
	const momentParseDur = (input: string) => window.moment.duration(input);

	if (raw.startsWith('`')) {
		const index = raw.indexOf('`', 1);
		if (index == -1)
			return null;

		const leftover = raw.substring(index + 1).trim();

		let start = null;
		let end = null;
		let rrule: RRule | null = null;

		const timeRaw = raw.substring(1, index);
		if (timeRaw.contains(' ')) {
			// split but keep the leftovers
			const timeParts = timeRaw.split(/ (.*)/s);
			start = momentParse(timeParts[0]);

			const ch = timeParts[1].at(0);
			if (ch == null)
				return null;

			if (ch == 'P')
				end = momentParseDur(timeParts[1]);
			else if (ch >= '0' && ch <= '9')
				// ISO 8601 starts with the year so assume date
				end = momentParse(timeParts[1]);
			else {
				// otherwise try getting rrule
				try {
					rrule = RRule.fromText(timeParts[1]);
				} catch (err) {
					// TODO: debugging mode and more information for catching errors
					return null;
				}

				// TODO: remove this when event highlighting is added and let user decide if its right
				// check if read properly, as it gives some weird results otherwise
				if (timeParts[1] != rrule.toText())
					return null;
			}
		} else
			start = momentParse(timeRaw);

		if (start == null)
			return null;

		if (rrule != null) {
			return {
				title: leftover,
				start: start.toDate(),
				rrule: {
					...rrule.options,

					// set the starting date for recurrance
					dtstart: start.toDate(),
				},
			}
		}

		if (end == null)
			return {
				title: leftover,
				start: start.toDate(),
				end: start.clone().set('hours', 24).set('minutes', 0).set('seconds', 0).toDate(),
			}

		if (window.moment.isDuration(end))
			return {
				title: leftover,
				start: start.toDate(),
				end: start.clone().add(end).toDate(),
			}

		// making it inclusive of the end date
		if (end.hours() + end.minutes() + end.seconds() == 0)
			end.set('hours', 24);

		return {
			title: leftover,
			start: start.toDate(),
			end: end.toDate(),
		}
	}

	return null;
}

async function extractListItems(files: TFile[]): Promise<{
	file: TFile,
	fileCache: CachedMetadata,
	listItems: [ListItemCache, string][],
}[]> {
	const fileContents = await readFilesCached(files);

	let items: any[] = [];

	// extract each item as string
	fileContents.forEach((contents, file) => {
		const cache = app.metadataCache.getFileCache(file);

		if (cache == null || cache.listItems == null || cache.listItems.length == 0)
			return;

		items.push({
			file: file,
			fileCache: cache,
			listItems: cache.listItems.map(item => {
				// all list items start with '- '
				let offset = 2;

				// remove the '[ ] ' from the task, you can use cache task property to check type
				if (item.task != null)
					offset += 4;

				return [
					item,
					contents.substring(item.position.start.offset + offset, item.position.end.offset).trim()
				];
			}),
		});
	});

	return items;
}

export async function gatherEventsFromFiles(files: TFile[], filter = true): Promise<Record<any, any>[]> {
	const listItemFiles = await extractListItems(filter ? filterMarkdownFiles(files) : files);

	let events: Record<any, any>[] = [];

	for (const file of listItemFiles) {
		for (const [metadata, rawText] of file.listItems) {
			const results = parseListItem(rawText);

			if (results == null)
				continue;

			// TODO: color done tasks, but only border or text so that rrule tasks can be different

			const event: Record<any, any> = {
				...results,

				// NOTE: these are used to open the file where the event was found
				extendedProps: {
					file: file.file,
					line: metadata.position.start.line,
					col: metadata.position.start.col
				}
			};

			if (event.rrule != null)
				event.color = '#eb8d1a'; // TODO: set the colors in options

			if (file.fileCache.frontmatter?.['set-in-obsidian-color'] != null)
				event.color = file.fileCache.frontmatter['set-in-obsidian-color'];

			events.push(event);
		}
	}

	return events;
}

/**
 * Gathers all global events, filtered
 */
export async function gatherGlobalEvents(..._args: any): Promise<Record<any, any>[]> {
	return gatherEventsFromFiles(app.vault.getMarkdownFiles(), true);
}

/**
 * Parses JSON embedded options and sets defaults depending on the mode, returns a string on error
 */
export function parseEmbeddedOptions(mode: EmbeddedCalendarMode, str: string): EmbeddedCalendarOptions | string {
	let data: Record<any, any>;

	switch (mode) {
		case EmbeddedCalendarMode.CUSTOM:
			data = ECALENDAR_OPTIONS_CUSTOM;
			break;

		case EmbeddedCalendarMode.MINIMAL:
			data = ECALENDAR_OPTIONS_MINIMAL;
			break;

		default:
			data = ECALENDAR_OPTIONS_DEFAULTS;
			break;
	}

	try {
		data = {
			...data,
			...JSON.parse(str)
		};
	} catch (error) {
		return `Error parsing options: ${error}`;
	}

	return data as EmbeddedCalendarOptions;
}
