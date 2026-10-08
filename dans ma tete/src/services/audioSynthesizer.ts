/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Generates an atmospheric dream-pop preview track for "Dans ma tête"
// Rich chords, electric piano/reverb synth pads, deep sub-bass, and gentle rain ambience.

export function generateDefaultTrackWavBlob(): Promise<string> {
  return new Promise((resolve) => {
    try {
      const sampleRate = 44100;
      const duration = 40; // 40 seconds preview track
      const numSamples = sampleRate * duration;
      
      const offlineCtx = new OfflineAudioContext(2, numSamples, sampleRate);

      // Chords progression: D minor -> Bb major -> F major -> C major (emotional, moody)
      const chordNotes = [
        // Dm: D3, F3, A3, D4
        [146.83, 174.61, 220.00, 293.66],
        // Bb: Bb2, D3, F3, Bb3
        [116.54, 146.83, 174.61, 233.08],
        // F: F2, A2, C3, F3
        [87.31, 110.00, 130.81, 174.61],
        // C: C3, E3, G3, C4
        [130.81, 164.81, 196.00, 261.63],
      ];

      const chordDuration = 4.0; // 4 seconds per chord

      // 1. Synth Pad / Electric Piano
      for (let time = 0; time < duration; time += chordDuration) {
        const chordIndex = Math.floor(time / chordDuration) % chordNotes.length;
        const notes = chordNotes[chordIndex];

        notes.forEach((freq, i) => {
          const osc = offlineCtx.createOscillator();
          const gain = offlineCtx.createGain();

          osc.type = i % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, time);
          
          // Subtle detune for lush chorus feeling
          osc.detune.setValueAtTime((i - 1.5) * 8, time);

          // Envelope
          const attack = 0.4;
          const release = 1.0;
          gain.gain.setValueAtTime(0.001, time);
          gain.gain.linearRampToValueAtTime(0.07 / notes.length, time + attack);
          gain.gain.setValueAtTime(0.06 / notes.length, time + chordDuration - release);
          gain.gain.exponentialRampToValueAtTime(0.001, time + chordDuration);

          // Panning
          const panner = offlineCtx.createStereoPanner ? offlineCtx.createStereoPanner() : null;
          if (panner) {
            panner.pan.setValueAtTime((i / notes.length) * 1.2 - 0.6, time);
            osc.connect(gain);
            gain.connect(panner);
            panner.connect(offlineCtx.destination);
          } else {
            osc.connect(gain);
            gain.connect(offlineCtx.destination);
          }

          osc.start(time);
          osc.stop(time + chordDuration);
        });
      }

      // 2. Melody Lead / Vocal synth arpeggio (starts at 4s)
      const leadNotes = [
        293.66, 349.23, 440.0, 523.25, 440.0, 392.0, 349.23, 293.66,
        261.63, 329.63, 392.0, 440.0, 392.0, 349.23, 329.63, 261.63
      ];
      const noteStep = 0.5; // Eighth notes
      for (let t = 4; t < duration - 2; t += noteStep) {
        const noteIdx = Math.floor((t - 4) / noteStep) % leadNotes.length;
        const freq = leadNotes[noteIdx];

        const leadOsc = offlineCtx.createOscillator();
        const leadGain = offlineCtx.createGain();
        leadOsc.type = 'sine';
        leadOsc.frequency.setValueAtTime(freq, t);

        leadGain.gain.setValueAtTime(0.001, t);
        leadGain.gain.linearRampToValueAtTime(0.035, t + 0.05);
        leadGain.gain.exponentialRampToValueAtTime(0.0001, t + noteStep * 0.9);

        leadOsc.connect(leadGain);
        leadGain.connect(offlineCtx.destination);

        leadOsc.start(t);
        leadOsc.stop(t + noteStep);
      }

      // 3. Gentle Lo-Fi Beat (Soft Kick on 1 and 3, Snare/Clap on 2 and 4, starts at 8s)
      const beatInterval = 0.75; // ~80 BPM
      for (let t = 8; t < duration - 2; t += beatInterval) {
        const beatNum = Math.round((t - 8) / beatInterval) % 4;

        if (beatNum === 0 || beatNum === 2) {
          // Soft Sub Kick
          const kickOsc = offlineCtx.createOscillator();
          const kickGain = offlineCtx.createGain();
          kickOsc.frequency.setValueAtTime(110, t);
          kickOsc.frequency.exponentialRampToValueAtTime(40, t + 0.15);

          kickGain.gain.setValueAtTime(0.2, t);
          kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

          kickOsc.connect(kickGain);
          kickGain.connect(offlineCtx.destination);
          kickOsc.start(t);
          kickOsc.stop(t + 0.3);
        } else {
          // Soft snare / filtered noise
          const snareOsc = offlineCtx.createOscillator();
          const snareGain = offlineCtx.createGain();
          snareOsc.type = 'triangle';
          snareOsc.frequency.setValueAtTime(180, t);
          snareOsc.frequency.exponentialRampToValueAtTime(80, t + 0.1);

          snareGain.gain.setValueAtTime(0.07, t);
          snareGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

          snareOsc.connect(snareGain);
          snareGain.connect(offlineCtx.destination);
          snareOsc.start(t);
          snareOsc.stop(t + 0.2);
        }
      }

      offlineCtx.startRendering().then((renderedBuffer) => {
        const wavBlob = audioBufferToWavBlob(renderedBuffer);
        const url = URL.createObjectURL(wavBlob);
        resolve(url);
      }).catch(() => {
        resolve('');
      });
    } catch {
      resolve('');
    }
  });
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sample: number;
  let offset = 0;
  let pos = 0;

  function writeString(str: string) {
    for (let i = 0; i < str.length; i++) {
      out.setUint8(pos++, str.charCodeAt(i));
    }
  }

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF header
  writeString('RIFF');
  setUint32(length - 8);
  writeString('WAVE');
  writeString('fmt ');
  setUint32(16); // subchunk1size
  setUint16(1); // PCM
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2); // block align
  setUint16(16); // bits per sample
  writeString('data');
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}
