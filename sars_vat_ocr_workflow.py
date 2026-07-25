#!/usr/bin/env python3
"""
SARS VAT-201 Autonomous OCR Workflow & Cloud Integrator
Conforms to South African Revenue Service (SARS) regulations for VAT 201 filing and full-tax invoice compliance under the VAT Act No. 89 of 1991.

Features:
1. Google Cloud Vision API or AWS Textract integration placeholder.
2. South African Merchant Metadata extraction (Merchant Name, Registration Number, Invoice Date, Invoice Number).
3. South African Tax Specifics identification (15% VAT rate, Zero-Rated, or Exempt items).
4. Gross, Net, and VAT Amount verification and mathematical cross-matching.
5. "Input Tax" (Business Purchases) or "Output Tax" (Business Sales) classification.
6. Trigger code flag if total exceeds R25,000 requiring "Full Tax Invoice" (buyers name, address, VAT number).
"""

import os
import re
import json
from datetime import datetime
from typing import Dict, Any, Optional

class SARSVatOcrWorkflow:
    def __init__(self, google_creds_path: Optional[str] = None, aws_region: str = "eu-west-1"):
        """
        Initializes the Cloud OCR integrations.
        :param google_creds_path: Path to Google Service Account Credentials json file.
        :param aws_region: AWS Region for AWS Textract (defaults to eu-west-1 which is common for SA companies).
        """
        self.google_creds_path = google_creds_path or os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        self.aws_region = aws_region
        
        # Configure local mock triggers if credentials aren't provided for testing
        self.vision_client = None
        self.textract_client = None
        
        print("[INIT] SARS VAT 201 OCR Engine Initialized.")
        if self.google_creds_path:
            print(f"[INIT] Google Cloud Vision credentials detected at: {self.google_creds_path}")
        else:
            print("[INIT] No cloud credentials detected. Operating in mock-assisted parsing mode for testing.")

    def run_google_cloud_vision_ocr(self, image_bytes: bytes) -> str:
        """
        Connects to Google Cloud Vision API and performs OCR (DOCUMENT_TEXT_DETECTION).
        """
        if not self.google_creds_path:
            # Fallback mock OCR raw text for testing
            return self._get_mock_raw_invoice_text()
            
        try:
            from google.cloud import vision
            # Ensure credential env variable is set
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = self.google_creds_path
            client = vision.ImageAnnotatorClient()
            image = vision.Image(content=image_bytes)
            response = client.document_text_detection(image=image)
            
            if response.error.message:
                raise Exception(f"Google Cloud Vision API Error: {response.error.message}")
                
            return response.full_text_annotation.text
        except ImportError:
            print("[WARNING] google-cloud-vision package not installed. Using local regex text processor.")
            return self._get_mock_raw_invoice_text()

    def run_aws_textract_ocr(self, document_bytes: bytes) -> str:
        """
        Connects to AWS Textract and performs text and table extraction.
        """
        try:
            import boto3
            client = boto3.client('textract', region_name=self.aws_region)
            response = client.detect_document_text(Document={'Bytes': document_bytes})
            
            lines = []
            for item in response.get('Blocks', []):
                if item.get('BlockType') == 'LINE':
                    lines.append(item.get('Text', ''))
            return "\n".join(lines)
        except Exception as e:
            print(f"[WARNING] AWS Textract integration failed or boto3 not installed: {e}. Using fallback.")
            return self._get_mock_raw_invoice_text()

    def parse_sars_invoice(self, raw_text: str, is_business_purchase: bool = True) -> Dict[str, Any]:
        """
        Parses raw OCR output to match SARS compliance criteria.
        Extracts metadata, tax rates, performs math validation, checks R25,000 Full Tax Invoice limit.
        """
        print("[PROCESS] Parsing extracted raw text for South African Tax Specifics...")
        
        # 1. Merchant Metadata Regex Extractors
        merchant_name = self._extract_merchant_name(raw_text)
        merchant_reg = self._extract_registration_number(raw_text)
        invoice_date = self._extract_invoice_date(raw_text)
        invoice_number = self._extract_invoice_number(raw_text)
        merchant_vat = self._extract_vat_number(raw_text)

        # 2. Tax Specifics Analysis
        is_vat_inclusive = "incl" in raw_text.lower() or "vat 15%" in raw_text.lower() or "tax" in raw_text.lower()
        is_zero_rated = "zero-rated" in raw_text.lower() or "0% vat" in raw_text.lower() or "zero rate" in raw_text.lower()
        is_exempt = "exempt" in raw_text.lower() or "exempt item" in raw_text.lower()

        # Deduce standard 15% VAT rate unless marked zero-rated or exempt
        detected_tax_rate = "15% VAT"
        if is_zero_rated:
            detected_tax_rate = "Zero-Rated"
        elif is_exempt:
            detected_tax_rate = "Exempt"

        # 3. Data Matching and Financial Numbers Extraction
        gross_amount = self._extract_total_amount(raw_text)
        
        # Mathematical derivation of Net and VAT amount conforming to the 15% rate
        if detected_tax_rate == "15% VAT":
            # Gross = Net * 1.15 -> Net = Gross / 1.15
            net_amount = round(gross_amount / 1.15, 2)
            vat_amount = round(gross_amount - net_amount, 2)
        else:
            net_amount = gross_amount
            vat_amount = 0.0

        # Double check if OCR explicitly noted VAT amount and override if matching
        extracted_vat = self._extract_explicit_vat(raw_text)
        if extracted_vat > 0 and abs(extracted_vat - vat_amount) < 5.0:
            vat_amount = extracted_vat
            net_amount = round(gross_amount - vat_amount, 2)

        # 4. Accounting Classification
        # Input Tax (Standard business expenses where we reclaim VAT)
        # Output Tax (Business sales where we collect VAT from customers)
        classification = "Input Tax" if is_business_purchase else "Output Tax"

        # 5. Full Tax Invoice Compliance Check (The R25,000 threshold under SARS rule)
        is_full_tax_invoice_required = gross_amount > 25000.00
        
        # Find buyer information (needed if gross_amount > R25,000)
        buyer_name = self._find_regex_match(raw_text, r"(?:Bill To|To|Client|Buyer|Customer):\s*([^\n]+)", "N/A")
        buyer_address = self._find_regex_match(raw_text, r"(?:Delivery Address|Buyer Address|Customer Address):\s*([^\n]+)", "N/A")
        buyer_vat = self._extract_buyer_vat_number(raw_text)

        # Verify compliance
        has_full_tax_invoice_fields = False
        compliance_gaps = []
        if is_full_tax_invoice_required:
            checks = {
                "Buyer Name": buyer_name != "N/A",
                "Buyer Address": buyer_address != "N/A",
                "Buyer VAT Number": buyer_vat is not None
            }
            has_full_tax_invoice_fields = all(checks.values())
            
            for key, present in checks.items():
                if not present:
                    compliance_gaps.append(f"Missing mandatory {key} for invoice exceeding R25,000 (SARS Sec 20(4))")

        compliance_status = "COMPLIANT"
        if is_full_tax_invoice_required and not has_full_tax_invoice_fields:
            compliance_status = "NON-COMPLIANT (Full Tax Invoice Requirements Not Met)"

        invoice_payload = {
            "merchant_metadata": {
                "merchant_name": merchant_name,
                "merchant_vat_number": merchant_vat,
                "registration_number": merchant_reg,
                "invoice_date": invoice_date,
                "invoice_number": invoice_number
            },
            "tax_specifics": {
                "tax_rate_type": detected_tax_rate,
                "is_zero_rated": is_zero_rated,
                "is_exempt": is_exempt
            },
            "data_matching": {
                "gross_amount_zar": gross_amount,
                "net_amount_zar": net_amount,
                "vat_amount_zar": vat_amount,
                "calculated_vat_variance": round(abs(vat_amount - (gross_amount * 15 / 115)) if detected_tax_rate == "15% VAT" else 0.0, 4)
            },
            "accounting_classification": classification,
            "sars_compliance": {
                "exceeds_r25k_threshold": is_full_tax_invoice_required,
                "buyer_company_name": buyer_name,
                "buyer_address": buyer_address,
                "buyer_vat_number": buyer_vat or "N/A",
                "has_full_tax_invoice_fields": has_full_tax_invoice_fields if is_full_tax_invoice_required else True,
                "compliance_status": compliance_status,
                "compliance_gaps": compliance_gaps,
                "sars_rule_applied": "Section 20(4) of South African VAT Act (Invoices exceeding R25,000 must include full buyer identity, address, and VAT registration)"
            },
            "system_audit_timestamp": datetime.now().isoformat()
        }

        print(f"[STATUS] Extracted transaction classified as '{classification}' and marked '{compliance_status}'.")
        return invoice_payload

    # Helper Extractors
    def _extract_merchant_name(self, text: str) -> str:
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        if lines:
            return lines[0] # Usually the first line of the receipt is the merchant name
        return "Unknown Supplier"

    def _extract_registration_number(self, text: str) -> str:
        # South African CIPC registration pattern, e.g., 2015/012345/07
        pattern = r"\b(19|20)\d{2}/\d{5,6}/(07|08|23|30)\b"
        match = re.search(pattern, text)
        return match.group(0) if match else "N/A"

    def _extract_vat_number(self, text: str) -> str:
        # SARS standard 10-digit VAT registration number starting with '4'
        pattern = r"\b4\d{9}\b"
        matches = re.findall(pattern, text)
        if matches:
            return matches[0]
        return "N/A"

    def _extract_buyer_vat_number(self, text: str) -> Optional[str]:
        # SARS standard 10-digit VAT registration number starting with '4' but associated with the buyer
        pattern = r"\b4\d{9}\b"
        matches = re.findall(pattern, text)
        if len(matches) > 1:
            return matches[1] # Typically the second VAT number is the buyer's VAT
        return None

    def _extract_invoice_date(self, text: str) -> str:
        # Common South African date formats: DD/MM/YYYY, YYYY-MM-DD
        pattern = r"\b\d{4}[-/]\d{2}[-/]\d{2}\b|\b\d{2}[-/]\d{2}[-/]\d{4}\b"
        match = re.search(pattern, text)
        return match.group(0) if match else datetime.now().strftime("%Y-%m-%d")

    def _extract_invoice_number(self, text: str) -> str:
        pattern = r"(?:Invoice No|Inv No|Invoice #|INV-)\s*[:#\-]?\s*([A-Za-z0-9\-]+)"
        match = re.search(pattern, text, re.IGNORECASE)
        return match.group(1) if match else f"INV-{int(datetime.now().timestamp())}"

    def _extract_total_amount(self, text: str) -> float:
        # Matches patterns like Total: R28,500.00 or Total R 4500.50
        pattern = r"(?:Total|Total ZAR|Amount Due|Balance)\s*[:\-]?\s*(?:R)?\s*([\d\s,]+\.\d{2})"
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            clean_val = match.group(1).replace(" ", "").replace(",", "")
            return float(clean_val)
        return 0.0

    def _extract_explicit_vat(self, text: str) -> float:
        pattern = r"(?:Vat 15%|Vat Amount|Tax)\s*[:\-]?\s*(?:R)?\s*([\d\s,]+\.\d{2})"
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            clean_val = match.group(1).replace(" ", "").replace(",", "")
            return float(clean_val)
        return 0.0

    def _find_regex_match(self, text: str, pattern: str, default: str) -> str:
        match = re.search(pattern, text, re.IGNORECASE)
        return match.group(1).strip() if match else default

    def _get_mock_raw_invoice_text(self) -> str:
        # High value mock receipt to test full compliance
        return """
        HELIOLUX SOLAR SOLUTIONS JHB (PTY) LTD
        CIPC Registration No: 2018/092813/07
        VAT Registration No: 4010992388
        Tax Invoice
        
        Invoice Number: SUN-INV-992
        Date: 2026-06-28
        
        Bill To: South Africa Consulting Services Pty Ltd
        Delivery Address: 12 Sandton Drive, Sandton, Johannesburg
        Client VAT Number: 4890112345
        
        Item 1: Commercial Grade Inverter (10kW) - R30,000.00 (VAT 15%)
        Item 2: Solar Photovoltaic Modules x12 - R15,000.00 (VAT 15%)
        
        Net Amount: R39,130.43
        Vat 15%: R5,869.57
        Total ZAR: 45000.00
        
        Thank you for choosing renewable energy!
        """

# Execution trigger for testing the workflow
if __name__ == "__main__":
    workflow = SARSVatOcrWorkflow()
    raw_text = workflow._get_mock_raw_invoice_text()
    parsed_invoice = workflow.parse_sars_invoice(raw_text, is_business_purchase=True)
    print("\n[RESULT] Executed Autonomous SARS Compliance Workflow Wrapper:")
    print(json.dumps(parsed_invoice, indent=2))
