#!/usr/bin/env python3
"""
SARS IT3(d) Flat-File Validator (Python 3)
Specification: SARS BRS v4.0.0D-10 (Section 18A PBO Donations)
"""

import sys
import json
import re
from datetime import datetime

FILENAME_PATTERN = r"^IT3d\.(\d{10})\.(\d{8})\.(\d{6})\.txt$"

def validate_it3d_filename(filename: str, expected_pbo: str = None) -> dict:
    """
    Validates the statutory SARS IT3(d) flat file filename:
    IT3d.<10-digit-PBO>.<YYYYMMDD>.<HHMMSS>.txt
    Example: IT3d.9301234567.20260516.120000.txt
    """
    errors = []
    if not filename:
        return {"valid": False, "errors": ["Filename cannot be empty"], "parsed": None}

    match = re.match(FILENAME_PATTERN, filename.strip(), re.IGNORECASE)
    if not match:
        return {
            "valid": False,
            "errors": [
                f"Filename '{filename}' does not match SARS BRS specification: IT3d.<10-digit-PBO>.<YYYYMMDD>.<HHMMSS>.txt"
            ],
            "parsed": None
        }

    pbo_no = match.group(1)
    date_str = match.group(2)
    time_str = match.group(3)

    # 1. PBO checks: Must be 10 digits starting with 930
    if not pbo_no.startswith("930"):
        errors.append(f"Filename PBO number '{pbo_no}' must begin with '930' series (got {pbo_no})")

    # 2. Date checks: YYYYMMDD valid calendar date
    try:
        datetime.strptime(date_str, "%Y%m%d")
    except ValueError:
        errors.append(f"Filename date '{date_str}' is not a valid YYYYMMDD calendar date")

    # 3. Time checks: HHMMSS valid 24-hour time
    try:
        datetime.strptime(time_str, "%H%M%S")
    except ValueError:
        errors.append(f"Filename time '{time_str}' is not a valid HHMMSS time (00-23, 00-59, 00-59)")

    # 4. Expected PBO match check
    if expected_pbo and expected_pbo.strip():
        clean_expected = re.sub(r"\D", "", expected_pbo)
        if clean_expected and clean_expected != pbo_no:
            errors.append(f"Filename PBO '{pbo_no}' does not match flat-file REI record PBO '{clean_expected}'")

    is_valid = len(errors) == 0
    return {
        "valid": is_valid,
        "errors": errors,
        "parsed": {
            "pbo": pbo_no,
            "date": date_str,
            "time": time_str,
            "formatted_date": f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:]}",
            "formatted_time": f"{time_str[:2]}:{time_str[2:4]}:{time_str[4:]}"
        }
    }

def generate_it3d_filename(pbo_number: str = "9301234567", dt: datetime = None) -> str:
    """
    Generates statutory SARS IT3(d) filename:
    IT3d.<10-digit-PBO>.<YYYYMMDD>.<HHMMSS>.txt
    Default example: IT3d.9301234567.20260516.120000.txt
    """
    clean_pbo = re.sub(r"\D", "", str(pbo_number)) if pbo_number else "9301234567"
    if len(clean_pbo) < 10:
        clean_pbo = clean_pbo.ljust(10, '0')
    elif len(clean_pbo) > 10:
        clean_pbo = clean_pbo[:10]
    
    if dt is None:
        dt = datetime(2026, 5, 16, 12, 0, 0)
    
    return f"IT3d.{clean_pbo}.{dt.strftime('%Y%m%d')}.{dt.strftime('%H%M%S')}.txt"

def luhn_sa_id(id_no: str) -> bool:
    if not id_no or not re.fullmatch(r"\d{13}", id_no):
        return False
    total = 0
    for i, d in enumerate(reversed(id_no)):
        n = int(d)
        if i % 2 == 1:
            n = n * 2
            if n > 9:
                n -= 9
        total += n
    return total % 10 == 0

def validate_it3d_file(lines: list, tax_year: int = 2026, strict: bool = False) -> list:
    errors = []
    seen_receipts = set()

    if not lines:
        return ["Empty file"]

    # 1. Header validation
    header = lines[0].strip().split('|')
    if header[0] != 'H' or (len(header) > 1 and header[1] != 'FH'):
        errors.append(f"Line 1: First record must be H|FH, got {lines[0][:20]}")

    # 2. Trailer validation: T|<count> (must = total lines including H and T, e.g. T|00000015)
    trailer = lines[-1].strip().split('|')
    if trailer[0] != 'T':
        errors.append("Last line must be T|count (e.g. T|00000015)")
    else:
        try:
            expected = int(trailer[1])
            total_lines = len(lines)  # total lines including H and T
            records_between = len(lines) - 2  # excluding FH and T
            substantive_count = len([
                l for l in lines 
                if l.strip().startswith('H|REI') or l.strip().startswith('H|DEI') or l.strip().startswith('H|DRI')
            ])

            # Statutory SARS rule: T|count must equal total lines including H and T
            if expected == total_lines:
                pass
            elif not strict and (expected == records_between or expected == substantive_count):
                pass
            else:
                formatted_expected = str(total_lines).zfill(8)
                errors.append(f"Trailer count {expected} != total lines {total_lines} (must = total lines including H and T, e.g. T|{formatted_expected})")
        except Exception:
            errors.append("Trailer second field must be numeric (e.g. T|00000015)")

    # 3. Line-by-line body validation
    for idx, raw in enumerate(lines[1:-1], start=2):
        line_str = raw.strip()
        if not line_str:
            continue
        parts = line_str.split('|')
        if parts[0] != 'H':
            errors.append(f"Line {idx}: Must start with H")
            continue

        h_type = parts[1] if len(parts) > 1 else ""

        if h_type == 'SE':  # Submitting Entity
            if len(parts) < 10:
                errors.append(f"Line {idx} SE: Too few fields, expected >=10, got {len(parts)}")
            
            # Locate email address in SE record
            email = ""
            if strict:
                email = parts[8] if len(parts) > 8 else ""
            else:
                # In standard BRS formats, email may be at index 8 or 9 depending on split contact name
                for p in parts[6:]:
                    if '@' in p:
                        email = p
                        break
                if not email and len(parts) > 8:
                    email = parts[8]

            if '@' not in email or '.' not in email:
                errors.append(f"Line {idx} SE: Invalid email {email}")

        elif h_type == 'REI':  # Reporting Entity - PBO
            if len(parts) < 3:
                errors.append(f"Line {idx} REI: Too few fields")
            pbo = parts[2] if len(parts) > 2 else ""
            if not re.fullmatch(r"930\d{7}", pbo):
                errors.append(f"Line {idx} REI: PBO ref must be 930 + 7 digits, got {pbo}")

        elif h_type == 'DEI':  # Donor
            # H|DEI|INDIVIDUAL|ID|TAXREF|Name|Address|Email|Cell
            if len(parts) < 9:
                errors.append(f"Line {idx} DEI: Expected 9 fields, got {len(parts)}")
                continue
            
            nature = parts[2]
            id_no = parts[3]
            taxref = parts[4]
            name = parts[5]
            addr = parts[6]
            email = parts[7]
            cell = parts[8]

            if nature == 'INDIVIDUAL' and not luhn_sa_id(id_no):
                errors.append(f"Line {idx} DEI: Invalid SA ID {id_no}")

            if taxref and not re.fullmatch(r"\d{10}", taxref):
                errors.append(f"Line {idx} DEI: Tax ref must be 10 digits, got {taxref}")

            if '@' not in email or '.' not in email.split('@')[-1]:
                errors.append(f"Line {idx} DEI: Invalid email {email}")

            if not re.fullmatch(r"\d{9,15}", cell):
                errors.append(f"Line {idx} DEI: Cell must be 9-15 digits no +/space, got {cell}")

        elif h_type == 'DRI':  # Donation Receipt
            # H|DRI|Receipt|Date|Amount|Nature|CertNo
            if len(parts) < 7:
                errors.append(f"Line {idx} DRI: Expected 7 fields, got {len(parts)}")
                continue
            
            receipt = parts[2]
            ddate = parts[3]
            amount = parts[4]
            nature = parts[5]
            cert = parts[6]

            if receipt in seen_receipts:
                errors.append(f"Line {idx} DRI: Duplicate receipt {receipt}")
            seen_receipts.add(receipt)

            dt = None
            for fmt in ("%Y-%m-%d", "%Y%m%d"):
                try:
                    dt = datetime.strptime(ddate, fmt)
                    break
                except ValueError:
                    pass

            if not dt:
                errors.append(f"Line {idx} DRI: Invalid date {ddate}, need CCYY-MM-DD or CCYYMMDD")
            elif dt.year != tax_year:
                errors.append(f"Line {idx} DRI: Date year {dt.year} != tax year {tax_year}")

            try:
                amt = float(amount)
                if amt <= 0:
                    errors.append(f"Line {idx} DRI: Amount must be >0, got {amount}")
            except Exception:
                errors.append(f"Line {idx} DRI: Amount not numeric {amount}")

            if nature not in ('CASH', 'PROPERTY_IN_KIND'):
                errors.append(f"Line {idx} DRI: Nature must be CASH or PROPERTY_IN_KIND, got {nature}")

    return errors

def main():
    try:
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            print(json.dumps({"valid": False, "errors": ["Empty input stream"]}))
            return
        payload = json.loads(raw_input)
        lines = payload.get("lines", [])
        if isinstance(lines, str):
            lines = [l for l in lines.splitlines() if l.strip()]
        tax_year = int(payload.get("tax_year", 2026))
        strict = bool(payload.get("strict", False))

        errors = validate_it3d_file(lines, tax_year, strict)
        is_valid = len(errors) == 0

        # Extract REI PBO if present in lines
        rei_pbo = "9301234567"
        for line in lines:
            parts = line.strip().split('|')
            if len(parts) >= 3 and parts[0] == 'H' and parts[1] == 'REI':
                rei_pbo = parts[2]
                break

        # Filename validation if filename was supplied
        filename = payload.get("filename")
        filename_res = None
        if filename:
            filename_res = validate_it3d_filename(filename, expected_pbo=rei_pbo)
            if not filename_res["valid"]:
                for fn_err in filename_res["errors"]:
                    errors.append(f"Filename: {fn_err}")
                is_valid = False

        result = {
            "valid": is_valid,
            "errors": errors,
            "badge": "SARS BRS Valid - v4.0.0D-10" if is_valid else None,
            "brsVersion": "v4.0.0D-10",
            "brs_version": "v4.0.0D-10",
            "line_count": len(lines),
            "filename_validation": filename_res,
            "statutory_filename_template": "IT3d.<10-digit-PBO>.<YYYYMMDD>.<HHMMSS>.txt",
            "sample_filename": "IT3d.9301234567.20260516.120000.txt",
            "recommended_filename": generate_it3d_filename(rei_pbo),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        print(json.dumps(result))
    except Exception as ex:
        print(json.dumps({"valid": False, "errors": [f"Python validator exception: {str(ex)}"], "brsVersion": "v4.0.0D-10", "brs_version": "v4.0.0D-10"}))

if __name__ == "__main__":
    main()
