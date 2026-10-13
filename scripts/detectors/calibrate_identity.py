"""Offline AuraFace identity calibration on locked refs (read-only). Embeds EVERY detected face (score>=0.6, side>=40px)
per image; same = pairs within a character (different images or different faces of one sheet); cross = between characters.
Usage: calibrate_identity.py --model glintr100.onnx char=img[,img...] ...  -> JSON stats."""
import sys, json, argparse, itertools, os
import numpy as np, cv2, onnxruntime as ort
sys.path.insert(0, os.path.dirname(__file__)); import face_embed as fe
ap = argparse.ArgumentParser(); ap.add_argument('--model', required=True); ap.add_argument('--det', default='/workspace/v11/models/face/yunet.onnx'); ap.add_argument('--dump'); ap.add_argument('sets', nargs='+')
a = ap.parse_args(); s = ort.InferenceSession(a.model, providers=['CPUExecutionProvider'])
emb = []
for spec in a.sets:
    ch, imgs = spec.split('=', 1)
    for p in imgs.split(','):
        img = cv2.imread(p); h, w = img.shape[:2]
        d = cv2.FaceDetectorYN.create(a.det, '', (w, h), 0.6, 0.3, 50); _, F = d.detect(img)
        for i, f in enumerate([] if F is None else F):
            if min(f[2], f[3]) < 40: continue
            c = cv2.cvtColor(fe.align(img, f[4:14].reshape(5, 2)), cv2.COLOR_BGR2RGB).astype(np.float32)
            e = s.run(None, {s.get_inputs()[0].name: ((c - 127.5) / 127.5).transpose(2, 0, 1)[None]})[0][0]
            emb.append((ch, f'{os.path.basename(p)}#{i}', e / np.linalg.norm(e)))
if a.dump: np.savez(a.dump, ch=[c for c, _, _ in emb], name=[n for _, n, _ in emb], e=np.stack([e for *_, e in emb]))
same, cross = [], []
for (c1, n1, e1), (c2, n2, e2) in itertools.combinations(emb, 2):
    (same if c1 == c2 else cross).append({'a': f'{c1}:{n1}', 'b': f'{c2}:{n2}', 'cos': round(float(e1 @ e2), 4)})
st = lambda L: {'n': len(L), 'min': min(x['cos'] for x in L), 'max': max(x['cos'] for x in L), 'mean': round(float(np.mean([x['cos'] for x in L])), 4)} if L else None
print(json.dumps({'faces': [(c, n) for c, n, _ in emb], 'same': st(same), 'cross': st(cross), 'same_pairs': same, 'cross_pairs': sorted(cross, key=lambda x: -x['cos'])}, indent=1))
# leave-one-out: each face vs the remaining faces of every character (max cosine), excluding faces from the same image
names = [n.split('#')[0] for _, n, _ in emb]; chars = sorted({c for c, _, _ in emb}); loo = []
for i, (c, n, e) in enumerate(emb):
    best = {k: max([float(e @ emb[j][2]) for j in range(len(emb)) if emb[j][0] == k and j != i and not (k == c and names[j] == names[i] and c != 'qi-ye')] or [None]) if any(emb[j][0] == k and j != i for j in range(len(emb))) else None for k in chars}
    loo.append({'face': f'{c}:{n}', 'claimed': c, 'scores': {k: (round(v, 4) if v is not None else None) for k, v in best.items()}})
print(json.dumps({'loo': loo}))
