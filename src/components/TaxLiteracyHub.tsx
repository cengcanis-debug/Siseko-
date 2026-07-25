import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Video, 
  HelpCircle, 
  Search, 
  User, 
  Building2, 
  Briefcase, 
  Tag, 
  ChevronRight, 
  ChevronDown, 
  Play, 
  Pause, 
  Maximize2, 
  Volume2, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  Calculator, 
  ExternalLink,
  ThumbsUp,
  Award,
  BookMarked,
  CheckCircle,
  FileText,
  Trophy,
  Target,
  ShieldCheck,
  Flame,
  Lock,
  Unlock,
  Check,
  Users
} from 'lucide-react';
import { formatZAR } from '../utils/taxCalculations';

// ---------------------------------------------------------------------------
// TYPES & DATA STRUCTURES
// ---------------------------------------------------------------------------

type AudienceType = 'all' | 'individual' | 'freelancer' | 'small_business';
type TopicCategory = 'all' | 'provisional' | 'deductions' | 'capital_gains' | 'vat' | 'general';
type HubTab = 'articles' | 'videos' | 'faqs' | 'calculator' | 'quiz' | 'checklists' | 'challenges' | 'glossary';

interface Article {
  id: string;
  title: string;
  subtitle: string;
  category: TopicCategory;
  audiences: AudienceType[];
  readTime: string;
  publishDate: string;
  author: {
    name: string;
    role: string;
  };
  summary: string;
  content: string[]; // array of paragraphs
  keyTakeaways: string[];
  sarsSections: string[];
  likes: number;
}

interface VideoLesson {
  id: string;
  title: string;
  description: string;
  category: TopicCategory;
  audiences: AudienceType[];
  duration: string;
  instructor: string;
  slides: {
    time: number; // in simulated seconds
    title: string;
    points: string[];
  }[];
  transcripts: {
    time: number;
    text: string;
  }[];
  youtubeUrl?: string; // fallback or real embed
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: TopicCategory;
  audiences: AudienceType[];
  sarsReference?: string;
}

// ---------------------------------------------------------------------------
// CORE KNOWLEDGE BASE DATA
// ---------------------------------------------------------------------------

const ARTICLES: Article[] = [
  {
    id: 'art-prov-tax-101',
    title: 'Understanding Provisional Tax in South Africa',
    subtitle: 'A step-by-step guide to avoiding IRP6 penalties and mastering cycles',
    category: 'provisional',
    audiences: ['freelancer', 'small_business'],
    readTime: '6 min read',
    publishDate: 'June 2026',
    author: { name: 'Devon Govender', role: 'Senior Tax Practitioner' },
    summary: 'Provisional tax is not a separate tax, but a payment system that ensures you pay tax on your earning cycle instead of in one single lump sum. Learn how to estimate your income, compile form IRP6, and submit on time.',
    content: [
      'For many freelancers and small business owners in South Africa, provisional tax is one of the most misunderstood aspects of tax compliance. It is crucial to understand that provisional tax is not a "new" or separate tax. Rather, it is an advance payment method introduced by the South African Revenue Service (SARS) to prevent tax liabilities from accumulating into unaffordable lump sums at the end of the tax year.',
      'Who qualifies as a provisional taxpayer? Under the current South African Income Tax Act, any person who receives income other than standard salaried remuneration (PAYE) is generally a provisional taxpayer. This includes sole proprietors, freelancers, trust beneficiaries, corporate directors, and individuals who receive interest, rental income, or capital gains exceeding R30,000 per annum.',
      'Provisional tax works on a twice-yearly payment cycle. The First Period occurs on 31 August (representing the first 6 months of the tax year). Taxpayers must file an IRP6 return estimating their taxable income for the full year and pay 50% of the estimated total tax. The Second Period occurs on 28 February (the final day of the tax assessment year), where the remaining balance of the estimated full tax is settled.',
      'The golden rule of provisional tax is the "Basic Amount" calculation. When drafting your IRP6, SARS permits you to base your estimate on your taxable income from your last officially assessed tax year (the basic amount), provided it has been assessed within the preceding 14 months. If your business earnings fluctuate wildly, you must make a genuine estimation of your current-year profits to avoid SARS underestimation penalties under Paragraph 20 of the Fourth Schedule.',
      'Failure to submit on time or underestimating your taxable income can lead to severe statutory repercussions. Paragraph 20 underestimation penalties charge a flat 20% on the difference between the actual tax liability and the amount you estimated, alongside compounding interest. Regular, automated bookkeeping is the best shield against these penalties.'
    ],
    keyTakeaways: [
      'Provisional tax is an advance payment method, not an additional tax.',
      'Required if you receive non-salary income (rent, interest, dividends, business profit) exceeding R30,000.',
      'Filing deadlines are strictly August 31 (First Period) and February 28 (Second Period).',
      'The Basic Amount rule protects you from underestimation penalties if used correctly, but only if you estimate in good faith during period 2.'
    ],
    sarsSections: ['Income Tax Act No. 58 of 1962, Fourth Schedule, Paragraphs 17 to 27', 'Paragraph 20 Underestimation Penalties'],
    likes: 124
  },
  {
    id: 'art-allowable-deductions',
    title: 'Allowable Business Expenses under Section 11(a)',
    subtitle: 'Demystifying the general deduction formula for South African entrepreneurs',
    category: 'deductions',
    audiences: ['freelancer', 'small_business'],
    readTime: '8 min read',
    publishDate: 'May 2026',
    author: { name: 'Thandeka Mthembu', role: 'Chartered Accountant (SA)' },
    summary: 'What expenses can you legally write off against your business profits? Learn the statutory boundaries of the general deduction formula and the strict "production of income" test.',
    content: [
      'In South African tax law, the core engine of tax planning lies in Section 11(a) of the Income Tax Act, widely known as the General Deduction Formula. If you run a small business, a sole proprietorship, or a freelancing agency, understanding this provision is the single most effective way to optimize your tax bill legally.',
      'The General Deduction Formula specifies that for an expense to be deductible from your gross income, it must satisfy four strict statutory requirements. It must be: (1) an expenditure or loss, (2) actually incurred, (3) during the year of assessment, (4) in the production of income. Furthermore, Section 23(g) acts as a negative constraint, stating that no deduction is allowed for expenses not incurred for the purposes of trade.',
      'Let’s break down "actually incurred". This means that you do not need to have physically paid the money yet; a legal obligation to pay (such as an invoice received) is sufficient. However, contingent liabilities (e.g. estimated future repairs) do not qualify as "actually incurred". Keep a meticulous, digital invoice register to serve as concrete evidence.',
      'The "in production of income" requirement is where most SARS audits focus. There must be a direct, causal connection between the expense incurred and the generation of your taxable income. For instance, purchasing raw inventory or paying for web hosting is directly causal. Buying a high-end designer watch to "look professional" is generally disallowed because it is personal or capital in nature.',
      'Capital expenses are explicitly excluded from Section 11(a). If you purchase a computer, a delivery vehicle, or office furniture, you cannot deduct the entire cost in the year of purchase. Instead, you must claim capital allowances (depreciation) over multiple years under Section 11(e) or Section 12B (which includes the lucrative solar write-off incentives).'
    ],
    keyTakeaways: [
      'Section 11(a) is the statutory gatekeeper for all business expenditure write-offs.',
      'Expenses must be directly related to the active trade generating your taxable revenue.',
      'Section 23(g) prohibits any deductions for private or domestic expenses.',
      'Meticulous corroborating documentation (invoices, receipts, logs) is mandatory to survive a SARS write-back audit.'
    ],
    sarsSections: ['Section 11(a) General Deduction Formula', 'Section 23(g) Trade Restrictions', 'Section 11(e) Wear and Tear Allowances'],
    likes: 198
  },
  {
    id: 'art-cgt-basics',
    title: 'Capital Gains Tax (CGT) Basics for South Africans',
    subtitle: 'How asset disposals are taxed and claiming individual exemptions',
    category: 'capital_gains',
    audiences: ['individual', 'freelancer', 'small_business'],
    readTime: '5 min read',
    publishDate: 'April 2026',
    author: { name: 'Sipho Ndlovu', role: 'Tax Compliance Specialist' },
    summary: 'When you sell an asset (like property, shares, or crypto), you may trigger Capital Gains Tax. Explore inclusion rates, primary residence exclusions, and annual tax-free brackets.',
    content: [
      'Capital Gains Tax (CGT) was introduced to South Africa in October 2001. It is not a standalone tax, but a component of regular Income Tax. When you "dispose" of an asset for a value greater than its original "base cost", you generate a capital gain. A portion of this capital gain is added to your regular taxable income and taxed at your marginal rate.',
      'What constitutes a disposal? Standard examples include selling property, selling shares, donating an asset, or transferring digital currencies (such as Bitcoin or Ethereum). Even emigrating from South Africa or death triggers a "deemed disposal" where you are taxed as if you sold your assets on that day.',
      'The crucial numbers you need to know are the inclusion rates. For individuals and special trusts, the CGT inclusion rate is currently 40%. This means that if you make a capital gain of R100,000, only R40,000 is added to your taxable income. For companies and regular trusts, the inclusion rate is 80%, exposing a much larger portion of the gain to corporate tax.',
      'Fortunately, SARS provides statutory relief through the Annual Exclusion. For individuals, the first R40,000 of capital gains in any tax year is completely tax-free. Furthermore, if you sell your primary residence (the home you actively live in), the first R2 million of capital gains is excluded from CGT under the Primary Residence Exclusion.',
      'Calculating the base cost of your assets is essential. The base cost includes the original purchase price, direct transaction fees (transfer duties, agent commission), and costs of physical improvements. Routine maintenance costs cannot be added to the base cost. Keep all acquisition records and purchase agreements in a safe vault indefinitely.'
    ],
    keyTakeaways: [
      'CGT applies to property sales, share portfolios, business disposals, and cryptocurrency transactions.',
      'Individuals have a 40% inclusion rate and a flat R40,000 annual tax-free exclusion.',
      'Primary residences enjoy a massive R2 million capital gain exclusion.',
      'Keep comprehensive records of asset improvements to increase your base cost and lower taxable gains.'
    ],
    sarsSections: ['Income Tax Act No. 58 of 1962, Eighth Schedule', 'Paragraph 25 Base Cost Determination', 'Paragraph 45 Primary Residence Exclusion'],
    likes: 87
  },
  {
    id: 'art-vat-essentials',
    title: 'Value Added Tax (VAT) Registration and Claims',
    subtitle: 'Compulsory vs voluntary VAT registration and input tax recovery rules',
    category: 'vat',
    audiences: ['small_business'],
    readTime: '7 min read',
    publishDate: 'March 2026',
    author: { name: 'Melissa Coetzee', role: 'Indirect Tax Director' },
    summary: 'Operating a VAT-registered enterprise in South Africa requires strict adherence to tax invoice requirements. Understand the R1 million threshold and rules for claimable Input VAT.',
    content: [
      'Value Added Tax (VAT) is South Africa’s primary indirect consumption tax, currently levied at a standard rate of 15% on most goods and services. For growing companies, navigating VAT is a critical operational requirement that directly impacts cash flows and pricing strategies.',
      'In South Africa, VAT registration is divided into two categories: Compulsory and Voluntary. Compulsory registration is legally required if your enterprise’s taxable turnover exceeds R1 million in any consecutive 12-month period, or is projected to exceed this limit in the immediate 30 days. Failure to register within 21 days of crossing this threshold triggers severe penalties.',
      'Conversely, you can apply for Voluntary VAT registration if your business turnover has exceeded R50,000 in the past 12 months. Voluntary registration is highly popular among business-to-business (B2B) startups because it allows them to claim back the VAT they pay to suppliers (Input VAT), and ensures they appear established to corporate clients.',
      'To successfully claim back Input VAT, you must possess a valid, statutory "Tax Invoice" issued by the supplier. For invoices exceeding R5,000, SARS mandates a "Full Tax Invoice", which must contain: the words "Tax Invoice", the supplier\'s name, address, and VAT registration number, the recipient\'s name, address, and VAT registration number, an individual serialized invoice number, and a detailed breakdown of the standard rate VAT.',
      'Certain expenditures are legally restricted, meaning you cannot claim Input VAT even if you have a valid tax invoice. Key examples include "entertainment expenses" (such as customer lunches, office coffee, and staff parties) and the acquisition/rental of passenger vehicles. However, VAT on commercial vehicles, delivery trucks, and solar equipment is fully claimable.'
    ],
    keyTakeaways: [
      'Compulsory registration is triggered at R1 million in consecutive 12-month taxable revenue.',
      'Voluntary registration is permissible starting at R50,000 in turnover.',
      'You must obtain a compliant Tax Invoice featuring both parties\' VAT details to recover Input VAT.',
      'Input VAT on entertainment, hospitality, and standard passenger cars is legally blocked by SARS.'
    ],
    sarsSections: ['Value-Added Tax Act No. 89 of 1991', 'Section 20 Tax Invoice Requirements', 'Section 17 Input Tax Limitations'],
    likes: 110
  },
  {
    id: 'art-vat201-guide',
    title: 'VAT 201 Returns: Decoding SARS Output & Input Tax Rules',
    subtitle: 'A statutory compliance roadmap for standard, zero-rated, and exempt transactions',
    category: 'vat',
    audiences: ['small_business', 'freelancer'],
    readTime: '9 min read',
    publishDate: 'June 2026',
    author: { name: 'Melissa Coetzee', role: 'Indirect Tax Director' },
    summary: 'A deep-dive tutorial into VAT 201 returns: Output tax liabilities, input tax recovery limits, exempt supplies vs zero-rated transactions, and key audit protocols.',
    content: [
      'For registered VAT vendors in South Africa, submitting the VAT 201 return is a recurring statutory obligation that dictates operational liquidity. The VAT 201 is used to declare and reconcile Output Tax (VAT collected on standard-rate sales) against Input Tax (VAT paid on business expenditures). The final liability or refund is simply the net difference between these two categories.',
      'South African VAT transactions fall into three strict legislative brackets: (1) Standard-Rated Supplies (taxed at 15%), (2) Zero-Rated Supplies (taxed at 0%, which includes basic food items, fuel, and direct exports to international clients), and (3) Exempt Supplies (not subject to VAT, which includes passenger transport, educational services, and residential rentals). Zero-rated suppliers can still claim back their related input tax, whereas exempt suppliers cannot.',
      'A critical compliance trap is the statutory timeline for recovering input tax under Section 16(2) of the VAT Act. Generally, a vendor has up to 5 years from the date of the tax invoice to claim back unclaimed Input VAT. If you miss this five-year window, the claim is permanently forfeited, and the expense must be written off as standard non-deductible asset cost.',
      'SARS audits on VAT 201 returns are highly automated. The moment a business submits a VAT 251/201 that results in a net refund, SARS eFiling will trigger a "Verification of VAT 201 Return" and request corroborating documents. To pass this verification, you must provide a full General Ledger mapped to the VAT period, alongside the 5 largest tax invoices from suppliers demonstrating matching numbers.',
      'Remember: standard passenger vehicles, staff canteen costs, corporate entertainment, and gym memberships are strictly "blocked" under Section 17(2). Attempting to claim input tax on these expenditures is the single most common cause of SARS imposing immediate 10% late-payment and under-declaration penalties plus interest.'
    ],
    keyTakeaways: [
      'The VAT 201 return reconciles standard 15% Output VAT against claimable Input VAT.',
      'Zero-rated supplies (0%) allow input tax recovery; Exempt supplies do not allow any input tax recovery.',
      'Section 16(2) imposes a strict 5-year claiming limit for recovering past Input VAT.',
      'Net refunds trigger automatic SARS eFiling verifications, requiring clean general ledgers and compliant tax invoices.'
    ],
    sarsSections: ['Value-Added Tax Act No. 89 of 1991', 'Section 16(2) 5-Year Claim Limits', 'Section 17(2) Blocked Input Expenditures', 'Section 7(1)(a) Levying of VAT'],
    likes: 142
  },
  {
    id: 'art-emp201-guide',
    title: 'EMP 201 Compliance: Master PAYE, UIF, and SDL Submissions',
    subtitle: 'The ultimate South African payroll guide to statutory employer withholdings and deadlines',
    category: 'general',
    audiences: ['small_business'],
    readTime: '8 min read',
    publishDate: 'June 2026',
    author: { name: 'Thandeka Mthembu', role: 'Chartered Accountant (SA)' },
    summary: 'As an employer, you hold a fiduciary responsibility to withhold employee taxes and pay them over to SARS. Learn the statutory mechanics of PAYE, UIF, and SDL calculations on form EMP 201.',
    content: [
      'Operating as a compliant enterprise in South Africa means managing staff payroll and navigating the monthly EMP 201 return. The EMP 201 is a joint declaration where employers calculate and report three distinct statutory employee taxes: Pay-As-You-Earn (PAYE), the Unemployment Insurance Fund (UIF), and the Skills Development Levy (SDL).',
      'First is PAYE (Pay-As-You-Earn). This is the personal income tax withheld from employee salaries, calculated in accordance with the current SARS weekly/monthly tax deduction tables or brackets. Employers are legally obligated to deduct this tax before paying salaries and must hold it in trust until paid over to SARS.',
      'Second is UIF (Unemployment Insurance Fund) contributions. This represents a dual-funded scheme. The employee contributes 1% of their gross remuneration, and the employer contributes an additional 1%. This creates a combined 2% contribution which is capped monthly. Remuneration exceeding the statutory cap (currently R17,712 per month) does not attract additional UIF contributions.',
      'Third is SDL (Skills Development Levy). SDL is an employer-funded tax introduced to finance industrial training programs. If your total gross employee remuneration (payroll bill) is projected to exceed R500,000 in any consecutive 12-month period, you must register for and pay SDL. SDL is levied at 1% of the total leviable payroll amount and is paid entirely by the employer.',
      'Deadlines are absolute: the EMP 201 declaration and payment must be submitted to SARS on or before the 7th day of the following calendar month (e.g., July contributions must be paid by August 7th). If the 7th day falls on a Saturday, Sunday, or public holiday, the deadline shifts to the preceding business day. Missing this deadline triggers an automatic, non-negotiable 10% late-payment penalty, alongside interest.'
    ],
    keyTakeaways: [
      'EMP 201 consolidates monthly PAYE, UIF (1% employee + 1% employer), and SDL (1% if payroll > R500k p.a.).',
      'The strict statutory deadline is the 7th of every month (or the preceding business day if weekend/holiday).',
      'Failing to pay on time results in an automatic 10% penalty plus compounding daily interest.',
      'Annual payrolls must be reconciled during the bi-annual EMP501 submission periods for IRP5 generation.'
    ],
    sarsSections: ['Income Tax Act No. 58 of 1962, Fourth Schedule', 'Unemployment Insurance Contributions Act No. 4 of 2002', 'Skills Development Levies Act No. 9 of 1999'],
    likes: 119
  },
  {
    id: 'art-expat-tax-guide',
    title: 'Expatriates and Out-of-SA Employment: Understanding Section 10(1)(o)(ii)',
    subtitle: 'A compliance blueprint for South African residents rendering services abroad',
    category: 'general',
    audiences: ['individual', 'freelancer'],
    readTime: '10 min read',
    publishDate: 'June 2026',
    author: { name: 'Thabo Ndlovu', role: 'International Tax Consultant' },
    summary: 'An in-depth guide on the South African tax residency rules, Section 10(1)(o)(ii) exemption criteria, employer withholding obligations, split IRP5 codes, and the documentation required to pass SARS expat audits.',
    content: [
      'As globalization deepens, many South African taxpayers render employment services abroad while remaining South African tax residents. This status exposes their global earnings to SARS tax collections. However, Section 10(1)(o)(ii) of the Income Tax Act provides critical relief, allowing residents to exclude up to R1,250,000 of foreign-earned remuneration per tax year from local taxation.',
      'To qualify for this exemption, the resident must meet two strict physical day-count requirements: (1) rendering services outside South Africa for more than 183 full days in aggregate during any 12-month period, and (2) at least 60 of those days must be continuous, consecutive, and uninterrupted. Days spent traveling on airplanes or transiting do not qualify if they are not spent rendering active services abroad.',
      'A common misconception is that the employer does not have to withhold PAYE once the 183-day mark is passed. Under Paragraph 2(2) of the Fourth Schedule to the Income Tax Act, a South African employer must withhold PAYE on all remuneration unless they apply for and obtain a Paragraph 2(2) variation directive, or unless they are satisfied that the employee qualifies for the Section 10(1)(o)(ii) exemption. If the foreign employer has no local presence and does not withhold PAYE, the employee holds a sole duty to register as a Provisional Taxpayer and file biannual IRP6 returns.',
      'For employers, proper payroll reporting is paramount. Remuneration earned for foreign services must be carefully split on the employee\'s IRP5 tax certificate using specific SARS codes. Taxable foreign earnings must be reported under Code 3651, and the exempt portion (up to the R1,250,000 limit) must be reported under Code 3652. Failure to use these specific codes will lead to immediate rejection of the exemption on the employee\'s ITR12 return.',
      'SARS audits foreign employment exemptions with near-100% frequency. To pass an audit, taxpayers must store certified passport exit/entry scans, flight itineraries, employment contracts specifying overseas duties, and a signed employer certificate confirming the physical dates and nature of the services rendered. Keeping these documents safely inside an Audit-Ready Vault is the only way to safeguard your exemption from being written back to R0 by SARS.'
    ],
    keyTakeaways: [
      'South African residents working abroad can claim up to R1,250,000 exempt under Section 10(1)(o)(ii).',
      'Requires >183 total days abroad, with at least 60 consecutive days, within any 12-month period.',
      'Employers must report foreign earnings on IRP5 certificates using split codes: 3651 (taxable) and 3652 (exempt).',
      'Taxpayers working for unregistered foreign employers must register as Provisional Taxpayers and submit IRP6 returns.',
      'Certified passport scans and signed employer duration certificates are mandatory to survive inevitable SARS audits.'
    ],
    sarsSections: ['Income Tax Act No. 58 of 1962, Section 10(1)(o)(ii)', 'Fourth Schedule, Paragraph 2(2) PAYE Variation', 'SARS Code 3651 & Code 3652 Reporting Guidelines'],
    likes: 156
  }
];

const FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'Am I allowed to claim a home office deduction as a salaried individual?',
    answer: 'Under Section 23(b) of the Income Tax Act, home office deductions for salaried employees are subject to extremely strict conditions. To claim, your office must be a specifically equipped, dedicated room in your home used exclusively for your trade (it cannot double as a guest room or playroom). Furthermore, if you are salaried, you must work from home for more than 50% of your total working hours, and your employer must have specifically permitted/required you to work from home. SARS audits home office claims with a nearly 95% audit rate, requiring photos of the workspace, a floor plan, and a letter from your employer.',
    category: 'deductions',
    audiences: ['individual'],
    sarsReference: 'Section 23(b) and Section 23(m)'
  },
  {
    id: 'faq-2',
    question: 'How does the Section 12B/12BA Solar Allowance affect small businesses?',
    answer: 'South Africa currently offers enhanced tax write-offs for renewable energy investments to mitigate load-shedding. Under Section 12BA, businesses can claim a 125% upfront deduction on the cost of renewable energy assets (like solar panels, inverters, and lithium batteries) in the year they are brought into use. There is no monetary cap on this deduction, making it an exceptional incentive for businesses to go off-grid while lowering taxable income.',
    category: 'deductions',
    audiences: ['small_business', 'freelancer'],
    sarsReference: 'Section 12BA Renewable Energy Incentives'
  },
  {
    id: 'faq-3',
    question: 'What happens if I miss a provisional tax filing deadline?',
    answer: 'If you miss a provisional tax deadline (31 August or 28 February), SARS will levy an automatic 10% late-payment penalty on the tax amount due. Additionally, daily compounding interest will accrue on the outstanding balance from the due date until paid. More critically, if you fail to submit an estimate of your taxable income for the second period, SARS may estimate it for you, which can trigger Paragraph 20 underestimation penalties of up to 20% on the difference.',
    category: 'provisional',
    audiences: ['freelancer', 'small_business'],
    sarsReference: 'Paragraph 20 & 27 of the Fourth Schedule'
  },
  {
    id: 'faq-4',
    question: 'Is cryptocurrency trading subject to Capital Gains Tax (CGT) or Normal Tax?',
    answer: 'SARS does not view cryptocurrency as a currency, but rather as an intangible asset. The taxation depends on your intention. If you buy and hold crypto as a long-term investment, disposals are subject to Capital Gains Tax (40% inclusion rate). However, if you actively trade cryptocurrency (buying and selling frequently), the profits are treated as business income and subject to regular income tax up to 45% for individuals.',
    category: 'capital_gains',
    audiences: ['individual', 'freelancer'],
    sarsReference: 'SARS Crypto Assets Taxation Guide'
  },
  {
    id: 'faq-5',
    question: 'Do I need a logbook to claim business travel expenses from SARS?',
    answer: 'Absolutely. SARS strictly disallows any business travel claim that is not backed by a valid, daily physical or digital travel logbook. The logbook must record: date of travel, starting and destination points, purpose of travel, and starting and closing odometer readings. You cannot claim travel between your home and your permanent place of employment, as SARS views this as private commuting. Section 8(1) governs travel allowances.',
    category: 'deductions',
    audiences: ['individual', 'freelancer'],
    sarsReference: 'Section 8(1)(b) Travel Allowances'
  }
];

const VIDEO_LESSONS: VideoLesson[] = [
  {
    id: 'vid-prov-tax-deepdive',
    title: 'Mastering Provisional Tax (IRP6) Filing & Calculation',
    description: 'Learn how to calculate your first and second period provisional tax estimates, avoidParagraph 20 underestimation penalties, and read SARS cycles.',
    category: 'provisional',
    audiences: ['freelancer', 'small_business'],
    duration: '15:20',
    instructor: 'Devon Govender (Tax Director)',
    slides: [
      { time: 0, title: 'Introduction to Provisional Tax', points: ['Provisional Tax is NOT an extra tax', 'It is an advance payment system', 'Avoids a heavy cash-flow surprise at year-end'] },
      { time: 10, title: 'Who Must File IRP6 Returns?', points: ['Sole proprietors, freelancers, and small businesses', 'Anyone receiving interest or rental income > R30,000', 'Companies automatically qualify'] },
      { time: 25, title: 'The Crucial Filing Deadlines', points: ['Period 1: 31 August (6 months in, estimate full year)', 'Period 2: 28 February (Year-end, final adjustment)', 'Period 3 (Voluntary): 30 September (Avoid interest)'] },
      { time: 45, title: 'Paragraph 20 Underestimation Penalties', points: ['SARS charges 20% penalty if actual income is underestimated', 'Safe Harbor: Base your estimate on last assessed "Basic Amount"', 'Keep bookkeeper-ledgers live to calculate accurate profits'] }
    ],
    transcripts: [
      { time: 0, text: 'Hello and welcome. Today we are unpacking South Africa\'s provisional tax cycles.' },
      { time: 5, text: 'Many entrepreneurs fear the IRP6 filing, but it is actually quite straightforward.' },
      { time: 10, text: 'First, remember: this is not a separate tax category. It is an advance payment scheme.' },
      { time: 18, text: 'If you earn any income that is not subject to PAYE salary tax, you must register.' },
      { time: 25, text: 'The cycles are key. August 31st and February 28th are your strict statutory deadlines.' },
      { time: 35, text: 'By submitting your first estimate in August, you pay half of your projected tax.' },
      { time: 45, text: 'In February, you recalculate based on close-to-actuals and settle the balance.' },
      { time: 55, text: 'Beware of Paragraph 20! Underestimating your taxable income leads to an automatic 20% penalty.' }
    ]
  },
  {
    id: 'vid-sec11a-writeoffs',
    title: 'Deductions Masterclass: Lawfully Minimizing Taxable Profits',
    description: 'A deep dive into the General Deduction Formula (Section 11a) and Section 23g trade constraints for entrepreneurs.',
    category: 'deductions',
    audiences: ['freelancer', 'small_business'],
    duration: '12:45',
    instructor: 'Thandeka Mthembu (CA)',
    slides: [
      { time: 0, title: 'The General Deduction Formula', points: ['Governed strictly by Section 11(a) of Income Tax Act', 'Requires four critical tests to be met', 'Deductions must support active trade'] },
      { time: 8, title: 'The Production of Income Test', points: ['Causal connection between expenditure and income generation', 'Must not be capital in nature (capital relies on allowances)', 'Must be actually incurred (legal obligation exists)'] },
      { time: 18, title: 'Section 23(g) Negating Rules', points: ['Private, domestic, or dual-purpose expenses are disallowed', 'Home office requires strict exclusive use boundary', 'Client entertainment is completely blocked for Input VAT'] }
    ],
    transcripts: [
      { time: 0, text: 'Welcome to our write-offs masterclass. We are focusing on Section 11(a) of the Income Tax Act.' },
      { time: 8, text: 'To claim any expense, it must be incurred "in the production of income".' },
      { time: 15, text: 'If you buy stock, advertise, or pay business rent, the link is obvious.' },
      { time: 22, text: 'But if you purchase personal clothing or dual-use items, SARS will disallow them.' },
      { time: 30, text: 'Keep clean, digitized records to survive a SARS compliance write-back audit!' }
    ]
  }
];

// ---------------------------------------------------------------------------
// MAIN COMPONENT DEFINITION
// ---------------------------------------------------------------------------

export const TaxLiteracyHub: React.FC<{
  userRole: string;
  showBanner: (msg: string) => void;
  activeProfileName: string;
  activeEntity?: any;
  vaultDocuments?: any[];
}> = ({ userRole, showBanner, activeProfileName, activeEntity, vaultDocuments }) => {
  // Navigation & Filter State
  const [activeTab, setActiveTab] = useState<HubTab>('articles');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAudience, setSelectedAudience] = useState<AudienceType>('all');
  const [selectedTopic, setSelectedTopic] = useState<TopicCategory>('all');

  // Reading Mode State (Articles)
  const [selectedArticleId, setSelectedArticleId] = useState<string>(ARTICLES[0].id);

  // Video Player State
  const [selectedVideoId, setSelectedVideoId] = useState<string>(VIDEO_LESSONS[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoTime, setVideoTime] = useState(0); // in seconds
  const [videoLikes, setVideoLikes] = useState<Record<string, number>>({
    'vid-prov-tax-deepdive': 42,
    'vid-sec11a-writeoffs': 78
  });

  // Accordion FAQ State
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  // Interactive Tax Estimator Quick-Tool State
  const [estIncome, setEstIncome] = useState('450000');
  const [estExpenses, setEstExpenses] = useState('120000');
  const [estRetirement, setEstRetirement] = useState('35000');
  const [ageGroup, setAgeGroup] = useState<'under65' | 'over65' | 'over75'>('under65');

  // Sub-Calculator Tab selection
  const [calcSubTab, setCalcSubTab] = useState<'pit' | 'vat201' | 'emp201'>('pit');

  // Interactive VAT 201 States
  const [vatOutputStandard, setVatOutputStandard] = useState('180000'); // Standard 15% sales
  const [vatOutputZero, setVatOutputZero] = useState('40000'); // Export / zero-rated
  const [vatOutputExempt, setVatOutputExempt] = useState('15000'); // Exempt transport, etc.
  const [vatInputStandard, setVatInputStandard] = useState('95000'); // Purchases at 15%
  const [vatInputBlocked, setVatInputBlocked] = useState('12000'); // Blocked purchases (entertainment/passenger)

  // Interactive EMP 201 States
  const [empCount, setEmpCount] = useState('3'); // Employee count
  const [empTotalSalaries, setEmpTotalSalaries] = useState('75000'); // Taxable PAYE Salaries
  const [empUifSalaries, setEmpUifSalaries] = useState('53136'); // Salaries subject to UIF (capped)
  const [empSdlSalaries, setEmpSdlSalaries] = useState('75000'); // Salaries subject to SDL

  // Interactive SARS Compliance Self-Audit Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<string, 'yes' | 'no' | null>>({
    logbook: null,
    exclusiveOffice: null,
    vatInvoices: null,
    provisionalEstimate: null,
    purchaseAgreement: null
  });
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Gamification & Challenges State
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([]);
  const [knowledgeAnswers, setKnowledgeAnswers] = useState<Record<number, number>>({});
  const [knowledgeQuizSubmitted, setKnowledgeQuizSubmitted] = useState(false);
  const [streakCount, setStreakCount] = useState(4); // 4-day proactive streak

  // South African Tax Knowledge Quiz questions & options
  const TAX_KNOWLEDGE_QUESTIONS = useMemo(() => [
    {
      id: 1,
      question: "What is the primary requirement for a business expense to be deductible in South Africa?",
      options: [
        "It must be paid in cash during the year and approved by an auditor.",
        "It must be incurred in the production of income and for the purposes of trade (Section 11(a) Production Test).",
        "It must be less than R10,000 per transaction.",
        "It must be logged with the CIPC within 30 days of payment."
      ],
      correctIndex: 1,
      explanation: "Section 11(a) of the Income Tax Act (General Deduction Formula) dictates that expenses are deductible only if they are actually incurred in the active production of taxable income and satisfy Section 23(g) trade constraints.",
      actRef: "Income Tax Act, Section 11(a)"
    },
    {
      id: 2,
      question: "Under Paragraph 20 of the Fourth Schedule, what is the consequence of underestimating your actual taxable income on your second provisional tax return?",
      options: [
        "SARS suspends your VAT registration.",
        "Your marginal tax rate is increased to 45% flat.",
        "SARS imposes an automatic, non-negotiable 20% underestimation penalty.",
        "The directors are disqualified from CIPC registration."
      ],
      correctIndex: 2,
      explanation: "If your second period Provisional return (IRP6) estimates fall below 90% of your actual assessed taxable income (or 80% if income > R1m), SARS automatically imposes a 20% underestimation penalty.",
      actRef: "Fourth Schedule, Paragraph 20"
    },
    {
      id: 3,
      question: "What upfront tax deduction can a business claim in 2026 for investments in solar panels and other qualifying renewable energy assets?",
      options: [
        "A standard wear and tear allowance of 20% per year under Section 11(e).",
        "An enhanced 125% upfront deduction under Section 12BA in the year the asset is brought into use.",
        "No deduction, but they get a 15% discount on company tax rates.",
        "A 50% write-off only if the business operates at a net loss."
      ],
      correctIndex: 1,
      explanation: "Section 12BA provides an enhanced incentive for South African businesses to go off-grid, allowing a 125% upfront deduction on renewable energy assets brought into use for trade in 2026.",
      actRef: "Income Tax Act, Section 12BA"
    },
    {
      id: 4,
      question: "As an employer in South Africa, by which date of the following calendar month must you file and pay monthly payroll withholdings (PAYE, UIF, SDL) on form EMP 201?",
      options: [
        "By the 25th of the following month.",
        "By the last day of the calendar month.",
        "By the 7th of the following month (or the preceding business day if it falls on a weekend or holiday).",
        "Within 30 business days of salary payment."
      ],
      correctIndex: 2,
      explanation: "EMP 201 declarations and payments must be submitted to SARS on or before the 7th of the following month. Late payments trigger an automatic 10% penalty plus compounding daily interest.",
      actRef: "Income Tax Act, Fourth Schedule"
    },
    {
      id: 5,
      question: "If you lend money interest-free to a family trust, how does SARS treat the interest that you chose not to charge?",
      options: [
        "It is treated as a tax-deductible bad debt under Section 11(i).",
        "It is treated as a taxable donation, subject to 20% Donations Tax on the interest difference below the SARS Official Rate of Interest.",
        "It is fully exempt from all taxes under the small business exemption.",
        "It is deducted from the trustee's personal income tax rebate."
      ],
      correctIndex: 1,
      explanation: "Section 7C is an anti-avoidance rule that treats the forgone interest on interest-free or low-interest trust loans as a taxable donation, triggering 20% donations tax beyond the annual exemption.",
      actRef: "Income Tax Act, Section 7C"
    }
  ], []);

  // Calculate knowledge quiz correct count
  const knowledgeQuizCorrectCount = useMemo(() => {
    let correct = 0;
    TAX_KNOWLEDGE_QUESTIONS.forEach((q, idx) => {
      if (knowledgeAnswers[idx] === q.correctIndex) {
        correct++;
      }
    });
    return correct;
  }, [knowledgeAnswers, TAX_KNOWLEDGE_QUESTIONS]);

  // Derived Gamification Data (XP & Badges)
  const gamificationData = useMemo(() => {
    // 1. Core transactions points (50 XP each, cap 500)
    const transactionCount = activeEntity?.transactions?.length || 0;
    const txPoints = Math.min(500, transactionCount * 50);

    // 2. Invoices points (100 XP each, cap 500)
    const invoiceCount = activeEntity?.invoices?.length || 0;
    const invoicePoints = Math.min(500, invoiceCount * 100);

    // 3. FICA status points
    const ficaVerified = activeEntity?.profile?.ficaStatus === 'Verified';
    const ficaPoints = ficaVerified ? 500 : 0;

    // 4. Travel Logbook in vault points
    const hasLogbookInVault = vaultDocuments?.some(doc => doc.category === 'Travel Logbook') || false;
    const logbookPoints = hasLogbookInVault ? 400 : 0;

    // 5. VAT registration points
    const isVatRegistered = activeEntity?.profile?.vatRegistered || false;
    const vatPoints = isVatRegistered ? 300 : 0;

    // 6. Risk Quiz points
    const riskQuizPoints = quizSubmitted ? 300 : 0;

    // 7. Knowledge Quiz points (150 XP per correct, perfect score gets +250 XP bonus!)
    const quizBasePoints = knowledgeQuizCorrectCount * 150;
    const quizBonusPoints = (knowledgeQuizCorrectCount === 5 && knowledgeQuizSubmitted) ? 250 : 0;
    const quizPoints = quizBasePoints + quizBonusPoints;

    // 8. Proactive challenges points (250 XP each)
    const challengePoints = completedChallenges.length * 250;

    // Starting baseline of 500 XP to make sure users are already Level 1
    const totalXP = 500 + txPoints + invoicePoints + ficaPoints + logbookPoints + vatPoints + riskQuizPoints + quizPoints + challengePoints;

    // Level calculation
    // Level 1: 0 - 1000 XP ("Tax Rookie")
    // Level 2: 1000 - 2500 XP ("Compliance Scholar")
    // Level 3: 2500 - 4500 XP ("Audit-Proof Gladiator")
    // Level 4: 4500+ XP ("SME Tax Legend")
    let currentLevel = "Tax Rookie";
    let levelNum = 1;
    let xpNeededForNext = 1000;
    let xpInCurrentLevel = totalXP;
    let levelProgressPercentage = 0;

    if (totalXP >= 4500) {
      currentLevel = "SME Tax Legend";
      levelNum = 4;
      xpNeededForNext = 6000;
      xpInCurrentLevel = totalXP - 4500;
      levelProgressPercentage = Math.min(100, Math.round((xpInCurrentLevel / 1500) * 100));
    } else if (totalXP >= 2500) {
      currentLevel = "Audit-Proof Gladiator";
      levelNum = 3;
      xpNeededForNext = 4500;
      xpInCurrentLevel = totalXP - 2500;
      levelProgressPercentage = Math.round((xpInCurrentLevel / 2000) * 100);
    } else if (totalXP >= 1000) {
      currentLevel = "Compliance Scholar";
      levelNum = 2;
      xpNeededForNext = 2500;
      xpInCurrentLevel = totalXP - 1000;
      levelProgressPercentage = Math.round((xpInCurrentLevel / 1500) * 100);
    } else {
      currentLevel = "Tax Rookie";
      levelNum = 1;
      xpNeededForNext = 1000;
      xpInCurrentLevel = totalXP;
      levelProgressPercentage = Math.round((xpInCurrentLevel / 1000) * 100);
    }

    // Badges definitions with unlocked status
    const badges = [
      {
        id: "badge-fica",
        title: "FICA Guard",
        description: "Verify your legal identity and FICA status to secure your account data.",
        unlocked: ficaVerified,
        metric: ficaVerified ? "Verified" : "Pending Action",
        xpValue: 500,
        iconType: "shield"
      },
      {
        id: "badge-bookkeeper",
        title: "SME Bookkeeper",
        description: "Maintain a live ledger by logging business income or deductible expenses.",
        unlocked: transactionCount >= 5,
        metric: `${transactionCount}/5 logged`,
        xpValue: 250,
        iconType: "ledger"
      },
      {
        id: "badge-logbook",
        title: "Audit-Proof Navigator",
        description: "Record and sync a contemporaneous travel logbook containing odometer logs.",
        unlocked: hasLogbookInVault,
        metric: hasLogbookInVault ? "Logged & Synced" : "0/1 logged",
        xpValue: 400,
        iconType: "travel"
      },
      {
        id: "badge-solar",
        title: "Green Energy Pioneer",
        description: "Explore renewable deductions under Section 12BA in the simulation engine.",
        unlocked: completedChallenges.includes("solar"),
        metric: completedChallenges.includes("solar") ? "Unlocked & Modeled" : "Not started",
        xpValue: 250,
        iconType: "solar"
      },
      {
        id: "badge-scholar",
        title: "SA Tax Scholar",
        description: "Achieve a perfect 5/5 score on the South African Tax Law Knowledge Quiz.",
        unlocked: knowledgeQuizCorrectCount === 5 && knowledgeQuizSubmitted,
        metric: knowledgeQuizSubmitted ? `${knowledgeQuizCorrectCount}/5 score` : "Quiz not taken",
        xpValue: 250,
        iconType: "scholar"
      },
      {
        id: "badge-commander",
        title: "SME Team Commander",
        description: "Invite business accountants or bookkeepers to preserve clear audit trails.",
        unlocked: (activeEntity?.teamMembers?.length || 0) > 0,
        metric: `${activeEntity?.teamMembers?.length || 0}/1 active`,
        xpValue: 300,
        iconType: "team"
      }
    ];

    // Dynamic Leaderboard list
    const leaderboardRaw = [
      { name: "Melissa Coetzee (Indirect Tax SME)", xp: 4200, level: "SME Tax Legend", isUser: false },
      { name: "Sipho Ndlovu (Sole Proprietor)", xp: 3550, level: "Audit-Proof Gladiator", isUser: false },
      { name: `${activeProfileName} (YOU)`, xp: totalXP, level: currentLevel, isUser: true },
      { name: "Thandeka Mthembu (CA Partner)", xp: 2450, level: "Compliance Scholar", isUser: false },
      { name: "Amina Desai (Agri Solar SME)", xp: 1800, level: "Compliance Scholar", isUser: false },
      { name: "Devon Govender (Retail Sole Prop)", xp: 1200, level: "Compliance Scholar", isUser: false }
    ];

    const sortedLeaderboard = [...leaderboardRaw].sort((a, b) => b.xp - a.xp);
    const userRank = sortedLeaderboard.findIndex(p => p.isUser) + 1;

    return {
      txPoints,
      invoicePoints,
      ficaPoints,
      logbookPoints,
      vatPoints,
      riskQuizPoints,
      quizPoints,
      challengePoints,
      totalXP,
      currentLevel,
      levelNum,
      xpNeededForNext,
      xpInCurrentLevel,
      levelProgressPercentage,
      badges,
      sortedLeaderboard,
      userRank,
      transactionCount,
      invoiceCount,
      ficaVerified,
      hasLogbookInVault,
      isVatRegistered
    };
  }, [activeEntity, vaultDocuments, quizSubmitted, completedChallenges, knowledgeQuizCorrectCount, knowledgeQuizSubmitted, activeProfileName, TAX_KNOWLEDGE_QUESTIONS]);

  // Pre-Audit Checklist State
  const [checklistStates, setChecklistStates] = useState<Record<string, boolean>>({
    log_odometer: false,
    log_purpose: false,
    log_purchase_agree: false,
    office_exclusive: false,
    office_hours: false,
    office_letter: false,
    vat_supplier_num: false,
    vat_recipient_num: false,
    vat_invoice_word: false,
    vat_no_passenger: false,
    // VAT 201 specific checks
    vat201_standard_output: false,
    vat201_export_zero: false,
    vat201_exempt_goods: false,
    vat201_invoice_match: false,
    vat201_reconcile: false,
    // EMP 201 specific checks
    emp201_paye_tables: false,
    emp201_uif_limit: false,
    emp201_sdl_limit: false,
    emp201_pre7th_payment: false,
    emp201_emp501_reconcile: false
  });

  // Glossary search & filter
  const [glossarySearch, setGlossarySearch] = useState('');
  const [glossaryCategory, setGlossaryCategory] = useState<'all' | 'code' | 'act' | 'process'>('all');

  // ---------------------------------------------------------------------------
  // COMPUTED STATES & FILTERING
  // ---------------------------------------------------------------------------
  const filteredArticles = useMemo(() => {
    return ARTICLES.filter(art => {
      const matchesSearch = 
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.summary.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesAudience = selectedAudience === 'all' || (art.audiences && art.audiences.includes(selectedAudience));
      const matchesTopic = selectedTopic === 'all' || art.category === selectedTopic;

      return matchesSearch && matchesAudience && matchesTopic;
    });
  }, [searchQuery, selectedAudience, selectedTopic]);

  const filteredFaqs = useMemo(() => {
    return FAQS.filter(faq => {
      const matchesSearch = 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesAudience = selectedAudience === 'all' || (faq.audiences && faq.audiences.includes(selectedAudience));
      const matchesTopic = selectedTopic === 'all' || faq.category === selectedTopic;

      return matchesSearch && matchesAudience && matchesTopic;
    });
  }, [searchQuery, selectedAudience, selectedTopic]);

  const filteredVideos = useMemo(() => {
    return VIDEO_LESSONS.filter(vid => {
      const matchesSearch = 
        vid.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vid.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesAudience = selectedAudience === 'all' || (vid.audiences && vid.audiences.includes(selectedAudience));
      const matchesTopic = selectedTopic === 'all' || vid.category === selectedTopic;

      return matchesSearch && matchesAudience && matchesTopic;
    });
  }, [searchQuery, selectedAudience, selectedTopic]);

  const activeArticle = useMemo(() => {
    return ARTICLES.find(a => a.id === selectedArticleId) || ARTICLES[0];
  }, [selectedArticleId]);

  const activeVideo = useMemo(() => {
    return VIDEO_LESSONS.find(v => v.id === selectedVideoId) || VIDEO_LESSONS[0];
  }, [selectedVideoId]);

  // Video Time Simulation (Interval when playing)
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setVideoTime(prev => {
          if (prev >= 60) {
            setIsPlaying(false);
            showBanner("Simulated lecture completed! Check out the slides.");
            return 0;
          }
          return prev + 2; // advance faster for nicer visual feedback
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Active Video Slide based on simulated time
  const currentVideoSlide = useMemo(() => {
    const slides = activeVideo.slides;
    let current = slides[0];
    for (const slide of slides) {
      if (videoTime >= slide.time) {
        current = slide;
      }
    }
    return current;
  }, [activeVideo, videoTime]);

  // Active Transcript Caption
  const currentCaption = useMemo(() => {
    const transcripts = activeVideo.transcripts;
    let current = transcripts[0];
    for (const caption of transcripts) {
      if (videoTime >= caption.time) {
        current = caption;
      }
    }
    return current;
  }, [activeVideo, videoTime]);

  // ---------------------------------------------------------------------------
  // 2026 TAX CALCULATION LOGIC
  // ---------------------------------------------------------------------------
  const estimatedTaxCalculation = useMemo(() => {
    const inc = parseFloat(estIncome) || 0;
    const exp = parseFloat(estExpenses) || 0;
    const ra = parseFloat(estRetirement) || 0;

    // Net Profit/Taxable Income before RA deduction
    const grossProfit = Math.max(0, inc - exp);
    
    // RA Contribution is capped at 27.5% of taxable income or R350,000
    const raLimit = Math.min(350000, grossProfit * 0.275);
    const raDeduction = Math.min(ra, raLimit);

    const taxableIncome = Math.max(0, grossProfit - raDeduction);

    // SARS 2026 Tax Brackets (Marginal Rates)
    let grossTax = 0;
    if (taxableIncome <= 181900) {
      grossTax = taxableIncome * 0.18;
    } else if (taxableIncome <= 288150) {
      grossTax = 32742 + 0.26 * (taxableIncome - 181900);
    } else if (taxableIncome <= 399600) {
      grossTax = 60367 + 0.31 * (taxableIncome - 288150);
    } else if (taxableIncome <= 514300) {
      grossTax = 94917 + 0.36 * (taxableIncome - 399600);
    } else if (taxableIncome <= 673000) {
      grossTax = 136209 + 0.39 * (taxableIncome - 514300);
    } else if (taxableIncome <= 1813600) {
      grossTax = 198102 + 0.41 * (taxableIncome - 673000);
    } else {
      grossTax = 665748 + 0.45 * (taxableIncome - 1813600);
    }

    // 2026 Rebates
    let rebate = 17235; // Primary rebate for under 65
    if (ageGroup === 'over65') {
      rebate += 9444; // Secondary
    } else if (ageGroup === 'over75') {
      rebate += 9444 + 3145; // Secondary + Tertiary
    }

    // Final Net Normal Tax
    const normalTax = Math.max(0, grossTax - rebate);
    const effectiveRate = taxableIncome > 0 ? (normalTax / taxableIncome) * 100 : 0;

    return {
      grossProfit,
      raLimit,
      raDeduction,
      taxableIncome,
      grossTax,
      rebate,
      normalTax,
      effectiveRate
    };
  }, [estIncome, estExpenses, estRetirement, ageGroup]);

  // VAT 201 Calculator Memo
  const calculatedVat201 = useMemo(() => {
    const standardSales = parseFloat(vatOutputStandard) || 0;
    const zeroSales = parseFloat(vatOutputZero) || 0;
    const exemptSales = parseFloat(vatOutputExempt) || 0;
    const standardPurchases = parseFloat(vatInputStandard) || 0;
    const blockedPurchases = parseFloat(vatInputBlocked) || 0;

    const outputVat = standardSales * 0.15;
    const inputVat = standardPurchases * 0.15;
    const netVat = outputVat - inputVat;

    const hasRefund = netVat < 0;
    const absNetVat = Math.abs(netVat);

    return {
      standardSales,
      zeroSales,
      exemptSales,
      standardPurchases,
      blockedPurchases,
      outputVat,
      inputVat,
      netVat,
      hasRefund,
      absNetVat
    };
  }, [vatOutputStandard, vatOutputZero, vatOutputExempt, vatInputStandard, vatInputBlocked]);

  // EMP 201 Payroll Calculator Memo
  const calculatedEmp201 = useMemo(() => {
    const staffCount = parseInt(empCount) || 1;
    const grossPAYESalaries = parseFloat(empTotalSalaries) || 0;
    const uifSalariesAmount = parseFloat(empUifSalaries) || 0;
    const sdlSalariesAmount = parseFloat(empSdlSalaries) || 0;

    // Approximate monthly progressive PAYE withholding based on SARS tables
    const averageSalary = staffCount > 0 ? grossPAYESalaries / staffCount : 0;
    let estPAYE = 0;
    if (averageSalary <= 15000) {
      estPAYE = grossPAYESalaries * 0.15; // 15% effective average
    } else if (averageSalary <= 24000) {
      estPAYE = grossPAYESalaries * 0.19; // 19% effective average
    } else if (averageSalary <= 33000) {
      estPAYE = grossPAYESalaries * 0.25; // 25% effective average
    } else {
      estPAYE = grossPAYESalaries * 0.31; // 31% effective average
    }

    // UIF is capped at R17,712 per month per employee
    // Limit is 1% employer + 1% employee = 2% total
    const uifContributionEmployee = uifSalariesAmount * 0.01;
    const uifContributionEmployer = uifSalariesAmount * 0.01;
    const totalUif = uifContributionEmployee + uifContributionEmployer;

    // SDL (1% of payroll if payroll > R500,000 p.a.)
    const annualPayrollProjection = grossPAYESalaries * 12;
    const isSdlRegistered = annualPayrollProjection > 500000;
    const sdlAmount = isSdlRegistered ? sdlSalariesAmount * 0.01 : 0;

    const totalWithholdings = estPAYE + totalUif + sdlAmount;

    return {
      staffCount,
      grossPAYESalaries,
      uifSalariesAmount,
      sdlSalariesAmount,
      estPAYE,
      uifContributionEmployee,
      uifContributionEmployer,
      totalUif,
      isSdlRegistered,
      sdlAmount,
      totalWithholdings
    };
  }, [empCount, empTotalSalaries, empUifSalaries, empSdlSalaries]);

  // ---------------------------------------------------------------------------
  // INTERACTIVE FEEDBACK ACTIONS
  // ---------------------------------------------------------------------------
  const handleLikeArticle = (id: string) => {
    showBanner("Thank you! Your feedback helps us build better tax materials.");
  };

  const handleLikeVideo = (id: string) => {
    setVideoLikes(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
    showBanner("Video lesson upvoted! Added to your profile favorites.");
  };

  return (
    <div className="space-y-6" id="tax-literacy-hub">
      
      {/* HUB HERO HEADER */}
      <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 p-5 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider">
                  SARS Academy
                </span>
                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-mono font-bold px-2 py-0.5 rounded border border-indigo-500/20 uppercase tracking-wider">
                  FY2026 Ready
                </span>
              </div>
              <h3 className="font-bold text-base text-white mt-1 font-display">
                SME Tax Literacy & Compliance Hub
              </h3>
              <p className="text-xs text-white/60 mt-0.5 max-w-xl leading-relaxed">
                Empower your business with official statutory interpretations, bite-sized tutorials, pre-audit checklists, and South African tax rule definitions.
              </p>
            </div>
          </div>
          
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-xl text-center min-w-[120px]">
            <span className="text-[9px] text-emerald-300 block uppercase font-mono tracking-wider">Lector Profile</span>
            <span className="text-xs font-bold text-white font-mono">{activeProfileName}</span>
          </div>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 md:p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
            <input 
              type="text" 
              placeholder="Search tax articles, video terms, or FAQs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Audience Filter Badges */}
          <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto pb-1 md:pb-0">
            <span className="text-[10px] text-white/40 font-mono mr-1">Audience:</span>
            {(['all', 'individual', 'freelancer', 'small_business'] as AudienceType[]).map((aud) => (
              <button
                key={aud}
                onClick={() => setSelectedAudience(aud)}
                className={`py-1.5 px-3 rounded-lg text-[11px] font-mono font-bold transition-all border ${
                  selectedAudience === aud 
                    ? 'bg-emerald-500 text-slate-950 border-emerald-500 font-extrabold' 
                    : 'bg-white/5 text-white/60 border-transparent hover:border-white/10 hover:text-white'
                }`}
              >
                {aud === 'all' && 'All Types'}
                {aud === 'individual' && 'Individual'}
                {aud === 'freelancer' && 'Freelancer'}
                {aud === 'small_business' && 'Small Business'}
              </button>
            ))}
          </div>

        </div>

        {/* Topic Pills */}
        <div className="flex items-center gap-1.5 flex-wrap border-t border-white/5 pt-3.5">
          <span className="text-[10px] text-white/40 font-mono mr-1">Topic Group:</span>
          {(['all', 'provisional', 'deductions', 'capital_gains', 'vat'] as TopicCategory[]).map((top) => (
            <button
              key={top}
              onClick={() => setSelectedTopic(top)}
              className={`py-1 px-2.5 rounded-full text-[10px] font-mono transition-all flex items-center gap-1 border ${
                selectedTopic === top
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-bold'
                  : 'bg-white/5 text-white/50 border-transparent hover:text-white'
              }`}
            >
              <Tag className="w-2.5 h-2.5" />
              {top === 'all' && 'All Topics'}
              {top === 'provisional' && 'Provisional Tax'}
              {top === 'deductions' && 'Deductions (Sec 11a)'}
              {top === 'capital_gains' && 'Capital Gains'}
              {top === 'vat' && 'VAT Essentials'}
            </button>
          ))}
        </div>
      </div>

      {/* HUB SUB-TAB CONTROLS */}
      <div className="flex border-b border-white/10 gap-1.5 flex-wrap">
        {(['articles', 'videos', 'faqs', 'calculator', 'quiz', 'checklists', 'challenges', 'glossary'] as HubTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setSearchQuery('');
            }}
            className={`py-2 px-3 text-xs font-bold font-mono transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === tab
                ? 'border-emerald-500 text-emerald-400 font-extrabold'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            {tab === 'articles' && (
              <>
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                Guides & Articles
              </>
            )}
            {tab === 'videos' && (
              <>
                <Video className="w-3.5 h-3.5 text-indigo-400" />
                Explainer Videos
              </>
            )}
            {tab === 'faqs' && (
              <>
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                Common FAQs
              </>
            )}
            {tab === 'calculator' && (
              <>
                <Calculator className="w-3.5 h-3.5 text-teal-400" />
                Tax Calculator
              </>
            )}
            {tab === 'quiz' && (
              <>
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                Self-Audit Risk Quiz
              </>
            )}
            {tab === 'checklists' && (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-sky-400" />
                Pre-Audit Checklists
              </>
            )}
            {tab === 'challenges' && (
              <>
                <Trophy className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                Tax Challenges & Ranks
              </>
            )}
            {tab === 'glossary' && (
              <>
                <BookMarked className="w-3.5 h-3.5 text-yellow-400" />
                SARS Jargon Glossary
              </>
            )}
          </button>
        ))}
      </div>

      {/* MAIN WORKSPACE CONTENT */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: GUIDES & ARTICLES */}
          {activeTab === 'articles' && (
            <motion.div
              key="articles-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Left Column: Article List */}
              <div className="lg:col-span-5 space-y-3">
                <span className="text-[10px] text-white/40 uppercase font-mono font-bold block">
                  Available Reading Material ({filteredArticles.length})
                </span>
                
                {filteredArticles.length === 0 ? (
                  <div className="bg-white/5 p-6 rounded-2xl text-center text-white/40 text-xs font-mono">
                    No articles found matching filters.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                    {filteredArticles.map((art) => (
                      <button
                        key={art.id}
                        onClick={() => setSelectedArticleId(art.id)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-2 cursor-pointer ${
                          selectedArticleId === art.id
                            ? 'bg-emerald-500/10 border-emerald-500/30 shadow-md shadow-emerald-500/5'
                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2 w-full">
                          <span className="text-[9px] bg-indigo-500/10 text-indigo-300 font-mono px-1.5 py-0.5 rounded border border-indigo-500/20 uppercase font-bold">
                            {art.category}
                          </span>
                          <span className="text-[9px] text-white/40 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" /> {art.readTime}
                          </span>
                        </div>
                        
                        <div>
                          <h4 className={`text-xs font-bold font-display ${selectedArticleId === art.id ? 'text-emerald-300' : 'text-white'}`}>
                            {art.title}
                          </h4>
                          <p className="text-[10px] text-white/50 leading-normal mt-0.5 truncate">
                            {art.subtitle}
                          </p>
                        </div>
                        
                        <div className="flex gap-1.5 flex-wrap pt-0.5">
                          {art.audiences.map(aud => (
                            <span key={aud} className="text-[8px] bg-white/5 text-white/40 px-1 py-0.2 rounded font-mono uppercase">
                              {aud}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Full Reader Panel */}
              <div className="lg:col-span-7 bg-slate-900/30 border border-white/5 rounded-2xl p-5 md:p-6 space-y-5">
                {activeArticle ? (
                  <div className="space-y-5 text-xs">
                    
                    {/* Header Details */}
                    <div className="space-y-2 border-b border-white/5 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[9.5px] bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded font-bold uppercase border border-emerald-500/25">
                          Category: {activeArticle.category}
                        </span>
                        <span className="text-[10px] text-white/40 font-mono">
                          Published: {activeArticle.publishDate}
                        </span>
                      </div>
                      
                      <h3 className="text-base md:text-lg font-bold text-white font-display tracking-tight leading-tight">
                        {activeArticle.title}
                      </h3>
                      
                      <p className="text-[11.5px] text-white/70 italic font-sans font-medium leading-relaxed">
                        {activeArticle.subtitle}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-white/40 pt-1">
                        <span>By: <strong>{activeArticle.author.name}</strong> • <em>{activeArticle.author.role}</em></span>
                        <span className="font-mono">{activeArticle.readTime}</span>
                      </div>
                    </div>

                    {/* Article Content */}
                    <div className="space-y-3.5 leading-relaxed text-white/80 font-sans">
                      {activeArticle.content.map((para, idx) => (
                        <p key={idx}>{para}</p>
                      ))}
                    </div>

                    {/* SARS statutory citation reference */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-white/5 space-y-1.5">
                      <span className="text-[9px] text-emerald-400 font-mono font-bold uppercase tracking-widest flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" /> SARS Legal Citations
                      </span>
                      <ul className="list-disc pl-4 space-y-1 text-[10px] text-white/60 font-mono">
                        {activeArticle.sarsSections.map((sec, i) => (
                          <li key={i}>{sec}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Key takeaways */}
                    <div className="bg-indigo-950/20 p-4 rounded-xl border border-indigo-500/10 space-y-2">
                      <span className="text-[10px] text-indigo-300 font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" /> Key Compliance Takeaways
                      </span>
                      <ul className="space-y-1.5">
                        {activeArticle.keyTakeaways.map((takeaway, i) => (
                          <li key={i} className="text-[10.5px] text-white/70 flex items-start gap-1.5 font-sans">
                            <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                            <span>{takeaway}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-between items-center pt-3 border-t border-white/5">
                      <button 
                        onClick={() => handleLikeArticle(activeArticle.id)}
                        className="py-1.5 px-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-all flex items-center gap-1.5 font-mono cursor-pointer"
                      >
                        <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Helpful ({activeArticle.likes})</span>
                      </button>

                      <div className="text-[10px] text-white/40 font-mono">
                        South African Income Tax Act Code Compliant
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="text-center py-20 text-white/30 text-xs font-mono">
                    Select an article on the left to begin reading.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: EXPLAINER VIDEOS */}
          {activeTab === 'videos' && (
            <motion.div
              key="videos-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Left Side: Video Selection */}
              <div className="lg:col-span-4 space-y-3">
                <span className="text-[10px] text-white/40 uppercase font-mono font-bold block">
                  Interactive Masterclasses ({filteredVideos.length})
                </span>

                {filteredVideos.length === 0 ? (
                  <div className="bg-white/5 p-6 rounded-2xl text-center text-white/40 text-xs font-mono">
                    No videos found matching filters.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredVideos.map((vid) => (
                      <button
                        key={vid.id}
                        onClick={() => {
                          setSelectedVideoId(vid.id);
                          setVideoTime(0);
                          setIsPlaying(false);
                        }}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-2 cursor-pointer ${
                          selectedVideoId === vid.id
                            ? 'bg-indigo-500/10 border-indigo-500/30'
                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-1 w-full text-[9px] font-mono">
                          <span className="bg-emerald-500/10 text-emerald-300 px-1.5 rounded uppercase">
                            {vid.category}
                          </span>
                          <span className="text-white/40 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {vid.duration}
                          </span>
                        </div>

                        <div>
                          <h4 className={`text-xs font-bold font-display ${selectedVideoId === vid.id ? 'text-indigo-300' : 'text-white'}`}>
                            {vid.title}
                          </h4>
                          <p className="text-[9.5px] text-white/50 leading-normal mt-0.5 line-clamp-2">
                            {vid.description}
                          </p>
                        </div>

                        <div className="text-[9px] text-white/40 font-mono">
                          Instructor: <strong>{vid.instructor}</strong>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Side: Simulated Lecture Theatre */}
              <div className="lg:col-span-8 space-y-4">
                {activeVideo ? (
                  <div className="space-y-4">
                    
                    {/* SIMULATED VIDEO INTERACTIVE SCREEN */}
                    <div className="bg-black/80 rounded-2xl overflow-hidden border border-indigo-500/20 aspect-video flex flex-col justify-between relative p-4 group">
                      
                      {/* Video Scanlines or Ambient glow */}
                      <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/70 pointer-events-none z-0"></div>

                      {/* Video Top info bar */}
                      <div className="relative z-10 flex justify-between items-center text-[10px] font-mono bg-black/40 p-2 rounded-lg backdrop-blur-sm border border-white/5">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                          SARS Educational Feed: {activeVideo.instructor}
                        </span>
                        <span className="text-white/60">Duration: {activeVideo.duration}</span>
                      </div>

                      {/* INTERACTIVE VIDEO BOARD (SLIDES CHANGING AS PLAY PROGRESSES) */}
                      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
                        <div className="bg-slate-900/90 border border-indigo-500/30 w-full max-w-md rounded-xl p-4 shadow-xl flex flex-col gap-2.5 min-h-[140px] justify-center text-center">
                          <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest font-bold">
                            Interactive Class Slides • Chapter: {currentVideoSlide?.title}
                          </span>
                          <h4 className="text-white font-bold text-xs font-display">
                            {currentVideoSlide?.title}
                          </h4>
                          <ul className="space-y-1.5 inline-block text-left mx-auto">
                            {currentVideoSlide?.points.map((pt, i) => (
                              <li key={i} className="text-[10px] text-white/80 flex items-start gap-1.5">
                                <span className="text-emerald-400 font-bold">•</span>
                                <span>{pt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* AUDIO TRANSCRIPTION BANNER CAPTIONS */}
                      <div className="relative z-10 min-h-[36px] bg-black/60 border border-white/5 p-2 rounded-lg flex items-center justify-center text-center">
                        <p className="text-[10.5px] text-yellow-300 font-sans italic font-medium">
                          {isPlaying ? `"${currentCaption?.text || '...'}"` : '"Click Play to stream lecture narration transcripts"'}
                        </p>
                      </div>

                      {/* PLAYER CONTROLS */}
                      <div className="relative z-10 bg-black/80 p-3 rounded-xl border border-white/5 flex items-center justify-between gap-4 mt-2">
                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="p-1.5 bg-indigo-500 text-slate-950 hover:bg-indigo-400 rounded-lg cursor-pointer transition-all flex items-center gap-1 text-[11px] font-bold"
                        >
                          {isPlaying ? (
                            <>
                              <Pause className="w-3.5 h-3.5 fill-current" />
                              <span>Pause</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Play Class</span>
                            </>
                          )}
                        </button>

                        {/* Simulated timeline */}
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-[9px] font-mono text-white/40">0:{videoTime < 10 ? `0${videoTime}` : videoTime}</span>
                          <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden relative">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 absolute top-0 left-0 transition-all duration-300" 
                              style={{ width: `${(videoTime / 60) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-[9px] font-mono text-white/40">1:00</span>
                        </div>

                        {/* Volume/Full indicators */}
                        <div className="flex gap-2 text-white/40">
                          <Volume2 className="w-4 h-4 hover:text-white transition-colors cursor-pointer" />
                          <Maximize2 className="w-4 h-4 hover:text-white transition-colors cursor-pointer" />
                        </div>
                      </div>

                    </div>

                    {/* Class Details */}
                    <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 flex justify-between items-center gap-4">
                      <div className="space-y-1">
                        <h4 className="text-white font-bold text-xs">{activeVideo.title}</h4>
                        <p className="text-[10px] text-white/50">{activeVideo.description}</p>
                      </div>

                      <button
                        onClick={() => handleLikeVideo(activeVideo.id)}
                        className="py-1.5 px-3 bg-white/5 hover:bg-indigo-500/10 hover:border-indigo-500/20 text-white/70 hover:text-indigo-300 rounded-lg border border-transparent transition-all flex items-center gap-1.5 font-mono text-[10.5px] whitespace-nowrap cursor-pointer"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" /> Upvote Class ({videoLikes[activeVideo.id] || 0})
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="text-center py-20 text-white/30 text-xs font-mono">
                    Select a class on the left to begin learning.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 3: COMMON FAQS */}
          {activeTab === 'faqs' && (
            <motion.div
              key="faqs-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-white/40 uppercase font-mono font-bold block">
                  Frequently Asked Compliance Questions ({filteredFaqs.length})
                </span>
                <span className="text-[9.5px] text-indigo-300 bg-indigo-500/15 border border-indigo-500/25 px-2 rounded-lg font-mono">
                  Checked against Income Tax Act 1962
                </span>
              </div>

              {filteredFaqs.length === 0 ? (
                <div className="bg-white/5 p-8 rounded-2xl text-center text-white/40 text-xs font-mono">
                  No FAQs found matching filters or search query.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredFaqs.map((faq) => {
                    const isExpanded = expandedFaqId === faq.id;
                    return (
                      <div 
                        key={faq.id}
                        className="bg-slate-900/20 border border-white/5 rounded-xl overflow-hidden transition-all hover:bg-slate-900/40"
                      >
                        <button
                          onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                          className="w-full text-left p-4 flex justify-between items-center gap-4 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                            <span className="font-bold text-white text-xs">{faq.question}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] bg-white/5 text-white/40 px-1.5 py-0.2 rounded font-mono uppercase">
                              {faq.category}
                            </span>
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-white/40" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-white/40" />
                            )}
                          </div>
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              className="overflow-hidden border-t border-white/5 bg-black/20"
                            >
                              <div className="p-4 space-y-3 text-xs leading-relaxed text-white/70">
                                <p>{faq.answer}</p>
                                
                                {faq.sarsReference && (
                                  <div className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-400 bg-emerald-500/5 p-2 rounded-lg w-fit border border-emerald-500/10">
                                    <Award className="w-3.5 h-3.5" />
                                    <span>SARS Reference: <strong>{faq.sarsReference}</strong></span>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* REDIRECT BANNER TO CHAT */}
              <div className="bg-gradient-to-r from-emerald-500/10 via-indigo-500/15 to-transparent border border-indigo-500/20 p-4 rounded-xl flex items-center justify-between gap-4 mt-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                  <div>
                    <h5 className="font-bold text-xs text-white">Have a highly specific custom South African tax scenario?</h5>
                    <p className="text-[10.5px] text-white/50">Ask our Pocket AI Chat bot for real-time compliance suggestions and Rule 7 pre-audit citations.</p>
                  </div>
                </div>
                
                <span className="text-[9.5px] font-mono text-indigo-300 font-bold uppercase tracking-wider bg-indigo-500/20 px-2 py-1 rounded">
                  Use Pocket AI Chat
                </span>
              </div>
            </motion.div>
          )}

          {/* TAB 4: CALCULATOR */}
          {activeTab === 'calculator' && (
            <motion.div
              key="calc-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* SUB-TAB NAV FOR CALCULATORS */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5 gap-1 max-w-md">
                <button
                  onClick={() => setCalcSubTab('pit')}
                  className={`flex-1 py-2 text-center text-xs font-bold font-mono rounded-lg transition-all ${
                    calcSubTab === 'pit'
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  PIT (Income Tax)
                </button>
                <button
                  onClick={() => setCalcSubTab('vat201')}
                  className={`flex-1 py-2 text-center text-xs font-bold font-mono rounded-lg transition-all ${
                    calcSubTab === 'vat201'
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  VAT 201 Return
                </button>
                <button
                  onClick={() => setCalcSubTab('emp201')}
                  className={`flex-1 py-2 text-center text-xs font-bold font-mono rounded-lg transition-all ${
                    calcSubTab === 'emp201'
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  EMP 201 Payroll
                </button>
              </div>

              {calcSubTab === 'pit' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Form Side */}
                  <div className="lg:col-span-5 bg-white/5 border border-white/5 rounded-2xl p-4 md:p-5 space-y-4 font-mono text-xs">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Calculator className="w-4 h-4 text-teal-400" /> FY2026 Marginal Rate Estimator
                    </h4>
                    <p className="text-[11px] text-white/40 leading-normal">
                      Enter estimated full-year metrics to estimate marginal slabs, standard individual rebates, and retirement annuity optimizations.
                    </p>

                    <div className="space-y-3 pt-2">
                      <div className="space-y-1">
                        <label className="block text-[10px] text-white/40 uppercase">Estimated Annual Revenue / Salary (ZAR)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-white/40 font-bold">R</span>
                          <input 
                            type="number"
                            value={estIncome}
                            onChange={(e) => setEstIncome(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 pl-7 pr-3 text-white text-xs focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] text-white/40 uppercase">Estimated Annual Trade Expenses (ZAR)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-white/40 font-bold">R</span>
                          <input 
                            type="number"
                            value={estExpenses}
                            onChange={(e) => setEstExpenses(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 pl-7 pr-3 text-white text-xs focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <span className="text-[9px] text-white/40">Claims deductible under Section 11(a).</span>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] text-white/40 uppercase">Retirement Annuity (RA) Contributions (ZAR)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-white/40 font-bold">R</span>
                          <input 
                            type="number"
                            value={estRetirement}
                            onChange={(e) => setEstRetirement(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 pl-7 pr-3 text-white text-xs focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <span className="text-[9px] text-white/40">Deduction capped at 27.5% of income or R350k.</span>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] text-white/40 uppercase">Taxpayer Age Group (Rebate Tier)</label>
                        <select
                          value={ageGroup}
                          onChange={(e) => setAgeGroup(e.target.value as any)}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-emerald-500 h-[34px]"
                        >
                          <option value="under65">Under 65 Years (Primary Rebate only)</option>
                          <option value="over65">65 to 74 Years (Primary + Secondary)</option>
                          <option value="over75">75 Years and Older (Primary + Sec + Tertiary)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Result Side */}
                  <div className="lg:col-span-7 bg-slate-900/40 border border-white/5 rounded-2xl p-5 space-y-5">
                    <h4 className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-widest border-b border-white/5 pb-2">
                      Statutory Tax Breakdown (FY2026 Estimate)
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-950/40 p-3.5 rounded-xl border border-white/5">
                        <span className="text-[10px] text-white/40 block">Net Profit / Revenue</span>
                        <span className="text-sm font-bold text-white font-mono">{formatZAR(estimatedTaxCalculation.grossProfit)}</span>
                      </div>
                      
                      <div className="bg-slate-950/40 p-3.5 rounded-xl border border-white/5">
                        <span className="text-[10px] text-white/40 block">Taxable Income (Net)</span>
                        <span className="text-sm font-bold text-emerald-400 font-mono">{formatZAR(estimatedTaxCalculation.taxableIncome)}</span>
                      </div>
                    </div>

                    <div className="space-y-2.5 font-mono text-[11px] text-white/70">
                      <div className="flex justify-between items-center py-1 border-b border-white/5">
                        <span>Tax before Rebates (Slabs):</span>
                        <span className="text-white font-bold">{formatZAR(estimatedTaxCalculation.grossTax)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-white/5">
                        <span>SARS Rebates Applied ({ageGroup === 'under65' ? 'Primary' : 'Age enhanced'}):</span>
                        <span className="text-emerald-400">-{formatZAR(estimatedTaxCalculation.rebate)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-white/5">
                        <span>Retirement Annuity (RA) Deduction:</span>
                        <span className="text-emerald-300">-{formatZAR(estimatedTaxCalculation.raDeduction)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 text-xs font-bold text-white">
                        <span>Est. Final Normal Income Tax Due:</span>
                        <span className="text-amber-400 text-sm">{formatZAR(estimatedTaxCalculation.normalTax)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 text-[10px]">
                        <span>Effective Income Tax Rate:</span>
                        <span className="text-indigo-300 font-bold">{estimatedTaxCalculation.effectiveRate.toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl space-y-2">
                      <span className="text-[9px] text-emerald-400 font-mono font-bold uppercase tracking-widest flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" /> RA Tax Saving Tip
                      </span>
                      <p className="text-[10.5px] text-white/70 font-sans leading-relaxed">
                        By contributing up to your 27.5% threshold of <strong className="text-emerald-300">{formatZAR(estimatedTaxCalculation.raLimit)}</strong> into a registered South African Retirement Annuity, you directly drop your taxable income. Your current RA contribution of <strong className="text-indigo-300">{formatZAR(parseFloat(estRetirement) || 0)}</strong> saves you an estimated <strong className="text-emerald-300">{formatZAR((parseFloat(estRetirement) || 0) * 0.28)}</strong> in taxes!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {calcSubTab === 'vat201' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* VAT Input Form */}
                  <div className="lg:col-span-5 bg-white/5 border border-white/5 rounded-2xl p-4 md:p-5 space-y-4 font-mono text-xs">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Calculator className="w-4 h-4 text-emerald-400" /> VAT 201 Calculator (15%)
                    </h4>
                    <p className="text-[11px] text-white/40 leading-normal">
                      Input your bi-monthly ledger totals to calculate standard rate Output Tax liabilities and claimable Input Tax.
                    </p>

                    <div className="space-y-3 pt-2">
                      <div className="space-y-1">
                        <label className="block text-[10px] text-emerald-400 uppercase">Standard-Rated Sales (Exclusive)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-white/40 font-bold">R</span>
                          <input 
                            type="number"
                            value={vatOutputStandard}
                            onChange={(e) => setVatOutputStandard(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 pl-7 pr-3 text-white text-xs focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] text-indigo-300 uppercase">Zero-Rated Sales (Exports/Fuel)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-white/40 font-bold">R</span>
                          <input 
                            type="number"
                            value={vatOutputZero}
                            onChange={(e) => setVatOutputZero(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 pl-7 pr-3 text-white text-xs focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] text-white/40 uppercase">Exempt Sales (Rentals/Transport)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-white/40 font-bold">R</span>
                          <input 
                            type="number"
                            value={vatOutputExempt}
                            onChange={(e) => setVatOutputExempt(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 pl-7 pr-3 text-white text-xs focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] text-emerald-400 uppercase">Standard Purchases (Exclusive)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-white/40 font-bold">R</span>
                          <input 
                            type="number"
                            value={vatInputStandard}
                            onChange={(e) => setVatInputStandard(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 pl-7 pr-3 text-white text-xs focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] text-red-400 uppercase">Blocked Purchases (Sec 17(2))</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-white/40 font-bold">R</span>
                          <input 
                            type="number"
                            value={vatInputBlocked}
                            onChange={(e) => setVatInputBlocked(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 pl-7 pr-3 text-white text-xs focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <span className="text-[9px] text-red-400/80 leading-tight block mt-0.5">
                          Entertainment, passenger cars, staff meals (VAT cannot be claimed!).
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* VAT Results Side */}
                  <div className="lg:col-span-7 bg-slate-900/40 border border-white/5 rounded-2xl p-5 space-y-5">
                    <h4 className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-widest border-b border-white/5 pb-2">
                      VAT 201 Reconciliation & Submission Preview
                    </h4>

                    <div className="grid grid-cols-2 gap-4 font-mono">
                      <div className="bg-slate-950/40 p-3.5 rounded-xl border border-white/5">
                        <span className="text-[10px] text-indigo-300 block">Total Declared Sales</span>
                        <span className="text-xs font-bold text-white">{formatZAR(calculatedVat201.standardSales + calculatedVat201.zeroSales + calculatedVat201.exemptSales)}</span>
                      </div>
                      <div className="bg-slate-950/40 p-3.5 rounded-xl border border-white/5">
                        <span className="text-[10px] text-indigo-300 block">Total Purchases</span>
                        <span className="text-xs font-bold text-white">{formatZAR(calculatedVat201.standardPurchases + calculatedVat201.blockedPurchases)}</span>
                      </div>
                    </div>

                    <div className="space-y-2.5 font-mono text-[11px] text-white/70 border-b border-white/5 pb-3">
                      <div className="flex justify-between items-center">
                        <span>Output Tax (15% on {formatZAR(calculatedVat201.standardSales)}):</span>
                        <span className="text-white font-bold">{formatZAR(calculatedVat201.outputVat)}</span>
                      </div>
                      <div className="flex justify-between items-center text-white/50">
                        <span>Zero-Rated Sales (0% Output):</span>
                        <span>R0.00</span>
                      </div>
                      <div className="flex justify-between items-center text-white/50">
                        <span>Exempt Sales (No Output):</span>
                        <span>R0.00</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-white/5">
                        <span>Input Tax Claim (15% on {formatZAR(calculatedVat201.standardPurchases)}):</span>
                        <span className="text-emerald-400">-{formatZAR(calculatedVat201.inputVat)}</span>
                      </div>
                      <div className="flex justify-between items-center text-red-400/80">
                        <span>Blocked Input Tax (Entertainment/Cars):</span>
                        <span>R0.00 (Blocked)</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center font-mono py-2 text-xs font-bold text-white">
                      <span>{calculatedVat201.hasRefund ? 'Estimated Refund Due from SARS:' : 'Estimated VAT Liability Payable to SARS:'}</span>
                      <span className={`text-sm ${calculatedVat201.hasRefund ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {calculatedVat201.hasRefund ? '-' : ''}{formatZAR(calculatedVat201.absNetVat)}
                      </span>
                    </div>

                    {/* STATUTORY VERIFICATION WARNING */}
                    {calculatedVat201.hasRefund ? (
                      <div className="bg-amber-500/5 border border-amber-500/15 p-4 rounded-xl space-y-1.5">
                        <span className="text-[9px] text-amber-400 font-mono font-bold uppercase tracking-widest flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5" /> SARS Verification Trigger
                        </span>
                        <p className="text-[10.5px] text-white/70 font-sans leading-relaxed">
                          Your net VAT 201 position results in a <strong>refund of {formatZAR(calculatedVat201.absNetVat)}</strong>. SARS eFiling will automatically trigger a Verification Audit. Ensure your <strong>Audit-Ready Vault</strong> holds valid <em>"Tax Invoices"</em> containing both Supplier & Recipient VAT details to avoid write-backs.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl space-y-1.5">
                        <span className="text-[9px] text-emerald-400 font-mono font-bold uppercase tracking-widest flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Ready for eFiling Submission
                        </span>
                        <p className="text-[10.5px] text-white/70 font-sans leading-relaxed">
                          Standard VAT liabilities must be settled by the 25th of the month following the end of the VAT period (or the last business day of the month for eFiling). Always reconcile your VAT ledger before clicking submit.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {calcSubTab === 'emp201' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* EMP Input Form */}
                  <div className="lg:col-span-5 bg-white/5 border border-white/5 rounded-2xl p-4 md:p-5 space-y-4 font-mono text-xs">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Calculator className="w-4 h-4 text-pink-400" /> EMP 201 Payroll Estimator
                    </h4>
                    <p className="text-[11px] text-white/40 leading-normal">
                      Estimate monthly PAYE withholding, Unemployment Insurance (UIF), and Skills Development Levy (SDL) liabilities.
                    </p>

                    <div className="space-y-3 pt-2">
                      <div className="space-y-1">
                        <label className="block text-[10px] text-white/40 uppercase">Number of Active Employees</label>
                        <input 
                          type="number"
                          value={empCount}
                          onChange={(e) => setEmpCount(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] text-pink-400 uppercase">Total Taxable Salaries (PAYE subject)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-white/40 font-bold">R</span>
                          <input 
                            type="number"
                            value={empTotalSalaries}
                            onChange={(e) => setEmpTotalSalaries(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 pl-7 pr-3 text-white text-xs focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] text-emerald-400 uppercase">Salaries Subject to UIF (Capped)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-white/40 font-bold">R</span>
                          <input 
                            type="number"
                            value={empUifSalaries}
                            onChange={(e) => setEmpUifSalaries(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 pl-7 pr-3 text-white text-xs focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <span className="text-[9px] text-white/40 block leading-tight mt-0.5">
                          Capped at R17,712 per month per employee for the 1% deduction.
                        </span>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] text-indigo-300 uppercase">Salaries Subject to SDL (Levy)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-white/40 font-bold">R</span>
                          <input 
                            type="number"
                            value={empSdlSalaries}
                            onChange={(e) => setEmpSdlSalaries(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 pl-7 pr-3 text-white text-xs focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <span className="text-[9px] text-white/40 block leading-tight mt-0.5">
                          Only applicable if your annual payroll exceeds R500,000 p.a.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* EMP Results Side */}
                  <div className="lg:col-span-7 bg-slate-900/40 border border-white/5 rounded-2xl p-5 space-y-5">
                    <h4 className="text-xs font-bold text-pink-400 font-mono uppercase tracking-widest border-b border-white/5 pb-2">
                      EMP 201 Monthly Withholdings Breakdown
                    </h4>

                    <div className="grid grid-cols-3 gap-3 font-mono">
                      <div className="bg-slate-950/40 p-2.5 rounded-xl border border-white/5 text-center">
                        <span className="text-[9px] text-white/40 block">Est. PAYE</span>
                        <span className="text-xs font-bold text-white">{formatZAR(calculatedEmp201.estPAYE)}</span>
                      </div>
                      <div className="bg-slate-950/40 p-2.5 rounded-xl border border-white/5 text-center">
                        <span className="text-[9px] text-white/40 block">UIF Total (2%)</span>
                        <span className="text-xs font-bold text-white">{formatZAR(calculatedEmp201.totalUif)}</span>
                      </div>
                      <div className="bg-slate-950/40 p-2.5 rounded-xl border border-white/5 text-center">
                        <span className="text-[9px] text-white/40 block">SDL (1%)</span>
                        <span className="text-xs font-bold text-white">{formatZAR(calculatedEmp201.sdlAmount)}</span>
                      </div>
                    </div>

                    <div className="space-y-2.5 font-mono text-[11px] text-white/70 border-b border-white/5 pb-3">
                      <div className="flex justify-between items-center">
                        <span>Staff Count:</span>
                        <span className="text-white font-bold">{calculatedEmp201.staffCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Monthly PAYE Withheld:</span>
                        <span className="text-white font-bold">{formatZAR(calculatedEmp201.estPAYE)}</span>
                      </div>
                      <div className="flex justify-between items-center text-white/60 pl-3">
                        <span>Employee UIF (1% withheld):</span>
                        <span>{formatZAR(calculatedEmp201.uifContributionEmployee)}</span>
                      </div>
                      <div className="flex justify-between items-center text-white/60 pl-3">
                        <span>Employer UIF (1% contribution):</span>
                        <span>{formatZAR(calculatedEmp201.uifContributionEmployer)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Skills Development Levy (SDL):</span>
                        <span className={calculatedEmp201.isSdlRegistered ? 'text-white font-bold' : 'text-white/40'}>
                          {calculatedEmp201.isSdlRegistered ? formatZAR(calculatedEmp201.sdlAmount) : 'R0.00 (Below R500k limit)'}
                        </span>
                      </div>
                      <div className="text-[9.5px] text-indigo-300 pl-3 leading-none italic">
                        {calculatedEmp201.isSdlRegistered 
                          ? 'Payroll exceeds R500,000 p.a. SDL registration compulsory.' 
                          : `Payroll projection of ${formatZAR(calculatedEmp201.grossPAYESalaries * 12)} p.a. is exempt from SDL.`}
                      </div>
                    </div>

                    <div className="flex justify-between items-center font-mono py-1 text-xs font-bold text-white">
                      <span>Total Monthly EMP 201 Payment:</span>
                      <span className="text-sm text-pink-400">{formatZAR(calculatedEmp201.totalWithholdings)}</span>
                    </div>

                    <div className="bg-pink-500/5 border border-pink-500/10 p-4 rounded-xl space-y-1.5">
                      <span className="text-[9px] text-pink-400 font-mono font-bold uppercase tracking-widest flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Monthly Deadlines & Penalties
                      </span>
                      <p className="text-[10.5px] text-white/70 font-sans leading-relaxed">
                        EMP 201 submissions and full payments must reach SARS by the <strong>7th of every month</strong>. Failing to pay on time triggers an automatic, non-negotiable <strong>10% late-payment penalty</strong> plus daily compounding interest on the outstanding balance.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 5: SELF-AUDIT RISK QUIZ */}
          {activeTab === 'quiz' && (
            <motion.div
              key="quiz-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-white/5 rounded-2xl p-5 md:p-6 text-center max-w-3xl mx-auto space-y-4">
                <span className="text-[10px] font-mono text-pink-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-pink-400" /> SARS Compliance Health Check
                </span>
                <h3 className="text-base md:text-lg font-bold text-white font-display">
                  SARS Verification & Audit Risk Self-Assessment
                </h3>
                <p className="text-xs text-white/60 leading-relaxed max-w-xl mx-auto">
                  SARS audits and verification requests are at an all-time high. Answer these 5 quick questions based on actual South African tax legislation to assess your Audit Risk Profile.
                </p>
              </div>

              {!quizSubmitted ? (
                <div className="max-w-2xl mx-auto bg-slate-900/40 border border-white/5 rounded-2xl p-5 md:p-6 space-y-6">
                  
                  {/* Q1: Travel Logbook */}
                  <div className="space-y-3 pb-5 border-b border-white/5">
                    <div className="flex gap-3">
                      <span className="text-xs bg-indigo-500/10 text-indigo-300 font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">1</span>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-white">Do you keep a contemporaneous (daily) travel logbook?</h4>
                        <p className="text-[10.5px] text-white/50">Must record dates, specific business destinations, odometer start/end readings, and exact business mileage. Estimated logs are routinely disallowed.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 pl-9">
                      {(['yes', 'no'] as const).map(option => (
                        <button
                          key={option}
                          onClick={() => setQuizAnswers(prev => ({ ...prev, logbook: option }))}
                          className={`py-1.5 px-4 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                            quizAnswers.logbook === option
                              ? option === 'yes'
                                ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                                : 'bg-red-500 text-slate-950 border-red-500'
                              : 'bg-white/5 border-white/5 text-white/60 hover:border-white/10 hover:text-white'
                          }`}
                        >
                          {option === 'yes' ? 'Yes, daily logs' : 'No / Estimated'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Q2: Home Office Exclusive Use */}
                  <div className="space-y-3 pb-5 border-b border-white/5">
                    <div className="flex gap-3">
                      <span className="text-xs bg-indigo-500/10 text-indigo-300 font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">2</span>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-white">Is your Home Office located in an exclusively used separate room?</h4>
                        <p className="text-[10.5px] text-white/50">Under Section 23(g), the office space cannot have dual purposes (e.g. kid's playroom, dining area, or spare bedroom containing a bed).</p>
                      </div>
                    </div>
                    <div className="flex gap-3 pl-9">
                      {(['yes', 'no'] as const).map(option => (
                        <button
                          key={option}
                          onClick={() => setQuizAnswers(prev => ({ ...prev, exclusiveOffice: option }))}
                          className={`py-1.5 px-4 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                            quizAnswers.exclusiveOffice === option
                              ? option === 'yes'
                                ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                                : 'bg-red-500 text-slate-950 border-red-500'
                              : 'bg-white/5 border-white/5 text-white/60 hover:border-white/10 hover:text-white'
                          }`}
                        >
                          {option === 'yes' ? 'Yes, strictly exclusive' : 'No / Multipurpose room'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Q3: Signed Purchase Agreement */}
                  <div className="space-y-3 pb-5 border-b border-white/5">
                    <div className="flex gap-3">
                      <span className="text-xs bg-indigo-500/10 text-indigo-300 font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">3</span>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-white">Do you hold signed purchase/finance agreements for claimed vehicles?</h4>
                        <p className="text-[10.5px] text-white/50">SARS requires full transactional contracts confirming the vehicle cost price and ownership to substantiate Section 11(e) wear & tear allowances.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 pl-9">
                      {(['yes', 'no'] as const).map(option => (
                        <button
                          key={option}
                          onClick={() => setQuizAnswers(prev => ({ ...prev, purchaseAgreement: option }))}
                          className={`py-1.5 px-4 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                            quizAnswers.purchaseAgreement === option
                              ? option === 'yes'
                                ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                                : 'bg-red-500 text-slate-950 border-red-500'
                              : 'bg-white/5 border-white/5 text-white/60 hover:border-white/10 hover:text-white'
                          }`}
                        >
                          {option === 'yes' ? 'Yes, have signed documents' : 'No / Missing contracts'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Q4: Provisional Underestimation */}
                  <div className="space-y-3 pb-5 border-b border-white/5">
                    <div className="flex gap-3">
                      <span className="text-xs bg-indigo-500/10 text-indigo-300 font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">4</span>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-white">Are your 2nd Period Provisional Tax estimates consistently within 90% of actual tax?</h4>
                        <p className="text-[10.5px] text-white/50">Under Section 20 of TAA, underestimating taxable income below 90% (or 80% if income &gt; R1m) triggers an automatic 20% underestimation penalty.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 pl-9">
                      {(['yes', 'no'] as const).map(option => (
                        <button
                          key={option}
                          onClick={() => setQuizAnswers(prev => ({ ...prev, provisionalEstimate: option }))}
                          className={`py-1.5 px-4 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                            quizAnswers.provisionalEstimate === option
                              ? option === 'yes'
                                ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                                : 'bg-red-500 text-slate-950 border-red-500'
                              : 'bg-white/5 border-white/5 text-white/60 hover:border-white/10 hover:text-white'
                          }`}
                        >
                          {option === 'yes' ? 'Yes, strictly monitored' : 'No / Highly estimated'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Q5: VAT Supplier Invoices */}
                  <div className="space-y-3 pb-4">
                    <div className="flex gap-3">
                      <span className="text-xs bg-indigo-500/10 text-indigo-300 font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">5</span>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-white">Do your business purchase tax invoices above R5,000 list both business VAT details?</h4>
                        <p className="text-[10.5px] text-white/50">SARS legislation is strict: invoices must declare both the buyer's and supplier's legal names, physical addresses, and VAT numbers. Receipt slips are insufficient.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 pl-9">
                      {(['yes', 'no'] as const).map(option => (
                        <button
                          key={option}
                          onClick={() => setQuizAnswers(prev => ({ ...prev, vatInvoices: option }))}
                          className={`py-1.5 px-4 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                            quizAnswers.vatInvoices === option
                              ? option === 'yes'
                                ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                                : 'bg-red-500 text-slate-950 border-red-500'
                              : 'bg-white/5 border-white/5 text-white/60 hover:border-white/10 hover:text-white'
                          }`}
                        >
                          {option === 'yes' ? 'Yes, fully compliant' : 'No / Some are basic slips'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 border-t border-white/5 flex justify-end">
                    <button
                      onClick={() => {
                        // Check if all answered
                        const unanswered = Object.values(quizAnswers).some(val => val === null);
                        if (unanswered) {
                          showBanner("Please answer all 5 compliance questions to view your report.");
                        } else {
                          setQuizSubmitted(true);
                          showBanner("SARS Compliance Audit Risk report compiled successfully.");
                        }
                      }}
                      className="py-2.5 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs rounded-xl shadow-lg shadow-emerald-500/10 cursor-pointer flex items-center gap-1.5 transition-all"
                    >
                      <span>Analyze Audit Risk Level</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              ) : (
                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Results Dashboard Card */}
                  {(() => {
                    const noCount = Object.values(quizAnswers).filter(ans => ans === 'no').length;
                    let riskLevel: 'LOW' | 'MODERATE' | 'EXTREME' = 'LOW';
                    let riskColor = 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
                    let bgProgress = 'bg-emerald-500';
                    let description = '';

                    if (noCount >= 3) {
                      riskLevel = 'EXTREME';
                      riskColor = 'text-red-400 border-red-500/20 bg-red-500/5';
                      bgProgress = 'bg-red-500';
                      description = 'Your profile presents standard SARS vulnerabilities. Critical documents are missing, leaving your business exposed to immediate claim write-backs or audits.';
                    } else if (noCount > 0) {
                      riskLevel = 'MODERATE';
                      riskColor = 'text-amber-400 border-amber-500/20 bg-amber-500/5';
                      bgProgress = 'bg-amber-500';
                      description = 'You have healthy compliance foundations but exhibit vulnerable areas that SARS verification officers target during standard audits.';
                    } else {
                      riskLevel = 'LOW';
                      riskColor = 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
                      bgProgress = 'bg-emerald-500';
                      description = 'Outstanding! Your evidence collection and record-keeping perfectly align with SARS best practices and the Tax Administration Act.';
                    }

                    return (
                      <div className="space-y-6">
                        <div className={`border p-6 rounded-2xl ${riskColor} text-center space-y-3`}>
                          <span className="text-[10px] font-mono tracking-widest font-extrabold uppercase block">Calculated SARS Risk Profile</span>
                          <span className="text-2xl md:text-3xl font-display font-extrabold block tracking-tight">{riskLevel} RISK</span>
                          <p className="text-xs text-white/70 max-w-lg mx-auto leading-relaxed">{description}</p>
                          
                          {/* Compliance Progress Bar */}
                          <div className="space-y-1.5 pt-3 max-w-sm mx-auto">
                            <div className="flex justify-between text-[9px] font-mono text-white/50">
                              <span>Audit Preparedness Score:</span>
                              <span className="text-white font-bold">{Math.round(((5 - noCount) / 5) * 100)}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                              <div className={`h-full ${bgProgress} transition-all duration-1000`} style={{ width: `${((5 - noCount) / 5) * 100}%` }}></div>
                            </div>
                          </div>
                        </div>

                        {/* Remediation Cards */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-white font-mono uppercase tracking-widest border-b border-white/5 pb-2">Targeted Remediation & Legal Protocols</h4>
                          
                          {quizAnswers.logbook === 'no' && (
                            <div className="bg-slate-900/50 border border-white/5 p-4 rounded-xl flex gap-3 text-left">
                              <span className="text-xs text-red-400 shrink-0 font-bold shrink-0 mt-0.5">•</span>
                              <div className="space-y-1">
                                <h5 className="text-xs font-bold text-white">Action Required: Travel Logbook (Source Code 4015)</h5>
                                <p className="text-[10.5px] text-white/60 leading-normal">SARS routinely issues ITA34 Assessments reducing travel deductions to R0 when a logbook is absent. Immediately start logging with odometer readings (e.g., Logbook ID #789) to defend Section 11(a) claims.</p>
                              </div>
                            </div>
                          )}

                          {quizAnswers.exclusiveOffice === 'no' && (
                            <div className="bg-slate-900/50 border border-white/5 p-4 rounded-xl flex gap-3 text-left">
                              <span className="text-xs text-red-400 shrink-0 font-bold shrink-0 mt-0.5">•</span>
                              <div className="space-y-1">
                                <h5 className="text-xs font-bold text-white">Action Required: Exclusive Home Office Workspace</h5>
                                <p className="text-[10.5px] text-white/60 leading-normal">Section 23(g) prohibits home expense deductions unless the office is strictly designated for trade only. If audited, you must submit photos showing a separate desk, chair, and dedicated layout without non-trade furniture.</p>
                              </div>
                            </div>
                          )}

                          {quizAnswers.purchaseAgreement === 'no' && (
                            <div className="bg-slate-900/50 border border-white/5 p-4 rounded-xl flex gap-3 text-left">
                              <span className="text-xs text-red-400 shrink-0 font-bold shrink-0 mt-0.5">•</span>
                              <div className="space-y-1">
                                <h5 className="text-xs font-bold text-white">Action Required: Collect Signed Finance & Purchase Agreements</h5>
                                <p className="text-[10.5px] text-white/60 leading-normal">Always keep signed vehicle installment sale agreements or lease contracts in your <strong>Audit-Ready Vault</strong>. A tax invoice alone fails to prove purchase structure during a legal objection (Rule 7, ADR1).</p>
                              </div>
                            </div>
                          )}

                          {quizAnswers.provisionalEstimate === 'no' && (
                            <div className="bg-slate-900/50 border border-white/5 p-4 rounded-xl flex gap-3 text-left">
                              <span className="text-xs text-red-400 shrink-0 font-bold shrink-0 mt-0.5">•</span>
                              <div className="space-y-1">
                                <h5 className="text-xs font-bold text-white">Action Required: Monitor 2nd Provisional Estimates</h5>
                                <p className="text-[10.5px] text-white/60 leading-normal">The second period Provisional return (IRP6) has a statutory estimation target. If your estimates deviate by &gt;10% of final taxable income, SARS automatically implements underestimation charges under Paragraph 20.</p>
                              </div>
                            </div>
                          )}

                          {quizAnswers.vatInvoices === 'no' && (
                            <div className="bg-slate-900/50 border border-white/5 p-4 rounded-xl flex gap-3 text-left">
                              <span className="text-xs text-red-400 shrink-0 font-bold shrink-0 mt-0.5">•</span>
                              <div className="space-y-1">
                                <h5 className="text-xs font-bold text-white">Action Required: Demand Compliant Tax Invoices</h5>
                                <p className="text-[10.5px] text-white/60 leading-normal">Ensure all business vendors issue full Tax Invoices listing your exact business VAT details for expenses &gt; R5,000. Basic retail cash register slips will be rejected, resulting in SARS writing back your Input VAT.</p>
                              </div>
                            </div>
                          )}

                          {/* GENERAL AUDIT DEFENSE NOTICE */}
                          <div className="bg-indigo-950/20 border border-indigo-500/15 p-4 rounded-xl space-y-2 text-left">
                            <span className="text-[9.5px] text-indigo-300 font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                              <Award className="w-3.5 h-3.5" /> SARS Rule 7 Objection Guidance
                            </span>
                            <p className="text-[10.5px] text-white/70 font-sans leading-relaxed">
                              If SARS has already disallowed your travel claims or issued an unfair assessment, you have <strong>80 business days</strong> from the ITA34 date to lodge a formal Rule 7 legal objection (Form ADR1). Ensure your <strong>Audit-Ready Vault</strong> contains a contemporaneous logbook and signed vehicle purchase agreement before lodging the objection.
                            </p>
                          </div>
                        </div>

                        {/* Reset Button */}
                        <div className="flex justify-center pt-2">
                          <button
                            onClick={() => {
                              setQuizAnswers({
                                logbook: null,
                                exclusiveOffice: null,
                                vatInvoices: null,
                                provisionalEstimate: null,
                                purchaseAgreement: null
                              });
                              setQuizSubmitted(false);
                            }}
                            className="py-1.5 px-4 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-lg transition-all text-[11px] font-mono cursor-pointer"
                          >
                            Retake Self-Assessment
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 6: PRE-AUDIT CHECKLISTS */}
          {activeTab === 'checklists' && (
            <motion.div
              key="checklists-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 md:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white font-display">Statutory Audit-Proof Verification Checklists</h3>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  Toggle the specific audit proof items you currently possess in your <strong>Audit-Ready Vault</strong>. Achieve a 100% prepared score to guarantee your claims withstand formal SARS verification checks.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Travel Allowances */}
                <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-4 space-y-3.5">
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-widest block">Section 11(a)</span>
                    <h4 className="text-xs font-bold text-white font-display">Travel Claims Proofing</h4>
                  </div>
                  <div className="space-y-3">
                    {[
                      { id: 'log_odometer', label: 'Logbook with start & end odometer readings for each trip' },
                      { id: 'log_purpose', label: 'Detailed physical address & explicit business description for every log' },
                      { id: 'log_purchase_agree', label: 'Signed vehicle purchase agreement indicating cost price' },
                    ].map(item => (
                      <label key={item.id} className="flex gap-2.5 items-start cursor-pointer group text-left">
                        <input
                          type="checkbox"
                          checked={checklistStates[item.id] || false}
                          onChange={(e) => setChecklistStates(prev => ({ ...prev, [item.id]: e.target.checked }))}
                          className="mt-0.5 rounded border-white/10 bg-slate-950 text-emerald-500 focus:ring-emerald-500/30"
                        />
                        <span className="text-[11px] text-white/70 group-hover:text-white transition-colors leading-snug">
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Home Office */}
                <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-4 space-y-3.5">
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-widest block">Section 23(g)</span>
                    <h4 className="text-xs font-bold text-white font-display">Home Office Proofing</h4>
                  </div>
                  <div className="space-y-3">
                    {[
                      { id: 'office_exclusive', label: 'Photographic evidence showing exclusive desk and layout' },
                      { id: 'office_hours', label: 'Calculated ratio of office floor area to full house area' },
                      { id: 'office_letter', label: 'Signed letter from employer authorizing work-from-home' },
                    ].map(item => (
                      <label key={item.id} className="flex gap-2.5 items-start cursor-pointer group text-left">
                        <input
                          type="checkbox"
                          checked={checklistStates[item.id] || false}
                          onChange={(e) => setChecklistStates(prev => ({ ...prev, [item.id]: e.target.checked }))}
                          className="mt-0.5 rounded border-white/10 bg-slate-950 text-emerald-500 focus:ring-emerald-500/30"
                        />
                        <span className="text-[11px] text-white/70 group-hover:text-white transition-colors leading-snug">
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* VAT & Corporate */}
                <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-4 space-y-3.5">
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-[10px] text-amber-400 font-mono font-bold uppercase tracking-widest block">SME VAT Act</span>
                    <h4 className="text-xs font-bold text-white font-display">VAT Invoices Proofing</h4>
                  </div>
                  <div className="space-y-3">
                    {[
                      { id: 'vat_supplier_num', label: 'Supplier VAT registration number printed on invoice' },
                      { id: 'vat_recipient_num', label: 'Your business legal name and VAT registration for claims > R5,000' },
                      { id: 'vat_invoice_word', label: 'The words "TAX INVOICE" explicitly highlighted' },
                      { id: 'vat_no_passenger', label: 'Ensured zero Input claims on passenger vehicles & staff lunch' },
                    ].map(item => (
                      <label key={item.id} className="flex gap-2.5 items-start cursor-pointer group text-left">
                        <input
                          type="checkbox"
                          checked={checklistStates[item.id] || false}
                          onChange={(e) => setChecklistStates(prev => ({ ...prev, [item.id]: e.target.checked }))}
                          className="mt-0.5 rounded border-white/10 bg-slate-950 text-emerald-500 focus:ring-emerald-500/30"
                        />
                        <span className="text-[11px] text-white/70 group-hover:text-white transition-colors leading-snug">
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* VAT 201 Filing Checklist */}
                <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-4 space-y-3.5">
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-widest block">Form VAT 201</span>
                    <h4 className="text-xs font-bold text-white font-display">VAT 201 Pre-Filing Checklist</h4>
                  </div>
                  <div className="space-y-3">
                    {[
                      { id: 'vat201_standard_output', label: 'Standard output tax (15%) reconciled against sales ledger' },
                      { id: 'vat201_export_zero', label: 'Zero-rated sales (0%) supported by direct export shipping documents' },
                      { id: 'vat201_exempt_goods', label: 'Exempt items verified (no input tax claimed on exempt supplies)' },
                      { id: 'vat201_invoice_match', label: 'Supplier tax invoices checked for 5-year claiming window (Sec 16(2))' },
                      { id: 'vat201_reconcile', label: 'Reconciled eFiling VAT 201 with trial balance prior to final click' },
                    ].map(item => (
                      <label key={item.id} className="flex gap-2.5 items-start cursor-pointer group text-left">
                        <input
                          type="checkbox"
                          checked={checklistStates[item.id] || false}
                          onChange={(e) => setChecklistStates(prev => ({ ...prev, [item.id]: e.target.checked }))}
                          className="mt-0.5 rounded border-white/10 bg-slate-950 text-emerald-500 focus:ring-emerald-500/30"
                        />
                        <span className="text-[11px] text-white/70 group-hover:text-white transition-colors leading-snug">
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* EMP 201 Payroll Filing Checklist */}
                <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-4 space-y-3.5">
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-[10px] text-pink-400 font-mono font-bold uppercase tracking-widest block">Form EMP 201</span>
                    <h4 className="text-xs font-bold text-white font-display">EMP 201 Payroll Checklist</h4>
                  </div>
                  <div className="space-y-3">
                    {[
                      { id: 'emp201_paye_tables', label: 'PAYE withholdings verified against official SARS tax tables' },
                      { id: 'emp201_uif_limit', label: 'UIF (1% employee + 1% employer) capped at statutory monthly limit' },
                      { id: 'emp201_sdl_limit', label: 'SDL (1%) calculated on gross pay if total payroll > R500k p.a.' },
                      { id: 'emp201_pre7th_payment', label: 'Payment processed and verified before strict 7th monthly deadline' },
                      { id: 'emp201_emp501_reconcile', label: 'Irp5 payroll runs backed up for bi-annual EMP501 submissions' },
                    ].map(item => (
                      <label key={item.id} className="flex gap-2.5 items-start cursor-pointer group text-left">
                        <input
                          type="checkbox"
                          checked={checklistStates[item.id] || false}
                          onChange={(e) => setChecklistStates(prev => ({ ...prev, [item.id]: e.target.checked }))}
                          className="mt-0.5 rounded border-white/10 bg-slate-950 text-emerald-500 focus:ring-emerald-500/30"
                        />
                        <span className="text-[11px] text-white/70 group-hover:text-white transition-colors leading-snug">
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>

              {/* Progress Summary Card */}
              {(() => {
                const totalItems = 20;
                const checkedCount = Object.values(checklistStates).filter(v => v).length;
                const percentage = Math.round((checkedCount / totalItems) * 100);
                
                return (
                  <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="space-y-1 text-center md:text-left">
                      <h4 className="text-xs font-bold text-white">Your Audit & Filing Readiness Indicator</h4>
                      <p className="text-[10.5px] text-white/50">You have verified {checkedCount} of {totalItems} statutory compliance items.</p>
                    </div>

                    <div className="w-full md:w-64 space-y-1.5 font-mono text-xs">
                      <div className="flex justify-between text-[10px]">
                        <span>Compliance Readiness Score:</span>
                        <span className="text-emerald-400 font-bold">{percentage}%</span>
                      </div>
                      <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300" style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}

          {/* TAB: SOUTH AFRICAN TAX CHALLENGES & GAMIFICATION */}
          {activeTab === 'challenges' && (
            <motion.div
              key="challenges-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* GAMIFIED STATS SUMMARY PANEL */}
              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 md:p-6 relative overflow-hidden text-left">
                {/* Background decorative glowing effect */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 z-10 relative">
                  
                  {/* Left stats: Level and Streak */}
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 shrink-0 relative">
                      <Trophy className="w-7 h-7" />
                      <div className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-[9px] font-mono font-bold text-white px-1.5 py-0.5 rounded-full border border-indigo-400">
                        Lvl {gamificationData.levelNum}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white/40 uppercase font-mono tracking-widest block font-bold">Tax Compliance Status</span>
                        <span className="flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-500/30 font-bold">
                          <Flame className="w-3 h-3 text-amber-400 animate-pulse" />
                          {streakCount} Day Streak
                        </span>
                      </div>
                      <h4 className="text-lg font-extrabold text-white font-display flex items-center gap-2">
                        {gamificationData.currentLevel}
                      </h4>
                      <p className="text-xs text-white/50 leading-relaxed">
                        Earn XP by performing compliance checkups, filing on time, or taking quizzes.
                      </p>
                    </div>
                  </div>

                  {/* XP Progress Bar */}
                  <div className="w-full lg:w-96 space-y-2 text-left">
                    <div className="flex justify-between items-baseline text-xs font-mono">
                      <span className="text-white/40">Level Progress:</span>
                      <span className="text-emerald-400 font-bold">
                        {gamificationData.totalXP} <span className="text-white/30 text-[10px]">/ {gamificationData.xpNeededForNext || 6000} XP</span>
                      </span>
                    </div>

                    <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-white/5 p-[1px]">
                      <div 
                        className="h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-amber-400 rounded-full transition-all duration-500" 
                        style={{ width: `${gamificationData.levelProgressPercentage}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-[9px] text-white/30 font-mono">
                      <span>{gamificationData.levelNum === 4 ? "Max Level Achieved" : `Level ${gamificationData.levelNum}`}</span>
                      <span>{gamificationData.levelNum === 4 ? "Keep tracking compliance!" : `${100 - gamificationData.levelProgressPercentage}% to Next Level`}</span>
                    </div>
                  </div>

                </div>

                {/* Score breakdown metrics row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/5">
                  <div className="bg-slate-950/40 p-2.5 rounded-xl border border-white/5 text-center">
                    <span className="text-[10px] text-white/30 block font-mono">Ledger XP</span>
                    <span className="text-xs font-bold text-teal-400 font-mono">+{gamificationData.txPoints} XP</span>
                  </div>
                  <div className="bg-slate-950/40 p-2.5 rounded-xl border border-white/5 text-center">
                    <span className="text-[10px] text-white/30 block font-mono">Vault & FICA XP</span>
                    <span className="text-xs font-bold text-sky-400 font-mono">+{gamificationData.ficaPoints + gamificationData.logbookPoints} XP</span>
                  </div>
                  <div className="bg-slate-950/40 p-2.5 rounded-xl border border-white/5 text-center">
                    <span className="text-[10px] text-white/30 block font-mono">Quizzes Score</span>
                    <span className="text-xs font-bold text-pink-400 font-mono">+{gamificationData.quizPoints + gamificationData.riskQuizPoints} XP</span>
                  </div>
                  <div className="bg-slate-950/40 p-2.5 rounded-xl border border-white/5 text-center">
                    <span className="text-[10px] text-white/30 block font-mono">Global Rank</span>
                    <span className="text-xs font-bold text-amber-400 font-mono">#{gamificationData.userRank} of 6</span>
                  </div>
                </div>

              </div>

              {/* TWO COLUMN CONTENT LAYOUT */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
                
                {/* LEFT COLUMN: LEADERBOARD & QUIZ */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* 1. DYNAMIC LEADERBOARD */}
                  <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">SARS eFiling League</h4>
                      </div>
                      <span className="text-[9px] text-white/40 font-mono">Refreshed in Real-Time</span>
                    </div>

                    <div className="space-y-2">
                      {gamificationData.sortedLeaderboard.map((player, idx) => (
                        <div 
                          key={player.name}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                            player.isUser 
                              ? 'bg-emerald-500/10 border-emerald-500/30 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/20' 
                              : 'bg-white/5 border-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Rank indicator */}
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${
                              idx === 0 ? 'bg-amber-500 text-slate-950' :
                              idx === 1 ? 'bg-slate-300 text-slate-950' :
                              idx === 2 ? 'bg-amber-700 text-white' : 'bg-white/10 text-white/50'
                            }`}>
                              {idx + 1}
                            </span>
                            <div className="space-y-0.5 text-left">
                              <span className={`text-[11px] block font-medium ${player.isUser ? 'text-emerald-400 font-bold' : 'text-white/80'}`}>
                                {player.name}
                              </span>
                              <span className="text-[9px] text-white/40 font-mono font-semibold uppercase tracking-wider">{player.level}</span>
                            </div>
                          </div>

                          <span className={`text-xs font-bold font-mono ${player.isUser ? 'text-emerald-400' : 'text-white/70'}`}>
                            {player.xp} XP
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. INTERACTIVE SOUTH AFRICAN TAX KNOWLEDGE QUIZ */}
                  <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 space-y-4 text-left">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-pink-400" />
                        <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">SARS Academy Compliance Challenge</h4>
                      </div>
                      <span className="text-[10px] bg-pink-500/20 text-pink-300 font-mono px-2 py-0.5 rounded border border-pink-500/20 font-bold">
                        +150 XP Per Question
                      </span>
                    </div>

                    {!knowledgeQuizSubmitted ? (
                      <div className="space-y-5">
                        <p className="text-xs text-white/60 leading-relaxed">
                          Test your knowledge of South African tax law for individuals, self-employed freelancers, and small businesses. Score a perfect <strong>5/5</strong> to unlock the <strong>SA Tax Scholar Badge (+250 XP bonus!)</strong>.
                        </p>

                        <div className="space-y-5">
                          {TAX_KNOWLEDGE_QUESTIONS.map((q, idx) => (
                            <div key={q.id} className="bg-slate-950/40 border border-white/5 p-4 rounded-xl space-y-3">
                              <div className="flex gap-2 items-start">
                                <span className="text-[10px] font-mono bg-white/10 text-white/60 px-1.5 py-0.5 rounded shrink-0">Q{q.id}</span>
                                <h5 className="text-[11.5px] font-bold text-white leading-relaxed">{q.question}</h5>
                              </div>

                              <div className="grid grid-cols-1 gap-2 pl-7">
                                {q.options.map((opt, optIdx) => (
                                  <button
                                    key={optIdx}
                                    onClick={() => setKnowledgeAnswers(prev => ({ ...prev, [idx]: optIdx }))}
                                    className={`w-full text-left p-2.5 rounded-lg border text-[11px] font-sans transition-all cursor-pointer ${
                                      knowledgeAnswers[idx] === optIdx
                                        ? 'bg-pink-500/10 border-pink-500/40 text-pink-300 font-semibold shadow'
                                        : 'bg-white/5 border-transparent text-white/70 hover:bg-white/10'
                                    }`}
                                  >
                                    <span className="inline-block w-4 h-4 rounded-full border border-current text-center text-[9px] font-bold font-mono mr-2 leading-3.5">
                                      {String.fromCharCode(65 + optIdx)}
                                    </span>
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => {
                            if (Object.keys(knowledgeAnswers).length < 5) {
                              showBanner("Please answer all 5 statutory questions before submitting!");
                              return;
                            }
                            setKnowledgeQuizSubmitted(true);
                            if (knowledgeQuizCorrectCount === 5) {
                              showBanner("Perfect 5/5 score! Unlocked 'SA Tax Scholar' Badge + 1,000 Total XP!");
                            } else {
                              showBanner(`Submitted! You scored ${knowledgeQuizCorrectCount}/5. Review explanations below.`);
                            }
                          }}
                          className="w-full bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Submit Answers & Claim XP
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div className="bg-gradient-to-r from-pink-500/10 to-indigo-500/10 border border-pink-500/20 p-5 rounded-xl text-center space-y-2">
                          <Trophy className="w-10 h-10 text-amber-400 mx-auto animate-bounce" />
                          <h4 className="text-sm font-bold text-white font-display">Challenge Complete!</h4>
                          <p className="text-xs text-white/70">
                            You scored <strong className="text-pink-400 font-mono text-sm">{knowledgeQuizCorrectCount} / 5</strong> correct.
                          </p>
                          <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider">
                            Earned +{knowledgeQuizCorrectCount * 150} XP {knowledgeQuizCorrectCount === 5 && "+ 250 XP perfect bonus!"}
                          </p>
                        </div>

                        {/* Question Breakdown with statutory reference explanations */}
                        <div className="space-y-4">
                          {TAX_KNOWLEDGE_QUESTIONS.map((q, idx) => {
                            const isCorrect = knowledgeAnswers[idx] === q.correctIndex;
                            return (
                              <div key={q.id} className={`p-4 rounded-xl border text-left ${isCorrect ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                <div className="flex justify-between items-start gap-2 border-b border-white/5 pb-2 mb-2">
                                  <h5 className="text-[11.5px] font-bold text-white leading-relaxed">
                                    Q{q.id}: {q.question}
                                  </h5>
                                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {isCorrect ? 'CORRECT' : 'INCORRECT'}
                                  </span>
                                </div>

                                <div className="space-y-1.5 text-left">
                                  <p className="text-[11px] text-white/60">
                                    Your Answer: <strong className={isCorrect ? 'text-emerald-400' : 'text-red-400'}>{q.options[knowledgeAnswers[idx]]}</strong>
                                  </p>
                                  {!isCorrect && (
                                    <p className="text-[11px] text-emerald-400">
                                      Correct Answer: <strong>{q.options[q.correctIndex]}</strong>
                                    </p>
                                  )}
                                  <p className="text-[10.5px] text-white/80 italic leading-relaxed pt-1 font-sans">
                                    {q.explanation}
                                  </p>
                                  <div className="flex justify-between text-[9px] text-indigo-300 font-mono pt-1">
                                    <span>Statute Clause:</span>
                                    <span className="font-bold">{q.actRef}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => {
                            setKnowledgeAnswers({});
                            setKnowledgeQuizSubmitted(false);
                          }}
                          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-2 rounded-xl text-xs font-mono transition-all cursor-pointer"
                        >
                          Retake Quiz Challenge
                        </button>
                      </div>
                    )}

                  </div>

                </div>

                {/* RIGHT COLUMN: BADGES & PROACTIVE CHALLENGES */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* 1. BADGES MATRIX */}
                  <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-400" />
                        <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Achievements Matrix</h4>
                      </div>
                      <span className="text-[10px] text-white/40 font-mono">
                        {gamificationData.badges.filter(b => b.unlocked).length} of 6 Unlocked
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {gamificationData.badges.map((b) => {
                        return (
                          <div 
                            key={b.id}
                            className={`p-3.5 rounded-xl border flex gap-3 items-center justify-between transition-all ${
                              b.unlocked 
                                ? 'bg-slate-950/40 border-amber-500/20 shadow-sm' 
                                : 'bg-slate-950/20 border-white/5 opacity-60'
                            }`}
                          >
                            <div className="flex gap-3 items-center text-left">
                              {/* Glowing badge icon container */}
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                                b.unlocked 
                                  ? 'bg-amber-500/10 border-amber-500/30' 
                                  : 'bg-white/5 border-white/5'
                              }`}>
                                {b.iconType === "shield" && <ShieldCheck className={`w-6 h-6 ${b.unlocked ? 'text-amber-400' : 'text-white/20'}`} />}
                                {b.iconType === "ledger" && <FileText className={`w-6 h-6 ${b.unlocked ? 'text-amber-400' : 'text-white/20'}`} />}
                                {b.iconType === "travel" && <Award className={`w-6 h-6 ${b.unlocked ? 'text-amber-400' : 'text-white/20'}`} />}
                                {b.iconType === "solar" && <Sparkles className={`w-6 h-6 ${b.unlocked ? 'text-amber-400' : 'text-white/20'}`} />}
                                {b.iconType === "scholar" && <Trophy className={`w-6 h-6 ${b.unlocked ? 'text-amber-400' : 'text-white/20'}`} />}
                                {b.iconType === "team" && <Users className={`w-6 h-6 ${b.unlocked ? 'text-amber-400' : 'text-white/20'}`} />}
                              </div>

                              <div className="space-y-0.5">
                                <h5 className={`text-[11.5px] font-bold ${b.unlocked ? 'text-amber-400' : 'text-white/40'}`}>
                                  {b.title}
                                </h5>
                                <p className="text-[10px] text-white/50 leading-tight pr-2">
                                  {b.description}
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className={`text-[9px] font-mono font-bold uppercase tracking-wider block ${
                                b.unlocked ? 'text-emerald-400' : 'text-white/30'
                              }`}>
                                {b.metric}
                              </span>
                              <span className="text-[8.5px] text-white/30 font-mono block">
                                {b.unlocked ? "Claimed" : `+${b.xpValue} XP`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. PROACTIVE SOUTH AFRICAN TAX PLANNING CHALLENGES */}
                  <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-sky-400" />
                        <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Proactive SME Challenges</h4>
                      </div>
                      <span className="text-[10px] text-sky-400 font-mono font-bold">
                        +250 XP Each
                      </span>
                    </div>

                    <div className="space-y-3">
                      {[
                        {
                          id: "solar",
                          title: "Model Section 12BA Solar Incentive",
                          description: "Simulate solar wear-and-tear deductions in the tax reduction simulator under 2026 guidelines.",
                          actionText: "Unlock Simulation Benefits",
                          successText: "Solar Deduction Sim Completed!"
                        },
                        {
                          id: "retirement",
                          title: "Section 11F Retirement Contributions",
                          description: "Audit retirement annuity contribution rates up to 27.5% in the tax calculator.",
                          actionText: "Check Contribution Room",
                          successText: "Retirement Room Audited!"
                        },
                        {
                          id: "provisional_estimate",
                          title: "Run IRP6 Second Period Checkup",
                          description: "Simulate provisional earnings estimate within the 90% Safe Harbor under Paragraph 20.",
                          actionText: "Simulate Safe Harbor",
                          successText: "IRP6 Safegarded!"
                        },
                        {
                          id: "office_checklist",
                          title: "Audit Home Office Exclusive Use",
                          description: "Complete photographic exclusive-use criteria in the statutory checklists.",
                          actionText: "Review Photo Requirements",
                          successText: "Home Office Proofed!"
                        }
                      ].map((c) => {
                        const isClaimed = completedChallenges.includes(c.id);
                        return (
                          <div 
                            key={c.id} 
                            className={`p-3.5 rounded-xl border space-y-2.5 transition-all text-left ${
                              isClaimed 
                                ? 'bg-sky-500/5 border-sky-500/20' 
                                : 'bg-white/5 border-white/5 hover:border-white/10'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="text-left">
                                <h5 className={`text-[11px] font-bold ${isClaimed ? 'text-sky-300 line-through' : 'text-white'}`}>
                                  {c.title}
                                </h5>
                                <p className="text-[10px] text-white/50 leading-relaxed pr-2">
                                  {c.description}
                                </p>
                              </div>
                              <span className="text-[8.5px] bg-sky-500/10 border border-sky-500/20 text-sky-300 font-mono font-bold px-1.5 py-0.5 rounded shrink-0">
                                {isClaimed ? 'CLAIMED' : '+250 XP'}
                              </span>
                            </div>

                            {!isClaimed ? (
                              <button
                                onClick={() => {
                                  setCompletedChallenges(prev => [...prev, c.id]);
                                  showBanner(`Successfully completed challenge! Earned +250 XP toward your profile ranking.`);
                                }}
                                className="w-full bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                              >
                                <Unlock className="w-3 h-3" />
                                {c.actionText}
                              </button>
                            ) : (
                              <div className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all text-center flex items-center justify-center gap-1.5">
                                <Check className="w-3 h-3" />
                                {c.successText}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                  </div>

                </div>

              </div>

            </motion.div>
          )}

          {/* TAB 7: SARS JARGON GLOSSARY */}
          {activeTab === 'glossary' && (
            <motion.div
              key="glossary-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              {/* Filter controls */}
              <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row justify-between gap-4">
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-2.5 text-white/30 w-3.5 h-3.5" />
                  <input
                    type="text"
                    placeholder="Search SARS codes or rules..."
                    value={glossarySearch}
                    onChange={(e) => setGlossarySearch(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl py-1.5 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                  {([
                    { id: 'all', label: 'All Terms' },
                    { id: 'code', label: 'SARS Codes' },
                    { id: 'act', label: 'Act & Rules' },
                    { id: 'process', label: 'Processes' }
                  ] as const).map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setGlossaryCategory(cat.id)}
                      className={`py-1 px-3 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                        glossaryCategory === cat.id
                          ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                          : 'bg-white/5 border-white/5 text-white/50 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Glossary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    id: 'code-4015',
                    term: 'Source Code 4015',
                    category: 'code',
                    description: 'Business travel deductions claimed against a travel allowance (Source Code 3701). Must be substantiated with a detailed contemporaneous logbook.',
                    law: 'Section 11(a) of Income Tax Act 58 of 1962',
                    consequence: 'SARS automatically writes back 100% of disallowed travel expenses to R0 during assessments if a physical logbook is missing.'
                  },
                  {
                    id: 'rule7',
                    term: 'Rule 7 of TAA',
                    category: 'act',
                    description: 'Formal rules prescribing procedures, grounds of objection, and timelines for challenging SARS tax assessments or decisions.',
                    law: 'Section 103 of Tax Administration Act 28 of 2011',
                    consequence: 'Provides taxpayers with an 80-business-day window to raise a formal objection (ADR1) with direct citations of facts and laws.'
                  },
                  {
                    id: 'adr1',
                    term: 'ADR1 Objection Form',
                    category: 'process',
                    description: 'Notice of Objection form filled out by the taxpayer on eFiling when lodging a dispute against an unfair assessment.',
                    law: 'Tax Administration Act - Section 104',
                    consequence: 'Requires packaging proof such as contemporaneous logbooks (Logbook ID #789) or installment sale purchase contracts.'
                  },
                  {
                    id: 'sec11a',
                    term: 'Section 11(a) General Deduction',
                    category: 'act',
                    description: 'The General Deduction Formula. Allows businesses and individuals to deduct expenses incurred in the production of taxable income.',
                    law: 'Section 11(a) of Income Tax Act 58 of 1962',
                    consequence: 'Expenses must not be of a capital nature and must be laid out for the purposes of trade.'
                  },
                  {
                    id: 'sec23g',
                    term: 'Section 23(g) Trade Limitation',
                    category: 'act',
                    description: 'Limits deductions to expenses that are incurred strictly for the purposes of trade.',
                    law: 'Section 23(g) of Income Tax Act 58 of 1962',
                    consequence: 'Dual-purpose expenses (e.g., home office used as a children\'s playroom) are prohibited and disallowed on audit.'
                  },
                  {
                    id: 'sec12ba',
                    term: 'Section 12BA Solar Allowance',
                    category: 'act',
                    description: 'Enhanced renewable energy incentive allowing businesses to claim a 125% upfront deduction on solar equipment costs.',
                    law: 'Section 12BA of Income Tax Act 58 of 1962',
                    consequence: 'Applicable to new and unused solar assets brought into use for trade during qualifying tax periods.'
                  },
                  {
                    id: 'irp6',
                    term: 'IRP6 Provisional Return',
                    category: 'process',
                    description: 'A statutory submission requiring businesses and freelancers to pay tax in advance based on estimated taxable profit twice a year.',
                    law: 'Fourth Schedule to the Income Tax Act',
                    consequence: 'Underestimates below 90% (or 80% if income > R1m) trigger Paragraph 20 penalties.'
                  },
                  {
                    id: 'ita34',
                    term: 'ITA34 Assessment Notice',
                    category: 'code',
                    description: 'The statutory notice issued by SARS calculating final tax liabilities after processing tax submissions.',
                    law: 'Section 95 & 96 of Tax Administration Act',
                    consequence: 'Acts as the triggering document for dispute resolution (Rule 7 Objections) and states the official date of assessment.'
                  },
                  {
                    id: 'sec7c',
                    term: 'Section 7C Trust Loans',
                    category: 'act',
                    description: 'Anti-avoidance rules addressing interest-free or low-interest loans made directly or indirectly to a Trust.',
                    law: 'Section 7C of Income Tax Act 58 of 1962',
                    consequence: 'The interest rate difference below the SARS Official Rate is treated as a taxable donation, subject to 20% Donations Tax.'
                  }
                ]
                .filter(item => {
                  const matchesSearch = item.term.toLowerCase().includes(glossarySearch.toLowerCase()) || item.description.toLowerCase().includes(glossarySearch.toLowerCase());
                  const matchesCat = glossaryCategory === 'all' || item.category === glossaryCategory;
                  return matchesSearch && matchesCat;
                })
                .map(item => (
                  <div key={item.id} className="bg-slate-900/30 border border-white/5 rounded-2xl p-4 space-y-3 flex flex-col justify-between text-left">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-bold text-emerald-400 font-mono">{item.term}</h4>
                        <span className="text-[9px] bg-white/5 text-white/40 px-1.5 py-0.5 rounded uppercase font-mono tracking-wider">
                          {item.category === 'code' ? 'SARS Code' : item.category === 'act' ? 'Statute/Act' : 'Process'}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/75 leading-relaxed font-sans">{item.description}</p>
                    </div>

                    <div className="pt-2 border-t border-white/5 space-y-1 font-mono text-[9px]">
                      <div className="flex justify-between">
                        <span className="text-white/30">Statutory Source:</span>
                        <span className="text-indigo-300 font-bold">{item.law}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-white/30 shrink-0">Audit Vulnerability:</span>
                        <span className="text-amber-300 text-right leading-snug">{item.consequence}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
};
