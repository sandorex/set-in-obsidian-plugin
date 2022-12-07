import moment from "moment";

export class EventPeriod {
	start: Date;
	end?: Date;

	constructor(start: Date, end?: Date) {
		this.start = start;
		this.end = end;
	}

	static parse(raw: String): [EventPeriod, String] | null {
		const momentParse = (input: string) => window.moment(input, window.moment.ISO_8601, true);
		const momentParseDur = (input: string) => window.moment.duration(input);

		if (raw.startsWith('%%;')) {
			var index = raw.indexOf(';', 3);
			if (index == -1)
				return null;

			const leftover = raw.substring(index + 3);

			// TODO: this code is garbage please clean it up
			var timeRaw = raw.substring(3, index);
			if (timeRaw.contains(' ')) {
				const timeParts = timeRaw.split(' ', 2);
				const start = momentParse(timeParts[0]);

				var end;
				if (timeParts[1].startsWith('P')) {
					end = momentParseDur(timeParts[1]);
				} else {
					end = momentParse(timeParts[1]);
				}

				return [EventPeriod.fromMoment(start, end), leftover];
			} else {
				return [EventPeriod.fromMoment(momentParse(timeRaw), null), leftover];
			}
		}

		return null;
	}

	static fromMoment(start: moment.Moment, end?: moment.Moment | moment.Duration): EventPeriod | null {
		if (!start.isValid())
			return null;

		if (end == null)
			return new EventPeriod(start.toDate(), null);

		if (window.moment.isDuration(end))
			return new EventPeriod(start.toDate(), end.asMinutes() >= 1 ? start.clone().add(end).toDate() : null);

		return new EventPeriod(start.toDate(), end.toDate());
	}

	isAllDay(): boolean {
		return this.end == null;
	}
}