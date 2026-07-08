import { Scene } from 'phaser';

const BUTTON_ALPHA = 0.35;
const BUTTON_RADIUS = 36;
const MARGIN = 24;

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
        this.addTouchButton(BUTTON_RADIUS + MARGIN, buttonY, '<', 'input:left');
        this.addTouchButton(BUTTON_RADIUS * 3 + MARGIN, buttonY, '>', 'input:right');
        this.addTouchButton(width - BUTTON_RADIUS - MARGIN, buttonY, '^', 'input:jump');
    }

    addTouchButton (x, y, label, registryKey)
    {
        const circle = this.add.circle(x, y, BUTTON_RADIUS, 0x000000, BUTTON_ALPHA)
            .setInteractive();
        this.add.text(x, y, label, { fontSize: '28px', color: '#ffffff' })
            .setOrigin(0.5);

        circle.on('pointerdown', () => this.registry.set(registryKey, true));
        circle.on('pointerup', () => this.registry.set(registryKey, false));
        circle.on('pointerout', () => this.registry.set(registryKey, false));
    }
}
