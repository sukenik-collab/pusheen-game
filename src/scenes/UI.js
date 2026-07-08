import { Scene, Input } from 'phaser';

const BUTTON_ALPHA = 0.35;
const BUTTON_RADIUS = 36;
const MARGIN = 24;

const PANEL_WIDTH = 520;
const PANEL_HEIGHT = 260;
const PANEL_COLOR = 0x3e2c23;
const PANEL_ALPHA = 0.94;
const PANEL_OPEN_MS = 220;
const PANEL_CLOSE_MS = 180;

const ITEM_SIZE = 90;
const ITEM_SPACING = 160;
const NOPE_SHAKE_PX = 8;
const NOPE_SHAKE_MS = 55;

const ITEMS = [
    { key: 'socks', label: 'Socks', color: 0xe3e0d8, isSnack: false },
    { key: 'tshirt', label: 'T-Shirt', color: 0x6fa8dc, isSnack: false },
    { key: 'popcorn', label: 'Popcorn', color: 0xf6c453, isSnack: true }
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

        this.registry.set('input:left', false);
        this.registry.set('input:right', false);
        this.registry.set('input:jump', false);

        const buttonY = height - BUTTON_RADIUS - MARGIN;
        this.addHoldButton(BUTTON_RADIUS + MARGIN, buttonY, '<', 'input:left');
        this.addHoldButton(BUTTON_RADIUS * 3 + MARGIN, buttonY, '>', 'input:right');
        this.addHoldButton(width - BUTTON_RADIUS - MARGIN, buttonY, '^', 'input:jump');

        this.interactButton = this.addPressButton(width / 2, buttonY, 'E', 'input:interactPressed');
        this.setInteractButtonVisible(false);

        this.counterText = this.add.text(20, 20, 'Snack: 0/1', {
            fontSize: '22px',
            color: '#3e2c23'
        });

        this.createPeekPanel();
        this.createNapCard();
        this.numberKeys = this.input.keyboard.addKeys('ONE,TWO,THREE');

        this.registry.events.on('changedata-cabinet:inInnerZone', (parent, value) => {
            this.setInteractButtonVisible(value && !this.registry.get('snack:collected'));
        });

        this.registry.events.on('changedata-cabinet:peekOpen', (parent, value) => {
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

    addHoldButton (x, y, label, registryKey)
    {
        const circle = this.add.circle(x, y, BUTTON_RADIUS, 0x000000, BUTTON_ALPHA)
            .setInteractive();
        this.add.text(x, y, label, { fontSize: '28px', color: '#ffffff' })
            .setOrigin(0.5);

        circle.on('pointerdown', () => this.registry.set(registryKey, true));
        circle.on('pointerup', () => this.registry.set(registryKey, false));
        circle.on('pointerout', () => this.registry.set(registryKey, false));
    }

    addPressButton (x, y, label, registryKey)
    {
        const circle = this.add.circle(x, y, BUTTON_RADIUS, 0x000000, BUTTON_ALPHA)
            .setInteractive();
        const text = this.add.text(x, y, label, { fontSize: '24px', color: '#ffffff' })
            .setOrigin(0.5);

        circle.on('pointerdown', () => this.registry.set(registryKey, true));

        return { circle, text };
    }

    setInteractButtonVisible (visible)
    {
        this.interactButton.circle.setVisible(visible);
        this.interactButton.text.setVisible(visible);
    }

    createPeekPanel ()
    {
        const { width, height } = this.scale;

        this.peekPanel = this.add.container(width / 2, height / 2)
            .setVisible(false)
            .setScale(0.8)
            .setAlpha(0);

        this.peekPanel.add(this.add.rectangle(0, 0, PANEL_WIDTH, PANEL_HEIGHT, PANEL_COLOR, PANEL_ALPHA));

        const startX = -ITEM_SPACING;
        this.itemBoxes = [];

        ITEMS.forEach((item, i) => {
            const itemX = startX + i * ITEM_SPACING;
            const box = this.add.rectangle(itemX, -10, ITEM_SIZE, ITEM_SIZE, item.color)
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
            this.registry.set('snack:collected', true);
            this.registry.set('snack:count', 1);
            this.setInteractButtonVisible(false);
            this.registry.set('cabinet:peekOpen', false);
        } else {
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
        this.napCard.setVisible(true);
        this.tweens.add({ targets: this.napCard, alpha: 1, duration: CARD_FADE_MS, ease: 'Sine.easeOut' });
    }

    hideNapCard ()
    {
        this.napCard.setVisible(false).setAlpha(0);
    }

    showPlayAgainButton ()
    {
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
        this.playAgainBg.setVisible(false).setAlpha(0);
        this.playAgainText.setVisible(false).setAlpha(0);
    }
}
