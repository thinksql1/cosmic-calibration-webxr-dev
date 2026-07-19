# Binocular Presentation Modes

## Physical evidence

The user physically tested the published Milestone 2C build on Quest and reported:

- the celestial equator is good and workable;
- the Earth axis is one clean line when either eye is viewed independently;
- the celestial equator is one clean line when either eye is viewed independently; and
- both layers appear doubled only during binocular viewing.

This is a **CONDITIONAL PASS** for the celestial equator. It is evidence of a binocular-fusion or
stereo-presentation concern, not evidence of duplicated scene geometry in either eye. The exact
perceptual cause is not established by the report.

## Contract

Axis/poles, celestial equator, and local horizon each own an independent presentation mode:

- `both`: render in both XR eyes;
- `left`: render only in the XR view whose `XRView.eye` is `left`;
- `right`: render only in the XR view whose `XRView.eye` is `right`.

The mode affects visibility only. It cannot change a scientific snapshot, P03 direction,
Earth-core position, equator sample, local-horizon sample, calibration yaw, or revision.

## XR binding

Each animation frame reads the active `XRViewerPose.views`. The browser-provided `XRView.eye`
identity decides whether a view is included. Its view index is used only to select the matching
Three.js XR subcamera layer channel. Reversing the order of left/right views therefore does not
reverse the requested physical eye.

The feature creates no per-eye scene copy or geometry. Persistent objects receive a layer mask;
the existing axis/equator camera-relative math still runs only for the camera that actually draws
the object. `eye: none` is treated explicitly as monoscopic and is rendered for all modes.
If an immersive frame supplies no viewer pose/view identity, the filtered layers are suppressed
rather than guessed from stale view order or camera position.

## Desktop fallback

Desktop/non-XR rendering always uses the ordinary mono layer. `left` and `right` selections remain
visible so geometry and controls can be tested without a headset. Diagnostics retain the selected
XR mode and label the active behavior as a desktop/mono fallback.

## Interpretation and limitations

These modes are experimental presentation/accessibility tools for diagnosis or relief of reported
doubling. They are reversible and default to `both`. Assigning the axis to one eye and the equator
to the other is supported, but may create binocular rivalry and is not claimed to be more
comfortable. Mode-specific physical Quest validation remains required.
The later Milestone 2D physical report accepts the overall deployed spatial-reference experience
as compelling and workable, but does not provide individual `both`/`left`/`right` mode outcomes.
Those mode-specific observations remain unmeasured; see
[Milestone 2D Physical Acceptance](MILESTONE_2D_PHYSICAL_ACCEPTANCE.md).
