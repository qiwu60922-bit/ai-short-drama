"""V13 local face embedding (ArcFace ONNX, e.g. InsightFace w600k_r50). Free/local only; no network.
Usage: face_embed.py --model MODEL.onnx IMAGE  ->  {"embedding":[...]} or {"embedding":null,"reason":...}
Expects an aligned/cropped face image (112x112 after resize). Face detection/alignment: TODO with real material
(code ready, awaiting real material)."""
import json, sys, argparse
import numpy as np
from PIL import Image
ap = argparse.ArgumentParser(); ap.add_argument('--model', required=True); ap.add_argument('image'); a = ap.parse_args()
try:
    import onnxruntime as ort
except ImportError:
    print(json.dumps({"embedding": None, "reason": "onnxruntime missing"})); sys.exit(0)
s = ort.InferenceSession(a.model, providers=['CPUExecutionProvider'])
img = np.asarray(Image.open(a.image).convert('RGB').resize((112, 112)), dtype=np.float32)
x = ((img - 127.5) / 127.5).transpose(2, 0, 1)[None]
e = s.run(None, {s.get_inputs()[0].name: x})[0][0]
print(json.dumps({"embedding": (e / (np.linalg.norm(e) or 1)).tolist()}))
