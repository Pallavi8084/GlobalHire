
import { useState } from 'react';
import {
  Users,
  BriefcaseBusiness,
  FileText,
  Building2,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  RefreshCw,
  XCircle,
  Clock3,
} from 'lucide-react';
import { addNotification } from '../utils/notifications.js';
import './AdminDashboard.css';

const readStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const getApprovalStatus = (job) =>
  job.adminStatus || 'Pending Approval';

export default function AdminDashboard({ user }) {
  const [users, setUsers] = useState(() => {
    const data = readStorage('globalhire_users', []);
    return Array.isArray(data) ? data : [];
  });

  const [jobs, setJobs] = useState(() => {
    const data = readStorage('globalhire_all_jobs', []);
    return Array.isArray(data) ? data : [];
  });

  const [applications, setApplications] = useState(() => getApplications());

  const [activeTab, setActiveTab] = useState('jobs');
  const [message, setMessage] = useState('');

  function getApplications() {
    const result = [];

    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('globalhire_applications_')) {
          const records = readStorage(key, []);

          if (Array.isArray(records)) {
            result.push(...records);
          }
        }
      });
    } catch (error) {
      console.error('Could not load applications:', error);
    }

    return result;
  }

  const candidates = users.filter(
    (item) => String(item.role).toLowerCase() === 'candidate'
  );

  const employers = users.filter((item) => {
    const role = String(item.role).toLowerCase();
    return role === 'employer' || role === 'recruiter';
  });

  const pendingJobs = jobs.filter(
    (job) => getApprovalStatus(job) === 'Pending Approval'
  );

  const refreshData = () => {
    const latestUsers = readStorage('globalhire_users', []);
    const latestJobs = readStorage('globalhire_all_jobs', []);

    setUsers(Array.isArray(latestUsers) ? latestUsers : []);
    setJobs(Array.isArray(latestJobs) ? latestJobs : []);
    setApplications(getApplications());

    setMessage('Dashboard data refreshed.');
  };

  const updateJobs = (updatedJobs, successMessage) => {
    try {
      localStorage.setItem(
        'globalhire_all_jobs',
        JSON.stringify(updatedJobs)
      );

      setJobs(updatedJobs);
      setMessage(successMessage || 'Job listing updated successfully.');
      return true;
    } catch (error) {
      console.error('Could not update jobs:', error);
      setMessage('Could not update the job listing.');
      return false;
    }
  };

  const changeJobStatus = (jobId, status) => {
    const selectedJob = jobs.find(
      (job) => String(job.id) === String(jobId)
    );

    if (!selectedJob) {
      setMessage('Could not find this job listing.');
      return;
    }

    const updatedJobs = jobs.map((job) =>
      String(job.id) === String(jobId)
        ? {
            ...job,
            adminStatus: status,
            reviewedAt: new Date().toISOString(),
            reviewedBy: user?.id || 'admin',
          }
        : job
    );

    const success = updateJobs(
      updatedJobs,
      `Job listing ${status.toLowerCase()} successfully.`
    );

    if (!success) return;

    if (selectedJob.employerId) {
      const notificationDetails = {
        Approved: {
          title: 'Job listing approved',
          message: `Your job listing "${selectedJob.title}" has been approved and is now visible in public job search.`,
        },
        Rejected: {
          title: 'Job listing rejected',
          message: `Your job listing "${selectedJob.title}" was rejected by the administrator. Please contact the platform administrator for more information.`,
        },
      };

      const notification = notificationDetails[status];

      if (notification) {
        addNotification(selectedJob.employerId, {
          ...notification,
          type: 'job',
        });
      }
    }
  };

  const approveJob = (jobId) => {
    changeJobStatus(jobId, 'Approved');
  };

  const rejectJob = (jobId) => {
    const confirmed = window.confirm(
      'Are you sure you want to reject this job listing?'
    );

    if (!confirmed) return;

    changeJobStatus(jobId, 'Rejected');
  };

  const removeJob = (jobId) => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently remove this job listing?'
    );

    if (!confirmed) return;

    const updatedJobs = jobs.filter(
      (job) => String(job.id) !== String(jobId)
    );

    updateJobs(updatedJobs, 'Job listing removed successfully.');
  };

  const stats = [
    {
      label: 'Total Users',
      value: users.length,
      icon: Users,
      color: 'blue',
    },
    {
      label: 'Candidates',
      value: candidates.length,
      icon: Users,
      color: 'green',
    },
    {
      label: 'Employers',
      value: employers.length,
      icon: Building2,
      color: 'terracotta',
    },
    {
      label: 'Job Listings',
      value: jobs.length,
      icon: BriefcaseBusiness,
      color: 'blue',
    },
    {
      label: 'Applications',
      value: applications.length,
      icon: FileText,
      color: 'green',
    },
    {
      label: 'Pending Approval',
      value: pendingJobs.length,
      icon: Clock3,
      color: 'terracotta',
    },
  ];

  const getStatusStyle = (status) => {
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

  return (
    <main className="admin-dashboard">
      <div className="admin-heading">
        <div>
          <span className="admin-eyebrow">
            <ShieldCheck size={15} />
            PLATFORM MANAGEMENT
          </span>

          <h1>Admin Dashboard</h1>

          <p>
            Manage users, job listings, and recruitment
            activity across GlobalHire.
          </p>
        </div>

        <button
          className="admin-refresh-btn"
          onClick={refreshData}
          type="button"
        >
          <RefreshCw size={16} />
          Refresh Data
        </button>
      </div>

      <section className="admin-welcome">
        <div>
          <span>Welcome back</span>
          <h2>{user?.name || 'Administrator'}</h2>
          <p>Here's your platform overview.</p>
        </div>

        <div className="admin-welcome-icon">
          <ShieldCheck size={30} />
        </div>
      </section>

      {message && (
        <div className="admin-message">
          <span>{message}</span>
          <button
            type="button"
            onClick={() => setMessage('')}
            aria-label="Close message"
          >
            ×
          </button>
        </div>
      )}

      <section className="admin-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              className={`admin-stat-card ${stat.color}`}
              key={stat.label}
            >
              <div className="admin-stat-icon">
                <Icon size={21} />
              </div>

              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </article>
          );
        })}
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Manage Platform</h2>
            <p>Review recruitment activity and platform users.</p>
          </div>

          <div className="admin-tabs">
            <button
              type="button"
              className={activeTab === 'jobs' ? 'active' : ''}
              onClick={() => setActiveTab('jobs')}
            >
              Job Listings
              {pendingJobs.length > 0 && (
                <span
                  style={{
                    display: 'inline-grid',
                    placeItems: 'center',
                    minWidth: '19px',
                    height: '19px',
                    marginLeft: '6px',
                    padding: '0 5px',
                    borderRadius: '20px',
                    background: '#C76B4A',
                    color: '#FFFFFF',
                    fontSize: '10px',
                  }}
                >
                  {pendingJobs.length}
                </span>
              )}
            </button>

            <button
              type="button"
              className={activeTab === 'users' ? 'active' : ''}
              onClick={() => setActiveTab('users')}
            >
              Users
            </button>

            <button
              type="button"
              className={activeTab === 'applications' ? 'active' : ''}
              onClick={() => setActiveTab('applications')}
            >
              Applications
            </button>
          </div>
        </div>

        {activeTab === 'jobs' && (
          <div className="admin-list">
            {jobs.length === 0 ? (
              <p className="admin-empty">
                No employer-created jobs found.
              </p>
            ) : (
              jobs.map((job) => {
                const status = getApprovalStatus(job);

                return (
                  <article className="admin-job-row" key={job.id}>
                    <div className="admin-row-icon">
                      <BriefcaseBusiness size={20} />
                    </div>

                    <div className="admin-row-content">
                      <strong>{job.title}</strong>
                      <span>
                        {job.company || 'Company not specified'} ·{' '}
                        {job.location || 'Location not specified'}
                      </span>
                      <small>
                        {job.category || 'Other'} ·{' '}
                        {job.type || 'Not specified'}
                      </small>

                      <span
                        style={{
                          ...getStatusStyle(status),
                          display: 'inline-flex',
                          alignSelf: 'flex-start',
                          marginTop: '7px',
                          padding: '4px 9px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        {status}
                      </span>
                    </div>

                    <div className="admin-row-actions">
                      {status !== 'Approved' && (
                        <button
                          type="button"
                          className="admin-approve-btn"
                          onClick={() => approveJob(job.id)}
                          title="Approve job"
                          aria-label={`Approve ${job.title}`}
                        >
                          <CheckCircle2 size={18} />
                        </button>
                      )}

                      {status !== 'Rejected' && (
                        <button
                          type="button"
                          className="admin-delete-btn"
                          onClick={() => rejectJob(job.id)}
                          title="Reject job"
                          aria-label={`Reject ${job.title}`}
                        >
                          <XCircle size={18} />
                        </button>
                      )}

                      <button
                        type="button"
                        className="admin-delete-btn"
                        onClick={() => removeJob(job.id)}
                        title="Permanently remove job"
                        aria-label={`Remove ${job.title}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="admin-list">
            {users.length === 0 ? (
              <p className="admin-empty">
                No registered users found.
              </p>
            ) : (
              users.map((item, index) => (
                <article
                  className="admin-user-row"
                  key={item.id || item.email || index}
                >
                  <div className="admin-user-avatar">
                    {(item.name || 'U').charAt(0).toUpperCase()}
                  </div>

                  <div className="admin-row-content">
                    <strong>{item.name || 'Unnamed user'}</strong>
                    <span>{item.email || 'No email available'}</span>
                  </div>

                  <span className="admin-role">
                    {item.role || 'User'}
                  </span>
                </article>
              ))
            )}
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="admin-list">
            {applications.length === 0 ? (
              <p className="admin-empty">
                No applications have been submitted yet.
              </p>
            ) : (
              applications.map((application, index) => (
                <article
                  className="admin-user-row"
                  key={application.id || index}
                >
                  <div className="admin-row-icon">
                    <FileText size={20} />
                  </div>

                  <div className="admin-row-content">
                    <strong>
                      {application.title || 'Untitled job'}
                    </strong>
                    <span>
                      {application.company || 'Company not specified'}
                    </span>
                    <small>
                      Applied: {application.appliedAt || 'Date unavailable'}
                    </small>
                  </div>

                  <span className="admin-status approved">
                    {application.status || 'Submitted'}
                  </span>
                </article>
              ))
            )}
          </div>
        )}
      </section>
    </main>
  );
}
