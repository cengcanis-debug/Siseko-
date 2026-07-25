from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import datetime
import uvicorn
from auth_onboarding import router as auth_router
from audit_pricing_engine import router as audit_router
from runway_monitor import router as runway_router

app = FastAPI(
    title="SARS VAT-201 & Section 8(1)(b) Travel Compliance API",
    description="Backend calculations and audit logging engine matching SARS 2026/2027 statutory guidelines.",
    version="1.0.0"
)

# Include the POPIA-compliant onboarding router
app.include_router(auth_router)
app.include_router(audit_router)
app.include_router(runway_router)

# Enable CORS for cross-origin testing/sandboxing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SARS 2026/2027 DEEMED TRAVEL COST TABLE ---
# Under Section 8(1)(b) of the South African Income Tax Act 58 of 1962, 
# the deemed cost rate scale is capped at a vehicle purchase value of R800,000.
# Any vehicle value exceeding R800,000 is treated as R800,000.

SARS_TRAVEL_BRACKETS = [
    {"limit": 105000, "fixed_cost": 36115, "fuel_cost": 1.430, "maintenance_cost": 0.515},
    {"limit": 210000, "fixed_cost": 63948, "fuel_cost": 1.530, "maintenance_cost": 0.595},
    {"limit": 315000, "fixed_cost": 90565, "fuel_cost": 1.630, "maintenance_cost": 0.665},
    {"limit": 420000, "fixed_cost": 114354, "fuel_cost": 1.750, "maintenance_cost": 0.745},
    {"limit": 525000, "fixed_cost": 138143, "fuel_cost": 2.030, "maintenance_cost": 0.915},
    {"limit": 630000, "fixed_cost": 164760, "fuel_cost": 2.120, "maintenance_cost": 1.075},
    {"limit": 735000, "fixed_cost": 191377, "fuel_cost": 2.210, "maintenance_cost": 1.115},
    {"limit": 800000, "fixed_cost": 217994, "fuel_cost": 2.300, "maintenance_cost": 1.205}, # Capped at R800,000
]

SARS_PRESCRIBED_SIMPLIFIED_RATE_ZAR = 4.84 # Simplified rate when no vehicle value is kept (cents translated to ZAR)

# --- PYDANTIC MODEL SCHEMAS ---

class TravelCalculationRequest(BaseModel):
    vehicle_value: float = Field(..., description="The original purchase price of the vehicle in ZAR.", example=350000)
    total_kms_annually: float = Field(default=32000.0, description="Estimated total annual distance (business + private) in km.")
    business_kms: float = Field(..., description="The verified business kilometers traveled during the tax period.", example=12450)
    use_simplified_rate: bool = Field(default=False, description="Whether to bypass scale and use flat rate of R4.84/km.")

class TravelCalculationResponse(BaseModel):
    original_vehicle_value_zar: float
    applied_vehicle_value_zar: float
    is_capped: bool
    fixed_cost_zar: float
    fuel_cost_per_km_zar: float
    maintenance_cost_per_km_zar: float
    deemed_rate_per_km_zar: float
    total_business_kms: float
    total_claim_amount_zar: float
    tax_rules_applied: str

class TripRecord(BaseModel):
    date: str
    vehicle_registration: str
    opening_odometer: int
    closing_odometer: int
    tag: str # 'Business' or 'Private'
    reason_for_trip: str
    client_name: str

class LogbookAuditRequest(BaseModel):
    logbook_id: str
    vehicle_value: float
    trips: List[TripRecord]

class AuditLogEntry(BaseModel):
    timestamp: str
    operation: str
    user_role: str
    status: str
    details: str

# --- IN-MEMORY AUDIT LOG FOR TESTING & SECURE VAULT CHECKS ---
AUDIT_TRAIL = []

def write_audit_log(operation: str, user_role: str, status: str, details: str):
    entry = {
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "operation": operation,
        "user_role": user_role,
        "status": status,
        "details": details
    }
    AUDIT_TRAIL.append(entry)
    print(f"[AUDIT LOG] {entry}")

@app.get("/")
def health_check():
    return {"status": "healthy", "service": "SARS Travel Compliance Backend", "timestamp": datetime.datetime.utcnow().isoformat()}

@app.post("/api/calculate-travel", response_model=TravelCalculationResponse)
def calculate_travel_claim(req: TravelCalculationRequest):
    """
    Calculates SARS deemed travel expense claims according to the standard scale tables.
    Explicitly caps the vehicle value at R800,000 for statutory scale lookup.
    """
    write_audit_log(
        operation="CALCULATE_TRAVEL_CLAIM",
        user_role="Accountant",
        status="SUCCESS",
        details=f"Calculated travel claim for vehicle value ZAR {req.vehicle_value} and {req.business_kms} business kms."
    )
    
    original_val = req.vehicle_value
    is_capped = original_val > 800000.00
    
    # APPLY THE CAPPING LAW: Treat any vehicle over R800,000 as R800,000
    applied_val = 800000.00 if is_capped else original_val
    
    if req.use_simplified_rate:
        # Simplified rate doesn't use scale, just applies flat R4.84/km
        rate = SARS_PRESCRIBED_SIMPLIFIED_RATE_ZAR
        claim = rate * req.business_kms
        return TravelCalculationResponse(
            original_vehicle_value_zar=original_val,
            applied_vehicle_value_zar=0.0,
            is_capped=False,
            fixed_cost_zar=0.0,
            fuel_cost_per_km_zar=0.0,
            maintenance_cost_per_km_zar=0.0,
            deemed_rate_per_km_zar=rate,
            total_business_kms=req.business_kms,
            total_claim_amount_zar=round(claim, 2),
            tax_rules_applied="SARS Prescribed Simplified rate of R4.84 per kilometer."
        )

    # Scale-based calculation
    # Find the appropriate bracket based on the applied (capped) vehicle value
    bracket = None
    for b in SARS_TRAVEL_BRACKETS:
        if applied_val <= b["limit"]:
            bracket = b
            break
            
    if not bracket:
        # Fallback to the highest bracket (which represents the capped R800,000 scale)
        bracket = SARS_TRAVEL_BRACKETS[-1]
        
    fixed_cost = bracket["fixed_cost"]
    fuel_rate = bracket["fuel_cost"] # Fuel cost in ZAR/km (e.g. 2.30 ZAR)
    maint_rate = bracket["maintenance_cost"] # Maint cost in ZAR/km (e.g. 1.205 ZAR)
    
    # Fixed Cost rate translation: Fixed Cost / Annual Kilometers
    # SARS assumes a standard annual total (business + private) of req.total_kms_annually
    annual_kms = max(1.0, req.total_kms_annually)
    fixed_rate_per_km = fixed_cost / annual_kms
    
    # Deemed rate per km in ZAR
    deemed_rate = fixed_rate_per_km + fuel_rate + maint_rate
    
    # Claim = Business Kms * Deemed Rate
    total_claim = deemed_rate * req.business_kms
    
    return TravelCalculationResponse(
        original_vehicle_value_zar=original_val,
        applied_vehicle_value_zar=applied_val,
        is_capped=is_capped,
        fixed_cost_zar=fixed_cost,
        fuel_cost_per_km_zar=fuel_rate,
        maintenance_cost_per_km_zar=maint_rate,
        deemed_rate_per_km_zar=round(deemed_rate, 4),
        total_business_kms=req.business_kms,
        total_claim_amount_zar=round(total_claim, 2),
        tax_rules_applied="Section 8(1)(b) Deemed Cost Scale Table. Vehicle value capped at R800,000."
    )

@app.post("/api/logbook/verify")
def verify_logbook_compliance(req: LogbookAuditRequest):
    """
    Performs forensic auditing checks on logbook trips.
    Validates mandatory SARS logbook parameters: Date, Odometer entries, Client Name, and Reason for Trip.
    """
    total_trips = len(req.trips)
    business_trips = 0
    private_trips = 0
    business_km = 0.0
    private_km = 0.0
    
    compliance_gaps = []
    
    for idx, trip in enumerate(req.trips):
        trip_distance = trip.closing_odometer - trip.opening_odometer
        if trip_distance <= 0:
            compliance_gaps.append(f"Trip #{idx+1} ({trip.date}): Odometer mismatch. Closing reading ({trip.closing_odometer}) is less than opening ({trip.opening_odometer}).")
            continue
            
        is_business = trip.tag.lower() == "business"
        if is_business:
            business_trips += 1
            business_km += trip_distance
            
            # Check mandatory reason and client name
            if not trip.reason_for_trip or len(trip.reason_for_trip.strip()) < 5:
                compliance_gaps.append(f"Trip #{idx+1} ({trip.date}): SARS compliance gap. Reason for trip is missing or too short (minimum 5 characters).")
            if not trip.client_name or len(trip.client_name.strip()) < 2:
                compliance_gaps.append(f"Trip #{idx+1} ({trip.date}): SARS compliance gap. Business Client Visited name is required.")
        else:
            private_trips += 1
            private_km += trip_distance

    total_km = business_km + private_km
    biz_ratio = (business_km / total_km * 100) if total_km > 0 else 0.0
    
    status = "AUDIT-READY" if not compliance_gaps else "REJECTED_GAPS_DETECTED"
    
    # Audit log persistence
    write_audit_log(
        operation="VERIFY_LOGBOOK_COMPLIANCE",
        user_role="Auditor",
        status=status,
        details=f"Audited logbook '{req.logbook_id}' with {total_trips} trips. Found {len(compliance_gaps)} compliance issues."
    )
    
    return {
        "logbook_id": req.logbook_id,
        "audit_status": status,
        "total_trips_processed": total_trips,
        "business_trips": business_trips,
        "private_trips": private_trips,
        "total_business_kms": business_km,
        "total_private_kms": private_km,
        "business_kilometers_percentage": round(biz_ratio, 2),
        "compliance_gaps_found": compliance_gaps,
        "is_compliant": len(compliance_gaps) == 0
    }

@app.get("/api/audit-logs", response_model=List[AuditLogEntry])
def get_audit_logs():
    return AUDIT_TRAIL

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
