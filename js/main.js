import enableChordPlaying from './multiKeyChords.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDocs, collection, query, where, deleteDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-analytics.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCIqEzxusl4VtVfODqTafgAi22U8AkIDbo",
  authDomain: "uncle-ali-piano.firebaseapp.com",
  projectId: "uncle-ali-piano",
  storageBucket: "uncle-ali-piano.firebasestorage.app",
  messagingSenderId: "639101542865",
  appId: "1:639101542865:web:e4ace865b05d78f0a8c0f0",
  measurementId: "G-GLDW02K380"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let auth = null;
let db = null;
let analytics = null;

try {
    db = getFirestore(app);
    console.log('✅ Firestore initialized successfully');
} catch (error) {
    console.error('❌ Firestore initialization failed:', error);
}

try {
    auth = getAuth(app);
    console.log('✅ Auth initialized successfully');
} catch (error) {
    console.error('❌ Auth initialization failed:', error);
    console.log('🔄 Continuing without authentication - voting will use localStorage only');
}

try {
    analytics = getAnalytics(app);
    console.log('✅ Analytics initialized successfully');
} catch (error) {
    console.error('❌ Analytics initialization failed:', error);
}

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
  if (!auth) {
    document.getElementById('login-error').textContent = 'Authentication service not available. Please check Firebase configuration.';
    return;
  }
  try {
    console.log('Attempting Google sign in...');
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    document.getElementById('login-modal').style.display = 'none';
    console.log('Google sign in successful');
  } catch (e) {
    console.error('Google sign in failed:', e);
    document.getElementById('login-error').textContent = `Google Sign In Error: ${e.message}`;
  }
};
document.getElementById('email-login-btn').onclick = async () => {
  if (!auth) {
    document.getElementById('login-error').textContent = 'Authentication service not available. Please check Firebase configuration.';
    return;
  }
  
  const email = document.getElementById('email-input').value;
  const password = document.getElementById('password-input').value;
  
  if (!email || !password) {
    document.getElementById('login-error').textContent = 'Please enter both email and password.';
    return;
  }
  
  try {
    console.log('Attempting to sign in with email:', email);
    await signInWithEmailAndPassword(auth, email, password);
    document.getElementById('login-modal').style.display = 'none';
    console.log('Sign in successful');
  } catch (e) {
    console.log('Sign in failed, trying signup:', e.code);
    // If user not found, try signup
    if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') {
      try {
        console.log('Attempting to create new user');
        await createUserWithEmailAndPassword(auth, email, password);
        document.getElementById('login-modal').style.display = 'none';
        console.log('User creation successful');
      } catch (err) {
        console.error('User creation failed:', err);
        document.getElementById('login-error').textContent = `Error: ${err.message}`;
      }
    } else {
      console.error('Authentication error:', e);
      document.getElementById('login-error').textContent = `Error: ${e.message}`;
    }
  }
};

// About modal logic
document.getElementById('show-about-modal').onclick = (e) => {
  e.preventDefault(); // Prevent default anchor behavior
  document.getElementById('about-modal').style.display = 'block';
};
document.getElementById('close-about-modal').onclick = () => {
  document.getElementById('about-modal').style.display = 'none';
};

// Close About modal when clicking outside the modal content
document.getElementById('about-modal').onclick = (e) => {
  if (e.target.id === 'about-modal') {
    document.getElementById('about-modal').style.display = 'none';
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

// Enhanced undo/redo stack for TAB fields
let undoStack = [];
let redoStack = [];
let maxUndoStates = 50; // Limit memory usage
let isUpdatingFromUndoRedo = false; // Prevent recursive state saving
let debounceTimer = null;

function getCurrentTabState() {
    return Array.from(document.querySelectorAll('.tab-note-entry')).map(entry => {
        const inputs = entry.querySelectorAll('.tab-note-input');
        return {
            values: [
                inputs[0]?.value || "",
                inputs[1]?.value || ""
            ],
            timestamp: Date.now()
        };
    });
}

function setTabState(state) {
    isUpdatingFromUndoRedo = true; // Prevent saving state during undo/redo
    
    const entries = document.querySelectorAll('.tab-note-entry');
    state.forEach((entryState, idx) => {
        const entry = entries[idx];
        if (!entry) return;
        const inputs = entry.querySelectorAll('.tab-note-input');
        if (inputs[0]) inputs[0].value = entryState.values[0];
        if (inputs[1]) inputs[1].value = entryState.values[1];
    });
    
    // Update button states
    updateUndoRedoButtons();
    
    setTimeout(() => {
        isUpdatingFromUndoRedo = false;
    }, 100);
}

function saveCurrentState() {
    if (isUpdatingFromUndoRedo) return; // Don't save during undo/redo operations
    
    const currentState = getCurrentTabState();
    
    // Don't save if nothing has changed
    if (undoStack.length > 0 && JSON.stringify(undoStack[undoStack.length - 1]) === JSON.stringify(currentState)) {
        return;
    }
    
    undoStack.push(currentState);
    redoStack = []; // Clear redo stack when new action is performed
    
    // Limit stack size
    if (undoStack.length > maxUndoStates) {
        undoStack.shift(); // Remove oldest state
    }
    
    updateUndoRedoButtons();
    console.log('State saved. Undo stack size:', undoStack.length);
}

function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    
    if (undoBtn) {
        undoBtn.style.opacity = undoStack.length > 0 ? '1' : '0.5';
        undoBtn.style.cursor = undoStack.length > 0 ? 'pointer' : 'not-allowed';
        undoBtn.disabled = undoStack.length === 0;
    }
    
    if (redoBtn) {
        redoBtn.style.opacity = redoStack.length > 0 ? '1' : '0.5';
        redoBtn.style.cursor = redoStack.length > 0 ? 'pointer' : 'not-allowed';
        redoBtn.disabled = redoStack.length === 0;
    }
}

function debouncedSaveState() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        saveCurrentState();
    }, 500); // Save state 500ms after user stops typing
}

// Initialize undo/redo system
document.addEventListener("DOMContentLoaded", () => {
    // Save initial state
    setTimeout(() => {
        saveCurrentState();
        console.log('Initial state saved');
    }, 1000);
    
    // Add input listeners with debouncing
    document.querySelectorAll('.tab-note-input').forEach(input => {
        input.addEventListener('input', debouncedSaveState);
        
        // Also save state on focus loss (when user finishes with a field)
        input.addEventListener('blur', () => {
            clearTimeout(debounceTimer);
            setTimeout(saveCurrentState, 100);
        });
    });
    
    // Save state when tab notes are cleared or reset
    const resetBtn = document.getElementById('reset-tab-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            setTimeout(saveCurrentState, 100);
        });
    }

    // Undo button
    const undoBtn = document.getElementById('undo-btn');
    if (undoBtn) {
        undoBtn.onclick = () => {
            if (undoStack.length > 0) {
                console.log('Performing undo. Stack size:', undoStack.length);
                redoStack.push(getCurrentTabState());
                const prevState = undoStack.pop();
                setTabState(prevState);
            } else {
                console.log('Nothing to undo');
            }
        };
    }

    // Redo button
    const redoBtn = document.getElementById('redo-btn');
    if (redoBtn) {
        redoBtn.onclick = () => {
            if (redoStack.length > 0) {
                console.log('Performing redo. Stack size:', redoStack.length);
                undoStack.push(getCurrentTabState());
                const nextState = redoStack.pop();
                setTabState(nextState);
            } else {
                console.log('Nothing to redo');
            }
        };
    }
    
    // Initialize button states
    updateUndoRedoButtons();
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

// Piano Feedback System
class PianoFeedback {
    constructor() {
        this.feedbackDoc = 'pianoFeedback';
        this.unsubscribe = null; // Store unsubscribe function for real-time listener
        this.init();
    }

    async init() {
        console.log('Initializing PianoFeedback...');
        console.log('Firebase db object:', db);
        
        // Test Firebase connectivity
        await this.testFirebaseConnection();
        
        // Load initial counts
        await this.loadFeedbackCounts();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Check user vote status
        this.checkUserVoteStatus();
        
        // Setup real-time listener for instant cross-device synchronization
        this.setupRealTimeListener();
        
        // Setup periodic refresh as backup (reduced frequency since we have real-time updates)
        this.setupPeriodicRefresh();
    }

    setupPeriodicRefresh() {
        // Backup refresh every 5 minutes (since we have real-time listeners)
        setInterval(async () => {
            try {
                console.log('Backup periodic refresh of feedback counts...');
                await this.loadFeedbackCounts();
            } catch (error) {
                console.error('Error during periodic refresh:', error);
            }
        }, 300000); // 5 minutes as backup
    }

    setupRealTimeListener() {
        try {
            console.log('Setting up real-time listener for instant cross-device synchronization...');
            const docRef = doc(db, 'feedback', this.feedbackDoc);
            
            // Set up real-time listener using onSnapshot
            this.unsubscribe = onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    console.log('Real-time update received from Firebase:', data);
                    
                    const likes = data.likes || 0;
                    const dislikes = data.dislikes || 0;
                    
                    // Update display instantly
                    this.updateCountDisplay(likes, dislikes);
                    
                    // Update localStorage backup
                    localStorage.setItem('piano_likes_count', likes.toString());
                    localStorage.setItem('piano_dislikes_count', dislikes.toString());
                    
                    console.log('Vote counts updated instantly across all devices:', { likes, dislikes });
                } else {
                    console.log('Real-time listener: Document does not exist yet');
                }
            }, (error) => {
                console.error('Real-time listener error:', error);
                // Fallback to periodic refresh if real-time fails
                console.log('Real-time listener failed, relying on backup periodic refresh');
            });
            
            console.log('Real-time listener successfully established');
        } catch (error) {
            console.error('Error setting up real-time listener:', error);
        }
    }

    async forceRefreshCounts() {
        // Method to manually force refresh from Firestore
        console.log('Force refreshing feedback counts...');
        try {
            return await this.loadFeedbackCounts();
        } catch (error) {
            console.error('Error during force refresh:', error);
            return null;
        }
    }

    async testFirebaseConnection() {
        try {
            console.log('Testing Firebase connection...');
            const testDocRef = doc(db, 'test', 'connection');
            const testDoc = await getDoc(testDocRef);
            console.log('Firebase connection test successful');
        } catch (error) {
            console.error('Firebase connection test failed:', error);
            this.showMessage('Firebase connection failed. Please check your internet connection.');
        }
    }

    async loadFeedbackCounts() {
        try {
            console.log('Loading feedback counts from Firestore...');
            const docRef = doc(db, 'feedback', this.feedbackDoc);
            const docSnap = await getDoc(docRef);
            
            let likes = 0;
            let dislikes = 0;

            if (docSnap.exists()) {
                const data = docSnap.data();
                console.log('Loaded data from Firebase:', data);
                likes = data.likes || 0;
                dislikes = data.dislikes || 0;
                
                // Store in localStorage as backup
                localStorage.setItem('piano_likes_count', likes.toString());
                localStorage.setItem('piano_dislikes_count', dislikes.toString());
            } else {
                console.log('Document does not exist, creating new one...');
                // If document doesn't exist, create it with current localStorage values or 0
                const storedLikes = parseInt(localStorage.getItem('piano_likes_count') || '0');
                const storedDislikes = parseInt(localStorage.getItem('piano_dislikes_count') || '0');
                
                likes = storedLikes;
                dislikes = storedDislikes;
                
                await setDoc(docRef, {
                    likes: likes,
                    dislikes: dislikes,
                    lastUpdated: new Date().toISOString()
                });
                console.log('New document created with values:', { likes, dislikes });
            }

            this.updateCountDisplay(likes, dislikes);
            console.log('Feedback counts loaded successfully:', { likes, dislikes });
            return { likes, dislikes };
        } catch (error) {
            console.error('Error loading feedback counts from Firestore:', error);
            // Fallback to localStorage only if Firebase completely fails
            const storedLikes = parseInt(localStorage.getItem('piano_likes_count') || '0');
            const storedDislikes = parseInt(localStorage.getItem('piano_dislikes_count') || '0');
            this.updateCountDisplay(storedLikes, storedDislikes);
            console.log('Using localStorage fallback:', { likes: storedLikes, dislikes: storedDislikes });
            return { likes: storedLikes, dislikes: storedDislikes };
        }
    }

    setupEventListeners() {
        const likeBtn = document.getElementById('like-btn');
        const dislikeBtn = document.getElementById('dislike-btn');

        if (likeBtn) {
            likeBtn.addEventListener('click', () => this.handleVote('like'));
        }

        if (dislikeBtn) {
            dislikeBtn.addEventListener('click', () => this.handleVote('dislike'));
        }
    }

    async handleVote(voteType) {
        console.log(`Attempting to vote: ${voteType}`);
        
        const btn = document.getElementById(`${voteType}-btn`);
        const oppositeType = voteType === 'like' ? 'dislike' : 'like';
        const oppositeBtn = document.getElementById(`${oppositeType}-btn`);
        
        if (!btn) {
            console.error('Button not found:', `${voteType}-btn`);
            return;
        }

        // Add loading state
        btn.classList.add('loading');

        try {
            const currentVote = this.getUserCurrentVote();
            console.log('Current user vote:', currentVote);
            
            // Determine the action to take
            let action = 'none';
            if (currentVote === null) {
                // No previous vote, add new vote
                action = 'add';
            } else if (currentVote === voteType) {
                // Same vote clicked, remove vote (allow unlike/undislike)
                console.log('Same vote clicked, removing vote to allow unlike/undislike');
                action = 'remove';
            } else {
                // Different vote clicked, switch votes
                action = 'switch';
            }
            
            console.log('Vote action:', action);

            // Provide immediate visual feedback to the voting user
            this.provideFastFeedback(voteType, action, btn, oppositeBtn);

            // Check if user is authenticated
            const user = auth ? auth.currentUser : null;
            if (!user || !auth) {
                // Use localStorage fallback for anonymous users or when auth is not available
                console.log('User not authenticated or auth not available, using localStorage fallback');
                this.handleAnonymousVoteAction(voteType, action, btn, oppositeBtn);
                return;
            }

            console.log('Updating Firestore count...');
            // Update Firestore
            await this.updateFirestoreCountWithAction(voteType, action);
            console.log('Firestore update successful');
            
            // Update user's vote preference
            this.setUserVote(action === 'remove' ? null : voteType);
            
            // Update UI
            this.updateButtonStates(voteType, action, btn, oppositeBtn);
            
            // Show success message (hidden per user request)
            // this.showSuccessMessage(voteType, action);
            
            // Reload counts to show updated numbers
            console.log('Reloading feedback counts...');
            await this.loadFeedbackCounts();
            
        } catch (error) {
            console.error(`Detailed error submitting ${voteType}:`, error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            btn.classList.remove('loading');
            
            // If permission denied, fall back to localStorage
            if (error.code === 'permission-denied') {
                console.log('Permission denied, falling back to localStorage');
                const currentVote = this.getUserCurrentVote();
                let action = 'none';
                if (currentVote === null) {
                    action = 'add';
                } else if (currentVote === voteType) {
                    // Same vote clicked, do nothing (prevent vote removal)
                    console.log('Same vote clicked in fallback, ignoring to maintain exclusive selection');
                    btn.classList.remove('loading');
                    return;
                } else {
                    action = 'switch';
                }
                this.handleAnonymousVoteAction(voteType, action, btn, oppositeBtn);
            } else if (error.code === 'unavailable') {
                this.showMessage('Firebase is currently unavailable. Please try again later.');
            } else {
                this.showMessage(`Error: ${error.message || 'Unknown error occurred'}`);
            }
        }
    }

    provideFastFeedback(voteType, action, btn, oppositeBtn) {
        // Provide immediate visual feedback to the user who voted
        // This happens instantly before Firebase update completes
        console.log('Providing fast visual feedback for:', voteType, action);
        
        // Immediately update button states for the voting user
        btn.classList.remove('loading');
        
        if (action === 'add' || action === 'switch') {
            btn.classList.add('clicked');
            if (oppositeBtn) {
                oppositeBtn.classList.remove('clicked');
            }
        } else if (action === 'remove') {
            btn.classList.remove('clicked');
        }
        
        // Immediately update vote counts displayed locally for instant feedback
        const currentLikes = parseInt(localStorage.getItem('piano_likes_count') || '0');
        const currentDislikes = parseInt(localStorage.getItem('piano_dislikes_count') || '0');
        
        let previewLikes = currentLikes;
        let previewDislikes = currentDislikes;
        
        // Calculate what the new counts should be for immediate display
        if (action === 'add') {
            if (voteType === 'like') {
                previewLikes++;
            } else {
                previewDislikes++;
            }
        } else if (action === 'switch') {
            if (voteType === 'like') {
                previewLikes++;
                previewDislikes = Math.max(0, previewDislikes - 1);
            } else {
                previewDislikes++;
                previewLikes = Math.max(0, previewLikes - 1);
            }
        } else if (action === 'remove') {
            if (voteType === 'like') {
                previewLikes = Math.max(0, previewLikes - 1);
            } else {
                previewDislikes = Math.max(0, previewDislikes - 1);
            }
        }
        
        // Update display instantly for immediate user feedback
        this.updateCountDisplay(previewLikes, previewDislikes);
        
        // Update user vote status immediately for fast feedback
        if (action === 'remove') {
            this.setUserVote(null); // Clear the vote
        } else {
            this.setUserVote(voteType);
        }
        
        console.log('Fast feedback provided - instant count update:', { previewLikes, previewDislikes });
    }

    handleAnonymousVoteAction(voteType, action, btn, oppositeBtn) {
        // Handle voting for non-authenticated users using localStorage
        const currentLikes = parseInt(localStorage.getItem('piano_likes_count') || '0');
        const currentDislikes = parseInt(localStorage.getItem('piano_dislikes_count') || '0');
        
        let newLikes = currentLikes;
        let newDislikes = currentDislikes;
        
        if (action === 'add') {
            if (voteType === 'like') {
                newLikes++;
            } else {
                newDislikes++;
            }
        } else if (action === 'switch') {
            if (voteType === 'like') {
                newLikes++;
                newDislikes = Math.max(0, newDislikes - 1);
            } else {
                newDislikes++;
                newLikes = Math.max(0, newLikes - 1);
            }
        } else if (action === 'remove') {
            if (voteType === 'like') {
                newLikes = Math.max(0, newLikes - 1);
            } else {
                newDislikes = Math.max(0, newDislikes - 1);
            }
        }
        
        // Update localStorage
        localStorage.setItem('piano_likes_count', newLikes.toString());
        localStorage.setItem('piano_dislikes_count', newDislikes.toString());
        
        // Update user's vote preference
        if (action === 'remove') {
            this.setUserVote(null); // Clear the vote
        } else {
            this.setUserVote(voteType);
        }
        
        // Update UI
        this.updateButtonStates(voteType, action, btn, oppositeBtn);
        
        // Show success message (hidden per user request)
        // this.showSuccessMessage(voteType, action, true);
        
        // Update display with localStorage values first
        this.updateCountDisplay(newLikes, newDislikes);
        
        // Try to refresh from Firestore to get latest global counts
        try {
            console.log('Refreshing counts from Firestore after anonymous vote...');
            setTimeout(async () => {
                await this.loadFeedbackCounts();
            }, 500); // Small delay to allow UI update first
        } catch (error) {
            console.error('Error refreshing from Firestore:', error);
        }
    }

    async updateFirestoreCountWithAction(voteType, action) {
        console.log('updateFirestoreCountWithAction called with:', voteType, action);
        console.log('Database object:', db);
        
        const docRef = doc(db, 'feedback', this.feedbackDoc);
        console.log('Document reference created:', docRef);
        
        try {
            // Get current counts
            console.log('Getting document...');
            const docSnap = await getDoc(docRef);
            console.log('Document snapshot received:', docSnap.exists());
            
            let currentLikes = 0;
            let currentDislikes = 0;

            if (docSnap.exists()) {
                const data = docSnap.data();
                console.log('Current document data:', data);
                currentLikes = data.likes || 0;
                currentDislikes = data.dislikes || 0;
            } else {
                console.log('Document does not exist, will create new one');
            }

            let newLikes = currentLikes;
            let newDislikes = currentDislikes;
            
            // Apply the action
            if (action === 'add') {
                if (voteType === 'like') {
                    newLikes++;
                } else {
                    newDislikes++;
                }
            } else if (action === 'switch') {
                if (voteType === 'like') {
                    newLikes++;
                    newDislikes = Math.max(0, newDislikes - 1);
                } else {
                    newDislikes++;
                    newLikes = Math.max(0, newLikes - 1);
                }
            } else if (action === 'remove') {
                if (voteType === 'like') {
                    newLikes = Math.max(0, newLikes - 1);
                } else {
                    newDislikes = Math.max(0, newDislikes - 1);
                }
            }

            // Prepare new data
            const newData = {
                likes: newLikes,
                dislikes: newDislikes,
                lastUpdated: new Date().toISOString()
            };
            
            console.log('New data to be saved:', newData);
            console.log('Setting document...');
            await setDoc(docRef, newData);
            console.log('Document set successfully');
            
        } catch (error) {
            console.error('Error in updateFirestoreCountWithAction:', error);
            throw error; // Re-throw to be caught by handleVote
        }
    }

    updateCountDisplay(likes, dislikes) {
        const likeCount = document.getElementById('like-count');
        const dislikeCount = document.getElementById('dislike-count');

        if (likeCount) {
            likeCount.textContent = likes;
        }
        if (dislikeCount) {
            dislikeCount.textContent = dislikes;
        }
    }

    hasUserVoted(voteType) {
        return localStorage.getItem(`piano_${voteType}_voted`) === 'true';
    }

    markUserVoted(voteType) {
        localStorage.setItem(`piano_${voteType}_voted`, 'true');
    }

    // New methods for updated voting system
    getUserCurrentVote() {
        const likeVoted = localStorage.getItem('piano_user_vote') === 'like';
        const dislikeVoted = localStorage.getItem('piano_user_vote') === 'dislike';
        
        if (likeVoted) return 'like';
        if (dislikeVoted) return 'dislike';
        return null;
    }

    setUserVote(voteType) {
        if (voteType === null) {
            localStorage.removeItem('piano_user_vote');
        } else {
            localStorage.setItem('piano_user_vote', voteType);
        }
    }

    updateButtonStates(voteType, action, btn, oppositeBtn) {
        btn.classList.remove('loading');
        
        if (action === 'add' || action === 'switch') {
            // Activate the clicked button
            btn.classList.add('clicked');
            // Deactivate the opposite button
            if (oppositeBtn) {
                oppositeBtn.classList.remove('clicked');
            }
        } else if (action === 'remove') {
            // Deactivate the clicked button (allow unlike/undislike)
            btn.classList.remove('clicked');
        }
    }

    showSuccessMessage(voteType, action, isOffline = false) {
        const offlineText = isOffline ? ' (Offline mode)' : '';
        let message = '';
        
        if (action === 'add') {
            message = `Thanks for your ${voteType}!${offlineText}`;
        } else if (action === 'switch') {
            message = `Changed to ${voteType}!${offlineText}`;
        } else if (action === 'remove') {
            message = `Removed your ${voteType}!${offlineText}`;
        }
        
        this.showMessage(message);
    }

    checkUserVoteStatus() {
        const likeBtn = document.getElementById('like-btn');
        const dislikeBtn = document.getElementById('dislike-btn');
        const currentVote = this.getUserCurrentVote();

        // Remove all clicked states first
        if (likeBtn) likeBtn.classList.remove('clicked');
        if (dislikeBtn) dislikeBtn.classList.remove('clicked');

        // Apply the current vote state
        if (currentVote === 'like' && likeBtn) {
            likeBtn.classList.add('clicked');
        } else if (currentVote === 'dislike' && dislikeBtn) {
            dislikeBtn.classList.add('clicked');
        }
    }

    showMessage(message) {
        const messageEl = document.getElementById('feedback-message');
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.classList.add('show');
            
            setTimeout(() => {
                messageEl.classList.remove('show');
                setTimeout(() => {
                    messageEl.textContent = '';
                }, 300);
            }, 3000);
        }
    }

    // Cleanup method to unsubscribe from real-time listener
    destroy() {
        if (this.unsubscribe) {
            console.log('Unsubscribing from real-time listener...');
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }
}

// Initialize feedback system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other initializations to complete
    setTimeout(() => {
        const pianoFeedback = new PianoFeedback();
        
        // Cleanup listener when page unloads
        window.addEventListener('beforeunload', () => {
            pianoFeedback.destroy();
        });
    }, 1000);
});
