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

    // Map beat track IDs to file paths
    const beatTrackMap = {
        'track1': 'audio/beats/Track-1-104-trap.mp3',
        'track2': 'audio/beats/Track-2-113-amapiano.mp3',
        'track3': 'audio/beats/Track-3-funk.mp3',
        'track4': 'audio/beats/Track-4-fuji.mp3',
        'track5': 'audio/beats/Track-5-highlife.mp3',
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
        }
    }

    async function playBeatTrack(trackId) {
        if (!tabFeatureEnabled) {
            console.log("TAB feature is OFF, not playing beat.");
            stopBeatAudio();
            return;
        }

        const filePath = beatTrackMap[trackId];
        if (!filePath) {
            console.warn(`No audio file mapped for beat track ID: ${trackId}`);
            stopBeatAudio();
            return;
        }

        console.log(`Preparing to play beat track (Web Audio): ${filePath}`);
        stopBeatAudio(); // Stop any existing beat before starting a new one

        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for ${filePath}`);
            }
            const arrayBuffer = await response.arrayBuffer();

            // Ensure audioContext is running
            if (audioContext.state === "suspended") {
                await audioContext.resume();
            }

            audioContext.decodeAudioData(arrayBuffer, (decodedBuffer) => {
                if (!tabFeatureEnabled) {
                    console.log("Beat feature was disabled during audio decoding. Not playing.");
                    return; // Don't start if the feature was turned off
                }
                // If another beat request came in and stopped this one, currentBeatSourceNode might have been cleared
                // or replaced. This new source will become the current one.
                const source = audioContext.createBufferSource();
                source.buffer = decodedBuffer;
                source.loop = true;
                source.connect(audioContext.destination);
                source.start(0);

                currentBeatSourceNode = source; // Assign the new source
                console.log(`Successfully started playing beat track (Web Audio): ${filePath}`);

            }, (decodeError) => {
                console.error(`Error decoding audio data for ${filePath}:`, decodeError);
            });

        } catch (error) {
            console.error(`Error fetching or processing beat track ${filePath}:`, error);
        }
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


} // End enableChordPlaying
