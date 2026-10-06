const $ = (selector) => document.querySelector(selector);
const API = 'https://api.jolpi.ca/ergast/f1/';
const STORE = 'apex-preferences-v1';
let saved = {};
try { saved = JSON.parse(localStorage.getItem(STORE) || '{}'); } catch {}
const state = { season: ['2026', '2025', '2024'].includes(saved.season) ? saved.season : '2026', timezone: saved.timezone || 'America/Los_Angeles', wake: saved.wake || '10:00', sleep: saved.sleep || '01:00', driver: saved.driver || 'norris', filter: 'upcoming', chart: 'position', races: [], standings: [], constructorStandings: [], results: [], source: '', driverToken: 0, seasonToken: 0 };
const timezoneNames = { 'America/Los_Angeles': 'Pacific Time · Los Angeles', 'America/New_York': 'Eastern Time · New York', 'America/Chicago': 'Central Time · Chicago', 'America/Denver': 'Mountain Time · Denver', 'Europe/London': 'London · United Kingdom', 'Europe/Paris': 'Paris · France', 'Asia/Singapore': 'Singapore', 'Asia/Tokyo': 'Tokyo · Japan', 'Australia/Sydney': 'Sydney · Australia', 'Asia/Kolkata': 'India · Kolkata', 'UTC': 'Coordinated Universal Time' };
const countries = { Australia: 'AU', China: 'CN', Japan: 'JP', USA: 'US', Canada: 'CA', Monaco: 'MC', Spain: 'ES', Austria: 'AT', UK: 'GB', Belgium: 'BE', Hungary: 'HU', Netherlands: 'NL', Italy: 'IT', Azerbaijan: 'AZ', Singapore: 'SG', Mexico: 'MX', Brazil: 'BR', Qatar: 'QA', UAE: 'AE', Bahrain: 'BH', 'Saudi Arabia': 'SA' };
const tracks = {
  marina_bay: 'M30 83 L30 43 L62 43 L62 25 L82 25 L82 51 L106 51 L106 30 L132 30 L132 43 L163 43 L180 60 L171 78 L141 78 L140 104 L125 110 L101 100 L83 113 L58 101 L43 107 Z',
  americas: 'M25 105 L44 32 L59 44 L68 38 L79 49 L88 42 L97 56 L106 47 L117 62 L161 66 L184 94 L172 104 L149 78 L127 78 L117 96 L107 84 L93 92 L78 75 L65 98 L51 91 L40 112 Z',
  vegas: 'M30 35 L95 35 L105 58 L175 58 L175 99 L55 99 L43 83 L30 83 Z',
  rodriguez: 'M23 36 L175 36 L187 52 L181 66 L138 66 L122 80 L108 69 L96 86 L83 77 L79 102 L48 105 L38 88 L24 84 L34 67 L22 56 Z',
  interlagos: 'M28 45 L169 45 L184 65 L172 84 L149 90 L141 77 L119 69 L111 85 L124 99 L96 111 L68 91 L59 71 L42 82 L26 73 Z',
  default: 'M24 91 L36 44 L73 30 L93 43 L114 34 L158 43 L181 67 L168 93 L143 96 L125 78 L105 90 L84 73 L64 96 L46 82 Z'
};
const teams = { mclaren: ['mclaren', '#ed8a36'], mercedes: ['mercedes', '#389d92'], ferrari: ['ferrari', '#ed352c'], red_bull: ['redbullracing', '#4483c4'], aston_martin: ['astonmartin', '#348369'], williams: ['williams', '#528ae3'], alpine: ['alpine', '#d485ad'], haas: ['haasf1team', '#8c9692'], audi: ['audi', '#d8443e'], rb: ['racingbulls', '#5488cf'], cadillac: ['cadillac', '#777975'] };
const finishText = (result) => result.status === 'Disqualified' ? 'DSQ' : ['Did not start', 'Withdrawn', 'Did not qualify', 'Did not prequalify'].includes(result.status) ? 'DNS' : result.positionText === 'R' ? 'DNF' : `P${result.position}`;
const resultRow = (race) => { const result = race.Results[0]; return `<button class="result-row" data-result="${race.round}" title="View lap-by-lap progress"><span class="result-country">${countries[race.Circuit.Location.country] || 'GP'}</span><span class="result-name">${escapeHTML(shortName(race))}</span><span class="points">+${result.points} pts</span><span class="position">${result.grid === '0' ? 'PIT' : `P${result.grid}`}</span><i data-lucide="arrow-right"></i><span class="position finish">${finishText(result)}</span></button>`; };
const icons = () => globalThis.lucide?.createIcons();
const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const minutes = (value) => { const [hour, minute] = value.split(':').map(Number); return hour * 60 + minute; };
const persist = () => { try { localStorage.setItem(STORE, JSON.stringify({ season: state.season, timezone: state.timezone, wake: state.wake, sleep: state.sleep, driver: state.driver })); } catch {} };
const format = (date, options) => new Intl.DateTimeFormat('en-US', { timeZone: state.timezone, ...options }).format(date);
const raceDate = (race) => new Date(`${race.date}T${race.time || '12:00:00Z'}`);
const timeText = (date) => format(date, { hour: 'numeric', minute: '2-digit', hour12: true });
const zoneText = (date) => format(date, { timeZoneName: 'short' }).split(', ').pop().split(' ').pop();
function localMinutes(date, timezone = state.timezone) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  return Number(parts.find((part) => part.type === 'hour').value) * 60 + Number(parts.find((part) => part.type === 'minute').value);
}
function isAwake(minute, wake = minutes(state.wake), sleep = minutes(state.sleep)) { return wake < sleep ? minute >= wake && minute < sleep : minute >= wake || minute < sleep; }
function friendliness(date, duration = 120, settings = state) {
  if (settings.wake === settings.sleep) return 'sleep';
  const wake = minutes(settings.wake), sleep = minutes(settings.sleep);
  let awake = 0;
  for (let offset = 0; offset < duration; offset++) if (isAwake(localMinutes(new Date(date.getTime() + offset * 60000), settings.timezone), wake, sleep)) awake++;
  return awake === duration ? 'easy' : awake > 0 ? 'stretch' : 'sleep';
}
const labels = { easy: 'Watch live', stretch: 'Sleep overlap', sleep: 'Sleep time' };
const badge = (kind) => `<span class="badge ${kind}"><i data-lucide="${kind === 'easy' ? 'sun' : kind === 'stretch' ? 'sunrise' : 'moon'}"></i>${labels[kind]}</span>`;
const flag = (country) => { const code = countries[country]; return code ? [...code].map((char) => String.fromCodePoint(127397 + char.charCodeAt())).join('') : '🏁'; };
const shortName = (race) => race.raceName.replace(' Grand Prix', '').replace('United States', 'United States').replace('São Paulo', 'São Paulo');
const track = (race, className) => `<svg class="${className}" viewBox="0 0 210 135" aria-label="${escapeHTML(race.Circuit.circuitName)} circuit illustration" role="img"><path d="${tracks[race.Circuit.circuitId] || tracks.default}"/>${className === 'hero-track' ? `<path class="track-highlight" d="${tracks[race.Circuit.circuitId] || tracks.default}"/>` : ''}</svg>`;
async function getData(path) {
  const response = await fetch(`${API}${path}${path.includes('?') ? '&' : '?'}limit=100`, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`F1 feed returned ${response.status}`);
  return (await response.json()).MRData;
}
function updateClock() {
  const now = new Date();
  $('#today').textContent = format(now, { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
  $('#clock').textContent = timeText(now);
  $('#clock-zone').textContent = `${state.timezone === 'America/Los_Angeles' ? 'PACIFIC TIME' : state.timezone.split('/').pop().replaceAll('_', ' ').toUpperCase()} / ${zoneText(now)}`;
}
function renderRhythm() {
  const awakeMinutes = (minutes(state.sleep) - minutes(state.wake) + 1440) % 1440;
  $('#awake-hours').textContent = `${+(awakeMinutes / 60).toFixed(1)}h`;
  $('#sleep-hours').textContent = `${+((1440 - awakeMinutes) / 60).toFixed(1)}h of rest`;
  $('#schedule-error').textContent = awakeMinutes === 0 ? 'Wake and wind-down times must be different.' : '';
  const center = 100, radius = 72, circumference = 2 * Math.PI * radius;
  let markup = `<circle cx="100" cy="100" r="72" fill="none" stroke="#dfe3d9" stroke-width="13"/><circle cx="100" cy="100" r="72" fill="none" stroke="#4b886d" stroke-width="13" stroke-dasharray="${circumference * awakeMinutes / 1440} ${circumference}" transform="rotate(${minutes(state.wake) / 4 - 90} 100 100)"/>`;
  for (let hour = 0; hour < 24; hour++) {
    const angle = hour / 12 * Math.PI - Math.PI / 2;
    markup += `<line x1="${center + Math.cos(angle) * 85}" y1="${center + Math.sin(angle) * 85}" x2="${center + Math.cos(angle) * (hour % 6 === 0 ? 91 : 88)}" y2="${center + Math.sin(angle) * (hour % 6 === 0 ? 91 : 88)}" stroke="#a6aea0" stroke-width="1"/>`;
  }
  for (const minute of [minutes(state.wake), minutes(state.sleep)]) { const angle = minute / 720 * Math.PI - Math.PI / 2; markup += `<circle cx="${center + Math.cos(angle) * radius}" cy="${center + Math.sin(angle) * radius}" r="6" fill="#fafaf8" stroke="#4b886d" stroke-width="2"/>`; }
  markup += '<g fill="#8a9185" font-family="IBM Plex Mono,monospace" font-size="9" text-anchor="middle"><text x="100" y="8">00</text><text x="193" y="104">06</text><text x="100" y="198">12</text><text x="7" y="104">18</text></g>';
  $('#sleep-dial').innerHTML = markup;
  $('#sleep-dial').setAttribute('aria-label', `Awake from ${state.wake} to ${state.sleep}, ${awakeMinutes / 60} hours`);
  updateClock();
}
function renderHero() {
  const next = state.races.find((race) => raceDate(race).getTime() + 120 * 60000 > Date.now());
  if (!next) { $('#next-race').innerHTML = `<div class="kicker">${state.season} SEASON</div><h2>That's a wrap.</h2><p>Explore the full season and your driver's results below.</p>`; return; }
  const date = raceDate(next), kind = next.time ? friendliness(date) : 'sleep';
  $('#next-race').innerHTML = `<div class="kicker"><span>UPCOMING GP</span><span>ROUND ${String(next.round).padStart(2, '0')}</span></div><h2>${escapeHTML(next.raceName)}</h2><div class="next-bottom"><div class="next-time"><span class="date">${format(date, { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}</span><strong>${next.time ? timeText(date) : 'Time TBC'}<small>${next.time ? zoneText(date) : ''}</small></strong></div><div class="next-recommend">${next.time ? badge(kind) : '<span class="badge sleep">Time not confirmed</span>'}</div></div>`;
}
function renderCalendar() {
  const upcoming = state.races.filter((race) => raceDate(race).getTime() + 120 * 60000 > Date.now());
  let visible = state.filter === 'all' ? state.races : upcoming;
  if (state.filter === 'friendly') visible = upcoming.filter((race) => race.time && friendliness(raceDate(race)) === 'easy');
  $('#race-count').textContent = `${visible.length} RACES`;
  $('#calendar-subtitle').textContent = state.filter === 'friendly' ? 'Your remaining races with no sleep-time overlap.' : state.filter === 'all' ? `${state.season} race weekends, in your local time.` : `${upcoming.length} weekends left. Find your next perfect Sunday.`;
  $('#race-grid').innerHTML = visible.length ? visible.map((race) => {
    const date = raceDate(race), kind = race.time ? friendliness(date) : 'sleep';
    return `<button class="race-card ${kind}" data-round="${race.round}" aria-label="${escapeHTML(race.raceName)}, ${race.time ? timeText(date) : 'time to be confirmed'}, ${labels[kind]}. View weekend sessions."><div class="card-top"><span>ROUND ${String(race.round).padStart(2, '0')}${date < new Date() ? ' · PAST' : ''}</span><span class="country-flag">${flag(race.Circuit.Location.country)}</span></div>${track(race, 'mini-track')}<h3>${escapeHTML(shortName(race))}</h3><div class="card-circuit">${escapeHTML(race.Circuit.circuitName)}</div><div class="card-date">${format(date, { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}</div><div class="card-time">${race.time ? timeText(date) : 'Time TBC'}<small>${race.time ? zoneText(date) : ''}</small></div><div class="card-bottom">${race.time ? badge(kind) : '<span class="badge sleep">Time not confirmed</span>'}<i data-lucide="arrow-up-right"></i></div></button>`;
  }).join('') : `<div class="empty">${state.filter === 'friendly' ? 'No remaining races fit your waking window. Try a different schedule or explore the full season.' : 'No upcoming races in this season. Explore the full season or choose another year.'}</div>`;
  const friendlyCount = state.races.filter((race) => race.time && friendliness(raceDate(race)) === 'easy').length;
  const currentRace = upcoming[0] || state.races.at(-1);
  const progressIndex = state.races.findIndex((race) => race.round === currentRace?.round);
  $('#season-blocks').style.setProperty('--race-count', state.races.length);
  $('#season-blocks').style.setProperty('--progress-index', Math.max(0, progressIndex));
  const raceCar = '<span class="season-current-car" aria-hidden="true"><svg viewBox="0 0 36 20"><g fill="#202025"><rect x="5" y="1" width="7" height="5" rx="1"/><rect x="5" y="14" width="7" height="5" rx="1"/><rect x="24" y="1" width="5" height="5" rx="1"/><rect x="24" y="14" width="5" height="5" rx="1"/></g><g fill="currentColor"><rect x="2" y="4" width="3" height="12" rx=".5"/><path d="M5 7L10 5H17L23 8H31V12H23L17 15H10L5 13Z"/><rect x="30" y="3" width="3" height="14" rx=".5"/></g><path d="M11 8H17L20 10L17 12H11Z" fill="#202025"/></svg></span>';
  $('#season-blocks').innerHTML = `${currentRace ? '<span class="season-progress-trail" aria-hidden="true"></span>' : ''}${state.races.map((race) => {
    const kind = race.time ? friendliness(raceDate(race)) : 'sleep';
    const isCurrent = race.round === currentRace?.round;
    const progressLabel = upcoming.length ? 'Current / next race' : 'Season complete';
    return `<button class="${kind}${isCurrent ? ' current' : ''}" data-round="${race.round}" ${isCurrent ? 'aria-current="step"' : ''} title="${isCurrent ? `${progressLabel} · ` : ''}Round ${race.round}: ${escapeHTML(race.raceName)} · ${labels[kind]}" aria-label="${isCurrent ? `${progressLabel}, ` : ''}Round ${race.round}, ${escapeHTML(race.raceName)}, ${labels[kind]}">${isCurrent ? raceCar : ''}</button>`;
  }).join('')}${state.races.length ? '<span class="season-finish-flag" role="img" aria-label="Season finish" title="Season finish"></span>' : ''}`;
  $('#friendly-total').textContent = `${friendlyCount} / ${state.races.length} WATCH LIVE`;
  icons();
}
function renderSchedule() { renderRhythm(); renderHero(); renderCalendar(); icons(); }
function standingRow(standing, type, leadingPoints) {
  const constructor = type === 'constructors' ? standing.Constructor : standing.Constructors?.[0];
  const name = type === 'constructors' ? constructor.name : `${standing.Driver.givenName} ${standing.Driver.familyName}`;
  const teamSlug = teams[constructor?.constructorId]?.[0] || (constructor?.constructorId === 'sauber' ? 'kicksauber' : '');
  const logoURL = teamSlug ? `https://media.formula1.com/image/upload/c_fit,w_64,h_64/q_auto/v1740000001/common/f1/${state.season}/${teamSlug}/${state.season}${teamSlug}logowhite.webp` : '';
  const teamName = constructor?.name || 'Formula 1';
  const initials = teamName.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase();
  const logo = `<span class="team-logo" title="${escapeHTML(teamName)}">${logoURL ? `<img src="${logoURL}" alt="${escapeHTML(teamName)} logo" width="18" height="18" decoding="async">` : ''}<span class="team-logo-initials" ${logoURL ? 'hidden' : ''}>${escapeHTML(initials)}</span></span>`;
  const favorite = type === 'drivers' && standing.Driver.driverId === state.driver;
  const percentage = leadingPoints > 0 ? Math.min(100, Number(standing.points) / leadingPoints * 100) : 0;
  return `<div class="standing-row${standing.position === '1' ? ' leader' : ''}${favorite ? ' followed' : ''}" style="--points-share:${percentage}%"><span class="standing-position">${String(standing.position).padStart(2, '0')}</span><span class="standing-name">${logo}<span class="standing-label">${escapeHTML(name)}</span>${favorite ? '<i data-lucide="heart" aria-label="Favorite driver"></i>' : ''}</span><strong class="standing-points">${escapeHTML(standing.points)}</strong></div>`;
}
function renderChampionships() {
  for (const [type, selector, standings] of [['constructors', '#constructor-standings', state.constructorStandings], ['drivers', '#championship-drivers', state.standings]]) {
    if (!standings.length) { $(selector).innerHTML = '<p class="standings-empty">Standings not available for this season.</p>'; continue; }
    const leadingPoints = Number(standings[0].points);
    $(selector).innerHTML = `<div class="standing-columns"><span>POSITION</span><span>PTS</span></div><div class="standing-scroll" role="region" tabindex="0" aria-label="${type === 'constructors' ? 'Constructors' : 'Drivers'} championship standings">${standings.map((standing) => standingRow(standing, type, leadingPoints)).join('')}</div><div class="standing-season">${state.season} WORLD CHAMPIONSHIP</div>`;
  }
  icons();
}
function showStandings(type) {
  const standings = type === 'constructors' ? state.constructorStandings : state.standings;
  $('#dialog-kicker').textContent = `${state.season} / WORLD CHAMPIONSHIP`;
  $('#dialog-title').textContent = type === 'constructors' ? "Constructors' standings" : "Drivers' standings";
  $('#dialog-content').innerHTML = standings.length ? `<div class="full-standings"><div class="standing-columns"><span>POSITION</span><span>PTS</span></div>${standings.map((standing) => standingRow(standing, type, Number(standings[0].points))).join('')}</div><p class="dialog-note">Published championship totals include sprint points.</p>` : '<div class="empty">Standings are not available for this season.</div>';
  $('#race-dialog').showModal(); icons();
}
function showRace(round) {
  const race = state.races.find((item) => item.round === round); if (!race) return;
  $('#dialog-kicker').textContent = `ROUND ${race.round} / ${state.season} · WEEKEND SCHEDULE`;
  $('#dialog-title').textContent = race.raceName;
  const sessions = [['FirstPractice', 'Practice 1', 60], ['SecondPractice', 'Practice 2', 60], ['ThirdPractice', 'Practice 3', 60], ['SprintQualifying', 'Sprint qualifying', 45], ['Sprint', 'Sprint', 30], ['Qualifying', 'Qualifying', 60], [null, 'Grand Prix', 120]];
  $('#dialog-content').innerHTML = `<p>${escapeHTML(race.Circuit.circuitName)} · ${escapeHTML(state.timezone.replaceAll('_', ' '))}</p>${sessions.map(([key, label, duration]) => { const session = key ? race[key] : race; if (!session) return ''; const date = raceDate(session); return `<div class="session-row"><div><strong>${label}</strong><small>${format(date, { weekday: 'short', month: 'short', day: 'numeric' })}</small></div><div><strong>${session.time ? `${timeText(date)} ${zoneText(date)}` : 'Time TBC'}</strong><small>${session.time ? labels[friendliness(date, duration)] : 'Not yet confirmed'}</small></div></div>`; }).join('')}<p class="dialog-note">Grand Prix window: approximately 2 hours. Delays and red flags can extend the race. Other sessions use their usual scheduled duration.</p>`;
  $('#race-dialog').showModal(); icons();
}
function renderDriver() {
  const standing = state.standings.find((item) => item.Driver.driverId === state.driver);
  const driver = standing?.Driver || state.results[0]?.Results[0]?.Driver;
  if (!driver) { $('#driver-profile').innerHTML = '<div class="empty">No driver data published for this season yet.</div>'; $('#driver-chart').innerHTML = ''; $('#driver-results').innerHTML = ''; return; }
  const constructorData = standing?.Constructors?.[0] || state.results.at(-1)?.Results[0]?.Constructor;
  const constructor = constructorData?.name || 'Formula 1';
  const [teamSlug, teamColor] = teams[constructorData?.constructorId] || ['', '#648661'];
  const wins = standing?.wins ?? state.results.filter((race) => race.Results[0].position === '1').length;
  const podiums = state.results.filter((race) => Number(race.Results[0].position) <= 3 && !['Disqualified', 'Did not start', 'Withdrawn'].includes(race.Results[0].status)).length;
  const driverCodes = { norris: 'lannor01', max_verstappen: 'maxver01', leclerc: 'chalec01', hamilton: 'lewham01', piastri: 'oscpia01', russell: 'georus01', alonso: 'feralo01', sainz: 'carsai01', antonelli: 'andant01', gasly: 'piegas01', albon: 'alealb01', bearman: 'olibea01', ocon: 'estoco01', stroll: 'lanstr01', lawson: 'lialaw01', hadjar: 'isahad01', hulkenberg: 'nichul01', bortoleto: 'gabbor01', colapinto: 'fracol01', bottas: 'valbot01', perez: 'serper01', lindblad: 'arvlin01' };
  const portrait = teamSlug && driverCodes[state.driver] ? `https://media.formula1.com/image/upload/c_fill,w_500/q_auto/v1740000001/common/f1/${state.season}/${teamSlug}/${driverCodes[state.driver]}/${state.season}${teamSlug}${driverCodes[state.driver]}right.webp` : '';
  $('#driver-profile').innerHTML = `<div class="driver-number">${escapeHTML(driver.permanentNumber || driver.code || '')}</div><div class="driver-team"><span class="legend-dot" style="background:${teamColor}"></span>${escapeHTML(constructor.toUpperCase())}</div>${portrait ? `<img class="driver-image" src="${portrait}" alt="${escapeHTML(driver.givenName)} ${escapeHTML(driver.familyName)}"/>` : ''}<h3>${escapeHTML(driver.givenName)}<br>${escapeHTML(driver.familyName)}</h3><div class="driver-nationality">${escapeHTML(driver.nationality.toUpperCase())} · ${state.season} SEASON</div><div class="driver-stats"><div><strong>${standing ? `P${standing.position}` : '—'}</strong><span>STANDING</span></div><div><strong>${standing?.points ?? '—'}</strong><span>POINTS</span></div><div><strong>${wins}</strong><span>WINS</span></div><div><strong>${podiums}</strong><span>PODIUMS</span></div></div>`;
  $('.driver-image')?.addEventListener('error', (event) => { event.target.hidden = true; });
  renderChart();
  $('#driver-results').innerHTML = state.results.length ? state.results.slice(-3).reverse().map(resultRow).join('') : '<div class="empty">No race results published yet.</div>';
  icons();
}
function renderChart() {
  if (!state.results.length) { $('#driver-chart').innerHTML = '<div class="empty">The season trajectory appears after the first published result.</div>'; return; }
  const results = state.results, width = 660, height = 145, left = 32, right = 15, top = 14, bottom = 27;
  const maximum = state.chart === 'position' ? 22 : Math.max(25, ...results.map((race) => Number(race.Results[0].points)));
  const x = (index) => left + index * (width - left - right) / Math.max(1, results.length - 1);
  const y = (value) => state.chart === 'position' ? top + (value - 1) / (maximum - 1) * (height - top - bottom) : height - bottom - value / maximum * (height - top - bottom);
  const values = results.map((race) => state.chart === 'position' && ['DNS', 'DSQ'].includes(finishText(race.Results[0])) ? null : Number(race.Results[0][state.chart === 'position' ? 'position' : 'points']));
  let markup = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${state.chart === 'position' ? 'Race finish positions' : 'Points earned per Grand Prix'}, ${state.season}">`;
  for (const value of state.chart === 'position' ? [1, 10, 20] : [0, 10, 25]) markup += `<line x1="${left}" y1="${y(value)}" x2="${width - right}" y2="${y(value)}" stroke="#dfe3d9" stroke-dasharray="3 4"/><text x="2" y="${y(value) + 3}">${state.chart === 'position' ? 'P' : ''}${value}</text>`;
  markup += `<path d="${values.map((value, index) => value === null ? '' : `${index === 0 || values[index - 1] === null ? 'M' : 'L'}${x(index)},${y(value)}`).join(' ')}" fill="none" stroke="#648661" stroke-width="2"/>`;
  results.forEach((race, index) => { const result = race.Results[0]; markup += values[index] === null ? `<text x="${x(index)}" y="${height - bottom - 2}" text-anchor="middle">${finishText(result)}</text>` : `<circle cx="${x(index)}" cy="${y(values[index])}" r="3.7" stroke="#f6f6f3" stroke-width="1.5" fill="${Number(result.position) <= 3 ? '#3d775a' : '#9da793'}"><title>${escapeHTML(race.raceName)}: ${finishText(result)}, ${result.points} points, ${escapeHTML(result.status)}</title></circle>`; markup += index % Math.max(1, Math.ceil(results.length / 10)) === 0 || index === results.length - 1 ? `<text x="${x(index)}" y="${height - 6}" text-anchor="middle">${countries[race.Circuit.Location.country] || race.round}</text>` : ''; });
  $('#driver-chart').innerHTML = `${markup}</svg>`;
}
async function loadDriver() {
  const token = ++state.driverToken, season = state.season, driver = state.driver;
  state.results = []; renderDriver();
  $('#driver-chart').innerHTML = '<div class="loading">Loading season trajectory...</div>';
  $('#driver-results').innerHTML = '';
  try {
    const data = await getData(`${season}/drivers/${encodeURIComponent(driver)}/results.json`);
    if (token !== state.driverToken || season !== state.season) return;
    state.results = data.RaceTable.Races;
    renderDriver();
  } catch {
    if (token !== state.driverToken) return;
    state.results = []; renderDriver();
    $('#driver-chart').innerHTML = '<div class="empty">Results feed unavailable. Please try again shortly.</div>';
  }
}
async function loadSeason() {
  const token = ++state.seasonToken, season = state.season;
  ++state.driverToken;
  state.races = []; state.standings = []; state.constructorStandings = []; state.results = [];
  $('#constructor-standings').innerHTML = '<div class="loading">Loading standings...</div>';
  $('#championship-drivers').innerHTML = '<div class="loading">Loading standings...</div>';
  $('#data-status').textContent = 'Connecting to Jolpica F1...';
  $('#race-grid').innerHTML = '<div class="loading">Loading the grid...</div>';
  $('#next-race').innerHTML = '<div class="loading">Finding your next lights out...</div>';
  $('#driver-profile').innerHTML = '<div class="loading">Loading your driver...</div>';
  $('#driver-chart').innerHTML = ''; $('#driver-results').innerHTML = '';
  try {
    const [calendar, standings, constructors] = await Promise.all([getData(`${season}.json`), getData(`${season}/driverStandings.json`).catch(() => null), getData(`${season}/constructorStandings.json`).catch(() => null)]);
    if (token !== state.seasonToken) return;
    state.races = calendar.RaceTable.Races;
    state.standings = standings?.StandingsTable.StandingsLists[0]?.DriverStandings || [];
    state.constructorStandings = constructors?.StandingsTable.StandingsLists[0]?.ConstructorStandings || [];
    let drivers = state.standings.map((item) => item.Driver);
    if (!drivers.length) { try { const data = await getData(`${season}/drivers.json`); drivers = data.DriverTable.Drivers; } catch {} }
    if (token !== state.seasonToken) return;
    if (drivers.length) {
      if (!drivers.some((driver) => driver.driverId === state.driver)) state.driver = drivers[0].driverId;
      $('#driver-select').innerHTML = drivers.map((driver) => `<option value="${escapeHTML(driver.driverId)}">${escapeHTML(driver.givenName)} ${escapeHTML(driver.familyName)}</option>`).join('');
      $('#driver-select').value = state.driver;
    }
    $('#data-status').textContent = `Jolpica F1 · Updated ${timeText(new Date())}`;
    renderSchedule(); renderChampionships(); persist(); await loadDriver();
  } catch {
    if (token !== state.seasonToken) return;
    $('#race-grid').innerHTML = '<div class="empty">The F1 feed is taking a pit stop. <button class="refresh-button" id="retry">Try again</button></div>';
    $('#next-race').innerHTML = '<div class="kicker">CALENDAR UNAVAILABLE</div><h2>A brief pit stop.</h2><p>Reconnect to load confirmed race times.</p>';
    $('#data-status').textContent = 'Jolpica F1 · Connection unavailable';
    $('#driver-profile').innerHTML = '<div class="empty">Driver data unavailable while the feed is disconnected.</div>';
    renderChampionships();
    $('#retry').addEventListener('click', loadSeason);
  }
}
async function showProgress(round) {
  const race = state.results.find((item) => item.round === round); if (!race) return;
  const season = state.season, driver = state.driver, result = race.Results[0];
  $('#dialog-kicker').textContent = `${result.Driver.givenName.toUpperCase()} ${result.Driver.familyName.toUpperCase()} / ${season}`;
  $('#dialog-title').textContent = race.raceName;
  $('#dialog-content').innerHTML = `<p>Grid ${result.grid === '0' ? 'pit lane' : `P${result.grid}`} → ${finishText(result)} · ${result.points} points · ${escapeHTML(result.status)}</p><div class="loading">Loading lap-by-lap race progress...</div>`;
  $('#race-dialog').showModal();
  try {
    let laps = [], offset = 0, total = 0;
    do {
      const data = await getData(`${season}/${round}/drivers/${encodeURIComponent(driver)}/laps.json?offset=${offset}`);
      total = Number(data.total); const batch = data.RaceTable.Races[0]?.Laps || [];
      laps = laps.concat(batch); offset += Number(data.limit);
      if (!batch.length) break;
    } while (offset < total);
    if (!$('#race-dialog').open || $('#dialog-title').textContent !== race.raceName || state.driver !== driver || state.season !== season) return;
    if (!laps.length) { $('#dialog-content .loading').textContent = 'Lap-by-lap data has not been published for this race.'; return; }
    const positions = laps.map((lap) => ({ lap: Number(lap.number), position: Number(lap.Timings[0].position) }));
    const x = (lap) => 30 + (lap - 1) / Math.max(1, positions.at(-1).lap - 1) * 425;
    const y = (position) => 15 + (position - 1) / 21 * 165;
    $('#dialog-content .loading').outerHTML = `<svg class="lap-chart" viewBox="0 0 480 210" role="img" aria-label="Driver position after each published lap">${[1, 10, 20].map((position) => `<line x1="30" y1="${y(position)}" x2="455" y2="${y(position)}" stroke="#d9ded3"/><text x="0" y="${y(position) + 4}">P${position}</text>`).join('')}<polyline points="${positions.map((item) => `${x(item.lap)},${y(item.position)}`).join(' ')}" fill="none" stroke="#4b886d" stroke-width="2.5"/><text x="30" y="205">LAP 1</text><text x="405" y="205">LAP ${positions.at(-1).lap}</text></svg><p class="dialog-note">Position at the end of each lap. ${positions.length} published laps. This is a race replay, not a live feed.</p>`;
  } catch { if ($('#race-dialog').open) $('#dialog-content .loading')?.replaceChildren(document.createTextNode('Lap data is currently unavailable. Try this result again shortly.')); }
}
const zones = [...new Set([...Object.keys(timezoneNames), ...(Intl.supportedValuesOf?.('timeZone') || [])])];
if (!zones.includes(state.timezone)) state.timezone = 'America/Los_Angeles';
const timezoneLabel = (zone) => timezoneNames[zone] || zone.replaceAll('_', ' ');
const commonZones = ['America/Los_Angeles', 'America/New_York', 'America/Chicago', 'Europe/London', 'Europe/Paris', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney'];
const timezoneAliases = { 'America/Los_Angeles': 'pst pdt california san francisco seattle', 'America/New_York': 'est edt', 'America/Chicago': 'cst cdt', 'America/Denver': 'mst mdt', 'Europe/London': 'gmt bst', 'Europe/Paris': 'cet cest', 'Asia/Kolkata': 'ist mumbai delhi', 'Asia/Tokyo': 'jst', 'Australia/Sydney': 'aest aedt', UTC: 'utc gmt universal' };
let timezoneMatches = [], activeTimezoneIndex = -1;
function renderTimezoneOptions(query = '') {
  const terms = query.trim().toLowerCase().replace(/[_/·]+/g, ' ').split(/\s+/).filter(Boolean);
  const matches = terms.length ? zones.filter((zone) => { const searchable = `${timezoneLabel(zone)} ${zone} ${timezoneAliases[zone] || ''}`.toLowerCase().replace(/[_/·]+/g, ' '); return terms.every((term) => searchable.includes(term)); }) : [...new Set([state.timezone, ...commonZones])].slice(0, 8);
  timezoneMatches = matches.slice(0, 12);
  activeTimezoneIndex = -1;
  $('#timezone').removeAttribute('aria-activedescendant');
  $('#timezone-options').innerHTML = timezoneMatches.map((zone, index) => `<li id="timezone-option-${index}" role="option" aria-selected="${zone === state.timezone}" data-zone="${escapeHTML(zone)}"><span>${escapeHTML(timezoneLabel(zone))}</span><small>${escapeHTML(zone)}</small>${zone === state.timezone ? '<i data-lucide="check"></i>' : ''}</li>`).join('');
  $('#timezone-search-status').textContent = !matches.length ? 'No matching timezones' : terms.length ? `${timezoneMatches.length} of ${matches.length} matches` : 'Common timezones';
  icons();
}
function closeTimezonePicker() {
  $('#timezone-menu').hidden = true;
  $('#timezone').setAttribute('aria-expanded', 'false');
  $('#timezone').removeAttribute('aria-activedescendant');
  $('#timezone').value = timezoneLabel(state.timezone);
}
function chooseTimezone(zone) {
  if (!zones.includes(zone)) return;
  state.timezone = zone;
  closeTimezonePicker(); persist(); renderSchedule();
}
$('#timezone').value = timezoneLabel(state.timezone); $('#season').value = state.season;
$('#timezone').addEventListener('focus', () => { $('#timezone-menu').hidden = false; $('#timezone').setAttribute('aria-expanded', 'true'); $('#timezone').select(); renderTimezoneOptions(); });
$('#timezone').addEventListener('input', (event) => { $('#timezone-menu').hidden = false; $('#timezone').setAttribute('aria-expanded', 'true'); renderTimezoneOptions(event.target.value); });
$('#timezone').addEventListener('keydown', (event) => {
  if (event.key === 'Escape' || event.key === 'Tab') { closeTimezonePicker(); return; }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    if ($('#timezone-menu').hidden) { $('#timezone-menu').hidden = false; $('#timezone').setAttribute('aria-expanded', 'true'); renderTimezoneOptions(); }
    if (!timezoneMatches.length) return;
    activeTimezoneIndex = event.key === 'ArrowDown' ? (activeTimezoneIndex + 1) % timezoneMatches.length : activeTimezoneIndex <= 0 ? timezoneMatches.length - 1 : activeTimezoneIndex - 1;
    document.querySelectorAll('#timezone-options [role="option"]').forEach((option, index) => option.classList.toggle('highlighted', index === activeTimezoneIndex));
    const option = $(`#timezone-option-${activeTimezoneIndex}`);
    $('#timezone').setAttribute('aria-activedescendant', option.id);
    option.scrollIntoView({ block: 'nearest' });
  }
  if (event.key === 'Enter' && !$('#timezone-menu').hidden) {
    event.preventDefault();
    if (activeTimezoneIndex >= 0) chooseTimezone(timezoneMatches[activeTimezoneIndex]);
    else if (timezoneMatches.length === 1) chooseTimezone(timezoneMatches[0]);
  }
});
$('#timezone').addEventListener('blur', closeTimezonePicker);
$('#timezone-options').addEventListener('pointerdown', (event) => { if (event.target.closest('[data-zone]')) event.preventDefault(); });
$('#timezone-options').addEventListener('click', (event) => { const option = event.target.closest('[data-zone]'); if (option) chooseTimezone(option.dataset.zone); });
$('.timezone-field').addEventListener('click', () => { if ($('#timezone-menu').hidden) { $('#timezone').focus(); $('#timezone-menu').hidden = false; $('#timezone').setAttribute('aria-expanded', 'true'); $('#timezone').select(); renderTimezoneOptions(); } });
for (const name of ['wake', 'sleep']) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(state[name])) state[name] = name === 'wake' ? '10:00' : '01:00';
  $(`#${name}`).value = state[name];
  $(`#${name}`).addEventListener('input', (event) => { if (!event.target.value) return; state[name] = event.target.value; persist(); renderSchedule(); });
}
$('#season').addEventListener('change', (event) => { state.season = event.target.value; persist(); loadSeason(); });
$('#driver-select').addEventListener('change', (event) => { state.driver = event.target.value; persist(); renderChampionships(); loadDriver(); });
document.querySelectorAll('[data-standings]').forEach((button) => button.addEventListener('click', () => showStandings(button.dataset.standings)));
document.addEventListener('error', (event) => {
  if (event.target.matches?.('.team-logo img')) { event.target.hidden = true; event.target.nextElementSibling.hidden = false; }
}, true);
$('#all-results').addEventListener('click', () => {
  $('#dialog-kicker').textContent = `DRIVER RESULTS / ${state.season}`;
  $('#dialog-title').textContent = $('#driver-select').selectedOptions[0]?.textContent || 'Season results';
  $('#dialog-content').innerHTML = `<p class="dialog-note">Grand Prix results · Race points exclude sprint points</p>${state.results.length ? state.results.slice().reverse().map(resultRow).join('') : '<div class="empty">No published results available.</div>'}`;
  $('#race-dialog').showModal(); icons();
});
document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => { state.filter = button.dataset.filter; document.querySelectorAll('[data-filter]').forEach((item) => { item.classList.toggle('selected', item === button); item.setAttribute('aria-pressed', String(item === button)); }); renderCalendar(); }));
document.querySelectorAll('[data-chart]').forEach((button) => button.addEventListener('click', () => { state.chart = button.dataset.chart; document.querySelectorAll('[data-chart]').forEach((item) => { item.classList.toggle('selected', item === button); item.setAttribute('aria-pressed', String(item === button)); }); renderChart(); }));
document.addEventListener('click', (event) => { const round = event.target.closest('[data-round]'); if (round) showRace(round.dataset.round); const result = event.target.closest('[data-result]'); if (result) showProgress(result.dataset.result); });
$('#close-dialog').addEventListener('click', () => $('#race-dialog').close());
$('#race-dialog').addEventListener('click', (event) => { if (event.target === $('#race-dialog')) { const bounds = $('#race-dialog').getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) $('#race-dialog').close(); } });
document.querySelectorAll('nav a').forEach((link) => link.addEventListener('click', () => { document.querySelectorAll('nav a').forEach((item) => item.classList.toggle('active', item === link)); }));
globalThis.apexTest = { friendliness, localMinutes, isAwake };
renderRhythm(); icons(); loadSeason(); setInterval(updateClock, 1000);