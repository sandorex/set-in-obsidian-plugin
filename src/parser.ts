import moment from "moment";

export class EventPeriod {
	start: Date;
	end?: Date;

	constructor(start: Date, end?: Date) {
		this.start = start;
		this.end = end;
	}

	static parse(raw: String): EventPeriod | null {
		const momentParse = (input: string) => window.moment(input, window.moment.ISO_8601, true);
		const momentParseDur = (input: string) => window.moment.duration(input);

		if (raw.startsWith('%%[')) {
			var index = raw.indexOf(']');
			if (index == -1)
				return null;

			// TODO: this code is garbage please clean it up
			var timeRaw = raw.substring(3, index);
			if (timeRaw.contains(' ')) {
				const timeParts = timeRaw.split(' ', 2);
				const start = momentParse(timeParts[0]);

				var end;
				if (timeParts[1].startsWith('P')) {
					end = start.clone().add(momentParseDur(timeParts[1]));
				} else {
					end = momentParse(timeParts[1]);
				}

				return EventPeriod.fromMoment(start, end);
			} else {
				return EventPeriod.fromMoment(momentParse(timeRaw), null);
			}
		}

		return null;
	}

	static fromMoment(start: moment.Moment, end?: moment.Moment): EventPeriod | null {
		console.log("got", start, end);
		if (!start.isValid() || (end != null && !end.isValid()))
			return null;

		if (window.moment.isDuration(start))
			return null;

		if (window.moment.isDuration(end)) {
			console.debug("it is a duration ", end);
			return new EventPeriod(start.toDate(), window.moment().add(end).toDate());
		}

		return new EventPeriod(start.toDate(), end != null ? end.toDate() : null);
	}

	isAllDay(): boolean {
		return this.end == null;
	}
}
