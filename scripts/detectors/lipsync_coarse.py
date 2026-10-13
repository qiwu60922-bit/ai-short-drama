"""V13 coarse lip-sync measurement (license-clean): MediaPipe Face Landmarker (Apache-2.0 code + model) mouth opening
per video frame vs audio RMS energy per frame window. Offline, CPU. Emits raw series only; the gate lives in TS.
Usage: lipsync_coarse.py --model face_landmarker.task --video V --audio A -> {"fps":..,"mouth":[..|null],"energy":[..]}"""
import json, argparse, subprocess
import numpy as np
def mouth_series(video, model):
    import cv2, mediapipe as mp
    from mediapipe.tasks.python import vision, BaseOptions
    lm = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(base_options=BaseOptions(model_asset_path=model), running_mode=vision.RunningMode.VIDEO, num_faces=1))
    cap = cv2.VideoCapture(video); fps = cap.get(cv2.CAP_PROP_FPS) or 25.0; out = []; i = 0
    while True:
        ok, fr = cap.read()
        if not ok: break
        r = lm.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)), int(i * 1000 / fps)); i += 1
        if not r.face_landmarks: out.append(None); continue
        p = r.face_landmarks[0]; d = lambda a, b: ((p[a].x - p[b].x) ** 2 + (p[a].y - p[b].y) ** 2) ** 0.5
        out.append(round(d(13, 14) / (d(33, 263) or 1), 5))  # inner-lip gap / inter-ocular distance
    lm.close(); return fps, out
def energy_series(audio, fps, n):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', audio, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768; hop = int(16000 / fps)
    return [round(float(np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2))) if (i + 1) * hop <= len(x) else 0.0, 5) for i in range(n)]
if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--model', required=True); ap.add_argument('--video', required=True); ap.add_argument('--audio', required=True); a = ap.parse_args()
    fps, m = mouth_series(a.video, a.model); print(json.dumps({"fps": fps, "mouth": m, "energy": energy_series(a.audio, fps, len(m))}))
