
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  BriefcaseBusiness,
  FileText,
  Search,
  MapPin,
  CalendarDays,
  CheckCircle2,
  RefreshCw,
  UserRound,
  Filter,
  Eye,
  Download,
  GraduationCap,
  X,
  Target,
  Code,
  Award,
  AlertCircle,
  ShieldCheck,
  EyeOff,
} from 'lucide-react';

import { addNotification } from '../utils/notifications.js';
import RecruiterAnalytics from './RecruiterAnalytics.jsx';
import './RecruiterDashboard.css';

const readStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const getAllApplications = () => {
  const results = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);

    if (!key?.startsWith('globalhire_applications_')) continue;

    const candidateId = key.replace(
      'globalhire_applications_',
      ''
    );

    const applications = readStorage(key, []);

    if (!Array.isArray(applications)) continue;

    applications.forEach((application) => {
      results.push({
        ...application,
        candidateId,
      });
    });
  }

  return results;
};

const getStatusClass = (status) => {
  const value = String(status || 'Under Review')
    .toLowerCase()
    .replace(/\s+/g, '-');

  return `recruiter-status recruiter-status-${value}`;
};

const normalizeSkill = (skill) =>
  String(skill || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w+#.]/g, '');

const getSkillList = (skills) => {
  let values = [];

  if (Array.isArray(skills)) {
    values = skills;
  } else if (typeof skills === 'string') {
    values = skills.split(/[,;\n]/);
  }

  const unique = new Map();

  values.forEach((skill) => {
    const original = String(skill || '').trim();
    const normalized = normalizeSkill(original);

    if (normalized && !unique.has(normalized)) {
      unique.set(normalized, original);
    }
  });

  return Array.from(unique.values());
};

const getMinimumExperience = (job) => {
  const value =
    job?.minimumExperience ??
    job?.minExperience ??
    0;

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const parseExperience = (experience) => {
  if (
    experience === null ||
    experience === undefined ||
    String(experience).trim() === ''
  ) {
    return null;
  }

  const value = String(experience).toLowerCase().trim();

  if (
    /fresher|entry[- ]level|no experience|beginner/.test(value)
  ) {
    return 0;
  }

  const yearsMatch = value.match(
    /(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)/
  );

  const monthsMatch = value.match(
    /(\d+(?:\.\d+)?)\s*\+?\s*(?:months?|mos?)/
  );

  if (yearsMatch) {
    let totalYears = Number(yearsMatch[1]);

    if (monthsMatch) {
      totalYears += Number(monthsMatch[1]) / 12;
    }

    return Number.isFinite(totalYears) ? totalYears : null;
  }

  if (monthsMatch) {
    return Number(monthsMatch[1]) / 12;
  }

  if (/^\d+(?:\.\d+)?$/.test(value)) {
    return Number(value);
  }

  return null;
};

const getCandidateMatch = (profile, job) => {
  const candidateSkills = getSkillList(profile?.skills);
  const requiredSkills = getSkillList(job?.requiredSkills);

  const candidateSkillMap = new Map(
    candidateSkills.map((skill) => [
      normalizeSkill(skill),
      skill,
    ])
  );

  const matchedSkills = [];
  const missingSkills = [];

  requiredSkills.forEach((requiredSkill) => {
    const normalized = normalizeSkill(requiredSkill);

    if (candidateSkillMap.has(normalized)) {
      matchedSkills.push(requiredSkill);
    } else {
      missingSkills.push(requiredSkill);
    }
  });

  const score =
    requiredSkills.length > 0
      ? Math.round(
          (matchedSkills.length / requiredSkills.length) * 100
        )
      : null;

  const candidateExperience = parseExperience(profile?.experience);
  const minimumExperience = getMinimumExperience(job);

  let experienceStatus = 'not-required';

  if (minimumExperience > 0) {
    if (candidateExperience === null) {
      experienceStatus = 'unknown';
    } else if (candidateExperience >= minimumExperience) {
      experienceStatus = 'meets';
    } else {
      experienceStatus = 'below';
    }
  }

  return {
    requiredSkills,
    matchedSkills,
    missingSkills,
    score,
    candidateExperience,
    minimumExperience,
    experienceStatus,
  };
};

function ResumeActions({ resume, onView }) {
  if (!resume?.dataUrl) {
    return (
      <span className="recruiter-no-resume">
        <FileText size={15} />
        No resume available
      </span>
    );
  }

  const isPdf =
    resume.type === 'application/pdf' ||
    resume.name?.toLowerCase().endsWith('.pdf');

  return (
    <div className="recruiter-resume-actions">
      {isPdf && (
        <button
          type="button"
          onClick={() => onView(resume)}
          className="recruiter-resume-view"
        >
          <Eye size={15} />
          View
        </button>
      )}

      <a
        href={resume.dataUrl}
        download={resume.name || 'candidate-resume'}
        className="recruiter-resume-download"
      >
        <Download size={15} />
        Download
      </a>
    </div>
  );
}

export default function RecruiterDashboard({ user }) {
  const [jobs, setJobs] = useState(() => {
    const data = readStorage('globalhire_all_jobs', []);
    return Array.isArray(data) ? data : [];
  });

  const [applications, setApplications] = useState(getAllApplications);

  const [users, setUsers] = useState(() => {
    const data = readStorage('globalhire_users', []);
    return Array.isArray(data) ? data : [];
  });

  const [activeTab, setActiveTab] = useState('applications');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [notice, setNotice] = useState('');
  const [previewResume, setPreviewResume] = useState(null);
  const [selectedMatchJobId, setSelectedMatchJobId] = useState('');

  const openResumePreview = (resume) => {
    try {
      if (!resume?.dataUrl) {
        setNotice('Resume file is not available.');
        return;
      }

      const base64 = resume.dataUrl.split(',')[1];

      if (!base64) {
        setNotice('This resume could not be previewed.');
        return;
      }

      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);

      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }

      const pdfBlob = new Blob([bytes], {
        type: 'application/pdf',
      });

      const previewUrl = URL.createObjectURL(pdfBlob);

      setPreviewResume({
        ...resume,
        previewUrl,
      });
    } catch (error) {
      console.error('Resume preview failed:', error);
      setNotice(
        'Unable to preview this resume. Please download it instead.'
      );
    }
  };

  useEffect(() => {
    return () => {
      if (previewResume?.previewUrl) {
        URL.revokeObjectURL(previewResume.previewUrl);
      }
    };
  }, [previewResume]);

  const closeResumePreview = () => {
    setPreviewResume(null);
  };

  const refreshData = useCallback(() => {
    const latestJobs = readStorage('globalhire_all_jobs', []);
    const latestUsers = readStorage('globalhire_users', []);

    setJobs(Array.isArray(latestJobs) ? latestJobs : []);
    setUsers(Array.isArray(latestUsers) ? latestUsers : []);
    setApplications(getAllApplications());
    setSelectedApplication(null);
  }, []);

  useEffect(() => {
    const handleRefresh = () => refreshData();

    window.addEventListener('storage', handleRefresh);
    window.addEventListener('focus', handleRefresh);
    window.addEventListener(
      'globalhire-data-updated',
      handleRefresh
    );

    return () => {
      window.removeEventListener('storage', handleRefresh);
      window.removeEventListener('focus', handleRefresh);
      window.removeEventListener(
        'globalhire-data-updated',
        handleRefresh
      );
    };
  }, [refreshData]);

  const candidateUsers = useMemo(
    () =>
      users.filter(
        (item) =>
          String(item.role || '').toLowerCase() === 'candidate'
      ),
    [users]
  );

  const enrichedApplications = useMemo(() => {
    return applications.map((application) => {
      const candidate = candidateUsers.find(
        (item) =>
          String(item.id) === String(application.candidateId)
      );

      const job = jobs.find(
        (item) => String(item.id) === String(application.jobId)
      );

      const profile = readStorage(
        `globalhire_profile_${application.candidateId}`,
        {}
      );

      const contactVisible = profile?.showContactInfo !== false;
      const resumeVisible = profile?.showResume !== false;

      return {
        ...application,
        candidateName:
          candidate?.name || application.name || 'Candidate',
        candidateEmail: contactVisible
          ? candidate?.email ||
            application.email ||
            'Email not available'
          : 'Hidden by candidate',
        jobTitle:
          job?.title ||
          application.title ||
          'Job listing unavailable',
        company:
          job?.company ||
          application.company ||
          'Company',
        location:
          job?.location || profile?.location || 'Location not specified',
        skills: profile?.skills || '',
        headline: profile?.headline || '',
        phone: contactVisible ? profile?.phone || '' : '',
        contactVisible,
        resumeVisible,
        education: profile?.education || '',
        experience: profile?.experience || '',
        about: profile?.about || '',
        resume: resumeVisible ? profile?.resume || null : null,
      };
    });
  }, [applications, candidateUsers, jobs]);

  const filteredApplications = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return enrichedApplications.filter((application) => {
      const searchableText = [
        application.candidateName,
        application.contactVisible ? application.candidateEmail : '',
        application.jobTitle,
        application.company,
        application.skills,
        application.education,
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = searchableText.includes(term);

      const matchesStatus =
        statusFilter === 'All' ||
        String(application.status || 'Under Review') === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [enrichedApplications, searchTerm, statusFilter]);

  const updateApplicationStatus = (application, newStatus) => {
    const storageKey =
      `globalhire_applications_${application.candidateId}`;

    const candidateApplications = readStorage(storageKey, []);

    if (!Array.isArray(candidateApplications)) {
      setNotice('Could not find this candidate application.');
      return;
    }

    const matchesApplication = (item) =>
      String(item.id) === String(application.id) ||
      (
        String(item.jobId) === String(application.jobId) &&
        String(item.appliedAt) === String(application.appliedAt)
      );

    const existingApplication = candidateApplications.find(
      matchesApplication
    );

    if (!existingApplication) {
      setNotice('Could not find this candidate application.');
      return;
    }

    const currentStatus = existingApplication.status || 'Under Review';

    if (currentStatus === newStatus) {
      setNotice(`Application is already marked as ${newStatus}.`);
      return;
    }

    const updatedApplications = candidateApplications.map((item) =>
      matchesApplication(item)
        ? {
            ...item,
            status: newStatus,
            statusUpdatedAt: new Date().toISOString(),
          }
        : item
    );

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(updatedApplications)
      );

      const allJobs = readStorage('globalhire_all_jobs', []);
      const safeJobs = Array.isArray(allJobs) ? allJobs : [];

      const updatedJobs = safeJobs.map((job) => {
        if (String(job.id) !== String(application.jobId)) {
          return job;
        }

        const applicants = Array.isArray(job.applicants)
          ? job.applicants
          : [];

        return {
          ...job,
          applicants: applicants.map((applicant) =>
            String(applicant.candidateId) ===
            String(application.candidateId)
              ? { ...applicant, status: newStatus }
              : applicant
          ),
        };
      });

      localStorage.setItem(
        'globalhire_all_jobs',
        JSON.stringify(updatedJobs)
      );

      const statusMessages = {
        'Under Review': `Your application for ${application.jobTitle} is now under review.`,
        Shortlisted: `Congratulations! You have been shortlisted for ${application.jobTitle} at ${application.company}.`,
        Interview: `You have been invited for an interview for ${application.jobTitle} at ${application.company}.`,
        Rejected: `Your application for ${application.jobTitle} at ${application.company} has been marked as rejected.`,
        Hired: `Congratulations! You have been marked as hired for ${application.jobTitle} at ${application.company}.`,
      };

      addNotification(application.candidateId, {
        title: `Application status: ${newStatus}`,
        message:
          statusMessages[newStatus] ||
          `Your application status for ${application.jobTitle} has changed to ${newStatus}.`,
        type: 'application',
      });

      setJobs(updatedJobs);
      setApplications(getAllApplications());
      setNotice(`Application marked as ${newStatus}.`);
      setSelectedApplication(null);
    } catch (error) {
      console.error('Application update failed:', error);
      setNotice('Could not update the application. Please try again.');
    }
  };

  const stats = [
    {
      label: 'Total Applications',
      value: applications.length,
      icon: FileText,
      color: 'blue',
    },
    {
      label: 'Available Jobs',
      value: jobs.length,
      icon: BriefcaseBusiness,
      color: 'terracotta',
    },
    {
      label: 'Registered Candidates',
      value: candidateUsers.length,
      icon: Users,
      color: 'green',
    },
    {
      label: 'Shortlisted',
      value: applications.filter(
        (item) => item.status === 'Shortlisted'
      ).length,
      icon: CheckCircle2,
      color: 'purple',
    },
  ];

  const searchedJobs = jobs.filter((job) =>
    [
      job.title,
      job.company,
      job.category,
      job.location,
    ]
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase().trim())
  );

  const matchingJobs = useMemo(
    () =>
      jobs.filter(
        (job) =>
          job.adminStatus === 'Approved' ||
          !job.adminStatus
      ),
    [jobs]
  );

  const selectedMatchJob =
    matchingJobs.find(
      (job) => String(job.id) === String(selectedMatchJobId)
    ) || matchingJobs[0] || null;

  const candidateMatches = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    const results = candidateUsers
      .map((candidate) => {
        const profile = readStorage(
          `globalhire_profile_${candidate.id}`,
          {}
        );

        return {
          candidate,
          profile,
          match: selectedMatchJob
            ? getCandidateMatch(profile, selectedMatchJob)
            : null,
        };
      })
      // Hidden profiles do not appear in recruiter candidate discovery.
      .filter(({ profile }) => profile?.profileVisible !== false);

    const filtered = results.filter(({ candidate, profile }) => {
      const contactVisible = profile?.showContactInfo !== false;

      const searchableText = [
        candidate.name,
        contactVisible ? candidate.email : '',
        profile?.headline,
        profile?.skills,
        profile?.location,
        profile?.education,
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(term);
    });

    if (selectedMatchJob) {
      filtered.sort((a, b) => {
        const scoreA = a.match?.score ?? -1;
        const scoreB = b.match?.score ?? -1;

        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }

        return String(a.candidate.name || '').localeCompare(
          String(b.candidate.name || '')
        );
      });
    }

    return filtered;
  }, [candidateUsers, searchTerm, selectedMatchJob]);

  return (
    <main className="recruiter-dashboard">
      <div className="recruiter-heading">
        <div>
          <span className="recruiter-eyebrow">
            RECRUITER WORKSPACE
          </span>

          <h1>Recruiter Dashboard</h1>

          <p>
            Welcome back, {user?.name || 'Recruiter'}.
            Find talent and manage recruitment in one place.
          </p>
        </div>

        <button
          className="recruiter-refresh"
          onClick={refreshData}
          type="button"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {notice && (
        <div className="recruiter-notice" role="status">
          <span>{notice}</span>
          <button
            onClick={() => setNotice('')}
            type="button"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}

      <section className="recruiter-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article className="recruiter-stat-card" key={stat.label}>
              <div className={`recruiter-stat-icon ${stat.color}`}>
                <Icon size={21} />
              </div>

              <div>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            </article>
          );
        })}
      </section>

      <RecruiterAnalytics />

      <section className="recruiter-panel">
        <div className="recruiter-tabs">
          <button
            className={activeTab === 'applications' ? 'active' : ''}
            onClick={() => setActiveTab('applications')}
            type="button"
          >
            <Users size={17} />
            Candidate Applications
          </button>

          <button
            className={activeTab === 'jobs' ? 'active' : ''}
            onClick={() => setActiveTab('jobs')}
            type="button"
          >
            <BriefcaseBusiness size={17} />
            Job Listings
          </button>

          <button
            className={activeTab === 'candidates' ? 'active' : ''}
            onClick={() => setActiveTab('candidates')}
            type="button"
          >
            <UserRound size={17} />
            Candidates
          </button>
        </div>

        <div className="recruiter-toolbar">
          <label className="recruiter-search">
            <Search size={18} />

            <input
              type="search"
              placeholder={
                activeTab === 'jobs'
                  ? 'Search jobs or companies...'
                  : 'Search candidates, skills or job titles...'
              }
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>

          {activeTab === 'applications' && (
            <label className="recruiter-filter">
              <Filter size={16} />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
              >
                <option value="All">All statuses</option>
                <option value="Under Review">Under Review</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Interview">Interview</option>
                <option value="Rejected">Rejected</option>
                <option value="Hired">Hired</option>
              </select>
            </label>
          )}
        </div>

        {activeTab === 'applications' && (
          <div className="recruiter-table-wrap">
            {filteredApplications.length > 0 ? (
              <table className="recruiter-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Applied For</th>
                    <th>Applied Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredApplications.map((application, index) => (
                    <tr
                      key={`${application.candidateId}-${application.jobId}-${application.id || index}`}
                    >
                      <td>
                        <div className="recruiter-candidate-cell">
                          <div className="recruiter-avatar">
                            {application.candidateName
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>{application.candidateName}</strong>
                            <small>{application.candidateEmail}</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <strong>{application.jobTitle}</strong>
                        <small>{application.company}</small>
                      </td>

                      <td>
                        <span className="recruiter-date">
                          <CalendarDays size={14} />
                          {application.appliedAt || '—'}
                        </span>
                      </td>

                      <td>
                        <span className={getStatusClass(application.status)}>
                          {application.status || 'Under Review'}
                        </span>
                      </td>

                      <td>
                        <button
                          className="recruiter-view-btn"
                          onClick={() =>
                            setSelectedApplication(application)
                          }
                          type="button"
                        >
                          <Eye size={15} />
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="recruiter-empty">
                <FileText size={32} />
                <h3>No applications found</h3>
                <p>
                  Candidate applications will appear here when
                  candidates apply for jobs.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="recruiter-job-list">
            {searchedJobs.length > 0 ? (
              searchedJobs.map((job) => (
                <article className="recruiter-job-row" key={job.id}>
                  <div className="recruiter-job-icon">
                    <BriefcaseBusiness size={21} />
                  </div>

                  <div className="recruiter-job-info">
                    <strong>{job.title}</strong>
                    <span>{job.company}</span>

                    <small>
                      <MapPin size={13} />
                      {job.location || 'Location not specified'}
                      {' · '}
                      {job.type || 'Job type not specified'}
                    </small>

                    {getSkillList(job.requiredSkills).length > 0 && (
                      <small style={{ marginTop: '5px' }}>
                        Required skills:{' '}
                        {getSkillList(job.requiredSkills).join(', ')}
                      </small>
                    )}

                    {getMinimumExperience(job) > 0 && (
                      <small style={{ marginTop: '4px' }}>
                        Minimum experience: {getMinimumExperience(job)} years
                      </small>
                    )}
                  </div>

                  <div className="recruiter-job-applicants">
                    <Users size={16} />
                    {Array.isArray(job.applicants)
                      ? job.applicants.length
                      : 0}{' '}
                    applicants
                  </div>
                </article>
              ))
            ) : (
              <div className="recruiter-empty">
                <BriefcaseBusiness size={32} />
                <h3>No jobs found</h3>
                <p>Try a different search.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'candidates' && (
          <div className="recruiter-candidate-list">
            <div
              style={{
                padding: '18px',
                marginBottom: '18px',
                border: '1px solid #E7E1D9',
                borderRadius: '12px',
                background: '#FAF8F5',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '9px',
                  marginBottom: '12px',
                  color: '#243447',
                }}
              >
                <Target size={19} />
                <strong>Smart Candidate–Job Matching</strong>
              </div>

              <label
                style={{
                  display: 'grid',
                  gap: '7px',
                  color: '#536171',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                Select a job to compare candidates

                <select
                  value={selectedMatchJob?.id || ''}
                  onChange={(event) =>
                    setSelectedMatchJobId(event.target.value)
                  }
                  style={{
                    width: '100%',
                    maxWidth: '520px',
                    padding: '11px 12px',
                    border: '1px solid #D8D1C8',
                    borderRadius: '8px',
                    background: '#FFFFFF',
                    color: '#243447',
                  }}
                >
                  {matchingJobs.length === 0 && (
                    <option value="">
                      No approved jobs available
                    </option>
                  )}

                  {matchingJobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} — {job.company || 'Company'}
                    </option>
                  ))}
                </select>
              </label>

              {selectedMatchJob && (
                <div style={{ marginTop: '12px' }}>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px 18px',
                      color: '#747C86',
                      fontSize: '12px',
                    }}
                  >
                    <span>
                      <BriefcaseBusiness
                        size={13}
                        style={{ verticalAlign: 'middle' }}
                      />{' '}
                      {selectedMatchJob.title}
                    </span>

                    <span>
                      <Code
                        size={13}
                        style={{ verticalAlign: 'middle' }}
                      />{' '}
                      {getSkillList(selectedMatchJob.requiredSkills).length}{' '}
                      required skills
                    </span>

                    <span>
                      <GraduationCap
                        size={13}
                        style={{ verticalAlign: 'middle' }}
                      />{' '}
                      {getMinimumExperience(selectedMatchJob)} years
                      minimum experience
                    </span>
                  </div>

                  {getSkillList(selectedMatchJob.requiredSkills).length ===
                    0 && (
                    <p
                      style={{
                        margin: '12px 0 0',
                        color: '#986A23',
                        fontSize: '13px',
                      }}
                    >
                      <AlertCircle
                        size={15}
                        style={{ verticalAlign: 'middle' }}
                      />{' '}
                      This job has no required skills saved. Add required
                      skills through the employer job listing to calculate
                      match percentages.
                    </p>
                  )}
                </div>
              )}

              <p
                style={{
                  margin: '12px 0 0',
                  color: '#747C86',
                  fontSize: '11px',
                }}
              >
                Match percentage is calculated from the candidate's
                listed skills compared with the job's required skills.
                Experience is checked separately. This is a rule-based
                comparison, not an AI-generated hiring decision.
              </p>
            </div>

            {candidateMatches.length > 0 ? (
              candidateMatches.map(({ candidate, profile, match }) => {
                const hasSkillRequirements =
                  Boolean(match?.requiredSkills.length);

                const score = match?.score;

                const scoreColor =
                  score >= 75
                    ? '#3F8065'
                    : score >= 40
                      ? '#986A23'
                      : '#AE583A';

                const contactVisible =
                  profile?.showContactInfo !== false;

                const resumeVisible =
                  profile?.showResume !== false;

                return (
                  <article
                    className="recruiter-candidate-row"
                    key={candidate.id}
                    style={{
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div className="recruiter-avatar large">
                      {(candidate.name || 'C')
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div
                      className="recruiter-candidate-info"
                      style={{ flex: '1 1 260px', minWidth: 0 }}
                    >
                      <strong>{candidate.name || 'Candidate'}</strong>
                      <span>
                        {profile?.headline || 'Professional candidate'}
                      </span>

                      <small>
                        {contactVisible
                          ? candidate.email
                          : 'Contact information hidden'}
                        {profile?.location
                          ? ` · ${profile.location}`
                          : ''}
                      </small>

                      {profile?.skills && (
                        <p>Skills: {profile.skills}</p>
                      )}

                      {profile?.experience && (
                        <p>
                          Experience: {profile.experience}
                        </p>
                      )}

                      {profile?.education && (
                        <p className="recruiter-candidate-education">
                          <GraduationCap size={14} />
                          {profile.education}
                        </p>
                      )}

                      {resumeVisible ? (
                        <ResumeActions
                          resume={profile?.resume}
                          onView={openResumePreview}
                        />
                      ) : (
                        <span className="recruiter-no-resume">
                          <EyeOff size={15} />
                          Resume hidden by candidate
                        </span>
                      )}

                      {!contactVisible && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            marginTop: 8,
                            color: '#747C86',
                            fontSize: 11,
                          }}
                        >
                          <ShieldCheck size={13} />
                          Contact details are private
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        flex: '1 1 250px',
                        maxWidth: '340px',
                        padding: '12px',
                        border: '1px solid #E7E1D9',
                        borderRadius: '10px',
                        background: '#FFFFFF',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                        }}
                      >
                        <strong
                          style={{
                            color: '#243447',
                            fontSize: '13px',
                          }}
                        >
                          Skills match
                        </strong>

                        {hasSkillRequirements ? (
                          <strong
                            style={{
                              color: scoreColor,
                              fontSize: '20px',
                            }}
                          >
                            {score}%
                          </strong>
                        ) : (
                          <span
                            style={{
                              color: '#986A23',
                              fontSize: '12px',
                            }}
                          >
                            Not available
                          </span>
                        )}
                      </div>

                      {hasSkillRequirements && (
                        <div
                          style={{
                            height: '8px',
                            margin: '9px 0 12px',
                            overflow: 'hidden',
                            borderRadius: '10px',
                            background: '#EEEAE4',
                          }}
                        >
                          <div
                            style={{
                              width: `${score}%`,
                              height: '100%',
                              borderRadius: '10px',
                              background: scoreColor,
                              transition: 'width 0.25s ease',
                            }}
                          />
                        </div>
                      )}

                      {hasSkillRequirements && (
                        <>
                          <div style={{ marginBottom: '9px' }}>
                            <span
                              style={{
                                display: 'block',
                                marginBottom: '5px',
                                color: '#3F8065',
                                fontSize: '11px',
                                fontWeight: 700,
                              }}
                            >
                              <CheckCircle2
                                size={13}
                                style={{ verticalAlign: 'middle' }}
                              />{' '}
                              MATCHED SKILLS (
                              {match.matchedSkills.length})
                            </span>

                            {match.matchedSkills.length > 0 ? (
                              <div
                                style={{
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: '5px',
                                }}
                              >
                                {match.matchedSkills.map((skill) => (
                                  <span
                                    key={skill}
                                    style={{
                                      padding: '4px 7px',
                                      borderRadius: '5px',
                                      background: '#E8EFE9',
                                      color: '#3F8065',
                                      fontSize: '11px',
                                    }}
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <small style={{ color: '#747C86' }}>
                                No required skills matched yet.
                              </small>
                            )}
                          </div>

                          <div>
                            <span
                              style={{
                                display: 'block',
                                marginBottom: '5px',
                                color: '#AE583A',
                                fontSize: '11px',
                                fontWeight: 700,
                              }}
                            >
                              <AlertCircle
                                size={13}
                                style={{ verticalAlign: 'middle' }}
                              />{' '}
                              MISSING SKILLS (
                              {match.missingSkills.length})
                            </span>

                            {match.missingSkills.length > 0 ? (
                              <div
                                style={{
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: '5px',
                                }}
                              >
                                {match.missingSkills.map((skill) => (
                                  <span
                                    key={skill}
                                    style={{
                                      padding: '4px 7px',
                                      borderRadius: '5px',
                                      background: '#F8E9E5',
                                      color: '#AE583A',
                                      fontSize: '11px',
                                    }}
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <small
                                style={{
                                  color: '#3F8065',
                                  fontWeight: 600,
                                }}
                              >
                                All required skills matched.
                              </small>
                            )}
                          </div>
                        </>
                      )}

                      <div
                        style={{
                          marginTop: '12px',
                          paddingTop: '10px',
                          borderTop: '1px solid #EEEAE4',
                        }}
                      >
                        <span
                          style={{
                            display: 'block',
                            marginBottom: '5px',
                            color: '#536171',
                            fontSize: '11px',
                            fontWeight: 700,
                          }}
                        >
                          <Award
                            size={13}
                            style={{ verticalAlign: 'middle' }}
                          />{' '}
                          EXPERIENCE CHECK
                        </span>

                        {match?.experienceStatus === 'not-required' && (
                          <small style={{ color: '#747C86' }}>
                            No minimum experience requirement.
                          </small>
                        )}

                        {match?.experienceStatus === 'meets' && (
                          <small
                            style={{
                              color: '#3F8065',
                              fontWeight: 600,
                            }}
                          >
                            <CheckCircle2
                              size={13}
                              style={{ verticalAlign: 'middle' }}
                            />{' '}
                            Meets requirement —{' '}
                            {match.candidateExperience} years
                          </small>
                        )}

                        {match?.experienceStatus === 'below' && (
                          <small
                            style={{
                              color: '#AE583A',
                              fontWeight: 600,
                            }}
                          >
                            <AlertCircle
                              size={13}
                              style={{ verticalAlign: 'middle' }}
                            />{' '}
                            Below requirement —{' '}
                            {match.candidateExperience} years listed;
                            {` ${match.minimumExperience} years required`}
                          </small>
                        )}

                        {match?.experienceStatus === 'unknown' && (
                          <small style={{ color: '#986A23' }}>
                            Experience not specified in candidate profile.
                            {` ${match.minimumExperience} years required`}
                          </small>
                        )}
                      </div>
                    </div>

                    <div className="recruiter-candidate-count">
                      <strong>
                        {
                          applications.filter(
                            (application) =>
                              String(application.candidateId) ===
                              String(candidate.id)
                          ).length
                        }
                      </strong>
                      <span>Applications</span>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="recruiter-empty">
                <Users size={32} />
                <h3>No visible candidates found</h3>
                <p>
                  No candidates match your search, or candidates have
                  chosen to hide their profiles from recruiter discovery.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* APPLICATION REVIEW MODAL */}
      {selectedApplication && (
        <div
          className="recruiter-modal-backdrop"
          onClick={() => setSelectedApplication(null)}
          role="presentation"
        >
          <section
            className="recruiter-review-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="recruiter-review-title"
          >
            <div className="recruiter-modal-heading">
              <div>
                <span className="recruiter-eyebrow">
                  APPLICATION REVIEW
                </span>

                <h2 id="recruiter-review-title">
                  Candidate details
                </h2>
              </div>

              <button
                onClick={() => setSelectedApplication(null)}
                type="button"
                aria-label="Close review"
              >
                ×
              </button>
            </div>

            <div className="recruiter-review-profile">
              <div className="recruiter-avatar large">
                {selectedApplication.candidateName
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <h3>{selectedApplication.candidateName}</h3>
                <p>{selectedApplication.candidateEmail}</p>
              </div>
            </div>

            <div className="recruiter-review-details">
              <div>
                <span>Applied for</span>
                <strong>{selectedApplication.jobTitle}</strong>
              </div>

              <div>
                <span>Company</span>
                <strong>{selectedApplication.company}</strong>
              </div>

              <div>
                <span>Location</span>
                <strong>{selectedApplication.location}</strong>
              </div>

              <div>
                <span>Phone</span>
                <strong>
                  {selectedApplication.contactVisible
                    ? selectedApplication.phone || 'Not provided'
                    : 'Hidden by candidate'}
                </strong>
              </div>

              <div>
                <span>Education</span>
                <strong>
                  {selectedApplication.education || 'Not provided'}
                </strong>
              </div>

              <div>
                <span>Experience</span>
                <strong>
                  {selectedApplication.experience || 'Not provided'}
                </strong>
              </div>

              <div>
                <span>Skills</span>
                <strong>
                  {selectedApplication.skills || 'Not provided'}
                </strong>
              </div>

              <div>
                <span>Applied date</span>
                <strong>{selectedApplication.appliedAt || '—'}</strong>
              </div>
            </div>

            {selectedApplication.about && (
              <div className="recruiter-review-about">
                <strong>Professional summary</strong>
                <p>{selectedApplication.about}</p>
              </div>
            )}

            <div className="recruiter-review-resume">
              <div>
                <strong>Candidate resume</strong>
                <p>
                  {!selectedApplication.resumeVisible
                    ? 'Hidden by candidate'
                    : selectedApplication.resume?.name ||
                      'No resume has been uploaded.'}
                </p>
              </div>

              {selectedApplication.resumeVisible && (
                <ResumeActions
                  resume={selectedApplication.resume}
                  onView={openResumePreview}
                />
              )}
            </div>

            <label className="recruiter-status-label">
              Update application status

              <select
                value={selectedApplication.status || 'Under Review'}
                onChange={(event) =>
                  updateApplicationStatus(
                    selectedApplication,
                    event.target.value
                  )
                }
              >
                <option value="Under Review">Under Review</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Interview">Interview</option>
                <option value="Rejected">Rejected</option>
                <option value="Hired">Hired</option>
              </select>
            </label>

            <button
              className="recruiter-modal-close"
              onClick={() => setSelectedApplication(null)}
              type="button"
            >
              Close
            </button>
          </section>
        </div>
      )}

      {/* IN-APP RESUME PREVIEW */}
      {previewResume && (
        <div
          onClick={closeResumePreview}
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'rgba(20, 30, 42, 0.82)',
          }}
        >
          <section
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Resume preview"
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: 'min(1100px, 100%)',
              height: 'min(90vh, 900px)',
              overflow: 'hidden',
              borderRadius: '12px',
              background: '#FFFFFF',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <header
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '14px 18px',
                borderBottom: '1px solid #E7E1D9',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <strong
                  style={{
                    display: 'block',
                    color: '#243447',
                    fontSize: '16px',
                  }}
                >
                  Resume Preview
                </strong>

                <span
                  style={{
                    display: 'block',
                    maxWidth: '450px',
                    overflow: 'hidden',
                    color: '#747C86',
                    fontSize: '12px',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {previewResume.name}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  flexShrink: 0,
                }}
              >
                <a
                  href={previewResume.previewUrl}
                  download={
                    previewResume.name || 'candidate-resume.pdf'
                  }
                  className="recruiter-resume-download"
                >
                  <Download size={15} />
                  Download
                </a>

                <button
                  type="button"
                  onClick={closeResumePreview}
                  aria-label="Close resume preview"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    border: 'none',
                    borderRadius: '7px',
                    background: '#F7F4EF',
                    color: '#243447',
                    cursor: 'pointer',
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </header>

            <iframe
              src={previewResume.previewUrl}
              title={`Resume preview: ${previewResume.name}`}
              style={{
                flex: 1,
                width: '100%',
                minHeight: 0,
                border: 'none',
                background: '#E7E7E7',
              }}
            />
          </section>
        </div>
      )}
    </main>
  );
}
