import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../AuthContext.jsx';
import { ROLES } from '../utils.js';

const ORG_LABEL = {
  visitor: 'Company / Organization',
  student: 'College / School',
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    role: 'visitor',
    name: '',
    email: '',
    mobile: '',
    organization: '',
    employeeCode: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  const isEmployee = form.role === 'employee';

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Enter a valid email address';
    if (!/^[0-9]{10}$/.test(form.mobile.trim())) e.mobile = 'Enter a valid 10-digit mobile number';
    if (!isEmployee && !form.organization.trim()) e.organization = `${ORG_LABEL[form.role]} is required`;
    if (isEmployee && !form.employeeCode.trim()) e.employeeCode = 'Employee access code is required';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    setServerError('');
    try {
      await register({
        role: form.role,
        name: form.name.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        password: form.password,
        ...(isEmployee
          ? { employeeCode: form.employeeCode.trim() }
          : { organization: form.organization.trim() }),
      });
      navigate('/');
    } catch (err) {
      setServerError(err.response?.data?.msg || 'Could not reach the server');
    } finally {
      setBusy(false);
    }
  }

  function field(key, label, props = {}) {
    return (
      <div className="field">
        <label className="field-label" htmlFor={key}>{label}</label>
        <input id={key} className={`input${errors[key] ? ' error' : ''}`} value={form[key]}
          onChange={(e) => setField(key, e.target.value)} {...props} />
        {errors[key] && <p className="field-error">{errors[key]}</p>}
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Visitor Register</p>
        <h1 className="auth-title">Create account</h1>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="field-label">I am a</label>
            <div className="status-picker">
              {ROLES.map((r) => (
                <button key={r.value} type="button"
                  className={`pick-btn${form.role === r.value ? ' active' : ''}`}
                  onClick={() => setField('role', r.value)}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {field('name', 'Full Name')}
          {field('email', 'Email', { type: 'email', autoComplete: 'email' })}
          {field('mobile', 'Mobile Number', { inputMode: 'numeric', maxLength: 10, placeholder: '10-digit number' })}

          {isEmployee
            ? field('employeeCode', 'Employee Access Code', { type: 'password', placeholder: 'Given by your company' })
            : field('organization', ORG_LABEL[form.role])}

          {field('password', 'Password', { type: 'password', autoComplete: 'new-password', placeholder: 'At least 6 characters' })}

          {serverError && <p className="banner-error">{serverError}</p>}

          <button type="submit" className="btn-publish btn-block" disabled={busy}>
            {busy ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <p className="auth-switch">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
