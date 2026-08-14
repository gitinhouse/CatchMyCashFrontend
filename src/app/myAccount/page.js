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
} from 'lucide-react';

// ── Helpers: derive a human step from case + docs data ─────────────────────
function parseAmount(v) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
}

function deriveCaseStatus(caseItem) {
    const docs = caseItem?.user_docs?.[0] || {};
    const properties = caseItem?.user_properties || [];

    const hasInvestigatorSigned =
        typeof docs.signed_doc === 'string' &&
        docs.signed_doc.includes('signed-document');

    const hasAgreementForm =
        (typeof docs.filled_agreement_doc === 'string' &&
            docs.filled_agreement_doc.includes('FilledAgreement_form')) ||
        (typeof docs.signed_doc === 'string' &&
            docs.signed_doc.includes('FilledAgreement_form'));

    const hasId = !!docs.proof_id;
    const hasSsn = !!docs.ssn_id;
    const hasAddress = !!docs.adress_proof;
    const requiredDocsUploaded = hasId && hasSsn && hasAddress;

    const isSubmitted =
        !!caseItem?.submitted_at || !!caseItem?.document_upload_task_status;

    const hasProperties = properties && properties.length > 0;
    const hasUserInfo = !!caseItem?.user_details?.[0];

    const checklist = {
        hasInvestigatorSigned,
        hasAgreementForm,
        requiredDocsUploaded,
        isSubmitted,
        hasProperties,
        hasUserInfo,
    };

    // Approved takes priority (status === false means approved per existing convention)
    if (caseItem?.status === false) {
        return {
            label: 'Approved',
            tone: 'approved',
            resumeStep: null,
            stepTitle: 'Claim Approved',
            stepDescription: 'Your claim has been approved by the State Controller\'s Office',
            checklist
        };
    }

    if (isSubmitted) {
        return {
            label: 'In Review',
            tone: 'review',
            resumeStep: 'tracking',
            stepTitle: 'Track Your Claim',
            stepDescription: 'Check the status of your submitted claim',
            checklist
        };
    }

    if (hasProperties && !hasUserInfo) {
        return {
            label: 'Action Required',
            tone: 'action',
            resumeStep: 'userinfo',
            stepTitle: 'Complete Your Information',
            stepDescription: 'Fill in your personal details to continue with the claim',
            checklist,
        };
    }

    if (!hasProperties) {
        return {
            label: 'Action Required',
            tone: 'action',
            resumeStep: 'search',
            stepTitle: 'Select Property',
            stepDescription: 'Search for and select the unclaimed property you want to claim',
            checklist,
        };
    }

    if (!hasInvestigatorSigned) {
        return {
            label: 'Action Required',
            tone: 'action',
            resumeStep: 'documents',
            stepTitle: 'Sign Investigator Agreement',
            stepDescription: 'Sign your investigator services agreement via DocuSign',
            checklist,
        };
    }

    if (!hasAgreementForm) {
        return {
            label: 'Action Required',
            tone: 'action',
            resumeStep: 'documents',
            stepTitle: 'Sign Agreement Form',
            stepDescription: "Sign the State Controller's Office authorization form",
            checklist,
        };
    }

    if (!requiredDocsUploaded) {
        return {
            label: 'Action Required',
            tone: 'action',
            resumeStep: 'documents',
            stepTitle: 'Identity Verification',
            stepDescription: 'Verify your identity — upload ID, SSN, and address proof',
            checklist,
        };
    }

    return {
        label: 'Ready to Submit',
        tone: 'action',
        resumeStep: 'documents',
        stepTitle: 'Submit Your Case',
        stepDescription: 'Review and submit your case to the State Controller\'s Office',
        checklist,
    };
}

const toneStyles = {
    approved: 'bg-[#00C896] text-white',
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
                            <p className="text-2xl font-bold text-[#00C896] font-['Fraunces']">
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
                                                    #{String(caseItem.case_id || caseItem._id).slice(-8).toUpperCase()}
                                                </span>
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
                                            {status.resumeStep && (
                                                <button
                                                    onClick={() => handleContinueFiling(caseItem)}
                                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#E1261C] text-white text-sm font-semibold rounded-lg hover:bg-[#B11912] transition-all shadow-sm"
                                                >
                                                    Continue Filing
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
                                                            <div className="space-y-3">
                                                                {properties.map((p, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        className="flex items-center justify-between border-b border-[#F0EEEB] pb-3 last:border-b-0"
                                                                    >
                                                                        <div>
                                                                            <p className="font-semibold text-[#0A0A0A]">
                                                                                {caseItem.user_info?.first_name}{' '}
                                                                                {caseItem.user_info?.last_name}
                                                                            </p>
                                                                            <p className="text-sm text-[#4A4A4A]">
                                                                                {p.property_title || p.property_type}
                                                                            </p>
                                                                            <p className="text-xs text-[#888888] font-['JetBrains_Mono']">
                                                                                ID: {p.property_id}
                                                                            </p>
                                                                        </div>
                                                                        <p className="font-bold text-[#0A0A0A]">
                                                                            ${formatMoney(parseAmount(p.amount))}
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>
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
                                                        {/* Checklist */}

                                                        {/* Next step card — matches "Continue Filing" pattern */}
                                                        {status.resumeStep ? (
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
                                                        ) : (
                                                            <div className="bg-[#F0FFF4] border border-[#00C896]/30 rounded-xl p-5">
                                                                <p className="font-bold text-[#0A0A0A] mb-1">
                                                                    {caseItem?.status === false
                                                                        ? 'Your claim has been approved'
                                                                        : 'Your claim is submitted and under review'}
                                                                </p>
                                                                <p className="text-[#4A4A4A]">
                                                                    {caseItem?.status === false
                                                                        ? 'No further action needed from you right now.'
                                                                        : "We'll notify you as the State Controller's Office processes your claim."}
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