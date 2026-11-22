

import { useState } from 'react';

import {

  BriefcaseBusiness,

  Users,

  Plus,

  MapPin,

  Clock3,

  Trash2,

  X,

  Check,

  FileText,

  ShieldCheck,

  Code,

  GraduationCap,

  CalendarDays,

  Video,

  Building2,

  Globe,

  Pencil,

  Save,

  ExternalLink,

} from 'lucide-react';

import { addNotification } from '../utils/notifications.js';

import './EmployerDashboard.css';

const emptyForm = {

  title: '',

  category: 'Technology',

  location: '',

  type: 'Full-time',

  salary: '',

  salaryMin: '',

  salaryMax: '',

  salaryCurrency: 'INR',

  salaryPeriod: 'year',

  requiredSkills: '',

  minExperience: '',

  description: '',

};

const emptyInterviewForm = {

  date: '',

  time: '',

  mode: 'Online',

  meetingLink: '',

  notes: '',

};

const emptyCompanyProfile = {

  companyName: '',

  tagline: '',

  industry: '',

  website: '',

  headquarters: '',

  companySize: '',

  foundedYear: '',

  description: '',

  logo: '',

};

function readStorage(key, fallback) {

  try {

    const value = localStorage.getItem(key);

    return value ? JSON.parse(value) : fallback;

  } catch (error) {

    console.error('Storage read error:', error);

    return fallback;

  }

}

const getApprovalStatus = (job) =>

  job.adminStatus || 'Pending Approval';

const salaryCurrencies = [
  { code: 'INR', label: 'INR – Indian Rupee' },
  { code: 'USD', label: 'USD – US Dollar' },
  { code: 'EUR', label: 'EUR – Euro' },
  { code: 'GBP', label: 'GBP – British Pound' },
  { code: 'AED', label: 'AED – UAE Dirham' },
  { code: 'CAD', label: 'CAD – Canadian Dollar' },
  { code: 'AUD', label: 'AUD – Australian Dollar' },
  { code: 'SGD', label: 'SGD – Singapore Dollar' },
  { code: 'SAR', label: 'SAR – Saudi Riyal' },
  { code: 'JPY', label: 'JPY – Japanese Yen' },
];

function formatSalaryAmount(amount, currency) {
  if (amount === '' || amount === null || amount === undefined) return '';
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return '';
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(numericAmount);
  } catch {
    return `${currency} ${numericAmount.toLocaleString()}`;
  }
}

function formatSalaryRange(minimum, maximum, currency = 'INR', period = 'year') {
  const minText = formatSalaryAmount(minimum, currency);
  const maxText = formatSalaryAmount(maximum, currency);
  if (!minText && !maxText) return 'Not specified';
  const range = minText && maxText
    ? `${minText} – ${maxText}`
    : minText
      ? `From ${minText}`
      : `Up to ${maxText}`;
  const periodLabel = {
    year: 'year',
    month: 'month',
    hour: 'hour',
  }[period] || period;
  return `${range} / ${periodLabel}`;
}

function getJobSalaryDisplay(job) {
  if (job?.salaryMin !== null && job?.salaryMin !== undefined ||
      job?.salaryMax !== null && job?.salaryMax !== undefined) {
    return formatSalaryRange(
      job.salaryMin ?? '',
      job.salaryMax ?? '',
      job.salaryCurrency || 'INR',
      job.salaryPeriod || 'year'
    );
  }
  return job?.salary || 'Not specified';
}

const getRequiredSkills = (skills) => {

  const values = Array.isArray(skills)

    ? skills

    : typeof skills === 'string'

      ? skills.split(/[,;\n]/)

      : [];

  return [

    ...new Map(

      values

        .map((skill) => String(skill || '').trim())

        .filter(Boolean)

        .map((skill) => [skill.toLowerCase(), skill])

    ).values(),

  ];

};

function formatInterviewDate(date, time) {

  if (!date) return 'Date not set';

  const parsedDate = new Date(`${date}T${time || '00:00'}`);

  if (Number.isNaN(parsedDate.getTime())) return date;

  return parsedDate.toLocaleString([], {

    dateStyle: 'long',

    timeStyle: time ? 'short' : undefined,

  });

}

function getInitialCompanyProfile(user) {

  return {

    ...emptyCompanyProfile,

    companyName:

      user?.company ||

      user?.organization ||

      user?.name ||

      '',

  };

}

export default function EmployerDashboard({ user, onJobsChange }) {

  const companyStorageKey = `globalhire_company_${user?.id}`;

  const [companyProfile, setCompanyProfile] = useState(() => ({

    ...getInitialCompanyProfile(user),

    ...readStorage(

      `globalhire_company_${user?.id}`,

      {}

    ),

  }));

  const [companyForm, setCompanyForm] = useState(() => ({

    ...getInitialCompanyProfile(user),

    ...readStorage(

      `globalhire_company_${user?.id}`,

      {}

    ),

  }));

  const [editingCompany, setEditingCompany] = useState(false);

  const [jobs, setJobs] = useState(() => {

    const allJobs = readStorage('globalhire_all_jobs', []);

    return Array.isArray(allJobs)

      ? allJobs.filter(

          (job) => String(job.employerId) === String(user?.id)

        )

      : [];

  });

  const [form, setForm] = useState({ ...emptyForm });

  const [showForm, setShowForm] = useState(false);

  const [selectedJobId, setSelectedJobId] = useState(null);

  const [notice, setNotice] = useState('');

  const [interviewApplicantId, setInterviewApplicantId] = useState(null);

  const [interviewForm, setInterviewForm] = useState({

    ...emptyInterviewForm,

  });

  const selectedJob =

    jobs.find((job) => String(job.id) === String(selectedJobId)) || null;

  const totalApplicants = jobs.reduce(

    (total, job) =>

      total + (Array.isArray(job.applicants) ? job.applicants.length : 0),

    0

  );

  const shortlisted = jobs.reduce(

    (total, job) =>

      total +

      (Array.isArray(job.applicants)

        ? job.applicants.filter(

            (applicant) => applicant.status === 'Shortlisted'

          ).length

        : 0),

    0

  );

  const pendingApproval = jobs.filter(

    (job) => getApprovalStatus(job) === 'Pending Approval'

  ).length;

  function persistJobs(updatedEmployerJobs) {

    try {

      const storedJobs = readStorage('globalhire_all_jobs', []);

      const allJobs = Array.isArray(storedJobs) ? storedJobs : [];

      const otherEmployersJobs = allJobs.filter(

        (job) => String(job.employerId) !== String(user?.id)

      );

      const updatedAllJobs = [

        ...otherEmployersJobs,

        ...updatedEmployerJobs,

      ];

      localStorage.setItem(

        'globalhire_all_jobs',

        JSON.stringify(updatedAllJobs)

      );

      setJobs(updatedEmployerJobs);

      if (onJobsChange) {

        onJobsChange(updatedAllJobs);

      }

      return true;

    } catch (error) {

      console.error('Storage save error:', error);

      setNotice('Could not save changes. Please try again.');

      return false;

    }

  }

  function handleCompanyFormChange(event) {

    const { name, value } = event.target;

    setCompanyForm((previous) => ({

      ...previous,

      [name]: value,

    }));

  }

  function handleCompanySave(event) {

    event.preventDefault();

    if (!companyForm.companyName.trim()) {

      setNotice('Please enter your company name.');

      return;

    }

    if (

      companyForm.website.trim() &&

      !/^https?:\/\//i.test(companyForm.website.trim())

    ) {

      setNotice('Please enter a valid website starting with https:// or http://.');

      return;

    }

    try {

      const updatedProfile = {

        ...companyForm,

        companyName: companyForm.companyName.trim(),

        tagline: companyForm.tagline.trim(),

        industry: companyForm.industry.trim(),

        website: companyForm.website.trim(),

        headquarters: companyForm.headquarters.trim(),

        companySize: companyForm.companySize.trim(),

        foundedYear: companyForm.foundedYear.trim(),

        description: companyForm.description.trim(),

        logo: companyForm.logo.trim(),

        updatedAt: new Date().toISOString(),

      };

      localStorage.setItem(

        companyStorageKey,

        JSON.stringify(updatedProfile)

      );

      setCompanyProfile(updatedProfile);

      setCompanyForm(updatedProfile);

      setEditingCompany(false);

      setNotice('Company profile saved successfully.');

    } catch (error) {

      console.error('Company profile save error:', error);

      setNotice('Could not save company profile. Please try again.');

    }

  }

  function handleFormChange(event) {

    const { name, value } = event.target;

    setForm((previous) => ({

      ...previous,

      [name]: value,

    }));

  }

  function handlePublish(event) {

    event.preventDefault();

    if (

      !form.title.trim() ||

      !form.location.trim() ||

      !form.description.trim() ||

      !form.requiredSkills.trim()

    ) {

      setNotice(

        'Please complete the job title, location, required skills and description.'

      );

      return;

    }

    const salaryMin = form.salaryMin === '' ? null : Number(form.salaryMin);
    const salaryMax = form.salaryMax === '' ? null : Number(form.salaryMax);

    if (
      (salaryMin !== null && (!Number.isFinite(salaryMin) || salaryMin < 0)) ||
      (salaryMax !== null && (!Number.isFinite(salaryMax) || salaryMax < 0)) ||
      (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax)
    ) {
      setNotice('Please enter valid salary amounts. Minimum cannot exceed maximum.');
      return;
    }

    const salaryDisplay = formatSalaryRange(
      salaryMin ?? '',
      salaryMax ?? '',
      form.salaryCurrency,
      form.salaryPeriod
    );

    const requiredSkills = getRequiredSkills(form.requiredSkills);

    const minExperience = Math.max(

      0,

      Math.min(50, Number(form.minExperience) || 0)

    );

    const newJob = {

      id: Date.now(),

      title: form.title.trim(),

      category: form.category,

      location: form.location.trim(),

      type: form.type,

      salary: salaryDisplay,

      salaryMin,

      salaryMax,

      salaryCurrency: form.salaryCurrency,

      salaryPeriod: form.salaryPeriod,

      description: form.description.trim(),

      requiredSkills,

      minExperience,

      minimumExperience: minExperience,

      company:

        companyProfile.companyName ||

        user?.company ||

        user?.organization ||

        user?.name ||

        'Your Company',

      companyLogo: companyProfile.logo || '',

      employerId: user?.id,

      posted: 'Just now',

      postedAt: new Date().toLocaleDateString(),

      logoColor: '#F4E6DF',

      applicants: [],

      adminStatus: 'Pending Approval',

    };

    const saved = persistJobs([newJob, ...jobs]);

    if (!saved) return;

    setForm({ ...emptyForm });

    setShowForm(false);

    setNotice(

      'Job submitted successfully. It will appear publicly after admin approval.'

    );

  }

  function handleDelete(jobId) {

    const confirmed = window.confirm(

      'Are you sure you want to delete this job listing?'

    );

    if (!confirmed) return;

    const saved = persistJobs(

      jobs.filter((job) => String(job.id) !== String(jobId))

    );

    if (!saved) return;

    if (String(selectedJobId) === String(jobId)) {

      setSelectedJobId(null);

    }

    setNotice('Job listing deleted.');

  }

  function updateCandidateApplication(jobId, candidateId, updates) {

    if (!candidateId) return true;

    const candidateKey = `globalhire_applications_${candidateId}`;

    const storedApplications = readStorage(candidateKey, []);

    const applications = Array.isArray(storedApplications)

      ? storedApplications

      : [];

    const updatedApplications = applications.map((application) =>

      String(application.jobId) === String(jobId)

        ? { ...application, ...updates }

        : application

    );

    try {

      localStorage.setItem(

        candidateKey,

        JSON.stringify(updatedApplications)

      );

      return true;

    } catch (error) {

      console.error('Could not update candidate application:', error);

      return false;

    }

  }

  function handleApplicantStatus(jobId, applicantId, status) {

    const job = jobs.find(

      (item) => String(item.id) === String(jobId)

    );

    const applicant = job?.applicants?.find(

      (item) => String(item.id) === String(applicantId)

    );

    if (!applicant) {

      setNotice('Could not find this applicant.');

      return;

    }

    const previousStatus = applicant.status || 'Under Review';

    if (previousStatus === status) return;

    const statusUpdatedAt = new Date().toISOString();

    const updatedJobs = jobs.map((item) => {

      if (String(item.id) !== String(jobId)) return item;

      return {

        ...item,

        applicants: (item.applicants || []).map((person) =>

          String(person.id) === String(applicantId)

            ? { ...person, status, statusUpdatedAt }

            : person

        ),

      };

    });

    const saved = persistJobs(updatedJobs);

    if (!saved) return;

    const candidateUpdated = updateCandidateApplication(

      jobId,

      applicant.candidateId,

      { status, statusUpdatedAt }

    );

    if (!candidateUpdated) {

      setNotice(

        'Job updated, but candidate application could not be updated.'

      );

      return;

    }

    if (applicant.candidateId) {

      const statusMessages = {

        'Under Review': `Your application for ${job.title} is now under review.`,

        Shortlisted: `Congratulations! You have been shortlisted for ${job.title} at ${job.company}.`,

        Interview: `You have been invited for an interview for ${job.title} at ${job.company}.`,

        Rejected: `Your application for ${job.title} at ${job.company} has been marked as rejected.`,

        Hired: `Congratulations! You have been marked as hired for ${job.title} at ${job.company}.`,

      };

      addNotification(applicant.candidateId, {

        title: `Application status: ${status}`,

        message:

          statusMessages[status] ||

          `Your application status for ${job.title} has changed to ${status}.`,

        type: 'application',

      });

    }

    setNotice(`Applicant status updated to ${status}.`);

  }

  function openInterviewForm(applicant) {

    const existingInterview = applicant.interview || {};

    setInterviewApplicantId(applicant.id);

    setInterviewForm({

      date: existingInterview.date || '',

      time: existingInterview.time || '',

      mode: existingInterview.mode || 'Online',

      meetingLink: existingInterview.meetingLink || '',

      notes: existingInterview.notes || '',

    });

  }

  function handleInterviewFormChange(event) {

    const { name, value } = event.target;

    setInterviewForm((previous) => ({

      ...previous,

      [name]: value,

    }));

  }

  function handleScheduleInterview(event, job, applicant) {

    event.preventDefault();

    if (!interviewForm.date || !interviewForm.time) {

      setNotice('Please select an interview date and time.');

      return;

    }

    if (

      interviewForm.mode === 'Online' &&

      interviewForm.meetingLink.trim() &&

      !/^https?:\/\//i.test(interviewForm.meetingLink.trim())

    ) {

      setNotice('Please enter a valid meeting link starting with http:// or https://.');

      return;

    }

    const interview = {

      ...interviewForm,

      meetingLink: interviewForm.meetingLink.trim(),

      notes: interviewForm.notes.trim(),

      scheduledAt: new Date().toISOString(),

      scheduledBy: user?.name || 'Employer',

      status: 'Scheduled',

    };

    const updatedJobs = jobs.map((item) => {

      if (String(item.id) !== String(job.id)) return item;

      return {

        ...item,

        applicants: (item.applicants || []).map((person) =>

          String(person.id) === String(applicant.id)

            ? {

                ...person,

                interview,

                status: 'Interview',

                statusUpdatedAt: new Date().toISOString(),

              }

            : person

        ),

      };

    });

    const saved = persistJobs(updatedJobs);

    if (!saved) return;

    const candidateUpdated = updateCandidateApplication(

      job.id,

      applicant.candidateId,

      {

        interview,

        status: 'Interview',

        statusUpdatedAt: new Date().toISOString(),

      }

    );

    if (!candidateUpdated) {

      setNotice(

        'Interview saved for the employer, but the candidate application could not be updated.'

      );

      return;

    }

    if (applicant.candidateId) {

      addNotification(applicant.candidateId, {

        title: 'Interview scheduled',

        message: `An interview for ${job.title} at ${job.company} is scheduled for ${formatInterviewDate(interview.date, interview.time)}. Mode: ${interview.mode}.${interview.meetingLink ? ` Meeting link: ${interview.meetingLink}` : ''}`,

        type: 'application',

      });

    }

    setInterviewApplicantId(null);

    setInterviewForm({ ...emptyInterviewForm });

    setNotice(`Interview scheduled for ${applicant.name || 'the candidate'}.`);

  }

  const getApprovalStyle = (status) => {

    if (status === 'Approved') {

      return {

        background: '#E8EFE9',

        color: '#3F8065',

        border: '1px solid #C8DCCF',

      };

    }

    if (status === 'Rejected') {

      return {

        background: '#F8E9E5',

        color: '#AE583A',

        border: '1px solid #EBCFC4',

      };

    }

    return {

      background: '#FFF3DF',

      color: '#986A23',

      border: '1px solid #EAD9B6',

    };

  };

  const inputStyle = {

    width: '100%',

    padding: '10px 12px',

    border: '1px solid #E7E1D9',

    borderRadius: '8px',

    font: 'inherit',

    fontSize: '13px',

    background: '#FFFFFF',

    color: '#243447',

    boxSizing: 'border-box',

  };

  const secondaryButtonStyle = {

    display: 'inline-flex',

    alignItems: 'center',

    justifyContent: 'center',

    gap: '7px',

    padding: '9px 12px',

    border: '1px solid #E7E1D9',

    borderRadius: '8px',

    background: '#FFFFFF',

    color: '#243447',

    cursor: 'pointer',

    fontWeight: 600,

    fontSize: '12px',

  };

  const companyDisplayName =

    companyProfile.companyName ||

    user?.company ||

    user?.organization ||

    user?.name ||

    'Your Company';

  return (

    <main className="employer-dashboard">

      <div className="employer-heading">

        <div>

          <span className="section-eyebrow">EMPLOYER WORKSPACE</span>

          <h1>Welcome, {user?.name || 'Employer'}!</h1>

          <p>Manage your job listings and discover great talent.</p>

        </div>

        <button

          type="button"

          className="employer-primary-btn"

          onClick={() => {

            setForm({ ...emptyForm });

            setShowForm(true);

            setSelectedJobId(null);

          }}

        >

          <Plus size={18} />

          Post a job

        </button>

      </div>

      {notice && (

        <div className="employer-notice" role="status">

          <Check size={17} />

          <span>{notice}</span>

          <button

            type="button"

            onClick={() => setNotice('')}

            aria-label="Dismiss notification"

          >

            <X size={16} />

          </button>

        </div>

      )}

      {/* COMPANY PROFILE & BRANDING */}

      <section className="employer-panel">

        <div className="employer-panel-heading">

          <div>

            <span className="section-eyebrow">YOUR BRAND</span>

            <h2>Company Profile</h2>

            <p>Introduce your organization to candidates and build trust.</p>

          </div>

          {!editingCompany && (

            <button

              type="button"

              className="employer-secondary-btn"

              onClick={() => {

                setCompanyForm({ ...companyProfile });

                setEditingCompany(true);

              }}

            >

              <Pencil size={15} />

              Edit profile

            </button>

          )}

        </div>

        {editingCompany ? (

          <form

            onSubmit={handleCompanySave}

            style={{

              display: 'grid',

              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',

              gap: '14px',

              marginTop: '18px',

            }}

          >

            <label style={{ fontSize: '12px', fontWeight: 600 }}>

              Company name *

              <input

                name="companyName"

                value={companyForm.companyName}

                onChange={handleCompanyFormChange}

                placeholder="e.g. Recruweb Resources"

                required

                style={{ ...inputStyle, display: 'block', marginTop: '6px' }}

              />

            </label>

            <label style={{ fontSize: '12px', fontWeight: 600 }}>

              Tagline

              <input

                name="tagline"

                value={companyForm.tagline}

                onChange={handleCompanyFormChange}

                placeholder="A short introduction to your company"

                style={{ ...inputStyle, display: 'block', marginTop: '6px' }}

              />

            </label>

            <label style={{ fontSize: '12px', fontWeight: 600 }}>

              Industry

              <input

                name="industry"

                value={companyForm.industry}

                onChange={handleCompanyFormChange}

                placeholder="e.g. Recruitment, Technology"

                style={{ ...inputStyle, display: 'block', marginTop: '6px' }}

              />

            </label>

            <label style={{ fontSize: '12px', fontWeight: 600 }}>

              Company website

              <input

                type="url"

                name="website"

                value={companyForm.website}

                onChange={handleCompanyFormChange}

                placeholder="https://yourcompany.com"

                style={{ ...inputStyle, display: 'block', marginTop: '6px' }}

              />

            </label>

            <label style={{ fontSize: '12px', fontWeight: 600 }}>

              Headquarters

              <input

                name="headquarters"

                value={companyForm.headquarters}

                onChange={handleCompanyFormChange}

                placeholder="e.g. New Delhi, India"

                style={{ ...inputStyle, display: 'block', marginTop: '6px' }}

              />

            </label>

            <label style={{ fontSize: '12px', fontWeight: 600 }}>

              Company size

              <select

                name="companySize"

                value={companyForm.companySize}

                onChange={handleCompanyFormChange}

                style={{ ...inputStyle, display: 'block', marginTop: '6px' }}

              >

                <option value="">Select company size</option>

                <option>1–10 employees</option>

                <option>11–50 employees</option>

                <option>51–200 employees</option>

                <option>201–500 employees</option>

                <option>501–1,000 employees</option>

                <option>1,001–5,000 employees</option>

                <option>5,000+ employees</option>

              </select>

            </label>

            <label style={{ fontSize: '12px', fontWeight: 600 }}>

              Founded year

              <input

                type="number"

                name="foundedYear"

                value={companyForm.foundedYear}

                onChange={handleCompanyFormChange}

                min="1800"

                max={new Date().getFullYear()}

                placeholder="e.g. 2015"

                style={{ ...inputStyle, display: 'block', marginTop: '6px' }}

              />

            </label>

            <label style={{ fontSize: '12px', fontWeight: 600 }}>

              Company logo URL

              <input

                type="url"

                name="logo"

                value={companyForm.logo}

                onChange={handleCompanyFormChange}

                placeholder="https://example.com/logo.png"

                style={{ ...inputStyle, display: 'block', marginTop: '6px' }}

              />

              <small style={{ display: 'block', color: '#747C86', marginTop: '5px' }}>

                Use a publicly accessible image URL.

              </small>

            </label>

            <label style={{ gridColumn: '1 / -1', fontSize: '12px', fontWeight: 600 }}>

              About the company

              <textarea

                name="description"

                value={companyForm.description}

                onChange={handleCompanyFormChange}

                rows={4}

                placeholder="Tell candidates about your mission, team, culture and what makes your company a great place to work..."

                style={{ ...inputStyle, display: 'block', marginTop: '6px', resize: 'vertical' }}

              />

            </label>

            {companyForm.logo && (

              <div style={{ gridColumn: '1 / -1' }}>

                <span style={{ fontSize: '12px', fontWeight: 600 }}>Logo preview</span>

                <div style={{ marginTop: '8px' }}>

                  <img

                    src={companyForm.logo}

                    alt="Company logo preview"

                    onError={(event) => {

                      event.currentTarget.style.display = 'none';

                    }}

                    style={{

                      width: '76px',

                      height: '76px',

                      objectFit: 'contain',

                      border: '1px solid #E7E1D9',

                      borderRadius: '10px',

                      padding: '8px',

                    }}

                  />

                </div>

              </div>

            )}

            <div

              style={{

                gridColumn: '1 / -1',

                display: 'flex',

                justifyContent: 'flex-end',

                gap: '9px',

                flexWrap: 'wrap',

              }}

            >

              <button

                type="button"

                className="employer-secondary-btn"

                onClick={() => {

                  setCompanyForm({ ...companyProfile });

                  setEditingCompany(false);

                }}

              >

                Cancel

              </button>

              <button type="submit" className="employer-primary-btn">

                <Save size={16} />

                Save company profile

              </button>

            </div>

          </form>

        ) : (

          <div

            style={{

              display: 'flex',

              gap: '18px',

              alignItems: 'flex-start',

              flexWrap: 'wrap',

              padding: '18px',

              marginTop: '16px',

              background: '#FAF8F5',

              border: '1px solid #E7E1D9',

              borderRadius: '12px',

            }}

          >

            <div

              style={{

                width: '82px',

                height: '82px',

                flexShrink: 0,

                display: 'grid',

                placeItems: 'center',

                overflow: 'hidden',

                borderRadius: '12px',

                background: '#F4E6DF',

                color: '#C76B4A',

              }}

            >

              {companyProfile.logo ? (

                <img

                  src={companyProfile.logo}

                  alt={`${companyDisplayName} logo`}

                  onError={(event) => {

                    event.currentTarget.style.display = 'none';

                  }}

                  style={{

                    width: '100%',

                    height: '100%',

                    objectFit: 'contain',

                    background: '#FFFFFF',

                  }}

                />

              ) : (

                <Building2 size={34} />

              )}

            </div>

            <div style={{ flex: '1 1 240px', minWidth: 0 }}>

              <h3 style={{ margin: '0 0 5px', color: '#243447', fontSize: '20px' }}>

                {companyDisplayName}

              </h3>

              {companyProfile.tagline && (

                <p style={{ margin: '0 0 10px', color: '#5278C7', fontSize: '13px' }}>

                  {companyProfile.tagline}

                </p>

              )}

              <div

                style={{

                  display: 'flex',

                  flexWrap: 'wrap',

                  gap: '12px',

                  color: '#747C86',

                  fontSize: '12px',

                }}

              >

                {companyProfile.industry && (

                  <span><Building2 size={13} style={{ verticalAlign: 'middle' }} /> {companyProfile.industry}</span>

                )}

                {companyProfile.headquarters && (

                  <span><MapPin size={13} style={{ verticalAlign: 'middle' }} /> {companyProfile.headquarters}</span>

                )}

                {companyProfile.companySize && (

                  <span><Users size={13} style={{ verticalAlign: 'middle' }} /> {companyProfile.companySize}</span>

                )}

                {companyProfile.foundedYear && (

                  <span>Founded {companyProfile.foundedYear}</span>

                )}

              </div>

              {companyProfile.description && (

                <p style={{ margin: '12px 0 0', color: '#596575', fontSize: '13px', lineHeight: 1.7 }}>

                  {companyProfile.description}

                </p>

              )}

              {companyProfile.website && (

                <a

                  href={companyProfile.website}

                  target="_blank"

                  rel="noreferrer"

                  style={{

                    display: 'inline-flex',

                    alignItems: 'center',

                    gap: '6px',

                    marginTop: '12px',

                    color: '#5278C7',

                    fontSize: '12px',

                    fontWeight: 600,

                    textDecoration: 'none',

                  }}

                >

                  <Globe size={14} />

                  Visit company website

                  <ExternalLink size={12} />

                </a>

              )}

            </div>

          </div>

        )}

        <p style={{ margin: '12px 0 0', color: '#747C86', fontSize: '11px', lineHeight: 1.6 }}>

          Your company profile is currently stored in this browser for demonstration. A production version should save it through a secure backend and make it available on the public company page.

        </p>

      </section>

      <section className="employer-stats">

        <div className="employer-stat-card">

          <BriefcaseBusiness size={23} />

          <div>

            <strong>{jobs.length}</strong>

            <span>Job listings</span>

          </div>

        </div>

        <div className="employer-stat-card">

          <Users size={23} />

          <div>

            <strong>{totalApplicants}</strong>

            <span>Total applicants</span>

          </div>

        </div>

        <div className="employer-stat-card">

          <FileText size={23} />

          <div>

            <strong>{shortlisted}</strong>

            <span>Shortlisted</span>

          </div>

        </div>

        <div className="employer-stat-card">

          <ShieldCheck size={23} />

          <div>

            <strong>{pendingApproval}</strong>

            <span>Pending approval</span>

          </div>

        </div>

      </section>

      {showForm && (

        <section className="employer-panel">

          <div className="employer-panel-heading">

            <div>

              <h2>Create a job listing</h2>

              <p>

                Enter the opportunity details and candidate requirements.

              </p>

            </div>

            <button

              type="button"

              className="employer-close-btn"

              onClick={() => setShowForm(false)}

              aria-label="Close form"

            >

              <X size={19} />

            </button>

          </div>

          <form className="employer-job-form" onSubmit={handlePublish}>

            <label>

              Job title *

              <input

                name="title"

                value={form.title}

                onChange={handleFormChange}

                placeholder="e.g. Frontend Developer"

                required

              />

            </label>

            <label>

              Category

              <select

                name="category"

                value={form.category}

                onChange={handleFormChange}

              >

                <option>Technology</option>

                <option>Design</option>

                <option>Marketing</option>

                <option>Human Resources</option>

                <option>Finance</option>

                <option>Operations</option>

                <option>Sales</option>

                <option>Other</option>

              </select>

            </label>

            <label>

              Location *

              <input

                name="location"

                value={form.location}

                onChange={handleFormChange}

                placeholder="e.g. Remote / Mumbai"

                required

              />

            </label>

            <label>

              Employment type

              <select

                name="type"

                value={form.type}

                onChange={handleFormChange}

              >

                <option>Full-time</option>

                <option>Part-time</option>

                <option>Contract</option>

                <option>Internship</option>

                <option>Freelance</option>

              </select>

            </label>

            <label>

              Salary currency

              <select
                name="salaryCurrency"
                value={form.salaryCurrency}
                onChange={handleFormChange}
              >
                {salaryCurrencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.label}
                  </option>
                ))}
              </select>

            </label>

            <label>

              Minimum salary

              <input
                type="number"
                name="salaryMin"
                value={form.salaryMin}
                onChange={handleFormChange}
                min="0"
                step="any"
                placeholder="e.g. 800000"
              />

            </label>

            <label>

              Maximum salary

              <input
                type="number"
                name="salaryMax"
                value={form.salaryMax}
                onChange={handleFormChange}
                min="0"
                step="any"
                placeholder="e.g. 1200000"
              />

            </label>

            <label>

              Pay period

              <select
                name="salaryPeriod"
                value={form.salaryPeriod}
                onChange={handleFormChange}
              >
                <option value="year">Per year</option>
                <option value="month">Per month</option>
                <option value="hour">Per hour</option>
              </select>

            </label>

            <p className="employer-full-width" style={{ margin: 0, color: '#747C86', fontSize: '12px' }}>
              Enter amounts in the selected currency. Leave both amounts blank if salary is not disclosed.
            </p>

            <label className="employer-full-width">

              <span>

                <Code size={15} style={{ verticalAlign: 'middle' }} />{' '}

                Required skills *

              </span>

              <input

                name="requiredSkills"

                value={form.requiredSkills}

                onChange={handleFormChange}

                placeholder="e.g. React, JavaScript, HTML, CSS"

                required

              />

              <small>

                Enter skills separated by commas. Recruiters will use these

                to calculate candidate match scores.

              </small>

            </label>

            <label>

              <span>

                <GraduationCap

                  size={15}

                  style={{ verticalAlign: 'middle' }}

                />{' '}

                Minimum experience (years)

              </span>

              <input

                type="number"

                name="minExperience"

                min="0"

                max="50"

                step="0.5"

                value={form.minExperience}

                onChange={handleFormChange}

                placeholder="e.g. 2"

              />

              <small>

                Enter 0 if this is an entry-level position.

              </small>

            </label>

            <label className="employer-full-width">

              Job description *

              <textarea

                name="description"

                value={form.description}

                onChange={handleFormChange}

                placeholder="Describe responsibilities and requirements..."

                rows={5}

                required

              />

            </label>

            <div className="employer-form-actions">

              <button

                type="button"

                className="employer-secondary-btn"

                onClick={() => setShowForm(false)}

              >

                Cancel

              </button>

              <button

                type="submit"

                className="employer-primary-btn"

              >

                <Plus size={17} />

                Submit for approval

              </button>

            </div>

          </form>

        </section>

      )}

      <section className="employer-panel">

        <div className="employer-panel-heading">

          <div>

            <h2>Your job listings</h2>

            <p>Track approval status and manage your opportunities.</p>

          </div>

        </div>

        {jobs.length === 0 ? (

          <div className="employer-empty">

            <BriefcaseBusiness size={34} />

            <h3>No jobs posted yet</h3>

            <p>Publish your first job to get started.</p>

            <button

              type="button"

              className="employer-primary-btn"

              onClick={() => {

                setForm({ ...emptyForm });

                setShowForm(true);

              }}

            >

              <Plus size={17} />

              Create first job

            </button>

          </div>

        ) : (

          <div className="employer-job-list">

            {jobs.map((job) => {

              const approvalStatus = getApprovalStatus(job);

              const jobSkills = getRequiredSkills(job.requiredSkills);

              const experience =

                job.minimumExperience ?? job.minExperience ?? 0;

              return (

                <article className="employer-job-card" key={job.id}>

                  <div className="employer-job-icon">

                    <BriefcaseBusiness size={22} />

                  </div>

                  <div className="employer-job-info">

                    <h3>{job.title}</h3>

                    <p>{job.company}</p>

                    <p style={{ margin: '5px 0 0', color: '#3F8065', fontSize: '13px', fontWeight: 700 }}>
                      {getJobSalaryDisplay(job)}
                    </p>

                    <div className="employer-job-meta">

                      <span>

                        <MapPin size={14} />

                        {job.location}

                      </span>

                      <span>

                        <Clock3 size={14} />

                        {job.type}

                      </span>

                    </div>

                    <small>

                      {job.category} · Posted {job.postedAt || 'Previously'}

                    </small>

                    {jobSkills.length > 0 && (

                      <div style={{ marginTop: '9px' }}>

                        <strong style={{ fontSize: '12px' }}>

                          Required skills:{' '}

                        </strong>

                        <span style={{ fontSize: '12px' }}>

                          {jobSkills.join(', ')}

                        </span>

                      </div>

                    )}

                    <div style={{ marginTop: '6px', fontSize: '12px' }}>

                      <strong>Minimum experience:</strong>{' '}

                      {Number(experience) || 0} years

                    </div>

                    <div style={{ marginTop: '9px' }}>

                      <span

                        style={{

                          ...getApprovalStyle(approvalStatus),

                          display: 'inline-flex',

                          alignItems: 'center',

                          gap: '6px',

                          padding: '5px 10px',

                          borderRadius: '20px',

                          fontSize: '11px',

                          fontWeight: 700,

                        }}

                      >

                        <ShieldCheck size={13} />

                        {approvalStatus}

                      </span>

                    </div>

                    {approvalStatus === 'Rejected' && (

                      <small style={{ display: 'block', marginTop: '6px' }}>

                        This listing is not visible publicly. Contact the

                        administrator for more information.

                      </small>

                    )}

                    {approvalStatus === 'Pending Approval' && (

                      <small style={{ display: 'block', marginTop: '6px' }}>

                        Your listing will appear in job search after admin approval.

                      </small>

                    )}

                  </div>

                  <div className="employer-job-actions">

                    <span className="employer-applicant-count">

                      <Users size={15} />

                      {job.applicants?.length || 0} applicants

                    </span>

                    <button

                      type="button"

                      className="employer-secondary-btn"

                      onClick={() =>

                        setSelectedJobId(

                          selectedJobId === job.id ? null : job.id

                        )

                      }

                    >

                      <FileText size={15} />

                      {selectedJobId === job.id

                        ? 'Hide applicants'

                        : 'View applicants'}

                    </button>

                    <button

                      type="button"

                      className="employer-delete-btn"

                      onClick={() => handleDelete(job.id)}

                      aria-label={`Delete ${job.title}`}

                    >

                      <Trash2 size={16} />

                    </button>

                  </div>

                </article>

              );

            })}

          </div>

        )}

      </section>

      {selectedJob && (

        <section className="employer-panel">

          <div className="employer-panel-heading">

            <div>

              <h2>Applicants: {selectedJob.title}</h2>

              <p>Review candidates and schedule interviews.</p>

            </div>

            <button

              type="button"

              className="employer-close-btn"

              onClick={() => {

                setSelectedJobId(null);

                setInterviewApplicantId(null);

              }}

              aria-label="Close applicants"

            >

              <X size={19} />

            </button>

          </div>

          {selectedJob.applicants?.length > 0 ? (

            <div className="employer-applicant-list">

              {selectedJob.applicants.map((applicant) => (

                <div

                  className="employer-applicant-row"

                  key={applicant.id}

                  style={{

                    display: 'flex',

                    flexWrap: 'wrap',

                    alignItems: 'flex-start',

                    gap: '14px',

                  }}

                >

                  <div style={{ flex: '1 1 200px' }}>

                    <strong>{applicant.name || 'Candidate'}</strong>

                    <p>{applicant.email || 'No email provided'}</p>

                    <small>Applied: {applicant.appliedAt || 'N/A'}</small>

                    {applicant.interview && (

                      <div

                        style={{

                          marginTop: '12px',

                          padding: '12px',

                          background: '#F1F5F3',

                          borderRadius: '9px',

                          fontSize: '12px',

                          lineHeight: 1.7,

                        }}

                      >

                        <strong>

                          <CalendarDays

                            size={14}

                            style={{ verticalAlign: 'middle' }}

                          />{' '}

                          Interview {applicant.interview.status || 'Scheduled'}

                        </strong>

                        <div>

                          {formatInterviewDate(

                            applicant.interview.date,

                            applicant.interview.time

                          )}

                        </div>

                        <div>Mode: {applicant.interview.mode}</div>

                        {applicant.interview.meetingLink && (

                          <a

                            href={applicant.interview.meetingLink}

                            target="_blank"

                            rel="noreferrer"

                          >

                            Open meeting link

                          </a>

                        )}

                        {applicant.interview.notes && (

                          <div>Notes: {applicant.interview.notes}</div>

                        )}

                      </div>

                    )}

                  </div>

                  <div

                    style={{

                      display: 'flex',

                      flexWrap: 'wrap',

                      alignItems: 'center',

                      gap: '8px',

                    }}

                  >

                    <select

                      value={applicant.status || 'Under Review'}

                      onChange={(event) =>

                        handleApplicantStatus(

                          selectedJob.id,

                          applicant.id,

                          event.target.value

                        )

                      }

                    >

                      <option>Under Review</option>

                      <option>Shortlisted</option>

                      <option>Interview</option>

                      <option>Rejected</option>

                      <option>Hired</option>

                    </select>

                    <button

                      type="button"

                      style={secondaryButtonStyle}

                      onClick={() => {

                        if (interviewApplicantId === applicant.id) {

                          setInterviewApplicantId(null);

                        } else {

                          openInterviewForm(applicant);

                        }

                      }}

                    >

                      <CalendarDays size={15} />

                      {applicant.interview ? 'Reschedule' : 'Schedule interview'}

                    </button>

                  </div>

                  {interviewApplicantId === applicant.id && (

                    <form

                      onSubmit={(event) =>

                        handleScheduleInterview(event, selectedJob, applicant)

                      }

                      style={{

                        flex: '1 1 100%',

                        display: 'grid',

                        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',

                        gap: '12px',

                        padding: '16px',

                        marginTop: '4px',

                        background: '#FAF8F5',

                        border: '1px solid #E7E1D9',

                        borderRadius: '10px',

                      }}

                    >

                      <div style={{ gridColumn: '1 / -1' }}>

                        <strong style={{ fontSize: '14px' }}>

                          <CalendarDays

                            size={16}

                            style={{ verticalAlign: 'middle' }}

                          />{' '}

                          Schedule candidate interview

                        </strong>

                        <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#747C86' }}>

                          The candidate will receive an in-platform notification.

                        </p>

                      </div>

                      <label style={{ fontSize: '12px', fontWeight: 600 }}>

                        Interview date *

                        <input

                          type="date"

                          name="date"

                          value={interviewForm.date}

                          onChange={handleInterviewFormChange}

                          min={new Date().toLocaleDateString('en-CA')}

                          required

                          style={{ ...inputStyle, display: 'block', marginTop: '6px' }}

                        />

                      </label>

                      <label style={{ fontSize: '12px', fontWeight: 600 }}>

                        Interview time *

                        <input

                          type="time"

                          name="time"

                          value={interviewForm.time}

                          onChange={handleInterviewFormChange}

                          required

                          style={{ ...inputStyle, display: 'block', marginTop: '6px' }}

                        />

                      </label>

                      <label style={{ fontSize: '12px', fontWeight: 600 }}>

                        Interview mode

                        <select

                          name="mode"

                          value={interviewForm.mode}

                          onChange={handleInterviewFormChange}

                          style={{ ...inputStyle, display: 'block', marginTop: '6px' }}

                        >

                          <option>Online</option>

                          <option>Phone</option>

                          <option>In-person</option>

                        </select>

                      </label>

                      {interviewForm.mode === 'Online' && (

                        <label style={{ fontSize: '12px', fontWeight: 600 }}>

                          Meeting link

                          <input

                            type="url"

                            name="meetingLink"

                            value={interviewForm.meetingLink}

                            onChange={handleInterviewFormChange}

                            placeholder="https://meet.google.com/..."

                            style={{ ...inputStyle, display: 'block', marginTop: '6px' }}

                          />

                        </label>

                      )}

                      <label style={{ gridColumn: '1 / -1', fontSize: '12px', fontWeight: 600 }}>

                        Additional instructions (optional)

                        <textarea

                          name="notes"

                          value={interviewForm.notes}

                          onChange={handleInterviewFormChange}

                          rows={3}

                          placeholder="Add interview instructions or details..."

                          style={{ ...inputStyle, display: 'block', marginTop: '6px', resize: 'vertical' }}

                        />

                      </label>

                      <div

                        style={{

                          gridColumn: '1 / -1',

                          display: 'flex',

                          justifyContent: 'flex-end',

                          flexWrap: 'wrap',

                          gap: '8px',

                        }}

                      >

                        <button

                          type="button"

                          style={secondaryButtonStyle}

                          onClick={() => setInterviewApplicantId(null)}

                        >

                          Cancel

                        </button>

                        <button

                          type="submit"

                          className="employer-primary-btn"

                        >

                          <Video size={16} />

                          Save interview

                        </button>

                      </div>

                    </form>

                  )}

                </div>

              ))}

            </div>

          ) : (

            <div className="employer-empty">

              <Users size={30} />

              <h3>No applicants yet</h3>

              <p>Candidate applications will appear here.</p>

            </div>

          )}

        </section>

      )}

    </main>

  );

}
