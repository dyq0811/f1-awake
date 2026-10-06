# F1 While You're Awake

Formula 1, mapped to your day. F1 While You're Awake helps you find races that fit your timezone and sleep schedule, follow your favorite driver, and track both world championships.

Visit **[f1-awake.0811dingy.workers.dev](https://f1-awake.0811dingy.workers.dev)** in your browser.

## Why I built this

F1's timezone switch is handy, but it doesn't know I'm a night owl. I still had to check every race to answer the real question: **will I actually be awake for this?** I'm here for lights out, not a 4am alarm.

I'm also more driver-loyal than team-loyal. My favorites can change garages; I'm still cheering for them. So I built a race calendar around my sleep schedule, with a driver view that follows the person, not the paint job.

## Preview

![F1 While You're Awake dashboard showing sleep settings, the next Grand Prix, championship standings, a timezone-aware race calendar, and driver results](preview.png)

Preview captured on October 6, 2026. Race schedules and standings change as the season progresses.

## Features

- Searchable timezone picker with eight common suggestions, city/name search, and keyboard navigation.
- Adjustable wake-up and wind-down times, visualized on a 24-hour sleep dial.
- Race times converted to your selected timezone, including daylight-saving changes.
- Upcoming, sleep-friendly, and full-season calendar views.
- Weekend details for practice, qualifying, sprints, and the Grand Prix when published.
- A season overview with a race-car progress marker and fading red trail.
- Scrollable Drivers' and Constructors' Championship standings with team logos and points.
- Searchable favorite-driver pickers in the daily rhythm panel and driver view, with name, team, and driver-code search plus keyboard navigation.
- New visitors start with the championship leader by points; selecting a driver saves that favorite instead of automatically switching back to the leader.
- Driver championship position, wins, podiums, and season charts.
- Full Grand Prix results and published lap-by-lap position traces.
- Responsive desktop/mobile layout and preferences saved in your browser.
- Season selection for 2024, 2025, and 2026.

### Race colors

| Color | Label | Meaning |
| --- | --- | --- |
| Dark red | Watch live | The entire estimated race window falls within your waking hours. |
| Light red | Sleep overlap | Part of the estimated race window overlaps your sleep. |
| Neutral gray | Sleep time | The estimated race window falls entirely within your sleep. |

Grand Prix estimates use a two-hour window. Actual races can last longer because of delays or red flags. Weekend sessions use their usual scheduled duration. Unconfirmed start times are shown as **Time TBC** rather than being classified as confirmed watchable races.

## Settings

An internet connection is required for F1 data, team logos, driver portraits, fonts, and icons.

### Default settings

| Setting | Default |
| --- | --- |
| Timezone | Pacific Time / `America/Los_Angeles` |
| Wake up | 8:00 AM |
| Wind down | 11:30 PM |
| Favorite driver | Driver with the most championship points in the selected season |
| Season | 2026 |

Settings are saved in browser local storage and are specific to each visitor and site origin. They are not uploaded to a user database.

The sleep schedule defaults to 11:30 PM-8:00 AM on a first visit. Once you change either time, your saved values are used on future visits instead of resetting to the defaults.

A saved favorite takes precedence over the default leader, including after standings updates and future visits. Until a favorite is explicitly chosen, the default follows the selected season's latest points leader. Choose **Follow points leader** in the picker to explicitly return to automatic mode. If standings are unavailable, the first available driver is used.

## Project files

```text
f1-afterhours/
	index.html      Page structure and author attribution
	app.js          Data fetching, timezone logic, and interactions
	styles.css      Base layout and responsive styles
	modern.css      Current racing-red theme and dashboard layout
	preview.png     README preview image
	README.md       Project documentation
```

## Data and credits

- Schedules, standings, results, and lap timings: [Jolpica F1](https://api.jolpi.ca/ergast/f1/).
- Team logos and driver portraits: Formula 1's public media CDN.
- Icons: [Lucide](https://lucide.dev/).
- Fonts: Barlow Condensed, DM Sans, and IBM Plex Mono via [Google Fonts](https://fonts.google.com/).

Results and lap progress are published historical data, **not live telemetry**. Championship totals include sprint points; the Grand Prix results and race-points chart exclude sprint points. Circuit drawings are stylized illustrations, not precise track maps.

Data is fetched when the page loads or the selected season/driver changes. While the page is visible, championship standings are refreshed every five minutes; returning to a stale tab also requests an update. Automatic driver selection follows the refreshed points leader, but a saved favorite is never replaced by a new leader. Updates depend on when the public feed publishes new results. External services may impose rate limits or become unavailable; the app retains existing standings when a refresh fails.

## Attribution and rights

Copyright (c) 2026. Created by [@dyq0811](https://github.com/dyq0811).

Independent fan project, not affiliated with or endorsed by Formula 1 or its teams. Third-party data, photography, logos, trademarks, fonts, and libraries remain subject to their respective owners' rights and licenses. Public access to an asset does not automatically grant permission to redistribute it.

This repository does not currently include an open-source license. The author attribution is not a blanket license to reuse the project or its third-party assets.