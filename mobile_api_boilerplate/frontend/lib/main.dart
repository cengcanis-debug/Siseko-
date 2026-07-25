import 'package:flutter/material.dart';

void main() {
  runApp(const SARSComplianceApp());
}

class SARSComplianceApp extends StatelessWidget {
  const SARSComplianceApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'South Africa Tax Compliance Advisor',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xFF10B981), // Emerald Primary
        scaffoldBackgroundColor: const Color(0xFF0F172A), // Dark Slate
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF10B981),
          secondary: Color(0xFF06B6D4), // Cyan Accent
          background: Color(0xFF0F172A),
          surface: Color(0xFF1E293B), // Card BG
        ),
        fontFamily: 'Inter',
      ),
      home: const MainNavigationScreen(),
    );
  }
}

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({Key? key}) : super(key: key);

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const DashboardScreen(),
    const LogbookScreen(),
    const ExpenseScreen(),
    const WealthScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(child: _screens[_currentIndex]),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        type: BottomNavigationBarType.fixed,
        backgroundColor: const Color(0xFF1E293B),
        selectedItemColor: const Color(0xFF10B981),
        unselectedItemColor: Colors.white54,
        selectedFontSize: 11,
        unselectedFontSize: 11,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_rounded),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.directions_car_rounded),
            label: 'Logbook',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.receipt_long_rounded),
            label: 'Expenses',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.account_balance_rounded),
            label: 'Wealth',
          ),
        ],
      ),
    );
  }
}

// ==========================================
// SCREEN 1: DASHBOARD
// ==========================================
class DashboardScreen extends StatelessWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    'SARS TAX PORTAL',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF06B6D4),
                      letterSpacing: 1.5,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Welcome, Taxpayer',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
              const CircleAvatar(
                backgroundColor: Color(0xFF10B981),
                child: Icon(Icons.person, color: Colors.black87),
              )
            ],
          ),
          const SizedBox(height: 24),

          // Compliance Score Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF06B6D4), Color(0xFF10B981)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(24),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.between,
                  children: const [
                    Text(
                      'Compliance Health Score',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    Icon(Icons.verified_user_rounded, color: Colors.black87),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: const [
                    Text(
                      '98%',
                      style: TextStyle(
                        fontSize: 48,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    SizedBox(width: 16),
                    Expanded(
                      child: Text(
                        'Audit-Ready Vault checks passed. All Section 11(a) business travel logbooks and Section 7C Trust loans are compliant.',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.black87,
                          height: 1.4,
                        ),
                      ),
                    )
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Core Stats Grid
          const Text(
            'Active Tax Year Ledger Totals',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Colors.white70,
            ),
          ),
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.4,
            children: [
              _buildStatCard(
                'Section 8(1)(b) claim',
                'R 60,258.00',
                '12,450 km Logged',
                const Color(0xFF10B981),
              ),
              _buildStatCard(
                'VAT-201 Input Tax',
                'R 24,190.50',
                'OCR Verified Receipts',
                const Color(0xFF06B6D4),
              ),
              _buildStatCard(
                'Sec 12BA Solar Relief',
                'R 56,250.00',
                '125% Accelerated Cap',
                Colors.amber,
              ),
              _buildStatCard(
                'Section 7C Trust Debt',
                'R 800,000.00',
                '0.00% Interest Rate',
                Colors.indigoAccent,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String mainValue, String subValue, Color accent) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(color: accent, shape: BoxShape.circle),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(fontSize: 11, color: Colors.white54, fontWeight: FontWeight.bold),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          Text(
            mainValue,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          Text(
            subValue,
            style: const TextStyle(fontSize: 9, color: Colors.white38),
          ),
        ],
      ),
    );
  }
}

// ==========================================
// SCREEN 2: LOGBOOK
// ==========================================
class LogbookScreen extends StatefulWidget {
  const LogbookScreen({Key? key}) : super(key: key);

  @override
  State<LogbookScreen> createState() => _LogbookScreenState();
}

class _LogbookScreenState extends State<LogbookScreen> {
  final _vehicleValueController = TextEditingController(text: '850000');
  double _businessKms = 12450.0;
  double _totalAnnualKms = 32000.0;

  @override
  Widget build(BuildContext context) {
    final vehicleValue = double.tryParse(_vehicleValueController.text) ?? 0.0;
    
    // BACKEND LOGIC PORTING: CAPPED AT R800,000
    final appliedValue = vehicleValue > 800000.0 ? 800000.0 : vehicleValue;
    final isCapped = vehicleValue > 800000.0;

    // Standard scale math placeholder
    double fixedCost = 217994;
    double fuelCost = 2.30;
    double maintCost = 1.205;
    
    double fixedRate = fixedCost / _totalAnnualKms;
    double deemedRate = fixedRate + fuelCost + maintCost;
    double totalClaim = deemedRate * _businessKms;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'SARS Travel Logbook Compliance',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 6),
          const Text(
            'Section 8(1)(b) Deemed Cost Scale Calculator (2026/2027)',
            style: TextStyle(fontSize: 11, color: Colors.white54),
          ),
          const SizedBox(height: 20),

          // Vehicle configuration card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white.withOpacity(0.05)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '1. VEHICLE COST SCALE CAPPING RULE',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF10B981)),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _vehicleValueController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Original Vehicle Value (ZAR)',
                    prefixText: 'R ',
                    border: OutlineInputBorder(),
                  ),
                  onChanged: (val) => setState(() {}),
                ),
                const SizedBox(height: 12),
                if (isCapped)
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.amber.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.amber.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: const [
                        Icon(Icons.warning_amber_rounded, color: Colors.amber, size: 16),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Law-Capped: Value exceeds the statutory threshold of R800,000. Calculations use precisely R800,000.',
                            style: TextStyle(fontSize: 10, color: Colors.amberAccent),
                          ),
                        ),
                      ],
                    ),
                  ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.between,
                  children: [
                    const Text('Total Annual Kms:', style: TextStyle(fontSize: 12, color: Colors.white70)),
                    Text('${_totalAnnualKms.toInt()} km', style: const TextStyle(fontWeight: FontWeight.bold)),
                  ],
                ),
                Slider(
                  value: _totalAnnualKms,
                  min: 5000,
                  max: 80000,
                  activeColor: const Color(0xFF10B981),
                  onChanged: (val) {
                    setState(() {
                      _totalAnnualKms = val;
                    });
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Live Output Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.black25,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'CALCULATED SARS DEEMED SCALE CLAIM',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF10B981)),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.between,
                  children: [
                    const Text('Applied Vehicle Value:', style: TextStyle(fontSize: 12, color: Colors.white70)),
                    Text('R ${appliedValue.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                  ],
                ),
                const Divider(height: 16, color: Colors.white10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.between,
                  children: [
                    const Text('Deemed Rate Per Km:', style: TextStyle(fontSize: 12, color: Colors.white70)),
                    Text('R ${deemedRate.toStringAsFixed(4)}', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.cyan)),
                  ],
                ),
                const Divider(height: 16, color: Colors.white10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.between,
                  children: [
                    const Text('Business Kilometers:', style: TextStyle(fontSize: 12, color: Colors.white70)),
                    Text('${_businessKms.toInt()} km', style: const TextStyle(fontWeight: FontWeight.bold)),
                  ],
                ),
                const Divider(height: 20, color: Colors.white24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.between,
                  children: [
                    const Text(
                      'TOTAL SARS DEDUCTION:',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    Text(
                      'R ${totalClaim.toStringAsFixed(2)}',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF10B981)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ==========================================
// SCREEN 3: EXPENSE OCR SCANNER
// ==========================================
class ExpenseScreen extends StatelessWidget {
  const ExpenseScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Smart VAT 201 OCR OCR Scanner',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 6),
          const Text(
            'Instant SARS validation for business purchase tax invoices.',
            style: TextStyle(fontSize: 11, color: Colors.white54),
          ),
          const SizedBox(height: 20),

          // Upload Box Mock
          Container(
            height: 140,
            width: double.infinity,
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white.withOpacity(0.05)),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.cloud_upload_outlined, size: 40, color: Color(0xFF06B6D4)),
                const SizedBox(height: 8),
                const Text('Upload Receipt Image or PDF Invoice', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 4),
                Text('Max 15MB • Standard formats', style: TextStyle(color: Colors.white38, fontSize: 10)),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // R25,000 threshold compliance warning card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white.withOpacity(0.05)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: const [
                    Icon(Icons.gavel_rounded, color: Colors.cyan, size: 18),
                    SizedBox(width: 8),
                    Text(
                      'VAT ACT NO. 89 OF 1991 SECTION 20(4)',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                const Text(
                  'For purchases exceeding R25,000.00, standard rules require a "Full Tax Invoice" to successfully reclaim Input VAT. It MUST include:',
                  style: TextStyle(fontSize: 11, color: Colors.white70, height: 1.4),
                ),
                const SizedBox(height: 12),
                _buildBulletPoint('Buying Company Name (Your Registered Entity Name)'),
                _buildBulletPoint('Buying Company Physical Address'),
                _buildBulletPoint('Buying Company 10-Digit VAT Registration Number'),
                const SizedBox(height: 10),
                const Text(
                  'If these fields are missing, SARS will disallow the Input Tax claim upon auditing.',
                  style: TextStyle(fontSize: 10, color: Colors.white38),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBulletPoint(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4.0),
      child: Row(
        children: [
          const Icon(Icons.check_circle_outline_rounded, color: Color(0xFF10B981), size: 14),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 11, color: Colors.white70))),
        ],
      ),
    );
  }
}

// ==========================================
// SCREEN 4: WEALTH (SECTION 7C)
// ==========================================
class WealthScreen extends StatelessWidget {
  const WealthScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Trust & Wealth Management',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 6),
          const Text(
            'SARS Section 7C Trust Loan Anti-Avoidance Monitoring',
            style: TextStyle(fontSize: 11, color: Colors.white54),
          ),
          const SizedBox(height: 20),

          // Section 7C Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white.withOpacity(0.05)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.between,
                  children: const [
                    Text(
                      'SEC 7C ACTIVE TRUST LOAN',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.indigoAccent),
                    ),
                    Icon(Icons.shield, color: Colors.indigoAccent, size: 18),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.between,
                  children: const [
                    Text('Principal Debt:', style: TextStyle(fontSize: 12, color: Colors.white70)),
                    Text('R 800,000.00', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                  ],
                ),
                const Divider(height: 16, color: Colors.white10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.between,
                  children: const [
                    Text('Charged Interest:', style: TextStyle(fontSize: 12, color: Colors.white70)),
                    Text('0.00% (Interest-Free)', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.amberAccent)),
                  ],
                ),
                const Divider(height: 16, color: Colors.white10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.between,
                  children: const [
                    Text('SARS Official Interest Rate:', style: TextStyle(fontSize: 12, color: Colors.white70)),
                    Text('9.25% (Repo + 100bps)', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                  ],
                ),
                const Divider(height: 16, color: Colors.white10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.between,
                  children: const [
                    Text('Deemed Donation (Sec 7C):', style: TextStyle(fontSize: 12, color: Colors.white70)),
                    Text('R 74,000.00 / year', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.redAccent)),
                  ],
                ),
                const Divider(height: 20, color: Colors.white24),
                const Text(
                  'Section 7C deems the foregone interest (SARS Official Rate - Charged Rate) on interest-free loans to trusts to be a donation, subject to 20% Donations Tax unless the annual R100,000 natural person donation exemption applies.',
                  style: TextStyle(fontSize: 11, color: Colors.white38, height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
