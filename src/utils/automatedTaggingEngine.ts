/**
 * @file automatedTaggingEngine.ts
 * @description Automated Tagging & Classification Engine for Pending Bank Transactions.
 * Performs intelligent keyword extraction, token frequency analysis, and semantic
 * matching against historical SARS compliance ledgers and tax invoices.
 */

import { TaxTransaction, InvoiceRecord, PendingBankTransaction, CategorizationRule } from '../types';

export interface CategorySuggestion {
  category: string;
  confidence: number; // 0 to 1 (e.g., 0.95 for 95%)
  confidencePercentage: number; // 0 to 100
  matchedKeywords: string[];
  sarsSection: string;
  suggestedType: 'income' | 'expense' | 'asset' | 'investment';
  suggestedDeductiblePercentage: number;
  explanation: string;
  historicalMatchesCount: number;
  matchedRuleId?: string;
  matchedRuleName?: string;
  matchedByCustomRule?: boolean;
  alternativeCategories: Array<{
    category: string;
    confidencePercentage: number;
    sarsSection: string;
  }>;
}

/**
 * Match a raw merchant string against user-defined categorization rules
 * Rules are sorted by priority (descending). First match takes precedence.
 */
export function matchUserRule(
  text: string,
  rules: CategorizationRule[] = []
): CategorizationRule | null {
  if (!text || !rules || rules.length === 0) return null;
  const normalizedText = text.trim().toLowerCase();

  const sortedRules = [...rules]
    .filter(r => r.enabled && r.pattern && r.pattern.trim().length > 0)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  for (const rule of sortedRules) {
    const pattern = rule.pattern.trim().toLowerCase();
    let isMatch = false;

    switch (rule.matchType) {
      case 'exact':
        isMatch = normalizedText === pattern;
        break;
      case 'starts_with':
        isMatch = normalizedText.startsWith(pattern);
        break;
      case 'regex':
        try {
          const re = new RegExp(rule.pattern, 'i');
          isMatch = re.test(text);
        } catch {
          isMatch = normalizedText.includes(pattern);
        }
        break;
      case 'contains':
      default:
        isMatch = normalizedText.includes(pattern);
        break;
    }

    if (isMatch) {
      return rule;
    }
  }

  return null;
}

// Common financial / South African transaction noise words to ignore in tokenization
const STOPWORDS = new Set([
  'the', 'and', 'or', 'for', 'with', 'from', 'at', 'in', 'on', 'by', 'to', 'of',
  'pty', 'ltd', 'cc', 'sa', 'za', 'co', 'inc', 'corp',
  'eft', 'pos', 'card', 'purchase', 'payment', 'dr', 'cr', 'ref', 'no', 'val',
  'trans', 'bank', 'branch', 'atm', 'fee', 'monthly', 'debit', 'credit'
]);

// Statutory baseline taxonomy mapping for common South African business/personal transactions
interface BaselineTaxonomyRule {
  keywords: string[];
  category: string;
  sarsSection: string;
  type: 'income' | 'expense' | 'asset' | 'investment';
  deductiblePercentage: number;
  weight: number;
}

const SARS_BASELINE_RULES: BaselineTaxonomyRule[] = [
  // Computer & Computing Hardware (Section 11(e) / Section 12C)
  {
    keywords: ['apple', 'istore', 'macbook', 'ipad', 'dell', 'lenovo', 'hp', 'laptop', 'monitor', 'hardware', 'incredible', 'matrix'],
    category: 'Computer & Office Equipment',
    sarsSection: 'Section 11(e) / Section 12B Small Business Asset Allowance',
    type: 'asset',
    deductiblePercentage: 100,
    weight: 0.92
  },
  // Medical Aid & Scheme Contributions (Section 6A / 6B)
  {
    keywords: ['discovery', 'medical', 'medscheme', 'bonitas', 'momentum', 'health', 'medicare', 'hospital', 'pharmacy', 'dischem', 'clicks'],
    category: 'Medical Scheme',
    sarsSection: 'Section 6A Medical Scheme Fees Tax Credit',
    type: 'expense',
    deductiblePercentage: 100,
    weight: 0.95
  },
  // Telecommunications & Internet (Section 11(a))
  {
    keywords: ['vodacom', 'mtn', 'telkom', 'afrihost', 'rsaweb', 'cellc', 'rain', 'coolideas', 'fibre', 'lte', 'data', 'internet'],
    category: 'Telecommunications',
    sarsSection: 'Section 11(a) General Business Expense',
    type: 'expense',
    deductiblePercentage: 80,
    weight: 0.90
  },
  // Travel & Transport (Section 8(1)(b) / 11(a))
  {
    keywords: ['uber', 'bolt', 'sasol', 'shell', 'bp', 'engen', 'total', 'petrol', 'fuel', 'garage', 'avia', 'toll', 'sanral', 'flight', 'safair'],
    category: 'Travel & Transport',
    sarsSection: 'Section 11(a) Travel Expense / Section 8(1)(b)',
    type: 'expense',
    deductiblePercentage: 100,
    weight: 0.92
  },
  // Consulting & Professional Income (Section 1)
  {
    keywords: ['deposit', 'consulting', 'advisory', 'retainer', 'milestone', 'project', 'client', 'fee', 'invoice', 'services', 'dividend', 'honorarium'],
    category: 'Consulting Fees',
    sarsSection: 'Gross Income (Section 1 definition)',
    type: 'income',
    deductiblePercentage: 0,
    weight: 0.88
  },
  // Software & Cloud SaaS (Section 11(a))
  {
    keywords: ['aws', 'amazon', 'google', 'cloud', 'microsoft', 'azure', 'github', 'webflow', 'adobe', 'slack', 'zoom', 'openai', 'notion', 'atlassian', 'saas'],
    category: 'Software & Cloud SaaS',
    sarsSection: 'Section 11(a) General Business Expense',
    type: 'expense',
    deductiblePercentage: 100,
    weight: 0.94
  },
  // Retirement Contributions (Section 11F)
  {
    keywords: ['allan', 'gray', 'annuity', 'retirement', 'ra', 'pension', 'provident', 'sygnia', 'coronation', 'sanlam', 'old mutual'],
    category: 'Retirement Fund Contribution',
    sarsSection: 'Section 11F Retirement Funds Deduction',
    type: 'investment',
    deductiblePercentage: 100,
    weight: 0.96
  },
  // Office Stationery & Workspace (Section 11(a))
  {
    keywords: ['makro', 'waltons', 'stationery', 'desk', 'chair', 'furniture', 'takealot', 'paper', 'printer', 'toner'],
    category: 'Office Stationery & Desks',
    sarsSection: 'Section 11(a) General Business Expense',
    type: 'expense',
    deductiblePercentage: 100,
    weight: 0.85
  },
  // Meals & Entertainment (Section 23(c) - Non-deductible)
  {
    keywords: ['woolworths', 'pnp', 'pick', 'pay', 'checkers', 'spar', 'nandos', 'mcdonalds', 'kfc', 'cafe', 'restaurant', 'bar', 'snack', 'food'],
    category: 'Meals & Entertainment',
    sarsSection: 'Non-Deductible Entertainment (Section 23)',
    type: 'expense',
    deductiblePercentage: 0,
    weight: 0.85
  }
];

/**
 * Clean and extract significant keywords from transaction descriptions
 */
export function extractKeywords(text: string): string[] {
  if (!text) return [];
  
  // Normalize, remove punctuation, split into alphanumeric tokens
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length >= 2 && !STOPWORDS.has(t) && !/^\d+$/.test(t));

  return Array.from(new Set(tokens));
}

/**
 * Builds an index of historical keywords mapped to categories and metadata
 */
interface HistoricalKeywordProfile {
  token: string;
  categoryFrequencies: Map<string, number>;
  totalOccurrences: number;
  associatedType: 'income' | 'expense' | 'asset' | 'investment';
  sarsSections: Map<string, number>;
  deductiblePcts: number[];
}

function buildHistoricalIndex(
  transactions: TaxTransaction[],
  invoices: InvoiceRecord[] = []
): Map<string, HistoricalKeywordProfile> {
  const index = new Map<string, HistoricalKeywordProfile>();

  const processRecord = (
    text: string,
    category: string,
    type: 'income' | 'expense' | 'asset' | 'investment',
    sarsSection: string,
    deductiblePct: number
  ) => {
    const tokens = extractKeywords(text);
    tokens.forEach(token => {
      let profile = index.get(token);
      if (!profile) {
        profile = {
          token,
          categoryFrequencies: new Map<string, number>(),
          totalOccurrences: 0,
          associatedType: type,
          sarsSections: new Map<string, number>(),
          deductiblePcts: []
        };
        index.set(token, profile);
      }

      profile.totalOccurrences += 1;
      profile.categoryFrequencies.set(category, (profile.categoryFrequencies.get(category) || 0) + 1);
      profile.sarsSections.set(sarsSection, (profile.sarsSections.get(sarsSection) || 0) + 1);
      profile.deductiblePcts.push(deductiblePct);
    });
  };

  // Index historical transactions
  transactions.forEach(t => {
    const txType = (t.type === 'income' || t.type === 'expense' || t.type === 'asset' || t.type === 'investment')
      ? t.type
      : 'expense';
    processRecord(
      t.description,
      t.category,
      txType,
      t.sarsSection || 'Section 11(a)',
      t.deductiblePercentage ?? (t.isDeductible ? 100 : 0)
    );
  });

  // Index historical invoices
  invoices.forEach(inv => {
    processRecord(
      `${inv.supplierName} ${inv.explanation || ''}`,
      inv.category,
      'expense',
      inv.sarsSection || 'Section 11(a) General Deduction',
      inv.isDeductible ? 100 : 0
    );
  });

  return index;
}

/**
 * Intelligent categorization suggestion for a single pending bank transaction
 */
export function suggestCategoryForPendingTransaction(
  pending: PendingBankTransaction,
  historicalTransactions: TaxTransaction[] = [],
  historicalInvoices: InvoiceRecord[] = [],
  customRules: CategorizationRule[] = []
): CategorySuggestion {
  // 0. User-defined categorization rules take highest precedence
  const matchedRule = matchUserRule(pending.rawMerchant, customRules);
  if (matchedRule) {
    const isRuleCredit = matchedRule.type === 'income';
    const ruleType = matchedRule.type || (pending.type === 'credit' ? 'income' : 'expense');
    const ruleSection = matchedRule.sarsSection || (isRuleCredit ? 'Gross Income (Section 1 definition)' : 'Section 11(a) General Business Expense');
    const ruleDeductible = matchedRule.deductiblePercentage ?? (ruleType === 'income' ? 0 : 100);

    return {
      category: matchedRule.category,
      confidence: 0.99,
      confidencePercentage: 99,
      matchedKeywords: [matchedRule.pattern],
      sarsSection: ruleSection,
      suggestedType: ruleType,
      suggestedDeductiblePercentage: ruleDeductible,
      explanation: `Matched user rule "${matchedRule.name}" (${matchedRule.matchType.toUpperCase()}: "${matchedRule.pattern}"). Precedence override active.`,
      historicalMatchesCount: matchedRule.matchCount || 1,
      matchedRuleId: matchedRule.id,
      matchedRuleName: matchedRule.name,
      matchedByCustomRule: true,
      alternativeCategories: []
    };
  }

  const merchantTokens = extractKeywords(pending.rawMerchant);
  const isCredit = pending.type === 'credit';
  
  // 1. Build index from historical ledger
  const historicalIndex = buildHistoricalIndex(historicalTransactions, historicalInvoices);

  // Category candidate scores: category -> { score, matchedKeywords, sarsSection, type, deductiblePct, hitCount }
  const categoryScores = new Map<string, {
    score: number;
    matchedKeywords: Set<string>;
    sarsSectionCounts: Map<string, number>;
    types: Map<string, number>;
    deductiblePcts: number[];
    historicalHits: number;
  }>();

  const addScore = (
    cat: string,
    points: number,
    keyword: string,
    sarsSection: string,
    txType: string,
    deductiblePct: number,
    isHistorical: boolean
  ) => {
    let entry = categoryScores.get(cat);
    if (!entry) {
      entry = {
        score: 0,
        matchedKeywords: new Set<string>(),
        sarsSectionCounts: new Map<string, number>(),
        types: new Map<string, number>(),
        deductiblePcts: [],
        historicalHits: 0
      };
      categoryScores.set(cat, entry);
    }

    entry.score += points;
    entry.matchedKeywords.add(keyword);
    entry.sarsSectionCounts.set(sarsSection, (entry.sarsSectionCounts.get(sarsSection) || 0) + 1);
    entry.types.set(txType, (entry.types.get(txType) || 0) + 1);
    entry.deductiblePcts.push(deductiblePct);
    if (isHistorical) {
      entry.historicalHits += 1;
    }
  };

  // 2. Score matches against Historical Data
  merchantTokens.forEach(token => {
    const historicalHit = historicalIndex.get(token);
    if (historicalHit) {
      historicalHit.categoryFrequencies.forEach((freq, category) => {
        // High confidence multiplier for historical occurrences
        const scoreBonus = 25 * freq * (token.length > 4 ? 1.2 : 1.0);
        const topSection = Array.from(historicalHit.sarsSections.entries())
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Section 11(a)';
        const avgDeductible = historicalHit.deductiblePcts.reduce((a, b) => a + b, 0) / (historicalHit.deductiblePcts.length || 1);

        addScore(
          category,
          scoreBonus,
          token,
          topSection,
          historicalHit.associatedType,
          avgDeductible,
          true
        );
      });
    }

    // Check for exact substring matches in historical transaction descriptions
    historicalTransactions.forEach(histTx => {
      const histDescLower = histTx.description.toLowerCase();
      if (histDescLower.includes(token)) {
        addScore(
          histTx.category,
          15,
          token,
          histTx.sarsSection || 'Section 11(a)',
          histTx.type,
          histTx.deductiblePercentage ?? 100,
          true
        );
      }
    });
  });

  // 3. Score matches against SARS Baseline Taxonomy Rules
  SARS_BASELINE_RULES.forEach(rule => {
    // Check if token in merchant matches baseline rule
    rule.keywords.forEach(ruleKeyword => {
      const matchFound = merchantTokens.some(mToken => 
        mToken === ruleKeyword || 
        (mToken.length >= 4 && ruleKeyword.length >= 4 && (mToken.includes(ruleKeyword) || ruleKeyword.includes(mToken)))
      );

      if (matchFound) {
        // Baseline match weight
        const baselineScore = 20 * rule.weight;
        addScore(
          rule.category,
          baselineScore,
          ruleKeyword,
          rule.sarsSection,
          rule.type,
          rule.deductiblePercentage,
          false
        );
      }
    });
  });

  // 4. Directional Compatibility adjustments
  categoryScores.forEach((data, cat) => {
    const isIncomeCat = cat.toLowerCase().includes('income') || cat.toLowerCase().includes('fee') || cat.toLowerCase().includes('consulting') || cat.toLowerCase().includes('sales');
    if (isCredit && isIncomeCat) {
      data.score *= 1.5; // Boost income category if pending transaction is credit
    } else if (!isCredit && isIncomeCat) {
      data.score *= 0.3; // Penalize income category if debit
    } else if (isCredit && !isIncomeCat) {
      data.score *= 0.4; // Penalize expense category if credit
    }
  });

  // 5. Rank categories by score
  const sortedCandidates = Array.from(categoryScores.entries())
    .map(([cat, data]) => {
      // Pick predominant sarsSection
      const bestSection = Array.from(data.sarsSectionCounts.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Section 11(a) General Deduction';
      
      // Pick predominant type
      const bestType = Array.from(data.types.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || (isCredit ? 'income' : 'expense');
      
      const avgDeductible = data.deductiblePcts.length > 0
        ? Math.round(data.deductiblePcts.reduce((a, b) => a + b, 0) / data.deductiblePcts.length)
        : (isCredit ? 0 : 100);

      return {
        category: cat,
        score: data.score,
        matchedKeywords: Array.from(data.matchedKeywords),
        sarsSection: bestSection,
        suggestedType: bestType as 'income' | 'expense' | 'asset' | 'investment',
        suggestedDeductiblePercentage: avgDeductible,
        historicalHits: data.historicalHits
      };
    })
    .sort((a, b) => b.score - a.score);

  // If no candidates matched at all, provide safe fallback
  if (sortedCandidates.length === 0) {
    const fallbackCategory = isCredit ? 'Consulting Fees' : 'Operating Expenses';
    const fallbackSection = isCredit ? 'Gross Income (Section 1 definition)' : 'Section 11(a) General Deduction';
    const fallbackType = isCredit ? 'income' : 'expense';

    return {
      category: fallbackCategory,
      confidence: 0.50,
      confidencePercentage: 50,
      matchedKeywords: merchantTokens.slice(0, 2),
      sarsSection: fallbackSection,
      suggestedType: fallbackType,
      suggestedDeductiblePercentage: isCredit ? 0 : 100,
      explanation: `No explicit historical match for "${pending.rawMerchant}". Suggested standard ${fallbackCategory} based on transaction direction (${pending.type.toUpperCase()}).`,
      historicalMatchesCount: 0,
      alternativeCategories: []
    };
  }

  const topMatch = sortedCandidates[0];
  const maxPossibleScore = 80;
  const rawConfidence = Math.min(0.98, Math.max(0.65, topMatch.score / maxPossibleScore));
  const confidencePercentage = Math.round(rawConfidence * 100);

  // Alternative runner-up categories
  const alternativeCategories = sortedCandidates.slice(1, 3).map(alt => {
    const altConfidence = Math.round(Math.min(0.90, Math.max(0.40, (alt.score / (topMatch.score || 1)) * rawConfidence)) * 100);
    return {
      category: alt.category,
      confidencePercentage: altConfidence,
      sarsSection: alt.sarsSection
    };
  });

  // Construct descriptive explanation
  const kwList = topMatch.matchedKeywords.slice(0, 3).map(k => `"${k}"`).join(', ');
  const histNote = topMatch.historicalHits > 0
    ? `matched against ${topMatch.historicalHits} historical records`
    : `matched via statutory taxonomy`;

  const explanation = `Matched ${kwList} (${histNote}) with ${confidencePercentage}% confidence. Recommended classification: ${topMatch.category} under ${topMatch.sarsSection}.`;

  return {
    category: topMatch.category,
    confidence: rawConfidence,
    confidencePercentage,
    matchedKeywords: topMatch.matchedKeywords,
    sarsSection: topMatch.sarsSection,
    suggestedType: topMatch.suggestedType,
    suggestedDeductiblePercentage: topMatch.suggestedDeductiblePercentage,
    explanation,
    historicalMatchesCount: topMatch.historicalHits,
    alternativeCategories
  };
}

/**
 * Batch tagging helper for a list of pending transactions
 */
export function batchSuggestCategories(
  pendingList: PendingBankTransaction[],
  historicalTransactions: TaxTransaction[] = [],
  historicalInvoices: InvoiceRecord[] = [],
  customRules: CategorizationRule[] = []
): Map<string, CategorySuggestion> {
  const resultMap = new Map<string, CategorySuggestion>();

  pendingList.forEach(item => {
    const suggestion = suggestCategoryForPendingTransaction(item, historicalTransactions, historicalInvoices, customRules);
    resultMap.set(item.id, suggestion);
  });

  return resultMap;
}
