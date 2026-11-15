import React, { useState, useMemo } from 'react';
import {
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Lock,
  Unlock,
  UserPlus,
  FileCheck2,
  Edit3,
  Archive,
  RefreshCw,
  ArrowRight,
  Download,
  Clock,
  AlertTriangle,
  Eye,
  FileText,
  Sliders,
  Check
} from 'lucide-react';
import {
  BusinessEntityWorkspace,
  TeamMember,
  SubmissionApprovalRequest,
  AuditLogEntry,
  RoleType,
  RolePermissions,
  UserTaxProfile,
  SubmissionType
} from '../types';
import { ROLE_DEFINITIONS } from '../data/multiEntityData';
import {
  getDefaultPermissionsForRole,
  hasEntityAccess,
  isRoleAuthorized
} from '../utils/sessionSecurity';
import { formatZAR, generateLiveTaxSnapshot } from '../utils/taxCalculations';
import { downloadBlobFile, generateSubmissionRef } from '../utils/systemBridge';
import {
  validateCipcRegistrationNumber,
  validateSarsTaxReferenceNumber
} from '../utils/formatValidation';
import { IUserRepository, UserStatus } from '../types/user';
import { mapTeamStatusToUserStatus, mapUserStatusToTeamStatus } from '../services/userRepository';
import { useUser } from '../hooks/useUser';

interface MultiEntityAccessHubProps {
  entities: BusinessEntityWorkspace[];
  activeEntityId: string;
  onSelectEntity: (entityId: string) => void;
  onCreateEntity: (entity: BusinessEntityWorkspace) => void;
  onUpdateEntityProfile: (entityId: string, updatedProfile: Partial<UserTaxProfile>, meta?: { sector?: string; financialYearEnd?: string; code?: string }) => void;
  onToggleArchiveEntity: (entityId: string) => void;
  userRepository?: IUserRepository;
  teamMembers: TeamMember[];
  activeUserId: string;
  onSwitchActiveUser: (userId: string) => void;
  onInviteMember: (member: TeamMember) => void;
  onUpdateMember: (memberId: string, updates: Partial<TeamMember>) => void;
  submissionApprovals: SubmissionApprovalRequest[];
  onCreateSubmissionRequest: (req: Omit<SubmissionApprovalRequest, 'id' | 'preparedAt' | 'status'>) => void;
  onReviewSubmissionRequest: (requestId: string, decision: 'APPROVED_FOR_FILING' | 'REJECTED', notes: string) => void;
  auditLogs: AuditLogEntry[];
  currentUserRole: RoleType;
  activePermissions: RolePermissions;
  addAuditLog: (action: string, details: string, severity?: 'info' | 'warn' | 'crit') => void;
  showBanner: (msg: string) => void;
}

type HubSubTab = 'entities' | 'users' | 'approvals' | 'audit';

const PERMISSION_LABELS: Array<{ key: keyof RolePermissions; label: string; group: string }> = [
  { key: 'canViewTaxProjections', label: 'View-Only Projections & Reports', group: 'View' },
  { key: 'canEditTransactions', label: 'Data Entry (Transactions & Logbook)', group: 'Entry' },
  { key: 'canScanInvoices', label: 'Capture / Scan VAT Invoices', group: 'Entry' },
  { key: 'canDeleteTransactions', label: 'Delete / Void Ledger Entries', group: 'Control' },
  { key: 'canApproveInvoices', label: 'Approve OCR Invoices into VAT201', group: 'Approval' },
  { key: 'canApproveSubmissions', label: 'Submission Approval (VAT201 / EMP501 / ADR1)', group: 'Approval' },
  { key: 'canManageDisputes', label: 'Draft & File Rule 7 Disputes', group: 'Approval' },
  { key: 'canDownloadCSV', label: 'Export Raw Compliance CSVs', group: 'Audit' },
  { key: 'canManageTeam', label: 'Manage Users & Role Permissions', group: 'Admin' },
  { key: 'canManageEntities', label: 'Create & Edit Business Entities', group: 'Admin' }
];

export const MultiEntityAccessHub: React.FC<MultiEntityAccessHubProps> = ({
  entities,
  activeEntityId,
  onSelectEntity,
  onCreateEntity,
  onUpdateEntityProfile,
  onToggleArchiveEntity,
  userRepository,
  teamMembers,
  activeUserId,
  onSwitchActiveUser,
  onInviteMember,
  onUpdateMember,
  submissionApprovals,
  onCreateSubmissionRequest,
  onReviewSubmissionRequest,
  auditLogs,
  currentUserRole,
  activePermissions,
  addAuditLog,
  showBanner
}) => {
  const [subTab, setSubTab] = useState<HubSubTab>('entities');
  const [entitySearch, setEntitySearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Add/Edit Entity Modal State
  const [isEntityFormOpen, setIsEntityFormOpen] = useState(false);
  const [editingEntityId, setEditingEntityId] = useState<string | null>(null);
  const [entityName, setEntityName] = useState('');
  const [entityCode, setEntityCode] = useState('');
  const [entityType, setEntityType] = useState<UserTaxProfile['entityType']>('Small Business SME (Pty Ltd)');
  const [entitySector, setEntitySector] = useState('Technology & Consulting');
  const [entityCipc, setEntityCipc] = useState('');
  const [entityTaxRef, setEntityTaxRef] = useState('');
  const [entityVatRegistered, setEntityVatRegistered] = useState(true);
  const [entityVatNumber, setEntityVatNumber] = useState('');
  const [entityTaxRate, setEntityTaxRate] = useState(0.27);
  const [entityFye, setEntityFye] = useState('February (28/29 Feb)');
  const [entityFormError, setEntityFormError] = useState<string | null>(null);

  // Invite / Edit User Modal State
  const [userSearch, setUserSearch] = useState('');
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberTitle, setMemberTitle] = useState('');
  const [memberRole, setMemberRole] = useState<RoleType>('Bookkeeper');
  const [memberStatus, setMemberStatus] = useState<UserStatus>('active');
  const [memberPerms, setMemberPerms] = useState<RolePermissions>(getDefaultPermissionsForRole('Bookkeeper'));
  const [memberEntityScope, setMemberEntityScope] = useState<'ALL' | 'SELECTED'>('ALL');
  const [memberEntityIds, setMemberEntityIds] = useState<string[]>([]);
  const [userFormError, setUserFormError] = useState<string | null>(null);

  // Submission Approval Filter & Draft Form State
  const [approvalFilter, setApprovalFilter] = useState<'ALL' | 'PENDING_APPROVAL' | 'APPROVED_FOR_FILING' | 'REJECTED'>('ALL');
  const [reviewNotesMap, setReviewNotesMap] = useState<Record<string, string>>({});
  const [isNewSubmissionOpen, setIsNewSubmissionOpen] = useState(false);
  const [newSubType, setNewSubType] = useState<SubmissionType>('VAT201_RETURN');
  const [newSubPeriod, setNewSubPeriod] = useState('2026/04 - Category B (Mar-Apr)');
  const [newSubTitle, setNewSubTitle] = useState('');
  const [newSubImpact, setNewSubImpact] = useState<number>(24500);

  // Audit Log Filter
  const [auditSearch, setAuditSearch] = useState('');
  const [auditEntityFilter, setAuditEntityFilter] = useState<string>('ALL');

  const { user: activeRepoUser, loading: activeUserLoading } = useUser(activeUserId, userRepository);

  const activeUser = useMemo(
    () => teamMembers.find(m => m.id === activeUserId) || teamMembers[0],
    [teamMembers, activeUserId]
  );

  const canManageEntities = isRoleAuthorized(currentUserRole, 'canManageEntities', activePermissions);
  const canManageTeam = isRoleAuthorized(currentUserRole, 'canManageTeam', activePermissions);
  const canApproveSubmissions = isRoleAuthorized(currentUserRole, 'canApproveSubmissions', activePermissions);
  const canEditData = isRoleAuthorized(currentUserRole, 'canEditTransactions', activePermissions);
  const canDownloadCSV = isRoleAuthorized(currentUserRole, 'canDownloadCSV', activePermissions);

  // Accessible entities for current user
  const accessibleEntities = useMemo(() => {
    return entities.filter(ent => hasEntityAccess(activeUser, ent.id));
  }, [entities, activeUser]);

  const filteredEntities = useMemo(() => {
    const q = entitySearch.trim().toLowerCase();
    return entities.filter(ent => {
      if (!showArchived && ent.status === 'Archived') return false;
      if (!q) return true;
      return (
        ent.profile.name.toLowerCase().includes(q) ||
        ent.code.toLowerCase().includes(q) ||
        (ent.profile.sarsTaxNumber || '').includes(q) ||
        (ent.profile.registrationNumber || '').toLowerCase().includes(q) ||
        ent.sector.toLowerCase().includes(q)
      );
    });
  }, [entities, entitySearch, showArchived]);

  // Consolidated financials across accessible active entities
  const consolidatedMetrics = useMemo(() => {
    let totalGrossIncome = 0;
    let totalNetExposure = 0;
    let activeCount = 0;
    for (const ent of accessibleEntities) {
      if (ent.status !== 'Active') continue;
      activeCount++;
      const snap = generateLiveTaxSnapshot(ent.transactions, ent.invoices, ent.profile);
      totalGrossIncome += snap.grossIncome;
      totalNetExposure += snap.netTaxLiabilityOrRefund;
    }
    const pendingApprovals = submissionApprovals.filter(s => s.status === 'PENDING_APPROVAL').length;
    return {
      activeCount,
      totalGrossIncome,
      totalNetExposure,
      pendingApprovals,
      activeUsersCount: teamMembers.filter(m => m.status === 'Active').length
    };
  }, [accessibleEntities, submissionApprovals, teamMembers]);

  // Open Entity Modal for Create or Edit
  const openCreateEntityForm = () => {
    if (!canManageEntities) {
      showBanner(`Access Denied: ${activeUser?.name} (${currentUserRole}) lacks permission to create business entities.`);
      addAuditLog('ACCESS_DENIED_CREATE_ENTITY', `Role ${currentUserRole} attempted to open Create Entity modal.`, 'warn');
      return;
    }
    setEditingEntityId(null);
    setEntityName('');
    setEntityCode('');
    setEntityType('Small Business SME (Pty Ltd)');
    setEntitySector('Professional Services & Advisory');
    setEntityCipc('');
    setEntityTaxRef('');
    setEntityVatRegistered(true);
    setEntityVatNumber('');
    setEntityTaxRate(0.27);
    setEntityFye('February (28/29 Feb)');
    setEntityFormError(null);
    setIsEntityFormOpen(true);
  };

  const openEditEntityForm = (ent: BusinessEntityWorkspace) => {
    if (!canManageEntities) {
      showBanner(`Access Denied: ${activeUser?.name} (${currentUserRole}) lacks permission to edit business entity profiles.`);
      return;
    }
    setEditingEntityId(ent.id);
    setEntityName(ent.profile.name);
    setEntityCode(ent.code);
    setEntityType(ent.profile.entityType);
    setEntitySector(ent.sector);
    setEntityCipc(ent.profile.registrationNumber || '');
    setEntityTaxRef(ent.profile.sarsTaxNumber || '');
    setEntityVatRegistered(ent.profile.vatRegistered);
    setEntityVatNumber(ent.profile.vatNumber || '');
    setEntityTaxRate(ent.profile.taxBracketRate);
    setEntityFye(ent.financialYearEnd);
    setEntityFormError(null);
    setIsEntityFormOpen(true);
  };

  const handleSaveEntity = (e: React.FormEvent) => {
    e.preventDefault();
    setEntityFormError(null);

    if (entityName.trim().length < 2) {
      setEntityFormError('Legal Entity Name must be at least 2 characters.');
      return;
    }

    if (entityTaxRef.trim()) {
      const taxCheck = validateSarsTaxReferenceNumber(entityTaxRef.trim());
      if (!taxCheck.isValid) {
        setEntityFormError(taxCheck.error || 'SARS Tax Reference must be 10 numeric digits.');
        return;
      }
    }

    if (entityCipc.trim() && entityType === 'Small Business SME (Pty Ltd)') {
      const cipcCheck = validateCipcRegistrationNumber(entityCipc.trim());
      if (!cipcCheck.isValid) {
        setEntityFormError(cipcCheck.error || 'CIPC Registration format must follow YYYY/NNNNNN/NN.');
        return;
      }
    }

    if (entityVatRegistered && entityVatNumber.trim()) {
      const cleanVat = entityVatNumber.replace(/\D/g, '');
      if (cleanVat.length !== 10 || !cleanVat.startsWith('4')) {
        setEntityFormError('South African VAT Registration Number must be 10 digits starting with 4.');
        return;
      }
    }

    if (editingEntityId) {
      onUpdateEntityProfile(
        editingEntityId,
        {
          name: entityName.trim(),
          entityType,
          registrationNumber: entityCipc.trim() || undefined,
          sarsTaxNumber: entityTaxRef.trim() || undefined,
          vatRegistered: entityVatRegistered,
          vatNumber: entityVatRegistered ? entityVatNumber.replace(/\D/g, '') : undefined,
          taxBracketRate: entityTaxRate
        },
        {
          sector: entitySector.trim(),
          financialYearEnd: entityFye,
          code: (entityCode.trim() || entityName.slice(0, 6)).toUpperCase()
        }
      );
      setIsEntityFormOpen(false);
    } else {
      const cleanCode = (entityCode.trim() || entityName.replace(/[^A-Za-z0-9]/g, '').slice(0, 8)).toUpperCase();
      const newId = `ent-${cleanCode.toLowerCase()}-${Date.now().toString(36)}`;
      const newWorkspace: BusinessEntityWorkspace = {
        id: newId,
        code: cleanCode || 'ENTITY',
        sector: entitySector.trim() || 'Commercial Operations',
        financialYearEnd: entityFye,
        status: 'Active',
        createdAt: new Date().toISOString().split('T')[0],
        profile: {
          name: entityName.trim(),
          entityType,
          vatRegistered: entityVatRegistered,
          vatNumber: entityVatRegistered ? entityVatNumber.replace(/\D/g, '') : undefined,
          registrationNumber: entityCipc.trim() || undefined,
          sarsTaxNumber: entityTaxRef.trim() || undefined,
          taxBracketRate: entityTaxRate,
          provisionalCycle: 'Cycle 1 (Aug 31)',
          medicalAidMembers: 0,
          hasRetirementAnnuity: false,
          ficaStatus: 'Pending',
          ficaProgress: 45,
          directorsList: [activeUser?.name || 'V Zenzile']
        },
        transactions: [],
        invoices: [],
        bankAccounts: [],
        pendingTransactions: [],
        categorizationRules: [],
        trustLoans: []
      };
      onCreateEntity(newWorkspace);
      setIsEntityFormOpen(false);
    }
  };

  // User Form Handlers
  const openInviteUserForm = () => {
    if (!canManageTeam) {
      showBanner(`Access Denied: ${activeUser?.name} (${currentUserRole}) lacks Team Management permission.`);
      addAuditLog('ACCESS_DENIED_INVITE_USER', `Role ${currentUserRole} attempted to invite a team member.`, 'warn');
      return;
    }
    setEditingMemberId(null);
    setMemberName('');
    setMemberEmail('');
    setMemberTitle('');
    setMemberRole('Bookkeeper');
    setMemberStatus('active');
    setMemberPerms(getDefaultPermissionsForRole('Bookkeeper'));
    setMemberEntityScope('ALL');
    setMemberEntityIds(entities.map(e => e.id));
    setUserFormError(null);
    setIsUserFormOpen(true);
  };

  const openEditUserForm = (member: TeamMember) => {
    if (!canManageTeam) {
      showBanner(`Access Denied: ${activeUser?.name} (${currentUserRole}) lacks Team Management permission.`);
      return;
    }
    setEditingMemberId(member.id);
    setMemberName(member.name);
    setMemberEmail(member.email);
    setMemberTitle(member.title || '');
    setMemberRole(member.role);
    setMemberStatus(mapTeamStatusToUserStatus(member.status));
    setMemberPerms({ ...getDefaultPermissionsForRole(member.role), ...member.permissions });
    const isAll = !member.assignedEntityIds || member.assignedEntityIds.includes('ALL');
    setMemberEntityScope(isAll ? 'ALL' : 'SELECTED');
    setMemberEntityIds(isAll ? entities.map(e => e.id) : member.assignedEntityIds || []);
    setUserFormError(null);
    setIsUserFormOpen(true);
  };

  const handleRolePresetChange = (newRole: RoleType) => {
    setMemberRole(newRole);
    if (newRole !== 'Custom') {
      setMemberPerms(getDefaultPermissionsForRole(newRole));
    }
  };

  const togglePermissionKey = (key: keyof RolePermissions) => {
    setMemberRole('Custom');
    setMemberPerms(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleEntityAssignment = (entityId: string) => {
    setMemberEntityIds(prev =>
      prev.includes(entityId) ? prev.filter(id => id !== entityId) : [...prev, entityId]
    );
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError(null);

    if (memberName.trim().length < 2) {
      setUserFormError('User full name is required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(memberEmail.trim())) {
      setUserFormError('Valid business email address is required.');
      return;
    }
    if (memberEntityScope === 'SELECTED' && memberEntityIds.length === 0) {
      setUserFormError('Assign at least one business entity or select All Business Entities.');
      return;
    }

    const assignedEntityIds = memberEntityScope === 'ALL' ? ['ALL'] : memberEntityIds;

    if (editingMemberId) {
      if (editingMemberId === activeUserId && memberStatus === 'suspended') {
        setUserFormError('Cannot suspend the currently signed-in active user.');
        return;
      }

      try {
        if (userRepository) {
          await userRepository.updateUser(editingMemberId, {
            name: memberName.trim(),
            email: memberEmail.trim(),
            status: memberStatus
          });
          onUpdateMember(editingMemberId, {
            title: memberTitle.trim() || undefined,
            role: memberRole,
            permissions: memberPerms,
            assignedEntityIds
          });
        } else {
          onUpdateMember(editingMemberId, {
            name: memberName.trim(),
            email: memberEmail.trim(),
            status: mapUserStatusToTeamStatus(memberStatus),
            title: memberTitle.trim() || undefined,
            role: memberRole,
            permissions: memberPerms,
            assignedEntityIds
          });
        }
        setIsUserFormOpen(false);
      } catch (err: any) {
        setUserFormError(err?.message || 'Failed to update user details.');
      }
    } else {
      const newMember: TeamMember = {
        id: `usr-${Date.now().toString(36)}`,
        name: memberName.trim(),
        email: memberEmail.trim(),
        title: memberTitle.trim() || `${memberRole} User`,
        role: memberRole,
        permissions: memberPerms,
        assignedEntityIds,
        status: mapUserStatusToTeamStatus(memberStatus),
        joinedAt: new Date().toISOString().split('T')[0],
        lastActiveAt: 'Just added'
      };
      onInviteMember(newMember);
      setIsUserFormOpen(false);
    }
  };

  const handleSubmitNewApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditData) {
      showBanner(`Access Denied: View-Only role (${currentUserRole}) cannot prepare submission drafts.`);
      return;
    }
    const targetEnt = entities.find(ent => ent.id === activeEntityId);
    if (!targetEnt) return;
    if (!newSubTitle.trim()) {
      showBanner('Please enter a submission title.');
      return;
    }

    onCreateSubmissionRequest({
      entityId: targetEnt.id,
      entityName: targetEnt.profile.name,
      submissionType: newSubType,
      period: newSubPeriod,
      title: newSubTitle.trim(),
      amountImpactZAR: newSubImpact,
      preparedByUserId: activeUser?.id || 'usr-current',
      preparedByName: activeUser?.name || 'Current User',
      preparedByRole: currentUserRole
    });
    setNewSubTitle('');
    setIsNewSubmissionOpen(false);
  };

  const filteredMembers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return teamMembers;
    return teamMembers.filter(
      m =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        (m.title || '').toLowerCase().includes(q)
    );
  }, [teamMembers, userSearch]);

  const filteredApprovals = useMemo(() => {
    return submissionApprovals.filter(s =>
      approvalFilter === 'ALL' ? true : s.status === approvalFilter
    );
  }, [submissionApprovals, approvalFilter]);

  const filteredAuditLogs = useMemo(() => {
    const q = auditSearch.trim().toLowerCase();
    return auditLogs.filter(log => {
      if (auditEntityFilter !== 'ALL' && log.entityId && log.entityId !== auditEntityFilter) {
        return false;
      }
      if (!q) return true;
      return (
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        (log.entityName || '').toLowerCase().includes(q)
      );
    });
  }, [auditLogs, auditSearch, auditEntityFilter]);

  const handleExportAuditLogCSV = () => {
    if (!canDownloadCSV) {
      showBanner(`Access Denied: Role "${currentUserRole}" cannot export CSV audit logs.`);
      addAuditLog('ACCESS_DENIED_AUDIT_EXPORT', `Unauthorized audit log CSV export attempt by ${activeUser?.name}.`, 'warn');
      return;
    }
    const ref = generateSubmissionRef('AUDIT-TRAIL');
    const header = 'TIMESTAMP,USER_NAME,ROLE,ENTITY_NAME,ACTION,DETAILS';
    const rows = filteredAuditLogs.map(l =>
      `"${l.timestamp}","${l.userName}","${l.userRole}","${l.entityName || 'Account Global'}","${l.action}","${l.details.replace(/"/g, '""')}"`
    );
    downloadBlobFile(`ZAtax_MultiEntity_Audit_${ref}.csv`, [header, ...rows].join('\n'), 'text/csv;charset=utf-8;');
    addAuditLog('AUDIT_LOG_EXPORTED', `Exported ${filteredAuditLogs.length} audit events (${ref}).`);
    showBanner(`Downloaded Multi-Entity Audit Log CSV (${ref}).`);
  };

  const handleExportConsolidatedEntitiesCsv = () => {
    if (!canDownloadCSV) {
      showBanner(`Access Denied: Role "${currentUserRole}" is not authorized to export consolidated multi-entity tax schedules.`);
      addAuditLog('ACCESS_DENIED_CONSOLIDATED_EXPORT', `Unauthorized consolidated entity CSV export attempt by ${currentUserRole}.`, 'warn');
      return;
    }

    const authorizedList = entities.filter(e => e.status === 'Active' && hasEntityAccess(activeUser, e.id));
    const ref = generateSubmissionRef('ZATAX-CONSOLIDATED');
    const headers = [
      'ENTITY_ID,CODE,LEGAL_NAME,ENTITY_TYPE,CIPC_REG,SARS_TAX_REF,VAT_NUMBER,SECTOR,FYE,GROSS_INCOME_ZAR,NET_TAX_POSITION_ZAR,STATUS'
    ];
    const rows = authorizedList.map(ent => {
      const snap = generateLiveTaxSnapshot(ent.transactions, ent.invoices, ent.profile);
      return [
        `"${ent.id}"`,
        `"${ent.code}"`,
        `"${ent.profile.name.replace(/"/g, '""')}"`,
        `"${ent.profile.entityType}"`,
        `"${ent.profile.registrationNumber || ''}"`,
        `"${ent.profile.sarsTaxNumber || ''}"`,
        `"${ent.profile.vatNumber || ''}"`,
        `"${ent.sector.replace(/"/g, '""')}"`,
        `"${ent.financialYearEnd}"`,
        snap.grossIncome,
        snap.netTaxLiabilityOrRefund,
        `"${ent.status}"`
      ].join(',');
    });

    downloadBlobFile(`ZAtax_Consolidated_Entities_${ref}.csv`, [...headers, ...rows].join('\n'), 'text/csv;charset=utf-8;');
    addAuditLog('CONSOLIDATED_ENTITIES_EXPORTED', `Exported consolidated tax position across ${authorizedList.length} authorized entities (${ref}).`);
    showBanner(`Downloaded Consolidated Multi-Entity CSV (${authorizedList.length} entities).`);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="multi-entity-access-hub">
      {/* Header Summary */}
      <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white tracking-tight">
            Multi-Entity Management & Team Access Control
          </h2>
          <p className="text-xs text-slate-400">
            Signed in as <strong className="text-white">{activeUser?.name}</strong>
            <span className="mx-1.5 text-slate-600">·</span>
            <span>{activeUser?.role}</span>
            <span className="mx-1.5 text-slate-600">·</span>
            <span>Managing {consolidatedMetrics.activeCount} active business entities under one account</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportConsolidatedEntitiesCsv}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap border ${
              canDownloadCSV
                ? 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/15'
                : 'bg-white/5 text-slate-500 border-white/10'
            }`}
            id="hub-export-consolidated-btn"
          >
            {canDownloadCSV ? <Download className="w-3.5 h-3.5 text-cyan-400" /> : <Lock className="w-3.5 h-3.5" />}
            <span>Export Consolidated CSV</span>
          </button>

          <button
            onClick={openCreateEntityForm}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              canManageEntities
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                : 'bg-white/5 text-slate-400 border border-white/10'
            }`}
            id="hub-add-entity-btn"
          >
            {canManageEntities ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>Add Business Entity</span>
          </button>

          <button
            onClick={openInviteUserForm}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              canManageTeam
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                : 'bg-white/5 text-slate-400 border border-white/10'
            }`}
            id="hub-invite-user-btn"
          >
            {canManageTeam ? <UserPlus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>Invite Team User</span>
          </button>
        </div>
      </div>

      {/* Consolidated Multi-Entity KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0D1527] border border-white/10 rounded-xl p-4 space-y-1">
          <span className="text-xs text-slate-400 block">Accessible Entities</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {consolidatedMetrics.activeCount} / {entities.filter(e => e.status === 'Active').length}
          </div>
          <span className="text-[11px] text-slate-400">
            Active workspace: {entities.find(e => e.id === activeEntityId)?.code}
          </span>
        </div>

        <div className="bg-[#0D1527] border border-white/10 rounded-xl p-4 space-y-1">
          <span className="text-xs text-slate-400 block">Consolidated Gross Receipts</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
            {formatZAR(consolidatedMetrics.totalGrossIncome)}
          </div>
          <span className="text-[11px] text-slate-400">
            Aggregated across accessible entities
          </span>
        </div>

        <div className="bg-[#0D1527] border border-white/10 rounded-xl p-4 space-y-1">
          <span className="text-xs text-slate-400 block">Consolidated Net SARS Position</span>
          <div className={`text-2xl font-bold font-mono tabular-nums ${consolidatedMetrics.totalNetExposure > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {formatZAR(consolidatedMetrics.totalNetExposure)}
          </div>
          <span className="text-[11px] text-slate-400">
            {consolidatedMetrics.totalNetExposure > 0 ? 'Net provisional liability' : 'Net refund / shield position'}
          </span>
        </div>

        <div className="bg-[#0D1527] border border-white/10 rounded-xl p-4 space-y-1">
          <span className="text-xs text-slate-400 block">Team & Pending Approvals</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-cyan-300">
            {consolidatedMetrics.activeUsersCount} Users · {consolidatedMetrics.pendingApprovals} Pending
          </div>
          <span className="text-[11px] text-slate-400 block truncate">
            {activeUserLoading
              ? `Role standing: ${currentUserRole}`
              : `${activeRepoUser?.name || activeUser?.name} · ${activeRepoUser?.status || 'active'} · ${currentUserRole}`}
          </span>
        </div>
      </div>

      {/* Sub-Tab Bar */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-[#0D1527] border border-white/10 rounded-xl w-fit">
        <button
          onClick={() => setSubTab('entities')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            subTab === 'entities' ? 'bg-white text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
          }`}
          id="subtab-entities-btn"
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>01. Business Entities ({entities.length})</span>
        </button>

        <button
          onClick={() => setSubTab('users')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            subTab === 'users' ? 'bg-white text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
          }`}
          id="subtab-users-btn"
        >
          <Users className="w-3.5 h-3.5" />
          <span>02. Users & Permissions ({teamMembers.length})</span>
        </button>

        <button
          onClick={() => setSubTab('approvals')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            subTab === 'approvals' ? 'bg-white text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
          }`}
          id="subtab-approvals-btn"
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>03. Submission Approvals ({consolidatedMetrics.pendingApprovals})</span>
        </button>

        <button
          onClick={() => setSubTab('audit')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            subTab === 'audit' ? 'bg-white text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
          }`}
          id="subtab-audit-btn"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>04. Multi-Entity Audit Log</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* VIEW 01: BUSINESS ENTITIES DIRECTORY & ISOLATION */}
      {/* ===================================================================== */}
      {subTab === 'entities' && (
        <div className="space-y-4">
          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={entitySearch}
                onChange={(e) => setEntitySearch(e.target.value)}
                placeholder="Search entity name, CIPC, tax ref, sector..."
                className="w-full bg-[#0D1527] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="rounded border-white/20 bg-slate-900 accent-cyan-400"
              />
              <span>Show archived entities</span>
            </label>
          </div>

          {filteredEntities.length === 0 ? (
            <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-10 text-center space-y-3">
              <Building2 className="w-8 h-8 text-slate-500 mx-auto" />
              <div className="text-sm font-semibold text-white">No business entities match your filter</div>
              <p className="text-xs text-slate-400">Clear your search query or register a new South African business entity under this account.</p>
              {canManageEntities && (
                <button
                  onClick={openCreateEntityForm}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg cursor-pointer"
                >
                  Add First Business Entity
                </button>
              )}
            </div>
          ) : (
            <div className="bg-[#0D1527] border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 bg-black/20">
                      <th className="py-3 px-4 font-medium">Business Entity & Identifiers</th>
                      <th className="py-3 px-4 font-medium">Entity Classification</th>
                      <th className="py-3 px-4 font-medium text-right">Gross Receipts</th>
                      <th className="py-3 px-4 font-medium text-right">Net Tax Position</th>
                      <th className="py-3 px-4 font-medium">Assigned Users</th>
                      <th className="py-3 px-4 font-medium text-right">Workspace Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredEntities.map((ent) => {
                      const isCurrent = ent.id === activeEntityId;
                      const userHasAccess = hasEntityAccess(activeUser, ent.id);
                      const snap = generateLiveTaxSnapshot(ent.transactions, ent.invoices, ent.profile);
                      const assignedCount = teamMembers.filter(
                        m => m.status === 'Active' && hasEntityAccess(m, ent.id)
                      ).length;

                      return (
                        <tr
                          key={ent.id}
                          className={`transition-colors ${
                            isCurrent ? 'bg-cyan-500/5' : 'hover:bg-white/[0.02]'
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white text-sm">
                                {ent.profile.name}
                              </span>
                              {isCurrent && (
                                <span className="text-[11px] font-medium text-cyan-300">
                                  · Active Workspace
                                </span>
                              )}
                              {ent.status === 'Archived' && (
                                <span className="text-[11px] text-amber-400">· Archived</span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5 flex flex-wrap items-center gap-x-2">
                              <span>Code: {ent.code}</span>
                              <span>·</span>
                              <span>Tax Ref: {ent.profile.sarsTaxNumber || 'Pending'}</span>
                              {ent.profile.registrationNumber && (
                                <>
                                  <span>·</span>
                                  <span>CIPC: {ent.profile.registrationNumber}</span>
                                </>
                              )}
                              {ent.profile.vatRegistered && (
                                <>
                                  <span>·</span>
                                  <span>VAT: {ent.profile.vatNumber || 'Pending'}</span>
                                </>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="text-slate-200">{ent.profile.entityType}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {ent.sector} · FYE {ent.financialYearEnd}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono tabular-nums text-white font-semibold">
                            {userHasAccess ? formatZAR(snap.grossIncome) : 'Restricted'}
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold">
                            {userHasAccess ? (
                              <span className={snap.netTaxLiabilityOrRefund > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                                {formatZAR(snap.netTaxLiabilityOrRefund)}
                              </span>
                            ) : (
                              <span className="text-slate-500">Restricted</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-slate-300 font-mono tabular-nums">
                            {assignedCount} Members · {ent.transactions.length} Tx
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              {!userHasAccess ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-medium px-2.5 py-1.5">
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>No Entity Access</span>
                                </span>
                              ) : isCurrent ? (
                                <span className="text-[11px] font-medium text-emerald-400 px-2.5 py-1.5 inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Selected</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => onSelectEntity(ent.id)}
                                  className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-lg text-xs transition-colors cursor-pointer whitespace-nowrap"
                                  id={`switch-entity-btn-${ent.id}`}
                                >
                                  Switch Workspace
                                </button>
                              )}

                              {canManageEntities && (
                                <>
                                  <button
                                    onClick={() => openEditEntityForm(ent)}
                                    title="Edit business entity profile"
                                    className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => onToggleArchiveEntity(ent.id)}
                                    title={ent.status === 'Active' ? 'Archive entity' : 'Restore entity'}
                                    className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Archive className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 02: MULTI-USER ACCESS, ROLES & GRANULAR PERMISSIONS */}
      {/* ===================================================================== */}
      {subTab === 'users' && (
        <div className="space-y-6">
          {/* Role Matrix Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            {ROLE_DEFINITIONS.map((def) => {
              const isCurrentRole = currentUserRole === def.role;
              return (
                <div
                  key={def.role}
                  className={`p-4 rounded-xl border space-y-2 ${
                    isCurrentRole ? 'bg-cyan-950/20 border-cyan-500/40' : 'bg-[#0D1527] border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{def.role}</span>
                    {isCurrentRole && <span className="text-[11px] text-cyan-300 font-medium">Active</span>}
                  </div>
                  <div className="text-[11px] font-medium text-slate-300">{def.label}</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{def.description}</p>
                </div>
              );
            })}
          </div>

          {/* Search & User Directory Table */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search team members by name, email, role..."
                className="w-full bg-[#0D1527] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div className="text-xs text-slate-400">
              Click <strong className="text-white">Assume Session</strong> on any active user to preview exact role & entity permissions live.
            </div>
          </div>

          <div className="bg-[#0D1527] border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 bg-black/20">
                    <th className="py-3 px-4 font-medium">Team Member</th>
                    <th className="py-3 px-4 font-medium">Assigned Role</th>
                    <th className="py-3 px-4 font-medium">Permission Profile</th>
                    <th className="py-3 px-4 font-medium">Entity Scope</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredMembers.map((member) => {
                    const isCurrentUser = member.id === activeUserId;
                    const p = { ...getDefaultPermissionsForRole(member.role), ...member.permissions };
                    const isAll = !member.assignedEntityIds || member.assignedEntityIds.includes('ALL');
                    const assignedNames = isAll
                      ? 'All Business Entities'
                      : (member.assignedEntityIds || [])
                          .map(id => entities.find(e => e.id === id)?.code || id)
                          .join(', ');

                    return (
                      <tr key={member.id} className={isCurrentUser ? 'bg-cyan-500/5' : 'hover:bg-white/[0.02]'}>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">
                            {member.name}
                            {isCurrentUser && <span className="ml-2 text-[11px] text-cyan-300 font-medium">· Signed In</span>}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {member.email} · {member.title || member.role}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-slate-200">
                          {member.role}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-300">
                            <span className={p.canViewTaxProjections ? 'text-emerald-400' : 'text-slate-500'}>
                              {p.canViewTaxProjections ? '✓ View' : '✗ View'}
                            </span>
                            <span className="text-slate-600">·</span>
                            <span className={p.canEditTransactions ? 'text-emerald-400' : 'text-slate-500'}>
                              {p.canEditTransactions ? '✓ Data Entry' : '✗ Data Entry'}
                            </span>
                            <span className="text-slate-600">·</span>
                            <span className={p.canApproveSubmissions ? 'text-emerald-400' : 'text-slate-500'}>
                              {p.canApproveSubmissions ? '✓ Submission Approval' : '✗ Submission Approval'}
                            </span>
                            <span className="text-slate-600">·</span>
                            <span className={p.canDownloadCSV ? 'text-emerald-400' : 'text-slate-500'}>
                              {p.canDownloadCSV ? '✓ CSV' : '✗ CSV'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-[11px] font-mono text-slate-300">
                          {assignedNames}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`text-[11px] font-medium ${
                            member.status === 'Active'
                              ? 'text-emerald-400'
                              : member.status === 'Suspended'
                              ? 'text-rose-400'
                              : 'text-amber-400'
                          }`}>
                            {member.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            {member.status === 'Active' && !isCurrentUser && (
                              <button
                                onClick={() => onSwitchActiveUser(member.id)}
                                className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-lg text-xs transition-colors cursor-pointer whitespace-nowrap"
                                id={`assume-user-btn-${member.id}`}
                              >
                                Assume Session
                              </button>
                            )}

                            {canManageTeam && (
                              <>
                                <button
                                  onClick={() => openEditUserForm(member)}
                                  title="Edit permissions & entities"
                                  className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 rounded-lg text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Sliders className="w-3.5 h-3.5" />
                                  <span>Permissions</span>
                                </button>
                                <button
                                  onClick={() => {
                                    if (isCurrentUser) {
                                      showBanner('Cannot suspend the currently active signed-in user.');
                                      return;
                                    }
                                    const nextStatus = member.status === 'Suspended' ? 'Active' : 'Suspended';
                                    onUpdateMember(member.id, { status: nextStatus });
                                  }}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                    member.status === 'Suspended'
                                      ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                                      : 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                                  }`}
                                >
                                  {member.status === 'Suspended' ? 'Restore' : 'Suspend'}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 03: STATUTORY SUBMISSION APPROVAL QUEUE */}
      {/* ===================================================================== */}
      {subTab === 'approvals' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-[#0D1527] border border-white/10 rounded-lg">
              {(['ALL', 'PENDING_APPROVAL', 'APPROVED_FOR_FILING', 'REJECTED'] as const).map(statusKey => (
                <button
                  key={statusKey}
                  onClick={() => setApprovalFilter(statusKey)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    approvalFilter === statusKey ? 'bg-white text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {statusKey === 'ALL' ? 'All Requests' : statusKey.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsNewSubmissionOpen(prev => !prev)}
              disabled={!canEditData}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                canEditData
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                  : 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'
              }`}
              id="open-new-submission-approval-btn"
            >
              {canEditData ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>Prepare Draft for Approval</span>
            </button>
          </div>

          {isNewSubmissionOpen && (
            <form onSubmit={handleSubmitNewApproval} className="bg-[#0D1527] border border-cyan-500/30 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-white">
                  Submit Draft Return for Approval ({entities.find(e => e.id === activeEntityId)?.profile.name})
                </h3>
                <button
                  type="button"
                  onClick={() => setIsNewSubmissionOpen(false)}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Return Type</label>
                  <select
                    value={newSubType}
                    onChange={(e) => setNewSubType(e.target.value as SubmissionType)}
                    className="w-full bg-slate-950 border border-white/15 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="VAT201_RETURN">VAT201 Return</option>
                    <option value="EMP501_RECON">EMP501 Interim / Annual Recon</option>
                    <option value="ADR1_OBJECTION">Rule 7 ADR1 Objection</option>
                    <option value="VDP_DISCLOSURE">VDP §227 Application</option>
                    <option value="ITR14_RETURN">ITR14 Corporate Income Tax</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Tax Period</label>
                  <input
                    type="text"
                    value={newSubPeriod}
                    onChange={(e) => setNewSubPeriod(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Submission Description</label>
                  <input
                    type="text"
                    value={newSubTitle}
                    onChange={(e) => setNewSubTitle(e.target.value)}
                    placeholder="e.g. VAT201 Category B Input Adjustment"
                    className="w-full bg-slate-950 border border-white/15 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Tax / Refund Impact (ZAR)</label>
                  <input
                    type="number"
                    value={newSubImpact}
                    onChange={(e) => setNewSubImpact(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/15 rounded-lg px-3 py-2 text-white font-mono tabular-nums"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg cursor-pointer"
                >
                  Queue for Submission Approval
                </button>
              </div>
            </form>
          )}

          {filteredApprovals.length === 0 ? (
            <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-10 text-center space-y-2">
              <FileCheck2 className="w-8 h-8 text-slate-500 mx-auto" />
              <div className="text-sm font-semibold text-white">No submission requests in this view</div>
              <p className="text-xs text-slate-400">Drafts submitted by Bookkeepers or Accountants for sign-off will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApprovals.map((item) => (
                <div key={item.id} className="bg-[#0D1527] border border-white/10 rounded-2xl p-5 flex flex-col lg:flex-row justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold text-white text-sm">{item.title}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-cyan-300 font-medium">{item.entityName}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono tabular-nums flex flex-wrap items-center gap-x-2">
                      <span>Type: {item.submissionType}</span>
                      <span>·</span>
                      <span>Period: {item.period}</span>
                      <span>·</span>
                      <span>Impact: {formatZAR(item.amountImpactZAR)}</span>
                      <span>·</span>
                      <span>Prepared by {item.preparedByName} ({item.preparedByRole}) on {item.preparedAt}</span>
                    </div>
                    {item.reviewedByName && (
                      <div className="text-xs text-slate-300 pt-1">
                        Reviewed by <strong>{item.reviewedByName}</strong> ({item.reviewedByRole}) · {item.reviewNotes || 'No remarks'}
                        {item.sarsRefNumber && <span className="ml-2 font-mono text-emerald-400">Ref: {item.sarsRefNumber}</span>}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
                    {item.entityId !== activeEntityId && hasEntityAccess(activeUser, item.entityId) && (
                      <button
                        onClick={() => onSelectEntity(item.entityId)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 text-xs font-medium cursor-pointer whitespace-nowrap"
                      >
                        Switch Workspace
                      </button>
                    )}
                    {item.status === 'PENDING_APPROVAL' ? (
                      canApproveSubmissions ? (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <input
                            type="text"
                            value={reviewNotesMap[item.id] || ''}
                            onChange={(e) => setReviewNotesMap(prev => ({ ...prev, [item.id]: e.target.value }))}
                            placeholder="Review notes (optional for approval)..."
                            className="bg-slate-950 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white w-56"
                          />
                          <button
                            onClick={() => onReviewSubmissionRequest(item.id, 'APPROVED_FOR_FILING', reviewNotesMap[item.id] || 'Verified and authorised for SARS lodgement.')}
                            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg text-xs cursor-pointer whitespace-nowrap"
                            id={`approve-submission-btn-${item.id}`}
                          >
                            Approve Filing
                          </button>
                          <button
                            onClick={() => onReviewSubmissionRequest(item.id, 'REJECTED', reviewNotesMap[item.id] || 'Returned for source document verification.')}
                            className="px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-semibold rounded-lg text-xs cursor-pointer whitespace-nowrap"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-amber-300 font-medium px-3 py-1.5 border border-amber-500/30 rounded-lg bg-amber-500/10">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Pending Approval (Requires Submission Approval Role)</span>
                        </span>
                      )
                    ) : (
                      <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${
                        item.status === 'APPROVED_FOR_FILING'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      }`}>
                        {item.status === 'APPROVED_FOR_FILING' ? 'Approved for Filing' : 'Rejected'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 04: CONSOLIDATED MULTI-ENTITY AUDIT LOG */}
      {/* ===================================================================== */}
      {subTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Filter actions, users, details..."
                  className="w-full bg-[#0D1527] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <select
                value={auditEntityFilter}
                onChange={(e) => setAuditEntityFilter(e.target.value)}
                className="bg-[#0D1527] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="ALL">All Business Entities</option>
                {entities.map(ent => (
                  <option key={ent.id} value={ent.id}>{ent.profile.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExportAuditLogCSV}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                canDownloadCSV
                  ? 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                  : 'bg-white/5 text-slate-500 border border-white/10'
              }`}
            >
              {canDownloadCSV ? <Download className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>Export Audit CSV</span>
            </button>
          </div>

          <div className="bg-[#0D1527] border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#090D17] border-b border-white/10 text-slate-400">
                  <tr>
                    <th className="py-3 px-4 font-medium">Timestamp</th>
                    <th className="py-3 px-4 font-medium">Actor & Role</th>
                    <th className="py-3 px-4 font-medium">Entity</th>
                    <th className="py-3 px-4 font-medium">Action & Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-4 text-[11px] text-slate-400 tabular-nums whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-[11px] text-slate-200 whitespace-nowrap">
                        {log.userName} · {log.userRole}
                      </td>
                      <td className="py-2.5 px-4 text-[11px] text-cyan-300 whitespace-nowrap">
                        {log.entityName || 'Account Global'}
                      </td>
                      <td className="py-2.5 px-4 text-[11px]">
                        <span className="text-amber-400 font-semibold mr-2">{log.action}</span>
                        <span className="text-slate-300 font-sans">{log.details}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: CREATE / EDIT BUSINESS ENTITY */}
      {/* ===================================================================== */}
      {isEntityFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleSaveEntity}
            className="bg-[#0D1527] border border-white/15 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingEntityId ? 'Edit Business Entity Profile' : 'Register New Business Entity'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEntityFormOpen(false)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>

            {entityFormError && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{entityFormError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="text-slate-400 block mb-1">Registered Legal Entity Name</label>
                <input
                  type="text"
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                  placeholder="e.g. Karoo AgriTech Solutions (Pty) Ltd"
                  className="w-full bg-slate-950 border border-white/15 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Workspace Short Code</label>
                <input
                  type="text"
                  value={entityCode}
                  onChange={(e) => setEntityCode(e.target.value.toUpperCase())}
                  placeholder="e.g. KAROO"
                  maxLength={10}
                  className="w-full bg-slate-950 border border-white/15 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Taxpayer Entity Type</label>
                <select
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value as UserTaxProfile['entityType'])}
                  className="w-full bg-slate-950 border border-white/15 rounded-lg px-3 py-2 text-white"
                >
                  <option value="Small Business SME (Pty Ltd)">Small Business SME (Pty Ltd)</option>
                  <option value="Self-Employed / Sole Prop">Self-Employed / Sole Prop</option>
                  <option value="Individual / Salaried">Individual / Salaried</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">CIPC Registration Number</label>
                <input
                  type="text"
                  value={entityCipc}
                  onChange={(e) => setEntityCipc(e.target.value)}
                  placeholder="YYYY/NNNNNN/07"
                  className="w-full bg-slate-950 border border-white/15 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">SARS 10-Digit Income Tax Ref</label>
                <input
                  type="text"
                  value={entityTaxRef}
                  onChange={(e) => setEntityTaxRef(e.target.value)}
                  placeholder="10 digits (e.g. 9304318273)"
                  maxLength={10}
                  className="w-full bg-slate-950 border border-white/15 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Industry Sector</label>
                <input
                  type="text"
                  value={entitySector}
                  onChange={(e) => setEntitySector(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Financial Year-End</label>
                <select
                  value={entityFye}
                  onChange={(e) => setEntityFye(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-lg px-3 py-2 text-white"
                >
                  <option value="February (28/29 Feb)">February (28/29 Feb)</option>
                  <option value="March (31 Mar)">March (31 Mar)</option>
                  <option value="June (30 Jun)">June (30 Jun)</option>
                  <option value="December (31 Dec)">December (31 Dec)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="entity-vat-toggle"
                  checked={entityVatRegistered}
                  onChange={(e) => setEntityVatRegistered(e.target.checked)}
                  className="accent-cyan-400"
                />
                <label htmlFor="entity-vat-toggle" className="text-white cursor-pointer">
                  Registered VAT Vendor (15%)
                </label>
              </div>

              {entityVatRegistered && (
                <div>
                  <label className="text-slate-400 block mb-1">SARS VAT Number (Starts with 4)</label>
                  <input
                    type="text"
                    value={entityVatNumber}
                    onChange={(e) => setEntityVatNumber(e.target.value)}
                    placeholder="4XXXXXXXXX"
                    maxLength={10}
                    className="w-full bg-slate-950 border border-white/15 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              )}

              <div>
                <label className="text-slate-400 block mb-1">Effective Tax Rate (Decimal)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.07"
                  max="0.45"
                  value={entityTaxRate}
                  onChange={(e) => setEntityTaxRate(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/15 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsEntityFormOpen(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-semibold cursor-pointer"
                id="save-entity-submit-btn"
              >
                {editingEntityId ? 'Save Entity Updates' : 'Create Business Entity'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: INVITE / EDIT USER & GRANULAR PERMISSIONS */}
      {/* ===================================================================== */}
      {isUserFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <form
            onSubmit={handleSaveMember}
            className="bg-[#0D1527] border border-white/15 rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-2xl my-8"
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingMemberId ? 'Edit User Role, Permissions & Entities' : 'Invite Team Member to Account'}
              </h3>
              <button
                type="button"
                onClick={() => setIsUserFormOpen(false)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>

            {userFormError && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{userFormError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="e.g. Nomsa Dlamini"
                  className="w-full bg-slate-950 border border-white/15 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="nomsa@company.co.za"
                  className="w-full bg-slate-950 border border-white/15 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Job Title / Designation</label>
                <input
                  type="text"
                  value={memberTitle}
                  onChange={(e) => setMemberTitle(e.target.value)}
                  placeholder="e.g. Senior Tax Reviewer"
                  className="w-full bg-slate-950 border border-white/15 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Role Preset</label>
                <select
                  value={memberRole}
                  onChange={(e) => handleRolePresetChange(e.target.value as RoleType)}
                  className="w-full bg-slate-950 border border-white/15 rounded-lg px-3 py-2 text-white"
                >
                  <option value="Owner">Owner (Full Admin & Filing)</option>
                  <option value="Accountant">Accountant (Submission Approval)</option>
                  <option value="Bookkeeper">Bookkeeper (Data Entry Only)</option>
                  <option value="Auditor">Auditor (View-Only & Audit CSV)</option>
                  <option value="Custom">Custom (Granular Permissions)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-400 block mb-1">Account Status</label>
                <select
                  value={memberStatus}
                  onChange={(e) => setMemberStatus(e.target.value as UserStatus)}
                  className="w-full bg-slate-950 border border-white/15 rounded-lg px-3 py-2 text-white"
                  id="member-status-select"
                >
                  <option value="active">Active (Full Assigned Access)</option>
                  <option value="pending">Pending (Awaiting Onboarding Acceptance)</option>
                  <option value="suspended">Suspended (Access Revoked)</option>
                </select>
              </div>
            </div>

            {/* Granular Permission Matrix */}
            <div className="space-y-2 border-t border-white/10 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-white">Granular Access Permissions</span>
                <span className="text-[11px] text-slate-400">Toggling any checkbox switches preset to Custom</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {PERMISSION_LABELS.map((perm) => (
                  <label
                    key={perm.key}
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/70 border border-white/5 hover:border-white/15 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(memberPerms[perm.key])}
                      onChange={() => togglePermissionKey(perm.key)}
                      className="accent-cyan-400"
                    />
                    <span className="text-slate-200">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Entity Assignment */}
            <div className="space-y-2 border-t border-white/10 pt-3 text-xs">
              <span className="font-semibold text-white block">Business Entity Access Scope</span>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="radio"
                    name="entityScope"
                    checked={memberEntityScope === 'ALL'}
                    onChange={() => setMemberEntityScope('ALL')}
                    className="accent-cyan-400"
                  />
                  <span>All Business Entities (Account-Wide)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="radio"
                    name="entityScope"
                    checked={memberEntityScope === 'SELECTED'}
                    onChange={() => setMemberEntityScope('SELECTED')}
                    className="accent-cyan-400"
                  />
                  <span>Restrict to Specific Entities</span>
                </label>
              </div>

              {memberEntityScope === 'SELECTED' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {entities.map((ent) => (
                    <label
                      key={ent.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/70 border border-white/5 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={memberEntityIds.includes(ent.id)}
                        onChange={() => toggleEntityAssignment(ent.id)}
                        className="accent-cyan-400"
                      />
                      <span className="text-slate-200 truncate">{ent.profile.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsUserFormOpen(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-semibold cursor-pointer"
                id="save-member-submit-btn"
              >
                {editingMemberId ? 'Save User Permissions' : 'Invite & Provision Access'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
