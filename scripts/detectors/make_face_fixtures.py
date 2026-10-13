"""Offline identity fixtures from in-repo demo frames (TEST MATERIAL ONLY, not character refs):
ref = demo-romance full frame; same_flip / same_scaled / same_bright = same frame transformed (same largest face);
other = demo-anime (different person); noface = sky patch."""
import sys, cv2
romance, anime, out = sys.argv[1], sys.argv[2], sys.argv[3]
img = cv2.imread(romance)
cv2.imwrite(f'{out}/ref.png', img); cv2.imwrite(f'{out}/same_flip.png', cv2.flip(img, 1))
cv2.imwrite(f'{out}/same_scaled.png', cv2.resize(img, None, fx=0.8, fy=0.8, interpolation=cv2.INTER_AREA))
cv2.imwrite(f'{out}/same_bright.png', cv2.convertScaleAbs(img, alpha=1.15, beta=12))
cv2.imwrite(f'{out}/other.png', cv2.imread(anime)); cv2.imwrite(f'{out}/noface.png', img[0:120, 0:120])
