import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { toLocalInputValue } from '../utils.js';

const EMPTY = {
  name: '',
  mobile: '',
  email: '',
  organization: '',
  personToMeet: '',
  purpose: '',
  visitDateTime: '',
  status: 'Checked In',
};

export default function VisitorForm() {
  const navigate = useNavigate();
  const { id } = useParams(); // present only when editing
  const isEditing = !!id;
  const { user } = useAuth();
  const isEmployee = user.role === 'employee';

  // Employees suggest from staff names; everyone can type a name too
  const [employees, setEmployees] = useState([]);

  const [form, setForm] = useState({
    ...EMPTY,
    visitDateTime: toLocalInputValue(),
    // Visitors / students get their own details pre-filled (still editable)
    ...(isEmployee
      ? {}
      : { name: user.name, mobile: user.mobile, email: user.email, organization: user.organization || '' }),
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    api
      .get('/users/employees')
      .then((res) => setEmployees(res.data.employees))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    api
      .get(`/visitors/${id}`)
      .then((res) => {
        const v = res.data.visitor;
        setForm({
          name: v.name,
          mobile: v.mobile,
          email: v.email,
          organization: v.organization,
          personToMeet: v.personToMeet,
          purpose: v.purpose,
          visitDateTime: toLocalInputValue(v.visitDateTime),
          status: v.status,
        });
      })
      .catch(() => {
        alert('Visitor not found');
        navigate('/');
      })
      .finally(() => setLoading(false));
  }, [id, isEditing, navigate]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Visitor name is required';
    if (!/^[0-9]{10}$/.test(form.mobile.trim())) e.mobile = 'Enter a valid 10-digit mobile number';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Enter a valid email address';
    if (!form.organization.trim()) e.organization = 'Organization / College is required';
    if (!form.personToMeet.trim()) e.personToMeet = 'Person to meet is required';
    if (!form.purpose.trim()) e.purpose = 'Purpose of visit is required';
    if (!form.visitDateTime) e.visitDateTime = 'Date and time is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      mobile: form.mobile.trim(),
      email: form.email.trim(),
      organization: form.organization.trim(),
      personToMeet: form.personToMeet.trim(),
      purpose: form.purpose.trim(),
      visitDateTime: new Date(form.visitDateTime).toISOString(),
      ...(isEmployee ? { status: form.status } : {}),
    };

    setSaving(true);
    try {
      if (isEditing) {
        await api.patch(`/visitors/${id}`, payload);
      } else {
        await api.post('/visitors', payload);
      }
      navigate('/');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || 'Failed to save visitor');
    } finally {
      setSaving(false);
    }
  }

  function field(key, label, props = {}) {
    return (
      <div className="field">
        <label className="field-label" htmlFor={key}>
          {label}
        </label>
        <input
          id={key}
          className={`input${errors[key] ? ' error' : ''}`}
          value={form[key]}
          onChange={(e) => setField(key, e.target.value)}
          {...props}
        />
        {errors[key] && <p className="field-error">{errors[key]}</p>}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="app">
        <div className="empty-state">
          <p className="empty-label">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="editor-header">
        <div className="editor-header-inner">
          <button type="button" className="btn-back" onClick={() => navigate('/')}>
            <ArrowLeft size={13} />
            Back
          </button>
          <span className="editor-mode-label">
            {isEditing ? 'Edit Visit' : isEmployee ? 'New Visitor' : 'Register Visit'}
          </span>
        </div>
      </header>

      <main className="editor-main">
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid-2">
            {field('name', 'Visitor Name', { placeholder: 'e.g. Ananya Sharma' })}
            {field('mobile', 'Mobile Number', {
              placeholder: '10-digit number',
              inputMode: 'numeric',
              maxLength: 10,
            })}
          </div>

          {field('email', 'Email Address', {
            type: 'email',
            placeholder: 'name@example.com',
          })}

          <div className="grid-2">
            {field('organization', 'Organization / College Name', {
              placeholder: 'e.g. ABC Engineering College',
            })}
            {field('personToMeet', 'Person to Meet', {
              placeholder: 'Type a name or pick from the list',
              list: 'employee-names',
            })}
            <datalist id="employee-names">
              {employees.map((emp) => (
                <option key={emp._id} value={emp.name} />
              ))}
            </datalist>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="purpose">
              Purpose of Visit
            </label>
            <textarea
              id="purpose"
              className={`input textarea${errors.purpose ? ' error' : ''}`}
              rows={3}
              maxLength={300}
              value={form.purpose}
              onChange={(e) => setField('purpose', e.target.value)}
              placeholder="e.g. Interview, client meeting, vendor demo…"
            />
            {errors.purpose && <p className="field-error">{errors.purpose}</p>}
          </div>

          <div className="grid-2">
            {field('visitDateTime', 'Date & Time of Visit', { type: 'datetime-local' })}

            {isEmployee && (
            <div className="field">
              <label className="field-label">Status</label>
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={form.status === 'Checked Out'}
                  onChange={(e) => setField('status', e.target.checked ? 'Checked Out' : 'Checked In')}
                />
                <span>Checked Out</span>
              </label>
              <p className="field-hint">Leave unchecked to keep the visitor Checked In.</p>
            </div>
            )}
          </div>

          <div className="editor-actions">
            <button type="submit" className="btn-publish" disabled={saving}>
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : isEmployee ? 'Register Visitor' : 'Register Visit'}
            </button>
            <button type="button" className="btn-cancel" onClick={() => navigate('/')}>
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
