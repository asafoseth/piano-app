import { chordMaps, SingleNoteMaps } from './maps/chordMapping.js'; // Import chord maps and single note maps
import { keyMap } from './maps/keyMapping.js';
import { lockedKeysMap } from './maps/chordMapping.js';
import { keyValueMaps } from './maps/chordMapping.js';
import { syncKeyMaps } from './maps/chordMapping.js';
import { applyInputRestrictions } from './uiRestrictions.js';

/**
 * Main function to enable chord playing functionality.
 * Sets up event listeners and handles both single notes and chord mode.
 * @param {AudioContext} audioContext - Web Audio API context for managing sound.
 * @param {Object} passedAudioBuffers - Preloaded and decoded audio buffers keyed by key number.
 */

export default function enableChordPlaying(audioContext, passedAudioBuffers) {
    // Track the last selected TAB input
    let lastSelectedTabInput = null;

    // Listen for focus on all tab-note-input fields to update lastSelectedTabInput
    document.addEventListener('focusin', (e) => {
        if (e.target && e.target.classList && e.target.classList.contains('tab-note-input')) {
            lastSelectedTabInput = e.target;
        }
    });
    // Apply UI restrictions to prevent mobile keyboard on TAB inputs
    applyInputRestrictions();

    // Store the preloaded buffers in a variable accessible within this module's scope
    const preloadedAudioBuffers = passedAudioBuffers;

    const activeKeys = new Set();
    let chordMode = false; // State to track if chord mode is enabled
    let currentKey = "C"; // Default key
    let tabFeatureEnabled = true; // Default to Beat: ON
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
                '1.0': 0.000, '1.2': 0.593, '1.5': 1.187, '1.7': 1.750, 
                '2.0': 2.343, '2.2': 2.937, '2.5': 3.500, '2.7': 4.062, 
                '3.0': 4.625, '3.2': 5.218, '3.5': 5.781, '3.7': 6.375, 
                '4.0': 6.968, '4.2': 7.531, '4.5': 8.093, '4.7': 8.687, 
                // NOTE: The timings below extend beyond the track duration of 9.21s.
                '5.0': 9.281, '5.2': 10.000, '5.5': 10.468, '5.7': 11.000, 
                '6.0': 11.656, '6.2': 12.000, '6.5': 12.843, '6.7': 13.000, 
                '7.0': 14.031, '7.2': 15.000, '7.5': 15.218, '7.7': 16.000, 
                '8.0': 16.406, '8.2': 17.000, '8.5': 17.593, '8.7': 18.000 
            }
        },
        'track2': {
            path: 'audio/beats/Track-2-113-amapiano.mp3',
            bpm: 113,
            duration: 16.9, // TODO: Replace with actual duration
            timings: { // Timings in seconds from the start of the beat
                '1.0': 0.000, '1.2': 0.562, '1.5': 1.062, '1.7': 1.593, 
                '2.0': 2.125, '2.2': 2.656, '2.5': 3.187, '2.7': 3.718, 
                '3.0': 4.250, '3.2': 4.781, '3.5': 5.312, '3.7': 5.843, 
                '4.0': 6.375, '4.2': 6.906, '4.5': 7.437, '4.7': 7.968, 
                '5.0': 8.500, '5.2': 9.031, '5.5': 9.562, '5.7': 10.093, 
                '6.0': 10.625, '6.2': 11.156, '6.5': 11.687, '6.7': 12.218, 
                '7.0': 12.750, '7.2': 13.281, '7.5': 13.812, '7.7': 14.343, 
                '8.0': 14.875, '8.2': 15.406, '8.5': 15.937, '8.7': 16.468 
            }
        },
        'track3': {
            path: 'audio/beats/Track-3-funk.mp3',
            bpm: 100,
            duration: 18.4, // TODO: Replace with actual duration
            timings: {
                '1.0': 0.000, '1.2': 0.625, '1.5': 1.218, '1.7': 1.812,
                '2.0': 2.437, '2.2': 3.031, '2.5': 3.625, '2.7': 4.218,
                '3.0': 4.812, '3.2': 5.406, '3.5': 6.031, '3.7': 6.625,
                '4.0': 7.250, '4.2': 7.843, '4.5': 8.406, '4.7': 9.000,
                '5.0': 9.593, '5.2': 10.218, '5.5': 10.812, '5.7': 11.406,
                '6.0': 12.000, '6.2': 12.625, '6.5': 13.218, '6.7': 13.812,
                '7.0': 14.406, '7.2': 15.000, '7.5': 15.625, '7.7': 16.218,
                '8.0': 16.843, '8.2': 17.437, '8.5': 18.000, '8.7': 18.593
            } // All values now strictly increasing
        },
        // 'track4': {
        //     path: 'audio/beats/Track-4-fuji.mp3',
        //     bpm: 120,
        //     duration: 15.97, // Set to actual audio duration (seconds)
        //     timings: {
        //         '1.0': 0.000, '1.5': 1.093,
        //         '2.0': 2.156, '2.5': 3.218,
        //         '3.0': 4.281, '3.5': 5.343,
        //         '4.0': 6.406, '4.5': 7.468,
        //         '5.0': 8.531, '5.5': 9.593,
        //         '6.0': 10.656, '6.5': 11.718,
        //         '7.0': 12.781, '7.5': 13.843,
        //         '8.0': 14.906, '8.5': 15.843 // Allowance before end (duration: 15.97)
        //     }
        // },
        // 'track5': {
        //     path: 'audio/beats/Track-5-highlife.mp3',
        //     bpm: 115,
        //     duration: 17.65, // Set to actual audio duration (seconds)
        //     timings: {
        //         '1.0': 0.000, '1.5': 1.187,
        //         '2.0': 2.375, '2.5': 3.562,
        //         '3.0': 4.750, '3.5': 5.906,
        //         '4.0': 7.093, '4.5': 8.250,
        //         '5.0': 9.437, '5.5': 10.625,
        //         '6.0': 11.781, '6.5': 12.968,
        //         '7.0': 14.156, '7.5': 15.312,
        //         '8.0': 16.500, '8.5': 16.900 // Allowance before end (duration: 17.65)
        //     }
        // }
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

    // --- Fix: Clear visuals and state on transpose change in chord mode ---
    function clearPressedKeysAndState() {
        // Remove .pressed from all keys, not just those in activeKeys
        document.querySelectorAll('.key.pressed').forEach(key => {
            key.classList.remove('pressed');
        });
        activeKeys.clear();
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
        clearPressedKeysAndState();
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

    // --- Patch: Also clear visuals and state on transpose in chord mode ---
    function transpose(amount) {
        clearPressedKeysAndState();
        if (chordMode) {
            transposeOffset = (transposeOffset + amount + 12) % 12;
            updateInternalMapSlices();
            updateTransposeDisplay();
        } else {
            singleNoteTransposeOffset = (singleNoteTransposeOffset + amount + 12) % 12;
            updateInternalMapSlices();
            updateTransposeDisplay();
        }
    }
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

        // Switch off the 'enable sing key' button if it's on
        const syncToggle = document.getElementById("syncKeyFinderToggle");
        if (syncToggle && syncToggle.checked) {
            syncToggle.checked = false;
            toggleSyncKeyFinder(false);
        }

        updateSyncKey(); // Update Sync Key playback on transpose
    }

     // --- Event Listeners ---
    // Key Switcher Select Element
    const keySwitcherSelect = document.getElementById("key-switcher-select");
    if (keySwitcherSelect) {
        keySwitcherSelect.addEventListener("change", (event) => {
            const newKey = event.target.value;
            // Always reset transpose offsets to 0 when key is changed via select
            transposeOffset = 0;
            singleNoteTransposeOffset = 0;
            switchKey(newKey);
            updateTransposeDisplay();
            // Disable 'Enable Sing Key' when key is changed
            const syncToggle = document.getElementById("syncKeyFinderToggle");
            if (syncToggle && syncToggle.checked) {
                syncToggle.checked = false;
                if (typeof toggleSyncKeyFinder === 'function') toggleSyncKeyFinder(false);
            }
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

        // Only prevent default if we're actually touching a piano key
        // This allows pinch-zoom on other parts of the app
        event.preventDefault(); // Prevent default touch actions like scrolling on piano keys
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
                let notesToAdd = [];
                if (chordMode) {
                    const chordNotesToPlay = currentChordMapSlice[keyIndex];
                    if (chordNotesToPlay && chordNotesToPlay.length > 0) {
                        notesToAdd = chordNotesToPlay.map(n => n.toString());
                    } else {
                        notesToAdd = [keyIndex.toString()];
                    }
                } else {
                    const singleNoteMapping = currentSingleNoteMapSlice[keyIndex];
                    if (singleNoteMapping && singleNoteMapping.length > 0) {
                        notesToAdd = [singleNoteMapping[0].toString()];
                    } else {
                        notesToAdd = [keyIndex.toString()];
                    }
                }
                // Append new notes to the field, comma-separated, avoiding duplicates
                let currentVal = focusedElement.value.trim();
                let currentNotes = currentVal ? currentVal.split(',').map(s => s.trim()).filter(Boolean) : [];
                notesToAdd.forEach(note => {
                    if (!currentNotes.includes(note)) currentNotes.push(note);
                });
                focusedElement.value = currentNotes.join(',');
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

    // Reset all key visuals to original color on any key release
    function resetAllKeyVisuals() {
        document.querySelectorAll('.key.pressed').forEach(key => key.classList.remove('pressed'));
    }

    const handleInteractionEnd = (event) => {
        resetAllKeyVisuals();
        // ...existing code for event handling (optional: can remove visuals per key if needed)...
        const keyElement = event.target.closest('.key');
        if (!keyElement) return;
        event.preventDefault();
        const keyIndex = parseInt(keyElement.getAttribute("data-key"));
        if (isNaN(keyIndex)) return;
        if (activeKeys.has(keyIndex)) {
            activeKeys.delete(keyIndex);
        }
    };
    // --- End Updated Interaction Handlers ---


    // --- Attach Listeners to Piano Container ---

    // --- Piano Roll Effect: Track mouse/touch drag across keys ---
    let isMouseDown = false;
    let lastKeyIndex = null;

    function handleRollOver(event) {
        let keyElement = event.target.closest('.key');
        if (!keyElement) return;
        const keyIndex = parseInt(keyElement.getAttribute("data-key"));
        if (isNaN(keyIndex)) return;
        if (!activeKeys.has(keyIndex)) {
            // Remove visual from last key if different
            if (lastKeyIndex !== null && lastKeyIndex !== keyIndex) {
                removeKeyVisual(lastKeyIndex);
                activeKeys.delete(lastKeyIndex);
            }
            activeKeys.add(keyIndex);
            addKeyVisual(keyIndex);
            if (chordMode) {
                const chordNotesToPlay = currentChordMapSlice[keyIndex];
                if (chordNotesToPlay && chordNotesToPlay.length > 0) {
                    playChord(chordNotesToPlay);
                    chordNotesToPlay.forEach(note => { if (note !== keyIndex) addKeyVisual(note); });
                } else {
                    playSoundForKey(keyIndex);
                }
            } else {
                const singleNoteMapping = currentSingleNoteMapSlice[keyIndex];
                if (singleNoteMapping && singleNoteMapping.length > 0) {
                    playSoundForKey(singleNoteMapping[0]);
                } else {
                    playSoundForKey(keyIndex);
                }
            }
        }
        lastKeyIndex = keyIndex;
    }

    pianoContainer.addEventListener("mousedown", (e) => {
        isMouseDown = true;
        handleInteractionStart(e);
    });
    pianoContainer.addEventListener("mouseup", (e) => {
        isMouseDown = false;
        handleInteractionEnd(e);
        lastKeyIndex = null;
        // Reset all visuals and state for next roll
        resetAllKeyVisuals();
        activeKeys.clear();
    });
    pianoContainer.addEventListener("mouseleave", (event) => {
        isMouseDown = false;
        lastKeyIndex = null;
        if (event.buttons === 1) {
            activeKeys.forEach(pkIndex => {
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
    pianoContainer.addEventListener("mousemove", (e) => {
        if (isMouseDown) {
            handleRollOver(e);
        }
    });

    // Touch support for piano roll - Allow pinch-zoom on non-piano areas
    let isTouchDown = false;
    pianoContainer.addEventListener("touchstart", (e) => {
        // Check if touch is on a piano key
        const keyElement = e.target.closest('.key');
        if (keyElement) {
            // Only handle piano key touches, allow pinch-zoom elsewhere
            isTouchDown = true;
            handleInteractionStart(e);
        }
    }, { passive: true }); // Use passive: true to allow pinch-zoom
    pianoContainer.addEventListener("touchend", (e) => {
        isTouchDown = false;
        handleInteractionEnd(e);
        lastKeyIndex = null;
        // Reset all visuals and state for next roll
        resetAllKeyVisuals();
        activeKeys.clear();
    });
    pianoContainer.addEventListener("touchcancel", (e) => {
        isTouchDown = false;
        handleInteractionEnd(e);
        lastKeyIndex = null;
    });
    pianoContainer.addEventListener("touchmove", (e) => {
        if (!isTouchDown) return;
        // Find the touch point under the finger
        let touch = e.touches[0];
        if (!touch) return;
        let elem = document.elementFromPoint(touch.clientX, touch.clientY);
        if (!elem) return;
        let keyElem = elem.closest('.key');
        if (keyElem) {
            // Synthesize a fake event for handleRollOver
            handleRollOver({ target: keyElem });
        }
    });

    // Touch Listeners - Selective handling for piano keys only
    // Note: Piano key touch handling is already set up above with selective event handling
    // These additional listeners are for touch end/cancel events
    pianoContainer.addEventListener("touchend", (e) => {
        if (isTouchDown) {
            isTouchDown = false;
            handleInteractionEnd(e);
            lastKeyIndex = null;
            resetAllKeyVisuals();
            activeKeys.clear();
        }
    }, { passive: true });
    
    pianoContainer.addEventListener("touchcancel", (e) => {
        if (isTouchDown) {
            isTouchDown = false;
            handleInteractionEnd(e);
            lastKeyIndex = null;
            resetAllKeyVisuals();
            activeKeys.clear();
        }
    }, { passive: true });

    // --- End Listener Attachments ---

    // --- Sticky Key Prevention: Global Release on Blur/Focus Loss ---
    function clearAllActiveKeysAndVisuals() {
        // Remove visuals for all currently active keys
        activeKeys.forEach(pkIndex => {
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

    // Listen for window blur (user switches tab/app) and forcibly clear all keys
    window.addEventListener('blur', clearAllActiveKeysAndVisuals);
    // Listen for document visibility change (user switches tab/app)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') {
            clearAllActiveKeysAndVisuals();
        }
    });
    // Listen for focusout on the window (e.g., user clicks away)
    window.addEventListener('focusout', clearAllActiveKeysAndVisuals);


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
            let notesToAdd = [];
            if (chordMode) {
                const chordNotesToPlay = currentChordMapSlice[keyMapped];
                if (chordNotesToPlay && chordNotesToPlay.length > 0) {
                    notesToAdd = chordNotesToPlay.map(n => n.toString());
                } else {
                    notesToAdd = [keyMapped.toString()];
                }
            } else {
                const singleNoteMapping = currentSingleNoteMapSlice[keyMapped];
                if (singleNoteMapping && singleNoteMapping.length > 0) {
                    notesToAdd = [singleNoteMapping[0].toString()];
                } else {
                    notesToAdd = [keyMapped.toString()];
                }
            }
            // Append new notes to the field, comma-separated, avoiding duplicates
            let currentVal = focusedElement.value.trim();
            let currentNotes = currentVal ? currentVal.split(',').map(s => s.trim()).filter(Boolean) : [];
            notesToAdd.forEach(note => {
                if (!currentNotes.includes(note)) currentNotes.push(note);
            });
            focusedElement.value = currentNotes.join(',');
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
        resetAllKeyVisuals();
        const keyMapped = keyMap[event.key.toLowerCase()];
        if (!keyMapped || !activeKeys.has(keyMapped)) return;
        activeKeys.delete(keyMapped);
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
    // Set initial button text to match default state
    if (tabFeatureToggle) {
        tabFeatureToggle.textContent = "Beat: ON";
    }

    // Set default state to Beat: ON on page load
    if (tabFeatureToggle) {
        tabFeatureToggle.textContent = "Beat: ON";
    }

    if (tabFeatureToggle) {
        tabFeatureToggle.addEventListener("click", () => {
            tabFeatureEnabled = !tabFeatureEnabled;
            tabFeatureToggle.textContent = tabFeatureEnabled ? "Beat: ON" : "Beat: OFF";
            console.log(`TAB Feature (Beat): ${tabFeatureEnabled ? "ON" : "OFF"}`);
            // Do not start or stop the beat here. Only toggle the state and update the button text.
        });
    }

    if (beatTrackSelect) {
        beatTrackSelect.addEventListener("change", (event) => {
            // Stop both beat and tab playback if either is playing when a new track is selected
            if (isTabPlaying) {
                stopTabPlayback();
            } else {
                stopBeatAudio();
            }
            // Do not play the beat here. Only update selection.
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
            input1.readOnly = true; // Prevent keyboard popup
            // input1.value = originalValue; // Optionally prefill, or clear

            const input2 = document.createElement('input');
            input2.type = 'text';
            input2.classList.add('tab-note-input', 'split');
            input2.placeholder = `Note ${entryIndex + 1}.2`;
            input2.dataset.splitPart = "2";
            input2.readOnly = true; // Prevent keyboard popup

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
        tabPlaybackTimeoutIds.forEach(id => clearTimeout(id));
        tabPlaybackTimeoutIds = [];

        if (!isTabPlaying) {
            isTabPlaying = true;
            document.getElementById('play-tab-btn').textContent = 'Stop TAB';
            console.log("Starting TAB sequence (first cycle).");
            // Disable 'Enable Sing Key' when Play TAB starts
            const syncToggle = document.getElementById("syncKeyFinderToggle");
            if (syncToggle && syncToggle.checked) {
                syncToggle.checked = false;
                if (typeof toggleSyncKeyFinder === 'function') toggleSyncKeyFinder(false);
            }
        } else {
            console.log("Looping TAB sequence.");
        }

        const selectedTrackId = beatTrackSelect?.value || 'track1';
        const trackInfo = beatTrackMap[selectedTrackId];
        if (!trackInfo || !trackInfo.timings || Object.keys(trackInfo.timings).length === 0) {
            console.error(`Selected track "${selectedTrackId}" has no timing map defined. Stopping playback.`);
            alert(`Playback failed: No timing map for ${selectedTrackId}.`);
            stopTabPlayback();
            return;
        }
        const timingKeys = Object.keys(trackInfo.timings);
        const timingMap = trackInfo.timings;

        // --- NEW: Start the beat track in sync ---
        if (tabFeatureEnabled) {
            await playBeatTrack(selectedTrackId);
        }

        // Get TAB field values
        const tabEntries = document.querySelectorAll('.tab-note-entry');
        const tabValues = Array.from(tabEntries).map(entry => {
            const input = entry.querySelector('.tab-note-input');
            return input ? input.value.trim() : "";
        });

        // Schedule highlight for all 16 tabs (first and second cycle), regardless of noteValue
        for (let i = 0; i < 16; i++) {
            const noteValue = tabValues[i];
            const timingKey = timingKeys[i];
            if (timingMap[timingKey] !== undefined) {
                const delayMs = timingMap[timingKey] * 1000;
                tabPlaybackTimeoutIds.push(setTimeout(() => {
                    highlightTabEntry(i);
                    playTabNote(noteValue);
                }, delayMs));
            }
        }
        for (let i = 0; i < 16; i++) {
            const noteValue = tabValues[i];
            const timingKey = timingKeys[i + 16];
            if (timingMap[timingKey] !== undefined) {
                const delayMs = timingMap[timingKey] * 1000;
                tabPlaybackTimeoutIds.push(setTimeout(() => {
                    highlightTabEntry(i);
                    playTabNote(noteValue);
                }, delayMs));
            }
        }

        // Remove highlight after each step (optional, for visual clarity)
        function highlightTabEntry(index) {
            const tabEntries = document.querySelectorAll('.tab-note-entry');
            tabEntries.forEach((entry, idx) => {
                if (idx === index) {
                    entry.classList.add('tab-highlight');
                } else {
                    entry.classList.remove('tab-highlight');
                }
            });
        }

        // --- Loop logic: restart both TAB and beat for sync ---
        let loopWaitMs = (trackInfo.duration || 0) * 1000;
        if (["track3", "track4", "track5"].includes(selectedTrackId)) {
            loopWaitMs += 800;
        }
        const loopTimeoutId = setTimeout(async () => {
            if (isTabPlaying) {
                // Restart beat for perfect sync
                if (tabFeatureEnabled) {
                    await playBeatTrack(selectedTrackId);
                }
                playTabSequence();
            }
        }, loopWaitMs);
        tabPlaybackTimeoutIds.push(loopTimeoutId);
    }

    // Helper to play a note or chord
    function playTabNote(noteValue) {
        if (!isTabPlaying) return;
        if (noteValue.includes(',')) {
            const chordKeyIds = noteValue.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
            if (chordKeyIds.length > 0) playChord(chordKeyIds);
        } else {
            const noteKeyId = parseInt(noteValue.trim());
            if (!isNaN(noteKeyId)) {
                if (chordMode && currentChordMapSlice[noteKeyId]) {
                    playChord(currentChordMapSlice[noteKeyId]);
                } else {
                    playSoundForKey(noteKeyId);
                }
            }
        }
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

    function getTabFieldTimingKeys(entryIndex) {
        const beatNum = Math.floor(entryIndex / 2) + 1; // 1 to 8
        const suffixes = (entryIndex % 2 === 0) ? ['.0', '.2'] : ['.5', '.7'];
        return suffixes.map(suffix => `${beatNum}${suffix}`);
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
        // NEW: Construct the direct audio file path (assuming .mp3 extension)
        const audioFilePath = `./audio/sing-key-audio/${syncKey}.mp3`;

        // Stop any currently playing sync sounds before starting new ones
        stopAllAudio();

        // Retrieve the saved volume for this specific key from localStorage.
        // The key `volume_sing_key_${syncKey}` is set by sync-key-vol.html.
        const savedVolume = parseFloat(localStorage.getItem(`volume_sing_key_${syncKey}`)) || 1.0;
        console.log(`Applying saved volume for ${syncKey}: ${savedVolume}`);

        // Directly create and play the single audio file with its saved volume.
        const audio = new Audio(audioFilePath);
        audio.loop = true;
        audio.volume = savedVolume; // Set volume from localStorage
        currentlyPlayingAudios.push(audio); // Store reference
        audio.play().catch(err => console.error(`Error playing sync audio ${audioFilePath}:`, err)); // Play and catch errors

        console.log(`Started playing single sync file for ${syncKey}: ${audioFilePath}`);
    }

    function stopAllAudio() {
        if (currentlyPlayingAudios.length > 0) {
            console.log(`Stopping ${currentlyPlayingAudios.length} sync audio tracks with fade out.`);
            currentlyPlayingAudios.forEach(audio => {
                if (!audio.paused) {
                    // Fade out over 0.7 seconds
                    let fadeDuration = 700; // ms
                    let fadeSteps = 14;
                    let stepTime = fadeDuration / fadeSteps;
                    let originalVolume = audio.volume;
                    let step = 0;
                    let fadeInterval = setInterval(() => {
                        step++;
                        audio.volume = Math.max(0, originalVolume * (1 - step / fadeSteps));
                        if (step >= fadeSteps) {
                            clearInterval(fadeInterval);
                            audio.pause();
                            audio.currentTime = 0;
                            audio.volume = originalVolume; // Reset for next play
                        }
                    }, stepTime);
                } else {
                    audio.currentTime = 0;
                }
                // Optional: Remove event listeners if any were added to the Audio elements
                // audio.src = '';
            });
            currentlyPlayingAudios = [];
        }
    }

    // This function is the entry point for sync playback based on the *musical* key
    function handleKeyPress(musicalKey) {
        playSyncKeyAudios(musicalKey);
    }

    // The global volume control for sync key audio is now effectively deprecated.
    // Volume is controlled on a per-key basis from sync-key-vol.html.
    // This listener will no longer affect the volume of sync key audio.
    const volumeControl = document.getElementById("syncKeyVolumeControl");
    if (volumeControl) {
        volumeControl.addEventListener("input", (event) => {
            // This no longer controls the volume of sync audio, as it's loaded from localStorage.
            // To avoid confusion, this logic is now inert for sync audio.
            console.warn("The global syncKeyVolumeControl no longer adjusts per-key sync audio volume.");
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
            // Always use the current key and transpose offset at the time of enabling
            let syncKeyToPlay = syncKeyMaps[currentKey]?.[chordMode ? transposeOffset : singleNoteTransposeOffset] || currentKey;
            handleKeyPress(syncKeyToPlay);
        } else {
            stopAllAudio(); // Stop all audio immediately when unchecked
        }
    }

    function updateSyncKey() {
        if (syncKeyFinderEnabled) {
            stopAllAudio();
            let newSyncKey = syncKeyMaps[currentKey]?.[chordMode ? transposeOffset : singleNoteTransposeOffset] || currentKey;
            // Save the last used key and offset for toggling
            lastSyncKey = currentKey;
            lastSyncOffset = chordMode ? transposeOffset : singleNoteTransposeOffset;
            handleKeyPress(newSyncKey);
        } else {
            stopAllAudio();
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

    document.getElementById('delete-tab-btn')?.addEventListener('click', () => {
        // Use the last selected TAB input, fallback to currently focused
        let targetInput = lastSelectedTabInput;
        if (!targetInput || !document.body.contains(targetInput)) {
            // fallback to currently focused
            if (document.activeElement && document.activeElement.classList.contains('tab-note-input')) {
                targetInput = document.activeElement;
            }
        }
        if (targetInput && targetInput.classList.contains('tab-note-input')) {
            const entryDiv = targetInput.closest('.tab-note-entry');
            if (entryDiv) {
                entryDiv.querySelectorAll('.tab-note-input').forEach(input => {
                    input.value = "";
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                });
            }
        }
    });
} // End enableChordPlaying
