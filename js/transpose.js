export function transposeKey(currentKey, semitones, transposeMap) {
    const allKeys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const currentIndex = allKeys.indexOf(currentKey);

    if (currentIndex === -1) {
        console.warn(`Current key "${currentKey}" not found.`);
        return { newKey: currentKey, remappedChordMap: transposeMap[currentKey][0] };
    }

    // Calculate new key index and wrap within 12 keys
    let newIndex = (currentIndex + semitones) % allKeys.length;
    if (newIndex < 0) newIndex += allKeys.length; // Handle negative wrap-around

    const newKey = allKeys[newIndex];

    // Fetch the correct transposed chord mapping
    const remappedChordMap = transposeMap[currentKey][semitones] || transposeMap[currentKey][0];

    return { newKey, remappedChordMap };
}