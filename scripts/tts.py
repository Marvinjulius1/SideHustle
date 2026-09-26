"""Sprachausgabe für ein Video.

Liest JSON von stdin: {"model": "...onnx", "sentences": [...], "out": "voice.wav", "fps": 30}
Schreibt die WAV-Datei und gibt JSON mit Satz-Zeiten und Lautstärke-Hüllkurve (pro Frame) aus.
"""

import json
import sys
import tempfile
import wave
from pathlib import Path

import numpy as np
from piper import PiperVoice, SynthesisConfig
from piper.phoneme_ids import DEFAULT_PHONEME_ID_MAP

PAUSE_S = 0.28      # Pause zwischen Sätzen
LENGTH_SCALE = 0.9  # < 1 = etwas schneller, passt besser zu TikTok


def load_voice(model_path: str) -> PiperVoice:
    # Das npm-Paket enthält nur das ONNX-Modell. Die Konfiguration entspricht
    # dem Standard aller Piper-Stimmen (en_US, 22,05 kHz, espeak-Phoneme).
    config = {
        "num_symbols": 256,
        "num_speakers": 1,
        "audio": {"sample_rate": 22050},
        "espeak": {"voice": "en-us"},
        "inference": {"noise_scale": 0.667, "length_scale": 1, "noise_w": 0.8},
        "phoneme_id_map": DEFAULT_PHONEME_ID_MAP,
        "phoneme_type": "espeak",
    }
    cfg_path = Path(tempfile.gettempdir()) / "pixel-degen-voice.onnx.json"
    cfg_path.write_text(json.dumps(config))
    return PiperVoice.load(model_path, config_path=str(cfg_path))


def synth(voice: PiperVoice, text: str) -> np.ndarray:
    syn = SynthesisConfig(length_scale=LENGTH_SCALE)
    chunks = [c.audio_int16_array for c in voice.synthesize(text, syn_config=syn)]
    return np.concatenate(chunks) if chunks else np.zeros(0, dtype=np.int16)


def main() -> None:
    job = json.load(sys.stdin)
    voice = load_voice(job["model"])
    rate = voice.config.sample_rate
    fps = job.get("fps", 30)
    pause = np.zeros(int(PAUSE_S * rate), dtype=np.int16)

    parts, timings, t = [], [], 0.0
    for sentence in job["sentences"]:
        audio = synth(voice, sentence)
        if audio.size == 0:
            raise SystemExit(f"Keine Audiodaten für: {sentence!r}")
        dur = audio.size / rate
        timings.append({"start": round(t, 4), "end": round(t + dur, 4)})
        parts += [audio, pause]
        t += dur + PAUSE_S
    samples = np.concatenate(parts)

    with wave.open(job["out"], "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(samples.tobytes())

    # Lautstärke pro Video-Frame (0..1) für die Mundbewegung.
    hop = rate / fps
    n = int(np.ceil(samples.size / hop))
    f = samples.astype(np.float32) / 32768.0
    env = [float(np.sqrt(np.mean(f[int(i * hop):int((i + 1) * hop)] ** 2) + 1e-12)) for i in range(n)]
    peak = max(env) or 1.0
    env = [round(min(1.0, e / (peak * 0.6)), 3) for e in env]

    json.dump({"duration": samples.size / rate, "sentences": timings, "envelope": env}, sys.stdout)


if __name__ == "__main__":
    main()
