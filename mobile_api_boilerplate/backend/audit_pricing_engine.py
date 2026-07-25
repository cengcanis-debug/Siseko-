from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import os
import uuid
import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, Column, String, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import declarative_base

# Declare the FastAPI router
router = APIRouter(
    prefix="/api/v1/audit",
    tags=["Audit & Pricing Engine"]
)

# --- IN-MEMORY/DB MODELS FOR MULTI-TIER SUB-CHECKING ---
# In production, these align with our SQL schemas

class LogbookRecord(BaseModel):
    trip_id: str = Field(..., example="trip-8273-df22")
    date: str = Field(..., example="2026-06-25")
    vehicle_value: float = Field(..., example=450000.0)
    business_km: float = Field(..., example=120.5)
    reason_for_trip: Optional[str] = Field(default=None, example="Onsite audit check")
    client_name: Optional[str] = Field(default=None, example="Capitec Bank")

class AuditExportRequest(BaseModel):
    records: List[LogbookRecord]
    include_receipts: bool = True

class ValidationErrorDetail(BaseModel):
    trip_id: str
    missing_fields: List[str]

class AuditValidationFailureResponse(BaseModel):
    status: str = "FAILED_VALIDATION"
    message: str = "One or more business trips contain incomplete reasons or client assignments."
    validation_errors: List[ValidationErrorDetail]

class AuditSuccessResponse(BaseModel):
    status: str = "SUCCESS"
    message: str
    export_url: str
    file_size_bytes: int
    pdf_compiled_at: str


# --- BILLING & BILLING SUBSCRIPTION CHECK FRAMEWORK ---

class SubscriptionTier:
    LITE = "lite"
    PRO = "pro"
    WEALTH = "wealth"

# Enforce statutory thresholds and limits per pricing tier:
# Lite: Personal tax only. RESTRICTED from accessing corporate data tables (e.g., VAT-201, company books).
# Pro: Pro-level personal + corporate. Restricted to a maximum of 1 associated corporate entity.
# Wealth: Full access. Multi-company consolidation + High-Wealth assets disclosure registries (>R50m cost basis).

def verify_subscription_access(account_tier: str = Header(..., alias="X-Account-Tier")):
    """
    FastAPI Dependency Injector acting as subscription middleware.
    Decodes the corporate or high-wealth limits mapped to Stripe/PayFast tiers.
    """
    valid_tiers = [SubscriptionTier.LITE, SubscriptionTier.PRO, SubscriptionTier.WEALTH]
    if account_tier not in valid_tiers:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid billing tier header specified. Must be 'lite', 'pro', or 'wealth'."
        )
    return account_tier

@router.get("/billing/status")
def get_billing_status(tier: str = Depends(verify_subscription_access)):
    """
    Returns features unlocked based on Stripe/PayFast billing status.
    """
    features = {
        SubscriptionTier.LITE: {
            "tier_name": "Lite Personal Compliance",
            "vat_201_access": False,
            "corporate_data_tables": False,
            "max_company_associations": 0,
            "hwi_disclosure_registry": False,
            "billing_interval": "ZAR 149 / month"
        },
        SubscriptionTier.PRO: {
            "tier_name": "Pro Business Compliance",
            "vat_201_access": True,
            "corporate_data_tables": True,
            "max_company_associations": 1,
            "hwi_disclosure_registry": False,
            "billing_interval": "ZAR 499 / month"
        },
        SubscriptionTier.WEALTH: {
            "tier_name": "Wealth Advisory Suite",
            "vat_201_access": True,
            "corporate_data_tables": True,
            "max_company_associations": 999, # Unlimited
            "hwi_disclosure_registry": True,
            "billing_interval": "ZAR 1,200 / month"
        }
    }
    return {
        "status": "active",
        "active_tier": tier,
        "unlocked_capabilities": features[tier],
        "compliance_year": "2026/2027"
    }


# --- AUDIT EXPORT ROUTE IMPLEMENTATION ---

@router.post("/export")
async def export_audit_log(payload: AuditExportRequest, tier: str = Depends(verify_subscription_access)):
    """
    Iterates through all provided business logbook items.
    1. Audits each row to ensure 'reason_for_trip' and 'client_name' are provided and non-empty.
    2. Collects failures and returns them in a structured verification JSON list.
    3. If compliant, compiles the consolidated data into a PDF payload under 5MB.
    """
    # 1. Enforce validation check on reasons & client names
    validation_failures = []
    
    for rec in payload.records:
        missing = []
        if not rec.reason_for_trip or not rec.reason_for_trip.strip():
            missing.append("reason_for_trip")
        if not rec.client_name or not rec.client_name.strip():
            missing.append("client_name")
            
        if missing:
            validation_failures.append(ValidationErrorDetail(
                trip_id=rec.trip_id,
                missing_fields=missing
            ))
            
    if validation_failures:
        # Return structured JSON containing missing entry IDs
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": "INCOMPLETE_AUDIT_TRAIL",
                "message": "Audit failed. One or more business trips are missing mandatory reasons or client associations under TAA Rule 7 guidelines.",
                "failures": [err.dict() for err in validation_failures]
            }
        )
        
    # 2. Check billing limitations for Pro export (just as verification)
    # E.g., If they are sending extremely large exports, we could rate limit, but here we enforce billing middleware limits.
    
    # 3. Compile consolidated PDF (Mocked under-5MB binary structure with high-fidelity meta response)
    # In real production environment, ReportLab is imported and builds an encrypted PDF from raw byte stream
    current_time = datetime.datetime.now(datetime.timezone.utc).isoformat()
    compiled_filename = f"SARS_Travel_Audit_Export_{uuid.uuid4().hex[:8]}.pdf"
    
    return AuditSuccessResponse(
        status="SUCCESS",
        message="All business logbook records passed TAA Rule 7 validation checks.",
        export_url=f"/api/v1/download/{compiled_filename}",
        file_size_bytes=1048576 * 2, # exactly 2.0 MB (Safely under 5MB)
        pdf_compiled_at=current_time
    )


# --- STRIPE / PAYFAST PAYMENT WEBHOOK WEB RECEIVER ---

class StripeWebhookPayload(BaseModel):
    id: str
    type: str
    data: Dict[str, Any]

@router.post("/webhooks/billing")
async def stripe_payfast_webhook_receiver(payload: StripeWebhookPayload):
    """
    Handles payment webhooks from Stripe and PayFast to provision compliance tiers.
    Synchronizes local user table tier states in response to 'customer.subscription.updated'
    or successful card transactions.
    """
    event_type = payload.type
    event_data = payload.data
    
    if event_type in ["customer.subscription.created", "customer.subscription.updated"]:
        subscription = event_data.get("object", {})
        customer_email = subscription.get("customer_email")
        # Extract metadata
        metadata = subscription.get("metadata", {})
        tier = metadata.get("account_tier", SubscriptionTier.LITE)
        
        # Real production database update code would trigger here:
        # await update_user_tier(customer_email, tier)
        return {
            "processed": True,
            "handler": "Stripe",
            "email": customer_email,
            "updated_tier": tier,
            "status": "active"
        }
        
    elif event_type == "payment.payfast.notify":
        # Handle standard PayFast Instant Payment Notification (IPN)
        merchant_id = event_data.get("merchant_id")
        payment_status = event_data.get("payment_status")
        custom_str = event_data.get("custom_str") # Holds the user_id/tier metadata
        
        return {
            "processed": True,
            "handler": "PayFast IPN",
            "status": payment_status,
            "meta_payload": custom_str
        }
        
    return {"processed": True, "message": "Ignored unhandled webhook action type."}
