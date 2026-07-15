# Cosmic Calibration WebXR

## Codex Project Brief

**Working title:** Cosmic Calibration WebXR

**Project type:** WebXR / mixed-reality astronomy and perceptual-orientation application

**Initial target device:** Meta Quest 3 using Quest Browser

**Initial deployment:** Free static hosting through GitHub Pages

**Primary implementation stack:** Vite, TypeScript, Three.js, WebXR, Astronomy Engine
**Current phase:** Pre-build architecture and prototype definition

---

# 1. Project Purpose

Cosmic Calibration is a real-time mixed-reality experience designed to help a person experientially perceive their actual position within Earth, the solar system, and larger celestial reference frames.

The application is not primarily a star map. Existing astronomy applications answer questions such as:

- What object is that?
- Where is a planet in the sky?
- What constellation is visible?

Cosmic Calibration instead asks:

- Where am I within Earth’s geometry?
- Which direction is Earth’s center?
- Where is Earth’s rotational axis?
- How is my location moving as Earth rotates?
- Where is Earth in relation to the Sun?
- What direction is Earth traveling in its orbit?
- How do the other planets, orbital planes, celestial poles, and ecliptic relate to my present body and location?

The core goal is to transform astronomy from an external map into an embodied navigation system for the cosmos.

The user should begin from an ordinary human first-person perspective and gradually experience themselves as standing on a tilted, rotating spherical planet orbiting the Sun alongside other planets.

---

# 2. Core Experience

The application runs in WebXR passthrough so the user remains visibly present in their actual room or environment.

Using the current:

- latitude,
- longitude,
- time,
- date,
- floor plane,
- gravity-aligned vertical,
- and calibrated true-north heading,

it draws real-time spatial reference geometry into the user’s physical environment.

Initial overlays include:

- Earth-center / nadir direction
- zenith direction
- local horizon plane
- north, south, east, and west
- Earth’s rotational axis
- north celestial pole
- south celestial pole
- celestial equator
- ecliptic
- Sun
- Moon
- visible planets
- apparent paths of Sun, Moon, and planets
- sunrise direction
- sunset direction
- solar noon marker
- local midnight marker
- Earth rotation direction
- current Earth orbital direction
- orbital rings for the planets

The system should update in real time as the user moves their head and as astronomical time changes.

---

# 3. Deeper Design Intent

The experience is intended as a perceptual calibration system.

Humans ordinarily experience:

- the ground as flat,
- themselves as stationary,
- the sky as moving above them,
- and celestial bodies as distant external objects.

Cosmic Calibration supplies the missing spatial reference structures needed to perceive:

- the ground as a tangent plane on a sphere,
- local “down” as a radial line toward Earth’s center,
- Earth’s rotation as the cause of much apparent sky motion,
- sunrise and sunset as rotational events,
- seasons as geometry involving axial tilt and illumination,
- Earth as one moving node inside a larger orbital system.

The project may support a shift from egocentric spatial awareness toward allocentric awareness.

In the contemplative layer, the user may experience the boundaries of self as more relational, distributed, or inclusive of celestial bodies as nodes in a larger field of awareness.

This project is informed by mystical, merkaba, sacred-geometry, and initiatory traditions, but the software must preserve a clean distinction between:

## Scientific layer

- measurable astronomy
- geometry
- coordinate systems
- time
- direction
- orbital motion
- observer-relative position

## Contemplative layer

- expanded spatial identity
- allocentric awareness
- connectedness
- oneness
- symbolic meaning
- sacred geometry
- contemplative interpretation

The application must never present contemplative or metaphysical interpretations as established scientific facts.

---

# 4. Design Philosophy

The application should reveal rather than preach.

It should not tell users what to believe.

It should create conditions where users can discover through direct experience that their ordinary sense of location and scale is incomplete.

Deeper insight should emerge progressively through interaction and observation.

Recommended experiential progression:

1. Orientation
2. Local vertical and Earth-center awareness
3. Horizon and cardinal directions
4. Earth rotation
5. Sun and day/night geometry
6. Moon relationship
7. Ecliptic and planetary paths
8. Earth orbit
9. Planetary system
10. Distributed awareness
11. Symbolic synthesis
12. Return to ordinary passthrough with retained reference anchors

The experience should preserve dignity, ambiguity, and interpretive freedom.

A user may understand it as:

- astronomy,
- education,
- meditation,
- sacred geometry,
- perceptual training,
- contemplative technology,
- or simply awe.

---

# 5. Initial Build Goal

Build a Quest 3 WebXR passthrough proof of concept that demonstrates correctly calibrated real-time celestial geometry in the user’s physical room.

The proof succeeds if a user can:

1. Open the application in Quest Browser.
2. Grant location permission or enter location manually.
3. Enter WebXR passthrough.
4. Stand on a known floor marker.
5. Point a controller toward a pre-marked true-north reference point.
6. Confirm north calibration.
7. See the Earth-center axis, local horizon, cardinal directions, Earth axis, celestial equator, ecliptic, Sun, Moon, and planets placed correctly around them.
8. Accelerate time and watch these reference points and paths move coherently.

---

# 6. Calibration Model

## 6.1 Floor origin

The user creates a physical standing marker on the floor.

This establishes a repeatable observer position.

The user stands on this marker before beginning calibration.

## 6.2 Gravity and Earth-center direction

WebXR `local-floor` reference space provides a gravity-aligned floor coordinate system.

Use the WebXR vertical axis as:

- +Y = local zenith / away from Earth’s center
- -Y = local nadir / approximately toward Earth’s center

This does not require manual calibration.

## 6.3 North reference

The user creates a second physical marker positioned north of the standing point.

The marker may be placed using:

- a phone compass,
- a physical compass,
- surveyed room orientation,
- a known landmark bearing,
- or another trusted method.

During setup:

1. User stands on the origin marker.
2. User points a Quest controller at the north marker.
3. User presses the calibration trigger.
4. The application stores the yaw offset between WebXR room coordinates and geographic north.

## 6.4 Magnetic versus true north

A standard compass usually indicates magnetic north.

The application must support:

- marker already aligned to true north,
- marker aligned to magnetic north,
- automatic magnetic declination correction based on date and location,
- manual heading offset correction.

For the first prototype, allow the user to specify whether the north marker is magnetic or true north.

## 6.5 Persistence

Store locally:

- latitude
- longitude
- elevation if available
- north calibration yaw offset
- magnetic/true north mode
- floor setup identifier
- last successful calibration time

Use browser local storage initially.

Do not assume room persistence is perfect. Include a visible recalibration command.

---

# 7. Existing Work to Reuse

Do not create a new astronomy engine.

## 7.1 Astronomy Engine

Use the JavaScript/TypeScript Astronomy Engine library for:

- Sun position
- Moon position
- planetary positions
- heliocentric vectors
- geocentric vectors
- observer-relative altitude and azimuth
- rise and set times
- conjunctions
- oppositions
- equinoxes
- solstices
- coordinate transformations

Preferred because:

- browser compatible
- TypeScript friendly
- permissive MIT license
- suitable for static hosting

## 7.2 Three.js

Use Three.js for:

- 3D scene graph
- lines and rings
- celestial markers
- labels
- WebXR integration
- controller raycasting
- time-based animation

## 7.3 WebXR

Use WebXR immersive AR / mixed-reality features for:

- Quest passthrough
- headset tracking
- controller tracking
- floor-aligned reference space
- spatial interaction

Feature-detect all WebXR capabilities.

Provide a desktop simulation fallback for development.

## 7.4 Reference projects

Study but do not immediately fork:

- Stellarium Web Engine for sky rendering and observer-view conventions
- Celestia for heliocentric navigation, scale transitions, and orbit visualization
- consumer AR sky-map apps for interaction patterns

Be cautious of GPL and AGPL licensing.

Do not incorporate copyleft code without a deliberate licensing decision.

---

# 8. Technical Architecture

```text
Astronomy Engine
    |
    | astronomical positions, times, vectors
    v
Cosmic Reference-Frame Engine
    |
    | transforms between coordinate systems
    v
Three.js Scene Layer
    |
    | spatial lines, rings, markers, labels
    v
WebXR Calibration Layer
    |
    | floor, north offset, controllers, passthrough
    v
Experience Layer
    |
    | progressive revelation, time controls, HUD
```

## Required coordinate frames

The application should explicitly model:

1. Heliocentric ecliptic coordinates
2. Geocentric equatorial coordinates
3. Earth-fixed coordinates
4. Observer-local horizontal coordinates
5. WebXR room coordinates
6. Optional compressed teaching-scale coordinates

Create a dedicated reference-frame transformation module.

Do not mix visual display scale with scientific coordinates.

All scientific calculations should remain in real units or clearly defined normalized units before display transforms are applied.

---

# 9. Initial Visual Elements

## 9.1 Local orientation

- standing-point marker
- horizon circle
- zenith line
- nadir / Earth-center line
- north arrow
- south arrow
- east marker
- west marker

## 9.2 Earth geometry

- Earth rotation axis
- north celestial pole
- south celestial pole
- celestial equator
- local meridian
- optional translucent Earth sphere beneath user

## 9.3 Solar geometry

- Sun marker
- Sun direction ray
- sunrise azimuth marker
- sunset azimuth marker
- solar noon direction
- local midnight direction
- day/night terminator visualization in later phase

## 9.4 Lunar geometry

- Moon marker
- Moon path
- phase indicator
- moonrise and moonset markers later

## 9.5 Planetary geometry

- Mercury through Neptune
- optional Pluto
- apparent ecliptic paths
- heliocentric orbital rings
- current planet positions
- future/past path arcs

## 9.6 Time

- real-time mode
- pause
- reverse
- accelerated time
- return to now

Suggested multipliers:

- 1x
- 60x
- 600x
- 3600x
- 1 day/second
- 1 month/second

---

# 10. Visual Language

The application should feel spacious, precise, calm, and luminous.

Avoid:

- crowded planetarium UI
- excessive text
- game-like clutter
- constant notifications
- visual noise
- unmarked scale distortion

Prefer:

- thin luminous arcs
- restrained labels
- gaze or controller-triggered details
- progressive layer revelation
- subtle animation
- strong depth cues
- smooth opacity transitions

Scientific geometry should appear first.

Sacred or merkaba-like geometry should emerge later from actual axes, planes, and relationships rather than being placed as arbitrary decoration.

The visual synthesis should feel discovered.

---

# 11. HUD Principles

Use spatial geometry first and text second.

A celestial object label may reveal:

- name
- altitude
- azimuth
- distance
- rise time
- set time
- transit time
- constellation
- current alignment

Only show detailed text when:

- user points at the object,
- user gazes at it,
- user selects it,
- or a guided sequence calls attention to it.

The HUD should orient rather than dominate.

---

# 12. Progressive Experience Modes

## Mode 1: Calibration

- confirm location
- confirm time
- enter passthrough
- establish floor
- point toward north marker
- save calibration

## Mode 2: Local body and Earth

- horizon
- zenith
- nadir
- Earth-center line
- radial standing relationship

## Mode 3: Rotation

- Earth axis
- celestial poles
- celestial equator
- direction of rotation
- observer’s circular motion around Earth axis

## Mode 4: Sun

- Sun position
- line to Sun
- sunrise
- sunset
- noon
- midnight
- optional terminator

## Mode 5: Moon and planets

- Moon position and path
- planetary positions
- ecliptic
- planetary apparent paths

## Mode 6: Heliocentric expansion

- Earth orbit
- current orbital position
- orbital velocity direction
- axial tilt
- planetary orbital rings

## Mode 7: Contemplative synthesis

- reduce text
- preserve key geometry
- use sound and pacing later
- allow distributed attention across multiple celestial nodes

## Mode 8: Return

- return to ordinary passthrough
- retain subtle celestial anchors
- avoid forcing interpretation

---

# 13. MVP Scope

## Must have

- Vite + TypeScript project
- Three.js scene
- Quest Browser compatible WebXR entry
- passthrough / immersive AR request
- desktop fallback scene
- geolocation with manual fallback
- time and date handling
- floor-aligned coordinate system
- north calibration by controller ray
- calibration persistence
- horizon ring
- zenith and nadir line
- cardinal directions
- Earth rotational axis
- celestial poles
- celestial equator
- ecliptic
- Sun
- Moon
- planets
- real-time updates
- time acceleration
- GitHub Pages deployment workflow
- README and Quest testing instructions

## Nice to have for MVP

- magnetic declination correction
- translucent Earth sphere
- planet selection
- simple object labels
- calibration diagnostics
- screenshot/debug mode

## Explicitly deferred

- full star catalog
- constellations
- zodiac boundaries
- cultural observances
- sound design
- hand tracking
- persistent spatial anchors
- multi-room calibration
- user accounts
- analytics
- social/multi-user mode
- therapeutic or consciousness claims
- full merkaba visualization
- 360-video backgrounds
- advanced galactic frame

---

# 14. Suggested Repository Structure

```text
cosmic-calibration-webxr/
├── public/
│   ├── icons/
│   ├── textures/
│   └── data/
├── src/
│   ├── astronomy/
│   │   ├── astronomyService.ts
│   │   ├── observer.ts
│   │   ├── celestialBodies.ts
│   │   └── events.ts
│   ├── coordinates/
│   │   ├── frames.ts
│   │   ├── transforms.ts
│   │   ├── horizontalToXR.ts
│   │   └── displayScaling.ts
│   ├── calibration/
│   │   ├── calibrationState.ts
│   │   ├── northCalibration.ts
│   │   ├── floorOrigin.ts
│   │   ├── declination.ts
│   │   └── persistence.ts
│   ├── xr/
│   │   ├── xrSession.ts
│   │   ├── controllers.ts
│   │   ├── passthrough.ts
│   │   └── featureDetection.ts
│   ├── visualization/
│   │   ├── horizon.ts
│   │   ├── cardinalDirections.ts
│   │   ├── earthAxis.ts
│   │   ├── celestialEquator.ts
│   │   ├── ecliptic.ts
│   │   ├── bodies.ts
│   │   ├── paths.ts
│   │   ├── labels.ts
│   │   └── earthSphere.ts
│   ├── experience/
│   │   ├── modeController.ts
│   │   ├── timeline.ts
│   │   └── progressiveReveal.ts
│   ├── ui/
│   │   ├── setupPanel.ts
│   │   ├── timeControls.ts
│   │   ├── objectInfo.ts
│   │   └── diagnostics.ts
│   ├── app.ts
│   ├── main.ts
│   └── styles.css
├── tests/
│   ├── coordinateTransforms.test.ts
│   ├── northCalibration.test.ts
│   └── astronomyValidation.test.ts
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CALIBRATION.md
│   ├── QUEST_TESTING.md
│   ├── SCIENTIFIC_ASSUMPTIONS.md
│   └── EXPERIENCE_DESIGN.md
├── .github/workflows/deploy-pages.yml
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
└── LICENSE
```

---

# 15. Development Milestones

## Milestone 0: Technical spike

Goal: verify Quest Browser can enter WebXR passthrough from a static HTTPS site.

Deliverables:

- minimal Vite project
- Three.js scene
- Enter AR button
- visible reference cube or axis
- Quest Browser test instructions
- GitHub Pages deployment

Success condition:

- user sees passthrough and a stable virtual object in the room

## Milestone 1: Calibration proof

Deliverables:

- local-floor reference space
- standing-point concept
- controller ray
- north-marker calibration
- saved yaw offset
- horizon and cardinal directions
- zenith and nadir line

Success condition:

- virtual north aligns with physical north marker after calibration

## Milestone 2: Celestial reference frame

Deliverables:

- geolocation
- current time
- Astronomy Engine integration
- Sun
- Moon
- planets
- celestial poles
- celestial equator
- ecliptic

Success condition:

- object directions match an external trusted astronomy application

## Milestone 3: Time navigation

Deliverables:

- pause
- speed up
- reverse
- return to now
- path trails
- sunrise and sunset markers
- noon and midnight indicators

Success condition:

- celestial objects move coherently as time changes

## Milestone 4: Earth and orbital awareness

Deliverables:

- translucent Earth beneath observer
- Earth rotation direction
- observer rotational path
- Earth orbital direction
- heliocentric mode
- planetary orbit rings

Success condition:

- user can move between local and heliocentric views without losing orientation

## Milestone 5: Experiential alpha

Deliverables:

- progressive reveal sequence
- restrained HUD
- object focus interaction
- visual polish
- performance optimization
- public demo URL

Success condition:

- another user can complete the experience without developer assistance

---

# 16. Testing Requirements

## Desktop tests

- coordinate transforms
- time controls
- observer location changes
- north offset changes
- rendering without XR

## Quest tests

- passthrough availability
- floor alignment
- controller ray accuracy
- north calibration repeatability
- label readability
- frame rate
- drift
- recenter behavior
- session restart behavior
- local storage persistence

## Astronomy validation

Compare results against at least one trusted external source:

- Stellarium
- JPL Horizons
- another reputable astronomy application

Validate:

- Sun altitude and azimuth
- Moon altitude and azimuth
- planetary directions
- celestial pole direction
- ecliptic orientation
- sunrise and sunset azimuths

Record acceptable tolerances.

---

# 17. Performance Constraints

Target smooth Quest 3 operation.

Guidelines:

- prefer line geometry and procedural rings
- avoid high-poly meshes
- minimize transparent overdraw
- limit label count
- use instancing where useful
- avoid loading large star catalogs in MVP
- update astronomical positions at a controlled rate rather than every render frame
- interpolate visual movement between calculation updates
- keep render loop separate from astronomy calculation loop

Suggested update rates:

- head/controller tracking: XR frame rate
- scene animation: XR frame rate
- astronomy calculations in real-time mode: 1–5 updates per second
- accelerated time mode: configurable based on speed

---

# 18. Safety and Integrity

The application should not claim to:

- induce enlightenment
- prove metaphysical oneness
- alter biology in a guaranteed way
- treat medical or psychological conditions
- reveal hidden objective truths unavailable to others

It may state that the experience is designed to support:

- spatial orientation
- astronomical understanding
- awe
- contemplative attention
- shifts in perspective
- allocentric awareness
- felt connectedness

Include comfort controls and a clear exit/recenter option.

Avoid intense flashing, forced disorientation, or uncontrolled camera movement.

The user should remain in control of scale transitions and time acceleration.

---

# 19. Codex Implementation Instructions

Codex should work incrementally.

Do not attempt the complete project in one uncontrolled pass.

For every milestone:

1. Inspect the existing repository.
2. Read all project documentation.
3. State the intended change.
4. Make the smallest coherent implementation.
5. Run tests and build.
6. Record what changed.
7. Update README and project state.
8. Do not silently replace architecture decisions.
9. Flag uncertain Quest/WebXR capability assumptions.
10. Preserve a working desktop fallback.

Prioritize:

1. correctness
2. calibration reliability
3. scientific traceability
4. Quest performance
5. visual coherence
6. progressive experiential design

Do not prioritize feature count over stability.

---

# 20. First Codex Task

## Recommended effort level

Use the highest available Codex reasoning/effort level for the initial architecture and WebXR technical spike.

## Task

Create Milestone 0 of Cosmic Calibration WebXR.

Requirements:

1. Create a Vite + TypeScript project using Three.js.
2. Add WebXR support.
3. Add an Enter AR / mixed-reality button.
4. Request an immersive AR session with a floor-aligned reference space where supported.
5. Render a simple stable test scene containing:
   - origin marker
   - X/Y/Z axes
   - horizon ring
   - vertical zenith/nadir line
6. Add a desktop fallback using mouse orbit controls.
7. Add WebXR feature detection and a readable compatibility message.
8. Configure GitHub Pages deployment.
9. Add documentation for:
   - local setup
   - local development
   - production build
   - GitHub Pages deployment
   - opening the site in Quest Browser
   - entering passthrough
   - known browser limitations
10. Add a project-state document listing completed, open, and blocked work.
11. Run the build and resolve all TypeScript errors.
12. Do not yet integrate Astronomy Engine.
13. Do not yet implement north calibration.
14. Keep architecture ready for later astronomy and calibration modules.

Expected deliverables:

- working repository
- passing production build
- GitHub Pages workflow
- README
- docs/ARCHITECTURE.md
- docs/QUEST_TESTING.md
- PROJECT_STATE.md

Success condition:

The deployed site opens in Quest Browser, enters passthrough WebXR where supported, and displays a stable floor-relative reference frame.

---

# 21. Immediate Follow-Up Task After Milestone 0

Implement Milestone 1 north calibration.

The user stands on a physical floor marker and points a controller toward a physical north marker.

The application captures the controller ray projected onto the horizontal plane and stores the yaw rotation required to align that direction with geographic north.

Then render:

- N
- S
- E
- W
- horizon circle
- north-south line
- east-west line
- zenith
- nadir

Include recalibration and reset controls.

---

# 22. Long-Term Vision

The mature system may include:

- full real-time celestial navigation HUD
- planetary orbital rings
- star and constellation layers
- zodiac systems
- galactic orientation
- cultural and historical observances
- conjunction and alignment detection
- guided contemplative sequences
- spatial audio
- breath pacing
- persistent room calibration
- hand tracking
- multiple scale modes
- true-scale and teaching-scale comparison
- 360-video environments
- outdoor use
- shared multi-user experiences

The long-term objective is a new category of application:

> A scientifically grounded cosmic navigation and perceptual-calibration system that helps a person experience their local body, Earth, Sun, Moon, planets, and celestial reference frames as one coherent spatial reality.
