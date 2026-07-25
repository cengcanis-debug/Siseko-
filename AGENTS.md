# Custom Agent Instructions

These instructions define the behavioral guidelines, design conventions, and specific functional rules for development on the South Africa Tax Compliance Advisor application.

## 1. Multi-User Access Controls & Audit Logging
- Ensure strictly demarcated roles: `Owner`, `Accountant`, `Bookkeeper`, and `Auditor`.
- Enforce simulated role checks for adding/deleting transactions, approving scanned invoices, accessing tax projections, and downloading ledger CSVs.
- Maintain a high-fidelity, chronological audit log for all security-relevant and transaction-modifying operations.

## 2. ITA34 Assessment Decoder & Disallowed Source Code Detection
- When processing or analyzing a SARS Notice of Assessment (ITA34), the system must specifically parse the adjustments section.
- **Rule of Detection**: Target instances where SARS has written back specific claims (such as Source Code 4015 - Business Travel expenses) to R0.

## 3. Audit-Ready Vault Checks
- Before proposing any formal objection, query the taxpayer's Audit-Ready Vault for sufficient corroborating documentation.
- Verify the presence of a travel logbook (e.g., Logbook ID #789) and a signed Vehicle Purchase Agreement.

## 4. Rule 7 Legal Objection Drafting (ADR1 Notice of Objection)
- All drafted SARS objections must comply fully with Rule 7 of the Tax Administration Act (TAA) by citing both Facts and Law.
- **Formulation Logic**:
  - **Fact**: Cite exact Business travel distance (e.g., 12,450km) mapped directly to a verified logbook.
  - **Law**: Reference Section 11(a) of the Income Tax Act 58 of 1962 (General Deduction Formula).
  - **Evidence**: Automatically package and attach `Logbook_2026.pdf` and `Purchase_Agreement.pdf` from the vault.
  - **Deadline Check**: Verify and prompt the user to ensure filing falls within the 2026 TAA 80-Business-Day window.
