# F1 While You're Awake

Formula 1, mapped to your day. F1 While You're Awake helps you find races that fit your timezone and sleep schedule, follow your favorite driver, and track both world championships.

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
- Favorite-driver selection, championship position, wins, podiums, and season charts.
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

## Visit

Visit **[f1-awake.0811dingy.workers.dev](https://f1-awake.0811dingy.workers.dev)** in your browser.

An internet connection is required for F1 data, team logos, driver portraits, fonts, and icons.

### Default settings

| Setting | Default |
| --- | --- |
| Timezone | Pacific Time / `America/Los_Angeles` |
| Wake up | 10:00 AM |
| Wind down | 1:00 AM |
| Favorite driver | Lando Norris |
| Season | 2026 |

Settings are saved in browser local storage and are specific to each visitor and site origin. They are not uploaded to a user database.

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

Data is fetched when the page loads or the selected season/driver changes; standings do not automatically refresh in the background. Reload the page to request updated data. External services may impose rate limits or become unavailable; the app displays unavailable-data states rather than fabricating results.

## Attribution and rights

Copyright (c) 2026. Created by [@dyq0811](https://github.com/dyq0811).

Independent fan project, not affiliated with or endorsed by Formula 1 or its teams. Third-party data, photography, logos, trademarks, fonts, and libraries remain subject to their respective owners' rights and licenses. Public access to an asset does not automatically grant permission to redistribute it.

This repository does not currently include an open-source license. The author attribution is not a blanket license to reuse the project or its third-party assets.
