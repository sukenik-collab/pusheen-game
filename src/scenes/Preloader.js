import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    create ()
    {
        this.scene.start('LivingRoom');
        this.scene.launch('UI');
    }
}
