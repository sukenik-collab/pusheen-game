// The Interactable contract -- documentation only, no runtime code.
//
// Every entity registered with an InteractionController meets this shape. It's
// a plain contract, not a base class: the interactive entities are independent
// GameObjects.Container subclasses (Cabinet/Container, Stormy, YarnBall,
// CostumeBox) that each already implement ~all of it, so a shared superclass
// would buy nothing but coupling.
//
//   outerZone, innerZone : Phaser.Geom.Circle
//       Concentric sensor zones. Outer must be strictly larger -- the outer
//       zone fires the lead cue, the inner one enables the action.
//   inOuterZone, inInnerZone : boolean
//       Recomputed each frame in update(). inInnerZone MAY bake in physical
//       readiness (YarnBall ANDs pusheen.isGrounded() so a jump apex can't
//       grab the costume-gated shelf ball from below).
//   update(pusheen)
//       Recompute the zones; fire the lead cue once per outer-zone entry.
//   verb : 'talk' | 'peek' | 'take'
//       Advisory metadata for now (not yet branched on).
//   isActionable(scene) -> boolean            (optional; treated as true if absent)
//       Semantic gate: is the verb valid right now? (e.g. the cabinet only
//       while the snack is unfound.) Distinct from inInnerZone's physical gate.
//   interact(pusheen, scene)
//       Perform the verb.
export {};
