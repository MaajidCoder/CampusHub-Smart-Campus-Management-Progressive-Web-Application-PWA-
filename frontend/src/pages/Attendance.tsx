import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { clientSocket } from '../services/socket';
import {
  Calendar,
  CheckCircle,
  XCircle,
  QrCode,
  MapPin,
  RefreshCw,
  Clock,
  Users,
  Check,
  AlertCircle,
  Camera,
  Play,
  StopCircle,
  HelpCircle,
  X,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SubjectStats {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  facultyName: string;
  totalClasses: number;
  presentClasses: number;
  percentage: number;
}

interface Student {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Subject {
  _id: string;
  name: string;
  code: string;
  department: {
    _id: string;
    name: string;
    code: string;
  };
  semester: number;
}

interface AttendanceRecord {
  _id: string;
  student: Student;
  date: string;
  status: 'present' | 'absent';
  method: 'manual' | 'qr';
}

interface Department {
  _id: string;
  name: string;
  code: string;
}

export const Attendance: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Student states
  const [studentStats, setStudentStats] = useState<SubjectStats[]>([]);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanToken, setScanToken] = useState('');
  const [studentLat, setStudentLat] = useState('40.7128'); // default mock coordinates
  const [studentLon, setStudentLon] = useState('-74.0060');

  // Faculty states
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'manual' | 'qr'>('manual');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [attendanceSheet, setAttendanceSheet] = useState<{ [studentId: string]: 'present' | 'absent' }>({});

  // Faculty QR states
  const [qrActive, setQrActive] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [facultyLat, setFacultyLat] = useState('40.7128');
  const [facultyLon, setFacultyLon] = useState('-74.0060');
  const [facultyRadius, setFacultyRadius] = useState(30);
  const [checkedInCount, setCheckedInCount] = useState(0);

  // Subject creation states
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjCode, setNewSubjCode] = useState('');
  const [newSubjDept, setNewSubjDept] = useState('');
  const [newSubjSemester, setNewSubjSemester] = useState(1);
  const [submittingSubject, setSubmittingSubject] = useState(false);

  const qrIntervalRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      setDepartments(res.data.data);
      if (res.data.data.length > 0) {
        setNewSubjDept(res.data.data[0]._id);
      }
    } catch (err: any) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const handleAddSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjName || !newSubjCode || !newSubjDept || !newSubjSemester) return;
    try {
      setSubmittingSubject(true);
      setError(null);
      const res = await api.post('/subjects', {
        name: newSubjName,
        code: newSubjCode.toUpperCase(),
        department: newSubjDept,
        semester: newSubjSemester,
      });
      
      const createdSubj = res.data.data;
      setSubjects((prev) => [...prev, createdSubj]);
      
      // Reset form & close modal
      setNewSubjName('');
      setNewSubjCode('');
      setShowAddSubjectModal(false);
      
      setSuccess('Subject created successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create subject.');
    } finally {
      setSubmittingSubject(false);
    }
  };

  // 1. Initial Load based on Role
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        if (user?.role === 'student') {
          const res = await api.get('/attendance/stats');
          setStudentStats(res.data.data);
        } else if (user?.role === 'faculty') {
          const res = await api.get('/subjects');
          setSubjects(res.data.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to initialize attendance portal');
      } finally {
        setLoading(false);
      }
    };
    init();

    // Clean up intervals on unmount
    return () => {
      stopQRSession();
    };
  }, [user]);

  // 1.5 Parse QR token from URL search query on load (for mobile/scanner check-ins)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam && user?.role === 'student') {
      setScanToken(tokenParam);
      setShowScanModal(true);
      
      // Auto-detect GPS coordinates
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setStudentLat(pos.coords.latitude.toFixed(6));
            setStudentLon(pos.coords.longitude.toFixed(6));
          },
          (err) => {
            console.warn('Geolocation read failed:', err);
          }
        );
      }
    }
  }, [user]);

  // 2. Fetch students list for faculty manual sheet
  useEffect(() => {
    const loadStudents = async () => {
      if (user?.role === 'faculty' && selectedSubject && activeSubTab === 'manual') {
        try {
          setError(null);
          // Query students registered in the subject's department and semester
          const departmentId = selectedSubject.department?._id || '';
          const res = await api.get(
            `/auth/students?department=${departmentId}&semester=${selectedSubject.semester}`
          );
          setStudentsList(res.data.data);

          // Initialize attendance sheet with 'present'
          const initialSheet: { [id: string]: 'present' | 'absent' } = {};
          res.data.data.forEach((s: Student) => {
            initialSheet[s._id] = 'present';
          });

          // Fetch any existing manual attendance marked for this date
          const existRes = await api.get(
            `/attendance/subject/${selectedSubject._id}?date=${manualDate}`
          );
          existRes.data.data.forEach((record: AttendanceRecord) => {
            initialSheet[record.student._id] = record.status;
          });

          setAttendanceSheet(initialSheet);
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to fetch students list');
        }
      }
    };
    loadStudents();
  }, [selectedSubject, activeSubTab, manualDate]);

  // 3. Faculty Geolocation Auto-fetch
  const fetchFacultyGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFacultyLat(pos.coords.latitude.toFixed(6));
          setFacultyLon(pos.coords.longitude.toFixed(6));
          // Pre-fill student gps coordinates too for testing convenience
          setStudentLat(pos.coords.latitude.toFixed(6));
          setStudentLon(pos.coords.longitude.toFixed(6));
        },
        () => {
          console.warn('Geolocation access denied. Using mock coordinate defaults.');
        }
      );
    }
  };

  // 4. Faculty Dynamic QR Session Actions
  const startQRSession = async () => {
    if (!selectedSubject) return;
    setQrActive(true);
    setError(null);

    // Join socket subject room to subscribe to live check-in counts
    const socket = clientSocket.getSocket();
    if (socket) {
      socket.emit('join-subject-room', { subjectId: selectedSubject._id });
      socket.off('student-checked-in'); // prevent duplicate listener bindings
      socket.on('student-checked-in', () => {
        setCheckedInCount((prev) => prev + 1);
      });
    }

    const triggerRefresh = async () => {
      try {
        const res = await api.post('/attendance/qr-session', {
          subjectId: selectedSubject._id,
          latitude: Number(facultyLat),
          longitude: Number(facultyLon),
          radius: facultyRadius,
        });
        const { qrDataUrl, token } = res.data.data;
        setQrCodeUrl(qrDataUrl);
        setQrToken(token);

        // Reset timer countdown
        setTimeLeft(30);

        // Fetch how many students checked in today for this subject
        const checkinRes = await api.get(`/attendance/subject/${selectedSubject._id}?date=${new Date().toISOString().split('T')[0]}`);
        setCheckedInCount(checkinRes.data.data.length);
      } catch (err: any) {
        setError(err.response?.data?.message || 'QR session update failed.');
        stopQRSession();
      }
    };

    // First call
    await triggerRefresh();

    // Setup rotating token intervals every 30 seconds (matches expiresAt decay)
    qrIntervalRef.current = setInterval(triggerRefresh, 30000);

    // Setup 1-second countdown clock for the instructor display
    countdownIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev > 1 ? prev - 1 : 30));
    }, 1000);
  };

  const stopQRSession = () => {
    setQrActive(false);
    setQrCodeUrl(null);
    setQrToken('');
    if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    // Unsubscribe from check-in events
    const socket = clientSocket.getSocket();
    if (socket) {
      socket.off('student-checked-in');
    }
  };

  // 5. Submit Manual Sheet
  const handleManualSubmit = async () => {
    if (!selectedSubject) return;
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const records = Object.keys(attendanceSheet).map((studentId) => ({
        studentId,
        status: attendanceSheet[studentId],
      }));

      await api.post('/attendance/bulk', {
        subjectId: selectedSubject._id,
        date: manualDate,
        records,
      });

      setSuccess('Manual attendance sheet recorded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit manual records.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Student QR Check-in
  const handleQRCheckin = async () => {
    try {
      setError(null);
      setSuccess(null);
      
      const res = await api.post('/attendance/qr-checkin', {
        token: scanToken,
        latitude: Number(studentLat),
        longitude: Number(studentLon),
      });

      setSuccess(res.data.message || 'Check-in approved!');
      setShowScanModal(false);
      setScanToken('');
      
      // Refresh student statistics
      const statsRes = await api.get('/attendance/stats');
      setStudentStats(statsRes.data.data);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Check-in failed.');
    }
  };

  // Helper helper to generate coordinate templates for testing
  const usePresetCoordinates = (type: 'class' | 'far') => {
    if (type === 'class') {
      // Matches classroom coordinates
      setStudentLat(facultyLat);
      setStudentLon(facultyLon);
    } else {
      // Simulates location out of bounds (approx 150 meters away)
      setStudentLat((Number(facultyLat) + 0.0015).toFixed(6));
      setStudentLon((Number(facultyLon) + 0.0015).toFixed(6));
    }
  };

  // Render helpers
  const getPercentageColor = (percentage: number) => {
    if (percentage >= 75) return 'text-green-500 bg-green-500/10 border-green-500/25';
    if (percentage >= 65) return 'text-amber-500 bg-amber-500/10 border-amber-500/25';
    return 'text-red-500 bg-red-500/10 border-red-500/25';
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-2xl text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 rounded-2xl text-sm animate-fade-in">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* ==================== STUDENT VIEW ==================== */}
      {user?.role === 'student' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">My Attendance Records</h2>
            <button
              onClick={() => {
                setShowScanModal(true);
                fetchFacultyGPS(); // Initialize defaults
              }}
              className="inline-flex items-center gap-2 py-3 px-5 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-semibold text-sm transition-all shadow-lg shadow-brand-500/15"
            >
              <QrCode className="w-4.5 h-4.5" />
              <span>Scan QR Code</span>
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((n) => (
                <div key={n} className="h-40 bg-light-card dark:bg-dark-card/50 rounded-3xl animate-pulse border border-light-border dark:border-dark-border/30" />
              ))}
            </div>
          ) : studentStats.length === 0 ? (
            <div className="text-center py-16 bg-light-card dark:bg-dark-card/20 rounded-3xl border border-light-border dark:border-dark-border/30">
              <Calendar className="w-12 h-12 text-light-muted dark:text-dark-muted/40 mx-auto mb-4" />
              <h3 className="text-lg font-bold">No Course Attendance</h3>
              <p className="text-sm text-light-muted dark:text-dark-muted mt-1">
                You are not registered in any active subject classes this semester.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {studentStats.map((stats) => (
                <div
                  key={stats.subjectId}
                  className="bg-white dark:bg-dark-card rounded-3xl p-6 border border-light-border dark:border-dark-border/30 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div>
                        <span className="text-[10px] font-bold text-light-muted dark:text-dark-muted block mb-1">
                          {stats.subjectCode}
                        </span>
                        <h4 className="text-lg font-bold text-light-text dark:text-dark-text leading-tight">
                          {stats.subjectName}
                        </h4>
                        <p className="text-xs text-light-muted dark:text-dark-muted mt-1">
                          Instructor: {stats.facultyName}
                        </p>
                      </div>
                      <span className={`text-base font-extrabold px-3 py-1.5 border rounded-2xl flex-shrink-0 ${getPercentageColor(stats.percentage)}`}>
                        {stats.percentage}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-light-bg dark:bg-dark-bg/60 rounded-full overflow-hidden border border-light-border dark:border-dark-border/40">
                      <div
                        className={`h-full transition-all duration-500 ${
                          stats.percentage >= 75
                            ? 'bg-green-500'
                            : stats.percentage >= 65
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${stats.percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mt-5 pt-4 border-t border-light-border dark:border-dark-border/20 text-xs text-light-muted dark:text-dark-muted font-medium">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{stats.presentClasses} Attended</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span>{stats.totalClasses - stats.presentClasses} Absent</span>
                    </div>
                    <span className="ml-auto text-[10px] bg-light-bg dark:bg-dark-bg/60 px-2 py-0.5 rounded font-bold">
                      {stats.totalClasses} Total Lectures
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Student QR Simulated Scanner Modal */}
          <AnimatePresence>
            {showScanModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-dark-card w-full max-w-md rounded-3xl border border-light-border dark:border-dark-border/40 p-6 shadow-2xl relative"
                >
                  <button
                    onClick={() => setShowScanModal(false)}
                    className="absolute top-5 right-5 p-2 hover:bg-light-bg dark:hover:bg-dark-bg/60 rounded-xl text-light-muted dark:text-dark-muted"
                  >
                    <X className="p-0 text-light-muted w-5 h-5" />
                  </button>

                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-brand-500 animate-pulse" />
                    <span>Scan QR Attendance</span>
                  </h3>

                  <p className="text-xs text-light-muted dark:text-dark-muted mb-4 leading-relaxed">
                    Camera access can be simulated here. Submit the rotating secret token displayed on the instructor's projector screen along with your GPS coordinates.
                  </p>

                  <div className="space-y-4">
                    {/* Token Input */}
                    <div>
                      <label className="block text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                        Class Code Token (Simulated Scan)
                      </label>
                      <input
                        type="text"
                        value={scanToken}
                        onChange={(e) => setScanToken(e.target.value)}
                        className="w-full px-4 py-2.5 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 rounded-xl outline-none text-xs text-light-text dark:text-dark-text"
                        placeholder="Paste the secret token here..."
                      />
                    </div>

                    {/* Geolocation Mock */}
                    <div className="p-4 bg-light-bg dark:bg-dark-bg/60 rounded-2xl border border-light-border dark:border-dark-border/30 space-y-3">
                      <span className="text-[10px] font-bold text-brand-500 uppercase tracking-widest block mb-1">
                        GPS Coordinates Simulator
                      </span>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold text-light-muted dark:text-dark-muted mb-1">Latitude</label>
                          <input
                            type="text"
                            value={studentLat}
                            onChange={(e) => setStudentLat(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border/30 rounded text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-light-muted dark:text-dark-muted mb-1">Longitude</label>
                          <input
                            type="text"
                            value={studentLon}
                            onChange={(e) => setStudentLon(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border/30 rounded text-xs outline-none"
                          />
                        </div>
                      </div>

                      {/* Mock Position Presets */}
                      <div className="flex gap-2 pt-1.5">
                        <button
                          type="button"
                          onClick={() => usePresetCoordinates('class')}
                          className="flex-grow py-1.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-500 border border-brand-500/20 rounded font-semibold text-[9px] transition-colors"
                        >
                          Simulate: In Classroom
                        </button>
                        <button
                          type="button"
                          onClick={() => usePresetCoordinates('far')}
                          className="flex-grow py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded font-semibold text-[9px] transition-colors"
                        >
                          Simulate: Hostels (Far)
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleQRCheckin}
                      disabled={!scanToken}
                      className="w-full py-3 px-4 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl text-xs font-semibold tracking-wide flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Verify Check-In</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ==================== FACULTY VIEW ==================== */}
      {user?.role === 'faculty' && (
        <div className="space-y-6">
          <div className="border-b border-light-border dark:border-dark-border/40 pb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Faculty Attendance Management</h2>
            {!selectedSubject && (
              <button
                onClick={() => {
                  setShowAddSubjectModal(true);
                  fetchDepartments();
                }}
                className="py-2 px-4 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5"
              >
                <span>+ Add Subject</span>
              </button>
            )}
          </div>

          {loading && !selectedSubject ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2].map((n) => (
                <div key={n} className="h-28 bg-light-card dark:bg-dark-card/50 rounded-3xl animate-pulse border border-light-border dark:border-dark-border/30" />
              ))}
            </div>
          ) : !selectedSubject ? (
            /* Choose Subject list */
            subjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-dark-card rounded-3xl border border-light-border dark:border-dark-border/30 text-center space-y-4 max-w-lg mx-auto shadow-sm">
                <Calendar className="w-12 h-12 text-light-muted dark:text-dark-muted/40 mx-auto" />
                <h3 className="text-base font-bold text-light-text dark:text-dark-text">No Subjects Registered</h3>
                <p className="text-xs text-light-muted dark:text-dark-muted leading-relaxed">
                  You are not teaching any active subjects this semester. Create a new subject to start marking student attendance.
                </p>
                <button
                  onClick={() => {
                    setShowAddSubjectModal(true);
                    fetchDepartments();
                  }}
                  className="py-2 px-5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold text-xs transition-all shadow-md"
                >
                  Create Subject
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {subjects.map((subj) => (
                  <div
                    key={subj._id}
                    onClick={() => {
                      setSelectedSubject(subj);
                      fetchFacultyGPS();
                    }}
                    className="bg-white dark:bg-dark-card rounded-3xl p-6 border border-light-border dark:border-dark-border/30 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-light-muted dark:text-dark-muted block mb-1">
                        {subj.code}
                      </span>
                      <h4 className="text-base font-bold text-light-text dark:text-dark-text leading-snug">
                        {subj.name}
                      </h4>
                    </div>
                    <div className="mt-4 pt-3 border-t border-light-border dark:border-dark-border/20 flex items-center justify-between text-xs text-light-muted dark:text-dark-muted font-semibold">
                      <span>{subj.department?.code || 'N/A'} Department</span>
                      <span>Semester {subj.semester}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Selected subject options */
            <div className="space-y-6">
              {/* Header card */}
              <div className="glass-panel-light dark:glass-panel-dark rounded-3xl p-6 border border-light-border dark:border-dark-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <button
                    onClick={() => {
                      setSelectedSubject(null);
                      stopQRSession();
                    }}
                    className="text-xs font-semibold text-brand-500 hover:underline mb-2 block"
                  >
                    &larr; Back to Subjects list
                  </button>
                  <span className="text-[10px] font-bold text-light-muted dark:text-dark-muted">
                    {selectedSubject.code}
                  </span>
                  <h3 className="text-xl font-bold text-light-text dark:text-dark-text">
                    {selectedSubject.name}
                  </h3>
                  <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
                    Target Class: {selectedSubject.department?.name || 'General'} (Semester {selectedSubject.semester})
                  </p>
                </div>

                {/* Sub Tab selection */}
                <div className="flex bg-light-bg dark:bg-dark-bg/60 p-1 rounded-2xl border border-light-border dark:border-dark-border/40 self-start sm:self-auto">
                  <button
                    disabled={qrActive}
                    onClick={() => setActiveSubTab('manual')}
                    className={`py-2 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                      activeSubTab === 'manual'
                        ? 'bg-brand-500 text-white shadow-md'
                        : 'text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text disabled:opacity-50'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 inline mr-1.5" />
                    Manual Sheet
                  </button>
                  <button
                    onClick={() => setActiveSubTab('qr')}
                    className={`py-2 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                      activeSubTab === 'qr'
                        ? 'bg-brand-500 text-white shadow-md'
                        : 'text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5 inline mr-1.5" />
                    QR Attendance
                  </button>
                </div>
              </div>

              {/* Sub tab frames */}
              {activeSubTab === 'manual' ? (
                /* Manual Sheet View */
                <div className="glass-panel-light dark:glass-panel-dark rounded-3xl p-6 border border-light-border dark:border-dark-border/30 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-light-muted" />
                      <span className="text-sm font-semibold">Select Session Date:</span>
                      <input
                        type="date"
                        value={manualDate}
                        onChange={(e) => setManualDate(e.target.value)}
                        className="px-3 py-1.5 bg-light-bg dark:bg-dark-bg/60 border border-light-border dark:border-dark-border/40 focus:border-brand-500 rounded-xl text-xs outline-none text-light-text dark:text-dark-text"
                      />
                    </div>

                    <span className="text-xs text-light-muted dark:text-dark-muted font-medium">
                      Class size: {studentsList.length} registered students
                    </span>
                  </div>

                  {studentsList.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-sm text-light-muted dark:text-dark-muted">
                        No students are registered in this department and semester.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Student Table */}
                      <div className="overflow-x-auto border border-light-border dark:border-dark-border/20 rounded-2xl">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-light-bg dark:bg-dark-bg/60 text-light-muted dark:text-dark-muted border-b border-light-border dark:border-dark-border/20 font-bold uppercase tracking-wider">
                              <th className="p-4">Student</th>
                              <th className="p-4">Email</th>
                              <th className="p-4 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-light-border dark:divide-dark-border/10">
                            {studentsList.map((st) => (
                              <tr key={st._id} className="hover:bg-light-bg/30 dark:hover:bg-dark-bg/20 transition-colors">
                                <td className="p-4 font-semibold text-light-text dark:text-dark-text flex items-center gap-2.5">
                                  <img
                                    src={st.avatar || 'https://res.cloudinary.com/dummy/image/upload/v1/campushub/avatars/default.png'}
                                    alt={st.name}
                                    className="w-7 h-7 rounded-full object-cover"
                                  />
                                  <span>{st.name}</span>
                                </td>
                                <td className="p-4 text-light-muted dark:text-dark-muted font-medium">
                                  {st.email}
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() =>
                                        setAttendanceSheet((prev) => ({ ...prev, [st._id]: 'present' }))
                                      }
                                      className={`py-1.5 px-3 rounded-lg font-bold transition-all ${
                                        attendanceSheet[st._id] === 'present'
                                          ? 'bg-green-500 text-white shadow-sm'
                                          : 'bg-light-bg dark:bg-dark-bg/60 text-light-muted dark:text-dark-muted'
                                      }`}
                                    >
                                      Present
                                    </button>
                                    <button
                                      onClick={() =>
                                        setAttendanceSheet((prev) => ({ ...prev, [st._id]: 'absent' }))
                                      }
                                      className={`py-1.5 px-3 rounded-lg font-bold transition-all ${
                                        attendanceSheet[st._id] === 'absent'
                                          ? 'bg-red-500 text-white shadow-sm'
                                          : 'bg-light-bg dark:bg-dark-bg/60 text-light-muted dark:text-dark-muted'
                                      }`}
                                    >
                                      Absent
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <button
                        onClick={handleManualSubmit}
                        className="py-3 px-6 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-semibold text-sm transition-all shadow-lg flex items-center gap-2"
                      >
                        <CheckCircle className="w-4.5 h-4.5" />
                        <span>Save Attendance Sheet</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* QR Code session panel */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* Setup & Config panel */}
                  <div className="glass-panel-light dark:glass-panel-dark rounded-3xl p-6 border border-light-border dark:border-dark-border/30 space-y-4">
                    <h4 className="text-base font-bold flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-brand-500" />
                      <span>Configure Geofence Coordinates</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">Latitude</label>
                        <input
                          type="text"
                          value={facultyLat}
                          onChange={(e) => setFacultyLat(e.target.value)}
                          disabled={qrActive}
                          className="w-full px-4 py-2.5 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 rounded-2xl text-xs outline-none focus:border-brand-500 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">Longitude</label>
                        <input
                          type="text"
                          value={facultyLon}
                          onChange={(e) => setFacultyLon(e.target.value)}
                          disabled={qrActive}
                          className="w-full px-4 py-2.5 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 rounded-2xl text-xs outline-none focus:border-brand-500 disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">Geofence Radius</label>
                        <select
                          value={facultyRadius}
                          onChange={(e) => setFacultyRadius(Number(e.target.value))}
                          disabled={qrActive}
                          className="w-full px-4 py-2.5 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 rounded-2xl text-xs outline-none focus:border-brand-500 disabled:opacity-50"
                        >
                          <option value={15}>15 meters (strict classroom)</option>
                          <option value={30}>30 meters (standard)</option>
                          <option value={50}>50 meters (wide room)</option>
                          <option value={100}>100 meters (lecture hall)</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={fetchFacultyGPS}
                        disabled={qrActive}
                        className="self-end py-2.5 px-4 bg-light-bg dark:bg-dark-bg/60 hover:bg-light-border dark:hover:bg-dark-border/50 border border-light-border dark:border-dark-border/40 rounded-2xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Detect GPS Location</span>
                      </button>
                    </div>

                    <div className="pt-4 border-t border-light-border dark:border-dark-border/20">
                      {!qrActive ? (
                        <button
                          onClick={startQRSession}
                          className="w-full py-3 px-4 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          <span>Start QR Session</span>
                        </button>
                      ) : (
                        <button
                          onClick={stopQRSession}
                          className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                          <StopCircle className="w-4 h-4" />
                          <span>Stop QR Session</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* QR code displaying screen */}
                  <div className="glass-panel-light dark:glass-panel-dark rounded-3xl p-6 border border-light-border dark:border-dark-border/30 flex flex-col items-center justify-center text-center">
                    {qrActive && qrCodeUrl ? (
                      <div className="space-y-4 w-full">
                        {/* Display QR Code */}
                        <div className="bg-white p-4 rounded-3xl inline-block shadow-inner mx-auto border border-slate-200">
                          <img
                            src={qrCodeUrl}
                            alt="Attendance Token QR Code"
                            className="w-52 h-52 mx-auto"
                          />
                        </div>

                        {/* Expiry Progress Timer */}
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1.5 text-xs text-light-muted dark:text-dark-muted font-semibold">
                            <Clock className="w-4 h-4 text-brand-500 animate-spin" />
                            <span>Rotating Token expires in <strong>{timeLeft}s</strong></span>
                          </div>
                          <span className="text-[9px] bg-brand-500/10 text-brand-500 font-bold px-2 py-0.5 rounded tracking-wide uppercase mt-1">
                            Anti-Screenshot Enabled
                          </span>
                        </div>

                        {/* Real-time counters */}
                        <div className="p-4 bg-light-bg dark:bg-dark-bg/60 border border-light-border dark:border-dark-border/20 rounded-2xl flex items-center justify-between text-left">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-light-muted dark:text-dark-muted block">Live Checked-In</span>
                            <span className="text-xl font-extrabold text-light-text dark:text-dark-text">{checkedInCount} Students</span>
                          </div>
                          <Users className="w-8 h-8 text-brand-500/30" />
                        </div>

                        {/* Developer testing box */}
                        <div className="p-4 border border-dashed border-brand-500/30 bg-brand-500/5 rounded-2xl text-[10px] text-light-muted dark:text-dark-muted text-left space-y-1.5">
                          <p className="font-bold text-brand-500 flex items-center gap-1">
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Developer Testing Helper:</span>
                          </p>
                          <p>Students must scan this code. If testing locally, copy this session token and paste it into the student's scanner input:</p>
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              readOnly
                              value={qrToken}
                              onClick={(e) => (e.target as HTMLInputElement).select()}
                              className="flex-grow p-1.5 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border/30 rounded text-[9px] outline-none font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-16 space-y-3">
                        <QrCode className="w-16 h-16 text-light-muted dark:text-dark-muted/30 mx-auto" />
                        <h4 className="text-base font-bold">QR Code Inactive</h4>
                        <p className="text-xs text-light-muted dark:text-dark-muted max-w-xs mx-auto">
                          Configure classroom coordinates and click "Start QR Session" to display the dynamically rotating QR attendance sheet on this projector screen.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add Subject Modal */}
          <AnimatePresence>
            {showAddSubjectModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-dark-card w-full max-w-md rounded-3xl border border-light-border dark:border-dark-border/40 p-6 shadow-2xl relative"
                >
                  <button
                    onClick={() => setShowAddSubjectModal(false)}
                    className="absolute top-5 right-5 p-2 hover:bg-light-bg dark:hover:bg-dark-bg/60 rounded-xl text-light-muted dark:text-dark-muted"
                  >
                    <X className="p-0 text-light-muted w-5 h-5" />
                  </button>

                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-brand-500" />
                    <span>Create New Subject</span>
                  </h3>

                  <form onSubmit={handleAddSubjectSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="block text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                        Subject Name
                      </label>
                      <input
                        type="text"
                        required
                        value={newSubjName}
                        onChange={(e) => setNewSubjName(e.target.value)}
                        placeholder="e.g. Database Management Systems"
                        className="w-full px-4 py-2.5 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 rounded-xl outline-none text-xs text-light-text dark:text-dark-text"
                      />
                    </div>

                    {/* Code */}
                    <div>
                      <label className="block text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                        Subject Code
                      </label>
                      <input
                        type="text"
                        required
                        value={newSubjCode}
                        onChange={(e) => setNewSubjCode(e.target.value)}
                        placeholder="e.g. CS8492"
                        className="w-full px-4 py-2.5 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 rounded-xl outline-none text-xs text-light-text dark:text-dark-text uppercase"
                      />
                    </div>

                    {/* Department */}
                    <div>
                      <label className="block text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                        Department
                      </label>
                      <select
                        required
                        value={newSubjDept}
                        onChange={(e) => setNewSubjDept(e.target.value)}
                        className="w-full px-4 py-2.5 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 rounded-xl outline-none text-xs text-light-text dark:text-dark-text"
                      >
                        {departments.length === 0 ? (
                          <option value="">Loading departments...</option>
                        ) : (
                          departments.map((dept) => (
                            <option key={dept._id} value={dept._id}>
                              {dept.name} ({dept.code})
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Semester */}
                    <div>
                      <label className="block text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                        Target Semester
                      </label>
                      <select
                        required
                        value={newSubjSemester}
                        onChange={(e) => setNewSubjSemester(Number(e.target.value))}
                        className="w-full px-4 py-2.5 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 rounded-xl outline-none text-xs text-light-text dark:text-dark-text"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                          <option key={sem} value={sem}>
                            Semester {sem}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingSubject}
                      className="w-full py-3 px-4 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 text-white rounded-2xl text-xs font-semibold tracking-wide flex items-center justify-center gap-2 shadow-lg"
                    >
                      {submittingSubject ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      <span>Create Subject</span>
                    </button>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
export default Attendance;
