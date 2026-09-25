'use client';

import React, { useState, useRef, ChangeEvent } from 'react';
import {
  UploadSimple,
  Sparkle,
  WarningCircle,
  CircleNotch,
  CaretDown,
  CaretUp,
  X,
  File,
  CheckCircle,
  ArrowRight,
} from '@phosphor-icons/react';
import { compressCvText } from '@/lib/textCompression';

interface ScoreFormProps {
  cvText: string;
  jobAdvertText: string;
  onCvChange: (val: string) => void;
  onJobChange: (val: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const SAMPLE_CV_TEXT = `ALEX MORGAN
IT & Cloud Systems Lead
New York, NY / London / Remote • alex.morgan@email.com • +1 (555) 234-5678 • linkedin.com/in/alexmorgan-tech

PROFESSIONAL SUMMARY
Dedicated and adaptable Senior IT Support & Cloud Systems Lead with 4+ years of experience delivering enterprise technical support, identity governance (Okta, Azure AD), and zero-touch MDM device provisioning. Proven collaborator with strong problem-solving skills, focused on minimizing downtime and sustaining a 98.4% first-contact SLA resolution across 600+ distributed team members.

PROFESSIONAL EXPERIENCE
Senior IT Support Specialist / Team Lead
NexaCloud Systems | 03/2022 – Present
• Spearheaded Tier-1 and Tier-2 global IT service desk operations for 350+ remote and hybrid users, achieving a 98.4% first-contact SLA resolution rate.
• Automated zero-touch device provisioning for global onboarding cohorts using Microsoft Intune and Jamf MDM, cutting manual laptop deployment time by 68%.
• Administered directory services, Single Sign-On (SSO), and access controls in Microsoft Entra ID (Azure AD) and Okta with 100% audit compliance.
• Authored 45+ comprehensive standard operating procedure (SOP) runbooks, accelerating junior support engineer ramp-up time by 40%.
• Negotiated vendor software renewals for enterprise SaaS tools (Jira, Slack, Google Workspace), saving $24,000 annually.

Junior Systems Administrator
Apex Digital Media | 01/2020 – 02/2022
• Maintained user accounts, group policy objects (GPOs), and multi-factor authentication across Microsoft Active Directory for 120+ corporate workstations.
• Implemented automated endpoint patch management schedules, reducing system vulnerabilities by 82% and achieving zero unscheduled downtime.
• Monitored daily cloud backup routines and assisted with emergency recovery testing with 100% data integrity retention.

EDUCATION & CERTIFICATIONS
• Bachelor of Science in Information Technology — Global Institute of Technology (2020)
• CompTIA Security+ Certification (SY0-601)
• Microsoft Certified: Azure Fundamentals (AZ-900)
• ITIL v4 Foundation Certificate in IT Service Management`;

const SAMPLE_JOB_TEXT = `Senior IT Support & Operations Lead
Company: CloudScale Global Technologies
Location: New York / Remote

Key Requirements:
- 4+ years in enterprise IT systems support, service desk operations, and team leadership.
- Hands-on experience with Microsoft 365, Azure AD / Entra ID, Intune MDM, and Okta identity provisioning.
- Strong knowledge of ITIL frameworks (Incident, Problem & Change Management) and SLA governance.
- Proven track record automating manual provisioning tasks using PowerShell, Bash, or API integrations.
- Relevant industry certifications (CompTIA Security+, Microsoft Azure, or ITIL).`;

export function ScoreForm({
  cvText,
  jobAdvertText,
  onCvChange,
  onJobChange,
  onSubmit,
  isLoading,
}: ScoreFormProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showJobInput, setShowJobInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cvWordCount = cvText.trim() ? cvText.trim().split(/\s+/).length : 0;
  const isJobProvided = jobAdvertText.trim().length > 30;

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/parse', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to parse file.');
      }

      onCvChange(data.text);
      setUploadedFileName(file.name);
      // Auto-clear stale sample job advert so candidate CV is not judged against an irrelevant IT sample
      if (jobAdvertText === SAMPLE_JOB_TEXT) {
        onJobChange('');
        setShowJobInput(false);
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Error parsing document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleClear = () => {
    onCvChange('');
    if (jobAdvertText === SAMPLE_JOB_TEXT) {
      onJobChange('');
      setShowJobInput(false);
    }
    setUploadedFileName(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLoadSample = () => {
    onCvChange(SAMPLE_CV_TEXT);
    onJobChange(SAMPLE_JOB_TEXT);
    setShowJobInput(true);
    setActiveTab('paste');
    setUploadedFileName(null);
    setUploadError(null);
  };

  return (
    <section id="score-card-container" className="py-6 sm:py-8 px-4 sm:px-6 max-w-3xl mx-auto w-full">
      {/* Clean Single Card Surface (Zero nested card bloat) */}
      <div className="card-surface rounded-2xl p-5 sm:p-8 space-y-6">
        {/* STEP 1: Add Your CV / Resume */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600/10 text-blue-600 font-bold text-xs flex items-center justify-center font-mono">
                1
              </span>
              <span className="text-sm font-semibold text-text-main">Your CV / Resume</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadSample}
                className="text-xs text-blue-600 hover:text-blue-500 bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 px-2.5 py-1 rounded-lg transition flex items-center gap-1 font-medium"
                title="Populate a sample CV for quick test"
              >
                <Sparkle size={13} weight="bold" />
                <span>Try Sample CV</span>
              </button>

              <div className="flex items-center bg-surface-raised border border-border-theme p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`px-3 py-1 rounded-md transition font-medium ${
                    activeTab === 'upload'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('paste')}
                  className={`px-3 py-1 rounded-md transition font-medium ${
                    activeTab === 'paste'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  Paste Text
                </button>
              </div>
            </div>
          </div>

          {/* TAB 1: File Upload */}
          {activeTab === 'upload' && (
            <div>
              {uploadedFileName && cvText ? (
                <div className="p-4 bg-surface-subtle border border-border-theme rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                      <File size={22} weight="bold" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-main truncate max-w-[220px] sm:max-w-xs">
                        {uploadedFileName}
                      </p>
                      <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                        <CheckCircle size={12} weight="bold" />
                        <span>{cvWordCount} words parsed</span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-text-muted hover:text-text-main p-1.5 rounded-lg hover:bg-surface-raised transition text-xs font-medium flex items-center gap-1"
                  >
                    <X size={14} weight="bold" />
                    <span>Change</span>
                  </button>
                </div>
              ) : (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 sm:p-10 text-center cursor-pointer transition ${
                    dragActive
                      ? 'border-blue-500 bg-blue-500/5'
                      : 'border-border-theme-strong hover:border-blue-500/50 bg-surface-subtle hover:bg-surface-raised'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {isUploading ? (
                    <div className="flex flex-col items-center justify-center py-4 space-y-2">
                      <CircleNotch size={26} weight="bold" className="text-blue-500 animate-spin" />
                      <span className="text-xs font-medium text-text-muted">Extracting text...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-2.5">
                      <div className="w-10 h-10 rounded-full bg-surface border border-border-theme flex items-center justify-center text-text-muted shadow-sm">
                        <UploadSimple size={20} weight="bold" className="text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-text-main font-semibold leading-snug">
                          Click to upload or drag your CV here
                        </p>
                        <p className="text-xs text-text-dim mt-0.5">
                          PDF, Word (.docx), or Text (up to 10MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {uploadError && (
                <div className="mt-2.5 p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-500 text-xs flex items-center gap-2">
                  <WarningCircle size={16} weight="bold" className="flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Text Paste */}
          {activeTab === 'paste' && (
            <div>
              <textarea
                value={cvText}
                onChange={(e) => onCvChange(e.target.value)}
                onBlur={(e) => onCvChange(compressCvText(e.target.value))}
                placeholder="Paste your CV text here..."
                rows={8}
                className="w-full text-xs font-sans bg-surface-subtle border border-border-theme rounded-xl p-4 text-text-main placeholder:text-text-dim focus:outline-none focus:border-blue-500 transition leading-relaxed resize-y"
              />
              <div className="flex justify-between items-center text-xs text-text-dim mt-1.5 px-1">
                <span className="font-mono text-[11px]">{cvWordCount} words</span>
                {cvText && (
                  <button
                    type="button"
                    onClick={() => onCvChange('')}
                    className="hover:text-text-main transition font-medium text-[11px]"
                  >
                    Clear text
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* STEP 2: Target Job Description (Optional) */}
        <div className="border-t border-border-theme pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowJobInput(!showJobInput)}
              className="flex items-center gap-2 text-sm font-semibold text-text-main hover:text-blue-500 transition text-left"
            >
              <span className="w-6 h-6 rounded-full bg-blue-600/10 text-blue-600 font-bold text-xs flex items-center justify-center font-mono">
                2
              </span>
              <span>Target Job Advert (Optional)</span>
              {showJobInput ? <CaretUp size={13} weight="bold" /> : <CaretDown size={13} weight="bold" />}
            </button>

            <div className="flex items-center gap-2">
              {jobAdvertText.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    onJobChange('');
                    setShowJobInput(false);
                  }}
                  className="text-[11px] text-text-muted hover:text-rose-500 transition flex items-center gap-1 font-medium hover:underline cursor-pointer"
                  title="Remove target job advert"
                >
                  <X size={12} weight="bold" />
                  <span>Remove Job</span>
                </button>
              )}
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface-raised border border-border-theme text-text-muted">
                {isJobProvided ? 'Role Matched' : 'General Check'}
              </span>
            </div>
          </div>

          {!showJobInput ? (
            <p
              onClick={() => setShowJobInput(true)}
              className="text-xs text-text-muted cursor-pointer hover:text-text-main transition pl-8"
            >
              Applying for a specific role? <span className="text-blue-600 underline font-medium">Add the job advert</span> for precise keyword density matching.
            </p>
          ) : (
            <div className="space-y-2 pl-8">
              <textarea
                value={jobAdvertText}
                onChange={(e) => onJobChange(e.target.value)}
                onBlur={(e) => onJobChange(compressCvText(e.target.value))}
                placeholder="Paste the job requirements or job advert description here..."
                rows={4}
                className="w-full text-xs font-sans bg-surface-subtle border border-border-theme rounded-xl p-3.5 text-text-main placeholder:text-text-dim focus:outline-none focus:border-blue-500 transition leading-relaxed resize-y"
              />
              <p className="text-[11px] text-text-dim">
                Calibrates keyword saturation and role alignment against Workday &amp; Greenhouse standards.
              </p>
            </div>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <div className="border-t border-border-theme pt-5">
          <button
            type="button"
            disabled={isLoading || cvWordCount < 20}
            onClick={onSubmit}
            className={`w-full py-3 px-4 sm:px-6 rounded-xl font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
              isLoading || cvWordCount < 20
                ? 'bg-surface-raised text-text-dim cursor-not-allowed border border-border-theme'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm active:scale-[0.99]'
            }`}
          >
            {isLoading ? (
              <>
                <CircleNotch size={16} weight="bold" className="animate-spin" />
                <span>Running ATS Diagnostic...</span>
              </>
            ) : (
              <>
                <span>
                  {isJobProvided
                    ? 'Score Against Target Job (Free)'
                    : 'Score General CV Health (Free)'}
                </span>
                <ArrowRight size={14} weight="bold" />
              </>
            )}
          </button>

          {cvWordCount < 20 && (
            <p className="text-xs text-text-dim text-center mt-2">
              Upload or paste your CV above, or click <button onClick={handleLoadSample} className="text-blue-600 underline font-medium hover:text-blue-500">Try Sample CV</button> for an instant test run.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}