import React, { useState } from 'react'; 
import axios from 'axios';
import './App.css';

// --- API CONFIGURATION ---
//const API_URL = 'http://localhost:5000';
const API_URL = 'https://amruthadentalclinicbackend.onrender.com'; 

// --- IMAGE LINKS ---
const IMAGES = {
  landing: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1920&q=80",
  rootCanal: "/rootcanal.jpg",
  whitening: "/whitening.jpg",
  cleaning: "/cleaning.jpg",
  braces: "/braces.jpg",
  general: "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=500&q=60", 
  implants: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=500&q=60"
};

// --- SERVICES LIST ---
const SERVICES_DATA = [
  { id: 0, title: 'General Checkup', img: IMAGES.general, desc: 'Regular dental checkups.', price: 100, sittings: 1 },
  { id: 1, title: 'Root Canal', img: IMAGES.rootCanal, desc: 'Advanced painless technology.', price: 2000, sittings: 3 },
  { id: 2, title: 'Teeth Whitening', img: IMAGES.whitening, desc: 'Get a sparkling white smile.', price: 2000, sittings: 1 },
  { id: 3, title: 'Dental Cleaning', img: IMAGES.cleaning, desc: 'Complete oral hygiene.', price: 750, sittings: 1 },
  { id: 4, title: 'Braces & Aligners', img: IMAGES.braces, desc: 'Perfect teeth alignment.', price: 30000, sittings: 12 },
  { id: 5, title: 'Invisalign', img: IMAGES.implants, desc: 'Clear aligners.', price: 100000, sittings: 10 }
];

function App() {
  const [page, setPage] = useState('landing');
  const [activeTab, setActiveTab] = useState('services'); 
  const [doctorTab, setDoctorTab] = useState('requests'); 
  const [user, setUser] = useState(null);

  // --- STATES ---
  const [searchTerm, setSearchTerm] = useState('');
  
  // FILTERS
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterTimePeriod, setFilterTimePeriod] = useState('all'); 

  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [secret, setSecret] = useState('');
  const [showDoctorLogin, setShowDoctorLogin] = useState(false); 
  const [otp, setOtp] = useState('');          
  const [otpSent, setOtpSent] = useState(false); 
  const [loading, setLoading] = useState(false); 
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [appointments, setAppointments] = useState([]); 
  const [myAppointments, setMyAppointments] = useState([]);
  const [publicReviews, setPublicReviews] = useState([]); 
  
  const [clinicInfo, setClinicInfo] = useState({ 
    openTime: '10:00 AM', closeTime: '08:00 PM', days: 'Mon-Sat',
    address: 'Vidyanagara extension, Chitradurga, Karnataka',
    contactPhone: '+91 85537 67320', contactEmail: 'contact@amruthadental.com'
  });

  const [date, setDate] = useState('');
  const [service, setService] = useState('General Checkup');
  const [assignTime, setAssignTime] = useState({});
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  // --- HELPERS ---
  const getToday = () => new Date().toISOString().split("T")[0];
  const getMaxDate = () => {
    const d = new Date(); d.setDate(d.getDate() + 5);
    return d.toISOString().split("T")[0];
  };

  const formatTime = (time24) => {
    if (!time24) return '';
    const [hour, minute] = time24.split(':');
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minute} ${ampm}`;
  };

  // Helper to convert "10:30 AM" string to Hour Integer (10)
  const getHourFromTimeStr = (timeStr) => {
      if (!timeStr) return -1;
      const [time, modifier] = timeStr.split(' ');
      let [hours] = time.split(':');
      hours = parseInt(hours, 10);
      if (hours === 12 && modifier === 'AM') hours = 0;
      if (hours !== 12 && modifier === 'PM') hours += 12;
      return hours;
  };

  const handleDateChange = (e) => {
    const val = e.target.value;
    if (!val) { setDate(''); return; }
    const parts = val.split('-'); 
    const d = new Date(parts[0], parts[1] - 1, parts[2]); 
    if (d.getDay() === 0) { 
        alert("⚠️ Clinic is closed on Sundays. Please select another date.");
        setDate(''); return;
    }
    setDate(val);
  };

  const sortAppointments = (list, isConfirmed = false) => {
      return list.sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          if (isConfirmed) {
             if (!a.time) return 1; if (!b.time) return -1;
             return a.time.localeCompare(b.time);
          }
          return a.id - b.id;
      });
  };

  // --- MASTER FILTER LOGIC (Name + Date + Time) ---
  const filteredAdminAppts = appointments.filter(appt => {
    const pName = appt.User ? appt.User.username.toLowerCase() : '';
    const sName = appt.service.toLowerCase();
    const term = searchTerm.toLowerCase();
    
    // 1. Text Search
    const matchesSearch = pName.includes(term) || sName.includes(term);
    
    // 2. Date Range Logic
    const apptDate = appt.date; 
    let matchesDate = true;
    if (filterStartDate && filterEndDate) {
        matchesDate = apptDate >= filterStartDate && apptDate <= filterEndDate;
    } else if (filterStartDate) {
        matchesDate = apptDate >= filterStartDate;
    } else if (filterEndDate) {
        matchesDate = apptDate <= filterEndDate;
    }

    // 3. Time Period Logic
    let matchesTime = true;
    if (filterTimePeriod !== 'all') {
        if (appt.time) {
            const hour = getHourFromTimeStr(appt.time);
            if (filterTimePeriod === 'morning') matchesTime = hour < 12;
            else if (filterTimePeriod === 'afternoon') matchesTime = hour >= 12 && hour < 16;
            else if (filterTimePeriod === 'evening') matchesTime = hour >= 16;
        } else {
            matchesTime = false; 
        }
    }
    
    return matchesSearch && matchesDate && matchesTime;
  });

  const pendingAppts = sortAppointments(filteredAdminAppts.filter(a => a.status === 'pending'), false);
  const confirmedAppts = sortAppointments(filteredAdminAppts.filter(a => a.status === 'confirmed'), true);
  const completedAppts = sortAppointments(filteredAdminAppts.filter(a => a.status === 'completed'), false);
  const declinedAppts = sortAppointments(filteredAdminAppts.filter(a => a.status === 'cancelled'), false);
  const feedbackAppts = filteredAdminAppts.filter(a => a.rating > 0);

  const validateInputs = () => {
    if (!username || !phone) { alert("Please fill in both Name and Phone Number."); return false; }
    if (!/^[A-Za-z\s]+$/.test(username)) { alert("⚠️ Name must contain only alphabets."); return false; }
    if (!/[aeiouAEIOU]/.test(username)) { alert("⚠️ Please enter a valid name."); return false; }
    if (/(.)\1{2,}/.test(username)) { alert("⚠️ Invalid Name: Too many repeated characters."); return false; }
    if (username.trim().length < 3) { alert("Name too short."); return false; }
    if (!/^\d{10}$/.test(phone)) { alert("Invalid Phone Number."); return false; }
    if (/^(\d)\1{9}$/.test(phone)) { alert("Invalid Phone Number."); return false; }
    return true; 
  };

  const handleSendOtp = async () => {
    if (!validateInputs()) return;
    setLoading(true);
    try { await axios.post(`${API_URL}/send-otp`, { phone, name: username }); setOtpSent(true); alert(`OTP sent to ${phone}`); }
    catch (error) { alert("Failed to send SMS."); } finally { setLoading(false); }
  };

  const handleVerifyAndRegister = async () => {
      if(otp.length !== 6) { alert("Enter valid 6-digit OTP"); return; }
      setLoading(true); 
      try {
          await axios.post(`${API_URL}/verify-otp`, { phone, otp });
          setTimeout(async () => {
              try {
                  const res = await axios.post(`${API_URL}/register`, { username, phone, secret: '' });
                  loginUser(res.data); 
              } catch (error) { alert("Registration Failed."); } finally { setLoading(false); }
          }, 3000);
      } catch (error) { setLoading(false); alert("Incorrect OTP!"); return; }
  };

  const handleDoctorLogin = async () => {
      if (!username || !secret) { alert("Enter Name and Secret."); return; }
      try { const res = await axios.post(`${API_URL}/register`, { username, phone: '9999999999', secret }); loginUser(res.data); }
      catch (e) { alert("Login failed."); }
  };

  const loginUser = (userData) => {
    setUser(userData); setUsername(userData.username); setEmail(userData.email || ''); setAge(userData.age || '');
    if(userData.role === 'admin' || userData.phone === '+919999999999') { setPage('admin-home'); loadAdminData(); } 
    else { 
        setPage('patient-home'); 
        loadClinicInfo(); 
        loadPublicReviews(); 
        axios.get(`${API_URL}/my-appointments/${userData.id}`).then(res => setMyAppointments(res.data));
    }
  };

  const loadClinicInfo = async () => { try { const res = await axios.get(`${API_URL}/info`); if(res.data) setClinicInfo(res.data); } catch(e) {} };
  const loadAdminData = async () => { try { const res = await axios.get(`${API_URL}/appointments`); setAppointments(res.data); loadClinicInfo(); } catch(e) {} };
  const loadMyAppointments = async () => { if(user) { const res = await axios.get(`${API_URL}/my-appointments/${user.id}`); setMyAppointments(res.data); } };
  const loadPublicReviews = async () => { try { const res = await axios.get(`${API_URL}/reviews`); setPublicReviews(res.data); } catch(e) {} };

  const refreshPatientData = () => {
      if(!user) return;
      setLoading(true); 
      Promise.all([loadMyAppointments(), loadClinicInfo(), loadPublicReviews()]).then(() => { setLoading(false); });
  };

  //const handleBook = async () => { if(!date) return alert("Select a date"); await axios.post(`${API_URL}/book`, { date, service, UserId: user.id }); alert("Booking Request Sent!"); setActiveTab('my_appointments'); refreshPatientData(); };
  const handleBook = async () => {
    const selectedService = SERVICES_DATA.find(s => s.title === service);
    await axios.post(`${API_URL}/book`, { 
        date, 
        service, 
        UserId: user.id,
        totalSittings: selectedService.sittings // Save total sittings required
    });
    alert("Booking Request Sent!");
    setActiveTab('my_appointments');
    refreshPatientData();
};
  
  const handleAccept = async (id) => {
    const time = assignTime[id]; if (!time) return alert("Select time first.");
    const [hour, minute] = time.split(':').map(Number);
    if (hour < 9 || hour > 18 || (hour === 18 && minute > 0)) return alert("⚠️ Clinic Hours: 9 AM - 6 PM.");
    const formattedTime = formatTime(time);
    const currentAppt = appointments.find(a => a.id === id);
    if (currentAppt) {
        const conflict = appointments.find(a => a.id !== id && a.status === 'confirmed' && a.date === currentAppt.date && a.time === formattedTime);
        if (conflict) return alert(`⚠️ Conflict: Time ${formattedTime} is already booked.`);
    }
    const res = await axios.put(`${API_URL}/accept/${id}`, { time: formattedTime });
    alert(res.data.message); loadAdminData();
  };

  const handleComplete = async (id) => {
      if(!window.confirm("Mark checkup as Completed? SMS will be sent.")) return;
      try { const res = await axios.put(`${API_URL}/complete/${id}`); alert(res.data.message); loadAdminData(); } catch(e) { alert("Error updating status."); }
  };

  const handleDecline = async (id) => { 
      if(!window.confirm("Cancel this appointment?")) return; 
      await axios.put(`${API_URL}/decline/${id}`); alert("Cancelled."); 
      if (user.role === 'admin' || user.phone === '+919999999999') loadAdminData(); else refreshPatientData();
  };

  const handleDelete = async (id) => { 
      if(!window.confirm("Permanently delete this record?")) return;
      await axios.delete(`${API_URL}/appointment/${id}`); alert("Deleted."); 
      if (user.role === 'admin' || user.phone === '+919999999999') loadAdminData(); else refreshPatientData();
  };

  const handleTimeInput = (id, value) => setAssignTime({ ...assignTime, [id]: value });
  
  const handleUpdateTimings = async () => {
      try { await axios.put(`${API_URL}/info`, clinicInfo); alert("Clinic Timings Updated Successfully!"); } 
      catch(e) { alert("Failed to update timings."); }
  };

  const handleUpdateProfile = async () => { await axios.put(`${API_URL}/user/${user.id}`, { username, email, age }); alert("Saved!"); setUser({...user, email, age, username}); };
  
  const handleSubmitFeedback = async (apptId) => { 
      if(rating === 0) return alert("Select stars"); 
      await axios.put(`${API_URL}/feedback/${apptId}`, { rating, review }); 
      alert("Thanks! Your feedback is saved."); 
      setRating(0); setReview(''); 
      refreshPatientData(); 
  };

  const toggleVisibility = async (id, currentStatus) => {
      try {
          await axios.put(`${API_URL}/feedback-visibility/${id}`, { isVisible: !currentStatus });
          loadAdminData(); 
      } catch(e) { alert("Failed to update visibility"); }
  };

  const handleSittingComplete = async (id, nextDate = null, nextTime = null) => {
    try {
        const formattedTime = nextTime ? formatTime(nextTime) : null;
        const res = await axios.put(`${API_URL}/complete-sitting/${id}`, { 
            nextDate, 
            nextTime: formattedTime 
        });
        alert(res.data.message);
        loadAdminData(); // Refresh the dashboard 
    } catch (e) {
        alert("Error updating sitting.");
    }
};

  const renderAppointmentList = (list, title, color, type) => {
      let lastDate = null;
      return (
        <div className="card" style={{borderTop: `5px solid ${color}`}}>
            <h3 style={{color, display:'flex', alignItems:'center', gap:10}}>{title} <span style={{fontSize:'0.7em', background:'#f1f3f5', padding:'2px 8px', borderRadius:10, color:'#888'}}>{list.length}</span></h3>
            {list.length === 0 ? <p style={{color:'#999', fontStyle:'italic', marginTop:20}}>No items found for this filter.</p> : list.map(appt => {
                const showHeader = appt.date !== lastDate; lastDate = appt.date;
                return (
                    <React.Fragment key={appt.id}>
                        {showHeader && type !== 'feedback' && <div className="date-header">📅 {appt.date}</div>}
                        
                        {type === 'feedback' ? (
                            <div style={{borderBottom:'1px solid #eee', padding:'15px 0'}}>
                                <div style={{display:'flex', justifyContent:'space-between'}}>
                                    <div style={{fontWeight:'bold'}}>{appt.User ? appt.User.username : 'Unknown'}</div>
                                    <div style={{color:'#ffb703', fontSize:'1.1rem'}}>{'★'.repeat(appt.rating)}</div>
                                </div>
                                <div style={{color:'#555', fontStyle:'italic', margin:'5px 0'}}>"{appt.review}"</div>
                                <div style={{display:'flex', alignItems:'center', gap:10, marginTop:8}}>
                                    <span style={{fontSize:'0.8rem', color:'#999'}}>Service: {appt.service}</span>
                                    <button onClick={() => toggleVisibility(appt.id, appt.isVisible)} style={{marginLeft:'auto', padding:'5px 12px', borderRadius:'20px', border:'none', cursor:'pointer', fontSize:'0.8rem', fontWeight:'600', background: appt.isVisible ? '#2ecc71' : '#e9ecef', color: appt.isVisible ? 'white' : '#666'}}>{appt.isVisible ? '👁 Public' : '🚫 Hidden'}</button>
                                </div>
                            </div>
                        ) : (
                            <div className="appointment-row" style={{flexWrap:'wrap'}}>
                                <div style={{flex: 1, minWidth:'200px'}}>
                                    <div style={{fontWeight:'700', fontSize:'1.05rem'}}>{appt.User ? appt.User.username : 'Unknown'}</div>
                                    <div style={{fontSize:'0.85rem', color:'#666'}}>{appt.service}</div>
                                    {appt.time && <div style={{color: color, fontWeight:'bold', fontSize:'0.9rem'}}>🕒 {appt.time}</div>}
                                    {type === 'history' && <span style={{fontSize:'0.75rem', fontWeight:'bold', padding:'3px 8px', borderRadius:'10px', marginTop:5, display:'inline-block', background: appt.status === 'completed' ? '#d1e7dd' : '#f8d7da', color: appt.status === 'completed' ? '#0f5132' : '#842029'}}>{appt.status.toUpperCase()}</span>}
                                </div>
                                <div style={{display:'flex', gap:8, alignItems:'center', marginTop:5}}>
                                    {type === 'pending' && (
                                    <>
                                        <input type="time" onChange={(e) => handleTimeInput(appt.id, e.target.value)} style={{width: '90px', padding:5, margin:0, fontSize:'0.8rem'}} />
                                        <button className="btn-action accept" onClick={() => handleAccept(appt.id)}>✓</button>
                                        <button className="btn-action decline" onClick={() => handleDecline(appt.id)}>✕</button>
                                    </>
                                    )}
                                    {type === 'confirmed' && (
    <div style={{ marginTop: 10, padding: '10px', background: '#f8f9fa', borderRadius: '8px', width: '100%' }}>
        <div style={{ fontSize: '0.8rem', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
            Progress: {appt.currentSitting} / {appt.totalSittings} Sittings
        </div>

        {/* If the current sitting is less than total sittings, show 'Next Sitting' inputs */}
        {appt.totalSittings - appt.currentSitting > 0 ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Next:</span>
                    <input type="date" id={`nd-${appt.id}`} style={{ margin: 0, padding: '4px', fontSize: '0.8rem', width: '120px' }} min={getToday()} />
                    <input type="time" id={`nt-${appt.id}`} style={{ margin: 0, padding: '4px', fontSize: '0.8rem', width: '90px' }} />
                </div>
                <button 
                    onClick={() => {
                        const d = document.getElementById(`nd-${appt.id}`).value;
                        const t = document.getElementById(`nt-${appt.id}`).value;
                        if(!d || !t) return alert("Please select next date and time.");
                        handleSittingComplete(appt.id, d, t);
                    }}
                    style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', background: '#0077b6', color: 'white', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}
                >
                    Update Sitting
                </button>
            </div>
        ) : (
            /* If it's the final sitting, just show the Done button */
            <button 
                onClick={() => handleSittingComplete(appt.id)} 
                style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', background: '#2ecc71', color: 'white', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', width: '100%' }}
            >
                ✓ Final Completion
            </button>
        )}
    </div>
)}
                                    <button className="btn-action delete" onClick={() => handleDelete(appt.id)}>🗑</button>
                                </div>
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
      );
  };

  if (page === 'landing') {
    return (
      <div className="landing-container">
        <div className="landing-content">
            <h1 className="landing-title">🦷 Amrutha Dental Clinic</h1>
            <h2 className="doctor-name">Dr. Radha M.B.</h2>
            <p className="landing-subtitle-text">World-Class Dental Care & Orthodontics</p>
            <button className="btn-start" onClick={() => { setPage('auth'); setOtpSent(false); }}>Get Started</button>
        </div>
      </div>
    );
  }

  if (page === 'auth') {
    return (
      <div className="auth-container">
        <div className="card" style={{ width: '400px', textAlign: 'center', borderTop: '5px solid var(--primary)' }}>
          <h2 style={{color: 'var(--primary)'}}>{showDoctorLogin ? "Doctor Portal" : "Patient Login"}</h2>
          <p style={{marginBottom:25, color:'#666'}}>{showDoctorLogin ? "Secure Access Area" : "Verify mobile to continue"}</p>
          <input placeholder="Full Name" value={username} disabled={otpSent && !showDoctorLogin} onChange={e => setUsername(e.target.value)} />
          {!showDoctorLogin && (
            <>
                <input placeholder="Phone (10 digits)" value={phone} disabled={otpSent} onChange={e => { if (!isNaN(e.target.value)) setPhone(e.target.value); }} maxLength={10} />
                {otpSent && <input placeholder="Enter 6-digit OTP" value={otp} onChange={e => { if(!isNaN(e.target.value)) setOtp(e.target.value)}} maxLength={6} style={{textAlign:'center', letterSpacing:'5px', fontWeight:'bold', fontSize:'1.2rem', borderColor:'var(--primary)'}} />}
                {loading ? <button className="btn-primary" disabled><div className="loader"></div></button> : !otpSent ? <button className="btn-primary" onClick={handleSendOtp}>Get OTP</button> : <button className="btn-primary" onClick={handleVerifyAndRegister}>Verify & Login</button> }
            </>
          )}
          {showDoctorLogin && (
            <>
                <input type="password" placeholder="Secret Code" onChange={e => setSecret(e.target.value)} />
                <button className="btn-primary" onClick={handleDoctorLogin}>Enter Dashboard</button>
            </>
          )}
          <div style={{marginTop: 25, display:'flex', justifyContent:'space-between', fontSize:'0.85rem'}}>
            <span onClick={() => setPage('landing')} style={{cursor:'pointer', color:'var(--primary)'}}>← Back</span>
            <span onClick={() => { setShowDoctorLogin(!showDoctorLogin); setSecret(''); setOtpSent(false); }} style={{cursor:'pointer', color:'#666'}}>{showDoctorLogin ? "I am a Patient" : "Doctor Login"}</span>
          </div>
        </div>
      </div>
    );
  }

  // --- DOCTOR DASHBOARD ---
  if (page === 'admin-home') {
    return (
      <div className="app-container">
        <div className="navbar">
          <span className="brand">👨‍⚕️ Amrutha Dental Clinic</span>
          <div style={{display:'flex', gap:10, alignItems:'center'}}>
             
             {/* GLOBAL FILTERS */}
             <input placeholder="🔍 Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{margin:0, width:150, padding:'8px 10px'}} />
             
             <div style={{display:'flex', gap:5, alignItems:'center', background:'#f8f9fa', padding:'5px', borderRadius:'8px', border:'1px solid #ddd'}}>
                 <span style={{fontSize:'0.7rem', fontWeight:'bold'}}>From:</span>
                 <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} style={{width:'auto', margin:0, padding:'4px', fontSize:'0.8rem'}}/>
                 <span style={{fontSize:'0.7rem', fontWeight:'bold'}}>To:</span>
                 <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} style={{width:'auto', margin:0, padding:'4px', fontSize:'0.8rem'}}/>
             </div>

             {/* TIME PERIOD SELECTOR */}
             <select value={filterTimePeriod} onChange={(e) => setFilterTimePeriod(e.target.value)} style={{margin:0, width:'auto', padding:'6px', fontSize:'0.8rem'}}>
                 <option value="all">All Day</option>
                 <option value="morning">Morning (AM)</option>
                 <option value="afternoon">Afternoon (12-4 PM)</option>
                 <option value="evening">Evening (4 PM+)</option>
             </select>

             <button onClick={() => { setFilterStartDate(''); setFilterEndDate(''); setSearchTerm(''); setFilterTimePeriod('all'); }} style={{padding:'6px 12px', border:'none', background:'#e9ecef', borderRadius:6, cursor:'pointer'}}>Clear</button>
             <button onClick={loadAdminData} style={{padding:'6px 12px', border:'none', background:'var(--primary)', color:'white', borderRadius:6, cursor:'pointer'}}>Refresh</button>
             <button className="btn-logout" onClick={() => setPage('landing')}>Exit</button>
          </div>
        </div>
        
        <div className="tabs" style={{justifyContent: 'center', marginBottom: 30}}>
            <button className={`tab-btn ${doctorTab === 'requests' ? 'active' : ''}`} onClick={() => setDoctorTab('requests')}>Requests ({pendingAppts.length})</button>
            <button className={`tab-btn ${doctorTab === 'schedule' ? 'active' : ''}`} onClick={() => setDoctorTab('schedule')}>Schedule ({confirmedAppts.length})</button>
            <button className={`tab-btn ${doctorTab === 'completed' ? 'active' : ''}`} onClick={() => setDoctorTab('completed')}>Completed ({completedAppts.length})</button>
            <button className={`tab-btn ${doctorTab === 'declined' ? 'active' : ''}`} onClick={() => setDoctorTab('declined')}>Declined ({declinedAppts.length})</button>
            <button className={`tab-btn ${doctorTab === 'feedbacks' ? 'active' : ''}`} onClick={() => setDoctorTab('feedbacks')}>💬 Feedback</button>
            <button className={`tab-btn ${doctorTab === 'settings' ? 'active' : ''}`} onClick={() => setDoctorTab('settings')}>⚙️ Settings</button>
        </div>
        
        <div style={{animation: 'fadeIn 0.3s ease'}}>
            {doctorTab === 'requests' && renderAppointmentList(pendingAppts, "Requests", "#ffb703", "pending")}
            {doctorTab === 'schedule' && renderAppointmentList(confirmedAppts, "Confirmed Schedule", "#38b000", "confirmed")}
            {doctorTab === 'completed' && renderAppointmentList(completedAppts, "Completed History", "#0077b6", "history")}
            {doctorTab === 'declined' && renderAppointmentList(declinedAppts, "Declined Requests", "#d90429", "history")}
            {doctorTab === 'feedbacks' && renderAppointmentList(feedbackAppts, "Patient Feedback", "#6f42c1", "feedback")}
            
            {doctorTab === 'settings' && (
                <div className="card" style={{maxWidth:700, margin:'0 auto', background: '#f0f9ff', border: '1px solid #bae6fd'}}>
                    <h3 style={{color: '#0284c7', marginBottom: 25}}>⚙️ Update Clinic Timings</h3>
                    <div style={{display:'flex', flexDirection:'column', gap:20}}>
                        <div className="input-group">
                            <div><label style={{fontSize:'0.85rem', fontWeight:'bold', color:'#555'}}>Opens At</label><input value={clinicInfo.openTime} onChange={e=>setClinicInfo({...clinicInfo, openTime:e.target.value})} /></div>
                            <div><label style={{fontSize:'0.85rem', fontWeight:'bold', color:'#555'}}>Closes At</label><input value={clinicInfo.closeTime} onChange={e=>setClinicInfo({...clinicInfo, closeTime:e.target.value})} /></div>
                        </div>
                        <div><label style={{fontSize:'0.85rem', fontWeight:'bold', color:'#555'}}>Working Days</label><input value={clinicInfo.days} onChange={e=>setClinicInfo({...clinicInfo, days:e.target.value})} /></div>
                        <button onClick={handleUpdateTimings} className="btn-primary" style={{marginTop:10}}>Save Updates</button>
                    </div>
                </div>
            )}
        </div>
      </div>
    );
  }

  // --- PATIENT DASHBOARD ---
  return (
    <div className="app-container">
      <div className="navbar">
        <span className="brand">🦷 Amrutha Dental Clinic</span>
        <div style={{display:'flex', gap:10}}>
            <button onClick={refreshPatientData} style={{background:'white', color:'var(--primary)', border:'2px solid var(--primary)', borderRadius:'50px', padding:'8px 20px', cursor:'pointer', fontWeight:'bold'}}>
               {loading ? '↻ Loading...' : '↻ Refresh Data'}
            </button>
            <button className="btn-logout" onClick={() => setPage('landing')}>Logout</button>
        </div>
      </div>

      <div className="tabs">
        {['services', 'booking', 'my_appointments', 'feedback', 'profile', 'timings', 'location'].map(tab => (
            <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                {tab.replace('_', ' ').charAt(0).toUpperCase() + tab.replace('_', ' ').slice(1)}
            </button>
        ))}
      </div>
      <div style={{animation: 'fadeIn 0.5s ease'}}>
          {activeTab === 'services' && (
    <div className="services-grid">
       {SERVICES_DATA.map(item => (
           <div key={item.id} className="service-item">
              <img src={item.img} className="service-img" alt={item.title} />
              <div style={{padding: '15px'}}>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                  <div style={{display:'flex', justifyContent:'space-between', marginTop:10, fontWeight:'bold'}}>
                      <span style={{color: 'var(--success)'}}>₹{item.price}</span>
                      <span style={{color: '#666', fontSize: '0.8rem'}}>{item.sittings} Sitting(s)</span>
                  </div>
              </div>
           </div>
       ))}
    </div>
)}
          {activeTab === 'booking' && (
              <div className="card" style={{maxWidth:500, margin:'0 auto'}}>
                <h2 style={{textAlign:'center', color:'var(--primary)'}}>Book Appointment</h2>
                <label style={{fontWeight:'600', display:'block', marginBottom:5, marginTop:15}}>Select Date</label>
                <input type="date" min={getToday()} max={getMaxDate()} value={date} onChange={handleDateChange} />
                <label style={{fontWeight:'600', display:'block', marginBottom:5}}>Select Service</label>
                <select onChange={e=>setService(e.target.value)}>
                   {SERVICES_DATA.map(s => <option key={s.id}>{s.title}</option>)}
                </select>
                <button className="btn-primary" onClick={handleBook} style={{marginTop:20}}>Confirm Booking</button>
              </div>
          )}
          {activeTab === 'my_appointments' && (
              <div className="card">
                <h2 style={{marginBottom:20}}>My History</h2>
                {myAppointments.length === 0 ? <p style={{color:'#999'}}>No records found.</p> : myAppointments.map(appt => (
                  <div key={appt.id} style={{
                      padding:20, borderRadius:12, marginBottom:15, position:'relative',
                      background: appt.status==='confirmed' ? '#eefbf3' : (appt.status==='completed' ? '#d1e7dd' : '#fff5f5'),
                      borderLeft: `5px solid ${appt.status==='confirmed' ? 'var(--success)' : (appt.status==='completed' ? '#0f5132' : 'var(--danger)')}`
                  }}>
                    <div style={{display:'flex', justifyContent:'space-between'}}>
                        <strong style={{fontSize:'1.1rem'}}>{appt.service}</strong>
                        <span style={{fontWeight:'bold', color:'#555'}}>{appt.date}</span>
                    </div>
                    <div style={{marginTop:10, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span className="status-badge" style={{
                          background: appt.status==='confirmed' ? 'var(--success)' : (appt.status==='completed' ? '#0f5132' : 'var(--danger)'), 
                          color:'white'
                      }}>
                        {appt.status.toUpperCase()}
                      </span>
                      {(appt.status === 'confirmed' || appt.status === 'completed') && <span style={{color:'var(--success)', fontWeight:'bold'}}>✅ {appt.time}</span>}
                    </div>
                    
                    {/* SAVED FEEDBACK DISPLAY */}
                    {appt.rating > 0 && (
                        <div style={{marginTop:15, padding:'10px', background:'rgba(255,255,255,0.6)', borderRadius:'8px', border:'1px dashed #ccc'}}>
                            <div style={{fontSize:'0.85rem', fontWeight:'bold', color:'#555'}}>Your Feedback:</div>
                            <div style={{color:'#ffb703', letterSpacing:'1px'}}>{'★'.repeat(appt.rating)}</div>
                            <div style={{fontStyle:'italic', color:'#666', fontSize:'0.9rem'}}>"{appt.review}"</div>
                        </div>
                    )}

                    <div style={{marginTop:15, paddingTop:10, borderTop:'1px solid rgba(0,0,0,0.05)', display:'flex', justifyContent:'flex-end', gap:10}}>
                        {appt.status === 'pending' && ( <button onClick={() => handleDecline(appt.id)} style={{background:'transparent', color:'#d90429', border:'1px solid #d90429', padding:'5px 12px', borderRadius:'6px', cursor:'pointer', fontSize:'0.85rem'}}>✕ Cancel Request</button> )}
                        {(appt.status === 'cancelled' || appt.status === 'completed') && ( <button onClick={() => handleDelete(appt.id)} style={{background:'#f1f3f5', color:'#adb5bd', border:'none', padding:'5px 12px', borderRadius:'6px', cursor:'pointer', fontSize:'0.85rem'}}>🗑 Delete Entry</button> )}
                    </div>
                  </div>
                ))}
              </div>
          )}
          {activeTab === 'feedback' && (
              <div style={{maxWidth:800, margin:'0 auto'}}>
                  <div className="card" style={{textAlign:'center', marginBottom:30}}>
                    <h2>Rate Your Experience</h2>
                    {myAppointments.filter(a => a.status === 'completed' && a.rating === 0).length === 0 ? (
                        <div style={{padding:20, color:'#888'}}>No recent completed appointments to rate.</div>
                    ) : (
                        myAppointments.filter(a => a.status === 'completed' && a.rating === 0).slice(0, 1).map(appt => (
                            <div key={appt.id} style={{background:'#f8f9fa', padding:25, borderRadius:15, marginTop:20}}>
                                <h3>How was your {appt.service}?</h3>
                                <div style={{fontSize:'3rem', color:'#ffb703', cursor:'pointer', margin:'20px 0'}}>
                                   {[1, 2, 3, 4, 5].map((star) => ( <span key={star} onClick={() => setRating(star)}>{star <= rating ? '★' : '☆'}</span> ))}
                                </div>
                                <textarea placeholder="Write a short review..." onChange={e => setReview(e.target.value)} style={{width:'100%', minHeight:100}} />
                                <button className="btn-primary" onClick={() => handleSubmitFeedback(appt.id)} style={{marginTop:20}}>Submit Feedback</button>
                            </div>
                        ))
                    )}
                  </div>
                  <h3 style={{textAlign:'center', marginBottom:20, color:'var(--primary)'}}>What Others Say</h3>
                  <div className="dashboard-grid">
                      {publicReviews.length === 0 ? <p style={{textAlign:'center', width:'100%', color:'#999'}}>No public reviews yet.</p> : publicReviews.map(review => (
                          <div key={review.id} className="card" style={{padding:20, marginBottom:0}}>
                              <div style={{display:'flex', justifyContent:'space-between', marginBottom:10}}>
                                  <strong style={{fontSize:'1.1rem'}}>{review.User ? review.User.username : 'Patient'}</strong>
                                  <span style={{color:'#ffb703', letterSpacing:'2px'}}>{'★'.repeat(review.rating)}</span>
                              </div>
                              <p style={{color:'#555', fontStyle:'italic', lineHeight:'1.5'}}>"{review.review}"</p>
                              <div style={{textAlign:'right', fontSize:'0.75rem', color:'#aaa', marginTop:10}}>{new Date(review.updatedAt).toLocaleDateString()}</div>
                          </div>
                      ))}
                  </div>
              </div>
          )}
          {activeTab === 'profile' && (
              <div className="card" style={{maxWidth:500, margin:'0 auto'}}>
                <h2 style={{textAlign:'center'}}>My Profile</h2>
                <input value={user.phone} disabled style={{background:'#f1f2f6', color:'#636e72'}} />
                <input value={username} onChange={e=>setUsername(e.target.value)} />
                <div className="input-group">
                    <div><input value={age} onChange={e=>setAge(e.target.value)} type="number" placeholder="Age" /></div>
                    <div><input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email" /></div>
                </div>
                <button className="btn-primary" onClick={handleUpdateProfile}>Save Changes</button>
              </div>
          )}
          {activeTab === 'timings' && (
              <div className="card" style={{maxWidth:600, margin:'0 auto', textAlign:'center'}}>
                <h2 style={{marginBottom:30, color:'var(--primary)'}}>🕒 Clinic Hours</h2>
                <div style={{display:'flex', flexDirection:'column', gap:20, fontSize:'1.1rem', textAlign:'left', padding:'0 20px'}}>
                   <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid #eee', paddingBottom:15}}>
                      <strong style={{color:'#2c3e50'}}>Working Days</strong>
                      <span style={{color:'var(--primary)', fontWeight:'600'}}>{clinicInfo.days}</span>
                   </div>
                   <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid #eee', paddingBottom:15}}>
                      <strong style={{color:'#2c3e50'}}>Hours</strong>
                      <span style={{color:'var(--success)', fontWeight:'600'}}>{clinicInfo.openTime} - {clinicInfo.closeTime}</span>
                   </div>
                   <div style={{display:'flex', justifyContent:'space-between', color:'var(--danger)'}}>
                      <strong>Sunday</strong>
                      <span style={{fontWeight:'600'}}>Closed</span>
                   </div>
                </div>
                <div style={{marginTop:30, fontSize:'0.9rem', color:'#95a5a6'}}>
                    <p>Emergency cases may be considered on holidays via prior appointment.</p>
                </div>
              </div>
          )}
          {activeTab === 'location' && (
            <div className="card" style={{maxWidth:800, margin:'0 auto', textAlign:'center'}}>
              <h2>📍 Visit Us</h2>
              <p style={{marginBottom:20}}><strong>Address:</strong><br/>{clinicInfo.address}</p>
              <div style={{position:'relative', paddingBottom:'56.25%', height:0, overflow:'hidden', borderRadius:15, marginBottom:20}}>
                <iframe title="Clinic Location" src="https://maps.google.com/maps?q=Amrutha+Dental+Clinic+Chitradurga&t=&z=13&ie=UTF8&iwloc=&output=embed" style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', border:0}} allowFullScreen="" loading="lazy"></iframe>
              </div>
              <button className="btn-primary" onClick={() => window.open('https://maps.google.com/?cid=7341811071874675310&g_mp=CiVnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLkdldFBsYWNl', '_blank')}>Get Directions ↗</button>
            </div>
          )}
      </div>
    </div>
  );
}

export default App;
