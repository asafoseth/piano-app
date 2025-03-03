import { chordMaps } from './maps/chordMapping.js'; // Import chord maps
import { keyMap } from './maps/keyMapping.js';
import { lockedKeysMap } from './maps/chordMapping.js';
import { keyValueMaps } from './maps/chordMapping.js';

/**
 * Main function to enable chord playing functionality.
 * Sets up event listeners and handles both single notes and chord mode.
 * @param {AudioContext} audioContext - Web Audio API context for managing sound.
 * @param {Object} audioFiles - Preloaded audio buffers for each key.
 */

export default function enableChordPlaying(audioContext, audioFiles) {
    const activeKeys = new Set();
    let chordMode = false; // State to track if chord mode is enabled
    let currentKey = "A"; // Default key
    let chordMap = chordMaps[currentKey][0]; // Get the "0" object (default chords) for the current key
    const allKeys = Object.keys(chordMaps); // List of all available keys
    let transposeOffset = 0; // Tracks transposition amount (semitones)

    // Log initial state
    console.log(`Initial Key: ${currentKey}`);
    console.log(`Initial Chord Map:`, chordMap);

    function getKeyValue(currentKey, keyNumber) {
        const currentKeyValueMap = keyValueMaps[currentKey] || {};
        return currentKeyValueMap[keyNumber] || ""; // Return "" if not found
    }

    function showLockedKeyLabels(currentKey) {
        const lockedKeys = lockedKeysMap[currentKey] || [];
        const keys = document.querySelectorAll(".key");
        keys.forEach((key, index) => {
            const keyIndex = index + 1; // nth-child starts at 1
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

        const selectedKeyElement = document.querySelector(`.key[data-key='${keyName}']`);
        if (selectedKeyElement) {
            selectedKeyElement.classList.add('selected-key');
        }

        showLockedKeyLabels(keyName);
    }

    function playSoundForKey(key) {
        if (audioFiles[key]) {
            Promise.all(audioFiles[key]).then(bufferList => {
                bufferList.forEach(buffer => {
                    const source = audioContext.createBufferSource();
                    source.buffer = buffer;
                    source.connect(audioContext.destination);
                    source.start(0);
                });
            }).catch(err => console.error("Error playing sound:", err));
        } else {
            console.warn(`No sound assigned for key ${key}`);
        }

        // Trigger Sync Key Finder playback
        // handleKeyPress(currentKey);
    }

    function playChord(keys) {
        console.log(`Playing chord for keys: ${keys}`);
        keys.forEach(playSoundForKey);
    }

    function addKeyVisual(keyIndex) {
        const keyElement = document.querySelector(`.key:nth-child(${keyIndex})`);
        if (keyElement) keyElement.classList.add("pressed");
    }

    function removeKeyVisual(keyIndex) {
        const keyElement = document.querySelector(`.key:nth-child(${keyIndex})`);
        if (keyElement) keyElement.classList.remove("pressed");
    }

    function toggleChordMode() {
        chordMode = !chordMode;
        const toggleButton = document.getElementById("chord-mode-toggle");
        if (toggleButton) {
            toggleButton.textContent = chordMode ? "Chord Mode: ON" : "Chord Mode: OFF";
        }
        console.log(`Chord Mode: ${chordMode ? "ON" : "OFF"}`);
    }

    function switchKey(newKey, chordIndex = 0) {
        const formattedKey = newKey.replace("#", "sharp");

        // Ensure that the key exists and has the chord map at the given index
        if (chordMaps[formattedKey] && chordMaps[formattedKey][chordIndex]) {
            currentKey = formattedKey;
            chordMap = chordMaps[currentKey][chordIndex]; // Update chordMap with the correct index

            console.log(`Switched to key: ${currentKey}`);
            console.log(`Chord Map for ${currentKey}:`, chordMap);

            selectKey(formattedKey);  // Update UI for the selected key
            handleKeyPress(currentKey); // Trigger key press (e.g., for sync key finder)
        } else {
            console.warn(`Chord map for key "${formattedKey}" at index ${chordIndex} not found.`);
            console.warn("Retaining previous key:", currentKey);
        }
    }

    // Transpose callup 
    function transpose(semitones) {
        transposeOffset += semitones; // Update transpose offset

        const newChordIndex = (transposeOffset + 12) % 12; // Correct semitone index (from -11 to +11)

        console.log(`Transposed from ${currentKey} to ${currentKey} with chord map index ${newChordIndex}`);
        console.log(chordMap);

        // Update the key while preserving key positions
        switchKey(currentKey, newChordIndex); // Pass the new chord index to switchKey

        // Update the transpose display value
        document.getElementById("transpose-value").textContent = transposeOffset; // Display current transpose offset
    }

    document.querySelectorAll(".key-switch-button").forEach((button) => {
        button.addEventListener("click", () => {
            const newKey = button.textContent.trim();
            switchKey(newKey, 0);  // Use index 0 (or pass a different index if necessary)
        });
    });

    const keys = document.querySelectorAll(".key");

    keys.forEach((keyElement, index) => {
        const keyIndex = index + 1;

        keyElement.addEventListener("touchstart", (event) => {
            event.preventDefault();
            if (audioContext.state === "suspended") audioContext.resume();

            if (!activeKeys.has(keyIndex)) {
                activeKeys.add(keyIndex);

                if (chordMode && chordMap[keyIndex]) {
                    chordMap[keyIndex].forEach(addKeyVisual);
                    playChord(chordMap[keyIndex]);
                } else {
                    addKeyVisual(keyIndex);
                    playSoundForKey(keyIndex);
                }
            }
        });

        keyElement.addEventListener("touchend", (event) => {
            event.preventDefault();
            activeKeys.delete(keyIndex);

            if (chordMode && chordMap[keyIndex]) {
                chordMap[keyIndex].forEach(removeKeyVisual);
            } else {
                removeKeyVisual(keyIndex);
            }
        });
    });

    window.addEventListener("keydown", (event) => {
        const key = keyMap[event.key.toLowerCase()];
        if (!key || activeKeys.has(key)) return;

        activeKeys.add(key);
        if (chordMode && chordMap[key]) {
            chordMap[key].forEach(addKeyVisual);
            playChord(chordMap[key]);
        } else {
            addKeyVisual(key);
            playSoundForKey(key);
        }
    });

    window.addEventListener("keyup", (event) => {
        const key = keyMap[event.key.toLowerCase()];
        if (!key) return;

        activeKeys.delete(key);
        if (chordMode && chordMap[key]) {
            chordMap[key].forEach(removeKeyVisual);
        } else {
            removeKeyVisual(key);
        }
    });

    document.getElementById("chord-mode-toggle").addEventListener("click", toggleChordMode);

    let syncKeyFinderEnabled = false;
    let currentlyPlayingAudios = []; // Store references to currently playing audio elements

    function setSyncKeyFinderEnabled(enabled) {
        syncKeyFinderEnabled = enabled;
    }

    function playSyncKeyAudios(currentKey) {
        if (!syncKeyFinderEnabled) {
            // Stop any currently playing audios when sync key finder is disabled
            stopAllAudio();
            return;
        }
        console.log(`Fetching manifest for currentKey: ${currentKey}`);
        const folderPath = `/audio/sync-key-finder/${currentKey}/`;
        fetch(`${folderPath}manifest.json`)
            .then(response => response.json())
            .then(fileList => {
                fileList.forEach(file => {
                    const audio = new Audio(`${folderPath}${file}`);
                    // Set the audio to loop indefinitely
                    audio.loop = true;
                    // Store the audio in the list
                    currentlyPlayingAudios.push(audio);
                    audio.play();
                });
            })
            .catch(err => console.error("Error fetching audio files:", err));
    }

    // Function to stop all audio immediately
    function stopAllAudio() {
        currentlyPlayingAudios.forEach(audio => {
            audio.pause();
            audio.currentTime = 0; // Reset playback position to the start
        });
        currentlyPlayingAudios = []; // Clear the list of playing audios
    }

    function handleKeyPress(currentKey) {
        playSyncKeyAudios(currentKey);
    }

    function getVolumeForKey(key) {
        const volumes = JSON.parse(localStorage.getItem('volumeSettings')) || {};
        return volumes[key] || 1.0;
    }

    function updateVolumeForKey(key, volume) {
        const volumes = JSON.parse(localStorage.getItem('volumeSettings')) || {};
        volumes[key] = volume;
        localStorage.setItem('volumeSettings', JSON.stringify(volumes));
    }

    // Volume control for sync key audio
    document.getElementById("syncKeyVolumeControl").addEventListener("input", (event) => {
        const volume = event.target.value;
        currentlyPlayingAudios.forEach(audio => {
            audio.volume = volume; // Set volume for each currently playing audio
        });
    });

    // Handling sync key finder toggle
    document.getElementById("syncKeyFinderToggle").addEventListener("change", (event) => {
        toggleSyncKeyFinder(event.target.checked);
    });

    function toggleSyncKeyFinder(enabled) {
        setSyncKeyFinderEnabled(enabled);
        if (enabled) {
            handleKeyPress(currentKey); // Start playing immediately
        } else {
            stopAllAudio(); // Stop all audio immediately when unchecked
        }
    }

    document.getElementById("transpose-up").addEventListener("click", () => transpose(1));
    document.getElementById("transpose-down").addEventListener("click", () => transpose(-1));
}
