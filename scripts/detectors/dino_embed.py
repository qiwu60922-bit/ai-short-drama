"""V13 whole-image embedding — DINOv2-small ONNX (facebook/dinov2-small, Apache-2.0), CPU, offline.
Usage: dino_embed.py --model dinov2-small.onnx IMG [IMG...] -> {"embeddings": {path: [384 floats, L2-normalised CLS]|null}}
Optional --crop-person: crop to the largest YuNet face box expanded x3 wide / x6 tall (whole-character view)."""
import json, argparse, os
import numpy as np
MEAN, STD = np.array([0.485, 0.456, 0.406], np.float32), np.array([0.229, 0.224, 0.225], np.float32)
def prep(img_rgb):
    import cv2
    h, w = img_rgb.shape[:2]; k = 256 / min(h, w); im = cv2.resize(img_rgb, (round(w * k), round(h * k)), interpolation=cv2.INTER_AREA)
    y, x = (im.shape[0] - 224) // 2, (im.shape[1] - 224) // 2; im = im[y:y + 224, x:x + 224].astype(np.float32) / 255
    return ((im - MEAN) / STD).transpose(2, 0, 1)[None]
def person_crop(bgr, det):
    import cv2
    h, w = bgr.shape[:2]; d = cv2.FaceDetectorYN.create(det, '', (w, h), 0.6, 0.3, 50); _, F = d.detect(bgr)
    if F is None or not len(F): return bgr
    x, y, bw, bh = max(F, key=lambda r: r[2] * r[3])[:4]; cx = x + bw / 2
    return bgr[max(0, int(y - bh)):min(h, int(y + 5 * bh)), max(0, int(cx - 1.5 * bw)):min(w, int(cx + 1.5 * bw))]
def embed_all(model, paths, crop=False, det='/workspace/v11/models/face/yunet.onnx'):
    import cv2, onnxruntime as ort
    s = ort.InferenceSession(model, providers=['CPUExecutionProvider']); out = {}
    for p in paths:
        bgr = cv2.imread(p)
        if bgr is None: out[p] = None; continue
        if crop: bgr = person_crop(bgr, det)
        o = s.run(None, {s.get_inputs()[0].name: prep(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))})[0]
        e = o[0, 0] if o.ndim == 3 else o[0]; out[p] = (e / (np.linalg.norm(e) or 1)).tolist()
    return out
if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--model', required=True); ap.add_argument('--crop-person', action='store_true'); ap.add_argument('images', nargs='+')
    a = ap.parse_args(); print(json.dumps({"embeddings": embed_all(a.model, a.images, a.crop_person)}))
