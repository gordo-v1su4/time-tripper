Please review this project in entirity to understand our similar video integration framework at:
https://github.com/gordo-v1su4/swappy

Also download any vscode extensions to assist.

Here are the two meticulously detailed checklists: one for the engineering implementation and one for the UI/UX design, both tailored for an agentic development environment.

---
---

# Web TimeShaper - Engineering Development Checklist (v2)

This document outlines the detailed engineering tasks required to build the **Web TimeShaper** application, integrating audio-driven video synchronization inspired by the "swappy" repository logic. The target stack is **SvelteKit v5 (Runes)**, **Konva.js**, **Web Audio API** (`AudioWorklet`), **WebCodecs**, **FFmpeg.wasm**, and **Tailwind CSS**.

### **Phase 1: Project Foundation & Core Engines**

*   [ ] **1. Development Environment & Project Initialization:**
    *   [ ] 1.1. **Install Core Toolchain:**
        *   [ ] Install Node.js (v18+ recommended) and pnpm.
        *   [ ] Verify installations with `node --version` and `pnpm --version`.
    *   [ ] 1.2. **Initialize SvelteKit 5 Project:**
        *   [ ] Run `pnpm create svelte@latest web-timeshaper`.
        *   [ ] Select "Skeleton project" and "TypeScript syntax".
        *   [ ] Add Prettier and ESLint for code quality.
    *   [ ] 1.3. **Install Key Dependencies:**
        *   [ ] `cd web-timeshaper` and run `pnpm install`.
        *   [ ] Install canvas and FFmpeg libraries: `pnpm add konva @ffmpeg/ffmpeg @ffmpeg/util`.
    *   [ ] 1.4. **Configure Tailwind CSS:**
        *   [ ] Install dev dependencies: `pnpm add -D tailwindcss postcss autoprefixer` and run `npx tailwindcss init -p`.
        *   [ ] Configure `tailwind.config.js` to scan `.svelte` files.
        *   [ ] Create `./src/app.css` and add the three `@tailwind` directives.
        *   [ ] Import `./app.css` into the root `+layout.svelte`.
    *   [ ] 1.5. **Set up Git Repository:**
        *   [ ] Initialize a new Git repository (`git init`).
        *   [ ] Create a `.gitignore` file using the SvelteKit default.
        *   [ ] Make the initial project commit.

*   [ ] **2. Audio Engine (`AudioWorklet`) Implementation:**
    *   [ ] 2.1. **Create the AudioWorklet Processor File:**
        *   [ ] Create `static/audio/time-shaper-processor.js`.
        *   [ ] Define a class `TimeShaperProcessor extends AudioWorkletProcessor`.
        *   [ ] Implement the `process()` method to initially pass audio through for verification.
        *   [ ] Register the processor using `registerProcessor('time-shaper-processor', TimeShaperProcessor)`.
    *   [ ] 2.2. **Implement the Stereo Circular Buffer:**
        *   [ ] Inside the processor file, create a `CircularBuffer` class to handle two `Float32Array` channels.
        *   [ ] Implement methods for `write(channels)` and `read(delayInSamples)` with linear interpolation for smooth time-scrubbing.
    *   [ ] 2.3. **Implement Audio Analysis within the Worklet:**
        *   [ ] In the `process()` method, add a simple transient detection algorithm (e.g., amplitude increase threshold on the input).
        *   [ ] When a transient is found, `postMessage` back to the main thread with `{ type: 'TRANSIENT_DETECTED', timestamp: currentTime }`.
    *   [ ] 2.4. **Implement Time-Scrubbing Logic in Worklet:**
        *   [ ] Add an `onmessage` handler to receive LFO configurations.
        *   [ ] In the `process()` loop, calculate the LFO phase, interpolate the wave to get the time offset, read the delayed audio from the circular buffer, and write it to the output.

*   [ ] **3. State Management & Core Services:**
    *   [ ] 3.1. **Create a Centralized State Store (`src/lib/stores/appStore.ts`):**
        *   [ ] Use Svelte 5 Runes to define all reactive state.
        *   [ ] Export `let lfoPoints = $state<LFOPoint[]>([...])`.
        *   [ ] Export `let eventMap = $state<EventMarker[]>([...])`, where `EventMarker` is `{ time: number, videoAction: object }`.
        *   [ ] Export runes for all UI controls (`lfoLength`, `timeRange`, etc.).
    *   [ ] 3.2. **Create the `AudioEngine` Service:**
        *   [ ] Create `src/lib/services/AudioEngine.ts`.
        *   [ ] Implement an `async initialize(sourceNode)` method that sets up the `AudioContext`, loads the worklet, and connects the audio graph (`sourceNode -> worklet -> destination`).
    *   [ ] 3.3. **Create the `FFmpegService`:**
        *   [ ] Create `src/lib/services/FFmpegService.ts`.
        *   [ ] Implement `load()` and `run()` methods, ensuring cross-origin isolation headers are enabled for `SharedArrayBuffer` support.

---

### **Phase 2: "Time Shaper" Workspace**

*   [ ] **4. Interactive LFO Canvas Component (`LFO_Canvas.svelte`):**
    *   [ ] 4.1. **Initialize Konva Stage and Layers:**
        *   [ ] In `onMount`, initialize the Konva Stage. Create a `gridLayer` and a `waveLayer`.
    *   [ ] 4.2. **Render the LFO Wave Reactively:**
        *   [ ] Create a `$derived` rune that generates Konva shapes from the `lfoPoints` state rune.
        *   [ ] Use an `$effect` to render these derived shapes to the Konva canvas.
    *   [ ] 4.3. **Implement LFO Drawing Tools:**
        *   [ ] Implement node dragging by updating the `lfoPoints` state on the `dragmove` event.
        *   [ ] Implement node creation on `click` and deletion on `dblclick`.
        *   [ ] Implement curve drawing by modifying the `curve` property of an `LFOPoint` when a line segment is dragged.
    *   [ ] 4.4. **Connect UI Controls to the Audio Engine:**
        *   [ ] Create an `$effect` that watches all LFO-related state runes.
        *   [ ] When any state changes, `postMessage` the complete configuration to the `TimeShaperProcessor`.

*   [ ] **5. Time Shaper Workspace View (`src/routes/time-shaper/+page.svelte`):**
    *   [ ] 5.1. **Implement Audio File Loading with WebCodecs:**
        *   [ ] Create a file input. On file selection, use the `FileReader` API to read the file as an `ArrayBuffer`.
        *   [ ] Use `AudioDecoder` to decode the audio data into raw `AudioData` frames.
        *   [ ] Create an `AudioBuffer` from the decoded frames and instantiate an `AudioBufferSourceNode`.
    *   [ ] 5.2. **Implement Playback Controls:**
        *   [ ] Add Play/Pause buttons that start/stop the `AudioBufferSourceNode`.
        *   [ ] On play, connect the source node to the `TimeShaperProcessor`.

---

### **Phase 3: "Swappy Video Editor" Workspace**

*   [ ] **6. Video & Audio Ingestion for the Editor:**
    *   [ ] 6.1. **Implement Video Upload and Demuxing:**
        *   [ ] In the `Swappy Video Editor` view, create a file input for video.
        *   [ ] On upload, use the `FFmpegService` to demux the video into separate audio (`.wav`) and video (`.h264`) streams in `MEMFS`.
    *   [ ] 6.2. **Load Demuxed Audio into the TimeShaper:**
        *   [ ] Read the demuxed `.wav` file from `MEMFS`.
        *   [ ] Decode it and connect it to the `TimeShaperProcessor` for analysis.
    *   [ ] 6.3. **Load Demuxed Video with WebCodecs:**
        *   [ ] Use a `VideoDecoderService` to read the demuxed video stream from `MEMFS` and store all decoded `VideoFrame` objects in an array.

*   [ ] **7. Building the Swappy Editor UI:**
    *   [ ] 7.1. **Implement Tabbed Navigation:**
        *   [ ] In `src/routes/+layout.svelte`, create the primary navigation to switch between the "Time Shaper" and "Swappy Video Editor" views.
    *   [ ] 7.2. **Render Interactive Audio Waveform:**
        *   [ ] Create a component `InteractiveWaveform.svelte`.
        *   [ ] Render the audio waveform using SVG or a canvas.
        *   [ ] Create a reactive `$effect` to render vertical lines on the waveform for each marker in the `eventMap` state.
    *   [ ] 7.3. **Implement Event Mapping Logic:**
        *   [ ] Listen for `TRANSIENT_DETECTED` messages from the AudioWorklet and add markers to the `eventMap` state.
        *   [ ] Allow users to click on the waveform to manually add/remove markers from the `eventMap`.
    *   [ ] 7.4. **Implement Video Action Assignment:**
        *   [ ] For each segment between markers, create a UI element that lets the user assign a video playback action (e.g., speed ramp, clip selection). Store this action in the corresponding `eventMap` entry.
    *   [ ] 7.5. **Implement `requestAnimationFrame` Video Playback Engine:**
        *   [ ] Create a playback loop that syncs with the `AudioContext.currentTime`.
        *   [ ] In each frame, determine the current audio segment from the `eventMap`.
        *   [ ] Execute the mapped video action by calculating the correct target `VideoFrame` and rendering it to a preview `<canvas>`.

---
---

# Web TimeShaper - UI/UX Design Checklist (v2)

This document outlines the design and user experience stories for the **Web TimeShaper** application. It is intended for a Senior UI/UX developer, assisted by an agentic code IDE, to create a cohesive, intuitive, and professional-grade interface.

### **Phase 1: Visual Identity & Design System**

*   [ ] **1. Foundational Design & Aesthetic:**
    *   [ ] 1.1. **Mood Board and Competitor Analysis:**
        *   [ ] Gather screenshots of professional tools: ShaperBox, Ableton Live, Premiere Pro.
        *   [ ] Identify common patterns for dark-mode UIs, information density, and interactive controls.
    *   [ ] 1.2. **Define the Color Palette:**
        *   [ ] Primary Interaction Color: A vibrant color for LFO lines, active nodes, and primary buttons (e.g., the teal/green from the reference video).
        *   [ ] Neutral Palette: A set of dark grays for backgrounds and panels to create depth.
        *   [ ] Accent/Secondary Color: A color for secondary actions or states (e.g., the red/pink from the video's "Drive" shaper).
        *   [ ] Define a text color with high contrast against the dark background (e.g., off-white).
    *   [ ] 1.3. **Establish a Consistent Typography and Iconography System:**
        *   [ ] Choose a clean, legible sans-serif font (e.g., Inter). Define a type scale for labels, body text, and headings.
        *   [ ] Select a sharp, minimalist icon set (e.g., Lucide) for all tools and controls.

*   [ ] **2. Component Library Design (Figma/Penpot):**
    *   [ ] 2.1. **Design Core Interactive Components:**
        *   [ ] Design the standard Button with states: default, hover, active, disabled.
        *   [ ] Design custom-styled Dropdown/Select components.
        *   [ ] Design a vertical Slider/Knob for controls like the "Mix" knob.
    *   [ ] 2.2. **Layout and Spacing Guidelines:**
        *   [ ] Define a consistent spacing system (e.g., an 8px grid) to govern all layout, padding, and margins.

---

### **Phase 2: "Time Shaper" Editor — User Experience**

*   [ ] **3. LFO Canvas Design for Clarity and Precision:**
    *   [ ] 3.1. **Canvas & Information Hierarchy:**
        *   [ ] Design the LFO editor view, making the canvas the undeniable focal point.
        *   [ ] Design the background grid to be clear but subtle, with major and minor grid lines (e.g., 1/4 and 1/16 notes).
    *   [ ] 3.2. **LFO Wave and Node Visuals:**
        *   [ ] The LFO wave itself should be the brightest, most prominent element on the canvas.
        *   [ ] Design node visuals: small, solid circles for sharp points; hollow circles for curve control points. Ensure they have a larger, easily clickable hit area.
    *   [ ] 3.3. **Tool Interaction Design:**
        *   [ ] Design a clear visual state for the active drawing tool in the toolbar.
        *   [ ] The mouse cursor must change contextually: crosshair for adding points, grab-hand for dragging, etc.
        *   [ ] Ensure the curve-drawing interaction feels intuitive: dragging the line should feel like pulling on an elastic band.

---

### **Phase 3: "Swappy Video Editor" — User Experience**

*   [ ] **4. Swappy Editor Layout & Workflow Design:**
    *   [ ] 4.1. **Tabbed Navigation:**
        *   [ ] Design a clean, top-level tab component to switch between the "Time Shaper" and "Swappy Video Editor" workspaces. The active tab must be visually distinct.
    *   [ ] 4.2. **Interactive Waveform View:**
        *   [ ] Design the audio waveform display. It needs to accommodate an overlay for transient markers and a clearly visible playhead.
        *   [ ] Design the transient markers as vertical lines that are easy to see and click on. Use different styles for auto-detected vs. user-added markers.
    *   [ ] 4.3. **Video Action Mapping UI:**
        *   [ ] Design an intuitive UI for mapping actions to the audio segments between markers.
        *   [ ] **Design Idea:** When a user clicks a segment on the waveform, a small popover or inline editor appears. This editor should contain:
            *   [ ] A dropdown to select the video clip to play (e.g., "Clip A", "Clip B").
            *   [ ] A slider or input for playback speed (e.g., from -2x to 2x).
            *   [ ] A toggle for "Reverse".
    *   [ ] 4.4. **Video Preview Player:**
        *   [ ] Design the video preview area. It should be the largest element in this workspace.

---

### **Phase 4: Global User Journey & Polish**

*   [ ] **5. Onboarding and Initial User Interaction:**
    *   [ ] 5.1. **Design the "Empty State" / Welcome Screen:**
        *   [ ] The initial screen should present two clear paths to the user.
        *   [ ] Path A: "Create with Audio" -> prompts for an audio file upload and takes the user to the "Time Shaper" workspace.
        *   [ ] Path B: "Create with Video" -> prompts for a video file upload and takes the user to the "Swappy Video Editor" workspace.
    *   [ ] 5.2. **Design User Feedback and Loading States:**
        *   [ ] Design a progress indicator for when FFmpeg is demuxing a video.
        *   [ ] Design clear, friendly error messages for unsupported file types or browser features.

*   [ ] **6. Responsive & Accessible Design:**
    *   [ ] 6.1. **Mobile and Tablet Layouts:**
        *   [ ] Design how the workspaces will re-flow on smaller screens. Consider a single-column layout where controls stack vertically below the canvas/preview.
    *   [ ] 6.2. **Accessibility (A11Y) Audit:**
        *   [ ] Check all color combinations for WCAG AA compliance.
        *   [ ] Ensure all interactive controls without text labels have descriptive ARIA labels.
        *   [ ] Verify that the application is navigable using only a keyboard.