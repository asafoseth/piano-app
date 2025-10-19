import enableChordPlaying from './multiKeyChords.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDocs, collection, query, where, deleteDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

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

  // --- Mobile Device Optimizations ---
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isWindowsMobile = /Windows Phone|IEMobile/i.test(navigator.userAgent);
  
  if (isMobile) {
    console.log(`Mobile device detected: iOS: ${isIOS}, Android: ${isAndroid}, Windows Mobile: ${isWindowsMobile}`);
    
    // Add mobile-specific CSS class to body for conditional styling
    document.body.classList.add('mobile-device');
    if (isIOS) document.body.classList.add('ios-device');
    if (isAndroid) document.body.classList.add('android-device');
    if (isWindowsMobile) document.body.classList.add('windows-mobile-device');
    
    // Prevent zoom on double-tap for better touch experience
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        // Double tap detected on non-piano elements
        if (!event.target.closest('.key')) {
          event.preventDefault();
        }
      }
      lastTouchEnd = now;
    }, false);
    
    // Improve touch scrolling performance
    document.addEventListener('touchstart', function(e) {
      // Only prevent default on piano keys, allow natural scrolling elsewhere
      if (!e.target.closest('.key')) {
        return; // Allow default behavior for scrolling
      }
    }, { passive: true });
    
    // Add mobile-friendly touch feedback
    document.addEventListener('touchstart', function(e) {
      if (e.target.closest('button, .key')) {
        e.target.style.transform = 'scale(0.95)';
        e.target.style.transition = 'transform 0.1s ease';
      }
    }, { passive: true });
    
    document.addEventListener('touchend', function(e) {
      if (e.target.closest('button, .key')) {
        setTimeout(() => {
          e.target.style.transform = '';
        }, 100);
      }
    }, { passive: true });
    
    // Optimize for mobile keyboards (prevent zoom on input focus)
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea');
    inputs.forEach(input => {
      input.addEventListener('focus', function() {
        // Instead of changing viewport, use CSS to prevent zoom
        // Apply font-size: 16px to prevent iOS zoom without changing viewport
        if (isIOS && !input.style.fontSize) {
          input.style.fontSize = '16px';
        }
        
        // Add focused class for styling
        input.classList.add('ios-input-focused');
      });
      
      input.addEventListener('blur', function() {
        // Remove focused class
        input.classList.remove('ios-input-focused');
      });
    });
    
    // Add swipe gesture support for navigation (optional)
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener('touchstart', function(e) {
      if (e.target.closest('.piano-keys')) return; // Don't interfere with piano
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener('touchmove', function(e) {
      if (e.target.closest('.piano-keys')) return; // Don't interfere with piano
      
      const touchEndX = e.touches[0].clientX;
      const touchEndY = e.touches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      
      // Add custom swipe logic here if needed for navigation
      // For now, just ensure smooth scrolling
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        // Vertical swipe - allow default scrolling
        return;
      }
    }, { passive: true });
  }

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

    // Initialize Piano Feedback System
    console.log('🚀 Initializing PianoFeedback system...');
    setTimeout(() => {
        window.pianoFeedbackInstance = new PianoFeedback();
        console.log('📌 PianoFeedback instance created and stored globally');
    }, 500); // Small delay to ensure DOM is fully ready

}); // End DOMContentLoaded

const loginBtn = document.getElementById('show-login-modal');
const floatingLoginBtn = document.getElementById('floating-login-btn');
const userInfoSpan = document.getElementById('user-info');

// Listen for auth state changes
onAuthStateChanged(auth, user => {
  if (user) {
    // User is logged in
    loginBtn.textContent = "Logout";
    if (floatingLoginBtn) {
      floatingLoginBtn.textContent = "Logout";
      floatingLoginBtn.onclick = () => {
        signOut(auth);
      };
    }
    userInfoSpan.textContent = user.displayName || user.email;
    userInfoSpan.style.display = "inline";
    loginBtn.onclick = () => {
      signOut(auth);
    };
  } else {
    // User is logged out
    loginBtn.textContent = "Login";
    if (floatingLoginBtn) {
      floatingLoginBtn.textContent = "Login";
      floatingLoginBtn.onclick = () => {
        document.getElementById('login-modal').style.display = 'block';
      };
    }
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

// Floating login button functionality (same as main login button)
if (floatingLoginBtn) {
  floatingLoginBtn.onclick = () => {
    document.getElementById('login-modal').style.display = 'block';
  };
}

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

    // iOS optimizations - Allow pinch-zoom while preventing input auto-zoom
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
        const now = (new Date()).getTime();
        // Only prevent double-tap zoom on input fields, not globally
        if (event.target.tagName === 'INPUT' && now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);

    // Allow pinch-zoom gestures - do not prevent them
    document.addEventListener('gesturestart', function (e) {
        console.log('Pinch gesture started - allowing zoom');
        // Do not prevent default - allow pinch-zoom
    }, { passive: true });
    
    document.addEventListener('gesturechange', function (e) {
        // Do not prevent default - allow pinch-zoom
    }, { passive: true });
    
    document.addEventListener('gestureend', function (e) {
        // Do not prevent default - allow pinch-zoom
    }, { passive: true });
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
        this.realtimeListener = null; // Store the real-time listener
        this.init();
    }

    async init() {
        console.log('🎹 Initializing PianoFeedback system...');
        console.log('Firebase db object:', db);
        
        // Always load fresh counts from database first
        console.log('📊 Loading fresh feedback counts from database...');
        await this.loadFeedbackCounts();
        
        // Then test Firebase connectivity and initialize document if needed
        await this.initializeFeedbackDocument();
        
        // Load counts again after initialization to ensure we have latest data
        console.log('🔄 Reloading feedback counts after initialization...');
        await this.loadFeedbackCounts();
        
        this.setupEventListeners();
        this.checkUserVoteStatus();
        
        // Set up automatic refresh on page visibility changes
        this.setupAutoRefresh();
        
        // Set up real-time listener for global synchronization
        this.setupRealtimeListener();
        
        console.log('✅ PianoFeedback system fully initialized');
    }

    setupRealtimeListener() {
        console.log('🌐 Setting up real-time listener for global synchronization...');
        
        const docRef = doc(db, 'feedback', this.feedbackDoc);
        
        // Set up real-time listener
        this.realtimeListener = onSnapshot(docRef, (docSnap) => {
            console.log('🔄 Real-time update received from Firestore!');
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                const likes = data.likes || 0;
                const dislikes = data.dislikes || 0;
                const lastUpdated = data.lastUpdated;
                const lastAction = data.lastAction;
                const totalVotes = data.totalVotes || (likes + dislikes);
                
                console.log(`🌍 GLOBAL UPDATE: ${likes} likes, ${dislikes} dislikes`);
                console.log(`⏰ Last updated: ${lastUpdated}`);
                console.log(`🎯 Last action: ${lastAction || 'unknown'}`);
                console.log(`📊 Total votes: ${totalVotes}`);
                console.log('📡 Updating display for all users worldwide...');
                
                // Update the display immediately
                this.updateCountDisplay(likes, dislikes);
                
                // Store in localStorage as backup with timestamp
                localStorage.setItem('piano_likes_count', likes.toString());
                localStorage.setItem('piano_dislikes_count', dislikes.toString());
                localStorage.setItem('piano_counts_last_updated', lastUpdated || new Date().toISOString());
                localStorage.setItem('piano_last_action', lastAction || 'unknown');
                
                console.log('✅ Real-time update applied successfully');
                console.log('💾 Backup data stored in localStorage');
            } else {
                console.log('⚠️ Real-time listener: Document does not exist');
                // Initialize document if it doesn't exist
                this.initializeFeedbackDocument();
            }
        }, (error) => {
            console.error('❌ Real-time listener error:', error);
            console.error('Falling back to periodic updates...');
            
            // Fallback to periodic updates if real-time fails
            this.setupPeriodicUpdates();
        });
        
        console.log('🎯 Real-time listener activated - all users will see live updates!');
    }

    setupPeriodicUpdates() {
        // Fallback: refresh counts every 10 seconds if real-time fails
        setInterval(() => {
            console.log('⏰ Fallback update - checking for changes...');
            this.loadFeedbackCounts();
        }, 10000); // 10 seconds
    }

    setupAutoRefresh() {
        // Refresh counts when page becomes visible again
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('👁️ Page became visible - refreshing feedback counts...');
                this.loadFeedbackCounts();
            }
        });

        // Refresh counts when window gains focus
        window.addEventListener('focus', () => {
            console.log('🎯 Window gained focus - refreshing feedback counts...');
            this.loadFeedbackCounts();
        });

        // Refresh counts every 30 seconds to stay up-to-date
        setInterval(() => {
            console.log('⏰ Auto-refresh - updating feedback counts...');
            this.loadFeedbackCounts();
        }, 30000); // 30 seconds
    }

    // Cleanup method to properly dispose of real-time listener
    destroy() {
        if (this.realtimeListener) {
            console.log('🧹 Cleaning up real-time listener...');
            this.realtimeListener(); // Call the unsubscribe function
            this.realtimeListener = null;
            console.log('✅ Real-time listener cleaned up');
        }
    }

    async initializeFeedbackDocument() {
        try {
            console.log('Initializing feedback document...');
            const docRef = doc(db, 'feedback', this.feedbackDoc);
            
            // First, try to read the document to check permissions
            console.log('Testing read permissions...');
            const docSnap = await getDoc(docRef);
            console.log('✅ Read permissions OK');
            
            if (!docSnap.exists()) {
                console.log('Creating initial feedback document...');
                // Test write permissions
                const initialData = {
                    likes: 0,
                    dislikes: 0,
                    created: new Date().toISOString(),
                    lastUpdated: new Date().toISOString(),
                    version: "1.0"
                };
                
                await setDoc(docRef, initialData);
                console.log('✅ Initial feedback document created successfully');
            } else {
                console.log('✅ Feedback document already exists');
                
                // Test write permissions by updating lastAccessed
                const updateData = {
                    ...docSnap.data(),
                    lastAccessed: new Date().toISOString()
                };
                await setDoc(docRef, updateData);
                console.log('✅ Write permissions OK');
            }
            
            console.log('✅ Firebase connection and permissions test successful');
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            
            if (error.code === 'permission-denied') {
                console.error('🔒 PERMISSION DENIED: Firestore security rules are blocking access');
                console.error('💡 SOLUTION: Update your Firestore security rules to allow feedback collection access');
                this.showMessage('🔒 Database permissions need to be updated. Using offline mode for now.');
            } else {
                this.showMessage('🔧 Firebase connection failed. Using offline mode.');
            }
        }
    }

    async loadFeedbackCounts() {
        try {
            console.log('📥 Loading feedback counts from Firestore...');
            const docRef = doc(db, 'feedback', this.feedbackDoc);
            const docSnap = await getDoc(docRef);
            
            let likes = 0;
            let dislikes = 0;

            if (docSnap.exists()) {
                const data = docSnap.data();
                console.log('📊 Loaded data from Firebase:', data);
                likes = data.likes || 0;
                dislikes = data.dislikes || 0;
                console.log(`✅ Fresh counts loaded: ${likes} likes, ${dislikes} dislikes`);
            } else {
                console.log('⚠️ Document does not exist, creating new one...');
                // If document doesn't exist, create it with initial values
                const timestamp = new Date().toISOString();
                const initialData = {
                    likes: 0,
                    dislikes: 0,
                    totalVotes: 0,
                    created: timestamp,
                    lastUpdated: timestamp,
                    firstVoteTimestamp: null,
                    lastAction: 'initial_creation',
                    lastVoteType: null,
                    lastVoteAction: null,
                    version: '2.0'
                };
                
                await setDoc(docRef, initialData);
                console.log('📄 New document created successfully with timestamp tracking');
                console.log('⏰ Initial lastUpdated set to:', timestamp);
                likes = 0;
                dislikes = 0;
            }

            // Always update the display with fresh data
            this.updateCountDisplay(likes, dislikes);
            console.log('🔄 Display updated with latest counts');
            console.log(`📊 CURRENT AGGREGATED TOTALS - Likes: ${likes}, Dislikes: ${dislikes}, Total: ${likes + dislikes}`);
            
            // Store in localStorage as backup
            localStorage.setItem('piano_likes_count', likes.toString());
            localStorage.setItem('piano_dislikes_count', dislikes.toString());
            localStorage.setItem('piano_counts_last_updated', new Date().toISOString());
            
        } catch (error) {
            console.error('❌ Error loading feedback counts:', error);
            console.error('Error details:', error.code, error.message);
            
            // Try to load from localStorage as fallback
            const storedLikes = localStorage.getItem('piano_likes_count') || '0';
            const storedDislikes = localStorage.getItem('piano_dislikes_count') || '0';
            const lastUpdated = localStorage.getItem('piano_counts_last_updated');
            
            console.log('🔄 Falling back to localStorage data');
            console.log(`📱 Offline counts: ${storedLikes} likes, ${storedDislikes} dislikes`);
            if (lastUpdated) {
                console.log(`⏰ Last updated: ${lastUpdated}`);
            }
            
            this.updateCountDisplay(parseInt(storedLikes), parseInt(storedDislikes));
            this.showMessage('📱 Using offline mode. Counts will sync when connection is restored.');
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
                // Same vote clicked, remove it
                action = 'remove';
            } else {
                // Different vote clicked, switch votes
                action = 'switch';
            }
            
            console.log('Vote action:', action);

            console.log('Updating Firestore count...');
            // Update Firestore (allow anonymous users for feedback)
            await this.updateFirestoreCountWithAction(voteType, action);
            console.log('Firestore update successful');
            
            // Update user's vote preference
            this.setUserVote(action === 'remove' ? null : voteType);
            
            // Update UI
            this.updateButtonStates(voteType, action, btn, oppositeBtn);
            
            // Show success message (hidden per user request)
            // this.showSuccessMessage(voteType, action);
            
            // Note: No need to manually reload counts - real-time listener handles this
            console.log('✅ Vote submitted - real-time listener will update all displays globally');
            
        } catch (error) {
            console.error(`Detailed error submitting ${voteType}:`, error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            btn.classList.remove('loading');
            
            // Handle specific Firebase errors
            if (error.code === 'permission-denied') {
                console.log('Permission denied - check Firebase security rules');
                this.showMessage('🔒 Database permissions need to be updated. Check Firebase security rules.');
            } else if (error.code === 'unavailable') {
                this.showMessage('🔧 Firebase is currently unavailable. Please try again later.');
            } else if (error.code === 'unauthenticated') {
                this.showMessage('🔑 Authentication issue. Please refresh the page and try again.');
            } else {
                this.showMessage(`❌ Error: ${error.message || 'Unknown error occurred'}`);
            }
        }
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
        } else if (action === 'remove') {
            if (voteType === 'like') {
                newLikes = Math.max(0, newLikes - 1);
            } else {
                newDislikes = Math.max(0, newDislikes - 1);
            }
        } else if (action === 'switch') {
            if (voteType === 'like') {
                newLikes++;
                newDislikes = Math.max(0, newDislikes - 1);
            } else {
                newDislikes++;
                newLikes = Math.max(0, newLikes - 1);
            }
        }
        
        // Update localStorage
        localStorage.setItem('piano_likes_count', newLikes.toString());
        localStorage.setItem('piano_dislikes_count', newDislikes.toString());
        
        // Update user's vote preference
        this.setUserVote(action === 'remove' ? null : voteType);
        
        // Update UI
        this.updateButtonStates(voteType, action, btn, oppositeBtn);
        
        // Show success message (hidden per user request)
        // this.showSuccessMessage(voteType, action, true);
        
        // Update display
        this.updateCountDisplay(newLikes, newDislikes);
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
            console.log('Document snapshot received. Exists:', docSnap.exists());
            
            let currentLikes = 0;
            let currentDislikes = 0;

            if (docSnap.exists()) {
                const data = docSnap.data();
                console.log('Current document data:', data);
                currentLikes = data.likes || 0;
                currentDislikes = data.dislikes || 0;
            } else {
                console.log('Document does not exist, will create new one with initial values');
                // Initialize with zero values since document doesn't exist
                currentLikes = 0;
                currentDislikes = 0;
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
            } else if (action === 'remove') {
                if (voteType === 'like') {
                    newLikes = Math.max(0, newLikes - 1);
                } else {
                    newDislikes = Math.max(0, newDislikes - 1);
                }
            } else if (action === 'switch') {
                if (voteType === 'like') {
                    newLikes++;
                    newDislikes = Math.max(0, newDislikes - 1);
                } else {
                    newDislikes++;
                    newLikes = Math.max(0, newLikes - 1);
                }
            }

            // Prepare new data with comprehensive tracking
            const timestamp = new Date().toISOString();
            const newData = {
                likes: newLikes,
                dislikes: newDislikes,
                lastUpdated: timestamp,
                lastAction: `${action}_${voteType}`, // e.g., "add_like", "remove_dislike", "switch_like"
                lastVoteType: voteType,
                lastVoteAction: action,
                totalVotes: newLikes + newDislikes,
                lastVoteTimestamp: timestamp,
                // Add created timestamp if this is a new document
                ...(docSnap.exists() ? {} : { 
                    created: timestamp,
                    firstVoteTimestamp: timestamp 
                })
            };
            
            console.log('📊 New data to be saved:', newData);
            console.log('⏰ Updating lastUpdated timestamp:', timestamp);
            console.log('🎯 Vote action tracked:', `${action}_${voteType}`);
            console.log('🔄 Setting document...');
            await setDoc(docRef, newData);
            console.log('✅ Document set successfully. New counts - Likes:', newLikes, 'Dislikes:', newDislikes);
            console.log('📅 lastUpdated timestamp saved:', timestamp);
            
            // Note: The real-time listener will automatically update all displays
            console.log('🌍 Real-time update will propagate to all users automatically');
            console.log('🔔 All users worldwide will see the new timestamp and counts');
            
        } catch (error) {
            console.error('Error in updateFirestoreCountWithAction:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            throw error; // Re-throw to be caught by handleVote
        }
    }

    updateCountDisplay(likes, dislikes) {
        const likeCount = document.getElementById('like-count');
        const dislikeCount = document.getElementById('dislike-count');

        console.log('🔄 Updating count display...');
        console.log(`   👍 Setting likes to: ${likes}`);
        console.log(`   👎 Setting dislikes to: ${dislikes}`);

        if (likeCount) {
            likeCount.textContent = likes;
            console.log('✅ Like count element updated');
        } else {
            console.error('❌ Could not find like-count element');
        }
        
        if (dislikeCount) {
            dislikeCount.textContent = dislikes;
            console.log('✅ Dislike count element updated');
        } else {
            console.error('❌ Could not find dislike-count element');
        }
        
        // Log total votes for debugging
        const totalVotes = likes + dislikes;
        console.log(`📊 Display updated - Total feedback: ${totalVotes} votes (${likes} likes, ${dislikes} dislikes)`);
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
            // Deactivate the clicked button
            btn.classList.remove('clicked');
        }
    }

    showSuccessMessage(voteType, action, isOffline = false) {
        const offlineText = isOffline ? ' (Offline mode)' : '';
        let message = '';
        
        if (action === 'add') {
            message = `Thanks for your ${voteType}!${offlineText}`;
        } else if (action === 'remove') {
            message = `${voteType.charAt(0).toUpperCase() + voteType.slice(1)} removed${offlineText}`;
        } else if (action === 'switch') {
            message = `Changed to ${voteType}!${offlineText}`;
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
}

// Also ensure feedback loads on page load/refresh
window.addEventListener('load', () => {
    setTimeout(() => {
        console.log('🔄 Page fully loaded - ensuring feedback counts are current...');
        if (window.pianoFeedbackInstance) {
            window.pianoFeedbackInstance.loadFeedbackCounts();
        } else {
            // Fallback if instance not ready yet
            window.checkFeedbackCounts();
        }
    }, 2000);
});

// Manual function to initialize feedback document (for testing)
window.initializeFeedbackDocument = async function() {
    try {
        console.log('Manually initializing feedback document...');
        const docRef = doc(db, 'feedback', 'pianoFeedback');
        
        const initialData = {
            likes: 0,
            dislikes: 0,
            created: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            version: "1.0",
            description: "Piano app feedback counters"
        };
        
        await setDoc(docRef, initialData);
        console.log('✅ Feedback document created successfully!');
        console.log('Document data:', initialData);
        
        // Verify it was created
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            console.log('✅ Verification successful - document exists in Firestore');
            console.log('Retrieved data:', docSnap.data());
        } else {
            console.log('❌ Verification failed - document not found');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize feedback document:', error);
        console.error('Error details:', error.code, error.message);
        return false;
    }
};

// Function to check current aggregated feedback counts
window.checkFeedbackCounts = async function() {
    try {
        console.log('🔍 Checking current feedback counts and timestamps...');
        const docRef = doc(db, 'feedback', 'pianoFeedback');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            const likes = data.likes || 0;
            const dislikes = data.dislikes || 0;
            const total = likes + dislikes;
            const lastUpdated = data.lastUpdated;
            const lastAction = data.lastAction;
            const created = data.created;
            const totalVotes = data.totalVotes || total;
            
            console.log('📊 CURRENT FEEDBACK TOTALS:');
            console.log(`   👍 Likes: ${likes}`);
            console.log(`   👎 Dislikes: ${dislikes}`);
            console.log(`   🔢 Total votes: ${totalVotes}`);
            console.log(`   📅 Last updated: ${lastUpdated || 'Unknown'}`);
            console.log(`   🎯 Last action: ${lastAction || 'Unknown'}`);
            console.log(`   🏗️ Created: ${created || 'Unknown'}`);
            
            if (lastUpdated) {
                const updateTime = new Date(lastUpdated);
                const now = new Date();
                const timeDiff = Math.round((now - updateTime) / 1000);
                console.log(`   ⏱️ Time since last update: ${timeDiff} seconds ago`);
                
                if (timeDiff < 60) {
                    console.log('   🔥 Very recent activity!');
                } else if (timeDiff < 3600) {
                    console.log(`   ⏰ Updated ${Math.round(timeDiff/60)} minutes ago`);
                } else {
                    console.log(`   📅 Updated ${Math.round(timeDiff/3600)} hours ago`);
                }
            }
            
            // Also update the display
            const likeElement = document.getElementById('like-count');
            const dislikeElement = document.getElementById('dislike-count');
            if (likeElement) likeElement.textContent = likes;
            if (dislikeElement) dislikeElement.textContent = dislikes;
            
            return { likes, dislikes, total, lastUpdated, lastAction, created, totalVotes };
        } else {
            console.log('❌ No feedback document found');
            return null;
        }
    } catch (error) {
        console.error('❌ Error checking feedback counts:', error);
        return null;
    }
};

// Function to manually refresh feedback counts
window.refreshFeedbackCounts = async function() {
    try {
        console.log('🔄 Manually refreshing feedback counts...');
        
        // Get the current PianoFeedback instance if it exists
        if (window.pianoFeedbackInstance) {
            await window.pianoFeedbackInstance.loadFeedbackCounts();
            console.log('✅ Feedback counts refreshed successfully');
        } else {
            // Fallback: call the check function
            await window.checkFeedbackCounts();
            console.log('✅ Feedback counts checked and updated');
        }
    } catch (error) {
        console.error('❌ Error refreshing feedback counts:', error);
    }
};

// TAB INPUT HOME BUTTON REDIRECT WITH YELLOW FLASH
document.addEventListener("DOMContentLoaded", () => {
    console.log('🎯 Setting up TAB input home button redirect system...');
    
    // Wait for everything to be fully loaded
    setTimeout(() => {
        const tabInputs = document.querySelectorAll('.tab-note-input');
        const homeButton = document.querySelector('.nav-button') || 
                          document.querySelector('a[href="#"]') || 
                          document.querySelector('nav a:first-child');
        
        console.log('📝 Found TAB inputs:', tabInputs.length);
        console.log('🏠 Home button found:', !!homeButton);
        
        if (homeButton && tabInputs.length > 0) {
            console.log('✅ Initializing TAB redirect system for', tabInputs.length, 'inputs');
            
            // Home button flash function - FAST VERSION
            const flashHomeButton = () => {
                // Store original styles
                const originalBg = homeButton.style.backgroundColor;
                const originalBorder = homeButton.style.border;
                const originalTransition = homeButton.style.transition;
                
                // Apply yellow flash with FAST transition
                homeButton.style.transition = 'all 0.05s ease-in-out';
                homeButton.style.backgroundColor = '#ffff00';
                homeButton.style.border = '2px solid #ff6600';
                homeButton.style.boxShadow = '0 0 8px rgba(255, 255, 0, 0.8)';
                
                console.log('⚡ Home button FAST flash YELLOW!');
                
                // Return to normal after FAST flash
                setTimeout(() => {
                    homeButton.style.backgroundColor = originalBg;
                    homeButton.style.border = originalBorder;
                    homeButton.style.boxShadow = '';
                    
                    // Remove transition after animation
                    setTimeout(() => {
                        homeButton.style.transition = originalTransition;
                    }, 50);
                }, 80); // FAST flash duration - reduced from 300ms to 80ms
            };
            
            // Set up redirect for each TAB input
            tabInputs.forEach((input, index) => {
                let isRedirecting = false;
                
                // Handle both click and focus events
                const handleTabInteraction = (event, eventType) => {
                    if (isRedirecting) return; // Prevent recursive calls
                    
                    console.log(`🎯 ${eventType} on TAB input #${index + 1} - Starting redirect sequence`);
                    
                    // Prevent default behavior
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    
                    isRedirecting = true;
                    
                    // Store cursor position and text for restoration
                    const cursorPosition = input.selectionStart || 0;
                    const textContent = input.value;
                    
                    // Step 1: Focus home button and flash yellow
                    homeButton.focus();
                    flashHomeButton();
                    
                    console.log('🏠 Home button focused and flashing');
                    
                    // Step 2: After FAST flash, quickly refocus the TAB input
                    setTimeout(() => {
                        console.log(`⚡ FAST refocusing TAB input #${index + 1}`);
                        
                        // Focus the original TAB input
                        input.focus();
                        
                        // Restore cursor position
                        try {
                            input.setSelectionRange(cursorPosition, cursorPosition);
                        } catch (e) {
                            console.log('Could not restore cursor position:', e);
                        }
                        
                        console.log(`✅ TAB input #${index + 1} refocused FAST!`);
                        isRedirecting = false;
                        
                    }, 100); // FAST refocus - reduced from 350ms to 100ms
                };
                
                // Add event listeners for click and focus
                input.addEventListener('click', (e) => handleTabInteraction(e, 'CLICK'), true);
                input.addEventListener('focus', (e) => {
                    // Only handle user-initiated focus events
                    if (e.isTrusted) {
                        handleTabInteraction(e, 'FOCUS');
                    }
                }, true);
                
                // Also handle mousedown for complete coverage
                input.addEventListener('mousedown', (e) => {
                    if (!isRedirecting && !input.matches(':focus')) {
                        handleTabInteraction(e, 'MOUSEDOWN');
                    }
                }, true);
                
                console.log(`✅ Redirect handlers set for TAB input #${index + 1}`);
            });
            
            console.log('🎉 TAB input redirect system fully initialized!');
            
            // Create global test function
            window.testTabRedirect = () => {
                console.log('🧪 Testing home button flash...');
                flashHomeButton();
            };
            
            console.log('💡 Test the flash manually with: testTabRedirect()');
            
        } else {
            console.error('❌ TAB redirect setup failed:');
            console.error('   Home button found:', !!homeButton);
            console.error('   TAB inputs found:', tabInputs.length);
        }
    }, 500); // Wait 500ms for DOM to be fully ready
});
