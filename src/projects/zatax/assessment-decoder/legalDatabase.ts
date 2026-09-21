import { LegalReference, Ita34DisallowedItem } from './types';

export const ITA34_4015_DEFAULT_ASSESSMENT: Ita34DisallowedItem = {
  sourceCode: '4015',
  description: 'Business Travel Expenses / Travel Allowance Deduction',
  taxpayerClaimed: 68475.00,
  sarsAssessed: 0.00,
  disallowedAmount: 68475.00,
  status: 'DISALLOWED',
  primaryStatute: 'Income Tax Act 58 of 1962, Section 8(1)(b) & Section 11(a)',
  commonDisallowReasons: [
    {
      code: 'DIS-LOG-01',
      title: 'No Logbook Attached / Missing Logbook',
      description: 'SARS automatically writes back Code 4015 claims to R0 if a compliant contemporaneous logbook is not attached upon audit verification or electronic submission.',
      statutoryRemedy: 'Submit contemporaneous SARS-compliant travel logbook indicating opening/closing kms, dates, destination, and explicit business purpose.'
    },
    {
      code: 'DIS-PURP-02',
      title: 'No Proof of Business Purpose',
      description: 'Lack of corroborating evidence linking travel trips directly to trade operations or income generation (e.g. client meeting minutes, project site addresses).',
      statutoryRemedy: 'Corroborate client engagement schedules, engagement letters, and calendar audit trails matching logbook destinations.'
    },
    {
      code: 'DIS-PRIV-03',
      title: 'Private Portion / Commuting Inclusions',
      description: 'Travel between taxpayer home and habitual place of work is deemed private commuting under Section 8(1)(b)(i) and is strictly non-deductible.',
      statutoryRemedy: 'Segregate private home-to-office mileage and recalculate business ratio strictly on bona fide client travel.'
    },
    {
      code: 'DIS-OWN-04',
      title: 'Vehicle Cost / Ownership Substantiation',
      description: 'Taxpayer claimed actual cost method without submitting proof of vehicle purchase price, finance agreement, or actual operating expenditure.',
      statutoryRemedy: 'Attach vehicle purchase invoice, signed HP/lease agreement, and verified maintenance ledger.'
    }
  ]
};

export const SOUTH_AFRICAN_TAX_LEGAL_DB: LegalReference[] = [
  {
    statute: 'Section 11(a) of the Income Tax Act 58 of 1962',
    title: 'General Deduction Formula (Positive Test)',
    summary: 'Allows deduction of expenditure and losses actually incurred in the Republic in the production of income, provided such expenditure is not of a capital nature and incurred for the purposes of trade.',
    keyPrinciples: [
      'Trade Requirement: The taxpayer must actively carry on a bona fide trade (S1 definition of trade).',
      'Actually Incurred: Unconditional legal liability or expenditure must have arisen during the tax assessment year.',
      'In the Production of Income: Direct causal connection between the travel incurred and the income-earning activities.',
      'Not of a Capital Nature: Day-to-day operational business travel expenses are revenue expenditure, not capital asset creation.'
    ],
    caseLaw: [
      {
        citation: 'Sub-Nigel Ltd v CIR 1948 (4) SA 580 (A)',
        court: 'Appellate Division (South Africa)',
        ratioDecidendi: 'Expenditure is incurred in the production of income if its purpose was to earn income, whether or not income was actually generated in that specific period.'
      },
      {
        citation: 'Port Elizabeth Electric Tramway Co v CIR (1936 CPD 241)',
        court: 'Cape Provincial Division',
        ratioDecidendi: 'Established the dual test: (1) Does the act to which the expenditure is attached link directly to the business operation? (2) Was the expenditure reasonably incidental to that operation?'
      },
      {
        citation: 'CSARS v BP Southern Africa (Pty) Ltd (2006 SCA 134)',
        court: 'Supreme Court of Appeal',
        ratioDecidendi: 'Reaffirmed the objective purpose test: expenditure incurred bona fide for the preservation or carrying on of the trade is fully deductible under Section 11(a).'
      }
    ]
  },
  {
    statute: 'Section 8(1)(b) of the Income Tax Act 58 of 1962',
    title: 'Taxation of Allowances & Deductions for Business Travel',
    summary: 'Governs deductions against travel allowances or business travel expenses where private vehicles are utilized for employer or trade purposes.',
    keyPrinciples: [
      'Presumption of Private Use: All travel is deemed private unless the taxpayer proves business travel by means of an accurate logbook.',
      'Contemporaneous Logbook: Must record opening and closing odometer readings for each business journey.',
      'Rate Determination: Calculation by prescribed rate per km (SARS deemed rate table) or actual costs supported by documentation.'
    ],
    caseLaw: [
      {
        citation: 'ITC 1876 (77 SATC 175)',
        court: 'Tax Court of South Africa',
        ratioDecidendi: 'In the absence of a contemporaneous logbook, SARS is statutorily justified in disallowing business travel claims under Section 8(1).'
      }
    ]
  },
  {
    statute: 'Tax Administration Act 28 of 2011, Section 104 & Dispute Resolution Rules (Rule 7)',
    title: 'Statutory Right of Objection & Rule 7 Notice Formulation',
    summary: 'Grants the taxpayer the statutory right to lodge an ADR1 Notice of Objection against an assessment, prescribing strict deadlines and requirements for specifying facts and grounds in law.',
    keyPrinciples: [
      '80-Business-Day Filing Window: Under the amended TAA rules, taxpayers have 80 business days from the date of the ITA34 assessment to lodge an objection.',
      'Rule 7 Requirement of Facts & Law: The objection must specify the grounds in detail, including the relevant facts relied upon and the specific statutory provisions of the Act.',
      'Corroborating Evidence: Supporting documents not previously submitted must be attached directly to the objection pack.'
    ],
    caseLaw: [
      {
        citation: 'ABC (Pty) Ltd v CSARS (Tax Court 2022)',
        court: 'Tax Court (Johannesburg)',
        ratioDecidendi: 'An objection strictly fulfilling Rule 7 particulars obligates SARS to consider the full merits of the taxpayer evidence rather than summarily upholding automated write-backs.'
      }
    ]
  }
];
