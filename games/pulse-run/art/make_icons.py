"""Derive app icons from assets/icon-1024.png (owner file preferred, gen fallback). Never writes to assets/."""
import os
from PIL import Image
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src=os.path.join(root,'assets','icon-1024.png')
if not os.path.exists(src): src=os.path.join(root,'assets','gen','icon-1024.png')
im=Image.open(src).convert('RGB')
os.makedirs(os.path.join(root,'icons'),exist_ok=True)
os.makedirs(os.path.join(root,'resources'),exist_ok=True)
def save(img,name): img.save(os.path.join(root,name),optimize=True)
for s in (192,512): save(im.resize((s,s),Image.LANCZOS),f'icons/icon-{s}.png')
save(im.resize((180,180),Image.LANCZOS),'icons/apple-touch-icon.png')
save(im.resize((32,32),Image.LANCZOS),'icons/favicon-32.png')
# maskable: shrink art to 80% safe zone over edge-colored padding
bg=im.resize((1,1),Image.BOX).getpixel((0,0))
m=Image.new('RGB',(512,512),bg); a=im.resize((410,410),Image.LANCZOS); m.paste(a,(51,51))
save(m,'icons/icon-maskable-512.png')
save(im,'resources/icon.png')
sp=Image.open(os.path.join(root,'assets','splash.png')).convert('RGB')
save(sp,'resources/splash.png')
