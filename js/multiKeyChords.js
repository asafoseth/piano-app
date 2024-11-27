export default function enableChordPlaying(audioContext, audioFiles) {
    const activeKeys = new Set();
    let chordMode = false; // State to track if chord mode is enabled

    // Map physical keys to piano keys, including 12 invisible bass keys
    const keyMap = {
        q: 1, w: 2, e: 3, r: 4, t: 5, y: 6, u: 7, i: 8, o: 9, p: 10,
        a: 11, s: 12, d: 13, f: 14, g: 15, h: 16, j: 17, k: 18, l: 19,
        z: 20, x: 21, c: 22, v: 23, b: 24,
        // Invisible bass keys
        '1': 25, '2': 26, '3': 27, '4': 28, '5': 29, '6': 30,
        '7': 31, '8': 32, '9': 33, '0': 34, '-': 35, '=': 36
    };

    // Predefined chords for chord mode
    const chordMap = {
        11: [18, 20, 22, 30],
        12: [16, 19, 21, 31],
        13: [17, 20, 22, 32], 
        14: [16, 18, 21, 33],
        15: [17, 19, 22, 34], 
        16: [16, 18, 20, 35], 
        17: [17, 19, 8, 36], 
        18: [18, 20, 22, 30], 
        19: [16, 19, 21, 31], 
        20: [17, 20, 22, 32], 
        21: [16, 18, 21, 33], 
        22: [17, 19, 22, 34],
    };

    // Play the sound for a given key
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
        keys.forEach(playSoundForKey);
    }

    // Add visual indication
    function addKeyVisual(keyIndex) {
        const keyElement = document.querySelector(`.key:nth-child(${keyIndex})`);
        if (keyElement) keyElement.classList.add("pressed");
    }

    function removeKeyVisual(keyIndex) {
        const keyElement = document.querySelector(`.key:nth-child(${keyIndex})`);
        if (keyElement) keyElement.classList.remove("pressed");
    }

    // Toggle chord mode
    function toggleChordMode() {
        chordMode = !chordMode;
        const toggleButton = document.getElementById("chord-mode-toggle");
        if (toggleButton) {
            toggleButton.textContent = chordMode ? "Chord Mode: ON" : "Chord Mode: OFF";
        }
    }

    // Create a toggle button for chord mode
    function createToggleButton() {
        const toggleButton = document.createElement("button");
        toggleButton.id = "chord-mode-toggle";
        toggleButton.textContent = "Chord Mode: OFF";
        toggleButton.style.position = "fixed";
        toggleButton.style.bottom = "20px";
        toggleButton.style.right = "20px";
        toggleButton.style.zIndex = "1000";
        toggleButton.style.padding = "10px 20px";
        toggleButton.style.backgroundColor = "#ff7f50";
        toggleButton.style.color = "white";
        toggleButton.style.border = "none";
        toggleButton.style.borderRadius = "5px";
        toggleButton.style.cursor = "pointer";
        toggleButton.addEventListener("click", toggleChordMode);
        document.body.appendChild(toggleButton);
    }

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
        if (key) {
            activeKeys.delete(key);

            if (chordMode && chordMap[key]) {
                chordMap[key].forEach(removeKeyVisual);
            } else {
                removeKeyVisual(key);
            }
        }
    });

    // Handle touch events for touchscreens
    const keys = document.querySelectorAll(".key");

    keys.forEach((keyElement, index) => {
        const keyIndex = index + 1;

        keyElement.addEventListener("touchstart", (event) => {
            event.preventDefault(); // Prevent scrolling during touch
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

    // Create the toggle button on initialization
    createToggleButton();
}
