export default function enableChordPlaying(audioContext, audioFiles) {
    const activeKeys = new Set();

    // Map physical keys to piano keys
    const keyMap = {
        q: 1, w: 2, e: 3, r: 4, t: 5, y: 6, u: 7, i: 8, o: 9, p: 10,
        a: 11, s: 12, d: 13, f: 14, g: 15, h: 16, j: 17, k: 18, l: 19,
        z: 20, x: 21, c: 22, v: 23, b: 24
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

    // Add visual indication
    function addKeyVisual(keyIndex) {
        const keyElement = document.querySelector(`.key:nth-child(${keyIndex})`);
        if (keyElement) keyElement.classList.add("pressed");
    }

    function removeKeyVisual(keyIndex) {
        const keyElement = document.querySelector(`.key:nth-child(${keyIndex})`);
        if (keyElement) keyElement.classList.remove("pressed");
    }

    // Handle keyboard events
    window.addEventListener("keydown", (event) => {
        const key = keyMap[event.key.toLowerCase()];
        if (!key || activeKeys.has(key)) return;

        activeKeys.add(key);
        addKeyVisual(key);
        playSoundForKey(key);
    });

    window.addEventListener("keyup", (event) => {
        const key = keyMap[event.key.toLowerCase()];
        if (key) {
            activeKeys.delete(key);
            removeKeyVisual(key);
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
                addKeyVisual(keyIndex);
                playSoundForKey(keyIndex);
            }
        });

        keyElement.addEventListener("touchend", (event) => {
            event.preventDefault();
            activeKeys.delete(keyIndex);
            removeKeyVisual(keyIndex);
        });
    });
}
