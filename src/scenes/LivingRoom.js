import { Scene } from 'phaser';

export class LivingRoom extends Scene
{
    constructor ()
    {
        super('LivingRoom');
    }

    create ()
    {
        this.add.image(640, 384, 'background');
        this.add.image(640, 350, 'logo').setDepth(100);
        this.add.text(640, 490, 'Make something fun!\nand share it with us:\nsupport@phaser.io', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);
    }
}
