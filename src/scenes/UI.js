import { Scene, Input } from 'phaser';

const BUTTON_ALPHA = 0.35;
const BUTTON_RADIUS = 36;
const MARGIN = 24;

const PANEL_OPEN_MS = 220;
const PANEL_CLOSE_MS = 180;

const ITEM_SIZE = 90;
const ITEM_SPACING = 160;
const NOPE_SHAKE_PX = 8;
const NOPE_SHAKE_MS = 55;

const ITEMS = [
    { key: 'socks', label: 'Socks', sprite: 'itemSocks', isSnack: false },
    { key: 'tshirt', label: 'T-Shirt', sprite: 'itemShirt', isSnack: false },
    { key: 'popcorn', label: 'Popcorn', sprite: 'itemPopcorn', isSnack: true }
];

const CARD_FADE_MS = 500;
const PLAY_AGAIN_FADE_MS = 400;
const PLAY_AGAIN_WIDTH = 260;
const PLAY_AGAIN_HEIGHT = 56;
const PLAY_AGAIN_Y_OFFSET = 90;

export class UI extends Scene
{
    constructor ()
    {
        super('UI');
    }

    create ()
    {
        const { width, height } = this.scale;

        this.audio = this.registry.get('audio');

        this.registry.set('input:left', false);
        this.registry.set('input:right', false);
        this.registry.set('input:jump', false);

        const buttonY = height - BUTTON_RADIUS - MARGIN;
        this.addHoldButton(BUTTON_RADIUS + MARGIN, buttonY, '<', 'input:left');
        this.addHoldButton(BUTTON_RADIUS * 3 + MARGIN, buttonY, '>', 'input:right');
        this.addHoldButton(width - BUTTON_RADIUS - MARGIN, buttonY, '^', 'input:jump');

        this.interactButton = this.addPressButton(width / 2, buttonY, 'E', 'input:interactPressed');
        this.updateInteractButtonVisibility();

        this.counterText = this.add.text(20, 20, 'Snack: 0/1', {
            fontSize: '22px',
            color: '#3e2c23'
        });

        this.createPeekPanel();
        this.createNapCard();
        this.createAudioMenu();
        this.numberKeys = this.input.keyboard.addKeys('ONE,TWO,THREE');

        // The E button is needed both to open the panel (in range) and to
        // close it again (cancel) -- gating visibility on inInnerZone alone
        // let it hide itself out from under a touch player mid-cancel if
        // residual momentum carried her out of range while the panel was
        // still open, so both signals feed the same recompute.
        this.registry.events.on('changedata-cabinet:inInnerZone', () => {
            this.updateInteractButtonVisibility();
        });

        this.registry.events.on('changedata-cabinet:peekOpen', (parent, value) => {
            this.updateInteractButtonVisibility();

            if (value) {
                this.openPeekPanel();
            } else {
                this.closePeekPanel();
            }
        });

        this.registry.events.on('changedata-snack:count', (parent, value) => {
            this.counterText.setText(`Snack: ${value}/1`);
        });

        this.registry.events.on('changedata-nap:showCard', (parent, value) => {
            if (value) {
                this.showNapCard();
            } else {
                this.hideNapCard();
            }
        });

        this.registry.events.on('changedata-nap:showPlayAgain', (parent, value) => {
            if (value) {
                this.showPlayAgainButton();
            } else {
                this.hidePlayAgainButton();
            }
        });
    }

    update ()
    {
        if (!this.peekPanel.visible) {
            return;
        }

        if (Input.Keyboard.JustDown(this.numberKeys.ONE)) this.selectItemByIndex(0);
        if (Input.Keyboard.JustDown(this.numberKeys.TWO)) this.selectItemByIndex(1);
        if (Input.Keyboard.JustDown(this.numberKeys.THREE)) this.selectItemByIndex(2);
    }

    createButtonVisual (x, y, label)
    {
        const circle = this.add.circle(x, y, BUTTON_RADIUS, 0x000000, BUTTON_ALPHA)
            .setInteractive();
        const text = this.add.text(x, y, label, { fontSize: '28px', color: '#ffffff' })
            .setOrigin(0.5);

        return { circle, text };
    }

    addHoldButton (x, y, label, registryKey)
    {
        const { circle } = this.createButtonVisual(x, y, label);

        circle.on('pointerdown', () => this.registry.set(registryKey, true));
        circle.on('pointerup', () => this.registry.set(registryKey, false));
        circle.on('pointerout', () => this.registry.set(registryKey, false));
    }

    addPressButton (x, y, label, registryKey)
    {
        const button = this.createButtonVisual(x, y, label);
        button.circle.on('pointerdown', () => this.registry.set(registryKey, true));

        return button;
    }

    setInteractButtonVisible (visible)
    {
        this.interactButton.circle.setVisible(visible);
        this.interactButton.text.setVisible(visible);
    }

    updateInteractButtonVisibility ()
    {
        const inRange = this.registry.get('cabinet:inInnerZone') || this.registry.get('cabinet:peekOpen');
        this.setInteractButtonVisible(inRange && !this.registry.get('snack:collected'));
    }

    createPeekPanel ()
    {
        const { width, height } = this.scale;

        this.peekPanel = this.add.container(width / 2, height / 2)
            .setVisible(false)
            .setScale(0.8)
            .setAlpha(0);

        this.peekPanel.add(this.add.image(0, 0, 'drawer'));

        const startX = -ITEM_SPACING;
        this.itemBoxes = [];

        ITEMS.forEach((item, i) => {
            const itemX = startX + i * ITEM_SPACING;
            const box = this.add.image(itemX, -10, item.sprite)
                .setInteractive();
            const label = this.add.text(itemX, 55, item.label, { fontSize: '18px', color: '#ffffff' })
                .setOrigin(0.5);
            const numberHint = this.add.text(itemX - ITEM_SIZE / 2 + 4, -10 - ITEM_SIZE / 2 + 4, String(i + 1), {
                fontSize: '14px',
                color: '#ffffff',
                backgroundColor: '#00000066'
            }).setOrigin(0, 0);

            this.peekPanel.add(box);
            this.peekPanel.add(label);
            this.peekPanel.add(numberHint);

            box.on('pointerdown', () => this.selectItem(item, box));
            this.itemBoxes.push({ item, box });
        });
    }

    selectItemByIndex (index)
    {
        const entry = this.itemBoxes[index];

        if (entry) {
            this.selectItem(entry.item, entry.box);
        }
    }

    selectItem (item, box)
    {
        if (item.isSnack) {
            this.audio?.play('collect');
            // Order matters: snack:collected must already be true before
            // cabinet:peekOpen flips false, since that triggers
            // updateInteractButtonVisibility() which reads it.
            this.registry.set('snack:collected', true);
            this.registry.set('snack:count', 1);
            this.registry.set('cabinet:peekOpen', false);
        } else {
            this.audio?.play('nope');
            this.playNopeShake(box);
        }
    }

    playNopeShake (box)
    {
        const originalX = box.x;

        this.tweens.add({
            targets: box,
            x: originalX + NOPE_SHAKE_PX,
            duration: NOPE_SHAKE_MS,
            yoyo: true,
            repeat: 3,
            ease: 'Sine.easeInOut',
            onComplete: () => { box.x = originalX; }
        });
    }

    openPeekPanel ()
    {
        this.audio?.play('peek');
        this.peekPanel.setVisible(true);
        this.tweens.add({
            targets: this.peekPanel,
            scale: 1,
            alpha: 1,
            duration: PANEL_OPEN_MS,
            ease: 'Back.easeOut'
        });
    }

    // Purely the visual reaction to cabinet:peekOpen going false -- the
    // registry is already the source of truth by the time this runs
    // (LivingRoom on cancel, or selectItem() above on collecting the snack),
    // so this doesn't set it again.
    closePeekPanel ()
    {
        this.tweens.add({
            targets: this.peekPanel,
            scale: 0.8,
            alpha: 0,
            duration: PANEL_CLOSE_MS,
            ease: 'Quad.easeIn',
            onComplete: () => this.peekPanel.setVisible(false)
        });
    }

    createNapCard ()
    {
        const { width, height } = this.scale;

        this.napCard = this.add.text(width / 2, height / 2, 'So Cozy!', {
            fontSize: '48px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#3e2c23',
            strokeThickness: 6
        }).setOrigin(0.5).setAlpha(0).setVisible(false);

        this.playAgainBg = this.add.rectangle(width / 2, height / 2 + PLAY_AGAIN_Y_OFFSET, PLAY_AGAIN_WIDTH, PLAY_AGAIN_HEIGHT, 0x3e2c23, 0.9)
            .setInteractive()
            .setAlpha(0)
            .setVisible(false);
        this.playAgainText = this.add.text(width / 2, height / 2 + PLAY_AGAIN_Y_OFFSET, 'Play again! (Space)', {
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5).setAlpha(0).setVisible(false);

        this.playAgainBg.on('pointerdown', () => this.registry.set('game:restartRequested', true));
    }

    showNapCard ()
    {
        this.tweens.killTweensOf(this.napCard);
        this.napCard.setVisible(true);
        this.tweens.add({ targets: this.napCard, alpha: 1, duration: CARD_FADE_MS, ease: 'Sine.easeOut' });
    }

    // Symmetric with showNapCard rather than an instant snap, same as the
    // peek panel's open/close -- this fires every time Play Again resets
    // the scene, not just at some rare edge, so it's worth being consistent.
    hideNapCard ()
    {
        this.tweens.killTweensOf(this.napCard);
        this.tweens.add({
            targets: this.napCard,
            alpha: 0,
            duration: CARD_FADE_MS,
            ease: 'Sine.easeIn',
            onComplete: () => this.napCard.setVisible(false)
        });
    }

    showPlayAgainButton ()
    {
        this.tweens.killTweensOf([this.playAgainBg, this.playAgainText]);
        this.playAgainBg.setVisible(true);
        this.playAgainText.setVisible(true);

        this.tweens.add({
            targets: [this.playAgainBg, this.playAgainText],
            alpha: 1,
            duration: PLAY_AGAIN_FADE_MS,
            ease: 'Sine.easeOut'
        });
    }

    hidePlayAgainButton ()
    {
        this.tweens.killTweensOf([this.playAgainBg, this.playAgainText]);
        this.tweens.add({
            targets: [this.playAgainBg, this.playAgainText],
            alpha: 0,
            duration: PLAY_AGAIN_FADE_MS,
            ease: 'Sine.easeIn',
            onComplete: () => {
                this.playAgainBg.setVisible(false);
                this.playAgainText.setVisible(false);
            }
        });
    }

    // Part B: an unobtrusive in-game picker, top-right, collapsed to a single
    // "♪" chip so it never clutters the cozy screen. Tap to reveal three rows:
    // cycle music track, cycle SFX set, mute. Selection lives on the audio
    // controller (registry), so it persists across Play again but not reload.
    createAudioMenu ()
    {
        if (!this.audio) {
            return;
        }

        const { width } = this.scale;
        const ROW_W = 210;
        const ROW_H = 38;
        const GAP = 8;
        const right = width - 20;
        const rowX = right - ROW_W;
        let y = 20 + 40 + GAP;

        this.audioMenuOpen = false;
        this.audioPanelParts = [];

        this.musicRow = this.addMenuButton(rowX, y, ROW_W, ROW_H, `♪ ${this.audio.currentTrack.name}`, () => {
            const track = this.audio.cycleTrack();
            this.musicRow.text.setText(`♪ ${track.name}`);
        });
        y += ROW_H + GAP;

        this.sfxRow = this.addMenuButton(rowX, y, ROW_W, ROW_H, `SFX: ${this.audio.currentSet.name}`, () => {
            const set = this.audio.cycleSfxSet();
            this.sfxRow.text.setText(`SFX: ${set.name}`);
            this.audio.play('collect'); // audition the new set
        });
        y += ROW_H + GAP;

        this.muteRow = this.addMenuButton(rowX, y, ROW_W, ROW_H, 'Sound: On', () => {
            const muted = this.audio.toggleMute();
            this.muteRow.text.setText(muted ? 'Sound: Off' : 'Sound: On');
        });

        this.setAudioMenuVisible(false);

        // The always-visible toggle chip.
        const toggleBg = this.add.rectangle(right, 20, 44, 40, 0x3e2c23, 0.6).setOrigin(1, 0).setInteractive();
        this.add.text(right - 22, 40, '♪', { fontSize: '22px', color: '#ffffff' }).setOrigin(0.5);
        toggleBg.on('pointerdown', () => this.setAudioMenuVisible(!this.audioMenuOpen));
    }

    addMenuButton (x, y, w, h, label, onClick)
    {
        const bg = this.add.rectangle(x, y, w, h, 0x3e2c23, 0.72).setOrigin(0, 0).setInteractive();
        const text = this.add.text(x + 12, y + h / 2, label, { fontSize: '16px', color: '#ffffff' }).setOrigin(0, 0.5);
        bg.on('pointerdown', onClick);

        this.audioPanelParts.push(bg, text);
        return { bg, text };
    }

    setAudioMenuVisible (visible)
    {
        this.audioMenuOpen = visible;
        this.audioPanelParts.forEach((part) => part.setVisible(visible));
    }
}
