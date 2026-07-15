import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { RiArrowLeftLine, RiUserAddLine } from 'react-icons/ri';
import './Register.css';
import './Login.css';

const IITM_DOMAINS = [
  '@ds.study.iitm.ac.in', '@es.study.iitm.ac.in', '@mg.study.iitm.ac.in',
  '@ae.study.iitm.ac.in', '@study.iitm.ac.in', '@code.iitm.ac.in', '@nptel.iitm.ac.in'
];

const SOURCES = ['Friends/Family', 'Social Media', 'Internet Search', 'University/College', 'Other'];

export default function Register() {
  const location = useLocation();
  const navigate = useNavigate();
  const { googleRegister } = useAuth();
  
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const state = location.state || {};
  const isIITM = state.email && IITM_DOMAINS.some(domain => state.email.endsWith(domain));
  
  const [formData, setFormData] = useState({
    name: state.name || '',
    age: '',
    profession: '',
    level: '', 
    facultyType: '', 
    programme: '', 
    source: '',
  });

  useEffect(() => {
    if (!state.idToken) {
      navigate('/login', { replace: true });
    }
  }, [state, navigate]);

  const handleNext = () => {
    if (!formData.name || !formData.age || !formData.profession) {
      setError('Please fill in all required fields.');
      return;
    }
    if (isIITM) {
      if (formData.profession === 'Student' && !formData.level) {
        setError('Please select a level.');
        return;
      }
      if (formData.profession === 'Faculty' && !formData.facultyType) {
        setError('Please specify faculty type.');
        return;
      }
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!formData.source) {
      setError('Please select how you heard about us.');
      return;
    }
    if (!isIITM && !formData.programme) {
      setError('Please select a programme.');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    const payload = {
      id_token: state.idToken,
      age: parseInt(formData.age),
      profession: formData.profession,
      source: formData.source,
      level: formData.level || null,
      faculty_type: formData.facultyType || null,
      interested_programme: formData.programme || null
    };
    
    const result = await googleRegister(payload);
    setIsLoading(false);
    
    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setError(result.error);
    }
  };

  if (!state.idToken) return null;

  return (
    <div className="register-page">
      <div className="login-bg">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
      </div>

      <motion.div
        className="register-card glass-card"
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
      >
        {step === 1 ? (
          <Link to="/login" className="login-back">
            <RiArrowLeftLine size={18} /> Back to Login
          </Link>
        ) : (
          <button className="login-back" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <RiArrowLeftLine size={18} /> Back
          </button>
        )}

        <div className="login-header" style={{ marginBottom: '20px' }}>
          <div className="login-icon">
            <RiUserAddLine size={28} />
          </div>
          <h1 className="login-title">Complete Profile</h1>
          <p className="login-desc">{state.email}</p>
        </div>

        {error && (
          <motion.div className="login-error" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '15px' }}>
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="register-form">
              <div className="login-field">
                <label className="login-label">Name</label>
                <input className="login-input-simple" type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div className="login-field">
                <label className="login-label">Age</label>
                <input className="login-input-simple" type="number" min="10" max="120" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
              </div>

              {isIITM ? (
                <>
                  <div className="login-field">
                    <label className="login-label">Profession</label>
                    <select className="login-input-simple" value={formData.profession} onChange={e => setFormData({...formData, profession: e.target.value, level: '', facultyType: ''})}>
                      <option value="">Select Profession</option>
                      <option value="Student">Student</option>
                      <option value="Faculty">Faculty</option>
                    </select>
                  </div>

                  {formData.profession === 'Student' && (
                    <div className="login-field">
                      <label className="login-label">Level</label>
                      <select className="login-input-simple" value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})}>
                        <option value="">Select Level</option>
                        <option value="Foundation">Foundation</option>
                        <option value="Diploma">Diploma</option>
                        <option value="Degree">Degree</option>
                        <option value="PG Diploma">PG Diploma</option>
                        <option value="Masters">Masters</option>
                      </select>
                    </div>
                  )}

                  {formData.profession === 'Faculty' && (
                    <div className="login-field">
                      <label className="login-label">Type of Faculty</label>
                      <input className="login-input-simple" type="text" placeholder="teaching staff, POD, coordinators etc." value={formData.facultyType} onChange={e => setFormData({...formData, facultyType: e.target.value})} />
                    </div>
                  )}
                </>
              ) : (
                <div className="login-field">
                  <label className="login-label">Current Profession</label>
                  <select className="login-input-simple" value={formData.profession} onChange={e => setFormData({...formData, profession: e.target.value})}>
                    <option value="">Select Profession</option>
                    <option value="Currently pursuing a degree">Currently pursuing a degree</option>
                    <option value="Student">Student</option>
                    <option value="Working professional">Working professional</option>
                  </select>
                </div>
              )}
              
              <button className="login-submit btn-primary" onClick={handleNext} style={{ marginTop: '15px' }}>Next Step</button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="register-form">
              {!isIITM && (
                <div className="login-field">
                  <label className="login-label">Programme Interested In</label>
                  <select className="login-input-simple" value={formData.programme} onChange={e => setFormData({...formData, programme: e.target.value})}>
                    <option value="">Select Programme</option>
                    <option value="ds">Data Science and Applications (ds)</option>
                    <option value="es">Electronic Systems (es)</option>
                    <option value="mg">Management and Data Science (mg)</option>
                    <option value="ae">Aeronautics and Space Technology (ae)</option>
                  </select>
                </div>
              )}
              
              <div className="login-field">
                <label className="login-label">Where did you hear about us?</label>
                <select className="login-input-simple" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})}>
                  <option value="">Select Source</option>
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <button className="login-submit btn-primary" onClick={handleSubmit} disabled={isLoading} style={{ marginTop: '15px', display: 'flex', justifyContent: 'center' }}>
                {isLoading ? <span className="login-spinner" /> : 'Complete Registration'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
