'use client';
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import {
    ChevronDown,
    ChevronUp,
    DollarSign,
    FileText,
    CheckCircle2,
    Clock,
    ArrowRight,
    AlertCircle,
} from 'lucide-react';

// ── Helpers: derive a human step from case + docs data ─────────────────────
function parseAmount(v) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
}

function deriveCaseStatus(caseItem) {
    const properties = caseItem?.user_properties || [];
    const hasProperties = properties && properties.length > 0;
    const hasUserInfo = !!caseItem?.user_details?.[0];
    const docs = caseItem?.user_docs?.[0] || {};

    // ✅ Check if ALL properties are already claimed (from RDP)
    const allClaimed = properties.length > 0 && properties.every(p => p.is_claimed === true);
    const someClaimed = properties.some(p => p.is_claimed === true);

    // ✅ Check if the user has actually uploaded documents
    const hasUploadedDocs = !!(docs.proof_id || docs.ssn_id || docs.adress_proof || docs.agreement_doc);

    // ✅ Check if the claim was actually submitted
    const hasSubmitted = Boolean(
        caseItem?.submitted_at &&
        caseItem?.document_upload_task_status === 'completed'
    );

    // ✅ Check if claim process is actually complete
    const isProcessed = Boolean(
        caseItem?.claim_status === 'Success' &&
        caseItem?.claim_process_task_status === 'completed' &&
        hasSubmitted
    );

    // ✅ PRIORITY 1: ALL properties are claimed by another user
    if (allClaimed) {
        return {
            label: 'Already Claimed',
            tone: 'action',
            resumeStep: null, // No step to continue
            stepTitle: 'Properties Already Claimed',
            stepDescription: 'Properties already been claimed by another user. Please search for new properties.',
            checklist: { allClaimed: true, canContinue: false }
        };
    }

    // ✅ PRIORITY 2: Some properties are claimed, some are available
    if (someClaimed && !allClaimed) {
        const availableCount = properties.filter(p => p.is_claimed !== true).length;
        return {
            label: 'Partial Claim',
            tone: 'action',
            resumeStep: 'documents',
            stepTitle: `Continue with ${availableCount} Available Properties`,
            stepDescription: `${properties.filter(p => p.is_claimed === true).length} properties are already claimed. You can continue with the remaining ${availableCount} properties.`,
            checklist: { someClaimed: true, canContinue: true }
        };
    }

    // ✅ PRIORITY 3: Claim is actually approved
    if (isProcessed && hasSubmitted) {
        return {
            label: 'Approved',
            tone: 'approved',
            resumeStep: null,
            stepTitle: 'Claim Under Review',
            stepDescription: 'Your Claim is in Under Review',
            checklist: { isProcessed: true, canContinue: false }
        };
    }

    // ✅ PRIORITY 4: Claim submitted but not processed
    if (hasSubmitted && !isProcessed) {
        return {
            label: 'In Review',
            tone: 'review',
            resumeStep: 'tracking',
            stepTitle: 'Track Your Claim',
            stepDescription: 'Check the status of your submitted claim',
            checklist: { hasSubmitted: true, canContinue: true }
        };
    }

    // ✅ PRIORITY 5: Has documents uploaded but not submitted
    if (hasUploadedDocs && !hasSubmitted) {
        return {
            label: 'Action Required',
            tone: 'action',
            resumeStep: 'documents',
            stepTitle: 'Submit Your Documents',
            stepDescription: 'Review and submit your documents to complete the claim',
            checklist: { hasUploadedDocs: true, canContinue: true }
        };
    }

    // ✅ PRIORITY 6: Has properties and user info but no docs
    if (hasProperties && hasUserInfo && !hasUploadedDocs) {
        return {
            label: 'Action Required',
            tone: 'action',
            resumeStep: 'documents',
            stepTitle: 'Upload Required Documents',
            stepDescription: 'Upload Required Documents to continue',
            checklist: { hasUserInfo: true, hasProperties: true, canContinue: true }
        };
    }

    // ✅ PRIORITY 7: Has properties but no user info
    if (hasProperties && !hasUserInfo) {
        return {
            label: 'Action Required',
            tone: 'action',
            resumeStep: 'userinfo',
            stepTitle: 'Complete Your Information',
            stepDescription: 'Fill in your personal details to continue with the claim',
            checklist: { hasProperties: true, canContinue: true }
        };
    }

    // ✅ PRIORITY 8: No properties → search
    if (!hasProperties) {
        return {
            label: 'Action Required',
            tone: 'action',
            resumeStep: 'search',
            stepTitle: 'Select Property',
            stepDescription: 'Search for and select the unclaimed property you want to claim',
            checklist: { hasProperties: false, canContinue: true }
        };
    }

    // Default fallback
    return {
        label: 'In Progress',
        tone: 'action',
        resumeStep: 'documents',
        stepTitle: 'Continue Your Claim',
        stepDescription: 'Complete the remaining steps to file your claim',
        checklist: { canContinue: true }
    };
}

const toneStyles = {
    approved: 'bg-[#E1261C] text-white', // Changed from green to red
    review: 'bg-[#4A4A4A] text-white',
    action: 'bg-[#E1261C] text-white',
};



// ── Component ────────────────────────────────────────────────────────────
export default function MyAccountPage() {
    const router = useRouter();
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [openCaseId, setOpenCaseId] = useState(null);
    const [activeTab, setActiveTab] = useState({});
    const [userName, setUserName] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [retryStatuses, setRetryStatuses] = useState({});

    const fetchCases = useCallback(async () => {
        try {
            setLoading(true);
            setErrorMsg('');

            const storedLoginRaw = localStorage.getItem('userLogin');
            const storedLogin = storedLoginRaw ? JSON.parse(storedLoginRaw) : null;
            const token = storedLogin?.token;
            const realUserId = storedLogin?.user?.user_id;

            if (!token || !realUserId) {
                setIsLoggedIn(false);
                router.replace('/userLogin');
                return;
            }

            setIsLoggedIn(true);

            const { data } = await axios.get(
                `/api/case?user_id=${realUserId}`,
                { headers: { Authorization: `Bearer ${token}` } },
            );

            const list = Array.isArray(data?.data) ? data.data : [];
            setCases(list);

            const statuses = {};
            for (const c of list) {
                if (c.case_id) {
                    try {
                        const res = await fetch(`/api/claims/retry-status?case_id=${c.case_id}`);
                        const status = await res.json();
                        if (!status.error) {
                            statuses[c.case_id] = status;
                        }
                    } catch (err) {
                        // silent fail
                    }
                }
            }
            setRetryStatuses(statuses);

            const firstWithName = list.find((c) => c?.user_info?.first_name);
            if (firstWithName) {
                setUserName(firstWithName.user_info.first_name);
            }
        } catch (err) {
            console.error('Failed to load cases:', err);
            setErrorMsg('Could not load your claims. Please try again.');
            setCases([]);
        } finally {
            setLoading(false);
        }
    }, [router]);


    useEffect(() => {
    const interval = setInterval(() => {
        cases.forEach(async (c) => {
            if (c.case_id && retryStatuses[c.case_id]?.claim_retryable) {
                try {
                    const res = await fetch(`/api/claims/retry-status?case_id=${c.case_id}`);
                    const status = await res.json();
                    if (!status.error) {
                        setRetryStatuses(prev => ({
                            ...prev,
                            [c.case_id]: status
                        }));
                    }
                } catch (err) {
                    // silent fail
                }
            }
        });
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
}, [cases, retryStatuses]);


    useEffect(() => {
        fetchCases();
    }, [fetchCases]);

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center">
                <div className="text-center text-[#888888] flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-[#E1261C] border-t-transparent rounded-full animate-spin" />
                    Loading...
                </div>
            </div>
        );
    }

    // Don't render anything if not logged in (redirect will happen)
    if (!isLoggedIn) {
        return null;
    }

    const totals = cases.reduce(
        (acc, c) => {
            const caseTotal = (c.user_properties || []).reduce(
                (sum, p) => sum + parseAmount(p.amount),
                0,
            );
            if (c.status === false) acc.approved += caseTotal;
            else acc.pending += caseTotal;
            return acc;
        },
        { pending: 0, approved: 0 },
    );

    const toggleCase = (id) => {
        setOpenCaseId((prev) => (prev === id ? null : id));
        setActiveTab((prev) => ({ ...prev, [id]: prev[id] || 'assets' }));
    };

    const handleContinueFiling = (caseItem) => {
        const status = deriveCaseStatus(caseItem);
        const step = status.resumeStep || 'documents';
        router.push(`/?step=${step}&case_id=${caseItem._id}`);
    };

    const formatMoney = (n) =>
        n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div className="min-h-screen bg-[#F7F5F2]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            {/* Header */}
            <div className="bg-white border-b border-[#E8E6E3] shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[#0A0A0A] font-['Fraunces']">
                            Welcome back,{' '}
                            <span className="text-[#E1261C]">{userName || 'there'}</span>.
                        </h1>
                        <p className="text-[#4A4A4A] mt-1">
                            You currently have{' '}
                            <span className="text-[#E1261C] font-semibold">
                                {cases.length} active claim{cases.length !== 1 ? 's' : ''}
                            </span>
                            .
                        </p>
                    </div>
                    <div className="flex gap-6">
                        <div className="text-right">
                            <p className="text-xs uppercase text-[#888888] font-['JetBrains_Mono']">Pending</p>
                            <p className="text-2xl font-bold text-[#0A0A0A] font-['Fraunces']">
                                ${formatMoney(totals.pending)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs uppercase text-[#888888] font-['JetBrains_Mono']">Approved</p>
                            <p className="text-2xl font-bold text-[#E1261C] font-['Fraunces']">
                                ${formatMoney(totals.approved)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h2 className="text-xl font-bold text-[#0A0A0A] mb-4 font-['Fraunces']">
                    My Claims
                </h2>

                {errorMsg ? (
                    <div className="text-center text-[#E1261C] py-12 bg-white border border-[#E8E6E3] rounded-xl">
                        {errorMsg}
                    </div>
                ) : cases.length === 0 ? (
                    <div className="text-center text-[#888888] py-12 bg-white border border-[#E8E6E3] rounded-xl">
                        No claims yet.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {cases.map((caseItem) => {
                            const status = deriveCaseStatus(caseItem);
                            const properties = caseItem.user_properties || [];
                            const caseTotal = properties.reduce(
                                (sum, p) => sum + parseAmount(p.amount),
                                0,
                            );
                            const isOpen = openCaseId === caseItem._id;
                            const tab = activeTab[caseItem._id] || 'assets';
                            const details = caseItem.user_details?.[0] || {};

                            return (
                                <div
                                    key={caseItem._id}
                                    className="bg-white border border-[#E8E6E3] rounded-xl shadow-sm overflow-hidden"
                                >
                                    {/* Card header */}
                                    <div className="p-5 flex flex-wrap items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${toneStyles[status.tone]}`}
                                                >
                                                    {status.label}
                                                </span>
                                                <span className="text-xs text-[#888888] font-['JetBrains_Mono']">
                                                    #{caseItem.case_id || String(caseItem._id).slice(-8).toUpperCase()}
                                                </span>
                                                {caseItem.claim_id && (
                                                    <span className="text-xs text-[#888888] font-['JetBrains_Mono']">
                                                        • Claim ID: {caseItem.claim_id}
                                                    </span>
                                                )}
                                                {/* ✅ Show claimed count */}
                                                {properties.some(p => p.is_claimed === true) && (
                                                    <span className="text-xs text-[#E1261C] font-['JetBrains_Mono']">
                                                        • {properties.filter(p => p.is_claimed === true).length} already claimed
                                                    </span>
                                                )}
                                                {properties.some(p => p.is_claimed !== true) && (
                                                    <span className="text-xs text-[#E1261C] font-['JetBrains_Mono']">
                                                        • {properties.filter(p => p.is_claimed !== true).length} available
                                                    </span>
                                                )}
                                            </div>


                                            <p className="text-2xl font-bold text-[#0A0A0A] font-['Fraunces']">
                                                ${formatMoney(caseTotal)}
                                            </p>
                                            <p className="text-xs text-[#888888] mt-1">
                                                Filed{' '}
                                                {caseItem.createdAt
                                                    ? new Date(caseItem.createdAt).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    })
                                                    : 'N/A'}
                                            </p>
                                            {status.stepTitle && (
                                                <p className="text-xs text-[#E1261C] mt-1">
                                                    Next: {status.stepTitle}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* ✅ Show "Search New Properties" if ALL are claimed */}
                                            {status.checklist?.allClaimed && (
                                                <button
                                                    onClick={() => router.push('/?step=search')}
                                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#E1261C] text-white text-sm font-semibold rounded-lg hover:bg-[#B11912] transition-all shadow-sm"
                                                >
                                                    Search New Properties
                                                    <ArrowRight className="h-4 w-4" />
                                                </button>
                                            )}

                                            {/* ✅ Show "Continue Filing" ONLY if there are available properties */}
                                            {status.checklist?.canContinue &&
                                                status.resumeStep &&
                                                !status.checklist?.allClaimed && (
                                                    <button
                                                        onClick={() => handleContinueFiling(caseItem)}
                                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#E1261C] text-white text-sm font-semibold rounded-lg hover:bg-[#B11912] transition-all shadow-sm"
                                                    >
                                                        Continue Filing
                                                        <ArrowRight className="h-4 w-4" />
                                                    </button>
                                                )}

                                            {/* ✅ Show "View Claim" for completed claims */}
                                            {status.checklist?.isProcessed && (
                                                <button
                                                    onClick={() => router.push('/?step=tracking')}
                                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#E1261C] text-white text-sm font-semibold rounded-lg hover:bg-[#E1261C] transition-all shadow-sm"
                                                >
                                                    View Claim Status
                                                    <ArrowRight className="h-4 w-4" />
                                                </button>
                                            )}

                                            <button
                                                onClick={() => toggleCase(caseItem._id)}
                                                className="p-2 border border-[#E8E6E3] rounded-lg text-[#4A4A4A] hover:bg-[#FCE9E7] transition-all"
                                            >
                                                {isOpen ? (
                                                    <ChevronUp className="h-5 w-5" />
                                                ) : (
                                                    <ChevronDown className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expandable body */}
                                    {isOpen && (
                                        <div className="border-t border-[#E8E6E3]">
                                            {/* Tabs */}
                                            <div className="flex gap-6 px-5 pt-4 border-b border-[#E8E6E3]">
                                                {[
                                                    { id: 'assets', label: `Assets (${properties.length})` },
                                                    { id: 'details', label: 'Details' },
                                                    { id: 'status', label: 'Status' },
                                                ].map((t) => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() =>
                                                            setActiveTab((prev) => ({ ...prev, [caseItem._id]: t.id }))
                                                        }
                                                        className={`pb-3 text-sm font-medium border-b-2 transition-all ${tab === t.id
                                                            ? 'border-[#E1261C] text-[#E1261C]'
                                                            : 'border-transparent text-[#4A4A4A] hover:text-[#0A0A0A]'
                                                            }`}
                                                    >
                                                        {t.label}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="p-5">
                                                {tab === 'assets' && (
                                                    <div>
                                                        <h4 className="font-bold text-[#0A0A0A] mb-3">Claimed Assets</h4>
                                                        {properties.length === 0 ? (
                                                            <p className="text-sm text-[#888888]">No assets on this claim.</p>
                                                        ) : (
                                                            <>
                                                                {/* ✅ Show warning if any properties are already claimed */}
                                                                {properties.some(p => p.is_claimed === true) && (
                                                                    <div className="mb-4 p-4 bg-[#FCE9E7] border border-[#E1261C]/30 rounded-lg">
                                                                        <div className="flex items-start gap-3">
                                                                            <div className="w-8 h-8 bg-[#E1261C] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                                <AlertCircle className="h-4 w-4 text-white" />
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-sm font-semibold text-[#E1261C]">
                                                                                    ⚠️ Properties Already Claimed
                                                                                </p>
                                                                                <p className="text-sm text-[#4A4A4A] mt-1">
                                                                                    {properties.filter(p => p.is_claimed === true).length} of {properties.length} properties have already been claimed by another user and cannot be claimed again.
                                                                                </p>
                                                                                {properties.some(p => p.is_claimed !== true) && (
                                                                                    <p className="text-sm text-[#E1261C] mt-1">
                                                                                        ✅ {properties.filter(p => p.is_claimed !== true).length} properties are still available to claim.
                                                                                    </p>
                                                                                )}
                                                                                <p className="text-xs text-[#888888] mt-1 font-['JetBrains_Mono']">
                                                                                    Claimed Property IDs: {properties.filter(p => p.is_claimed === true).map(p => p.property_id).join(', ')}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <div className="space-y-3">
                                                                    {properties.map((p, idx) => {
                                                                        const isClaimed = p.is_claimed === true;
                                                                        return (
                                                                            <div
                                                                                key={idx}
                                                                                className={`flex items-center justify-between border-b border-[#F0EEEB] pb-3 last:border-b-0 ${isClaimed ? 'opacity-60' : ''
                                                                                    }`}
                                                                            >
                                                                                <div className="flex-1">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <p className="font-semibold text-[#0A0A0A]">
                                                                                            {caseItem.user_info?.first_name}{' '}
                                                                                            {caseItem.user_info?.last_name}
                                                                                        </p>
                                                                                        {isClaimed ? (
                                                                                            <span className="px-2 py-0.5 bg-[#E1261C] text-white text-[10px] font-semibold rounded-full">
                                                                                                ⚠️ Already Claimed
                                                                                            </span>
                                                                                        ) : (
                                                                                            <span className="px-2 py-0.5 bg-[#E1261C] text-white text-[10px] font-semibold rounded-full">
                                                                                                ✓ Available
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <p className="text-sm text-[#4A4A4A]">
                                                                                        {p.property_title || p.property_type}
                                                                                    </p>
                                                                                    <p className="text-xs text-[#888888] font-['JetBrains_Mono']">
                                                                                        ID: {p.property_id}
                                                                                    </p>
                                                                                    {p.claim_id && (
                                                                                        <p className="text-xs text-[#E1261C] font-['JetBrains_Mono'] mt-1">
                                                                                            Claim ID: {p.claim_id}
                                                                                        </p>
                                                                                    )}
                                                                                    {isClaimed && (
                                                                                        <p className="text-xs text-[#E1261C] mt-1">
                                                                                            ⚠️ This property already  claimed.
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    <p className="font-bold text-[#0A0A0A]">
                                                                                        ${formatMoney(parseAmount(p.amount))}
                                                                                    </p>
                                                                                    {isClaimed ? (
                                                                                        <p className="text-xs text-[#E1261C] font-semibold">Already Claimed</p>
                                                                                    ) : (
                                                                                        <p className="text-xs text-[#E1261C]">Available to claim</p>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                                {tab === 'details' && (
                                                    <div className="space-y-2 text-sm">
                                                        <p>
                                                            <strong className="text-[#0A0A0A]">Name:</strong>{' '}
                                                            {details.legal_name || `${caseItem.user_info?.first_name || ''} ${caseItem.user_info?.last_name || ''}`}
                                                        </p>
                                                        <p>
                                                            <strong className="text-[#0A0A0A]">Email:</strong>{' '}
                                                            {details.email_id || 'N/A'}
                                                        </p>
                                                        <p>
                                                            <strong className="text-[#0A0A0A]">Contact:</strong>{' '}
                                                            {details.contact_no || 'N/A'}
                                                        </p>
                                                        <p>
                                                            <strong className="text-[#0A0A0A]">Address:</strong>{' '}
                                                            {details.address
                                                                ? `${details.address}, ${details.city}, ${details.state} ${details.zip_code}`
                                                                : 'N/A'}
                                                        </p>
                                                    </div>
                                                )}

                                                {tab === 'status' && (
                                                    <div className="space-y-6 text-sm">

                                                        {/* ✅ RETRY IN PROGRESS - Automatic retry message */}
                                                        {retryStatuses[caseItem.case_id]?.claim_retryable &&
                                                            !retryStatuses[caseItem.case_id]?.claim_retry_exhausted && (
                                                                <div className="bg-[#FFF8E1] border border-[#FFB300] rounded-xl p-4">
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="w-8 h-8 bg-[#FFB300] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                            <Clock className="h-4 w-4 text-white" />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <p className="font-semibold text-[#0A0A0A]">🔄 Automatic Retry in Progress</p>
                                                                            <p className="text-[#4A4A4A] mt-1">
                                                                                {(() => {
                                                                                    const attempts = retryStatuses[caseItem.case_id]?.claim_retry_count || 0;
                                                                                    const maxAttempts = retryStatuses[caseItem.case_id]?.claim_max_retries || 3;
                                                                                    const remaining = maxAttempts - attempts;
                                                                                    const errorType = retryStatuses[caseItem.case_id]?.claim_error_type;

                                                                                    if (remaining <= 0) {
                                                                                        return "We&apos;re reviewing your claim. You&apos;ll get an update soon.";                                                                                    }

                                                                                    if (errorType === 'technical_failure') {
                                                                                        return `We encountered a temporary issue. We'll automatically retry (${remaining} attempt${remaining > 1 ? 's' : ''} remaining). This may take up to 20-30 minutes.`;
                                                                                    }

                                                                                    if (errorType === 'submission_uncertain') {
                                                                                        return "Your claim may have been submitted. We're verifying the status and will update you shortly.";
                                                                                    }

                                                                                    return `Processing your claim (attempt ${attempts}/${maxAttempts})... This may take up to 20-30 minutes.`;
                                                                                })()}
                                                                            </p>
                                                                            {retryStatuses[caseItem.case_id]?.claim_next_retry_at && (
                                                                                <p className="text-xs text-[#888888] mt-2 font-['JetBrains_Mono']">
                                                                                    <Clock className="h-3 w-3 inline mr-1" />
                                                                                    Next retry: {new Date(retryStatuses[caseItem.case_id].claim_next_retry_at).toLocaleString()}
                                                                                </p>
                                                                            )}
                                                                            {retryStatuses[caseItem.case_id]?.claim_retry_count > 0 && (
                                                                                <div className="mt-2">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="flex-1 h-1.5 bg-[#E8E6E3] rounded-full overflow-hidden">
                                                                                            <div
                                                                                                className="h-full bg-[#FFB300] rounded-full transition-all duration-500"
                                                                                                style={{
                                                                                                    width: `${Math.min(100, ((retryStatuses[caseItem.case_id]?.claim_retry_count || 0) / (retryStatuses[caseItem.case_id]?.claim_max_retries || 3)) * 100)}%`
                                                                                                }}
                                                                                            />
                                                                                        </div>
                                                                                        <span className="text-xs text-[#888888] font-['JetBrains_Mono']">
                                                                                            {retryStatuses[caseItem.case_id]?.claim_retry_count}/{retryStatuses[caseItem.case_id]?.claim_max_retries || 3}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                        {/* ⚠️ RETRY EXHAUSTED - Needs human review */}
                                                        {retryStatuses[caseItem.case_id]?.claim_retry_exhausted && (
                                                            <div className="bg-[#FCE9E7] border border-[#E1261C]/30 rounded-xl p-4">
                                                                <div className="flex items-start gap-3">
                                                                    <div className="w-8 h-8 bg-[#E1261C] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                        <AlertCircle className="h-4 w-4 text-white" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <p className="font-semibold text-[#E1261C]">⏳ Claim Under Review</p>
                                                                        <p className="text-[#4A4A4A] mt-1">
                                                                            We&apos;ve encountered some difficulty processing your claim. Our team has been notified and will review it shortly. You&apos;ll receive an update via email once it&apos;s resolved.
                                                                        </p>
                                                                        {retryStatuses[caseItem.case_id]?.claim_error_type && (
                                                                            <p className="text-xs text-[#888888] mt-2 font-['JetBrains_Mono']">
                                                                                Error: {retryStatuses[caseItem.case_id].claim_error_type?.replace(/_/g, ' ') || 'Unknown'}
                                                                                {retryStatuses[caseItem.case_id]?.claim_error_code &&
                                                                                    ` • Code: ${retryStatuses[caseItem.case_id].claim_error_code}`
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* ✅ ALREADY CLAIMED - Terminal state */}
                                                        {retryStatuses[caseItem.case_id]?.claim_error_type === 'already_claimed' &&
                                                            !retryStatuses[caseItem.case_id]?.claim_retryable && (
                                                                <div className="bg-[#E8F5E9] border border-[#4CAF50]/30 rounded-xl p-4">
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="w-8 h-8 bg-[#4CAF50] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                            <CheckCircle2 className="h-4 w-4 text-white" />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <p className="font-semibold text-[#0A0A0A]">ℹ️ Already Claimed</p>
                                                                            <p className="text-[#4A4A4A] mt-1">
                                                                                This property has already been claimed with this email address. No further action is needed.
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                        {/* ✅ MISSING VALUE - User needs to fix data */}
                                                        {retryStatuses[caseItem.case_id]?.claim_error_type === 'missing_value' &&
                                                            !retryStatuses[caseItem.case_id]?.claim_retryable && (
                                                                <div className="bg-[#FFF3E0] border border-[#FF9800]/30 rounded-xl p-4">
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="w-8 h-8 bg-[#FF9800] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                            <AlertCircle className="h-4 w-4 text-white" />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <p className="font-semibold text-[#0A0A0A]">✏️ Information Needed</p>
                                                                            <p className="text-[#4A4A4A] mt-1">
                                                                                Some information needs to be corrected before we can process your claim. Please review your claim details and try again.
                                                                            </p>
                                                                            <button
                                                                                onClick={() => router.push(`/?step=documents&case_id=${caseItem._id}`)}
                                                                                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-[#E1261C] text-white text-sm font-semibold rounded-lg hover:bg-[#B11912] transition-all"
                                                                            >
                                                                                Fix Information
                                                                                <ArrowRight className="h-4 w-4" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                        {/* ✅ SUBMISSION UNCERTAIN - Needs human review */}
                                                        {retryStatuses[caseItem.case_id]?.claim_error_type === 'submission_uncertain' &&
                                                            !retryStatuses[caseItem.case_id]?.claim_retryable && (
                                                                <div className="bg-[#FFF8E1] border border-[#FFB300]/30 rounded-xl p-4">
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="w-8 h-8 bg-[#FFB300] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                            <Clock className="h-4 w-4 text-white" />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <p className="font-semibold text-[#0A0A0A]">⏳ Verifying Claim Status</p>
                                                                            <p className="text-[#4A4A4A] mt-1">
                                                                                We&apos;re verifying whether your claim was successfully submitted. You&apos;ll receive an update shortly.
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                        {/* Original next step card - keep your existing code */}
                                                        {status.resumeStep && !retryStatuses[caseItem.case_id]?.claim_retryable && (
                                                            <div>
                                                                <h4 className="font-bold text-[#0A0A0A] mb-1">
                                                                    Action required to continue your claim
                                                                </h4>
                                                                <p className="text-[#4A4A4A] mb-4">
                                                                    Your claim is not finished yet. Complete the next step to keep things moving.
                                                                </p>
                                                                <div className="bg-[#F7F5F2] border border-[#E8E6E3] rounded-xl p-5">
                                                                    <p className="text-xs uppercase text-[#888888] font-['JetBrains_Mono'] mb-1">
                                                                        Next step
                                                                    </p>
                                                                    <p className="font-bold text-[#0A0A0A] mb-1">
                                                                        {status.stepTitle}
                                                                    </p>
                                                                    <p className="text-[#4A4A4A] mb-4">
                                                                        {status.stepDescription}
                                                                    </p>
                                                                    <button
                                                                        onClick={() => handleContinueFiling(caseItem)}
                                                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#E1261C] text-white text-sm font-semibold rounded-lg hover:bg-[#B11912] transition-all shadow-sm"
                                                                    >
                                                                        Continue Filing
                                                                        <ArrowRight className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Completed state */}
                                                        {!status.resumeStep && !retryStatuses[caseItem.case_id]?.claim_retryable && (
                                                            <div className="bg-[#F0FFF4] border border-[#E1261C]/30 rounded-xl p-5">
                                                                <p className="font-bold text-[#0A0A0A] mb-1">
                                                                    {caseItem?.status === false
                                                                        ? 'Your claim has been approved'
                                                                        : 'Your claim is under review'}
                                                                </p>
                                                                <p className="text-[#4A4A4A]">
                                                                    No further action needed from you right now.
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}