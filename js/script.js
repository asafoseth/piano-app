import enableChordPlaying from './multiKeyChords.js';

document.addEventListener("DOMContentLoaded", () => {
    const pianoContainer = document.getElementsByClassName("piano-container")[0];

    if (!pianoContainer) {
        console.error("Piano container not found");
        return;
    }

    const base = "./audio/";
    const audioContext = new (window.AudioContext || window.webkitAudioContext)(); // Web Audio API context

 // Define sounds for each key
 const keySounds = {
    11: ["key01.mp3"],           // C note
    1: ["key02.mp3"],
    12: ["key03.mp3"],           // D note
    2: ["key04.mp3"],
    13: ["key05.mp3"],           // E note
    14: ["key06.mp3"],           // F note
    3: ["key07.mp3"],
    15: ["key08.mp3"],           // G note
    4: ["key09.mp3"],
    16: ["key10.mp3"],           // A note
    5: ["key11.mp3"],
    17: ["key12.mp3"],           // B note
    18: ["key13.mp3"],            // C note
    6: ["key14.mp3"],
    19: ["key15.mp3"],       // C# note
    7: ["key16.mp3"],
    20: ["key17.mp3"],      // Example: Single D# note
    21: ["key18.mp3"], // Example: Multiple notes for a C chord
    8: ["key19.mp3"],
    22: ["key20.mp3"], // Example: D chord
    9: ["key21.mp3"],
    23: ["key22.mp3"],
    10: ["key23.mp3"],
    24: ["key24.mp3"]
};

    // Preload audio files and decode into buffers
    const audioFiles = {};
    for (const key in keySounds) {
        audioFiles[key] = keySounds[key].map(sound => {
            return fetch(`${base}${sound}`)
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