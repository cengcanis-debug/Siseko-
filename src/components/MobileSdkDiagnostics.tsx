import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Activity, 
  Code, 
  Copy, 
  Check, 
  Layers, 
  Terminal,
  Zap,
  Globe
} from 'lucide-react';

interface MobileSdkDiagnosticsProps {
  showBanner?: (msg: string) => void;
}

export const MobileSdkDiagnostics: React.FC<MobileSdkDiagnosticsProps> = ({
  showBanner
}) => {
  const [diagWidth, setDiagWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  const [diagHeight, setDiagHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);
  const [diagDpr, setDiagDpr] = useState(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
  const [diagIsTouch, setDiagIsTouch] = useState(false);
  const [diagTouchPoints, setDiagTouchPoints] = useState(0);
  const [diagOrientation, setDiagOrientation] = useState('landscape-primary');
  const [copiedSdk, setCopiedSdk] = useState(false);
  const [activeSdkLanguage, setActiveSdkLanguage] = useState<'flutter' | 'reactNative' | 'swift' | 'kotlin'>('flutter');

  useEffect(() => {
    const updateDiagnostics = () => {
      setDiagWidth(window.innerWidth);
      setDiagHeight(window.innerHeight);
      setDiagDpr(window.devicePixelRatio || 1);
      setDiagIsTouch(('ontouchstart' in window) || (navigator.maxTouchPoints > 0));
      setDiagTouchPoints(navigator.maxTouchPoints || 0);
      setDiagOrientation(window.innerWidth > window.innerHeight ? 'Landscape' : 'Portrait');
    };

    updateDiagnostics();
    window.addEventListener('resize', updateDiagnostics);
    return () => window.removeEventListener('resize', updateDiagnostics);
  }, []);

  const flutterCode = `// ZATax Mobile SDK for Flutter (Dart)
import 'package:zatax_mobile_sdk/zatax.dart';

void main() async {
  final zaTax = ZaTaxClient(
    apiKey: 'LIVE_SARS_GATEWAY_KEY',
    endpoint: 'http://0.0.0.0:3000/api',
    enablePopiaEncryption: true,
  );

  // Fetch real-time SARS position & Section 12E SBC calculation
  final snapshot = await zaTax.getLiveTaxPosition();
  print('Projected SARS Tax: \${snapshot.netTaxLiabilityOrRefund}');
}`;

  const reactNativeCode = `// ZATax Mobile SDK for React Native (TypeScript)
import { ZaTaxClient, useTaxPosition } from '@zatax/mobile-react-native';

export function TaxOverviewScreen() {
  const { data, loading, error } = useTaxPosition({
    profileId: 'profile-1',
    autoSyncVault: true,
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#090d16', padding: 16 }}>
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
        SARS Net Position: {data?.formattedZAR}
      </Text>
    </View>
  );
}`;

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSdk(true);
    if (showBanner) showBanner('📋 Mobile SDK snippet copied to clipboard!');
    setTimeout(() => setCopiedSdk(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="mobile-sdk-tab-panel">
      
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-400" />
            Mobile SDK Sandbox & Responsiveness Diagnostics
          </h3>
          <p className="text-xs text-white/50">
            Mobile-first testing with live viewport overlay and cross-platform native SDK wrappers
          </p>
        </div>
        <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-full uppercase">
          LIVE TELEMETRY
        </span>
      </div>

      {/* DIAGNOSTIC OVERLAY */}
      <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 p-5 rounded-3xl shadow-xl space-y-4" id="mobile-diagnostic-overlay">
        <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
            <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
              Mobile Viewport & Touch Diagnostic Overlay
            </h4>
          </div>
          <span className="text-[9px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
            AUTO-DETECT
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
          <div className="bg-black/40 p-3 rounded-2xl border border-white/5">
            <span className="text-white/40 block text-[9px] uppercase">Dimensions</span>
            <span className="text-white font-bold">{diagWidth}px × {diagHeight}px</span>
          </div>
          <div className="bg-black/40 p-3 rounded-2xl border border-white/5">
            <span className="text-white/40 block text-[9px] uppercase">Pixel Ratio (DPR)</span>
            <span className="text-emerald-400 font-bold">{diagDpr.toFixed(2)}x DPR</span>
          </div>
          <div className="bg-black/40 p-3 rounded-2xl border border-white/5">
            <span className="text-white/40 block text-[9px] uppercase">Touch Support</span>
            <span className={`font-bold ${diagIsTouch ? 'text-emerald-400' : 'text-amber-400'}`}>
              {diagIsTouch ? `Touch (${diagTouchPoints} pts)` : 'Pointer / Mouse'}
            </span>
          </div>
          <div className="bg-black/40 p-3 rounded-2xl border border-white/5">
            <span className="text-white/40 block text-[9px] uppercase">Orientation</span>
            <span className="text-cyan-400 font-bold">{diagOrientation}</span>
          </div>
        </div>
      </div>

      {/* MOBILE SDK INTEGRATION SNIPPET */}
      <div className="p-5 bg-slate-900/60 border border-white/10 rounded-3xl space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Cross-Platform Mobile Integration Gateway
            </h4>
          </div>
          
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveSdkLanguage('flutter')}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all ${
                activeSdkLanguage === 'flutter' ? 'bg-indigo-500 text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              Flutter (Dart)
            </button>
            <button
              onClick={() => setActiveSdkLanguage('reactNative')}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all ${
                activeSdkLanguage === 'reactNative' ? 'bg-indigo-500 text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              React Native
            </button>
          </div>
        </div>

        <div className="relative">
          <pre className="p-4 bg-black/60 rounded-2xl text-[11px] font-mono text-emerald-300 overflow-x-auto border border-white/5 leading-relaxed">
            {activeSdkLanguage === 'flutter' ? flutterCode : reactNativeCode}
          </pre>
          <button
            onClick={() => handleCopyCode(activeSdkLanguage === 'flutter' ? flutterCode : reactNativeCode)}
            className="absolute top-3 right-3 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
          >
            {copiedSdk ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSdk ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

    </div>
  );
};
