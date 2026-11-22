
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  BriefcaseBusiness,
  CheckCircle2,
  RefreshCw,
  Target,
  Award,
  Clock3,
} from 'lucide-react';
import './RecruiterAnalytics.css';

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

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);

    if (!key?.startsWith('globalhire_applications_')) continue;

    const candidateId = key.replace('globalhire_applications_', '');
    const items = readStorage(key, []);

    if (!Array.isArray(items)) continue;

    items.forEach((application) => {
      results.push({ ...application, candidateId });
    });
  }

  return results;
};

const getInitialData = () => {
  const jobs = readStorage('globalhire_all_jobs', []);
  const users = readStorage('globalhire_users', []);

  return {
    applications: getAllApplications(),
    jobs: Array.isArray(jobs) ? jobs : [],
    users: Array.isArray(users) ? users : [],
  };
};

const getStatus = (application) =>
  String(application.status || 'Under Review').trim().toLowerCase();

const formatMonth = (date) =>
  date.toLocaleDateString('en-US', { month: 'short' });

export default function RecruiterAnalytics() {
  const [data, setData] = useState(getInitialData);
  const [lastUpdated, setLastUpdated] = useState(() => new Date());

  const refreshAnalytics = useCallback(() => {
    const jobs = readStorage('globalhire_all_jobs', []);
    const users = readStorage('globalhire_users', []);

    setData({
      applications: getAllApplications(),
      jobs: Array.isArray(jobs) ? jobs : [],
      users: Array.isArray(users) ? users : [],
    });

    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    const handleStorage = () => refreshAnalytics();
    const handleFocus = () => refreshAnalytics();

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshAnalytics]);

  const analytics = useMemo(() => {
    const { applications, jobs, users } = data;

    const statusCounts = {
      'Under Review': 0,
      Shortlisted: 0,
      Interview: 0,
      Hired: 0,
      Rejected: 0,
    };

    applications.forEach((application) => {
      const status = getStatus(application);

      const matchingStatus = Object.keys(statusCounts).find(
        (item) => item.toLowerCase() === status
      );

      if (matchingStatus) {
        statusCounts[matchingStatus] += 1;
      } else {
        statusCounts['Under Review'] += 1;
      }
    });

    const total = applications.length;

    const sixMonths = [];

    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      date.setMonth(date.getMonth() - i);

      sixMonths.push({
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: formatMonth(date),
        count: 0,
      });
    }

    applications.forEach((application) => {
      if (!application.appliedAt) return;

      const parsedDate = new Date(application.appliedAt);

      if (Number.isNaN(parsedDate.getTime())) return;

      const key = `${parsedDate.getFullYear()}-${parsedDate.getMonth()}`;
      const month = sixMonths.find((item) => item.key === key);

      if (month) month.count += 1;
    });

    const jobCounts = jobs.map((job) => {
      const count = applications.filter(
        (application) =>
          String(application.jobId) === String(job.id)
      ).length;

      return {
        id: job.id,
        title: job.title || 'Untitled job',
        company: job.company || 'Company',
        count,
      };
    });

    jobCounts.sort((a, b) => b.count - a.count);

    const candidateCount = users.filter(
      (item) => String(item.role || '').toLowerCase() === 'candidate'
    ).length;

    const maxMonthlyCount = Math.max(
      1,
      ...sixMonths.map((item) => item.count)
    );

    const maxJobCount = Math.max(
      1,
      ...jobCounts.slice(0, 5).map((item) => item.count)
    );

    const statusColors = {
      'Under Review': '#5278C7',
      Shortlisted: '#668477',
      Interview: '#C76B4A',
      Hired: '#3F8065',
      Rejected: '#B85C52',
    };

    const segments = Object.entries(statusCounts)
      .filter(([, count]) => count > 0)
      .map(([label, count]) => ({
        label,
        count,
        color: statusColors[label],
      }));

    let currentAngle = 0;

    const gradientParts = segments.map((segment) => {
      const start = currentAngle;
      const percentage = total ? (segment.count / total) * 100 : 0;
      currentAngle += percentage * 3.6;

      return `${segment.color} ${start}deg ${currentAngle}deg`;
    });

    const donutBackground = total
      ? `conic-gradient(${gradientParts.join(', ')})`
      : '#EAE6E0';

    return {
      total,
      shortlisted: statusCounts.Shortlisted,
      interviews: statusCounts.Interview,
      hired: statusCounts.Hired,
      rejected: statusCounts.Rejected,
      candidateCount,
      jobCount: jobs.length,
      statusCounts,
      statusColors,
      sixMonths,
      jobCounts: jobCounts.slice(0, 5),
      maxMonthlyCount,
      maxJobCount,
      donutBackground,
    };
  }, [data]);

  const kpis = [
    {
      label: 'Total Applications',
      value: analytics.total,
      icon: BarChart3,
      color: 'blue',
    },
    {
      label: 'Shortlisted',
      value: analytics.shortlisted,
      icon: Target,
      color: 'sage',
    },
    {
      label: 'Interviews',
      value: analytics.interviews,
      icon: Users,
      color: 'terracotta',
    },
    {
      label: 'Successful Hires',
      value: analytics.hired,
      icon: Award,
      color: 'green',
    },
  ];

  return (
    <section className="recruiter-analytics">
      <div className="ra-heading">
        <div>
          <span className="ra-eyebrow">RECRUITMENT INSIGHTS</span>
          <h2>
            <BarChart3 size={23} />
            Recruiter Analytics
          </h2>
          <p>
            Understand application activity and track your recruitment
            pipeline.
          </p>
        </div>

        <button
          type="button"
          className="ra-refresh"
          onClick={refreshAnalytics}
        >
          <RefreshCw size={15} />
          Refresh analytics
        </button>
      </div>

      <div className="ra-kpi-grid">
        {kpis.map((item) => {
          const Icon = item.icon;

          return (
            <article className="ra-kpi-card" key={item.label}>
              <div className={`ra-kpi-icon ${item.color}`}>
                <Icon size={21} />
              </div>
              <div>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            </article>
          );
        })}
      </div>

      <div className="ra-chart-grid">
        <article className="ra-card ra-trend-card">
          <div className="ra-card-heading">
            <div>
              <h3>
                <TrendingUp size={18} />
                Application Trends
              </h3>
              <p>Applications received over the last six months</p>
            </div>
            <span className="ra-chart-tag">6 MONTHS</span>
          </div>

          <div className="ra-bar-chart">
            {analytics.sixMonths.map((month) => (
              <div className="ra-bar-column" key={month.key}>
                <span className="ra-bar-value">{month.count}</span>
                <div className="ra-bar-track">
                  <div
                    className="ra-bar"
                    style={{
                      height: `${
                        month.count === 0
                          ? 3
                          : Math.max(
                              8,
                              (month.count / analytics.maxMonthlyCount) * 100
                            )
                      }%`,
                    }}
                  />
                </div>
                <span className="ra-bar-label">{month.label}</span>
              </div>
            ))}
          </div>

          <div className="ra-chart-footnote">
            <span className="ra-dot blue-dot" />
            Application submissions
          </div>
        </article>

        <article className="ra-card ra-status-card">
          <div className="ra-card-heading">
            <div>
              <h3>
                <CheckCircle2 size={18} />
                Application Pipeline
              </h3>
              <p>Current status of all applications</p>
            </div>
          </div>

          <div className="ra-donut-layout">
            <div
              className="ra-donut"
              style={{ background: analytics.donutBackground }}
            >
              <div className="ra-donut-center">
                <strong>{analytics.total}</strong>
                <span>Applications</span>
              </div>
            </div>

            <div className="ra-legend">
              {Object.entries(analytics.statusCounts).map(
                ([label, count]) => (
                  <div className="ra-legend-item" key={label}>
                    <span
                      className="ra-legend-dot"
                      style={{
                        background: analytics.statusColors[label],
                      }}
                    />
                    <span>{label}</span>
                    <strong>{count}</strong>
                  </div>
                )
              )}
            </div>
          </div>
        </article>

        <article className="ra-card ra-jobs-card">
          <div className="ra-card-heading">
            <div>
              <h3>
                <BriefcaseBusiness size={18} />
                Top Performing Jobs
              </h3>
              <p>Jobs ranked by number of applications</p>
            </div>
          </div>

          {analytics.jobCounts.length > 0 ? (
            <div className="ra-job-list">
              {analytics.jobCounts.map((job, index) => (
                <div className="ra-job-item" key={job.id ?? index}>
                  <div className="ra-job-top">
                    <div>
                      <strong>{job.title}</strong>
                      <span>{job.company}</span>
                    </div>
                    <b>{job.count}</b>
                  </div>

                  <div className="ra-job-track">
                    <div
                      className="ra-job-fill"
                      style={{
                        width: `${
                          (job.count / analytics.maxJobCount) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ra-empty">
              <BriefcaseBusiness size={26} />
              <span>No job listings available yet.</span>
            </div>
          )}
        </article>

        <article className="ra-card ra-summary-card">
          <div className="ra-card-heading">
            <div>
              <h3>
                <Users size={18} />
                Recruitment Overview
              </h3>
              <p>Your current platform activity</p>
            </div>
          </div>

          <div className="ra-summary-list">
            <div>
              <span className="ra-summary-icon blue">
                <Users size={17} />
              </span>
              <span>Registered candidates</span>
              <strong>{analytics.candidateCount}</strong>
            </div>

            <div>
              <span className="ra-summary-icon terracotta">
                <BriefcaseBusiness size={17} />
              </span>
              <span>Available job records</span>
              <strong>{analytics.jobCount}</strong>
            </div>

            <div>
              <span className="ra-summary-icon sage">
                <Clock3 size={17} />
              </span>
              <span>Under review</span>
              <strong>{analytics.statusCounts['Under Review']}</strong>
            </div>

            <div>
              <span className="ra-summary-icon green">
                <Award size={17} />
              </span>
              <span>Hired candidates</span>
              <strong>{analytics.hired}</strong>
            </div>
          </div>

          <div className="ra-hire-rate">
            <div>
              <span>Application-to-hire ratio</span>
              <strong>
                {analytics.total
                  ? `${Math.round(
                      (analytics.hired / analytics.total) * 100
                    )}%`
                  : '0%'}
              </strong>
            </div>
            <div className="ra-hire-track">
              <div
                style={{
                  width: `${
                    analytics.total
                      ? (analytics.hired / analytics.total) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </article>
      </div>

      <p className="ra-data-note">
        Analytics are calculated from the recruitment data currently saved
        in this browser. Refresh to load the latest changes.
        <span>
          Last refreshed: {lastUpdated.toLocaleTimeString()}
        </span>
      </p>
    </section>
  );
}
