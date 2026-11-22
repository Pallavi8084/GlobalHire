
import { useEffect, useState } from 'react';
import {
  BriefcaseBusiness,
  Bookmark,
  FileText,
  MapPin,
  Mail,
  Pencil,
  Check,
  X,
  ArrowUpRight,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Upload,
  Download,
  Trash2,
  GraduationCap,
  Phone,
  ChevronDown,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';

import ResumeBuilder from './ResumeBuilder.jsx';
import './CandidateDashboard.css';

const defaultProfile = {
  headline: '',
  location: '',
  phone: '',
  skills: '',
  experience: '',
  education: '',
  about: '',
  resume: null,
  profileVisible: true,
  showContactInfo: true,
  showResume: true,
};

const MAX_RESUME_SIZE = 1.5 * 1024 * 1024;

const APPLICATION_STAGES = [
  'Applied',
  'Under Review',
  'Shortlisted',
  'Interview',
  'Hired',
];

const readStorage = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    console.error(`Could not read ${key}:`, error);
    return fallback;
  }
};

const getApplicationStage = (status) => {
  const normalized = String(status || 'Applied').toLowerCase();

  if (normalized.includes('reject')) return 'Rejected';
  if (normalized.includes('hire')) return 'Hired';
  if (normalized.includes('interview')) return 'Interview';
  if (normalized.includes('shortlist')) return 'Shortlisted';
  if (
    normalized.includes('review') ||
    normalized.includes('screen')
  ) {
    return 'Under Review';
  }

  return 'Applied';
};

const getStageIndex = (status) => {
  const stage = getApplicationStage(status);
  return APPLICATION_STAGES.indexOf(stage);
};

const formatTimelineDate = (value) => {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getApplicationDate = (application) => {
  return (
    application.appliedAt ||
    application.createdAt ||
    application.applicationDate ||
    ''
  );
};

function ApplicationTimeline({ application }) {
  const currentStatus = getApplicationStage(application.status);
  const rejected = currentStatus === 'Rejected';
  const currentIndex = getStageIndex(application.status);

  const steps = rejected
    ? APPLICATION_STAGES.slice(0, Math.max(currentIndex, 1) + 1)
    : APPLICATION_STAGES.slice(0, currentIndex + 1);

  const appliedDate = formatTimelineDate(
    getApplicationDate(application)
  );

  const updatedDate = formatTimelineDate(
    application.statusUpdatedAt ||
    application.updatedAt ||
    application.reviewedAt ||
    ''
  );

  const getStepDate = (step) => {
    if (step === 'Applied') return appliedDate;

    if (step === currentStatus) {
      return updatedDate || appliedDate;
    }

    return '';
  };

  return (
    <div
      style={{
        marginTop: 14,
        padding: '16px',
        background: '#F7F4EF',
        border: '1px solid #E7E1D9',
        borderRadius: 10,
      }}
    >
      <strong
        style={{
          display: 'block',
          marginBottom: 15,
          color: '#243447',
          fontSize: 13,
        }}
      >
        Application progress
      </strong>

      <div style={{ display: 'grid', gap: 0 }}>
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;

          return (
            <div
              key={step}
              style={{
                display: 'flex',
                gap: 12,
                minHeight: 48,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: 18,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: '50%',
                    background: '#E8EFE9',
                    color: '#3F8065',
                  }}
                >
                  <Check size={12} strokeWidth={3} />
                </span>

                {!isLast && (
                  <span
                    style={{
                      width: 2,
                      flex: 1,
                      minHeight: 25,
                      background: '#668477',
                    }}
                  />
                )}
              </div>

              <div style={{ paddingBottom: 13 }}>
                <strong
                  style={{
                    display: 'block',
                    color: '#243447',
                    fontSize: 12,
                  }}
                >
                  {step}
                </strong>

                {getStepDate(step) && (
                  <span
                    style={{
                      display: 'block',
                      marginTop: 3,
                      color: '#747C86',
                      fontSize: 11,
                    }}
                  >
                    {getStepDate(step)}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {rejected && (
          <div
            style={{
              display: 'flex',
              gap: 12,
              minHeight: 35,
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center',
                borderRadius: '50%',
                background: '#FCE9E6',
                color: '#B94B3C',
              }}
            >
              <X size={12} strokeWidth={3} />
            </div>

            <div>
              <strong
                style={{
                  display: 'block',
                  color: '#B94B3C',
                  fontSize: 12,
                }}
              >
                Rejected
              </strong>

              {updatedDate && (
                <span
                  style={{
                    display: 'block',
                    marginTop: 3,
                    color: '#747C86',
                    fontSize: 11,
                  }}
                >
                  {updatedDate}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 8,
          padding: '10px 12px',
          background: '#FFFFFF',
          borderRadius: 8,
          color: '#747C86',
          fontSize: 11,
          lineHeight: 1.5,
        }}
      >
        {rejected
          ? 'This application has been closed. You can continue exploring other opportunities.'
          : currentStatus === 'Hired'
            ? 'Congratulations! Your application has reached the hired stage.'
            : currentStatus === 'Interview'
              ? 'Your application has reached the interview stage. Check your notifications for interview details.'
              : 'Your application progress will update when the recruitment team changes its status.'}
      </div>
    </div>
  );
}

export default function CandidateDashboard({
  user,
  savedJobs = [],
  onBrowseJobs = () => {},
}) {
  const userId = user?.id;
  const profileStorageKey = `globalhire_profile_${userId}`;
  const applicationStorageKey = `globalhire_applications_${userId}`;

  const [profile, setProfile] = useState(() => ({
    ...defaultProfile,
    ...readStorage(profileStorageKey, {}),
  }));

  const [applications, setApplications] = useState(() => {
    const data = readStorage(applicationStorageKey, []);
    return Array.isArray(data) ? data : [];
  });

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const refreshApplications = () => {
      const data = readStorage(applicationStorageKey, []);
      setApplications(Array.isArray(data) ? data : []);
    };

    window.addEventListener('storage', refreshApplications);
    window.addEventListener('focus', refreshApplications);
    window.addEventListener(
      'globalhire-data-updated',
      refreshApplications
    );

    return () => {
      window.removeEventListener('storage', refreshApplications);
      window.removeEventListener('focus', refreshApplications);
      window.removeEventListener(
        'globalhire-data-updated',
        refreshApplications
      );
    };
  }, [applicationStorageKey]);

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
  };

  const updateDraft = (event) => {
    const { name, value } = event.target;

    setDraft((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const saveProfile = (event) => {
    event.preventDefault();

    try {
      const updatedProfile = {
        ...profile,
        ...draft,
      };

      localStorage.setItem(
        profileStorageKey,
        JSON.stringify(updatedProfile)
      );

      setProfile(updatedProfile);
      setDraft(updatedProfile);
      setEditing(false);
      showMessage('Your profile has been updated.');
    } catch (error) {
      console.error('Could not save profile:', error);
      showMessage(
        'Unable to save your profile. Please try again.',
        'error'
      );
    }
  };

  const cancelEdit = () => {
    setDraft(profile);
    setEditing(false);
  };

  const updatePrivacySetting = (setting, value) => {
    try {
      const updatedProfile = {
        ...profile,
        [setting]: value,
      };

      localStorage.setItem(
        profileStorageKey,
        JSON.stringify(updatedProfile)
      );

      setProfile(updatedProfile);
      setDraft((previous) => ({
        ...previous,
        [setting]: value,
      }));

      window.dispatchEvent(
        new Event('globalhire-data-updated')
      );

      const messages = {
        profileVisible: value
          ? 'Your profile is now visible to recruiters.'
          : 'Your profile is now hidden from recruiter search.',
        showContactInfo: value
          ? 'Recruiters can now see your contact information.'
          : 'Your contact information is now hidden from recruiters.',
        showResume: value
          ? 'Recruiters can now access your resume.'
          : 'Your resume is now hidden from recruiters.',
      };

      showMessage(messages[setting] || 'Privacy settings updated.');
    } catch (error) {
      console.error('Could not update privacy setting:', error);
      showMessage(
        'Unable to update this privacy setting. Please try again.',
        'error'
      );
    }
  };

  const uploadResume = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['pdf', 'doc', 'docx'];

    if (!allowedExtensions.includes(extension)) {
      showMessage(
        'Please upload a PDF, DOC, or DOCX resume.',
        'error'
      );
      event.target.value = '';
      return;
    }

    if (file.size > MAX_RESUME_SIZE) {
      showMessage(
        'Your resume must be smaller than 1.5 MB.',
        'error'
      );
      event.target.value = '';
      return;
    }

    setUploading(true);

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const updatedProfile = {
          ...profile,
          resume: {
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl: reader.result,
            uploadedAt: new Date().toISOString(),
          },
        };

        localStorage.setItem(
          profileStorageKey,
          JSON.stringify(updatedProfile)
        );

        setProfile(updatedProfile);
        setDraft(updatedProfile);
        showMessage('Your resume has been uploaded successfully.');
      } catch (error) {
        console.error('Could not save resume:', error);
        showMessage(
          'Unable to save this resume. Try a smaller file.',
          'error'
        );
      } finally {
        setUploading(false);
        event.target.value = '';
      }
    };

    reader.onerror = () => {
      setUploading(false);
      event.target.value = '';
      showMessage(
        'Could not read your resume. Please try again.',
        'error'
      );
    };

    reader.readAsDataURL(file);
  };

  const removeResume = () => {
    try {
      const updatedProfile = {
        ...profile,
        resume: null,
      };

      localStorage.setItem(
        profileStorageKey,
        JSON.stringify(updatedProfile)
      );

      setProfile(updatedProfile);
      setDraft(updatedProfile);
      showMessage('Your resume has been removed.');
    } catch (error) {
      console.error('Could not remove resume:', error);
      showMessage(
        'Unable to remove your resume. Please try again.',
        'error'
      );
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'File size unavailable';
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const completedFields = [
    user?.name,
    user?.email,
    profile.headline,
    profile.location,
    profile.phone,
    profile.skills,
    profile.experience,
    profile.education,
    profile.about,
    profile.resume?.name,
  ].filter((value) => String(value || '').trim()).length;

  const completion = Math.round((completedFields / 10) * 100);

  const statusCount = (status) =>
    applications.filter(
      (application) =>
        getApplicationStage(application.status) === status
    ).length;

  const statusClass = (status) => {
    const normalized = getApplicationStage(status);

    if (normalized === 'Shortlisted') return 'status-shortlisted';
    if (normalized === 'Rejected') return 'status-rejected';
    if (normalized === 'Interview') return 'status-interview';
    if (normalized === 'Hired') return 'status-shortlisted';

    return 'status-pending';
  };

  const privacyOptions = [
    {
      key: 'profileVisible',
      title: 'Profile visibility',
      description:
        'Allow recruiters to discover your profile in candidate search.',
      icon: profile.profileVisible ? Eye : EyeOff,
    },
    {
      key: 'showContactInfo',
      title: 'Show contact information',
      description:
        'Allow recruiters to see your email address and phone number.',
      icon: Mail,
    },
    {
      key: 'showResume',
      title: 'Resume visibility',
      description:
        'Allow recruiters to view and download your uploaded resume.',
      icon: FileText,
    },
  ];

  return (
    <main className="candidate-dashboard">
      <div className="dashboard-heading">
        <div>
          <span className="section-eyebrow">
            CANDIDATE WORKSPACE
          </span>

          <h1>
            Hello, {user?.name?.split(' ')[0] || 'Candidate'}!
          </h1>

          <p>Here's an overview of your career journey.</p>
        </div>

        <button
          type="button"
          className="dashboard-browse-btn"
          onClick={onBrowseJobs}
        >
          Find jobs <ArrowUpRight size={17} />
        </button>
      </div>

      {message && (
        <div
          className={`dashboard-message ${
            messageType === 'error' ? 'dashboard-message-error' : ''
          }`}
          role="status"
        >
          {messageType === 'error' ? (
            <AlertCircle size={17} />
          ) : (
            <CheckCircle2 size={17} />
          )}

          <span>{message}</span>

          <button
            type="button"
            onClick={() => setMessage('')}
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <section className="dashboard-stats">
        <div className="dashboard-stat-card">
          <span className="dashboard-stat-icon icon-terracotta">
            <BriefcaseBusiness size={21} />
          </span>
          <div>
            <strong>{applications.length}</strong>
            <span>Applications</span>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <span className="dashboard-stat-icon icon-blue">
            <Bookmark size={21} />
          </span>
          <div>
            <strong>{savedJobs.length}</strong>
            <span>Saved jobs</span>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <span className="dashboard-stat-icon icon-sage">
            <CheckCircle2 size={21} />
          </span>
          <div>
            <strong>{statusCount('Shortlisted')}</strong>
            <span>Shortlisted</span>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <span className="dashboard-stat-icon icon-slate">
            <FileText size={21} />
          </span>
          <div>
            <strong>{completion}%</strong>
            <span>Profile complete</span>
          </div>
        </div>
      </section>

      <div className="dashboard-layout">
        <section className="dashboard-main-column">

          {/* PROFILE SECTION */}
          <div className="dashboard-panel profile-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>My profile</h2>
                <p>
                  Help employers understand your experience.
                </p>
              </div>

              {!editing ? (
                <button
                  type="button"
                  className="dashboard-edit-btn"
                  onClick={() => {
                    setDraft(profile);
                    setEditing(true);
                    setMessage('');
                  }}
                >
                  <Pencil size={15} />
                  Edit profile
                </button>
              ) : (
                <button
                  type="button"
                  className="dashboard-cancel-btn"
                  onClick={cancelEdit}
                >
                  <X size={15} />
                  Cancel
                </button>
              )}
            </div>

            <div className="profile-identity">
              <div className="profile-avatar">
                {user?.name?.charAt(0)?.toUpperCase() || 'C'}
              </div>

              <div>
                <h3>{user?.name || 'Candidate'}</h3>
                <p>
                  {profile.headline ||
                    'Add your professional headline'}
                </p>
              </div>
            </div>

            {!editing ? (
              <div className="profile-details">
                <div>
                  <Mail size={16} />
                  <span>
                    {user?.email || 'No email available'}
                  </span>
                </div>

                <div>
                  <MapPin size={16} />
                  <span>
                    {profile.location || 'Location not added'}
                  </span>
                </div>

                <div>
                  <Phone size={16} />
                  <span>
                    {profile.phone || 'Phone number not added'}
                  </span>
                </div>

                <div>
                  <BriefcaseBusiness size={16} />
                  <span>
                    {profile.experience || 'Experience not added'}
                  </span>
                </div>

                <div>
                  <GraduationCap size={16} />
                  <span>
                    {profile.education || 'Education not added'}
                  </span>
                </div>

                <div className="profile-about">
                  {profile.about ||
                    'Add a short introduction about yourself.'}
                </div>

                <div className="profile-skills">
                  <strong>Skills</strong>

                  <div className="skill-tags">
                    {profile.skills ? (
                      profile.skills
                        .split(',')
                        .filter((skill) => skill.trim())
                        .map((skill, index) => (
                          <span key={`${skill}-${index}`}>
                            {skill.trim()}
                          </span>
                        ))
                    ) : (
                      <span>Add your skills to your profile</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <form
                className="profile-edit-form"
                onSubmit={saveProfile}
              >
                <label htmlFor="profile-headline">
                  Professional headline
                </label>
                <input
                  id="profile-headline"
                  name="headline"
                  value={draft.headline || ''}
                  onChange={updateDraft}
                  placeholder="e.g. Frontend Developer"
                />

                <label htmlFor="profile-location">
                  Location
                </label>
                <input
                  id="profile-location"
                  name="location"
                  value={draft.location || ''}
                  onChange={updateDraft}
                  placeholder="e.g. Bengaluru, India"
                />

                <label htmlFor="profile-phone">
                  Phone number
                </label>
                <input
                  id="profile-phone"
                  name="phone"
                  value={draft.phone || ''}
                  onChange={updateDraft}
                  placeholder="Your contact number"
                />

                <label htmlFor="profile-experience">
                  Experience
                </label>
                <input
                  id="profile-experience"
                  name="experience"
                  value={draft.experience || ''}
                  onChange={updateDraft}
                  placeholder="e.g. 2 years"
                />

                <label htmlFor="profile-education">
                  Education
                </label>
                <input
                  id="profile-education"
                  name="education"
                  value={draft.education || ''}
                  onChange={updateDraft}
                  placeholder="e.g. B.Tech in Computer Science"
                />

                <label htmlFor="profile-skills">
                  Skills
                </label>
                <input
                  id="profile-skills"
                  name="skills"
                  value={draft.skills || ''}
                  onChange={updateDraft}
                  placeholder="React, JavaScript, CSS"
                />

                <label htmlFor="profile-about">
                  About me
                </label>
                <textarea
                  id="profile-about"
                  name="about"
                  rows="4"
                  value={draft.about || ''}
                  onChange={updateDraft}
                  placeholder="Write a short professional introduction..."
                />

                <button
                  className="profile-save-btn"
                  type="submit"
                >
                  <Check size={17} />
                  Save profile
                </button>
              </form>
            )}
          </div>

          {/* PROFILE PRIVACY SETTINGS */}
          <div className="dashboard-panel privacy-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>Profile privacy</h2>
                <p>
                  Choose what recruiters can see about you.
                </p>
              </div>

              <ShieldCheck
                size={23}
                className="panel-heading-icon"
              />
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              {privacyOptions.map((option) => {
                const Icon = option.icon;
                const enabled = profile[option.key] !== false;

                return (
                  <div
                    key={option.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 14,
                      padding: '13px',
                      border: '1px solid #E7E1D9',
                      borderRadius: 10,
                      background: '#FFFFFF',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 11,
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          display: 'grid',
                          placeItems: 'center',
                          width: 36,
                          height: 36,
                          flexShrink: 0,
                          borderRadius: 9,
                          background: '#F7F4EF',
                          color: '#5278C7',
                        }}
                      >
                        <Icon size={18} />
                      </span>

                      <div>
                        <strong
                          style={{
                            display: 'block',
                            color: '#243447',
                            fontSize: 13,
                          }}
                        >
                          {option.title}
                        </strong>

                        <span
                          style={{
                            display: 'block',
                            marginTop: 4,
                            color: '#747C86',
                            fontSize: 11,
                            lineHeight: 1.5,
                          }}
                        >
                          {option.description}
                        </span>

                        <span
                          style={{
                            display: 'inline-block',
                            marginTop: 5,
                            color: enabled ? '#3F8065' : '#AE583A',
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {enabled ? 'Visible to recruiters' : 'Hidden from recruiters'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      aria-label={`${option.title}: ${enabled ? 'on' : 'off'}`}
                      onClick={() =>
                        updatePrivacySetting(option.key, !enabled)
                      }
                      style={{
                        position: 'relative',
                        width: 46,
                        height: 26,
                        flexShrink: 0,
                        padding: 0,
                        border: 'none',
                        borderRadius: 20,
                        background: enabled ? '#668477' : '#C7C7C7',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: 3,
                          left: enabled ? 23 : 3,
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: '#FFFFFF',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          transition: 'left 0.2s ease',
                        }}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            <p
              style={{
                margin: '13px 0 0',
                color: '#747C86',
                fontSize: 11,
                lineHeight: 1.5,
              }}
            >
              These settings apply to recruiter profile discovery and candidate details. Your existing job applications remain visible to the recruitment team.
            </p>
          </div>

          {/* RESUME MANAGEMENT */}
          <div className="dashboard-panel resume-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>My resume</h2>
                <p>
                  Upload your latest resume for recruitment opportunities.
                </p>
              </div>

              <FileText
                size={22}
                className="panel-heading-icon"
              />
            </div>

            {profile.resume?.dataUrl ? (
              <div className="resume-file-card">
                <div className="resume-file-icon">
                  <FileText size={25} />
                </div>

                <div className="resume-file-info">
                  <strong>{profile.resume.name}</strong>
                  <span>
                    {formatFileSize(profile.resume.size)} · Uploaded resume
                  </span>
                </div>

                <div className="resume-file-actions">
                  <a
                    href={profile.resume.dataUrl}
                    download={profile.resume.name}
                    className="resume-download-btn"
                    aria-label="Download resume"
                    title="Download resume"
                  >
                    <Download size={17} />
                  </a>

                  <button
                    type="button"
                    className="resume-remove-btn"
                    onClick={removeResume}
                    aria-label="Remove resume"
                    title="Remove resume"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="resume-empty">
                <Upload size={27} />
                <strong>No resume uploaded</strong>
                <span>
                  Add a PDF, DOC, or DOCX file to your profile.
                </span>
              </div>
            )}

            <label
              htmlFor="candidate-resume-upload"
              className={`resume-upload-btn ${
                uploading ? 'resume-upload-disabled' : ''
              }`}
            >
              <Upload size={17} />
              {uploading
                ? 'Uploading resume...'
                : profile.resume
                  ? 'Replace resume'
                  : 'Upload resume'}
            </label>

            <input
              id="candidate-resume-upload"
              className="resume-file-input"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={uploadResume}
              disabled={uploading}
            />

            <p className="resume-help-text">
              Accepted formats: PDF, DOC, DOCX. Maximum file size: 1.5 MB.
            </p>
          </div>

          {/* ONLINE RESUME BUILDER */}
          <ResumeBuilder user={user} profile={profile} />

          {/* APPLICATIONS AND TIMELINE */}
          <div className="dashboard-panel applications-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>My applications & progress</h2>
                <p>
                  Follow every stage of your recruitment journey.
                </p>
              </div>

              <FileText
                size={21}
                className="panel-heading-icon"
              />
            </div>

            {applications.length > 0 ? (
              <div className="application-list">
                {applications.map((application, index) => (
                  <div
                    className="application-row"
                    key={
                      application.id ||
                      `${application.title}-${index}`
                    }
                    style={{
                      display: 'block',
                      padding: '16px 0',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div className="application-company-icon">
                        {application.company?.charAt(0) || 'J'}
                      </div>

                      <div className="application-info">
                        <strong>{application.title || 'Job application'}</strong>
                        <span>{application.company || 'Company not specified'}</span>

                        <small>
                          <Clock3 size={12} />
                          Applied {getApplicationDate(application)
                            ? formatTimelineDate(getApplicationDate(application))
                            : 'recently'}
                        </small>
                      </div>

                      <span
                        className={`application-status ${statusClass(
                          application.status
                        )}`}
                      >
                        {getApplicationStage(application.status)}
                      </span>
                    </div>

                    <details
                      style={{
                        marginTop: 12,
                        color: '#5278C7',
                        fontSize: 12,
                      }}
                    >
                      <summary
                        style={{
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontWeight: 700,
                          listStylePosition: 'inside',
                        }}
                      >
                        <Clock3 size={14} />
                        View application timeline
                        <ChevronDown size={14} />
                      </summary>

                      <ApplicationTimeline application={application} />
                    </details>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty">
                <FileText size={27} />
                <h3>No applications yet</h3>
                <p>
                  When you apply for jobs, your applications
                  will appear here.
                </p>
                <button
                  type="button"
                  onClick={onBrowseJobs}
                >
                  Explore jobs <ArrowUpRight size={15} />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT SIDEBAR */}
        <aside className="dashboard-side-column">
          <div className="dashboard-panel completion-panel">
            <div className="dashboard-panel-heading">
              <h2>Profile strength</h2>
              <strong>{completion}%</strong>
            </div>

            <div className="completion-track">
              <span
                style={{ width: `${completion}%` }}
              />
            </div>

            <p>
              {completion === 100
                ? 'Your profile is complete. Great work!'
                : 'Complete your profile to help employers discover you.'}
            </p>

            {completion < 100 && (
              <button
                type="button"
                className="complete-profile-btn"
                onClick={() => {
                  setDraft(profile);
                  setEditing(true);
                  setMessage('');
                }}
              >
                Complete profile <ArrowUpRight size={15} />
              </button>
            )}
          </div>

          <div className="dashboard-panel tips-panel">
            <span className="tips-icon">
              <AlertCircle size={20} />
            </span>

            <h2>Career tip</h2>
            <p>
              Add relevant skills, education, a clear professional
              headline, and your latest resume to make your profile
              more useful to recruiters.
            </p>
          </div>

          <div className="dashboard-panel saved-summary-panel">
            <div className="dashboard-panel-heading">
              <h2>Saved opportunities</h2>
              <Bookmark
                size={19}
                className="panel-heading-icon"
              />
            </div>

            <strong className="saved-summary-number">
              {savedJobs.length}
            </strong>

            <p>Jobs saved to your shortlist.</p>

            <button
              type="button"
              onClick={onBrowseJobs}
            >
              Discover more jobs <ArrowUpRight size={15} />
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}
