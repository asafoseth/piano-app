import enableChordPlaying from './multiKeyChords.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDocs, collection, query, where } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Your Firebase config here:
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDITrrDnAKRWjgQnpwfcyGKdUgjkI4ogA8",
  authDomain: "ali-piano.firebaseapp.com",
  projectId: "ali-piano",
  storageBucket: "ali-piano.firebasestorage.app",
  messagingSenderId: "806442476961",
  appId: "1:806442476961:web:365f1a133a33f0ed69d7e0",
  measurementId: "G-6NG4N6WK95"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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
            //     // We might not even need these listeners here anymore if multiKeyChords doesn't cover *all* visual states.
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

const loginBtn = document.getElementById('show-login-modal');
const userInfoSpan = document.getElementById('user-info');

// Listen for auth state changes
onAuthStateChanged(auth, user => {
  if (user) {
    // User is logged in
    loginBtn.textContent = "Logout";
    userInfoSpan.textContent = user.displayName || user.email;
    userInfoSpan.style.display = "inline";
    loginBtn.onclick = () => {
      signOut(auth);
    };
  } else {
    // User is logged out
    loginBtn.textContent = "Login";
    userInfoSpan.textContent = "";
    userInfoSpan.style.display = "none";
    loginBtn.onclick = () => {
      document.getElementById('login-modal').style.display = 'block';
    };
  }

  // Show/hide TAB buttons based on login state
  if (user) {
    document.getElementById('save-tab-btn').style.display = "inline-block";
    document.getElementById('import-tab-btn').style.display = "inline-block";
  } else {
    document.getElementById('save-tab-btn').style.display = "none";
    document.getElementById('import-tab-btn').style.display = "none";
  }
});

// Login modal logic
document.getElementById('show-login-modal').onclick = () => {
  document.getElementById('login-modal').style.display = 'block';
};
document.getElementById('close-login-modal').onclick = () => {
  document.getElementById('login-modal').style.display = 'none';
};
document.getElementById('google-login-btn').onclick = async () => {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
    document.getElementById('login-modal').style.display = 'none';
  } catch (e) {
    document.getElementById('login-error').textContent = e.message;
  }
};
document.getElementById('email-login-btn').onclick = async () => {
  const email = document.getElementById('email-input').value;
  const password = document.getElementById('password-input').value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    document.getElementById('login-modal').style.display = 'none';
  } catch (e) {
    // If user not found, try signup
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      document.getElementById('login-modal').style.display = 'none';
    } catch (err) {
      document.getElementById('login-error').textContent = err.message;
    }
  }
};

// Save TAB Modal logic
document.getElementById('save-tab-btn').onclick = () => {
  document.getElementById('save-tab-modal').style.display = 'block';
};
document.getElementById('close-save-tab-modal').onclick = () => {
  document.getElementById('save-tab-modal').style.display = 'none';
  document.getElementById('save-tab-error').textContent = '';
};
document.getElementById('confirm-save-tab').onclick = async () => {
  const name = document.getElementById('tab-save-name').value.trim();
  if (!name) {
    document.getElementById('save-tab-error').textContent = "Please enter a name.";
    return;
  }
  const user = auth.currentUser;
  if (!user) return;
  // Collect TAB data from fields
  const tabEntries = Array.from(document.querySelectorAll('.tab-note-entry')).map(entry => {
    const inputWrapper = entry.querySelector('.tab-input-wrapper');
    // If you support split inputs, adjust here; for now, just get two values per field
    const inputs = inputWrapper.querySelectorAll('.tab-note-input');
    return {
        values: [
            inputs[0]?.value || "",
            inputs[1]?.value || ""
        ]
    };
});
  // Save to Firestore under user's UID
  try {
    await setDoc(doc(db, "tabData", `${user.uid}_${name}`), {
      owner: user.uid,
      name,
      tabEntries,
      savedAt: Date.now()
    });
    document.getElementById('save-tab-modal').style.display = 'none';
    document.getElementById('tab-save-name').value = '';
    document.getElementById('save-tab-error').textContent = '';
    alert("TAB data saved!");
  } catch (e) {
    document.getElementById('save-tab-error').textContent = e.message;
  }
};

// Import TAB Modal logic
document.getElementById('import-tab-btn').onclick = async () => {
  const user = auth.currentUser;
  if (!user) return;
  document.getElementById('import-tab-modal').style.display = 'block';
  const list = document.getElementById('tab-import-list');
  list.innerHTML = "<li>Loading...</li>";
  try {
    const q = query(collection(db, "tabData"), where("owner", "==", user.uid));
    const snapshot = await getDocs(q);
    list.innerHTML = "";
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const li = document.createElement('li');
      li.textContent = data.name;
      li.style.cursor = "pointer";
      li.style.padding = "8px";
      li.onclick = () => {
        // Populate TAB fields
        const tabEntries = document.querySelectorAll('.tab-note-entry');
        data.tabEntries.forEach((entry, idx) => {
          const tabEntry = document.querySelector(`.tab-note-entry[data-entry-index="${idx}"]`);
          if (!tabEntry) return;
          const inputWrapper = tabEntry.querySelector('.tab-input-wrapper');
          const inputs = inputWrapper.querySelectorAll('.tab-note-input');
          if (inputs[0]) inputs[0].value = entry.values[0] || "";
          if (inputs[1]) inputs[1].value = entry.values[1] || "";
        });
        document.getElementById('import-tab-modal').style.display = 'none';
      };
      list.appendChild(li);
    });
    if (!list.hasChildNodes()) {
      list.innerHTML = "<li>No saved TAB data found.</li>";
    }
  } catch (e) {
    document.getElementById('import-tab-error').textContent = e.message;
  }
};
document.getElementById('close-import-tab-modal').onclick = () => {
  document.getElementById('import-tab-modal').style.display = 'none';
  document.getElementById('import-tab-error').textContent = '';
};

function getTabFieldTimingKeys(entryIndex) {
    // Each field covers two timings: e.g. field 0 -> ['1.0', '1.2'], field 1 -> ['1.5', '1.7'], etc.
    const beatNum = Math.floor(entryIndex / 2) + 1; // 1 to 8
    const suffixes = (entryIndex % 2 === 0) ? ['.0', '.2'] : ['.5', '.7'];
    return suffixes.map(suffix => `${beatNum}${suffix}`);
}

// Example: mapping all 16 fields
// for (let i = 0; i < 16; i++) {
//     console.log(`Field ${i}:`, getTabFieldTimingKeys(i));
// }

function playTabSequence(tabEntries, beatTrackTimings, playNoteCallback) {
    tabEntries.forEach((entry, idx) => {
        const timingKeys = getTabFieldTimingKeys(idx);
        timingKeys.forEach((timingKey, splitIdx) => {
            const timing = beatTrackTimings[timingKey];
            const noteId = entry.values[splitIdx] || "";
            if (timing !== undefined && noteId) {
                setTimeout(() => {
                    playNoteCallback(noteId);
                }, timing * 1000); // Convert seconds to ms
            }
        });
    });
}

// Usage example:
// playTabSequence(tabEntries, beatTrackMap[selectedTrack].timings, playNote);
