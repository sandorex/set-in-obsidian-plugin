# Set In Obsidian Plugin
Plugin that allows time planning in obsidian

> **WARNING:** This plugin is experimental and may fundamentally change in the future

*Made cause [obsidian-day-planner](https://github.com/lynchjames/obsidian-day-planner) has been abandoned*

## Quick Usage Guide
The plugin looks for date in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format inside inline code backticks at beginning of any list item, here are some examples of the syntax:

```
- `2022-12-09T14:00` all day event (14:00 to 24:00)
- `2022-12-09T14:00 PT2H` event from 14:00 and lasts 2 hours
- `2022-12-09 2022-12-11` event from 9th december 00:00 to 11th december 00:00
```

## Data Safe Design
To avoid data loss caused by bugs and such <u>**the plugin shall not under any circumstance do any modification to any file**</u>

## Installation
**The plugin is not yet in obsidian repository**

### Manual
- Download latest plugin archive from [here](https://github.com/sandorex/set-in-obsidian-plugin/releases/latest/download/set-in-obsidian.zip) and extract into `.obsidian/plugin/`
- Enable the plugin in community plugins in settings

## Huge Thanks To
- vkurko for his [event calendar](https://github.com/vkurko/calendar)
- Stackoverflow
- Peeps at [obsidian discord](https://discord.com/invite/obsidianmd)

## Support Me
If you find this plugin useful consider tipping so that my brain gives me some happy chemicals

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/C0C7GVMY1)
