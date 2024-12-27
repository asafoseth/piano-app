import { chordMaps } from './chordMapping.js'; // Import chord maps
import { transposeMaps } from './transposeMaps.js';
// import { transposeKey } from './transpose.js'; // Correct import for named export

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

    // Event listeners for key switcher buttons
    document.querySelectorAll(".key-switch-button").forEach((button) => {
        button.addEventListener("click", () => {
            const newKey = button.textContent.trim();
            console.log(`Switching to new key: ${newKey}`);
            switchKey(newKey);
        });
    });

    // Define the order of keys for transposition
    const keyOrder = ["A", "Asharp", "B", "C", "Csharp", "D", "Dsharp", "E", "F", "Fsharp", "G", "Gsharp", "A"];

    // Define the order of keys for each chord map
    const chordMapKeyOrder = {
    "C": [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    "Csharp": [1, 2, 14, 3, 4, 5, 11, 6, 7, 21, 8, 9, 10, 18, 12, 13, 15, 16, 17, 19, 20, 22, 23, 24],
    "D": [12, 13, 3, 15, 16, 17, 1, 19, 20, 8, 22, 23, 24, 6, 2, 14, 4, 5, 11, 7, 21, 9, 10, 18],
    "Dsharp": [2, 14, 15, 4, 5, 11, 12, 7, 21, 22, 9, 10, 18, 19, 13, 3, 16, 17, 1, 20, 8, 23, 24, 6],
    "E": [13, 3, 4, 16, 17, 1, 2, 20, 8, 9, 23, 24, 6, 7, 14, 15, 5, 11, 12, 21, 22, 10, 18, 19],
    "F": [14, 15, 16, 5, 11, 12, 13, 21, 22, 23, 10, 18, 19, 20, 3, 4, 17, 1, 2, 8, 9, 24, 6, 7],
    "Fsharp": [3, 4, 5, 17, 1, 2, 14, 8, 9, 10, 24, 6, 7, 21, 15, 16, 11, 12, 13, 22, 23, 18, 19, 20],
    "G": [15, 16, 17, 11, 12, 13, 3, 22, 23, 24, 18, 19, 20, 8, 4, 5, 1, 2, 14, 9, 10, 6, 7, 21],
    "Gsharp": [4, 5, 11, 1, 2, 14, 15, 9, 10, 18, 6, 7, 21, 22, 16, 17, 12, 13, 3, 23, 24, 19, 20, 8],
    "A": [16, 17, 1, 12, 13, 3, 4, 23, 24, 6, 19, 20, 8, ,9, 5, 11, 2, 14, 15, 10, 18, 7, 21, 22],
    "Asharp": [5, 11, 12, 2, 14, 15, 16, 10, 18, 19, 7, 21, 22, 23, 17, 1, 13, 3, 4, 24, 6, 20, 8, 9],
    "B": [17, 1, 2, 13, 3, 4, 5, 24, 6, 7, 20, 8, 9, 10, 11, 12, 14, 15, 16, 18, 19, 21, 22, 23]
};
    
    
    // Function to transpose the key
    function transposeKey(currentKey, offset) {
        if (!currentKey || typeof offset !== 'number') {
            console.log("Invalid parameters passed to transposeKey.");
            return null; // Handle invalid input
        }

        console.log(`Transpose called with currentKey: ${currentKey} and offset: ${offset}`);

        const currentIndex = keyOrder.indexOf(currentKey);
        if (currentIndex === -1) {
            console.log(`Invalid currentKey: ${currentKey}`);
            return null; // Exit if the key is not valid
        }

        let newIndex = (currentIndex + offset) % keyOrder.length;
        // Handle negative wrap-around (e.g., -1 from A should be G#)
        if (newIndex < 0) {
            newIndex += keyOrder.length; // Handle negative wrap-around
        }

        const transposedKey = keyOrder[newIndex];
        console.log(`Transposed key: ${transposedKey}`);

        return transposedKey;
    }

    // Function to update the current key with the new transposed key's chord map
    function updateTransposedKey(currentKey, transposeOffset) {
        console.log(`updateTransposedKey called with currentKey: ${currentKey} and transposeOffset: ${transposeOffset}`);
        
        if (!currentKey || typeof transposeOffset !== 'number') {
            console.log("Invalid parameters in updateTransposedKey.");
            return;
        }
        
        // Find the transposed key
        const transposedKey = transposeKey(currentKey, transposeOffset);
        
        if (transposedKey === null) {
            console.log("Invalid transposed key, aborting");
            return;
        }

        console.log(`Transposed from ${currentKey} to ${transposedKey}`);

        // Call switchKey with the transposed key to update the chord map
        switchKey(transposedKey);

        // Get the chord maps
        const currentChordMap = chordMaps[currentKey];
        const transposedChordMap = chordMaps[transposedKey];

        if (!currentChordMap || !transposedChordMap) {
            console.log(`Chord maps not found for one of the keys: ${currentKey} or ${transposedKey}`);
            return;
        }

        console.log(`Chord Map for ${transposedKey} (before reassignment):`, transposedChordMap);

        // Get the key order arrays
        const currentKeys = chordMapKeyOrder[currentKey];
        const transposedKeysOrder = chordMapKeyOrder[transposedKey];

        if (!currentKeys || !transposedKeysOrder) {
            console.log(`Key order not defined for current key: ${currentKey} or transposed key: ${transposedKey}`);
            return;
        }

        // Extract the lists from the transposed chord map in their defined order
        const transposedValues = transposedKeysOrder.map(key => transposedChordMap[key]);

        console.log(`Extracted lists from ${transposedKey}:`, transposedValues);

        // Assign to current chord map based on current keys' order
        currentKeys.forEach((key, index) => {
            if (transposedValues[index]) {
                currentChordMap[key] = transposedValues[index];
            } else {
                console.log(`Warning: No corresponding list for innerKey ${key} in transposed key.`);
            }
        });

        console.log(`Chord Map for ${currentKey} (after reassignment):`, currentChordMap);
        return currentChordMap;
    }

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

    // Function to update the displayed transpose value
    function updateTransposeDisplay(offset) {
        document.getElementById("transpose-value").textContent = offset;
    }

    // Add event listener for transpose buttons
    document.getElementById("transpose-increase").addEventListener("click", () => {
        transposeOffset++;
        console.log(`Transpose increased. New offset: ${transposeOffset}`);
        updateTransposeDisplay(transposeOffset); // Update the displayed value
        updateTransposedKey(currentKey,transposeOffset);
    });
    document.getElementById("transpose-decrease").addEventListener("click", () => {
        transposeOffset--;
        console.log(`Transpose decreased. New offset: ${transposeOffset}`);
        updateTransposeDisplay(transposeOffset); // Update the displayed value
        updateTransposedKey(currentKey,transposeOffset);
    });
}
