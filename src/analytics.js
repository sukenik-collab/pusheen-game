// Cookieless usage counts via GoatCounter (the one planned exception to "no
// server calls"; see CLAUDE.md). Answers a handful of questions -- do people
// start, where does the quest stall, do they finish, do they play again --
// and nothing else. No ids, no personal data.
//
// Only live on the real site, so dev and deploy previews don't pollute the
// numbers. Every call is safe if the script is blocked or never loads.

const SITE_URL = 'https://pusheen-game.goatcounter.com/count';
const PRODUCTION_HOST = 'pusheen-game.netlify.app';

// Elapsed-play pings, in minutes (GoatCounter has no durations).
const PLAYED_MILESTONES = [3, 10];

// Run-state flips worth counting: [registry key, value that counts, event].
const REGISTRY_EVENTS = [
    ['glass:taken', true, 'glass'],
    ['held:item', 'juice', 'filled'],
    ['juice:delivered', true, 'sloth-woke'],
    ['snack:collected', true, 'snack'],
    ['quest:complete', true, 'yarn-found'],
    ['nap:active', true, 'napped'],
    ['game:restartRequested', true, 'play-again']
];

// First arrival in a room, by scene key.
const ROOM_EVENTS = { Kitchen: 'kitchen', LivingRoom: 'livingroom', Bedroom: 'bedroom' };

// Once per page load, except play-again which is the signal worth repeating.
const REPEATABLE = new Set(['play-again']);
const sent = new Set();

const isProduction = () => location.hostname === PRODUCTION_HOST;

export function track (name)
{
    if (!isProduction()) return;
    if (!REPEATABLE.has(name)) {
        if (sent.has(name)) return;
        sent.add(name);
    }
    try {
        window.goatcounter?.count({ path: name, title: name, event: true });
    } catch (e) {
        // Analytics must never touch the game.
    }
}

export function initAnalytics (game)
{
    if (!isProduction()) return;

    const script = document.createElement('script');
    script.async = true;
    script.dataset.goatcounter = SITE_URL;
    script.src = '//gc.zgo.at/count.js';
    document.head.appendChild(script);

    REGISTRY_EVENTS.forEach(([key, value, event]) => {
        game.registry.events.on(`changedata-${key}`, (parent, v) => {
            if (v === value) track(event);
        });
    });

    Object.entries(ROOM_EVENTS).forEach(([sceneKey, event]) => {
        game.scene.getScene(sceneKey)?.events.on('create', () => track(event));
    });

    PLAYED_MILESTONES.forEach((minutes) => {
        setTimeout(() => track(`played-${minutes}min`), minutes * 60 * 1000);
    });
}
