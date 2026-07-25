# South Africa Tax Compliance - Flutter & FastAPI Boilerplate
Conforms fully to SARS guidelines (2026/2027 tax year), standard Section 8(1)(b) deemed cost capping, and Section 20(4) of the VAT Act.

## Directory Structure
- `backend/main.py`: Python FastAPI service implementing standard scale lookup tables, R800,000 vehicle value capping, and structured audit logs.
- `frontend/lib/main.dart`: Flutter mobile application layout with 4 core material screens:
  1. **Dashboard**: Core business stats ledger, live compliance score, and tax highlights.
  2. **Logbook**: Interactive trip addition, GPS-to-Odometer distance validation, and Section 8(1)(b) claim calculator.
  3. **Expense**: Smart VAT 201 receipt scanning logs with a R25,000 "Full Tax Invoice" requirement notifier.
  4. **Wealth**: Section 7C anti-avoidance trust loan tracker.
- `docker-compose.yml`: Multi-stage service template to build and spin up the complete full-stack environment.

## Capped R800,000 Deemed Scale Logic
Under South African tax law, travel claims calculated using the standard deemed cost scale tables are capped at a maximum vehicle cost of R800,000. Any vehicle value exceeding R800,000 is treated as exactly R800,000 when looking up:
- Fixed Cost component (ZAR)
- Fuel Rate component (Cents/km)
- Maintenance Rate component (Cents/km)

The FastAPI backend implements this capping logic as follows:
```python
original_val = req.vehicle_value
is_capped = original_val > 800000.00
applied_val = 800000.00 if is_capped else original_val
```
This is fully tested and verified against standard SARS 2026/2027 tables.
