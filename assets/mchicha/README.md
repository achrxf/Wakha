# Mchicha assets

Everything that makes up Mchicha, the cat in Wakha.

- `sheets/`: the original green-screen sheets from the image generator, untouched.
- `sprites/`: every pose and frame cut out with a transparent background (PNG). These are what the app uses, as WebP, in `src/cat_sprites.js`.
- `tools/`: the Python scripts that turn the sheets into sprites (green key and despill, cutting, frame alignment, eye, ear and mouth transplants, export).

## Sprite names

| Prefix | What it is |
|---|---|
| `p_<mood>` | head-and-shoulders portrait, no hat (sassy, happy, playful, grumpy, annoyed, sad, curious, wow, mischievous) |
| `p_<mood>_h`, `p_<mood>_c` | the same portrait with half-closed and closed eyes (blink frames) |
| `hs_<hat>`, `hg_`, `hw_`, `hd_`, `hh_` | portrait wearing a hat: sassy, grumpy, wow (surprised), sad, happy |
| `hs_<hat>_c` | sassy hat portrait with eyes closed (blink) |
| `hs_<hat>_t1..t3` | sassy hat portrait with three mouth shapes (talking) |
| `hs_none_e1`, `hs_none_e2` | ear twitch frames |
| `b_love`, `b_wink`, `b_happy`, `b_sassy` | extra portraits (heart eyes, wink with tongue, smiling, eyes closed) |
| `f_<mood>` | full body poses |
| `a_<action>` | full body actions: wave, jump, cheer, proud, shrug, facepalm |
| `j_0..6` | the jump, frame by frame: crouch, push off, peak, float, drop, land, sit |

Hats: none, tarbouche, tagiya, terrazza (Jebli straw hat), cheche, beanie, bucket, rose, shades.

## Rules for new sheets

Solid pure green background (#00FF00), poses not touching, no text, no shadows. For animation frames, **edit** an existing sheet instead of generating a new one, so the drawing stays identical and only the changed part moves.
