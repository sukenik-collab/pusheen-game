// Builds a room's passive furniture from a data LAYOUT: draws each item and
// gives solid/standable roles a static body. Returns the solids array so the
// scene can wire its own colliders. Genuinely bespoke bodies (e.g. the bed's
// inset mattress) and render-ordering nuances (e.g. yarn drawn behind the
// couch) stay in the scene's create() -- this handles the common case only,
// deliberately, so don't try to purify those escape hatches into the data.
//
// Item shape:
//   { name, role, sprite?|color?, x, w, h, yFromGround?, oneWay? }
// Roles:
//   background -- drawn only, no physics body
//   solid      -- static body, blocks from all sides
//   standable  -- static body meant to be hopped onto (pair with oneWay)
// `yFromGround` = center height above the floor top; omitted = sits on it.
// `sprite` art is sized to match w/h exactly, so the static body a sprite
// gets from its image bounds equals the declared footprint.
export function buildLayout (scene, layout, groundTop)
{
    const solids = [];

    layout.forEach((item) => {
        const y = groundTop - (item.yFromGround ?? item.h / 2);
        const obj = item.sprite
            ? scene.add.image(item.x, y, item.sprite)
            : scene.add.rectangle(item.x, y, item.w, item.h, item.color);

        if (item.role === 'solid' || item.role === 'standable') {
            scene.physics.add.existing(obj, true);

            if (item.oneWay) {
                // Land on the top face only -- she can jump up through it
                // instead of bonking the underside.
                obj.body.checkCollision.down = false;
                obj.body.checkCollision.left = false;
                obj.body.checkCollision.right = false;
            }

            solids.push(obj);
        }
    });

    return solids;
}
