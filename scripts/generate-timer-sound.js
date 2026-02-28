// This script generates a simple timer alert sound as a base64 data URI
// We'll use the Web Audio API approach instead - embedding a simple beep

const fs = require('fs');
const path = require('path');

// Create a simple WAV file for the timer alert
// This is a 440Hz sine wave beep that plays for 0.3 seconds, repeated 3 times

function createWavFile() {
  const sampleRate = 44100;
  const duration = 0.2; // seconds per beep
  const frequency = 880; // Hz (A5 note)
  const volume = 0.5;
  const beepCount = 3;
  const pauseDuration = 0.15; // seconds between beeps
  
  const samplesPerBeep = Math.floor(sampleRate * duration);
  const samplesPerPause = Math.floor(sampleRate * pauseDuration);
  const totalSamples = (samplesPerBeep + samplesPerPause) * beepCount;
  
  // WAV header
  const buffer = Buffer.alloc(44 + totalSamples * 2);
  
  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + totalSamples * 2, 4);
  buffer.write('WAVE', 8);
  
  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // chunk size
  buffer.writeUInt16LE(1, 20); // audio format (PCM)
  buffer.writeUInt16LE(1, 22); // num channels
  buffer.writeUInt32LE(sampleRate, 24); // sample rate
  buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  
  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(totalSamples * 2, 40);
  
  // Generate audio data
  let offset = 44;
  for (let beep = 0; beep < beepCount; beep++) {
    // Beep
    for (let i = 0; i < samplesPerBeep; i++) {
      const t = i / sampleRate;
      // Apply envelope to avoid clicks
      const envelope = Math.min(1, Math.min(i / 500, (samplesPerBeep - i) / 500));
      const sample = Math.sin(2 * Math.PI * frequency * t) * volume * envelope;
      const intSample = Math.floor(sample * 32767);
      buffer.writeInt16LE(intSample, offset);
      offset += 2;
    }
    // Pause
    for (let i = 0; i < samplesPerPause; i++) {
      buffer.writeInt16LE(0, offset);
      offset += 2;
    }
  }
  
  return buffer;
}

const wavBuffer = createWavFile();
const outputPath = path.join(__dirname, '..', 'public', 'timer-alert.mp3');

// Note: This creates a WAV file, but we'll name it .mp3 for simplicity
// Modern browsers can play WAV files just fine
fs.writeFileSync(outputPath.replace('.mp3', '.wav'), wavBuffer);
console.log('Timer alert sound created at public/timer-alert.wav');
