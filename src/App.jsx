
import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  MapPin,
  BriefcaseBusiness,
  Bookmark,
  BookmarkCheck,
  ArrowUpRight,
  Menu,
  X,
  Globe2,
  Building2,
  LogOut,
  UserRound,
  CheckCircle2,
} from 'lucide-react';

import AuthModal from './components/AuthModal.jsx';
import CandidateDashboard from './components/CandidateDashboard.jsx';
import EmployerDashboard from './components/EmployerDashboard.jsx';
import RecruiterDashboard from './components/RecruiterDashboard.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import NotificationCenter from './components/NotificationCenter.jsx';
import GlobalJobsMap from './components/GlobalJobsMap.jsx';
import { addNotification } from './utils/notifications.js';
import './App.css';

const initialJobs = [
  {
    id: 'sample-1',
    title: 'Senior UI/UX Designer',
    company: 'PixelCraft Studio',
    category: 'Design',
    location: 'Remote · Worldwide',
    type: 'Full-time',
    salary: '$75k–$95k',
    posted: '2 days ago',
    description:
      'Create intuitive digital experiences, collaborate with product teams, and shape user-centered design systems.',
    logoColor: '#F4E6DF',
  },
  {
    id: 'sample-2',
    title: 'Frontend React Developer',
    company: 'TechNova Global',
    category: 'Technology',
    location: 'Bengaluru, India',
    type: 'Full-time',
    salary: '₹12–18 LPA',
    posted: '1 day ago',
    description:
      'Build responsive web applications using React, modern JavaScript, and reusable component architectures.',
    logoColor: '#E4EAF8',
  },
  {
    id: 'sample-3',
    title: 'Product Marketing Manager',
    company: 'Elevate Digital',
    category: 'Marketing',
    location: 'London, UK',
    type: 'Full-time',
    salary: '£55k–£70k',
    posted: '3 days ago',
    description:
      'Lead go-to-market strategy, product positioning, and campaigns that connect products with customers.',
    logoColor: '#E8EFE9',
  },
  {
    id: 'sample-4',
    title: 'Data Analyst',
    company: 'InsightWorks',
    category: 'Technology',
    location: 'Remote · Europe',
    type: 'Contract',
    salary: '€45k–€60k',
    posted: '4 days ago',
    description:
      'Turn complex datasets into clear insights and dashboards that help teams make better decisions.',
    logoColor: '#F5EFD9',
  },
  {
    id: 'sample-5',
    title: 'HR Business Partner',
    company: 'PeopleFirst Group',
    category: 'Human Resources',
    location: 'Mumbai, India',
    type: 'Full-time',
    salary: '₹10–15 LPA',
    posted: '5 days ago',
    description:
      'Partner with business leaders on talent strategy, employee engagement, and organizational development.',
    logoColor: '#EDE5F4',
  },
  {
    id: 'sample-6',
    title: 'Product Manager',
    company: 'Northstar Technologies',
    category: 'Technology',
    location: 'Remote · Worldwide',
    type: 'Full-time',
    salary: '$90k–$120k',
    posted: '1 week ago',
    description:
      'Define product roadmaps, prioritize opportunities, and work with engineering and design teams.',
    logoColor: '#E2EDF0',
  },
];

const categories = [
  'All Jobs',
  'Technology',
  'Design',
  'Marketing',
  'Human Resources',
  'Finance',
  'Operations',
  'Sales',
  'Other',
];

const countries = [
  'All Countries',
  'Australia',
  'Canada',
  'France',
  'Germany',
  'India',
  'Ireland',
  'Netherlands',
  'Singapore',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
];

const readStorage = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

const normalizeRole = (role) =>
  String(role || '').trim().toLowerCase();

const getJobLocationText = (job) =>
  [
    job.location,
    job.city,
    job.country,
    job.workMode,
    job.workType,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

const getJobWorkMode = (job) => {
  const explicitMode = String(
    job.workMode || job.workType || ''
  ).toLowerCase();

  const location = getJobLocationText(job);

  if (explicitMode.includes('remote') || location.includes('remote')) {
    return 'Remote';
  }

  if (explicitMode.includes('hybrid') || location.includes('hybrid')) {
    return 'Hybrid';
  }

  return 'On-site';
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(() =>
    readStorage('globalhire_current_user', null)
  );

  const [savedJobs, setSavedJobs] = useState(() => {
    const data = readStorage('globalhire_saved_jobs', []);
    return Array.isArray(data) ? data : [];
  });

  const [employerJobs, setEmployerJobs] = useState(() => {
    const data = readStorage('globalhire_all_jobs', []);
    return Array.isArray(data) ? data : [];
  });

  const [applications, setApplications] = useState(() => {
    const user = readStorage('globalhire_current_user', null);

    if (!user?.id) return [];

    const data = readStorage(
      `globalhire_applications_${user.id}`,
      []
    );

    return Array.isArray(data) ? data : [];
  });

  const [activePage, setActivePage] = useState('home');
  const [activeCategory, setActiveCategory] = useState('All Jobs');
  const [searchTerm, setSearchTerm] = useState('');
  const [locationTerm, setLocationTerm] = useState('');

  const [selectedCountry, setSelectedCountry] = useState('All Countries');
  const [cityFilter, setCityFilter] = useState('');
  const [workModeFilter, setWorkModeFilter] = useState('All Work Modes');

  const [notice, setNotice] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const userRole = normalizeRole(currentUser?.role);

  const isCandidate = userRole === 'candidate';
  const isEmployer = userRole === 'employer';
  const isRecruiter = userRole === 'recruiter';
  const isAdmin = userRole === 'admin';

  const refreshEmployerJobs = () => {
    const latestJobs = readStorage('globalhire_all_jobs', []);
    setEmployerJobs(Array.isArray(latestJobs) ? latestJobs : []);
  };

  const refreshApplications = (userId = currentUser?.id) => {
    if (!userId) {
      setApplications([]);
      return;
    }

    const latestApplications = readStorage(
      `globalhire_applications_${userId}`,
      []
    );

    setApplications(
      Array.isArray(latestApplications) ? latestApplications : []
    );
  };

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (!event.key || event.key === 'globalhire_all_jobs') {
        refreshEmployerJobs();
      }

      if (!event.key || event.key === 'globalhire_saved_jobs') {
        const latestSaved = readStorage('globalhire_saved_jobs', []);
        setSavedJobs(Array.isArray(latestSaved) ? latestSaved : []);
      }

      if (!event.key || event.key === 'globalhire_current_user') {
        const latestUser = readStorage(
          'globalhire_current_user',
          null
        );

        setCurrentUser(latestUser);

        if (latestUser?.id) {
          refreshApplications(latestUser.id);
        } else {
          setApplications([]);
        }
      }

      if (
        currentUser?.id &&
        (!event.key ||
          event.key ===
            `globalhire_applications_${currentUser.id}`)
      ) {
        refreshApplications(currentUser.id);
      }
    };

    const handleFocus = () => {
      refreshEmployerJobs();
      refreshApplications();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentUser?.id]);

  const allJobs = useMemo(
    () => [
      ...initialJobs,
      ...employerJobs.filter(
        (job) => job.adminStatus === 'Approved'
      ),
    ],
    [employerJobs]
  );

  const filteredJobs = useMemo(() => {
    return allJobs.filter((job) => {
      const matchesCategory =
        activeCategory === 'All Jobs' ||
        job.category === activeCategory;

      const searchText = [
        job.title,
        job.company,
        job.category,
        job.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = searchText.includes(
        searchTerm.toLowerCase().trim()
      );

      const locationText = getJobLocationText(job);

      const matchesLocation = locationText.includes(
        locationTerm.toLowerCase().trim()
      );

      const selectedCountryLower = selectedCountry.toLowerCase();

      const matchesCountry =
        selectedCountry === 'All Countries' ||
        locationText.includes(selectedCountryLower) ||
        (getJobWorkMode(job) === 'Remote' &&
          (locationText.includes('worldwide') ||
            locationText.includes('global')));

      const matchesCity = locationText.includes(
        cityFilter.toLowerCase().trim()
      );

      const matchesWorkMode =
        workModeFilter === 'All Work Modes' ||
        getJobWorkMode(job) === workModeFilter;

      return (
        matchesCategory &&
        matchesSearch &&
        matchesLocation &&
        matchesCountry &&
        matchesCity &&
        matchesWorkMode
      );
    });
  }, [
    allJobs,
    activeCategory,
    searchTerm,
    locationTerm,
    selectedCountry,
    cityFilter,
    workModeFilter,
  ]);

  const openAuth = (mode) => {
    setAuthMode(mode);
    setAuthOpen(true);
    setMobileMenu(false);
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setAuthOpen(false);
    refreshEmployerJobs();

    const latestApplications = readStorage(
      `globalhire_applications_${user.id}`,
      []
    );

    setApplications(
      Array.isArray(latestApplications) ? latestApplications : []
    );

    setNotice(`Welcome to GlobalHire, ${user.name || 'there'}!`);

    const role = normalizeRole(user.role);

    if (role === 'admin') {
      setActivePage('admin');
    } else if (role === 'employer') {
      setActivePage('employer');
    } else if (role === 'recruiter') {
      setActivePage('recruiter');
    } else {
      setActivePage('home');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('globalhire_current_user');

    setCurrentUser(null);
    setApplications([]);
    setActivePage('home');
    setNotice('You have been logged out successfully.');
    setMobileMenu(false);
  };

  const handleNavigate = (page) => {
    if (page === 'home') {
      refreshEmployerJobs();
    }

    if (page === 'candidate') {
      refreshApplications();
    }

    if (page === 'recruiter' || page === 'admin') {
      refreshEmployerJobs();
    }

    setActivePage(page);
    setMobileMenu(false);
    setNotice('');

    if (page === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSaveJob = (job) => {
    if (!currentUser) {
      setNotice('Please log in to save jobs.');
      openAuth('login');
      return;
    }

    if (!isCandidate) {
      setNotice('Only Candidate accounts can save jobs.');
      return;
    }

    const alreadySaved = savedJobs.some(
      (savedJob) =>
        String(savedJob.id) === String(job.id) &&
        String(savedJob.userId) === String(currentUser.id)
    );

    let updatedSavedJobs;

    if (alreadySaved) {
      updatedSavedJobs = savedJobs.filter(
        (savedJob) =>
          !(
            String(savedJob.id) === String(job.id) &&
            String(savedJob.userId) === String(currentUser.id)
          )
      );

      setNotice('Job removed from your saved list.');
    } else {
      updatedSavedJobs = [
        ...savedJobs,
        { ...job, userId: currentUser.id },
      ];

      setNotice('Job saved successfully.');
    }

    setSavedJobs(updatedSavedJobs);

    try {
      localStorage.setItem(
        'globalhire_saved_jobs',
        JSON.stringify(updatedSavedJobs)
      );
    } catch (error) {
      console.error('Could not save job:', error);
      setNotice('Could not save this job. Please try again.');
    }
  };

  const hasApplied = (jobId) => {
    if (!currentUser?.id || !isCandidate) return false;

    return applications.some(
      (application) =>
        String(application.jobId) === String(jobId)
    );
  };

  const handleApply = (job) => {
    if (!currentUser) {
      setNotice('Please log in before applying for a job.');
      openAuth('login');
      return;
    }

    if (!isCandidate) {
      setNotice('Please log in with a Candidate account to apply.');
      return;
    }

    if (!currentUser.id) {
      setNotice(
        'Your account session is incomplete. Please log in again.'
      );
      return;
    }

    const storageKey = `globalhire_applications_${currentUser.id}`;

    const storedApplications = readStorage(storageKey, []);
    const existingApplications = Array.isArray(storedApplications)
      ? storedApplications
      : [];

    const alreadyApplied = existingApplications.some(
      (application) =>
        String(application.jobId) === String(job.id)
    );

    if (alreadyApplied) {
      setApplications(existingApplications);
      setNotice('You have already applied for this job.');
      return;
    }

    const appliedAt = new Date().toLocaleDateString();

    const newApplication = {
      id: Date.now(),
      jobId: job.id,
      title: job.title,
      company: job.company,
      status: 'Under Review',
      appliedAt,
    };

    try {
      const updatedApplications = [
        ...existingApplications,
        newApplication,
      ];

      localStorage.setItem(
        storageKey,
        JSON.stringify(updatedApplications)
      );

      setApplications(updatedApplications);

      addNotification(currentUser.id, {
        title: 'Application submitted',
        message: `Your application for ${job.title} at ${job.company} was submitted successfully.`,
        type: 'application',
      });

      if (job.employerId) {
        addNotification(job.employerId, {
          title: 'New job application',
          message: `${currentUser.name || 'A candidate'} applied for ${job.title}.`,
          type: 'candidate',
        });
      }

      const latestJobs = readStorage('globalhire_all_jobs', []);
      const safeJobs = Array.isArray(latestJobs) ? latestJobs : [];

      const updatedJobs = safeJobs.map((employerJob) => {
        if (String(employerJob.id) !== String(job.id)) {
          return employerJob;
        }

        const applicants = Array.isArray(employerJob.applicants)
          ? employerJob.applicants
          : [];

        const alreadyInList = applicants.some(
          (applicant) =>
            String(applicant.candidateId) === String(currentUser.id)
        );

        if (alreadyInList) return employerJob;

        return {
          ...employerJob,
          applicants: [
            ...applicants,
            {
              id: Date.now() + 1,
              candidateId: currentUser.id,
              name: currentUser.name || 'Candidate',
              email: currentUser.email || '',
              status: 'Under Review',
              appliedAt,
            },
          ],
        };
      });

      localStorage.setItem(
        'globalhire_all_jobs',
        JSON.stringify(updatedJobs)
      );

      setEmployerJobs(updatedJobs);
      setNotice(`Your application for ${job.title} was submitted.`);
    } catch (error) {
      console.error('Could not submit application:', error);
      setNotice(
        'Could not submit your application. Please try again.'
      );
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setLocationTerm('');
    setCityFilter('');
    setSelectedCountry('All Countries');
    setWorkModeFilter('All Work Modes');
    setActiveCategory('All Jobs');
  };

  const handleMapLocationSelect = (country, city) => {
    setSelectedCountry(country);
    setCityFilter(city);
    setWorkModeFilter('All Work Modes');
    setLocationTerm('');
    setActiveCategory('All Jobs');
    setSearchTerm('');

    document.getElementById('jobs')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const scrollToJobs = () => {
    setActivePage('home');
    refreshEmployerJobs();

    setTimeout(() => {
      document.getElementById('jobs')?.scrollIntoView({
        behavior: 'smooth',
      });
    }, 100);
  };

  const renderJobCard = (job) => {
    const isSaved = savedJobs.some(
      (savedJob) =>
        String(savedJob.id) === String(job.id) &&
        String(savedJob.userId) === String(currentUser?.id)
    );

    const applied = hasApplied(job.id);

    return (
      <article className="job-card" key={job.id}>
        <div className="job-card-top">
          <div
            className="job-company-logo"
            style={{
              backgroundColor: job.logoColor || '#F4E6DF',
            }}
          >
            <Building2 size={23} />
          </div>

          <button
            className="save-job-btn"
            onClick={() => handleSaveJob(job)}
            type="button"
            aria-label={isSaved ? 'Remove saved job' : 'Save job'}
            title={isSaved ? 'Remove saved job' : 'Save job'}
          >
            {isSaved ? (
              <BookmarkCheck size={19} />
            ) : (
              <Bookmark size={19} />
            )}
          </button>
        </div>

        <span className="job-category">{job.category}</span>

        <h3>{job.title}</h3>

        <p className="job-company-name">{job.company}</p>

        <div className="job-meta">
          <span>
            <MapPin size={14} />
            {job.location}
          </span>

          <span>
            <BriefcaseBusiness size={14} />
            {job.type}
          </span>
        </div>

        <p className="job-description">{job.description}</p>

        <div className="job-card-footer">
          <div>
            <strong>{job.salary || 'Salary not specified'}</strong>
            <small>{job.posted || 'Recently posted'}</small>
          </div>

          <button
            className={`job-apply-btn ${
              applied ? 'job-applied-btn' : ''
            }`}
            onClick={() => handleApply(job)}
            type="button"
            disabled={applied}
          >
            {applied ? (
              <>
                Applied <CheckCircle2 size={16} />
              </>
            ) : (
              <>
                Apply <ArrowUpRight size={15} />
              </>
            )}
          </button>
        </div>
      </article>
    );
  };

  return (
    <div className="app-shell">
      <header className="navbar">
        <div className="nav-container">
          <button
            className="brand"
            onClick={() => handleNavigate('home')}
            type="button"
            aria-label="GlobalHire home"
          >
            <span className="brand-mark">
              <Globe2 size={22} />
            </span>
            <span>GlobalHire</span>
          </button>

          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenu((previous) => !previous)}
            type="button"
            aria-label="Toggle navigation"
          >
            {mobileMenu ? <X size={22} /> : <Menu size={22} />}
          </button>

          <nav className={`nav-links ${mobileMenu ? 'nav-open' : ''}`}>
            <button
              className={activePage === 'home' ? 'nav-active' : ''}
              onClick={() => handleNavigate('home')}
              type="button"
            >
              Find Jobs
            </button>

            {isCandidate && (
              <button
                className={activePage === 'candidate' ? 'nav-active' : ''}
                onClick={() => handleNavigate('candidate')}
                type="button"
              >
                My Dashboard
              </button>
            )}

            {isEmployer && (
              <button
                className={activePage === 'employer' ? 'nav-active' : ''}
                onClick={() => handleNavigate('employer')}
                type="button"
              >
                Employer Dashboard
              </button>
            )}

            {isRecruiter && (
              <button
                className={activePage === 'recruiter' ? 'nav-active' : ''}
                onClick={() => handleNavigate('recruiter')}
                type="button"
              >
                Recruiter Dashboard
              </button>
            )}

            {isAdmin && (
              <button
                className={activePage === 'admin' ? 'nav-active' : ''}
                onClick={() => handleNavigate('admin')}
                type="button"
              >
                Admin Dashboard
              </button>
            )}

            <button onClick={scrollToJobs} type="button">
              Explore Opportunities
            </button>
          </nav>

          <div className="nav-actions">
            {currentUser ? (
              <>
                <NotificationCenter user={currentUser} />

                <span className="nav-user">
                  <UserRound size={16} />
                  {currentUser.name}
                </span>

                <button
                  className="nav-login-btn"
                  onClick={handleLogout}
                  type="button"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  className="nav-login-btn"
                  onClick={() => openAuth('login')}
                  type="button"
                >
                  Log in
                </button>

                <button
                  className="nav-signup-btn"
                  onClick={() => openAuth('signup')}
                  type="button"
                >
                  Get Started <ArrowUpRight size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {notice && (
        <div className="app-notice">
          <span>{notice}</span>
          <button
            onClick={() => setNotice('')}
            type="button"
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {activePage === 'home' && (
        <>
          <main>
            <section className="hero-section">
              <div className="hero-content">
                <span className="hero-eyebrow">
                  <Globe2 size={15} />
                  YOUR CAREER, WITHOUT BORDERS
                </span>

                <h1>
                  Find work that
                  <br />
                  <span>moves you forward.</span>
                </h1>

                <p>
                  Discover meaningful opportunities, connect
                  with forward-thinking employers, and build
                  your career anywhere in the world.
                </p>

                <form
                  className="hero-search"
                  onSubmit={(event) => {
                    event.preventDefault();
                    scrollToJobs();
                  }}
                >
                  <label>
                    <Search size={18} />
                    <input
                      type="text"
                      placeholder="Job title, skill or company"
                      value={searchTerm}
                      onChange={(event) =>
                        setSearchTerm(event.target.value)
                      }
                    />
                  </label>

                  <label>
                    <MapPin size={18} />
                    <input
                      type="text"
                      placeholder="Location or remote"
                      value={locationTerm}
                      onChange={(event) =>
                        setLocationTerm(event.target.value)
                      }
                    />
                  </label>

                  <button type="submit">
                    Search Jobs <ArrowUpRight size={16} />
                  </button>
                </form>

                <div className="hero-trending">
                  <span>Popular:</span>

                  {['React', 'Design', 'Marketing', 'Remote'].map((term) => (
                    <button
                      key={term}
                      onClick={() => setSearchTerm(term)}
                      type="button"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              <div className="hero-visual">
                <div className="hero-visual-card">
                  <div className="hero-visual-icon">
                    <Globe2 size={30} />
                  </div>

                  <span>OPPORTUNITIES AROUND THE WORLD</span>

                  <h2>
                    Your next chapter
                    <br />
                    starts here.
                  </h2>

                  <div className="hero-visual-stats">
                    <div>
                      <strong>Global</strong>
                      <small>Career access</small>
                    </div>

                    <div>
                      <strong>Connected</strong>
                      <small>Talent network</small>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="stats-strip">
              <div>
                <strong>Global</strong>
                <span>Career opportunities</span>
              </div>

              <div>
                <strong>Multiple</strong>
                <span>Industries and roles</span>
              </div>

              <div>
                <strong>One place</strong>
                <span>For talent and employers</span>
              </div>

              <div>
                <strong>Always open</strong>
                <span>Explore your next move</span>
              </div>
            </section>

            <section className="jobs-section" id="jobs">
              <div className="section-heading">
                <div>
                  <span className="section-eyebrow">
                    OPPORTUNITIES FOR YOU
                  </span>

                  <h2>Explore open positions</h2>

                  <p>
                    Find a role that matches your skills,
                    ambitions, and way of working.
                  </p>
                </div>

                <span className="jobs-count">
                  {filteredJobs.length} jobs found
                </span>
              </div>

              <div className="category-filters">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={
                      activeCategory === category ? 'category-active' : ''
                    }
                    onClick={() => setActiveCategory(category)}
                    type="button"
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="global-location-filters">
                <div className="global-filter-heading">
                  <Globe2 size={18} />
                  <div>
                    <strong>Explore jobs worldwide</strong>
                    <span>
                      Refine opportunities by location and work style.
                    </span>
                  </div>
                </div>

                <div className="global-filter-controls">
                  <label>
                    <span>Country</span>
                    <select
                      value={selectedCountry}
                      onChange={(event) =>
                        setSelectedCountry(event.target.value)
                      }
                    >
                      {countries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>City or location</span>
                    <input
                      type="text"
                      placeholder="e.g. Bengaluru, London"
                      value={cityFilter}
                      onChange={(event) =>
                        setCityFilter(event.target.value)
                      }
                    />
                  </label>

                  <label>
                    <span>Work mode</span>
                    <select
                      value={workModeFilter}
                      onChange={(event) =>
                        setWorkModeFilter(event.target.value)
                      }
                    >
                      <option>All Work Modes</option>
                      <option>Remote</option>
                      <option>On-site</option>
                      <option>Hybrid</option>
                    </select>
                  </label>

                  <button
                    type="button"
                    className="global-filter-reset"
                    onClick={() => {
                      setSelectedCountry('All Countries');
                      setCityFilter('');
                      setWorkModeFilter('All Work Modes');
                    }}
                  >
                    Reset location
                  </button>
                </div>
              </div>

              <GlobalJobsMap
                jobs={allJobs}
                onLocationSelect={handleMapLocationSelect}
              />

              {(searchTerm ||
                locationTerm ||
                cityFilter ||
                selectedCountry !== 'All Countries' ||
                workModeFilter !== 'All Work Modes') && (
                <div className="active-search">
                  <span>
                    Showing results
                    {searchTerm ? ` for "${searchTerm}"` : ''}
                    {locationTerm ? ` in "${locationTerm}"` : ''}
                    {cityFilter ? ` · City: ${cityFilter}` : ''}
                    {selectedCountry !== 'All Countries'
                      ? ` · Country: ${selectedCountry}`
                      : ''}
                    {workModeFilter !== 'All Work Modes'
                      ? ` · ${workModeFilter}`
                      : ''}
                  </span>

                  <button onClick={clearAllFilters} type="button">
                    Clear all filters
                  </button>
                </div>
              )}

              {filteredJobs.length > 0 ? (
                <div className="jobs-grid">
                  {filteredJobs.map(renderJobCard)}
                </div>
              ) : (
                <div className="empty-jobs">
                  <Search size={32} />
                  <h3>No matching jobs found</h3>
                  <p>
                    Try another keyword, country, city, work mode, or category.
                  </p>

                  <button onClick={clearAllFilters} type="button">
                    Clear all filters
                  </button>
                </div>
              )}
            </section>

            <section className="employer-cta">
              <div>
                <span className="section-eyebrow">FOR EMPLOYERS</span>
                <h2>Build your team without borders.</h2>
                <p>
                  Connect with skilled professionals and find
                  the people who will move your organization
                  forward.
                </p>
              </div>

              <button
                onClick={() => {
                  if (isEmployer) {
                    handleNavigate('employer');
                  } else {
                    openAuth('signup');
                  }
                }}
                type="button"
              >
                {isEmployer ? 'Go to dashboard' : 'Hire with GlobalHire'}
                <ArrowUpRight size={17} />
              </button>
            </section>
          </main>

          <footer className="site-footer">
            <div className="footer-brand">
              <Globe2 size={21} />
              <strong>GlobalHire</strong>
            </div>

            <p>
              Connecting talent and opportunity across the world.
            </p>

            <span>
              © {new Date().getFullYear()} GlobalHire. All rights reserved.
            </span>
          </footer>
        </>
      )}

      {activePage === 'candidate' && isCandidate && (
        <CandidateDashboard
          user={currentUser}
          savedJobs={savedJobs.filter(
            (job) => String(job.userId) === String(currentUser.id)
          )}
          onBrowseJobs={scrollToJobs}
        />
      )}

      {activePage === 'employer' && isEmployer && (
        <EmployerDashboard
          user={currentUser}
          onJobsChange={(updatedJobs) => {
            setEmployerJobs(updatedJobs);

            localStorage.setItem(
              'globalhire_all_jobs',
              JSON.stringify(updatedJobs)
            );
          }}
        />
      )}

      {activePage === 'recruiter' && isRecruiter && (
        <RecruiterDashboard user={currentUser} />
      )}

      {activePage === 'admin' && isAdmin && (
        <AdminDashboard user={currentUser} />
      )}

      {activePage !== 'home' &&
        activePage !== 'candidate' &&
        activePage !== 'employer' &&
        activePage !== 'recruiter' &&
        activePage !== 'admin' && (
          <div className="empty-jobs">
            <h3>Page not found</h3>
            <button
              onClick={() => handleNavigate('home')}
              type="button"
            >
              Return Home
            </button>
          </div>
        )}

      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
