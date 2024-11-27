import enableChordPlaying from './multiKeyChords.js';

document.addEventListener("DOMContentLoaded", () => {
    const pianoContainer = document.getElementsByClassName("piano-container")[0];

    if (!pianoContainer) {
        console.error("Piano container not found");
        return;
    }

    // Define base paths for different types of sounds
    const basePaths = {
        piano: "./audio/", // Base path for regular piano sounds
        bass: "./Bass/"    // Base path for bass sounds
    };

    const audioContext = new (window.AudioContext || window.webkitAudioContext)(); // Web Audio API context

    // Add Accompaniment Toggle Button
    const accompanimentToggle = document.createElement("button");
    accompanimentToggle.textContent = "Accompaniment OFF";
    accompanimentToggle.classList.add("accompaniment-toggle");
    document.body.appendChild(accompanimentToggle);

    let isAccompanimentOn = false;

    // Toggle accompaniment state
    accompanimentToggle.addEventListener("click", () => {
        isAccompanimentOn = !isAccompanimentOn;
        accompanimentToggle.textContent = isAccompanimentOn ? "Accompaniment ON" : "Accompaniment OFF";
    });

    // Define sounds for each key with dynamic paths
    const keySounds = {
        1: ["1CCPiano.mp3"], 2: ["2DDPiano.mp3"], 3: ["3FFPiano.mp3"], 4: ["4GGPiano.mp3"],
        5: ["5AAPiano.mp3"], 6: ["6CCPiano.mp3"], 7: ["7DDPiano.mp3"], 8: ["8FFPiano.mp3"],
        9: ["9GGPiano.mp3"], 10: ["10AAPiano.mp3"], 11: ["11CPiano.mp3"], 12: ["12DPiano.mp3"],
        13: ["13EPiano.mp3"], 14: ["14FPiano.mp3"], 15: ["15GPiano.mp3"], 16: ["16APiano.mp3"],
        17: ["17BPiano.mp3"], 18: ["18CPiano.mp3"], 19: ["19DPiano.mp3"], 20: ["20EPiano.mp3"],
        21: ["21FPiano.mp3"], 22: ["22GPiano.mp3"], 23: ["23APiano.mp3"], 24: ["24BPiano.mp3"],
        25: ["1CC6bass.mp3"], 26: ["2DD7bass.mp3"], 27: ["3FF8bass.mp3"], 28: ["4GG9bass.mp3"],
        29: ["5AA10bass.mp3"], 30: ["11C18bass.mp3"], 31: ["12D19bass.mp3"], 32: ["13E20bass.mp3"],
        33: ["14F21bass.mp3"], 34: ["15G22bass.mp3"], 35: ["16A23bass.mp3"], 36: ["17B24bass.mp3"]
    };

    // Function to resolve the base path for a key
    function resolveBasePath(key) {
        if (key >= 25 && key <= 36) {
            return basePaths.bass; // Use the bass sounds base path
        }
        return basePaths.piano; // Default to the piano base path
    }

    // Preload audio files and decode into buffers
    const audioFiles = {};
    for (const key in keySounds) {
        const basePath = resolveBasePath(parseInt(key)); // Determine the base path dynamically
        audioFiles[key] = keySounds[key].map(sound => {
            return fetch(`${basePath}${sound}`)
                .then(response => response.arrayBuffer())
                .then(buffer => audioContext.decodeAudioData(buffer))
                .catch(err => console.error(`Error loading audio for key ${key}:`, err));
        });
    }

    // Create keys dynamically
    for (let index = 1; index <= 24; index++) {
        const keyDiv = document.createElement("div");
        keyDiv.classList.add("key", index <= 10 ? "black-key" : "white-key");

        keyDiv.addEventListener("click", () => {
            if (audioContext.state === "suspended") audioContext.resume();

            if (audioFiles[index]) {
                Promise.all(audioFiles[index]).then(bufferList => {
                    bufferList.forEach(buffer => {
                        const source = audioContext.createBufferSource();
                        source.buffer = buffer;
                        source.connect(audioContext.destination);
                        source.start(0);
                    });
                }).catch(err => console.error("Error playing sound:", err));
            } else {
                console.warn(`No sound assigned for key ${index}`);
            }
        });

        pianoContainer.appendChild(keyDiv);
    }

    enableChordPlaying(audioContext, audioFiles);

    // Resume AudioContext after first interaction
    document.body.addEventListener("click", () => {
        if (audioContext.state === "suspended") {
            audioContext.resume().catch(err => console.error("Error resuming AudioContext:", err));
        }
    });
});
