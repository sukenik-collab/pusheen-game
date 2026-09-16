import { GameObjects, Geom } from 'phaser';
import { YARN_RADAR, YARN_POP, SNIFF_CUE } from '../config/feel.js';

const CUE_COLOR = '#ffd8ec';

// A hidden quest item, tucked behind furniture. Same concentric sensor-zone
// pattern as the cabinet's snack radar: the outer zone fires a cue that
// leads the player, the inner zone enables the pickup.
export class YarnBall extends GameObjects.Container
{
    constructor (scene, x, y, id)
    {
        super(scene, x, y);
        scene.add.existing(this);

        this.id = id;
        this.audio = scene.registry.get('audio');
        this.verb = 'take';

        this.visual = scene.add.image(0, 0, 'yarnBall');
        this.add(this.visual);

        this.outerZone = new Geom.Circle(x, y, YARN_RADAR.sniffRadius);
        this.innerZone = new Geom.Circle(x, y, YARN_RADAR.interactRadius);

        this.inOuterZone = false;
        this.inInnerZone = false;
        this.collected = false;
    }

    update (pusheen)
    {
        if (this.collected) {
            return;
        }

        const nowOuter = Geom.Circle.Contains(this.outerZone, pusheen.x, pusheen.y);

        // Pickup wants her feet planted -- standing on the floor beside a
        // tucked ball, or up on the shelf. Never snatched at a jump apex:
        // the generous interact radius otherwise lets a normal hop grab the
        // shelf ball from directly below, defeating its costume gate.
        this.inInnerZone = pusheen.isGrounded() &&
            Geom.Circle.Contains(this.innerZone, pusheen.x, pusheen.y);

        if (nowOuter && !this.inOuterZone) {
            this.playSniffCue(pusheen);
        }

        this.inOuterZone = nowOuter;
    }

    // Contract hooks for the InteractionController. inInnerZone already bakes
    // in the grounded check; this is the semantic gate (a collected ball is
    // inert, though it also stops reporting inInnerZone once collected).
    isActionable ()
    {
        return !this.collected;
    }

    interact ()
    {
        this.collect();
    }

    playSniffCue (pusheen)
    {
        this.audio?.play('sniff');
        pusheen.playSniffReact();

        for (let i = 0; i < SNIFF_CUE.noteCount; i++) {
            this.scene.time.delayedCall(i * SNIFF_CUE.staggerMs, () => this.spawnSparkle());
        }
    }

    spawnSparkle ()
    {
        // Same staggered-cue race as HeldPickup: a pending sparkle can fire
        // after she's collected this and it has destroyed itself.
        if (this.collected) {
            return;
        }

        const sparkle = this.scene.add.text(this.x, this.y - 20, '✦', {
            fontSize: '26px',
            color: CUE_COLOR
        }).setOrigin(0.5);

        this.scene.tweens.add({
            targets: sparkle,
            y: sparkle.y - SNIFF_CUE.risePx,
            alpha: 0,
            duration: SNIFF_CUE.ms,
            ease: 'Quad.easeOut',
            onComplete: () => sparkle.destroy()
        });
    }

    collect ()
    {
        if (this.collected) {
            return;
        }

        this.collected = true;
        this.inInnerZone = false;
        this.scene.interactions?.unregister(this);
        this.audio?.play('collect');

        const registry = this.scene.registry;
        registry.set(`yarn:collected:${this.id}`, true);
        registry.set('yarn:count', registry.get('yarn:count') + 1);

        // Pop up out of its hiding spot and fade -- found, not vacuumed up.
        this.scene.tweens.add({
            targets: this,
            y: this.y - YARN_POP.risePx,
            scaleX: 1.3,
            scaleY: 1.3,
            alpha: 0,
            duration: YARN_POP.ms,
            ease: 'Quad.easeOut',
            onComplete: () => this.destroy()
        });
    }
}
