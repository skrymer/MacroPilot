# Draws the app's icon, one avocado in four settings. Run from the repo root after changing it:
#
#   uv run --with cairosvg --with pillow python3 assets/icon/generate.py
#
# iOS takes no transparency. The Android drawings keep inside the adaptive icon's safe circle.
import io
from pathlib import Path

import cairosvg
from PIL import Image

NAVY='#0B3350'
SKIN="M435 264 C520 264 580 318 594 388 C606 450 618 496 640 546 C662 596 681 644 681 706 C681 846 572 955 435 955 C298 955 189 846 189 706 C189 644 208 596 230 546 C252 496 264 450 276 388 C290 318 350 264 435 264Z"
FLESH="M435 309 C500 309 544 352 556 412 C566 468 584 516 606 566 C624 608 638 650 638 702 C638 822 548 912 435 912 C322 912 232 822 232 702 C232 650 246 608 264 566 C286 516 304 468 314 412 C326 352 370 309 435 309Z"
def avocado(): return f'''
<clipPath id="skin"><path d="{SKIN}"/></clipPath><clipPath id="flesh"><path d="{FLESH}"/></clipPath><clipPath id="stone"><circle cx="435" cy="716" r="105"/></clipPath>
<path d="{SKIN}" fill="#2E9E4F" stroke="{NAVY}" stroke-width="28" stroke-linejoin="round"/>
<g clip-path="url(#skin)"><path d="{SKIN}" fill="#8CC63F" transform="translate(-42 -30)"/></g>
<path d="{SKIN}" fill="none" stroke="{NAVY}" stroke-width="28"/>
<path d="{FLESH}" fill="#D3D255"/>
<g clip-path="url(#flesh)"><path d="{FLESH}" fill="#F3EA6D" transform="translate(-26 -24)"/></g>
<circle cx="435" cy="716" r="128" fill="#B9781A"/><circle cx="435" cy="716" r="105" fill="#F58A1F"/>
<g clip-path="url(#stone)"><circle cx="413" cy="690" r="108" fill="#FBB21F"/></g>
<ellipse cx="386" cy="662" rx="17" ry="31" fill="#FDD977" transform="rotate(42 386 662)"/>
<g fill="none" stroke="{NAVY}" stroke-width="14" stroke-linecap="round"><path d="M346 465 C350 434 388 434 392 465"/><path d="M478 465 C482 434 520 434 524 465"/></g>
<ellipse cx="338" cy="503" rx="27" ry="17" fill="#F5836B"/><ellipse cx="532" cy="503" rx="27" ry="17" fill="#F5836B"/>
<clipPath id="mouth"><path d="M384 500 C416 510 454 510 486 500 C492 499 494 503 493 508 C486 536 463 552 435 552 C407 552 384 536 377 508 C376 503 378 499 384 500Z"/></clipPath>
<path d="M384 500 C416 510 454 510 486 500 C492 499 494 503 493 508 C486 536 463 552 435 552 C407 552 384 536 377 508 C376 503 378 499 384 500Z" fill="{NAVY}"/>
<g clip-path="url(#mouth)"><ellipse cx="435" cy="549" rx="35" ry="22" fill="#F5836B"/></g>'''
CX,CY,H=435,609.5,719
def svg(size,frac,body,bg=None):
    k=size*frac/H
    r=f'<rect width="{size}" height="{size}" fill="{bg}"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}">{r}<g transform="translate({size/2} {size/2}) scale({k:.5f}) translate({-CX} {-CY})">{body}</g></svg>\n'
mono=f'''<path d="{SKIN}" fill="none" stroke="#FFF" stroke-width="44"/><circle cx="435" cy="716" r="122" fill="#FFF"/>
<g fill="none" stroke="#FFF" stroke-width="24" stroke-linecap="round"><path d="M336 470 C342 428 390 428 396 470"/><path d="M474 470 C480 428 528 428 534 470"/><path d="M392 520 C414 548 456 548 478 520"/></g>'''
GREEN='#00C16A'
here=Path(__file__).parent
out=here.parent/'images'
files={'icon':svg(1024,.74,avocado(),GREEN),'android-icon-foreground':svg(1024,.52,avocado()),'android-icon-monochrome':svg(1024,.52,mono),'splash-icon':svg(1024,.96,avocado())}
(here/'icon.svg').open('w').write(files['icon'])
for n,s in files.items():
    im=Image.open(io.BytesIO(cairosvg.svg2png(bytestring=s.encode(),output_width=2048,output_height=2048))).convert('RGBA').resize((1024,1024),Image.LANCZOS)
    if n=='icon': im=im.convert('RGB')
    im.save(f'{out}/{n}.png',optimize=True)
    print(n,im.size,im.mode)
