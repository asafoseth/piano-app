import { chordMaps } from './maps/chordMapping.js'; // Import chord maps
import { keyMap } from './maps/keyMapping.js';
import { chordMapKeyOrder } from './maps/chordMapping.js';
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
    let chordMap = chordMaps[currentKey]; // Get the current chord map
    const allKeys = Object.keys(chordMaps); // List of all available keys
    let transposeOffset = 0; // Tracks transposition amount (semitones)

    // Log initial state
    console.log(`Initial Key: ${currentKey}`);
    console.log(`Initial Chord Map:`, chordMap);

    function getKeyValue(currentKey, keyNumber) {
        const currentKeyValueMap = keyValueMaps[currentKey] || {};
        return currentKeyValueMap[keyNumber] || ""; // Return "" if not found
    }

    // Function to display locked key labels
    function showLockedKeyLabels(currentKey) {
        const lockedKeys = lockedKeysMap[currentKey] || [];
        
        // Loop through all keys and add a "locked" visual to those in the lockedKeys list
        const keys = document.querySelectorAll(".key");
        keys.forEach((key, index) => {
            const keyIndex = index + 1; // nth-child starts at 1
            if (lockedKeys.includes(keyIndex)) {
                const keyValue = getKeyValue(currentKey, keyIndex); // Get the corresponding value for the current key
                key.classList.add("locked");
                key.textContent = keyValue; // Example label
            } else {
                key.classList.remove("locked");
                key.textContent = ""; // Clear any previous labels
            }
        });
    }
    

    // Function to clear locked key labels
    function clearLockedKeyLabels() {
        const labels = document.querySelectorAll('.key-label');
        labels.forEach(label => label.remove());

        const lockedKeys = document.querySelectorAll('.locked-key');
        lockedKeys.forEach(key => key.classList.remove('locked-key'));
    }

    // Function to update visuals when selecting a key
    function selectKey(keyName) {
        // Highlight the selected key (optional)
        document.querySelectorAll('.key').forEach(key => {
            key.classList.remove('selected-key');
        });

        const selectedKeyElement = document.querySelector(`.key[data-key='${keyName}']`);
        if (selectedKeyElement) {
            selectedKeyElement.classList.add('selected-key');
        }

        // Show locked keys for the selected key
        showLockedKeyLabels(keyName);
    }

    /**
     * Plays the sound associated with a given key.
     * @param {number} key - Index of the sound to play.
     */
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

    /**
     * Toggles chord mode on or off and updates the UI.
     */
    function toggleChordMode() {
        chordMode = !chordMode;
        const toggleButton = document.getElementById("chord-mode-toggle");
        if (toggleButton) {
            toggleButton.textContent = chordMode ? "Chord Mode: ON" : "Chord Mode: OFF";
        }
        console.log(`Chord Mode: ${chordMode ? "ON" : "OFF"}`);
    }

    /**
     * Switches to a new key and updates the chord map.
     * Ensures the new key exists in chordMaps and is valid.
     * @param {string} newKey - Name of the new key (e.g., "C#", "D").
     */
    function switchKey(newKey) {
        const formattedKey = newKey.replace("#", "sharp");

        if (chordMaps[formattedKey]) {
            currentKey = formattedKey;
            chordMap = chordMaps[currentKey];
            console.log(`Switched to key: ${currentKey}`);
            console.log(`Chord Map for ${currentKey}:`, chordMap);

            // Update visuals for the new key
            selectKey(formattedKey);
        } else {
            console.warn(`Chord map for key "${formattedKey}" not found.`);
            console.warn("Retaining previous key:", currentKey);
        }
    }

    // Event listeners for key switcher buttons
    document.querySelectorAll(".key-switch-button").forEach((button) => {
        button.addEventListener("click", () => {
            const newKey = button.textContent.trim();
            console.log(`Switching to new key: ${newKey}`);
            switchKey(newKey);
        });
    });

    // Handle touch events for touchscreens
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

    // Handle keyboard events
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

    // Add event listener for the chord mode toggle button
    document.getElementById("chord-mode-toggle").addEventListener("click", toggleChordMode);
}
