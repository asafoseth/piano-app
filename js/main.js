import enableChordPlaying from './multiKeyChords.js';

document.addEventListener("DOMContentLoaded", () => {
    const pianoContainer = document.querySelector(".piano-container"); // Use querySelector for single element
    const loadingIndicator = document.createElement('div'); // Create a loading indicator element

    if (!pianoContainer) {
        console.error("Piano container not found");
        return;
    }

    // --- Loading Indicator Setup ---
    loadingIndicator.textContent = "Loading sounds...";
    loadingIndicator.style.position = 'absolute';
    loadingIndicator.style.top = '50%';
    loadingIndicator.style.left = '50%';
    loadingIndicator.style.transform = 'translate(-50%, -50%)';
    loadingIndicator.style.fontSize = '20px';
    loadingIndicator.style.color = '#e0e0e0';
    loadingIndicator.style.zIndex = '10'; // Ensure it's above keys
    pianoContainer.style.position = 'relative'; // Needed for absolute positioning of child
    pianoContainer.appendChild(loadingIndicator);
    // --- End Loading Indicator Setup ---


    // Define base paths for different types of sounds
    const basePaths = {
        piano: "./audio/piano-tones/",
        string: "./audio/string-tones/", // Keep if used elsewhere, otherwise remove
        bass: "./audio/bass-tones/"
    };

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Define sounds for each key
    // Note: Keys 1-10 are black, 11-24 are white in your original setup
    // Keys 25-36 seem to be bass sounds mapped potentially to other keys/logic
    const keySounds = {
        // Black Keys (Piano)
        1: ["1CCPiano.mp3"], 2: ["2DDPiano.mp3"], 3: ["3FFPiano.mp3"], 4: ["4GGPiano.mp3"],
        5: ["5AAPiano.mp3"], 6: ["6CCPiano.mp3"], 7: ["7DDPiano.mp3"], 8: ["8FFPiano.mp3"],
        9: ["9GGPiano.mp3"], 10: ["10AAPiano.mp3"],
        // White Keys (Piano)
        11: ["11CPiano.mp3"], 12: ["12DPiano.mp3"], 13: ["13EPiano.mp3"], 14: ["14FPiano.mp3"],
        15: ["15GPiano.mp3"], 16: ["16APiano.mp3"], 17: ["17BPiano.mp3"], 18: ["18CPiano.mp3"],
        19: ["19DPiano.mp3"], 20: ["20EPiano.mp3"], 21: ["21FPiano.mp3"], 22: ["22GPiano.mp3"],
        23: ["23APiano.mp3"], 24: ["24BPiano.mp3"],
        // Bass Sounds (mapped separately, but preload them too)
        25: ["1CC6bass.mp3"], 26: ["2DD7bass.mp3"], 27: ["3FF8bass.mp3"], 28: ["4GG9bass.mp3"],
        29: ["5AA10bass.mp3"], 30: ["11C18bass.mp3"], 31: ["12D19bass.mp3"], 32: ["13E20bass.mp3"],
        33: ["14F21bass.mp3"], 34: ["15G22bass.mp3"], 35: ["16A23bass.mp3"], 36: ["17B24bass.mp3"],
        // Extra Invisible Notes (mapped separately, but preload them too)
        37: ["37CCPiano.mp3"], 38: ["38DDPiano.mp3"], 39: ["39FFPiano.mp3"], 40: ["40GGPiano.mp3"],
        41: ["41AAPiano.mp3"], 42: ["42CPiano.mp3"], 43: ["43DPiano.mp3"], 44: ["44EPiano.mp3"],
        45: ["45FPiano.mp3"], 46: ["46GPiano.mp3"], 47: ["47APiano.mp3"], 48: ["48BPiano.mp3"],
    };

    // Function to resolve the base path for a key
    function resolveBasePath(key) {
        // Assuming keys 25-36 are bass sounds based on filenames/original logic
        if (key >= 25 && key <= 36) {
            return basePaths.bass;
        }
        // Assuming keys 1-24 are piano sounds
        if (key >= 1 && key <= 24) {
            return basePaths.piano;
        }
        // Add logic for string sounds if needed
        // if (key >= X && key <= Y) { return basePaths.string; }

        console.warn(`No base path defined for key ${key}, defaulting to piano.`);
        return basePaths.piano; // Default fallback
    }

    // --- Preload and Decode Audio ---
    const audioBuffers = {}; // Object to hold the decoded AudioBuffers
    const allPromises = []; // Array to hold all fetch/decode promises

    console.log("Starting audio preloading...");

    for (const key in keySounds) {
        const keyNumber = parseInt(key);
        const basePath = resolveBasePath(keyNumber);
        const soundFiles = keySounds[key]; // Array of filenames for this key

        // Create promises for each sound file associated with the key
        const keyPromises = soundFiles.map(sound => {
            const url = `${basePath}${sound}`;
            return fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status} for ${url}`);
                    }
                    return response.arrayBuffer();
                })
                .then(buffer => audioContext.decodeAudioData(buffer))
                .catch(err => {
                    console.error(`Error loading/decoding audio for key ${key} (${sound}):`, err);
                    return null; // Return null on error so Promise.all doesn't fail everything
                });
        });

        // Store the array of promises for this key, we'll resolve them all together
        // We also store the key number to map the results back correctly
        allPromises.push(Promise.all(keyPromises).then(buffers => ({ key: keyNumber, buffers: buffers.filter(b => b !== null) })));
    }

    // Wait for all audio files to be fetched and decoded
    Promise.all(allPromises)
        .then(results => {
            console.log("Audio preloading complete.");
            // Populate the audioBuffers object with the decoded buffers
            results.forEach(result => {
                if (result.buffers.length > 0) {
                    audioBuffers[result.key] = result.buffers; // Store array of buffers
                } else {
                    console.warn(`No valid audio buffers loaded for key ${result.key}`);
                }
            });

            // --- Remove Loading Indicator ---
            pianoContainer.removeChild(loadingIndicator);

            // --- Create Piano Keys and Attach Listeners ---
            createPianoKeys(audioBuffers);

            // --- Initialize Chord Playing Module ---
            // Pass the preloaded buffers to the chord module
            enableChordPlaying(audioContext, audioBuffers);

            // Resume AudioContext after first interaction (if needed, often handled by first play)
            const resumeAudio = () => {
                if (audioContext.state === "suspended") {
                    audioContext.resume().catch(err => console.error("Error resuming AudioContext:", err));
                }
                // Remove the listener after the first interaction
                document.body.removeEventListener("click", resumeAudio);
                document.body.removeEventListener("touchstart", resumeAudio);
            };
            document.body.addEventListener("click", resumeAudio);
            document.body.addEventListener("touchstart", resumeAudio);

        })
        .catch(error => {
            console.error("Fatal error during audio preloading:", error);
            loadingIndicator.textContent = "Error loading sounds!";
            loadingIndicator.style.color = 'red';
            // Optionally disable the piano or show a more prominent error
        });


    // --- Function to Create Keys and Attach Basic Listeners ---
    function createPianoKeys(buffers) {
        // Create only the visual keys (1-24 based on original loop)
        for (let index = 1; index <= 24; index++) {
            const keyDiv = document.createElement("div");
            // Determine if black or white based on original logic (1-10 black, 11-24 white)
            const isBlackKey = index <= 10;
            keyDiv.classList.add("key", isBlackKey ? "black-key" : "white-key");
            keyDiv.setAttribute("data-key", index); // Use data-key for identification

            // --- IMPORTANT: Simplified Listeners in main.js ---
            // These listeners now ONLY handle the visual feedback (pressed class).
            // Sound playing (single note or chord) is entirely managed by multiKeyChords.js
            // This avoids conflicts and keeps logic separated.

            // const handleInteractionStart = (event) => {
            //     event.preventDefault(); // Prevent default actions like scrolling on touch
            //     // Visual feedback is now handled within multiKeyChords.js via addKeyVisual/removeKeyVisual
            //     // We might not even need these listeners here anymore if multiKeyChords handles visuals for both modes.
            //     // Let's keep them for now in case multiKeyChords doesn't cover *all* visual states.
            //     // addKeyVisual(index); // Potentially redundant if handled in multiKeyChords
            // };

            // const handleInteractionEnd = (event) => {
            //     event.preventDefault();
            //     // removeKeyVisual(index); // Potentially redundant if handled in multiKeyChords
            // };

            // // Add listeners for mouse and touch
            // keyDiv.addEventListener("mousedown", handleInteractionStart);
            // keyDiv.addEventListener("mouseup", handleInteractionEnd);
            // keyDiv.addEventListener("mouseleave", handleInteractionEnd); // Handle mouse leaving key while pressed
            // keyDiv.addEventListener("touchstart", handleInteractionStart, { passive: false }); // Use passive: false because we call preventDefault
            // keyDiv.addEventListener("touchend", handleInteractionEnd);

            pianoContainer.appendChild(keyDiv);
    }
    console.log("Piano keys created (listeners handled in multiKeyChords.js)."); // Update log message
}

    // Visual feedback functions (might be redundant if fully handled in multiKeyChords.js)
    // Consider moving these into multiKeyChords.js if they aren't used elsewhere in main.js
    // function addKeyVisual(key) {
    //     // Use data-key selector for consistency
    //     const keyElement = document.querySelector(`.key[data-key="${key}"]`);
    //     if (keyElement) {
    //         keyElement.classList.add("pressed");
    //     }
    // }

    // function removeKeyVisual(key) {
    //     const keyElement = document.querySelector(`.key[data-key="${key}"]`);
    //     if (keyElement) {
    //         keyElement.classList.remove("pressed");
    //     }
    // }

}); // End DOMContentLoaded
