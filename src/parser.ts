import { ListItemCache, TFile } from 'obsidian';
import { RRule } from 'rrule';

/** Generator that chains two arrays together into one generator
 *
 *  `array2` must be equal or larger in length than `array1`
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

export function parseListItem(raw: string): {
	start: Date,
	end?: Date,
	rrule?: any,
	leftover: string,
} | null {
	const momentParse = (input: string) => window.moment(input, window.moment.ISO_8601, true);
	const momentParseDur = (input: string) => window.moment.duration(input);

	if (raw.startsWith('`')) {
		var index = raw.indexOf('`', 1);
		if (index == -1)
			return null;

		const leftover = raw.substring(index + 1).trim();

		var start = null;
		var end = null;
		var rrule: RRule | null = null;

		var timeRaw = raw.substring(1, index);
		if (timeRaw.contains(' ')) {
			// split but keep the leftovers
			const timeParts = timeRaw.split(/ (.*)/s);
			start = momentParse(timeParts[0]);

			var ch = timeParts[1].at(0);
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

				// check if read properly, as it gives some weird results otherwise
				if (timeParts[1] != rrule.toText())
					return null;
			}
		} else
			start = momentParse(timeRaw);

		if (start == null)
			return null;

		if (rrule != null) {
			// has to have a start otherwise it will always be from right now
			rrule.origOptions.dtstart = start.toDate();
			return {
				start: start.toDate(),
				rrule: rrule.options,
				leftover: leftover,
			}
		}

		if (end == null)
			return {
				start: start.toDate(),
				end: start.clone().set('hours', 24).set('minutes', 0).set('seconds', 0).toDate(),
				leftover: leftover,
			}

		if (window.moment.isDuration(end))
			return {
				start: start.toDate(),
				end: start.clone().add(end).toDate(),
				leftover: leftover,
			}

		// making it inclusive of the end date
		if (end.hours() + end.minutes() + end.seconds() == 0)
			end.set('hours', 24);

		return {
			start: start.toDate(),
			end: end.toDate(),
			leftover: leftover,
		}
	}

	return null;
}

export async function extractListItems(files: TFile[]): Promise<Map<TFile, [ListItemCache, string][]>> {
	const fileContents = await readFilesCached(files);

	var items = new Map<TFile, [ListItemCache, string][]>();

	// extract each item as string
	fileContents.forEach((contents, file) => {
		const cache = app.metadataCache.getFileCache(file);

		if (cache == null || cache.listItems == null)
			return;

		items.set(file, cache.listItems.map(item => {
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
