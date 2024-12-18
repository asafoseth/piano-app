// Key sequence for transposition
const keySequence = ['A', 'Asharp', 'B', 'C', 'Csharp', 'D', 'Dsharp', 'E', 'F', 'Fsharp', 'G', 'Gsharp'];

// Function to transpose the key and its associated chords
export function transposeKey(currentKey, transposeSteps) {
    const keyIndex = keySequence.indexOf(currentKey);
    if (keyIndex === -1) {
        console.error("Invalid key provided.");
        return currentKey; // Return the same key if invalid
    }

    // Calculate the target key index using modulo for wraparound
    const targetIndex = (keyIndex + transposeSteps + keySequence.length) % keySequence.length;
    const targetKey = keySequence[targetIndex];

    // Reassign the chord lists for the current key to the target key
    chordMaps[currentKey] = { ...chordMaps[targetKey] };

    console.log(`Transposed key from ${currentKey} to ${targetKey}`);

    return targetKey; // Ensure this returns the transposed key
}
