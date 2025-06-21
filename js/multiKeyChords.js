import { chordMaps, SingleNoteMaps } from './maps/chordMapping.js'; // Import chord maps and single note maps
import { keyMap } from './maps/keyMapping.js';
import { lockedKeysMap } from './maps/chordMapping.js';
import { keyValueMaps } from './maps/chordMapping.js';

/**
 * Main function to enable chord playing functionality.
 * Sets up event listeners and handles both single notes and chord mode.
 * @param {AudioContext} audioContext - Web Audio API context for managing sound.
 * @param {Object} passedAudioBuffers - Preloaded and decoded audio buffers keyed by key number.
 */

export default function enableChordPlaying(audioContext, passedAudioBuffers) {
    // Store the preloaded buffers in a variable accessible within this module's scope
    const preloadedAudioBuffers = passedAudioBuffers;

    const activeKeys = new Set();
    let chordMode = false; // State to track if chord mode is enabled
    let currentKey = "A"; // Default key
    let tabFeatureEnabled = false; 
    let currentBeatSourceNode = null; 

    // TAB Feature State
    let isTabPlaying = false; // To track if the TAB sequence is currently playing
    let tabPlaybackTimeoutIds = []; // To store all timeout IDs for the playing TAB sequence

    let currentBeatBPM = 0; // To store the BPM of the currently playing beat track
    const beatTrackBuffers = {}; // Cache for decoded beat track AudioBuffers

    let transposeOffset = 0; // For CHORD MODE transposition (0-11)
    let singleNoteTransposeOffset = 0; // For SINGLE NOTE MODE transposition (0-11)

    // These will hold the specific slice of the map for the current key and current offset
    let currentChordMapSlice = chordMaps[currentKey]?.[transposeOffset] || {};
    let currentSingleNoteMapSlice = SingleNoteMaps[currentKey]?.[singleNoteTransposeOffset] || {};
    const allKeys = Object.keys(chordMaps); // List of all available keys

    // Log initial state
    console.log(`Initial Key: ${currentKey}`);
    console.log(`Initial Chord Transpose Offset: ${transposeOffset}, Single Note Transpose Offset: ${singleNoteTransposeOffset}`);
    console.log("Preloaded audio buffers received:", preloadedAudioBuffers); // Log received buffers
    
    // Map beat track IDs to file paths and their BPM
    // ** THIS IS WHERE YOU SET THE BPM FOR EACH TRACK **
    // ** NEW: This is also where you set the precise TIMINGS for TAB playback **
    // The 'timings' object maps a TAB field identifier (e.g., '1.0', '1.5') to a time in seconds.
    const beatTrackMap = {
        'track1': {
            path: 'audio/beats/Track-1-104-trap.mp3',
            bpm: 104,
            duration: 9.21, // The duration of the audio file in seconds
            timings: { // Timings in seconds from the start of the beat
                '1.0': 0.000, '1.5': 1.187,
                '2.0': 2.343, '2.5': 3.500,
                '3.0': 4.625, '3.5': 5.781,
                '4.0': 6.968, '4.5': 8.093,
                // NOTE: The timings below extend beyond the track duration of 9.21s.
                '5.0': 9.281, '5.5': 10.468,
                '6.0': 11.656, '6.5': 12.843,
                '7.0': 14.031, '7.5': 15.218,
                '8.0': 16.406, '8.5': 17.593
            }
        },
        'track2': {
            path: 'audio/beats/Track-2-113-amapiano.mp3',
            bpm: 113,
            duration: 16.9, // TODO: Replace with actual duration
            timings: { // Timings in seconds from the start of the beat
                '1.0': 0.000, '1.5': 1.062,
                '2.0': 2.125, '2.5': 3.187,
                '3.0': 4.250, '3.5': 5.312,
                '4.0': 6.375, '4.5': 7.437,
                '5.0': 8.500, '5.5': 9.562,
                '6.0': 10.625, '6.5': 11.687,
                '7.0': 12.750, '7.5': 13.812,
                '8.0': 14.875, '8.5': 15.937
            }
        },
        'track3': {
            path: 'audio/beats/Track-3-funk.mp3',
            bpm: 100,
            duration: 19.2, // TODO: Replace with actual duration
            timings: {
                '1.0': 0.000, '1.5': 1.218,
                '2.0': 2.437, '2.5': 3.625,
                '3.0': 4.812, '3.5': 6.031,
                '4.0': 7.250, '4.5': 8.406,
                '5.0': 9.593, '5.5': 10.812,
                '6.0': 12.750, '6.5': 13.218,
                '7.0': 14.406, '7.5': 15.625,
                '8.0': 16.843, '8.5': 18.000
            } // TODO: Add timings for Track 3
        },
        'track4': {
            path: 'audio/beats/Track-4-fuji.mp3',
            bpm: 120,
            duration: 16.0, // TODO: Replace with actual duration
            timings: { // Timings for Fuji beat
                '1.0': 0.000, '1.5': 1.093,
                '2.0': 2.156, '2.5': 3.218,
                '3.0': 4.281, '3.5': 5.343,
                '4.0': 6.406, '4.5': 7.468,
                '5.0': 8.531, '5.5': 9.593,
                '6.0': 10.656, '6.5': 11.718,
                '7.0': 12.781, '7.5': 13.843,
                '8.0': 14.906, '8.5': 15.968
            }
        },
        'track5': {
            path: 'audio/beats/Track-5-highlife.mp3',
            bpm: 115,
            duration: 16.7, // TODO: Replace with actual duration
            timings: { // Timings for Highlife beat
                '1.0': 0.000, '1.5': 1.187,
                '2.0': 2.375, '2.5': 3.562,
                '3.0': 4.750, '3.5': 5.906,
                '4.0': 7.093, '4.5': 8.250,
                '5.0': 9.437, '5.5': 10.625,
                '6.0': 11.781, '6.5': 12.968,
                '7.0': 14.156, '7.5': 15.312,
                '8.0': 16.500, '8.5': 17.656
            }
        }
    };

    function updateInternalMapSlices() {
        currentChordMapSlice = chordMaps[currentKey]?.[transposeOffset] || {};
        currentSingleNoteMapSlice = SingleNoteMaps[currentKey]?.[singleNoteTransposeOffset] || {};
        console.log(`Internal map slices updated. Key: ${currentKey}, ChordOffset: ${transposeOffset}, SingleOffset: ${singleNoteTransposeOffset}`);
        // console.log('Current Chord Map Slice:', currentChordMapSlice);
        // console.log('Current Single Note Map Slice:', currentSingleNoteMapSlice);
    }


    function getKeyValue(currentKey, keyNumber) {
        const currentKeyValueMap = keyValueMaps[currentKey] || {};
        return currentKeyValueMap[keyNumber] || ""; // Return "" if not found
    }

    function showLockedKeyLabels(currentKey) {
        const lockedKeys = lockedKeysMap[currentKey] || [];
        const keys = document.querySelectorAll(".key");
        keys.forEach((key) => { // Use data-key attribute for consistency
            const keyIndex = parseInt(key.getAttribute("data-key")); // Get key number from data-key
            if (lockedKeys.includes(keyIndex)) {
                const keyValue = getKeyValue(currentKey, keyIndex);
                key.classList.add("locked");
                key.textContent = keyValue;
            } else {
                key.classList.remove("locked");
                key.textContent = ""; // Clear any previous labels
            }
        });
    }

    function selectKey(keyName) {
        document.querySelectorAll('.key').forEach(key => {
            key.classList.remove('selected-key');
        });

        // Note: This assumes keyName corresponds to a button text, not directly a data-key
        // If you want to highlight based on data-key, you'd need a mapping or adjust the logic
        // For now, keeping original logic which seems tied to the switcher buttons.
        // If highlighting the actual piano key visually based on the *musical* key (A, C#, etc.)
        // is desired, that would require additional mapping logic.
        showLockedKeyLabels(keyName); // Update locked keys based on the musical key name
    }

    // --- Updated playSoundForKey function ---
    function playSoundForKey(key) {
        // Use the preloaded buffers directly
        if (preloadedAudioBuffers && preloadedAudioBuffers[key]) {
            preloadedAudioBuffers[key].forEach(buffer => { // Iterate over the array of buffers for the key
                if (buffer && audioContext.state === 'running') { // Check if buffer is valid and context is running
                   try {
                        const source = audioContext.createBufferSource();
                        source.buffer = buffer;
                        source.connect(audioContext.destination);
                        source.start(0); // Start playback immediately
                   } catch (err) {
                       console.error(`Error playing preloaded sound for key ${key}:`, err);
                   }
                } else if (!buffer) {
                     console.warn(`Invalid buffer found for key ${key}`);
                } else if (audioContext.state !== 'running') {
                    console.warn(`AudioContext not running, cannot play sound for key ${key}. State: ${audioContext.state}`);
                }
            });
        } else {
            console.warn(`No preloaded sound assigned or found for key ${key}`);
        }

        // Trigger Sync Key Finder playback (if needed and enabled)
        // This part remains unchanged as it uses a different mechanism (Audio element)
        // handleKeyPress(currentKey); // Ensure this is called only when appropriate (e.g., sync enabled)
    }
    // --- End of updated playSoundForKey function ---


    function playChord(keys) {
        console.log(`Playing chord for keys: ${keys}`);
        keys.forEach(playSoundForKey);
    }

    // --- Updated Visual Feedback Functions (using data-key) ---
    function addKeyVisual(keyIndex) {
        // Use data-key selector for consistency with how keys are created in main.js
        const keyElement = document.querySelector(`.key[data-key="${keyIndex}"]`);
        if (keyElement) {
            keyElement.classList.add("pressed");
        } else {
            // console.warn(`Could not find key element with data-key="${keyIndex}" to add visual`);
        }
    }

    function removeKeyVisual(keyIndex) {
        const keyElement = document.querySelector(`.key[data-key="${keyIndex}"]`);
        if (keyElement) {
            keyElement.classList.remove("pressed");
        } else {
            // console.warn(`Could not find key element with data-key="${keyIndex}" to remove visual`);
        }
    }
    // --- End of Updated Visual Feedback Functions ---
    
    function updateTransposeDisplay() {
        const transposeValueElement = document.getElementById("transpose-value");
        if (transposeValueElement) {
            transposeValueElement.textContent = chordMode ? transposeOffset : singleNoteTransposeOffset;
        }
    }

    function toggleChordMode() {
        chordMode = !chordMode;
        const toggleButton = document.getElementById("chord-mode-toggle");
        if (toggleButton) {
            toggleButton.textContent = chordMode ? "Chord Mode: ON" : "Chord Mode: OFF";
        }
        console.log(`Chord Mode: ${chordMode ? "ON" : "OFF"}`);
        updateTransposeDisplay(); // Display reflects the active mode's transpose

        // If chord mode was turned OFF, remove all pressed visuals
        if (!chordMode) {
            console.log("Chord mode OFF, removing all pressed visuals and clearing active keys.");
            document.querySelectorAll('.key.pressed').forEach(key => {
                key.classList.remove('pressed');
            });
            // Optionally clear activeKeys if you want to stop sounds too,
            // but the request was only about visuals.
            // activeKeys.clear();
        }
        // No need to call stopAllAudio() here unless specifically desired to stop sync key audio
    }
    // --- End of updated toggleChordMode function ---

    function switchKey(newKey) {
        const formattedKey = newKey.replace("#", "sharp");

        // Ensure that the key exists in both map structures
        if (chordMaps[formattedKey] && SingleNoteMaps[formattedKey]) {
            // If the musical key itself is changing, reset both transpose offsets
            if (formattedKey !== currentKey) {
                transposeOffset = 0;
                singleNoteTransposeOffset = 0;
                console.log(`Musical key changed. Both transpose offsets reset to 0.`);
            }

            currentKey = formattedKey;
            updateInternalMapSlices(); // Update the map slices based on new key and current offsets

            console.log(`Switched to key: ${currentKey}. Chord Transpose: ${transposeOffset}, Single Note Transpose: ${singleNoteTransposeOffset}`);

            selectKey(formattedKey);  // Update UI for the selected key (locked keys)

            // Trigger sync key finder playback if it's enabled
            if (syncKeyFinderEnabled) {
                // stopAllAudio(); // This stops sync key audio
                // handleKeyPress(currentKey); // This starts sync key audio
                // Let toggleSyncKeyFinder handle this if it's already enabled
                if (syncToggle && syncToggle.checked) {
                    stopAllAudio(); // Stop previous
                    handleKeyPress(currentKey); // Start new
                }
            } else {
                stopAllAudio(); // Ensure sync audio is stopped if disabled
            }
        } else {
            console.warn(`Chord map for key "${formattedKey}" at index ${chordIndex} not found.`);
            console.warn("Retaining previous key:", currentKey);
            // Optionally revert transpose display if switch fails
            updateTransposeDisplay();
        }
    }

    // --- Beat Track Playback Functions ---
    function stopBeatAudio() {
        if (currentBeatSourceNode) {
            console.log("Stopping beat audio (Web Audio).");
            try {
                currentBeatSourceNode.stop(0); // Stop playback
                currentBeatSourceNode.disconnect(); // Disconnect from audio graph
            } catch (e) {
                // stop() can throw an error if called multiple times or on an already stopped source.
                console.warn("Error stopping beat source node:", e.message);
            }
            currentBeatSourceNode = null;
            currentBeatBPM = 0; // Reset BPM when beat stops
        }
    }

    // This function is now fully asynchronous, returning a Promise that resolves when the beat starts.
    // It also caches decoded audio buffers to make looping instantaneous.
    async function playBeatTrack(trackId) {
        return new Promise(async (resolve, reject) => {
            if (!tabFeatureEnabled) {
                console.log("TAB feature is OFF, not playing beat.");
                stopBeatAudio();
                resolve(); // Resolve silently
                return;
            }

            const trackInfo = beatTrackMap[trackId];
            if (!trackInfo || !trackInfo.path) {
                const errorMsg = `No track info or audio file path mapped for beat track ID: ${trackId}`;
                console.warn(errorMsg);
                stopBeatAudio();
                reject(new Error(errorMsg));
                return;
            }
            
            stopBeatAudio(); // Stop any existing beat before starting a new one

            // --- Caching Logic: Play from cache if available ---
            if (beatTrackBuffers[trackId]) {
                console.log(`Playing beat track from cache: ${trackId}`);
                try {
                    if (audioContext.state === "suspended") await audioContext.resume();
                    
                    const source = audioContext.createBufferSource();
                    source.buffer = beatTrackBuffers[trackId];
                    source.loop = false; // Looping is handled by the TAB sequencer
                    source.connect(audioContext.destination);
                    source.start(0);

                    currentBeatBPM = trackInfo.bpm || 0;
                    currentBeatSourceNode = source;
                    console.log(`Successfully started playing cached beat track: ${trackId}`);
                    resolve(); // Resolve once playback has started
                } catch (e) {
                    console.error("Error playing cached beat track:", e);
                    reject(e);
                }
                return; // Exit after playing from cache
            }

            // --- Fetch, Decode, and Cache Logic (if not in cache) ---
            try {
                const filePath = trackInfo.path;
                console.log(`Fetching and decoding beat track for caching: ${filePath}`);
                const response = await fetch(filePath);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for ${filePath}`);
                
                const arrayBuffer = await response.arrayBuffer();
                if (audioContext.state === "suspended") await audioContext.resume();

                audioContext.decodeAudioData(arrayBuffer, (decodedBuffer) => {
                    beatTrackBuffers[trackId] = decodedBuffer; // Cache the buffer for next time

                    if (!tabFeatureEnabled) {
                        console.log("Beat feature was disabled during audio decoding. Not playing.");
                        resolve();
                        return;
                    }
                    
                    const source = audioContext.createBufferSource();
                    source.buffer = decodedBuffer;
                    source.loop = false;
                    source.connect(audioContext.destination);
                    source.start(0);

                    currentBeatBPM = trackInfo.bpm || 0;
                    currentBeatSourceNode = source;
                    console.log(`Successfully started playing beat track (Web Audio): ${filePath} at ${currentBeatBPM} BPM`);
                    resolve(); // Resolve once playback has started

                }, (decodeError) => {
                    currentBeatBPM = 0;
                    console.error(`Error decoding audio data for ${filePath}:`, decodeError);
                    reject(decodeError);
                });

            } catch (error) {
                console.error(`Error fetching or processing beat track:`, error);
                currentBeatBPM = 0;
                reject(error);
            }
        });
    }

    // Transpose function (affects either chord or single note offset based on mode)
    function transpose(semitones) {
        if (chordMode) {
            const newChordOffset = (transposeOffset + semitones + 12) % 12;
            if (chordMaps[currentKey]?.[newChordOffset]) {
                transposeOffset = newChordOffset;
                console.log(`Chord Transpose for key ${currentKey} to offset: ${transposeOffset}`);
            } else {
                console.warn(`Chord map for ${currentKey}[${newChordOffset}] not found. Transposition aborted.`);
                return; // Abort if new offset is invalid for chords
            }
        } else { // Single note mode
            const newSingleNoteOffset = (singleNoteTransposeOffset + semitones + 12) % 12;
            if (SingleNoteMaps[currentKey]?.[newSingleNoteOffset]) {
                singleNoteTransposeOffset = newSingleNoteOffset;
                console.log(`Single Note Transpose for key ${currentKey} to offset: ${singleNoteTransposeOffset}`);
            } else {
                console.warn(`SingleNoteMap for ${currentKey}[${newSingleNoteOffset}] not found. Transposition aborted.`);
                return; // Abort if new offset is invalid for single notes
            }
        }
        updateInternalMapSlices(); // Update the internal map slices to reflect new offset
        updateTransposeDisplay(); // Update the displayed transpose value
    }

     // --- Event Listeners ---
    // Key Switcher Select Element
    const keySwitcherSelect = document.getElementById("key-switcher-select");
    if (keySwitcherSelect) {
        keySwitcherSelect.addEventListener("change", (event) => {
            const newKey = event.target.value;
            switchKey(newKey); // switchKey will reset offsets if the musical key changes
        });
        // Set initial value of select to currentKey (if HTML default doesn't match)
        keySwitcherSelect.value = currentKey.replace("sharp", "#"); // Ensure correct format for select value
    }

    // Piano Key Interactions (Touch and Mouse)
    const pianoContainer = document.querySelector(".piano-container");

    // --- Interaction Handlers (Keep as is) ---
    const handleInteractionStart = (event) => {
        const keyElement = event.target.closest('.key');
        if (!keyElement) return;

        event.preventDefault(); // Prevent default touch actions like scrolling
        if (audioContext.state === "suspended") {
            audioContext.resume().catch(err => console.error("Error resuming AudioContext:", err));
        }

        const keyIndex = parseInt(keyElement.getAttribute("data-key"));
        if (isNaN(keyIndex)) return;

        if (!activeKeys.has(keyIndex)) {
            activeKeys.add(keyIndex);            
            addKeyVisual(keyIndex); // Visual for the physical key pressed

            // TAB Feature: Capture note if a TAB input is focused
            const focusedElement = document.activeElement;
            if (focusedElement && focusedElement.classList.contains('tab-note-input')) {
                let noteToStore;
                if (chordMode) {
                    const chordNotesToPlay = currentChordMapSlice[keyIndex];
                    if (chordNotesToPlay && chordNotesToPlay.length > 0) {
                        noteToStore = chordNotesToPlay.join(',');
                    } else {
                        noteToStore = keyIndex.toString(); // Fallback
                    }
                } else {
                    const singleNoteMapping = currentSingleNoteMapSlice[keyIndex];
                    if (singleNoteMapping && singleNoteMapping.length > 0) {
                        noteToStore = singleNoteMapping[0].toString();
                    } else {
                        noteToStore = keyIndex.toString(); // Fallback
                    }
                }
                focusedElement.value = noteToStore;
            }
            if (chordMode) {
                const chordNotesToPlay = currentChordMapSlice[keyIndex];
                if (chordNotesToPlay && chordNotesToPlay.length > 0) {
                    playChord(chordNotesToPlay);
                    // Add visuals for all notes in the chord (if different from the trigger key)
                    chordNotesToPlay.forEach(note => { if (note !== keyIndex) addKeyVisual(note); });
                } else {
                    playSoundForKey(keyIndex); // Fallback: play single note
                    console.log(`Chord mode ON, but no chord defined for key ${keyIndex}. Playing single note.`);
                }
            } else { // Single Note Mode
                const singleNoteMapping = currentSingleNoteMapSlice[keyIndex];
                if (singleNoteMapping && singleNoteMapping.length > 0) {
                    playSoundForKey(singleNoteMapping[0]); // Play the (potentially transposed) single note
                } else {
                    playSoundForKey(keyIndex); // Fallback: play untransposed key
                    console.log(`No single note mapping for key ${keyIndex}. Playing original.`);
                }
            }
        }
    };

    const handleInteractionEnd = (event) => {
        const keyElement = event.target.closest('.key');
        if (!keyElement) return;
        // Note: For touchend, event.target might not be the element where touch started.
        // However, using closest('.key') on the target of touchend *usually* works
        // if the finger lifts directly off the key. A more robust solution involves
        // tracking touches by identifier, but let's stick with this simpler approach first.

        event.preventDefault(); // Good practice for consistency

        const keyIndex = parseInt(keyElement.getAttribute("data-key"));
         if (isNaN(keyIndex)) return;

         if (activeKeys.has(keyIndex)) {
            activeKeys.delete(keyIndex);
            
            if (chordMode) {
                const chordNotesPlayed = currentChordMapSlice[keyIndex];
                if (chordNotesPlayed && chordNotesPlayed.length > 0) {
                    chordNotesPlayed.forEach(note => removeKeyVisual(note));
                } else {
                    removeKeyVisual(keyIndex); // Fallback if only single note was played/visualized
                }
            } else { // Single Note Mode
                removeKeyVisual(keyIndex); // Just remove visual from the physical key
            }
         }
    };
    // --- End Updated Interaction Handlers ---


    // --- Attach Listeners to Piano Container ---
    // Mouse Listeners (Keep as is)
    pianoContainer.addEventListener("mousedown", handleInteractionStart);
    pianoContainer.addEventListener("mouseup", handleInteractionEnd);
    pianoContainer.addEventListener("mouseleave", (event) => {
        if (event.buttons === 1) {
             activeKeys.forEach(pkIndex => { // pkIndex is the physical key index
                 if (chordMode) {
                    const chordNotes = currentChordMapSlice[pkIndex];
                    if (chordNotes) {
                        chordNotes.forEach(removeKeyVisual);
                    } else {
                        removeKeyVisual(pkIndex);
                    }
                 } else {
                    removeKeyVisual(pkIndex);
                 }
             });
             activeKeys.clear();
        }
    });

    // Touch Listeners (ADD THESE)
    pianoContainer.addEventListener("touchstart", handleInteractionStart, { passive: false }); // Use passive: false because we call preventDefault
    pianoContainer.addEventListener("touchend", handleInteractionEnd);
    pianoContainer.addEventListener("touchcancel", handleInteractionEnd); // Handle cancellation (e.g., finger slides off screen)
    // --- End Listener Attachments ---


    // Keyboard Interactions
    window.addEventListener("keydown", (event) => {
        if (event.repeat) return; // Prevent handling repeated keydown events
        const keyMapped = keyMap[event.key.toLowerCase()]; // Use the imported keyMap
        if (!keyMapped || activeKeys.has(keyMapped)) return;

        // Resume context on first keyboard interaction too
        if (audioContext.state === "suspended") {
            audioContext.resume().catch(err => console.error("Error resuming AudioContext:", err));
        }

        activeKeys.add(keyMapped);

        // TAB Feature: Capture note if a TAB input is focused (Keyboard)
        const focusedElement = document.activeElement;
        if (focusedElement && focusedElement.classList.contains('tab-note-input')) {
            let noteToStore;
            if (chordMode) {
                const chordNotesToPlay = currentChordMapSlice[keyMapped];
                if (chordNotesToPlay && chordNotesToPlay.length > 0) {
                    noteToStore = chordNotesToPlay.join(',');
                } else {
                    noteToStore = keyMapped.toString(); // Fallback
                }
            } else {
                const singleNoteMapping = currentSingleNoteMapSlice[keyMapped];
                if (singleNoteMapping && singleNoteMapping.length > 0) {
                    noteToStore = singleNoteMapping[0].toString();
                } else {
                    noteToStore = keyMapped.toString(); // Fallback
                }
            }
            focusedElement.value = noteToStore;
        }


        addKeyVisual(keyMapped); // Visual for the physical key pressed

        if (chordMode) {
            const chordNotesToPlay = currentChordMapSlice[keyMapped];
            if (chordNotesToPlay && chordNotesToPlay.length > 0) {
                playChord(chordNotesToPlay);
                chordNotesToPlay.forEach(note => { if (note !== keyMapped) addKeyVisual(note); });
            } else {
                playSoundForKey(keyMapped);
                console.log(`Chord mode ON, but no chord defined for key ${keyMapped}. Playing single note.`);
            }
        } else { // Single Note Mode
            const singleNoteMapping = currentSingleNoteMapSlice[keyMapped];
            if (singleNoteMapping && singleNoteMapping.length > 0) {
                playSoundForKey(singleNoteMapping[0]);
            } else {
                playSoundForKey(keyMapped);
                console.log(`No single note mapping for key ${keyMapped}. Playing original.`);
            }
        }
    });

    window.addEventListener("keyup", (event) => {
        const keyMapped = keyMap[event.key.toLowerCase()];
        if (!keyMapped || !activeKeys.has(keyMapped)) return; // Check if the key is actually active

        activeKeys.delete(keyMapped);

        if (chordMode) {
            const chordNotesPlayed = currentChordMapSlice[keyMapped];
            if (chordNotesPlayed && chordNotesPlayed.length > 0) {
                chordNotesPlayed.forEach(removeKeyVisual);
            } else {
                removeKeyVisual(keyMapped); 
            }
        } else { // Single Note Mode
            removeKeyVisual(keyMapped); 
        }
    });
    // --- End Updated Keyboard Interactions ---

    // Chord Mode Toggle Button
    document.getElementById("chord-mode-toggle")?.addEventListener("click", toggleChordMode); // Add null check

    // Transpose Buttons
    document.getElementById("transpose-up")?.addEventListener("click", () => transpose(1)); // Add null check
    document.getElementById("transpose-down")?.addEventListener("click", () => transpose(-1)); // Add null check

    // --- TAB Feature (Beat) Controls ---
    const tabFeatureToggle = document.getElementById("tab-feature-toggle");
    const beatTrackSelect = document.getElementById("beat-track-select");

    if (tabFeatureToggle) {
        tabFeatureToggle.addEventListener("click", () => {
            tabFeatureEnabled = !tabFeatureEnabled;
            tabFeatureToggle.textContent = tabFeatureEnabled ? "Beat: ON" : "Beat: OFF";
            console.log(`TAB Feature (Beat): ${tabFeatureEnabled ? "ON" : "OFF"}`);

            if (tabFeatureEnabled) {
                // Start playing the currently selected beat track
                const selectedTrackId = beatTrackSelect?.value || 'track1'; // Default to track1 if select not found or no value
                playBeatTrack(selectedTrackId);
            } else {
                // Stop the beat track
                stopBeatAudio();
            }
        });
    }

    if (beatTrackSelect) {
        beatTrackSelect.addEventListener("change", (event) => {
            if (tabFeatureEnabled) {
                playBeatTrack(event.target.value); // Play the newly selected track if feature is ON
            }
        });
    }

    // --- TAB Input Splitting/Merging Logic ---
    function setupTabInputSplitters() {
        const splitButtons = document.querySelectorAll('.tab-split-btn');
        splitButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
                toggleTabInputSplit(index, button);
            });
        });
    }

    function toggleTabInputSplit(entryIndex, buttonElement) {
        const entryDiv = document.querySelector(`.tab-note-entry[data-entry-index="${entryIndex}"]`);
        if (!entryDiv) return;
        const inputWrapper = entryDiv.querySelector('.tab-input-wrapper');
        const originalInput = inputWrapper.querySelector('.tab-note-input[data-original-input="true"]');

        if (buttonElement.textContent === '/') { // Split action
            const originalValue = originalInput.value;
            originalInput.style.display = 'none'; // Hide original

            const input1 = document.createElement('input');
            input1.type = 'text';
            input1.classList.add('tab-note-input', 'split');
            input1.placeholder = `Note ${entryIndex + 1}.1`;
            input1.dataset.splitPart = "1";
            // input1.value = originalValue; // Optionally prefill, or clear

            const input2 = document.createElement('input');
            input2.type = 'text';
            input2.classList.add('tab-note-input', 'split');
            input2.placeholder = `Note ${entryIndex + 1}.2`;
            input2.dataset.splitPart = "2";

            inputWrapper.appendChild(input1);
            inputWrapper.appendChild(input2);
            buttonElement.textContent = '-';
            entryDiv.dataset.isSplit = "true";
        } else { // Merge action
            const splitInputs = inputWrapper.querySelectorAll('.tab-note-input.split');
            let combinedValue = "";
            if (splitInputs.length === 2) {
                // Example: combine values, or take first, or clear. For now, just clear.
                // combinedValue = splitInputs[0].value + (splitInputs[1].value ? " / " + splitInputs[1].value : "");
            }
            splitInputs.forEach(el => el.remove());
            
            originalInput.style.display = 'block'; // Show original
            // originalInput.value = combinedValue; // Restore or set combined value
            buttonElement.textContent = '/';
            entryDiv.dataset.isSplit = "false";
        }
    }

    // --- TAB Playback Logic ---
    // This new approach uses a predefined timing map for each beat track instead of BPM calculations.
    // It now supports looping by restarting the sequence and the beat track together to maintain sync.
    async function playTabSequence() {
        // Clear any timeouts from a previous cycle before scheduling new ones.
        tabPlaybackTimeoutIds.forEach(id => clearTimeout(id));
        tabPlaybackTimeoutIds = [];

        // This logic runs only on the first "play" click, not on subsequent loops.
        if (!isTabPlaying) {
            isTabPlaying = true;
            document.getElementById('play-tab-btn').textContent = 'Stop TAB';
            console.log("Starting TAB sequence (first cycle).");
        } else {
            // This log will appear for each subsequent loop.
            console.log("Looping TAB sequence.");
        }

        // 1. Get current track info and its timing map
        const selectedTrackId = beatTrackSelect?.value || 'track1';
        const trackInfo = beatTrackMap[selectedTrackId];
        if (!trackInfo || !trackInfo.timings || Object.keys(trackInfo.timings).length === 0) {
            console.error(`Selected track "${selectedTrackId}" has no timing map defined. Stopping playback.`);
            alert(`Playback failed: No timing map for ${selectedTrackId}.`);
            stopTabPlayback(); // This will reset the button and state
            return;
        }
        const timingMap = trackInfo.timings;

        // 2. Collect all notes from the DOM, associating them with a timing key ('1.0', '1.5', etc.)
        const notesToSchedule = [];
        const tabEntries = document.querySelectorAll('.tab-note-entry');

        tabEntries.forEach((entry, index) => {
            const entryNumber = index + 1;
            if (entry.dataset.isSplit === "true") {
                const split1 = entry.querySelector('.tab-note-input[data-split-part="1"]');
                const split2 = entry.querySelector('.tab-note-input[data-split-part="2"]');
                // The first split input maps to '.0', the second to '.5'
                if (split1 && split1.value.trim()) {
                    notesToSchedule.push({ timingKey: `${entryNumber}.0`, noteData: split1.value.trim() });
                }
                if (split2 && split2.value.trim()) {
                    notesToSchedule.push({ timingKey: `${entryNumber}.5`, noteData: split2.value.trim() });
                }
            } else {
                // A non-split input maps to '.0'
                const mainInput = entry.querySelector('.tab-note-input[data-original-input="true"]');
                if (mainInput && mainInput.value.trim()) {
                    notesToSchedule.push({ timingKey: `${entryNumber}.0`, noteData: mainInput.value.trim() });
                }
            }
        });

        // --- NEW: Conditionally duplicate notes for tracks other than 'track1' ---
        let allNotesToSchedule = [...notesToSchedule]; // Start with the original notes from the UI.

        // The duplication logic is skipped for 'track1' because its duration is shorter.
        if (selectedTrackId !== 'track1') {
            console.log(`Repeating notes for track: ${selectedTrackId}`);
            const repeatedNotes = notesToSchedule.map(note => {
                const [beat, subBeat] = note.timingKey.split('.');
                const originalBeatNumber = parseInt(beat);

                // Only repeat notes from the first 4 beat entries (which cover 8 timing points)
                if (originalBeatNumber <= 4) {
                    const newBeatNumber = originalBeatNumber + 4;
                    const newTimingKey = `${newBeatNumber}.${subBeat}`;
                    return { timingKey: newTimingKey, noteData: note.noteData };
                }
                return null;
            }).filter(note => note !== null);

            allNotesToSchedule.push(...repeatedNotes); // Add the repeated notes to the schedule.
        } else {
            console.log("Skipping note repetition for 'track1' due to its shorter length.");
        }

        if (allNotesToSchedule.length === 0) {
            console.log("TAB sequence is empty, stopping playback.");
            stopTabPlayback();
            return;
        }

        // 3. Start the beat track IF the "Beat" toggle is ON
        // The beat is restarted on every loop to ensure it stays perfectly in sync with the TAB notes.
        if (tabFeatureEnabled) {
            console.log("Restarting beat for TAB playback sync.");
            // Await the promise from playBeatTrack to ensure the beat has started before scheduling notes.
            try {
                await playBeatTrack(selectedTrackId);
            } catch (error) {
                console.error("Failed to play beat track, stopping TAB sequence.", error);
                stopTabPlayback();
                return;
            }
        }

        // 4. Schedule all notes to play at their specified times using setTimeout
        allNotesToSchedule.forEach(({ timingKey, noteData }) => {
            const playbackTimeInSeconds = timingMap[timingKey];

            if (playbackTimeInSeconds === undefined) {
                console.warn(`No timing defined for key ${timingKey} in the current beat track. Skipping note.`);
                return;
            }

            const delayInMs = playbackTimeInSeconds * 1000;

            const timeoutId = setTimeout(() => {
                if (!isTabPlaying) return; // Don't play if stop was called

                // The actual note/chord playing logic
                if (noteData.includes(',')) { // Explicitly stored chord
                    const chordKeyIds = noteData.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
                    if (chordKeyIds.length > 0) playChord(chordKeyIds);
                } else { // Single note ID
                    const noteKeyId = parseInt(noteData.trim());
                    if (!isNaN(noteKeyId)) {
                        if (chordMode && currentChordMapSlice[noteKeyId]) {
                            playChord(currentChordMapSlice[noteKeyId]);
                        } else {
                            playSoundForKey(noteKeyId); // Otherwise, play as single note
                        }
                    }
                }
            }, delayInMs);

            tabPlaybackTimeoutIds.push(timeoutId); // Store ID to enable cancellation
        });

        // 5. Calculate loop timing
        const lastNoteTimeMs = allNotesToSchedule.reduce((max, { timingKey }) => {
            const time = timingMap[timingKey] || 0;
            return Math.max(max, time);
        }, 0) * 1000;

        // Get the beat track's duration in milliseconds. Default to 0 if not specified.
        const trackDurationMs = (trackInfo.duration || 0) * 1000;

        // The loop should wait for the longer of the two: the last note or the full beat track.
        const loopWaitTimeMs = Math.max(lastNoteTimeMs, trackDurationMs);

        // 6. Schedule the next action: either loop or stop.
        const loopTimeoutId = setTimeout(() => {
            if (isTabPlaying) { // If the user hasn't clicked "Stop TAB"
                playTabSequence(); // Recursively call to start the next loop.
            }
        }, loopWaitTimeMs + 20); // Add a small buffer for safety
        tabPlaybackTimeoutIds.push(loopTimeoutId);
    }

    function stopTabPlayback() {
        isTabPlaying = false;
        // Clear all scheduled timeouts for the sequence
        tabPlaybackTimeoutIds.forEach(id => clearTimeout(id));
        tabPlaybackTimeoutIds = []; // Reset the array

        // If the TAB feature (which implies beat sync) was enabled, stop the beat.
        if (tabFeatureEnabled) {
            console.log("TAB playback stopped, stopping associated beat.");
            stopBeatAudio(); // This will also reset currentBeatBPM
        }
        document.getElementById('play-tab-btn').textContent = 'Play TAB';
    }

    // 3. Reset TAB Fields Logic
    function resetTabFields() {
        const tabEntries = document.querySelectorAll('.tab-note-entry');
        tabEntries.forEach((entry, index) => {
            const inputWrapper = entry.querySelector('.tab-input-wrapper');
            const originalInput = inputWrapper.querySelector('.tab-note-input[data-original-input="true"]');
            const splitButton = entry.querySelector('.tab-split-btn');

            // If it's split, merge it first
            if (entry.dataset.isSplit === "true" && splitButton) {
                toggleTabInputSplit(index, splitButton); // This will remove split inputs and show original
            }
            
            // Clear the original input (which is now the only one visible)
            if (originalInput) {
                originalInput.value = "";
            }
        });
        console.log("TAB fields reset.");
    }



    // --- Sync Key Finder Logic (Unchanged - Uses Audio Element) ---
    let syncKeyFinderEnabled = false;
    let currentlyPlayingAudios = []; // Store references to currently playing Audio elements

    function setSyncKeyFinderEnabled(enabled) {
        syncKeyFinderEnabled = enabled;
        console.log(`Sync Key Finder Enabled: ${enabled}`);
    }

    function playSyncKeyAudios(syncKey) {
        if (!syncKeyFinderEnabled) {
            stopAllAudio(); // Ensure stopped if disabled
            return;
        }
        // Ensure syncKey is valid before proceeding
        if (!syncKey || typeof syncKey !== 'string') {
            console.error("Invalid key provided for sync key finder:", syncKey);
            return;
        }

        console.log(`Playing sync audio for key: ${syncKey}`);
        const folderPath = `./audio/sync-key-finder/${syncKey}/`; // Use relative path
        const manifestUrl = `${folderPath}manifest.json`;

        // Stop any currently playing sync sounds before starting new ones
        stopAllAudio();

        fetch(manifestUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Manifest not found or invalid: ${response.statusText} for ${manifestUrl}`);
                }
                return response.json();
            })
            .then(fileList => {
                if (!Array.isArray(fileList)) {
                     throw new Error(`Invalid manifest format for ${syncKey}. Expected an array.`);
                }
                const volume = document.getElementById("syncKeyVolumeControl")?.value || 1.0; // Get current volume
                fileList.forEach(file => {
                    const audio = new Audio(`${folderPath}${file}`);
                    audio.loop = true;
                    audio.volume = volume; // Set initial volume
                    currentlyPlayingAudios.push(audio); // Store reference
                    audio.play().catch(err => console.error(`Error playing sync audio ${file}:`, err)); // Play and catch errors
                });
                console.log(`Started playing ${currentlyPlayingAudios.length} sync files for ${syncKey}`);
            })
            .catch(err => console.error(`Error fetching or processing sync audio manifest for key ${syncKey}:`, err));
    }

    function stopAllAudio() {
        if (currentlyPlayingAudios.length > 0) {
            console.log(`Stopping ${currentlyPlayingAudios.length} sync audio tracks.`);
            currentlyPlayingAudios.forEach(audio => {
                if (!audio.paused) {
                    audio.pause();
                }
                audio.currentTime = 0; // Reset playback position
                // Optional: Remove event listeners if any were added to the Audio elements
                // audio.src = ''; // Helps release resources
            });
            currentlyPlayingAudios = []; // Clear the array
        }
    }

    // This function is the entry point for sync playback based on the *musical* key
    function handleKeyPress(musicalKey) {
        playSyncKeyAudios(musicalKey);
    }

    // Volume control for sync key audio
    const volumeControl = document.getElementById("syncKeyVolumeControl");
    if (volumeControl) {
        volumeControl.addEventListener("input", (event) => {
            const volume = event.target.value;
            currentlyPlayingAudios.forEach(audio => {
                audio.volume = volume; // Update volume for each currently playing audio
            });
            // Optionally save volume setting
            // updateVolumeForKey(currentKey, volume); // If you want persistent volume per key
        });
    }

    // Handling sync key finder toggle
    const syncToggle = document.getElementById("syncKeyFinderToggle");
    if (syncToggle) {
        syncToggle.addEventListener("change", (event) => {
            toggleSyncKeyFinder(event.target.checked);
        });
        // Initialize based on current checked state (e.g., if remembered)
        // setSyncKeyFinderEnabled(syncToggle.checked);
    }

    function toggleSyncKeyFinder(enabled) {
        setSyncKeyFinderEnabled(enabled);
        if (enabled) {
            // Start playing immediately for the current musical key
            handleKeyPress(currentKey);
        } else {
            stopAllAudio(); // Stop all audio immediately when unchecked
        }
    }

    // --- Initialization ---
    updateInternalMapSlices(); // Initialize map slices based on default key and offsets
    selectKey(currentKey); // Show locked keys for the initial key
    updateTransposeDisplay(); // Set initial transpose display based on current mode (single note by default)
    // Set initial chord mode button text
    const chordToggleButton = document.getElementById("chord-mode-toggle");
    if (chordToggleButton) {
        chordToggleButton.textContent = chordMode ? "Chord Mode: ON" : "Chord Mode: OFF";
    }

    // Set initial TAB feature button text
    if (tabFeatureToggle) {
        tabFeatureToggle.textContent = tabFeatureEnabled ? "Beat: ON" : "Beat: OFF";
    }

    // Setup TAB split buttons
    setupTabInputSplitters();

    // Setup Play TAB button
    document.getElementById('play-tab-btn')?.addEventListener('click', () => {
        if (isTabPlaying) stopTabPlayback();
        else playTabSequence();
    });

    // Setup Reset TAB button
    document.getElementById('reset-tab-btn')?.addEventListener('click', resetTabFields);


} // End enableChordPlaying
