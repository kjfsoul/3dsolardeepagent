# 3I Atlas – Minimal Landing

A fast, customer-facing landing:
- 3 featured Printify products per brand (3I Atlas, Mystic Arcana, EDM Shuffle, BirthdayGen)
- Flightpath animation
- Attunement survey that gates oracle card reveal
- Brand socials for the 3 brands (none for 3I Atlas)

## 1) Install
```bash
pnpm i   # or npm i / yarn
```

## 2) Environment (.env.local)
```
PRINTIFY_API_TOKEN=YOUR_TOKEN

NEXT_PUBLIC_3IATLAS_BASE=https://3iatlas.printify.me/
NEXT_PUBLIC_ARCANA_BASE=https://mystic-arcana-pop-up.printify.me/
NEXT_PUBLIC_EDM_BASE=https://edm-shuffle-pop-up.printify.me/
NEXT_PUBLIC_BDAY_BASE=https://birthdaygen-popup.printify.me/
```

## 3) Run
```bash
npm run dev
# or build/start:
npm run build && npm start
```

## Notes
- No Supabase, no admin UI, no extra API routes. Just clean server components calling Printify.
- Replace placeholder images in `public/images/` when ready.
