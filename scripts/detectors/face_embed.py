"""V13 local face embedding — commercially-licensed, CPU, offline.
Detect + 5-point landmarks: OpenCV Zoo YuNet (MIT) -> similarity-align to ArcFace 112x112 template
-> AuraFace-v1 glintr100.onnx (Apache-2.0, 512-d). No InsightFace non-commercial weights.
Usage: face_embed.py --model glintr100.onnx [--det yunet.onnx] IMAGE
  -> {"embedding":[...],"det_score":..,"box":[x,y,w,h],"faces":n} or {"embedding":null,"reason":...}
Largest face is used; feed whole frames (YuNet is unreliable on tight crops). No face -> null (caller: FAIL)."""
import json, os, argparse
import numpy as np
ARCFACE_DST = np.array([[38.2946, 51.6963], [73.5318, 51.5014], [56.0252, 71.7366], [41.5493, 92.3655], [70.7299, 92.2041]], np.float32)
def align(img_bgr, lm5):
    import cv2
    M, _ = cv2.estimateAffinePartial2D(np.asarray(lm5, np.float32), ARCFACE_DST, method=cv2.LMEDS)
    return cv2.warpAffine(img_bgr, M, (112, 112), borderValue=0)
def detect(img_bgr, det_path, score=0.6):
    import cv2
    h, w = img_bgr.shape[:2]
    d = cv2.FaceDetectorYN.create(det_path, '', (w, h), score, 0.3, 50); d.setInputSize((w, h))
    _, faces = d.detect(img_bgr)
    if faces is None or len(faces) == 0: return None, 0
    return max(faces, key=lambda r: r[2] * r[3]), len(faces)
def main(argv=None):
    ap = argparse.ArgumentParser(); ap.add_argument('--model', required=True)
    ap.add_argument('--det', default=os.environ.get('V13_FACE_DET', '/workspace/v11/models/face/yunet.onnx')); ap.add_argument('image')
    a = ap.parse_args(argv)
    try:
        import cv2, onnxruntime as ort
    except ImportError as e:
        return {"embedding": None, "reason": f"dependency missing: {e.name}"}
    img = cv2.imread(a.image)
    if img is None: return {"embedding": None, "reason": "unreadable image"}
    f, n = detect(img, a.det)
    if f is None: return {"embedding": None, "reason": "no face detected", "faces": 0}
    crop = cv2.cvtColor(align(img, f[4:14].reshape(5, 2)), cv2.COLOR_BGR2RGB).astype(np.float32)
    s = ort.InferenceSession(a.model, providers=['CPUExecutionProvider'])
    e = s.run(None, {s.get_inputs()[0].name: ((crop - 127.5) / 127.5).transpose(2, 0, 1)[None]})[0][0]
    return {"embedding": (e / (np.linalg.norm(e) or 1)).tolist(), "det_score": round(float(f[14]), 4), "box": [round(float(x)) for x in f[:4]], "faces": int(n)}
if __name__ == '__main__':
    print(json.dumps(main()))
