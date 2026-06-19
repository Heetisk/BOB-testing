import { useState, useEffect } from 'react';
import { KeyRound, Send } from 'lucide-react';
import apiClient from '../api/apiClient';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { formatDate } from '../utils/helpers';
import Loader from '../components/Loader';

export default function VerificationPage() {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otpCode, setOtpCode] = useState('');
  const [otpResult, setOtpResult] = useState(null);
  const [sentCode, setSentCode] = useState(null);

  const fetchVerifications = async () => {
    try {
      const data = await apiClient.get('/verification/history');
      setVerifications(data.data.verifications || []);
    } catch { console.error('Failed to fetch verifications'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    let cancelled = false;
    apiClient.get('/verification/history')
      .then((data) => { if (!cancelled) setVerifications(data.data.verifications || []); })
      .catch(() => console.error('Failed to fetch verifications'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const requestOtp = async () => {
    try {
      const data = await apiClient.post('/verification/request', {
        verification_type: 'otp_sms',
        device_id: 'web_browser_001',
        city: 'Surat',
        ip_address: '192.168.1.100',
      });
      setSentCode(data.data.code);
      setOtpResult(null);
      fetchVerifications();
    } catch { console.error('Failed to request OTP'); }
  };

  const verifyOtp = async () => {
    try {
      const data = await apiClient.post('/verification/verify', {
        code: otpCode,
        verification_type: 'otp_sms',
      });
      setOtpResult(data.data);
      setOtpCode('');
      setSentCode(null);
      fetchVerifications();
    } catch {
      setOtpResult({ success: false, message: 'Verification failed' });
    }
  };

  if (loading) return <Loader text="Loading verification history..." />;

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-3 mb-1">
          <KeyRound size={20} className="text-accent" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-text-1 font-display tracking-tight">Verification</h1>
        </div>
        <p className="text-sm text-text-3 ml-[32px]">OTP and multi-factor authentication</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card padding="lg" className="animate-fade-in-up stagger-1">
          <h3 className="text-sm font-semibold text-text-1 font-display mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <KeyRound size={14} className="text-accent" aria-hidden="true" />
            </div>
            Request OTP
          </h3>

          <Button fullWidth size="md" icon={Send} onClick={requestOtp}>Send OTP</Button>

          {sentCode && (
            <div className="mt-3 p-3 bg-accent-subtle border border-accent/20 rounded-xl text-sm text-accent font-mono">
              OTP Code: <span className="font-bold">{sentCode}</span>
            </div>
          )}

          <div className="mt-5 pt-5 border-t border-surface-3/50">
            <h4 className="text-sm font-medium text-text-1 mb-3">Verify Code</h4>
            <div className="flex gap-2">
              <Input
                label="OTP Code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                containerClassName="flex-1"
              />
              <Button variant="success" size="md" onClick={verifyOtp}>Verify</Button>
            </div>
            {otpResult && (
              <p className={`mt-2 text-sm font-medium ${otpResult.success ? 'text-success' : 'text-danger'}`}>
                {otpResult.message}
              </p>
            )}
          </div>
        </Card>

        <Card padding="lg" className="animate-fade-in-up stagger-2">
          <h3 className="text-sm font-semibold text-text-1 font-display mb-4">Verification History</h3>
          <div className="space-y-2">
            {verifications.map((v) => (
              <div key={v.verification_id} className="flex items-center justify-between p-3 bg-surface-0 rounded-xl border border-surface-3/30">
                <div>
                  <p className="text-sm font-medium text-text-1">{v.verification_type}</p>
                  <p className="text-[10px] text-text-3/60 mt-0.5">{formatDate(v.requested_at)}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  v.is_verified ? 'text-success bg-success-subtle' : 'text-warning bg-warning-subtle'
                }`}>
                  {v.is_verified ? 'Verified' : 'Pending'}
                </span>
              </div>
            ))}
            {verifications.length === 0 && (
              <p className="text-sm text-text-3 text-center py-6">No verification history</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
