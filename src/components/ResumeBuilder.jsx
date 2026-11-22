
import { useState } from 'react';
import {
  FileText,
  Eye,
  Download,
  Save,
  CheckCircle2,
} from 'lucide-react';

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);

const createInitialResume = (profile, user) => ({
  fullName: user?.name || '',
  email: user?.email || '',
  phone: profile?.phone || '',
  location: profile?.location || '',
  headline: profile?.headline || '',
  summary: profile?.about || '',
  skills: profile?.skills || '',
  experience: profile?.experience || '',
  education: profile?.education || '',
  certifications: '',
  portfolio: '',
});

const loadResume = (storageKey, profile, user) => {
  try {
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      return {
        ...createInitialResume(profile, user),
        ...JSON.parse(saved),
      };
    }
  } catch (error) {
    console.error('Could not load resume:', error);
  }

  return createInitialResume(profile, user);
};

export default function ResumeBuilder({ user, profile }) {
  const storageKey = `globalhire_resume_builder_${user?.id}`;

  const [resume, setResume] = useState(() =>
    loadResume(storageKey, profile, user)
  );

  const [message, setMessage] = useState('');

  const updateField = (event) => {
    const { name, value } = event.target;

    setResume((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const saveResume = () => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(resume)
      );

      setMessage('Resume saved successfully.');
    } catch (error) {
      console.error('Could not save resume:', error);
      setMessage(
        'Could not save your resume. Please try again.'
      );
    }
  };

  const downloadPDF = () => {
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      setMessage(
        'Please allow pop-ups to download your resume.'
      );
      return;
    }

    const skills = String(resume.skills || '')
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${escapeHtml(resume.fullName)} - Resume</title>
        <meta charset="UTF-8" />

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            color: #243447;
            line-height: 1.55;
            max-width: 800px;
            margin: 35px auto;
            padding: 25px;
          }

          h1 {
            margin: 0 0 5px;
            font-size: 28px;
          }

          h2 {
            font-size: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 2px solid #C76B4A;
            padding-bottom: 6px;
            margin-top: 25px;
          }

          .headline {
            color: #C76B4A;
            font-size: 16px;
          }

          .contact {
            color: #555;
            font-size: 12px;
            margin-top: 10px;
          }

          .content {
            white-space: pre-wrap;
            font-size: 13px;
          }

          li {
            font-size: 13px;
            margin: 4px 0;
          }

          @media print {
            body {
              margin: 0;
              padding: 20px;
            }
          }
        </style>
      </head>

      <body>
        <h1>${escapeHtml(resume.fullName)}</h1>

        <div class="headline">
          ${escapeHtml(resume.headline)}
        </div>

        <div class="contact">
          ${escapeHtml(resume.email)}
          ${resume.phone ? ' | ' + escapeHtml(resume.phone) : ''}
          ${resume.location ? ' | ' + escapeHtml(resume.location) : ''}
        </div>

        ${resume.summary ? `
          <h2>Professional Summary</h2>
          <div class="content">${escapeHtml(resume.summary)}</div>
        ` : ''}

        ${skills.length ? `
          <h2>Skills</h2>
          <ul>
            ${skills.map((skill) =>
              `<li>${escapeHtml(skill)}</li>`
            ).join('')}
          </ul>
        ` : ''}

        ${resume.experience ? `
          <h2>Experience</h2>
          <div class="content">${escapeHtml(resume.experience)}</div>
        ` : ''}

        ${resume.education ? `
          <h2>Education</h2>
          <div class="content">${escapeHtml(resume.education)}</div>
        ` : ''}

        ${resume.certifications ? `
          <h2>Certifications</h2>
          <div class="content">${escapeHtml(resume.certifications)}</div>
        ` : ''}

        ${resume.portfolio ? `
          <h2>Portfolio / Links</h2>
          <div class="content">${escapeHtml(resume.portfolio)}</div>
        ` : ''}
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };

    setMessage(
      'Choose "Save as PDF" in the print window.'
    );
  };

  const fields = [
    {
      name: 'fullName',
      label: 'Full name',
      placeholder: 'Your full name',
    },
    {
      name: 'email',
      label: 'Email',
      placeholder: 'you@example.com',
    },
    {
      name: 'phone',
      label: 'Phone',
      placeholder: 'Your phone number',
    },
    {
      name: 'location',
      label: 'Location',
      placeholder: 'City, Country',
    },
    {
      name: 'headline',
      label: 'Professional headline',
      placeholder: 'e.g. Software Developer',
    },
  ];

  const textAreas = [
    {
      name: 'summary',
      label: 'Professional summary',
      placeholder:
        'Write a short introduction about your professional background...',
    },
    {
      name: 'skills',
      label: 'Skills',
      placeholder:
        'React, JavaScript, Communication, Project Management',
    },
    {
      name: 'experience',
      label: 'Work experience',
      placeholder:
        'Job title, company, dates, responsibilities, and achievements...',
    },
    {
      name: 'education',
      label: 'Education',
      placeholder:
        'Degree, institution, graduation year...',
    },
    {
      name: 'certifications',
      label: 'Certifications',
      placeholder:
        'Certification name, issuing organization, year...',
    },
    {
      name: 'portfolio',
      label: 'Portfolio and professional links',
      placeholder:
        'Portfolio URL, LinkedIn URL, GitHub URL...',
    },
  ];

  const inputStyle = {
    width: '100%',
    padding: '11px 12px',
    border: '1px solid #E7E1D9',
    borderRadius: 8,
    fontSize: 13,
    color: '#243447',
    background: '#FFFFFF',
    fontFamily: 'inherit',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: '#243447',
    marginBottom: 7,
  };

  return (
    <section
      className="dashboard-panel"
      style={{ marginBottom: 22 }}
    >
      <div className="dashboard-panel-heading">
        <div>
          <h2>Online Resume Builder</h2>
          <p>
            Create and download a professional resume.
          </p>
        </div>

        <FileText
          size={23}
          className="panel-heading-icon"
        />
      </div>

      {message && (
        <div
          role="status"
          style={{
            padding: 11,
            borderRadius: 8,
            background: '#E8EFE9',
            color: '#3F8065',
            fontSize: 12,
            marginBottom: 16,
          }}
        >
          <CheckCircle2
            size={15}
            style={{
              verticalAlign: 'middle',
              marginRight: 6,
            }}
          />

          {message}
        </div>
      )}

      <div style={{ display: 'grid', gap: 15 }}>
        {fields.map((field) => (
          <div key={field.name}>
            <label
              style={labelStyle}
              htmlFor={`builder-${field.name}`}
            >
              {field.label}
            </label>

            <input
              id={`builder-${field.name}`}
              name={field.name}
              value={resume[field.name] || ''}
              onChange={updateField}
              placeholder={field.placeholder}
              style={inputStyle}
            />
          </div>
        ))}

        {textAreas.map((field) => (
          <div key={field.name}>
            <label
              style={labelStyle}
              htmlFor={`builder-${field.name}`}
            >
              {field.label}
            </label>

            <textarea
              id={`builder-${field.name}`}
              name={field.name}
              value={resume[field.name] || ''}
              onChange={updateField}
              placeholder={field.placeholder}
              rows={field.name === 'summary' ? 4 : 3}
              style={{
                ...inputStyle,
                resize: 'vertical',
              }}
            />
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          marginTop: 20,
        }}
      >
        <button
          type="button"
          onClick={saveResume}
          className="profile-save-btn"
        >
          <Save size={16} />
          Save resume
        </button>

        <button
          type="button"
          onClick={downloadPDF}
          className="dashboard-edit-btn"
        >
          <Download size={16} />
          Download PDF
        </button>
      </div>

      {/* RESUME PREVIEW */}
      <div
        style={{
          marginTop: 22,
          padding: 18,
          background: '#F7F4EF',
          borderRadius: 10,
          border: '1px solid #E7E1D9',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 14,
          }}
        >
          <Eye size={17} color="#5278C7" />

          <strong
            style={{
              color: '#243447',
              fontSize: 14,
            }}
          >
            Resume preview
          </strong>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            padding: 20,
            borderRadius: 8,
          }}
        >
          <h2
            style={{
              margin: '0 0 5px',
              color: '#243447',
            }}
          >
            {resume.fullName || 'Your Name'}
          </h2>

          <p
            style={{
              color: '#C76B4A',
              margin: '0 0 8px',
              fontSize: 13,
            }}
          >
            {resume.headline || 'Professional headline'}
          </p>

          <p
            style={{
              color: '#747C86',
              fontSize: 11,
              margin: '0 0 18px',
            }}
          >
            {[
              resume.email,
              resume.phone,
              resume.location,
            ].filter(Boolean).join(' · ') ||
              'Your contact details'}
          </p>

          {[
            ['Professional Summary', resume.summary],
            ['Skills', resume.skills],
            ['Experience', resume.experience],
            ['Education', resume.education],
            ['Certifications', resume.certifications],
            ['Portfolio / Links', resume.portfolio],
          ].map(([heading, content]) =>
            content ? (
              <div
                key={heading}
                style={{ marginTop: 15 }}
              >
                <h3
                  style={{
                    color: '#243447',
                    fontSize: 12,
                    borderBottom: '1px solid #E7E1D9',
                    paddingBottom: 5,
                  }}
                >
                  {heading}
                </h3>

                <p
                  style={{
                    color: '#555E68',
                    fontSize: 12,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {content}
                </p>
              </div>
            ) : null
          )}
        </div>
      </div>

      <p
        style={{
          color: '#747C86',
          fontSize: 11,
          lineHeight: 1.5,
          marginTop: 13,
        }}
      >
        Resume content is saved in this browser. PDF export
        uses your browser's print dialog. Select "Save as PDF".
      </p>
    </section>
  );
}
