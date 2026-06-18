import { useState, useEffect } from 'react';
import { KeyRound, Send } from 'lucide-react';
import apiClient from '../api/apiClient';
import { formatDate } from '../utils/helpers';
import Loader from '../components/Loader';

export default function VerificationPage() {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otpCode, setOtpCode] = useState('');
  const [otpResult, setOtpResult] = useState(null);

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      const data = await apiClient.get('/verification/history');
      setVerifications(data.data.verifications || []);
    } catch (err) {
      console.error('Failed to fetch verifications');
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async () => {
    try {
      const data = await apiClient.post('/verification/request', {
        verification_type: 'otp_sms',
        device_id: 'web_browser_001',
        city: 'Surat',
        ip_address: '192.168.1.100',
      });
      alert(`OTP Code: ${data.data.code}`);
      fetchVerifications();
    } catch (err) {
      console.error('Failed to request OTP');
    }
  };

  const verifyOtp = async () => {
    try {
      const data = await apiClient.post('/verification/verify', {
        code: otpCode,
        verification_type: 'otp_sms',
      });
      setOtpResult(data.data);
      setOtpCode('');
      fetchVerifications();
    } catch (err) {
      setOtpResult({ success: false, message: 'Verification failed' });
    }
  };

  if (loading) return <Loader text="Loading verification history..." />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Step-up Verification</h1>
        <p className="text-text-secondary text-sm sm:text-base mt-2">OTP and multi-factor authentication</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-card border border-border rounded-2xl p-6 sm:p-7 space-y-5">
          <h3 className="text-text-primary font-semibold flex items-center gap-2.5 text-base">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <KeyRound size={18} className="text-primary" />
            </div>
            Request OTP
          </h3>
          <button
            onClick={requestOtp}
            className="w-full py-3 bg-gradient-to-r from-primary to-primary-light hover:from-primary-light hover:to-primary text-bg-dark font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/20"
          >
            <Send size={18} />
            Send OTP
          </button>

          <div className="border-t border-border pt-5">
            <h4 className="text-text-primary font-medium mb-3">Verify Code</h4>
            <div className="flex gap-3">
              <input
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-bg-dark border border-border rounded-xl text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                placeholder="Enter 6-digit code"
                maxLength={6}
              />
              <button
                onClick={verifyOtp}
                className="px-6 py-2.5 bg-success hover:bg-success/80 text-white font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Verify
              </button>
            </div>
            {otpResult && (
              <div className={`mt-3 text-sm font-medium ${otpResult.success ? 'text-success' : 'text-danger'}`}>
                {otpResult.message}
              </div>
            )}
          </div>
        </div>

        <div className="bg-bg-card border border-border rounded-2xl p-6 sm:p-7">
          <h3 className="text-text-primary font-semibold mb-5 text-base">Verification History</h3>
          <div className="space-y-3">
            {verifications.map((v) => (
              <div key={v.verification_id} className="flex items-center justify-between p-4 bg-bg-dark/50 rounded-xl border border-border/50">
                <div>
                  <p className="text-text-primary text-sm font-medium">{v.verification_type}</p>
                  <p className="text-text-muted text-xs mt-0.5">{formatDate(v.requested_at)}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  v.is_verified ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                }`}>
                  {v.is_verified ? 'Verified' : 'Pending'}
                </span>
              </div>
            ))}
            {verifications.length === 0 && (
              <p className="text-text-muted text-sm text-center py-6">No verification history</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
