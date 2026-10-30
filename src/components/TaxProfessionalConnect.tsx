import React, { useState } from 'react';
import { 
  UserCheck, 
  Briefcase, 
  ShieldCheck, 
  Lock, 
  Calendar, 
  MessageSquare, 
  Send, 
  Paperclip, 
  Clock, 
  Video, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Plus, 
  Download, 
  Copy, 
  ExternalLink, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  FileText, 
  Layers, 
  Zap, 
  Sparkles, 
  RefreshCw, 
  Check,
  Search,
  KeyRound,
  FileCheck,
  Award,
  ChevronRight,
  UserPlus,
  Mic,
  MicOff,
  VideoOff,
  MessageCircle
} from 'lucide-react';
import { 
  UserTaxProfile, 
  TaxTransaction, 
  InvoiceRecord, 
  RoleType,
  TaxPractitionerInvite,
  TaxProfessionalPermissions,
  AdvisoryThread,
  AdvisoryMessage,
  ConsultationBooking,
  PractitionerAccessEvent,
  CertifiedPractitionerDirectoryEntry,
  ProfessionalBody
} from '../types';
import {
  initialPractitioners,
  certifiedDirectoryList,
  initialAdvisoryThreads,
  initialAdvisoryMessages,
  initialConsultations,
  initialPractitionerAccessLogs
} from '../data/taxProfessionalData';
import { downloadBlobFile, generateSubmissionRef } from '../utils/systemBridge';

interface TaxProfessionalConnectProps {
  profile: UserTaxProfile;
  transactions: TaxTransaction[];
  invoices: InvoiceRecord[];
  currentUserRole: RoleType;
  addAuditLog: (action: string, details: string, severity?: 'info' | 'warn' | 'crit') => void;
  showBanner: (msg: string) => void;
  formatZAR: (val: number) => string;
}

type ConnectTab = 'practitioners' | 'permissions' | 'messages' | 'consultations' | 'audit_access' | 'directory';

export const TaxProfessionalConnect: React.FC<TaxProfessionalConnectProps> = ({
  profile,
  transactions,
  invoices,
  currentUserRole,
  addAuditLog,
  showBanner,
  formatZAR
}) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<ConnectTab>('practitioners');

  // Core Data States
  const [practitioners, setPractitioners] = useState<TaxPractitionerInvite[]>(initialPractitioners);
  const [selectedPractitionerId, setSelectedPractitionerId] = useState<string>(initialPractitioners[0].id);
  const [threads, setThreads] = useState<AdvisoryThread[]>(initialAdvisoryThreads);
  const [activeThreadId, setActiveThreadId] = useState<string>(initialAdvisoryThreads[0].id);
  const [messages, setMessages] = useState<AdvisoryMessage[]>(initialAdvisoryMessages);
  const [consultations, setConsultations] = useState<ConsultationBooking[]>(initialConsultations);
  const [accessLogs, setAccessLogs] = useState<PractitionerAccessEvent[]>(initialPractitionerAccessLogs);

  // Simulation Mode: View client workspace as the tax professional
  const [isPractitionerMode, setIsPractitionerMode] = useState<boolean>(false);

  // Modals
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [showNewThreadModal, setShowNewThreadModal] = useState<boolean>(false);
  const [showMandateModal, setShowMandateModal] = useState<boolean>(false);
  const [showVideoRoomModal, setShowVideoRoomModal] = useState<boolean>(false);
  const [activeVideoBooking, setActiveVideoBooking] = useState<ConsultationBooking | null>(null);

  // In-Call Video Consultation Gadget States
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isCameraOff, setIsCameraOff] = useState<boolean>(false);
  const [showInCallNotes, setShowInCallNotes] = useState<boolean>(false);
  const [inCallNotes, setInCallNotes] = useState<string>(
    '• Section 11(a) verified for 12,450 km business travel (Logbook #789)\n• Vehicle Purchase Agreement attached with deemed rate bracket R595,001 - R695,000\n• Rule 7 ADR1 notice ready for SARS submission within 80-day limitation window\n• EMP501 interim reconciliation balanced with zero PAYE certificate variance'
  );

  // Invite Form State
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    firm: '',
    sarsPr: '',
    body: 'SAIT' as ProfessionalBody,
    specialization: 'Corporate & SME Tax Advisory',
    validityDays: '90',
    canViewProfile: false,
    canViewTransactions: true,
    canViewVat: true,
    canViewVault: true,
    canViewIta34: true,
    canViewShields: true,
    canExportDossiers: true,
    canSubmitOnBehalf: false,
    maskingLevel: 'FULL_ACCESS' as 'FULL_ACCESS' | 'MASK_PERSONAL_IDENTIFIERS' | 'AGGREGATED_ONLY'
  });

  // Scheduling Form State
  const [scheduleForm, setScheduleForm] = useState({
    title: 'Pre-Filing Compliance Review & Vault Inspection',
    type: 'PRE_FILING_REVIEW' as ConsultationBooking['type'],
    date: '2026-10-22',
    timeSlot: '11:00 - 11:45 SAST',
    format: 'SECURE_VIDEO' as ConsultationBooking['meetingFormat'],
    notes: 'Review Section 11(a) Business Travel and Section 12BA Solar CoC evidence.',
    includeLogbook: true,
    includeVehicleAgreement: true,
    includeIta34: true,
    includeSolarCoc: true
  });

  // New Thread Form State
  const [newThreadForm, setNewThreadForm] = useState({
    title: '',
    category: 'ITA34_OBJECTION' as AdvisoryThread['category'],
    priority: 'NORMAL' as AdvisoryThread['priority'],
    initialMessage: ''
  });

  // In-Thread Composer State
  const [chatInput, setChatInput] = useState('');
  const [selectedAttachmentType, setSelectedAttachmentType] = useState<string>('none');

  // Directory Search Filter
  const [directorySearch, setDirectorySearch] = useState('');
  const [selectedBodyFilter, setSelectedBodyFilter] = useState<string>('ALL');

  // Currently Selected Active Practitioner
  const activePractitioner = practitioners.find(p => p.id === selectedPractitionerId) || practitioners[0];
  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];
  const currentThreadMessages = messages.filter(m => m.threadId === activeThread?.id);

  // =========================================================================
  // ACTIONS & HANDLERS
  // =========================================================================

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showBanner(`Copied ${label} to clipboard`);
  };

  // Toggle specific permission with live audit logging
  const handleTogglePermission = (
    practitionerId: string, 
    permKey: keyof TaxProfessionalPermissions
  ) => {
    setPractitioners(prev => prev.map(p => {
      if (p.id !== practitionerId) return p;
      const currentVal = p.permissions[permKey];
      const updatedPerms = { ...p.permissions, [permKey]: !currentVal };
      return { ...p, permissions: updatedPerms };
    }));

    const permName = String(permKey);
    addAuditLog(
      'PRACTITIONER_PERMISSION_MODIFIED',
      `Permission '${permName}' updated for ${activePractitioner.practitionerName} (PR: ${activePractitioner.sarsPrNumber}).`,
      'info'
    );
    showBanner(`Permission '${permName}' updated for ${activePractitioner.practitionerName}`);
  };

  const handleMaskingLevelChange = (
    practitionerId: string, 
    level: 'FULL_ACCESS' | 'MASK_PERSONAL_IDENTIFIERS' | 'AGGREGATED_ONLY'
  ) => {
    setPractitioners(prev => prev.map(p => {
      if (p.id !== practitionerId) return p;
      return { ...p, permissions: { ...p.permissions, dataMaskingLevel: level } };
    }));
    addAuditLog(
      'POPIA_DATA_MASKING_CHANGED',
      `Practitioner data masking level set to ${level} for ${activePractitioner.practitionerName}.`,
      'warn'
    );
    showBanner(`Data minimization rule updated to ${level}`);
  };

  // Emergency Kill Switch: Revoke All Access
  const handleRevokePractitionerAccess = (practitionerId: string) => {
    const target = practitioners.find(p => p.id === practitionerId);
    if (!target) return;

    if (!confirm(`Are you sure you want to revoke all access for ${target.practitionerName}? They will immediately lose access to your financial records, audit vault, and tax returns.`)) {
      return;
    }

    setPractitioners(prev => prev.map(p => {
      if (p.id !== practitionerId) return p;
      return {
        ...p,
        inviteStatus: 'REVOKED',
        permissions: {
          canViewProfileAndFica: false,
          canViewTransactions: false,
          canViewVatDeclarations: false,
          canViewAuditVault: false,
          canViewIta34AndObjections: false,
          canViewTaxShieldSimulations: false,
          canExportDossiers: false,
          canSubmitFilingsOnBehalf: false,
          dataMaskingLevel: 'AGGREGATED_ONLY'
        }
      };
    }));

    // Record in Access Logs
    const newLog: PractitionerAccessEvent = {
      id: `ACC-REVOKE-${Date.now()}`,
      practitionerName: target.practitionerName,
      timestamp: new Date().toISOString(),
      action: 'EMERGENCY_KILL_SWITCH_REVOKED',
      resource: 'All Scopes & Active Token Invalidated',
      ipAddress: '127.0.0.1 (Owner Override)',
      status: 'BLOCKED_SCOPE'
    };
    setAccessLogs(prev => [newLog, ...prev]);

    addAuditLog(
      'KILL_SWITCH_TRIGGERED',
      `EMERGENCY ACCESS REVOKED: All permissions and access tokens for ${target.practitionerName} (${target.sarsPrNumber}) were terminated.`,
      'crit'
    );
    showBanner(`Access for ${target.practitionerName} has been immediately revoked.`);
  };

  // Re-activate or re-invite
  const handleReactivateAccess = (practitionerId: string) => {
    setPractitioners(prev => prev.map(p => {
      if (p.id !== practitionerId) return p;
      return {
        ...p,
        inviteStatus: 'ACTIVE_CONNECTED',
        expiresAt: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(),
        permissions: {
          ...p.permissions,
          canViewTransactions: true,
          canViewAuditVault: true,
          canViewIta34AndObjections: true
        }
      };
    }));
    addAuditLog(
      'PRACTITIONER_ACCESS_RESTORED',
      `Restored active connection for ${activePractitioner.practitionerName}.`,
      'info'
    );
    showBanner(`Connection restored for ${activePractitioner.practitionerName}`);
  };

  // Create new invitation
  const handleSubmitInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.email || !inviteForm.sarsPr) {
      showBanner('Please fill in Practitioner Name, Email, and SARS PR Number.');
      return;
    }

    const tokenHex = `STPC-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const days = parseInt(inviteForm.validityDays, 10) || 90;
    const expiresAt = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();

    const newInvite: TaxPractitionerInvite = {
      id: `PRAC-${Date.now()}`,
      practitionerName: inviteForm.name,
      practitionerEmail: inviteForm.email,
      firmName: inviteForm.firm || 'Independent Tax Practice',
      sarsPrNumber: inviteForm.sarsPr,
      professionalBody: inviteForm.body,
      specialization: inviteForm.specialization,
      inviteStatus: 'PENDING_INVITE',
      invitedAt: new Date().toISOString(),
      expiresAt,
      inviteToken: tokenHex,
      pinCode: pin,
      sarsMandateSigned: false,
      permissions: {
        canViewProfileAndFica: inviteForm.canViewProfile,
        canViewTransactions: inviteForm.canViewTransactions,
        canViewVatDeclarations: inviteForm.canViewVat,
        canViewAuditVault: inviteForm.canViewVault,
        canViewIta34AndObjections: inviteForm.canViewIta34,
        canViewTaxShieldSimulations: inviteForm.canViewShields,
        canExportDossiers: inviteForm.canExportDossiers,
        canSubmitFilingsOnBehalf: inviteForm.canSubmitOnBehalf,
        dataMaskingLevel: inviteForm.maskingLevel
      }
    };

    setPractitioners(prev => [newInvite, ...prev]);
    setSelectedPractitionerId(newInvite.id);
    setShowInviteModal(false);

    addAuditLog(
      'TAX_PROFESSIONAL_INVITED',
      `Issued secure invitation to ${newInvite.practitionerName} (${newInvite.sarsPrNumber}, ${newInvite.professionalBody}). Token: ${newInvite.inviteToken}. Valid for ${days} days.`,
      'info'
    );
    showBanner(`Invitation created for ${newInvite.practitionerName}. Token generated.`);
  };

  // Pre-fill invite from Certified Directory
  const handleInviteFromDirectory = (doc: CertifiedPractitionerDirectoryEntry) => {
    setInviteForm({
      name: `${doc.name}, ${doc.bodyDesignation}`,
      email: `${doc.name.toLowerCase().replace(/[^a-z]/g, '')}@taxpractice.co.za`,
      firm: doc.firmName,
      sarsPr: doc.sarsPrNumber,
      body: doc.professionalBody,
      specialization: doc.specialties.join(' • '),
      validityDays: '90',
      canViewProfile: false,
      canViewTransactions: true,
      canViewVat: true,
      canViewVault: true,
      canViewIta34: true,
      canViewShields: true,
      canExportDossiers: true,
      canSubmitOnBehalf: false,
      maskingLevel: 'FULL_ACCESS'
    });
    setShowInviteModal(true);
  };

  // Send Chat Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() && selectedAttachmentType === 'none') return;

    let attachments: any[] = [];
    if (selectedAttachmentType === 'logbook') {
      attachments.push({
        id: `ATT-${Date.now()}-1`,
        name: 'Logbook_2026.pdf (Logbook ID #789)',
        type: 'logbook',
        referenceId: 'LOGBOOK-#789',
        badge: 'Vault Corroborated',
        summary: '12,450 km verified business travel under Section 11(a)'
      });
    } else if (selectedAttachmentType === 'purchase_agreement') {
      attachments.push({
        id: `ATT-${Date.now()}-2`,
        name: 'Vehicle_Purchase_Agreement.pdf',
        type: 'document',
        referenceId: 'VAULT-VPA-2024',
        badge: 'Signed Contract',
        summary: 'Toyota Fortuner 2.8 GD-6 RB ownership agreement'
      });
    } else if (selectedAttachmentType === 'solar_coc') {
      attachments.push({
        id: `ATT-${Date.now()}-3`,
        name: 'Solar_Electrical_CoC_Certificate.pdf',
        type: 'document',
        referenceId: 'VAULT-COC-SOLAR-01',
        badge: 'CoC Verified',
        summary: 'Section 12BA 125% solar super-allowance compliance certificate'
      });
    } else if (selectedAttachmentType === 'ita34_assessment') {
      attachments.push({
        id: `ATT-${Date.now()}-4`,
        name: 'ITA34_Notice_of_Assessment_2026.pdf',
        type: 'assessment',
        referenceId: 'ITA34-ADJ-4015',
        badge: 'SARS Assessment',
        summary: 'Source Code 4015 writeback to R0 requiring Rule 7 objection'
      });
    }

    const senderRole = isPractitionerMode ? 'Practitioner' : 'Taxpayer';
    const senderName = isPractitionerMode 
      ? activePractitioner.practitionerName 
      : `${profile.name.substring(0, 20)} (Taxpayer)`;

    const newMsg: AdvisoryMessage = {
      id: `MSG-${Date.now()}`,
      threadId: activeThread.id,
      senderRole,
      senderName,
      timestamp: new Date().toISOString(),
      message: chatInput.trim() || 'Attached corroborating tax documentation from vault.',
      attachments: attachments.length > 0 ? attachments : undefined,
      isEncrypted: true,
      encryptionAlgorithm: 'AES-256-GCM / Ephemeral Key'
    };

    setMessages(prev => [...prev, newMsg]);
    setChatInput('');
    setSelectedAttachmentType('none');

    // Update thread lastUpdated
    setThreads(prev => prev.map(t => {
      if (t.id === activeThread.id) {
        return { ...t, lastUpdated: new Date().toISOString() };
      }
      return t;
    }));

    addAuditLog(
      'ADVISORY_MESSAGE_SENT',
      `Secure message transmitted in thread '${activeThread.title}' with ${attachments.length} attachment(s).`,
      'info'
    );
  };

  // Practitioner Action: Digital Stamp & Sign Off
  const handlePractitionerSignOff = (threadId: string) => {
    const targetThread = threads.find(t => t.id === threadId);
    if (!targetThread) return;

    const stampHash = `SHA256:${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`;
    const signOffData = {
      practitionerName: activePractitioner.practitionerName,
      sarsPrNumber: activePractitioner.sarsPrNumber,
      signedAt: new Date().toISOString(),
      opinionSummary: `Formal statutory opinion executed under Section 240 of the TAA. All corroborating documents meet evidentiary standards for Rule 7 ADR1 lodgement.`,
      referenceHash: stampHash
    };

    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        return {
          ...t,
          status: 'SIGNED_OFF',
          formalSignOff: signOffData
        };
      }
      return t;
    }));

    // Post an automated practitioner sign-off message in the thread
    const stampMsg: AdvisoryMessage = {
      id: `MSG-STAMP-${Date.now()}`,
      threadId,
      senderRole: 'Practitioner',
      senderName: activePractitioner.practitionerName,
      timestamp: new Date().toISOString(),
      message: `⭐ FORMAL PRACTITIONER SIGN-OFF ISSUED ⭐\n\nPractitioner: ${activePractitioner.practitionerName}\nSARS PR Number: ${activePractitioner.sarsPrNumber} (${activePractitioner.professionalBody})\nCryptographic Verification Hash: ${stampHash}\n\nAll attached evidence and Rule 7 legal grounds have been certified. The objection package is authorized for submission to SARS.`,
      isEncrypted: true,
      encryptionAlgorithm: 'AES-256-GCM / Ephemeral Key'
    };
    setMessages(prev => [...prev, stampMsg]);

    addAuditLog(
      'PRACTITIONER_SIGN_OFF',
      `Formal Tax Opinion and sign-off executed by ${activePractitioner.practitionerName} (${activePractitioner.sarsPrNumber}) for thread '${targetThread.title}'. Hash: ${stampHash}.`,
      'info'
    );
    showBanner(`Formal sign-off executed by ${activePractitioner.practitionerName}`);
  };

  // Submit Schedule Consultation
  const handleSubmitSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const preparedDocs: string[] = [];
    if (scheduleForm.includeLogbook) preparedDocs.push('Logbook_2026.pdf (Logbook ID #789, 12,450 km)');
    if (scheduleForm.includeVehicleAgreement) preparedDocs.push('Vehicle_Purchase_Agreement.pdf');
    if (scheduleForm.includeIta34) preparedDocs.push('ITA34_Notice_of_Assessment_2026.pdf');
    if (scheduleForm.includeSolarCoc) preparedDocs.push('Solar_Electrical_CoC_Certificate.pdf');

    const duration = scheduleForm.type === 'PRE_FILING_REVIEW' ? 30 : scheduleForm.type === 'SARS_AUDIT_DEFENCE' ? 45 : 60;
    const meetingRoomId = `room-${Math.random().toString(36).substring(2, 8)}`;
    const meetingLink = scheduleForm.format === 'SECURE_VIDEO' 
      ? `https://video.zat-secure.co.za/${meetingRoomId}`
      : undefined;

    const newBooking: ConsultationBooking = {
      id: `CONS-${Date.now()}`,
      practitionerId: activePractitioner.id,
      practitionerName: activePractitioner.practitionerName,
      title: scheduleForm.title,
      type: scheduleForm.type,
      date: scheduleForm.date,
      timeSlot: scheduleForm.timeSlot,
      durationMinutes: duration,
      meetingFormat: scheduleForm.format,
      meetingLink,
      officeAddress: scheduleForm.format === 'IN_OFFICE' ? 'Sandton City Office Towers, Level 14, JHB' : undefined,
      status: 'CONFIRMED',
      agendaItems: [
        'Statutory review of ledger and tax position',
        'Verification of Audit-Ready Vault documents',
        'Direct SARS eFiling alignment and compliance roadmap'
      ],
      preparedVaultDocuments: preparedDocs,
      notes: scheduleForm.notes,
      createdAt: new Date().toISOString()
    };

    setConsultations(prev => [newBooking, ...prev]);
    setShowScheduleModal(false);

    addAuditLog(
      'CONSULTATION_SCHEDULED',
      `Booked ${newBooking.title} with ${newBooking.practitionerName} on ${newBooking.date} at ${newBooking.timeSlot} (${newBooking.meetingFormat}).`,
      'info'
    );
    showBanner(`Consultation scheduled for ${newBooking.date} (${newBooking.timeSlot})`);
  };

  // Download .ICS calendar invite file
  const handleDownloadIcs = (consultation: ConsultationBooking) => {
    const cleanDate = consultation.date.replace(/-/g, '');
    const startTime = '100000Z';
    const endTime = '104500Z';
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ZAtax Compliance Companion//Tax Professional Connect//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${consultation.id}@zat-compliance.co.za`,
      `DTSTAMP:${cleanDate}T${startTime}`,
      `DTSTART:${cleanDate}T${startTime}`,
      `DTEND:${cleanDate}T${endTime}`,
      `SUMMARY:${consultation.title}`,
      `DESCRIPTION:ZAtax Professional Consultation with ${consultation.practitionerName}. Attached Vault Docs: ${consultation.preparedVaultDocuments.join(', ')}. Meeting Link: ${consultation.meetingLink || 'In-Office'}`,
      `LOCATION:${consultation.meetingLink || consultation.officeAddress || 'Virtual Meeting'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    downloadBlobFile(
      icsContent,
      `Consultation_${consultation.id}_${consultation.date}.ics`,
      'text/calendar'
    );
    showBanner('Downloaded .ICS Calendar file for Outlook & Google Calendar');
  };

  // Download SARS Mandate / Power of Attorney Document
  const handleDownloadSarsMandate = (practitioner: TaxPractitionerInvite) => {
    const ref = practitioner.mandateReference || `POA-SARS-${Date.now().toString().slice(-6)}`;
    const mandateDoc = [
      '========================================================================================',
      'SPECIAL POWER OF ATTORNEY / PRACTITIONER APPOINTMENT MANDATE',
      'In Terms of Section 240 of the Tax Administration Act 28 of 2011 (TAA)',
      '========================================================================================',
      '',
      `MANDATE REFERENCE : ${ref}`,
      `DATE OF EXECUTION : ${new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      `TAXPAYER NAME     : ${profile.name}`,
      `ENTITY TYPE       : ${profile.entityType}`,
      `SARS TAX REF NO   : ${profile.sarsTaxNumber || '9304318273'}`,
      `VAT NUMBER        : ${profile.vatNumber || '4010294821'}`,
      `FICA STATUS       : ${profile.ficaStatus || 'Verified'}`,
      '',
      'APPOINTED REGISTERED TAX PRACTITIONER:',
      `PRACTITIONER NAME : ${practitioner.practitionerName}`,
      `FIRM NAME         : ${practitioner.firmName}`,
      `SARS PR NUMBER    : ${practitioner.sarsPrNumber}`,
      `CONTROLLING BODY  : ${practitioner.professionalBody} (Recognized under Section 240A of the TAA)`,
      `EMAIL ADDRESS     : ${practitioner.practitionerEmail}`,
      '',
      'AUTHORIZED STATUTORY ACCESS SCOPES:',
      `1. Financial Transactions & General Ledger     : ${practitioner.permissions.canViewTransactions ? 'GRANTED' : 'DENIED'}`,
      `2. VAT201 Returns & Input Tax Invoices          : ${practitioner.permissions.canViewVatDeclarations ? 'GRANTED' : 'DENIED'}`,
      `3. Audit-Ready Vault & Corroborating Records   : ${practitioner.permissions.canViewAuditVault ? 'GRANTED' : 'DENIED'}`,
      `4. ITA34 Assessments & Rule 7 ADR1 Disputes    : ${practitioner.permissions.canViewIta34AndObjections ? 'GRANTED' : 'DENIED'}`,
      `5. Statutory Concessions (§12BA, §24J, SBC)    : ${practitioner.permissions.canViewTaxShieldSimulations ? 'GRANTED' : 'DENIED'}`,
      `6. Data Minimization / Masking Level           : ${practitioner.permissions.dataMaskingLevel}`,
      '',
      'TERMS OF MANDATE:',
      '1. The taxpayer hereby authorizes the registered tax practitioner to access and audit tax data.',
      '2. All data transmitted through the ZAtax platform is encrypted with client-side ephemeral keys.',
      '3. In accordance with POPIA Section 19, the practitioner agrees to maintain strict confidentiality.',
      '4. This mandate may be revoked at any instant via the platform Emergency Kill Switch.',
      '',
      'DIGITALLY EXECUTED VIA ZATAX COMPLIANCE COMPANION',
      `TAXPAYER SIGNATURE : V Zenzile [DIRECTOR - OTP VERIFIED ${new Date().toISOString()}]`,
      `PRACTITIONER STAMP : ${practitioner.sarsPrNumber} [DIGITALLY ACCEPTED]`,
      '========================================================================================'
    ].join('\n');

    downloadBlobFile(
      mandateDoc,
      `SARS_Mandate_POA_${practitioner.sarsPrNumber}_${ref}.txt`,
      'text/plain'
    );
    showBanner(`Generated Section 240 TAA Power of Attorney Mandate (${ref})`);
  };

  // Launch Simulated Video Room
  const handleLaunchVideoRoom = (booking: ConsultationBooking) => {
    setActiveVideoBooking(booking);
    setShowVideoRoomModal(true);
    addAuditLog(
      'CONSULTATION_ROOM_ENTERED',
      `Entered encrypted consultation room for '${booking.title}' with ${booking.practitionerName}.`,
      'info'
    );
  };

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className="space-y-6">
      
      {/* 1. TOP HEADER & PRACTITIONER MODE SWITCHER */}
      <div className={`p-5 rounded-2xl border transition-all duration-300 ${
        isPractitionerMode 
          ? 'bg-gradient-to-r from-purple-950/70 via-indigo-950/60 to-slate-900 border-purple-500/50 shadow-lg shadow-purple-950/40' 
          : 'bg-[#0E131F] border-slate-800'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30">
                <Briefcase className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white font-display">Tax Professional Connect</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    §240 TAA READY
                  </span>
                  {isPractitionerMode && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/30 text-purple-200 border border-purple-400/50 animate-pulse">
                      PRACTITIONER VIEW ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Secure, cryptographic client-practitioner collaboration, granular permission scopes, and accredited tax advisory under Section 240 of the Tax Administration Act.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View As Practitioner Toggle */}
            <button
              onClick={() => {
                const nextMode = !isPractitionerMode;
                setIsPractitionerMode(nextMode);
                showBanner(nextMode 
                  ? `Switched to Tax Professional View (${activePractitioner.practitionerName})` 
                  : 'Returned to Taxpayer / Owner View'
                );
                addAuditLog(
                  'PORTAL_VIEW_TOGGLED',
                  nextMode 
                    ? `Simulated portal view changed to Tax Practitioner: ${activePractitioner.practitionerName}.`
                    : 'Returned to Taxpayer / Owner View.',
                  'info'
                );
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                isPractitionerMode
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30 ring-2 ring-purple-400/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
              }`}
            >
              {isPractitionerMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{isPractitionerMode ? 'Exit Practitioner View' : 'Simulate Practitioner View'}</span>
            </button>

            {/* Invite Button */}
            {!isPractitionerMode && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite Tax Practitioner</span>
              </button>
            )}

            {/* Schedule Consultation Button */}
            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center gap-1.5 shadow-md shadow-cyan-950/40 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Schedule Consultation</span>
            </button>
          </div>
        </div>

        {/* Practitioner Simulation Banner */}
        {isPractitionerMode && (
          <div className="mt-4 p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <span className="font-semibold text-purple-200">You are experiencing the app through the eyes of: </span>
                <span className="font-mono text-white font-bold">{activePractitioner.practitionerName}</span>
                <span className="text-purple-300 ml-1">({activePractitioner.sarsPrNumber} • {activePractitioner.professionalBody})</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono text-purple-300 bg-purple-900/40 px-2 py-0.5 rounded border border-purple-700/50">
                Masking: {activePractitioner.permissions.dataMaskingLevel}
              </span>
              <button
                onClick={() => handlePractitionerSignOff(activeThread.id)}
                className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition shadow"
              >
                <Award className="w-3 h-3" />
                <span>Execute Tax Sign-Off</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. TAB NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto scrollbar-thin">
        <button
          onClick={() => setActiveTab('practitioners')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'practitioners'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Connected Practitioners</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/30 text-emerald-300 font-mono">
            {practitioners.filter(p => p.inviteStatus === 'ACTIVE_CONNECTED').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'permissions'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Sharing & Permission Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('messages')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'messages'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>In-App Advisory Threads</span>
          {threads.reduce((sum, t) => sum + t.unreadCount, 0) > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500 text-white font-mono animate-pulse">
              {threads.reduce((sum, t) => sum + t.unreadCount, 0)}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('consultations')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'consultations'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Consultations & Video Rooms</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/30 text-amber-300 font-mono">
            {consultations.filter(c => c.status === 'CONFIRMED').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('directory')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'directory'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Verified SARS Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('audit_access')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'audit_access'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Practitioner Access Logs</span>
        </button>
      </div>

      {/* 3. TAB 1: CONNECTED PRACTITIONERS */}
      {activeTab === 'practitioners' && (
        <div className="space-y-6">
          
          {/* Active Practitioners Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {practitioners.map(prac => {
              const isSelected = prac.id === selectedPractitionerId;
              const isActive = prac.inviteStatus === 'ACTIVE_CONNECTED';
              const isRevoked = prac.inviteStatus === 'REVOKED';

              return (
                <div 
                  key={prac.id}
                  onClick={() => setSelectedPractitionerId(prac.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected 
                      ? 'bg-slate-900/90 border-emerald-500/50 ring-1 ring-emerald-500/30 shadow-lg' 
                      : 'bg-[#0E131F]/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/30 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold font-display text-base">
                        {prac.practitionerName.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-base font-display">{prac.practitionerName}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            isActive 
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                              : isRevoked
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {prac.inviteStatus.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{prac.firmName}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-[11px] font-bold">
                        {prac.sarsPrNumber}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Controlling Body</span>
                      <span className="font-medium text-slate-200">{prac.professionalBody} (Accredited)</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Specialization</span>
                      <span className="font-medium text-slate-200 truncate block">{prac.specialization}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Access Token</span>
                      <span className="font-mono text-cyan-400 text-[11px]">{prac.inviteToken}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Mandate Status</span>
                      <span className="font-medium text-emerald-400 flex items-center gap-1">
                        {prac.sarsMandateSigned ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3 text-amber-400" />}
                        {prac.sarsMandateSigned ? 'POA Signed §240' : 'Awaiting Acceptance'}
                      </span>
                    </div>
                  </div>

                  {/* Active Permissions Summary Chips */}
                  <div className="mt-4 flex flex-wrap gap-1">
                    {prac.permissions.canViewTransactions && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">Ledger</span>
                    )}
                    {prac.permissions.canViewVatDeclarations && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">VAT201</span>
                    )}
                    {prac.permissions.canViewAuditVault && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">Audit Vault</span>
                    )}
                    {prac.permissions.canViewIta34AndObjections && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">ITA34 / ADR1</span>
                    )}
                    {prac.permissions.canViewTaxShieldSimulations && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">Tax Shields</span>
                    )}
                  </div>

                  {/* Card Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2 text-xs">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadSarsMandate(prac);
                      }}
                      className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition"
                    >
                      <Download className="w-3 h-3 text-emerald-400" />
                      <span>Download Mandate</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {isRevoked ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReactivateAccess(prac.id);
                          }}
                          className="px-2.5 py-1 rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 cursor-pointer transition font-medium"
                        >
                          Restore Access
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRevokePractitionerAccess(prac.id);
                          }}
                          className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 cursor-pointer transition font-medium flex items-center gap-1"
                        >
                          <ShieldAlert className="w-3 h-3" />
                          <span>Revoke Access</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Practitioner Direct Inspection & Details Banner */}
          <div className="p-5 rounded-2xl bg-[#0E131F] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Selected Practitioner: {activePractitioner.practitionerName}</h3>
              </div>
              <button
                onClick={() => handleCopyText(`https://zat-app.ilitha.co.za/invite/${activePractitioner.inviteToken}?pin=${activePractitioner.pinCode}`, 'Invite Link & PIN')}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono flex items-center gap-1.5 border border-white/10 transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                <span>Copy Secure One-Time Link & PIN</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-500 block text-[11px]">SARS PR Credentials</span>
                <p className="font-mono text-cyan-300 font-bold text-sm mt-0.5">{activePractitioner.sarsPrNumber}</p>
                <p className="text-slate-400 text-[11px] mt-1">Verified with {activePractitioner.professionalBody} registry</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-500 block text-[11px]">Access Expiration Window</span>
                <p className="font-mono text-amber-300 font-bold text-sm mt-0.5">
                  {new Date(activePractitioner.expiresAt).toLocaleDateString('en-ZA')}
                </p>
                <p className="text-slate-400 text-[11px] mt-1">Automatic revocation upon expiry date</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-500 block text-[11px]">Security PIN</span>
                <p className="font-mono text-emerald-300 font-bold text-sm mt-0.5">{activePractitioner.pinCode}</p>
                <p className="text-slate-400 text-[11px] mt-1">6-digit secondary verification factor</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: SHARING & PERMISSIONS MATRIX */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[#0E131F] border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  <span>Granular Access Controls for {activePractitioner.practitionerName}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Changes take effect in real time. Each toggle triggers cryptographic scope validation and is logged to the POPIA audit ledger.
                </p>
              </div>

              {/* Emergency Kill Switch Button */}
              <button
                onClick={() => handleRevokePractitionerAccess(activePractitioner.id)}
                className="px-3.5 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600/40 text-rose-200 border border-rose-500/50 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-rose-950/40"
              >
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Emergency Kill Switch</span>
              </button>
            </div>

            {/* Scope Matrix List */}
            <div className="divide-y divide-white/5 pt-2">
              
              {/* Scope 1: Transactions & Ledger */}
              <div className="py-3.5 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">Financial Transactions & General Ledger</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300">READ-ONLY</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Allows practitioner to inspect all {transactions.length} categorized business transactions, deductible ratios, and Section 11(a) flags.
                  </p>
                </div>
                <button
                  onClick={() => handleTogglePermission(activePractitioner.id, 'canViewTransactions')}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    activePractitioner.permissions.canViewTransactions ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    activePractitioner.permissions.canViewTransactions ? 'left-6.5' : 'left-0.5'
                  }`} />
                </button>
              </div>

              {/* Scope 2: VAT201 Declarations & Tax Invoices */}
              <div className="py-3.5 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">VAT201 Declarations & Tax Invoices</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300">15% VAT</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Permits review of OCR scanned invoices ({invoices.length} records), input tax apportionment, and Box 1-19 calculation breakdowns.
                  </p>
                </div>
                <button
                  onClick={() => handleTogglePermission(activePractitioner.id, 'canViewVatDeclarations')}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    activePractitioner.permissions.canViewVatDeclarations ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    activePractitioner.permissions.canViewVatDeclarations ? 'left-6.5' : 'left-0.5'
                  }`} />
                </button>
              </div>

              {/* Scope 3: Audit-Ready Vault Documents */}
              <div className="py-3.5 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">Audit-Ready Vault (Rule 7 Corroborating Records)</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300">CRITICAL EVIDENCE</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Grants access to Logbook ID #789 (12,450 km), Vehicle Purchase Agreement, Solar Electrical CoC, and Section 18A donation receipts.
                  </p>
                </div>
                <button
                  onClick={() => handleTogglePermission(activePractitioner.id, 'canViewAuditVault')}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    activePractitioner.permissions.canViewAuditVault ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    activePractitioner.permissions.canViewAuditVault ? 'left-6.5' : 'left-0.5'
                  }`} />
                </button>
              </div>

              {/* Scope 4: ITA34 Assessments & Rule 7 Notice of Objection (ADR1) */}
              <div className="py-3.5 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">ITA34 Assessments & Rule 7 Notice of Objection (ADR1)</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300">DISPUTES</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Allows practitioner to formulate and digitally endorse the formal objection against Source Code 4015 adjustments within the 80-day limitation window.
                  </p>
                </div>
                <button
                  onClick={() => handleTogglePermission(activePractitioner.id, 'canViewIta34AndObjections')}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    activePractitioner.permissions.canViewIta34AndObjections ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    activePractitioner.permissions.canViewIta34AndObjections ? 'left-6.5' : 'left-0.5'
                  }`} />
                </button>
              </div>

              {/* Scope 5: Statutory Tax Shields & Concessions */}
              <div className="py-3.5 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">Statutory Tax Shields & Capital Concessions</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300">ALLOWANCES</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Grants access to Section 12BA (125% Solar), Section 24J (Compound Interest), Section 12H (SETA Learnership), and SBC §12E calculations.
                  </p>
                </div>
                <button
                  onClick={() => handleTogglePermission(activePractitioner.id, 'canViewTaxShieldSimulations')}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    activePractitioner.permissions.canViewTaxShieldSimulations ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    activePractitioner.permissions.canViewTaxShieldSimulations ? 'left-6.5' : 'left-0.5'
                  }`} />
                </button>
              </div>

              {/* Scope 6: Master Dossier Export */}
              <div className="py-3.5 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">Export Master Compliance Dossier</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300">PACKAGES</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Allows practitioner to download the unified 7-Module Master Compliance Autopilot Dossier with audit trail.
                  </p>
                </div>
                <button
                  onClick={() => handleTogglePermission(activePractitioner.id, 'canExportDossiers')}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    activePractitioner.permissions.canExportDossiers ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    activePractitioner.permissions.canExportDossiers ? 'left-6.5' : 'left-0.5'
                  }`} />
                </button>
              </div>

              {/* Scope 7: eFiling Delegate Submission */}
              <div className="py-3.5 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">Direct eFiling Submission Delegate</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300">REQUIRES OTP</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Permits the registered practitioner to submit returns directly to SARS on behalf of the company under TAA Section 240.
                  </p>
                </div>
                <button
                  onClick={() => handleTogglePermission(activePractitioner.id, 'canSubmitFilingsOnBehalf')}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    activePractitioner.permissions.canSubmitFilingsOnBehalf ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    activePractitioner.permissions.canSubmitFilingsOnBehalf ? 'left-6.5' : 'left-0.5'
                  }`} />
                </button>
              </div>

            </div>

            {/* POPIA Section 19 Data Minimization Selector */}
            <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>POPIA Data Masking & PII Protection Level</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    level: 'FULL_ACCESS' as const,
                    title: 'Full Audit Access',
                    desc: 'Full visibility of merchant names, director identities, and tax numbers.'
                  },
                  {
                    level: 'MASK_PERSONAL_IDENTIFIERS' as const,
                    title: 'Mask Personal PII',
                    desc: 'Director SA ID and personal bank account numbers masked under POPIA.'
                  },
                  {
                    level: 'AGGREGATED_ONLY' as const,
                    title: 'Aggregated Only',
                    desc: 'Only totals and tax codes visible; line items and names redacted.'
                  }
                ].map(opt => (
                  <button
                    key={opt.level}
                    onClick={() => handleMaskingLevelChange(activePractitioner.id, opt.level)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      activePractitioner.permissions.dataMaskingLevel === opt.level
                        ? 'bg-teal-500/15 border-teal-500/50 ring-1 ring-teal-500/30'
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-xs">{opt.title}</span>
                      {activePractitioner.permissions.dataMaskingLevel === opt.level && (
                        <Check className="w-3.5 h-3.5 text-teal-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 5. TAB 3: IN-APP ADVISORY THREADS & MESSAGING */}
      {activeTab === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Thread List Sidebar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span>Advisory Workpapers</span>
              </h3>
              <button
                onClick={() => setShowNewThreadModal(true)}
                className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
              >
                <Plus className="w-3 h-3" />
                <span>New Query</span>
              </button>
            </div>

            <div className="space-y-2">
              {threads.map(thread => {
                const isActive = thread.id === activeThreadId;
                return (
                  <div
                    key={thread.id}
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-indigo-950/40 border-indigo-500/50 ring-1 ring-indigo-500/30' 
                        : 'bg-[#0E131F] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-white text-xs line-clamp-1">{thread.title}</h4>
                      {thread.priority === 'STATUTORY_DEADLINE' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-500/20 text-rose-300 font-bold shrink-0">
                          DEADLINE
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                        thread.status === 'SIGNED_OFF' 
                          ? 'bg-emerald-500/20 text-emerald-300' 
                          : thread.status === 'IN_REVIEW'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {thread.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-slate-500 font-mono text-[10px]">
                        {new Date(thread.lastUpdated).toLocaleDateString('en-ZA')}
                      </span>
                    </div>

                    {thread.formalSignOff && (
                      <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1 text-[10px] text-emerald-400">
                        <Award className="w-3 h-3" />
                        <span className="truncate">Sign-Off by {thread.formalSignOff.practitionerName}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-[#0E131F] border border-slate-800 flex flex-col h-[600px]">
            
            {/* Thread Header */}
            <div className="pb-4 border-b border-white/10 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base font-display">{activeThread.title}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {activeThread.category}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Lock className="w-3 h-3" />
                    <span>AES-256-GCM Ephemeral Encryption Active</span>
                  </span>
                  <span>•</span>
                  <span>Practitioner: {activePractitioner.practitionerName}</span>
                </div>
              </div>

              {/* Thread Action / Sign-Off */}
              {!activeThread.formalSignOff ? (
                <button
                  onClick={() => handlePractitionerSignOff(activeThread.id)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition cursor-pointer shrink-0"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Execute Sign-Off</span>
                </button>
              ) : (
                <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>SIGNED OFF</span>
                </div>
              )}
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin">
              {currentThreadMessages.map(msg => {
                const isPractitioner = msg.senderRole === 'Practitioner';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isPractitioner ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1 px-1">
                      <span className={`font-semibold ${isPractitioner ? 'text-purple-300' : 'text-cyan-300'}`}>
                        {msg.senderName}
                      </span>
                      <span>•</span>
                      <span className="font-mono">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <Lock className="w-2.5 h-2.5 text-slate-500" title={msg.encryptionAlgorithm} />
                    </div>

                    <div className={`p-4 rounded-2xl max-w-[85%] text-xs leading-relaxed whitespace-pre-wrap ${
                      isPractitioner
                        ? 'bg-purple-950/40 text-purple-100 border border-purple-500/30 rounded-tl-sm'
                        : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tr-sm'
                    }`}>
                      {msg.message}

                      {/* Attachments inside message */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                            Corroborating Vault Attachments:
                          </span>
                          {msg.attachments.map(att => (
                            <div
                              key={att.id}
                              className="p-2 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                                <div>
                                  <span className="font-semibold text-white block">{att.name}</span>
                                  {att.summary && (
                                    <span className="text-[10px] text-slate-400 block">{att.summary}</span>
                                  )}
                                </div>
                              </div>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 shrink-0">
                                {att.badge || 'VERIFIED'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Message Composer */}
            <form onSubmit={handleSendMessage} className="pt-3 border-t border-white/10 space-y-2">
              
              {/* Attachment Picker */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
                  <Paperclip className="w-3 h-3 text-cyan-400" />
                  <span>Attach from Vault:</span>
                </span>
                <select
                  value={selectedAttachmentType}
                  onChange={(e) => setSelectedAttachmentType(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 cursor-pointer focus:border-cyan-400 focus:outline-none"
                >
                  <option value="none">No Attachment</option>
                  <option value="logbook">Logbook #789 (12,450 km Travel Log)</option>
                  <option value="purchase_agreement">Vehicle Purchase Agreement (Toyota Fortuner)</option>
                  <option value="ita34_assessment">ITA34 2026 Assessment (Code 4015 Writeback)</option>
                  <option value="solar_coc">Solar Electrical CoC Certificate (Section 12BA)</option>
                </select>
                {selectedAttachmentType !== 'none' && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
                    Ready to attach
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Write advisory note as ${isPractitionerMode ? activePractitioner.practitionerName : 'Taxpayer'}...`}
                  className="flex-1 bg-slate-900/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-indigo-950/40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </form>

          </div>

        </div>
      )}

      {/* 6. TAB 4: CONSULTATIONS & VIDEO ROOMS */}
      {activeTab === 'consultations' && (
        <div className="space-y-6">
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Scheduled Advisory Consultations</span>
              </h3>
              <p className="text-xs text-slate-400">
                Book structured review sessions with registered tax professionals, prepare vault agendas, and launch encrypted video consultation rooms.
              </p>
            </div>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-amber-950/40 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule New Session</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {consultations.map(consult => {
              const isConfirmed = consult.status === 'CONFIRMED';
              const isVideo = consult.meetingFormat === 'SECURE_VIDEO';

              return (
                <div
                  key={consult.id}
                  className="p-5 rounded-2xl bg-[#0E131F] border border-slate-800 hover:border-slate-700 transition space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isConfirmed 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}>
                          {consult.status}
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                          {consult.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-base font-display">{consult.title}</h4>
                      <p className="text-xs text-slate-400">With {consult.practitionerName}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-mono font-bold text-amber-300 block">{consult.timeSlot}</span>
                      <span className="text-[11px] text-slate-500 font-mono">{consult.date}</span>
                    </div>
                  </div>

                  {/* Format & Location */}
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      {isVideo ? (
                        <Video className="w-4 h-4 text-cyan-400" />
                      ) : consult.meetingFormat === 'PHONE_CONSULTATION' ? (
                        <Phone className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <MapPin className="w-4 h-4 text-amber-400" />
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-white block truncate">
                          {isVideo ? 'Encrypted Video Consultation' : consult.meetingFormat === 'PHONE_CONSULTATION' ? 'Direct Phone Consultation' : 'In-Office Practice Visit'}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {consult.meetingLink || consult.officeAddress || 'Secured Consultation Channel'}
                        </span>
                      </div>
                    </div>

                    {isVideo && isConfirmed && (
                      <button
                        onClick={() => handleLaunchVideoRoom(consult)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1 shadow"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join Room</span>
                      </button>
                    )}
                  </div>

                  {/* Pre-Loaded Agenda Items */}
                  <div className="space-y-1.5 text-xs">
                    <span className="text-[11px] text-slate-500 font-mono uppercase tracking-wider block">Session Agenda:</span>
                    <ul className="space-y-1">
                      {consult.agendaItems.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Prepared Vault Documents */}
                  {consult.preparedVaultDocuments && consult.preparedVaultDocuments.length > 0 && (
                    <div className="pt-2 border-t border-white/5 space-y-1 text-xs">
                      <span className="text-[10px] text-slate-500 font-mono uppercase block">Corroborating Vault Documents Linked:</span>
                      <div className="flex flex-wrap gap-1">
                        {consult.preparedVaultDocuments.map((doc, dIdx) => (
                          <span key={dIdx} className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                            <FileText className="w-2.5 h-2.5 text-cyan-400" />
                            <span>{doc}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                    <button
                      onClick={() => handleDownloadIcs(consult)}
                      className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      <span>Export to Calendar (.ICS)</span>
                    </button>

                    <span className="text-[10px] font-mono text-slate-500">
                      Duration: {consult.durationMinutes} min
                    </span>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* 7. TAB 5: CERTIFIED SARS DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Search className="w-4 h-4 text-teal-400" />
                <span>Verified South African Registered Tax Practitioners</span>
              </h3>
              <p className="text-xs text-slate-400">
                Directly invite accredited tax specialists recognized under Section 240A of the Tax Administration Act 28 of 2011.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search by name, specialty, or PR..."
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
              />

              <select
                value={selectedBodyFilter}
                onChange={(e) => setSelectedBodyFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Bodies</option>
                <option value="SAIT">SAIT</option>
                <option value="SAICA">SAICA</option>
                <option value="CIBA">CIBA</option>
                <option value="ACCA">ACCA</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certifiedDirectoryList
              .filter(doc => {
                const matchesSearch = doc.name.toLowerCase().includes(directorySearch.toLowerCase()) ||
                  doc.specialties.some(s => s.toLowerCase().includes(directorySearch.toLowerCase())) ||
                  doc.sarsPrNumber.toLowerCase().includes(directorySearch.toLowerCase());
                const matchesBody = selectedBodyFilter === 'ALL' || doc.professionalBody === selectedBodyFilter;
                return matchesSearch && matchesBody;
              })
              .map(doc => (
                <div
                  key={doc.id}
                  className="p-5 rounded-2xl bg-[#0E131F] border border-slate-800 hover:border-slate-700 transition space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-600/30 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold font-display text-base">
                        {doc.avatarInitials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-base">{doc.name}</h4>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-teal-500/20 text-teal-300 border border-teal-500/30">
                            {doc.professionalBody}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{doc.bodyDesignation} • {doc.firmName}</p>
                      </div>
                    </div>

                    <span className="font-mono text-cyan-300 text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-bold">
                      {doc.sarsPrNumber}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <span className="text-[10px] text-slate-500 font-mono uppercase block">Key Statutory Specializations:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {doc.specialties.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-[11px] bg-slate-800/80 text-slate-300 border border-slate-700">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Location & Rate</span>
                      <span className="text-slate-300 font-medium">{doc.location} • R {doc.hourlyRateZAR}/hr</span>
                    </div>

                    <button
                      onClick={() => handleInviteFromDirectory(doc)}
                      className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Invite Practitioner</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>

        </div>
      )}

      {/* 8. TAB 6: PRACTITIONER ACCESS AUDIT LOGS */}
      {activeTab === 'audit_access' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Practitioner Access & Inspection Log</span>
              </h3>
              <p className="text-xs text-slate-400">
                High-fidelity, tamper-evident chronological ledger tracking every file access, assessment query, and permission event by external practitioners.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs font-mono">
              {accessLogs.length} Events Logged
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0E131F] border border-slate-800 divide-y divide-white/5">
            {accessLogs.map(log => {
              const isPermitted = log.status === 'PERMITTED';
              return (
                <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isPermitted ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {log.status}
                      </span>
                      <span className="font-semibold text-white">{log.action}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-cyan-300">{log.practitionerName}</span>
                    </div>
                    <p className="text-slate-400 font-mono text-[11px]">{log.resource}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-slate-500 font-mono text-[10px] block">
                      {new Date(log.timestamp).toLocaleString('en-ZA')}
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono">{log.ipAddress}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: INVITE PRACTITIONER */}
      {/* ========================================================================= */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0E131F] border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto scrollbar-thin shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Invite Registered Tax Practitioner</h3>
              </div>
              <button 
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitInvite} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Practitioner Full Name *</label>
                  <input
                    type="text"
                    required
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    placeholder="e.g. Adv. Nomvula Sithole"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Practitioner Email *</label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="practitioner@taxadvisory.co.za"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">SARS PR Number *</label>
                  <input
                    type="text"
                    required
                    value={inviteForm.sarsPr}
                    onChange={(e) => setInviteForm({ ...inviteForm, sarsPr: e.target.value })}
                    placeholder="e.g. PR-0089421"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Controlling Body</label>
                  <select
                    value={inviteForm.body}
                    onChange={(e) => setInviteForm({ ...inviteForm, body: e.target.value as ProfessionalBody })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none"
                  >
                    <option value="SAIT">SAIT (Institute of Taxation)</option>
                    <option value="SAICA">SAICA (CA(SA))</option>
                    <option value="CIBA">CIBA (Chartered Accountants)</option>
                    <option value="ACCA">ACCA</option>
                    <option value="IAC">IAC</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Validity Period</label>
                  <select
                    value={inviteForm.validityDays}
                    onChange={(e) => setInviteForm({ ...inviteForm, validityDays: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none"
                  >
                    <option value="30">30 Days (Tax Return Review)</option>
                    <option value="90">90 Days (Dispute / Audit Window)</option>
                    <option value="180">180 Days (Half Year)</option>
                    <option value="365">365 Days (Full Tax Year)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Practice / Advisory Firm Name</label>
                <input
                  type="text"
                  value={inviteForm.firm}
                  onChange={(e) => setInviteForm({ ...inviteForm, firm: e.target.value })}
                  placeholder="e.g. Sithole & Partners Tax Advocates Inc."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Initial Permission Matrix */}
              <div className="pt-2 border-t border-white/5 space-y-2">
                <label className="font-semibold text-white block">Initial Access Scopes to Grant:</label>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inviteForm.canViewTransactions}
                      onChange={(e) => setInviteForm({ ...inviteForm, canViewTransactions: e.target.checked })}
                      className="accent-emerald-500"
                    />
                    <span>Financial Ledger</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inviteForm.canViewVat}
                      onChange={(e) => setInviteForm({ ...inviteForm, canViewVat: e.target.checked })}
                      className="accent-emerald-500"
                    />
                    <span>VAT201 Invoices</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inviteForm.canViewVault}
                      onChange={(e) => setInviteForm({ ...inviteForm, canViewVault: e.target.checked })}
                      className="accent-emerald-500"
                    />
                    <span>Audit-Ready Vault</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inviteForm.canViewIta34}
                      onChange={(e) => setInviteForm({ ...inviteForm, canViewIta34: e.target.checked })}
                      className="accent-emerald-500"
                    />
                    <span>ITA34 & Objections</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inviteForm.canViewShields}
                      onChange={(e) => setInviteForm({ ...inviteForm, canViewShields: e.target.checked })}
                      className="accent-emerald-500"
                    />
                    <span>§12BA/24J Concessions</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inviteForm.canExportDossiers}
                      onChange={(e) => setInviteForm({ ...inviteForm, canExportDossiers: e.target.checked })}
                      className="accent-emerald-500"
                    />
                    <span>Dossier Download</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Generate Invitation & PIN</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SCHEDULE CONSULTATION */}
      {/* ========================================================================= */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0E131F] border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto scrollbar-thin shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Schedule Tax Advisory Consultation</h3>
              </div>
              <button 
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSchedule} className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Session Title</label>
                <input
                  type="text"
                  required
                  value={scheduleForm.title}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                  placeholder="e.g. Pre-Filing Review & Section 11(a) Travel Deduction"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Session Type</label>
                  <select
                    value={scheduleForm.type}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, type: e.target.value as ConsultationBooking['type'] })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none"
                  >
                    <option value="PRE_FILING_REVIEW">Pre-Filing Compliance Review (30 min)</option>
                    <option value="SARS_AUDIT_DEFENCE">SARS Audit Defence & ADR1 Objection (45 min)</option>
                    <option value="YEAR_END_OPTIMIZATION">Year-End Capital Allowances (§12BA/24J) (60 min)</option>
                    <option value="QUICK_COMPLIANCE_SYNC">Quick Compliance Sync (15 min)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Meeting Format</label>
                  <select
                    value={scheduleForm.format}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, format: e.target.value as ConsultationBooking['meetingFormat'] })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none"
                  >
                    <option value="SECURE_VIDEO">Encrypted Video Call (In-App)</option>
                    <option value="PHONE_CONSULTATION">Direct Telephone Consultation</option>
                    <option value="IN_OFFICE">In-Practice Office Consultation (Sandton)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Date (SAST)</label>
                  <input
                    type="date"
                    required
                    value={scheduleForm.date}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Time Slot (SAST)</label>
                  <select
                    value={scheduleForm.timeSlot}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, timeSlot: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none"
                  >
                    <option value="09:00 - 09:45 SAST">09:00 - 09:45 SAST</option>
                    <option value="10:00 - 10:45 SAST">10:00 - 10:45 SAST</option>
                    <option value="11:00 - 11:45 SAST">11:00 - 11:45 SAST</option>
                    <option value="14:00 - 14:45 SAST">14:00 - 14:45 SAST</option>
                    <option value="15:30 - 16:15 SAST">15:30 - 16:15 SAST</option>
                  </select>
                </div>
              </div>

              {/* Pre-Session Vault Checklist */}
              <div className="pt-2 border-t border-white/5 space-y-2">
                <label className="font-semibold text-white block">Pre-Attach Vault Evidence to Consultation Agenda:</label>
                <div className="space-y-1.5 text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleForm.includeLogbook}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, includeLogbook: e.target.checked })}
                      className="accent-amber-500"
                    />
                    <span>Attach Logbook ID #789 (12,450 km verified travel)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleForm.includeVehicleAgreement}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, includeVehicleAgreement: e.target.checked })}
                      className="accent-amber-500"
                    />
                    <span>Attach Signed Vehicle Purchase Agreement</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleForm.includeIta34}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, includeIta34: e.target.checked })}
                      className="accent-amber-500"
                    />
                    <span>Attach ITA34 2026 Assessment Notice (Code 4015 Writeback)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleForm.includeSolarCoc}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, includeSolarCoc: e.target.checked })}
                      className="accent-amber-500"
                    />
                    <span>Attach Solar Electrical CoC Certificate (§12BA 125%)</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Confirm Booking & Generate Invite</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: NEW ADVISORY THREAD */}
      {/* ========================================================================= */}
      {showNewThreadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0E131F] border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">Create Advisory Query Workpaper</h3>
              </div>
              <button 
                onClick={() => setShowNewThreadModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newThreadForm.title) return;
                const newT: AdvisoryThread = {
                  id: `THREAD-${Date.now()}`,
                  practitionerId: activePractitioner.id,
                  title: newThreadForm.title,
                  category: newThreadForm.category,
                  priority: newThreadForm.priority,
                  status: 'OPEN',
                  lastUpdated: new Date().toISOString(),
                  unreadCount: 0
                };
                setThreads(prev => [newT, ...prev]);
                setActiveThreadId(newT.id);
                if (newThreadForm.initialMessage) {
                  const initM: AdvisoryMessage = {
                    id: `MSG-${Date.now()}`,
                    threadId: newT.id,
                    senderRole: isPractitionerMode ? 'Practitioner' : 'Taxpayer',
                    senderName: isPractitionerMode ? activePractitioner.practitionerName : profile.name,
                    timestamp: new Date().toISOString(),
                    message: newThreadForm.initialMessage,
                    isEncrypted: true,
                    encryptionAlgorithm: 'AES-256-GCM / Ephemeral Key'
                  };
                  setMessages(prev => [...prev, initM]);
                }
                setShowNewThreadModal(false);
                setNewThreadForm({ title: '', category: 'ITA34_OBJECTION', priority: 'NORMAL', initialMessage: '' });
                showBanner(`Created advisory thread: ${newT.title}`);
              }}
              className="space-y-4 text-xs"
            >
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Topic Title *</label>
                <input
                  type="text"
                  required
                  value={newThreadForm.title}
                  onChange={(e) => setNewThreadForm({ ...newThreadForm, title: e.target.value })}
                  placeholder="e.g. Rule 7 Grounds Formulation for Travel Expense Deduction"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Category</label>
                  <select
                    value={newThreadForm.category}
                    onChange={(e) => setNewThreadForm({ ...newThreadForm, category: e.target.value as AdvisoryThread['category'] })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none"
                  >
                    <option value="ITA34_OBJECTION">ITA34 Objection & Rule 7</option>
                    <option value="PROVISIONAL_TAX">Provisional Tax (IRP6)</option>
                    <option value="VAT201_RECONCILIATION">VAT201 & Input Tax</option>
                    <option value="SECTION_12BA_SOLAR">Section 12BA 125% Solar</option>
                    <option value="AUDIT_PREPARATION">SARS Pre-Audit Preparation</option>
                    <option value="GENERAL_COMPLIANCE">General Corporate Tax</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Priority Level</label>
                  <select
                    value={newThreadForm.priority}
                    onChange={(e) => setNewThreadForm({ ...newThreadForm, priority: e.target.value as AdvisoryThread['priority'] })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none"
                  >
                    <option value="NORMAL">Normal Priority</option>
                    <option value="HIGH">High Priority</option>
                    <option value="STATUTORY_DEADLINE">Statutory Deadline (TAA 80-Day Window)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Initial Context / Question</label>
                <textarea
                  rows={3}
                  value={newThreadForm.initialMessage}
                  onChange={(e) => setNewThreadForm({ ...newThreadForm, initialMessage: e.target.value })}
                  placeholder="Outline the statutory question or dispute background..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewThreadModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Start Advisory Thread</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ENCRYPTED VIDEO ROOM SIMULATION */}
      {/* ========================================================================= */}
      {/* MODAL 4: ENCRYPTED VIDEO ROOM SIMULATION & INTERACTIVE GADGET */}
      {/* ========================================================================= */}
      {showVideoRoomModal && activeVideoBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#090D17] border border-cyan-500/40 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto scrollbar-thin p-4 sm:p-6 space-y-4 shadow-2xl relative">
            
            {/* Header with Title & Security Protocol */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10 min-w-0">
              <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <h3 className="font-bold text-white text-sm sm:text-base font-display truncate min-w-0">
                  Encrypted Advisory: {activeVideoBooking.title}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                  AES-256 E2EE ROOM
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>00:14:32 SAST</span>
                </span>
              </div>
              <button 
                onClick={() => setShowVideoRoomModal(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 cursor-pointer shrink-0 transition"
                title="Close room"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Screens Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Practitioner Video Feed */}
              <div className="min-h-[220px] aspect-video bg-gradient-to-br from-slate-900 to-indigo-950/70 rounded-2xl border border-indigo-500/30 flex flex-col justify-between p-3.5 sm:p-4 relative overflow-hidden shadow-inner">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="px-2.5 py-1 rounded bg-black/60 text-white text-[11px] font-mono flex items-center gap-1.5 truncate min-w-0 max-w-[70%]">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{activeVideoBooking.practitionerName}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono shrink-0 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Active Speaker</span>
                  </span>
                </div>

                <div className="text-center my-auto py-2">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-purple-500/20 border-2 border-purple-400/50 mx-auto flex items-center justify-center text-purple-300 font-bold text-xl shadow-lg ring-4 ring-purple-500/10 animate-pulse">
                    NS
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 font-bold mt-2 truncate px-2">Adv. Nomvula Sithole, CTA(SA)</p>
                  <p className="text-[10px] text-slate-400 font-mono">SAIT PR-0089421 • High-Def Encrypted Audio</p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-white/5">
                  <span className="text-emerald-400 font-bold">Latency: 24ms (TLS 1.3)</span>
                  <span>Sandton, JHB</span>
                </div>
              </div>

              {/* Taxpayer / Director Video Feed */}
              <div className="min-h-[220px] aspect-video bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-700 flex flex-col justify-between p-3.5 sm:p-4 relative overflow-hidden shadow-inner">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="px-2.5 py-1 rounded bg-black/60 text-white text-[11px] font-mono flex items-center gap-1.5 truncate min-w-0 max-w-[70%]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <span className="truncate">V Zenzile (You - Taxpayer)</span>
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {isMicMuted && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[9px] font-mono flex items-center gap-0.5">
                        <MicOff className="w-2.5 h-2.5" />
                        <span>Muted</span>
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-mono">
                      Owner Feed
                    </span>
                  </div>
                </div>

                <div className="text-center my-auto py-2">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-cyan-500/20 border-2 border-cyan-400/50 mx-auto flex items-center justify-center text-cyan-300 font-bold text-xl shadow-lg ring-4 ring-cyan-500/10">
                    VZ
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 font-bold mt-2 truncate px-2">{profile.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {isCameraOff ? 'Camera Off (Voice Only)' : '1080p HD Video Active'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-white/5">
                  <span className="truncate max-w-[150px]">Room: {activeVideoBooking.id}</span>
                  <span className="text-cyan-400">E2EE Verified</span>
                </div>
              </div>

            </div>

            {/* Shared Document Tray inside Room */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>Simultaneously Audited Vault Documents:</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {activeVideoBooking.preparedVaultDocuments.length} Verified Evidence Records
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeVideoBooking.preparedVaultDocuments.map((doc, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 text-slate-200 flex items-center gap-1.5 text-[11px] max-w-full">
                    <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{doc}</span>
                    <span className="text-[9px] text-emerald-400 font-mono shrink-0">SHARED</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Live In-Call Advisory Notes Drawer */}
            {showInCallNotes && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/95 border border-indigo-500/30 space-y-2 text-xs animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-indigo-400" />
                    <span>In-Call Meeting Minutes & Statutory Citations</span>
                  </span>
                  <button
                    onClick={() => handleCopyText(inCallNotes, 'Meeting Minutes')}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Minutes</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={inCallNotes}
                  onChange={(e) => setInCallNotes(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-mono leading-relaxed"
                />
              </div>
            )}

            {/* Video Controls Bar */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/5">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    const next = !isMicMuted;
                    setIsMicMuted(next);
                    showBanner(next ? 'Microphone muted' : 'Microphone unmuted');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${
                    isMicMuted 
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                >
                  {isMicMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>{isMicMuted ? 'Unmute' : 'Mute Mic'}</span>
                </button>

                <button
                  onClick={() => {
                    const next = !isCameraOff;
                    setIsCameraOff(next);
                    showBanner(next ? 'Camera stopped' : 'Camera started');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${
                    isCameraOff 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                >
                  {isCameraOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>{isCameraOff ? 'Start Video' : 'Stop Video'}</span>
                </button>

                <button
                  onClick={() => setShowInCallNotes(!showInCallNotes)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition border ${
                    showInCallNotes
                      ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/50'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{showInCallNotes ? 'Hide Minutes' : 'Meeting Minutes'}</span>
                </button>

                <button
                  onClick={() => {
                    handlePractitionerSignOff('THREAD-001');
                    showBanner('Formal tax opinion signed during live consultation');
                  }}
                  className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Execute Real-Time Sign-Off</span>
                </button>
              </div>

              <button
                onClick={() => setShowVideoRoomModal(false)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow ml-auto"
              >
                <span>End Consultation</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
