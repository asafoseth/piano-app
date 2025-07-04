/**
 * uiRestrictions.js
 *
 * This module contains functions to apply specific UI restrictions
 * to improve usability, such as preventing the on-screen keyboard
 * for certain inputs.
 */

/**
 * Makes specified input fields read-only to prevent the on-screen keyboard
 * on mobile devices. This is for inputs that should be populated by
 * interacting with other UI elements (like the piano keyboard).
 */
export function applyInputRestrictions() {
    const tabNoteInputs = document.querySelectorAll('.tab-note-input');
    tabNoteInputs.forEach(input => {
        input.readOnly = true;
    });
    console.log("UI Restrictions Applied: TAB inputs are now read-only.");
}

