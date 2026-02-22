# Data Scripts

One-off scripts for seeding the `permit_types` and `lot_permit_access` tables.

## Usage

Run from `backend/`:

```bash
python -m data.scripts.seed_gold_permit
python -m data.scripts.seed_gold_plus_permit
python -m data.scripts.seed_blue_permit
```

Add `--dry-run` to preview without committing.

## Scripts

| Script | Permit | 24/7 Lots | Restricted Lots (6 PM Mon-Fri, all day Sat-Sun) |
|--------|--------|-----------|--------------------------------------------------|
| `seed_gold_permit.py` | Gold Permit | 26, 30, 32, 50 | 6, 24 |
| `seed_gold_plus_permit.py` | Gold Plus Permit | 26, 30, 32, 50, Big Springs 2 | 6, 24 |
| `seed_blue_permit.py` | Blue Permit | 6, 24, 26, 30, 32, 50 | — |

## Notes

- Scripts skip lots not found in `parking_lots` (only lots returned by the UCR API are seeded).
- Scripts are idempotent for the permit row (won't duplicate if re-run), but will fail on duplicate `lot_permit_access` entries due to the unique constraint.
