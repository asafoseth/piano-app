import { chordMaps } from './chordMapping.js'; // Import chord maps

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

    // Log initial state
    console.log(`Initial Key: ${currentKey}`);
    console.log(`Initial Chord Map:`, chordMap);

    // Map physical keys to piano keys, including 12 invisible bass keys
    const keyMap = {
        q: 1, w: 2, e: 3, r: 4, t: 5, y: 6, u: 7, i: 8, o: 9, p: 10,
        a: 11, s: 12, d: 13, f: 14, g: 15, h: 16, j: 17, k: 18, l: 19,
        z: 20, x: 21, c: 22, v: 23, b: 24,
        // Invisible bass keys
        '1': 25, '2': 26, '3': 27, '4': 28, '5': 29, '6': 30,
        '7': 31, '8': 32, '9': 33, '0': 34, '-': 35, '=': 36
    };

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
    }

    /**
     * Switches to a new key and updates the chord map.
     * Ensures the new key exists in chordMaps and is valid.
     * @param {string} newKey - Name of the new key (e.g., "C#", "D").
     */
    function switchKey(newKey) {
        // Ensure consistent key format (e.g., replace "#" with "sharp")
        const formattedKey = newKey.replace("#", "sharp");

        if (chordMaps[formattedKey]) {
            currentKey = formattedKey;
            chordMap = chordMaps[currentKey];
            console.log(`Switched to key: ${currentKey}`);
            console.log(`Chord Map for ${currentKey}:`, chordMap);
        } else {
            console.warn(`Chord map for key "${formattedKey}" not found.`);
            console.warn("Retaining previous key:", currentKey);
        }
    }

    // Add event listeners to key switcher buttons
    document.querySelectorAll(".key-switch-button").forEach((button) => {
        button.addEventListener("click", () => {
            const newKey = button.textContent.trim();
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
