// The first-impression splash: title, "fan project" disclaimer and how to
// play. A DOM overlay above the canvas (it needs no art and reads on any
// screen), shown once the game has loaded and reopened by the UI's "?" chip.
// Dismissed by any key, a tap, or its button. While it's up the game's keyboard
// is off, so the key that closes it doesn't also walk the cat.

import { track } from './analytics.js';

const TITLE = "Pusheen's Lazy Afternoon";
const DISCLAIMER = "An unofficial, non-commercial fan project. Pusheen and friends belong to Pusheen Corp.; this game isn't affiliated with or endorsed by them.";

// Keys come back on after the dismissing keypress is over, so a held arrow
// doesn't start her walking the instant the splash closes.
const KEYBOARD_RESUME_MS = 150;

// The tap that opens it (the "?" chip) must not also count as a tap to close it.
const CLICK_GRACE_MS = 300;

const HOW_TO_PLAY = [
    ['Move', 'Arrow keys or A / D', 'On-screen < and > buttons'],
    ['Jump', 'Space, W or Up', 'The ^ button'],
    ['Talk, open, take', 'E', 'The E button'],
    ['Pick an item', '1 – 4', 'Tap it']
];

let overlay = null;

function el (tag, className, text)
{
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
}

function buildHowToPlay ()
{
    const table = el('table', 'splash-controls');
    const head = table.createTHead().insertRow();
    ['', 'Keyboard', 'Touch'].forEach((label) => head.appendChild(el('th', '', label)));
    const body = table.createTBody();
    HOW_TO_PLAY.forEach((row) => {
        const tr = body.insertRow();
        row.forEach((cell, i) => tr.appendChild(el(i === 0 ? 'th' : 'td', '', cell)));
        tr.firstChild.scope = 'row';
    });
    return table;
}

export function showSplash (game)
{
    if (overlay) return;

    const keyboard = game.input.keyboard;
    overlay = el('div', 'splash');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'splash-title');

    const card = el('div', 'splash-card');
    const title = el('h1', '', TITLE);
    title.id = 'splash-title';
    const button = el('button', 'splash-button', 'Play');
    button.type = 'button';
    card.append(
        title,
        el('p', 'splash-lead', 'A small, cozy fan game. Potter around the house; there is nothing to fail and no hurry.'),
        buildHowToPlay(),
        el('p', 'splash-rotate', 'Best played with your device turned sideways.'),
        el('p', 'splash-fine', DISCLAIMER),
        button
    );
    overlay.appendChild(card);
    document.getElementById('app').appendChild(overlay);

    keyboard.enabled = false;
    button.focus();
    const openedAt = performance.now();

    const dismiss = () => {
        document.removeEventListener('keydown', onKey, true);
        overlay.remove();
        overlay = null;
        track('start');
        setTimeout(() => { keyboard.enabled = true; }, KEYBOARD_RESUME_MS);
    };
    // Any key closes it, apart from modifiers and Tab (which just moves focus).
    const onKey = (event) => {
        if (['Shift', 'Control', 'Alt', 'Meta', 'Tab'].includes(event.key)) return;
        event.preventDefault();
        dismiss();
    };
    document.addEventListener('keydown', onKey, true);
    overlay.addEventListener('click', () => {
        if (performance.now() - openedAt > CLICK_GRACE_MS) dismiss();
    });
}
