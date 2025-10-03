import enableChordPlaying from './multiKeyChords.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDocs, collection, query, where, deleteDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

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
  // Enhanced iOS Audio Unlock - Must be at the very beginning
  const iosAudioUnlock = () => {
    // Detect iOS devices
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    if (isIOS || isSafari) {
      console.log("iOS/Safari detected - initializing audio unlock");
      
      // Create a silent audio element to unlock audio playback
      const silentAudio = new Audio();
      silentAudio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LHdSEFl3bY8xk2FjUAAA==';
      silentAudio.preload = 'auto';
      
      const unlockAudio = () => {
        console.log("Attempting to unlock iOS audio...");
        
        // Play silent audio to unlock
        const playPromise = silentAudio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log("iOS audio unlocked successfully");
            silentAudio.pause();
            silentAudio.currentTime = 0;
          }).catch(e => {
            console.log("iOS audio unlock failed:", e);
          });
        }
        
        // Also try to create and resume AudioContext
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            const tempContext = new AudioContext();
            if (tempContext.state === 'suspended') {
              tempContext.resume().then(() => {
                console.log("AudioContext resumed successfully");
                tempContext.close();
              }).catch(e => {
                console.log("AudioContext resume failed:", e);
                tempContext.close();
              });
            } else {
              tempContext.close();
            }
          }
        } catch (e) {
          console.log("AudioContext creation failed:", e);
        }
        
        // Remove event listeners after first interaction
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('touchend', unlockAudio);
        document.removeEventListener('click', unlockAudio);
        document.body.removeEventListener('touchstart', unlockAudio);
        document.body.removeEventListener('touchend', unlockAudio);
        document.body.removeEventListener('click', unlockAudio);
      };
      
      // Add multiple event listeners to catch the first user interaction
      document.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
      document.addEventListener('touchend', unlockAudio, { once: true, passive: true });
      document.addEventListener('click', unlockAudio, { once: true, passive: true });
      document.body.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
      document.body.addEventListener('touchend', unlockAudio, { once: true, passive: true });
      document.body.addEventListener('click', unlockAudio, { once: true, passive: true });
    }
  };
  
  // Call iOS audio unlock immediately
  iosAudioUnlock();

  // --- Delete TAB Button Color Feedback ---
  const deleteTabBtn = document.getElementById('delete-tab-btn');
  if (deleteTabBtn) {
    const originalBg = deleteTabBtn.style.background || '#d32f2f';
    const originalColor = deleteTabBtn.style.color || '#fff';
    deleteTabBtn.addEventListener('mousedown', () => {
      deleteTabBtn.style.background = '#bdbdbd';
      deleteTabBtn.style.color = '#222';
    });
    deleteTabBtn.addEventListener('mouseup', () => {
      deleteTabBtn.style.background = originalBg;
      deleteTabBtn.style.color = originalColor;
    });
    deleteTabBtn.addEventListener('mouseleave', () => {
      deleteTabBtn.style.background = originalBg;
      deleteTabBtn.style.color = originalColor;
    });
    deleteTabBtn.addEventListener('touchstart', () => {
      deleteTabBtn.style.background = '#bdbdbd';
      deleteTabBtn.style.color = '#222';
    }, { passive: true });
    deleteTabBtn.addEventListener('touchend', () => {
      deleteTabBtn.style.background = originalBg;
      deleteTabBtn.style.color = originalColor;
    });
  }
  // --- Reset TAB Button Color Feedback ---
  const resetTabBtn = document.getElementById('reset-tab-btn');
  if (resetTabBtn) {
    const originalBg = resetTabBtn.style.background || '#ffe600';
    const originalColor = resetTabBtn.style.color || '#222';
    resetTabBtn.addEventListener('mousedown', () => {
      resetTabBtn.style.background = '#bdbdbd';
      resetTabBtn.style.color = '#222';
    });
    resetTabBtn.addEventListener('mouseup', () => {
      resetTabBtn.style.background = originalBg;
      resetTabBtn.style.color = originalColor;
    });
    resetTabBtn.addEventListener('mouseleave', () => {
      resetTabBtn.style.background = originalBg;
      resetTabBtn.style.color = originalColor;
    });
    resetTabBtn.addEventListener('touchstart', () => {
      resetTabBtn.style.background = '#bdbdbd';
      resetTabBtn.style.color = '#222';
    }, { passive: true });
    resetTabBtn.addEventListener('touchend', () => {
      resetTabBtn.style.background = originalBg;
      resetTabBtn.style.color = originalColor;
    });
  }
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
    // Removed: alert("TAB data saved!");
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
            li.style.display = "flex";
            li.style.alignItems = "center";
            li.style.justifyContent = "space-between";
            li.style.padding = "8px";
            li.style.gap = "8px";

            // TAB name (click to load)
            const nameSpan = document.createElement('span');
            nameSpan.textContent = data.name;
            nameSpan.style.cursor = "pointer";
            nameSpan.onclick = () => {
                stopAndUncheckSingKey();

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

                // Restore settings if present
                if (data.settings) {
                    document.getElementById('transpose-value').textContent = data.settings.transpose ?? "0";
                    document.getElementById('beat-track-select').value = data.settings.beatTrack ?? "";
                    document.getElementById('tab-feature-toggle').textContent = data.settings.beatOn ? "Beat: ON" : "Beat: OFF";
                    document.getElementById('key-switcher-select').value = data.settings.key ?? "";
                    document.getElementById('syncKeyFinderToggle').checked = !!data.settings.singKey;
                }

                document.getElementById('import-tab-modal').style.display = 'none';
            };

            // Rename icon button (✏️)
            const renameBtn = document.createElement('button');
            renameBtn.innerHTML = "&#9998;"; // ✏️
            renameBtn.title = "Rename";
            renameBtn.style.background = "none";
            renameBtn.style.border = "none";
            renameBtn.style.cursor = "pointer";
            renameBtn.style.fontSize = "1.1em";
            renameBtn.style.marginLeft = "4px";
            renameBtn.onclick = async (e) => {
                e.stopPropagation();
                const newName = prompt("Enter new name for this TAB:", data.name);
                if (!newName || newName === data.name) return;
                const newDocId = `${user.uid}_${newName}`;
                const oldDocId = `${user.uid}_${data.name}`;
                try {
                    // Copy data to new document
                    await setDoc(doc(db, "tabData", newDocId), { ...data, name: newName });
                    // Delete old document
                    await deleteDoc(doc(db, "tabData", oldDocId));
                    // Instantly update UI without alert
                    nameSpan.textContent = newName;
                    data.name = newName;
                    // No alert here
                } catch (err) {
                    alert("Rename failed: " + err.message);
                }
            };

            // Delete icon button (🗑️)
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = "&#128465;"; // 🗑️
            deleteBtn.title = "Delete";
            deleteBtn.style.background = "none";
            deleteBtn.style.border = "none";
            deleteBtn.style.cursor = "pointer";
            deleteBtn.style.fontSize = "1.1em";
            deleteBtn.style.marginLeft = "4px";
            deleteBtn.onclick = async (e) => {
                e.stopPropagation();
                if (!confirm(`Delete TAB "${data.name}"? This cannot be undone.`)) return;
                try {
                    await deleteDoc(doc(db, "tabData", `${user.uid}_${data.name}`));
                    li.remove();
                    // No alert here, just remove from UI instantly
                } catch (err) {
                    alert("Delete failed: " + err.message);
                }
            };

            li.appendChild(nameSpan);
            li.appendChild(renameBtn);
            li.appendChild(deleteBtn);
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

// Helper: Get current settings for saving with TAB
function getCurrentSettingsForTabSave() {
    return {
        transpose: parseInt(document.getElementById('transpose-value')?.textContent || "0", 10),
        beatTrack: document.getElementById('beat-track-select')?.value || "",
        beatOn: document.getElementById('tab-feature-toggle')?.textContent?.includes("ON") || false,
        key: document.getElementById('key-switcher-select')?.value || "",
        singKey: document.getElementById('syncKeyFinderToggle')?.checked || false
    };
}

// --- Save TAB Modal logic (integrated with settings) ---
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
        const inputs = inputWrapper.querySelectorAll('.tab-note-input');
        return {
            values: [
                inputs[0]?.value || "",
                inputs[1]?.value || ""
            ]
        };
    });

    // Collect settings
    const settings = getCurrentSettingsForTabSave();

    // Save to Firestore under user's UID, including settings
    try {
        await setDoc(doc(db, "tabData", `${user.uid}_${name}`), {
            owner: user.uid,
            name,
            tabEntries,
            settings, // <-- Save settings with TAB
            savedAt: Date.now()
        });
        document.getElementById('save-tab-modal').style.display = 'none';
        document.getElementById('tab-save-name').value = '';
        document.getElementById('save-tab-error').textContent = '';
        // Removed: alert("TAB data and settings saved!");
    } catch (e) {
        document.getElementById('save-tab-error').textContent = e.message;
    }
};

// --- Import TAB Modal logic (integrated with settings) ---
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
            li.style.display = "flex";
            li.style.alignItems = "center";
            li.style.justifyContent = "space-between";
            li.style.padding = "8px";
            li.style.gap = "8px";

            // TAB name (click to load)
            const nameSpan = document.createElement('span');
            nameSpan.textContent = data.name;
            nameSpan.style.cursor = "pointer";
            nameSpan.onclick = () => {
                stopAndUncheckSingKey();

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

                // Restore settings if present
                if (data.settings) {
                    document.getElementById('transpose-value').textContent = data.settings.transpose ?? "0";
                    document.getElementById('beat-track-select').value = data.settings.beatTrack ?? "";
                    document.getElementById('tab-feature-toggle').textContent = data.settings.beatOn ? "Beat: ON" : "Beat: OFF";
                    document.getElementById('key-switcher-select').value = data.settings.key ?? "";
                    document.getElementById('syncKeyFinderToggle').checked = !!data.settings.singKey;
                }

                document.getElementById('import-tab-modal').style.display = 'none';
            };

            // Rename icon button (✏️)
            const renameBtn = document.createElement('button');
            renameBtn.innerHTML = "&#9998;"; // ✏️
            renameBtn.title = "Rename";
            renameBtn.style.background = "none";
            renameBtn.style.border = "none";
            renameBtn.style.cursor = "pointer";
            renameBtn.style.fontSize = "1.1em";
            renameBtn.style.marginLeft = "4px";
            renameBtn.onclick = async (e) => {
                e.stopPropagation();
                const newName = prompt("Enter new name for this TAB:", data.name);
                if (!newName || newName === data.name) return;
                const newDocId = `${user.uid}_${newName}`;
                const oldDocId = `${user.uid}_${data.name}`;
                try {
                    // Copy data to new document
                    await setDoc(doc(db, "tabData", newDocId), { ...data, name: newName });
                    // Delete old document
                    await deleteDoc(doc(db, "tabData", oldDocId));
                    // Instantly update UI without alert
                    nameSpan.textContent = newName;
                    data.name = newName;
                    // No alert here
                } catch (err) {
                    alert("Rename failed: " + err.message);
                }
            };

            // Delete icon button (🗑️)
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = "&#128465;"; // 🗑️
            deleteBtn.title = "Delete";
            deleteBtn.style.background = "none";
            deleteBtn.style.border = "none";
            deleteBtn.style.cursor = "pointer";
            deleteBtn.style.fontSize = "1.1em";
            deleteBtn.style.marginLeft = "4px";
            deleteBtn.onclick = async (e) => {
                e.stopPropagation();
                if (!confirm(`Delete TAB "${data.name}"? This cannot be undone.`)) return;
                try {
                    await deleteDoc(doc(db, "tabData", `${user.uid}_${data.name}`));
                    li.remove();
                    // No alert here, just remove from UI instantly
                } catch (err) {
                    alert("Delete failed: " + err.message);
                }
            };

            li.appendChild(nameSpan);
            li.appendChild(renameBtn);
            li.appendChild(deleteBtn);
            list.appendChild(li);
        });
        if (!list.hasChildNodes()) {
            list.innerHTML = "<li>No saved TAB data found.</li>";
        }
    } catch (e) {
        document.getElementById('import-tab-error').textContent = e.message;
    }
};

// Patch: Save settings with TAB
function saveTabWithSettings(tabData, tabName) {
    const settings = getCurrentSettingsForTabSave();
    const saveObj = {
        tab: tabData,
        settings
    };
    localStorage.setItem(`tab_${tabName}`, JSON.stringify(saveObj));
}

// --- Replace your existing TAB save logic with this ---
// Example: When user clicks "Save" in the modal
document.getElementById('confirm-save-tab')?.addEventListener('click', function() {
    const tabName = document.getElementById('tab-save-name').value.trim();
    if (!tabName) {
        document.getElementById('save-tab-error').textContent = "Please enter a name.";
        return;
    }
    // Gather TAB data as before (replace this with your actual tab data gathering)
    const tabData = gatherTabData(); // <-- implement or use your existing function

    saveTabWithSettings(tabData, tabName);

    // ...existing code to close modal, show success, etc...
});

// --- When loading a TAB, also restore settings ---
function loadTabWithSettings(tabName) {
    const raw = localStorage.getItem(`tab_${tabName}`);
    if (!raw) return;
    const { tab, settings } = JSON.parse(raw);

    // Restore TAB data as before (replace this with your actual logic)
    restoreTabData(tab);

    // Restore settings:
    if (settings) {
        document.getElementById('transpose-value').textContent = settings.transpose ?? "0";
        document.getElementById('beat-track-select').value = settings.beatTrack ?? "track1";
        document.getElementById('tab-feature-toggle').textContent = settings.beatOn ? "Beat: ON" : "Beat: OFF";
        document.getElementById('key-switcher-select').value = settings.key ?? "C";
        document.getElementById('syncKeyFinderToggle').checked = !!settings.singKey;
    }
}

// Show/hide password toggle for login modal
document.addEventListener("DOMContentLoaded", () => {
    const passwordInput = document.getElementById('password-input');
    if (passwordInput && !document.getElementById('toggle-password-visibility')) {
        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.type = "button";
        toggleBtn.id = "toggle-password-visibility";
        toggleBtn.innerHTML = "&#128065;"; // 👁️ Eye symbol
        toggleBtn.style.marginLeft = "8px";
        toggleBtn.style.fontSize = "1.1em";
        toggleBtn.style.cursor = "pointer";

        // Insert after password input
        passwordInput.parentNode.insertBefore(toggleBtn, passwordInput.nextSibling);

        toggleBtn.onclick = () => {
            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                toggleBtn.innerHTML = "&#128064;"; // 👁️‍🗨️ or another eye variant
            } else {
                passwordInput.type = "password";
                toggleBtn.innerHTML = "&#128065;"; // 👁️
            }
        };
    }
});

// Enhanced iOS auto-zoom prevention for TAB input fields
// This prevents iOS Safari from automatically zooming when tab inputs are focused
document.addEventListener("DOMContentLoaded", () => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    if (isIOSDevice && isSafari) {
        console.log('iOS Safari detected - setting up tab input zoom prevention');
        
        // Get all tab note inputs
        const tabInputs = document.querySelectorAll('.tab-note-input');
        
        // Store original viewport meta tag content
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        const originalViewport = viewportMeta ? viewportMeta.content : '';
        
        tabInputs.forEach(input => {
            // Prevent zoom on focus
            input.addEventListener('focus', (e) => {
                console.log('Tab input focused - preventing iOS zoom');
                
                // Method 1: Ensure font size is >= 16px
                e.target.style.fontSize = "16px";
                e.target.style.setProperty('font-size', '16px', 'important');
                
                // Method 2: Temporarily disable user-scalable
                if (viewportMeta) {
                    viewportMeta.content = 'width=1024, initial-scale=0.5, user-scalable=no';
                }
                
                // Method 3: Add specific iOS class for additional styling
                e.target.classList.add('ios-input-focused');
            }, { passive: true });
            
            // Restore normal behavior on blur
            input.addEventListener('blur', (e) => {
                console.log('Tab input blurred - restoring normal zoom behavior');
                
                // Restore original viewport
                if (viewportMeta && originalViewport) {
                    viewportMeta.content = originalViewport;
                }
                
                // Remove iOS-specific class
                e.target.classList.remove('ios-input-focused');
            }, { passive: true });
            
            // Prevent zoom on touchstart (additional safety)
            input.addEventListener('touchstart', (e) => {
                e.target.style.fontSize = "16px";
                e.target.style.setProperty('font-size', '16px', 'important');
            }, { passive: true });
        });
    }

    // Prevent double-tap zoom on tab inputs for all devices
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);

    // Prevent pinch-zoom
    document.addEventListener('gesturestart', function (e) {
        e.preventDefault();
    });
});

// Simple undo/redo stack for TAB fields
let undoStack = [];
let redoStack = [];

function getCurrentTabState() {
    return Array.from(document.querySelectorAll('.tab-note-entry')).map(entry => {
        const inputs = entry.querySelectorAll('.tab-note-input');
        return [
            inputs[0]?.value || "",
            inputs[1]?.value || ""
        ];
    });
}

function setTabState(state) {
    const entries = document.querySelectorAll('.tab-note-entry');
    state.forEach((values, idx) => {
        const entry = entries[idx];
        if (!entry) return;
        const inputs = entry.querySelectorAll('.tab-note-input');
        if (inputs[0]) inputs[0].value = values[0];
        if (inputs[1]) inputs[1].value = values[1];
    });
}

// Save state on input
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('.tab-note-input').forEach(input => {
        input.addEventListener('input', () => {
            undoStack.push(getCurrentTabState());
            redoStack = [];
        });
    });

    // Undo button
    const undoBtn = document.getElementById('undo-btn');
    if (undoBtn) {
        undoBtn.onclick = () => {
            if (undoStack.length > 0) {
                redoStack.push(getCurrentTabState());
                const prev = undoStack.pop();
                setTabState(prev);
            }
        };
    }

    // Redo button
    const redoBtn = document.getElementById('redo-btn');
    if (redoBtn) {
        redoBtn.onclick = () => {
            if (redoStack.length > 0) {
                undoStack.push(getCurrentTabState());
                const next = redoStack.pop();
                setTabState(next);
            }
        };
    }
});

// --- DIRECT SING KEY STOP LOGIC PATCH ---
// This function will forcibly stop all audio related to sing key, including any running AudioContext, intervals, and toggles.
function stopAndUncheckSingKey() {
    // 1. Uncheck the sing key toggle
    const singKeyToggle = document.getElementById('syncKeyFinderToggle');
    if (singKeyToggle) {
        singKeyToggle.checked = false;
    }

    // 2. Call your sing key stop function if it exists
    if (typeof stopSingKey === "function") stopSingKey();

    // 3. Try to stop any Web Audio API nodes used by sing key
    if (window.singKeyAudioNodes && Array.isArray(window.singKeyAudioNodes)) {
        window.singKeyAudioNodes.forEach(node => {
            try {
                if (typeof node.stop === "function") node.stop(0);
                if (typeof node.disconnect === "function") node.disconnect();
            } catch (e) {}
        });
        window.singKeyAudioNodes = [];
    }

    // 4. Try to stop any global AudioBufferSourceNodes (brute force)
    if (window.AudioBufferSourceNode && typeof window.AudioBufferSourceNode === "function") {
        // This is a brute-force attempt, but most likely your nodes are tracked in singKeyAudioNodes
    }

    // 5. Clear any intervals/timeouts
    if (window.singKeyInterval) {
        clearInterval(window.singKeyInterval);
        window.singKeyInterval = null;
    }
    if (window.singKeyTimeout) {
        clearTimeout(window.singKeyTimeout);
        window.singKeyTimeout = null;
    }

    // 6. Suspend or close the AudioContext if you use a dedicated one for sing key
    if (window.singKeyAudioContext && typeof window.singKeyAudioContext.suspend === "function") {
        window.singKeyAudioContext.suspend();
    }
    if (window.singKeyAudioContext && typeof window.singKeyAudioContext.close === "function") {
        window.singKeyAudioContext.close();
        window.singKeyAudioContext = null;
    }

    // 7. Try to pause all <audio> elements (if any are used for sing key)
    document.querySelectorAll('audio').forEach(audio => {
        try {
            audio.pause();
            audio.currentTime = 0;
        } catch (e) {}
    });

    // 8. Reset any global flags
    window.singKeyIsPlaying = false;
}
