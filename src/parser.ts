import { ListItemCache, TFile } from 'obsidian';

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

export function parseListItem(raw: string): [Date, Date, string] | null {
	const momentParse = (input: string) => window.moment(input, window.moment.ISO_8601, true);
	const momentParseDur = (input: string) => window.moment.duration(input);

	if (raw.startsWith('`')) {
		var index = raw.indexOf('`', 1);
		if (index == -1)
			return null;

		const leftover = raw.substring(index + 1).trim();

		var start = null;
		var end = null;
		var timeRaw = raw.substring(1, index);
		if (timeRaw.contains(' ')) {
			const timeParts = timeRaw.split(' ', 2);
			start = momentParse(timeParts[0]);

			if (timeParts[1].startsWith('P'))
				end = momentParseDur(timeParts[1]);
			else
				end = momentParse(timeParts[1]);
		} else
			start = momentParse(timeRaw);

		if (start == null)
			return null;

		if (end == null)
			return [
				start.toDate(),
				start.clone().set('hours', 24).set('minutes', 0).set('seconds', 0).toDate(),
				leftover
			];

		if (window.moment.isDuration(end))
			return [
				start.toDate(),
				start.clone().add(end).toDate(),
				leftover
			];

		// making it inclusive of the end date
		if (end.hours() + end.minutes() + end.seconds() == 0)
			end.set('hours', 24);

		return [start.toDate(), end.toDate(), leftover];
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
