import React, { useState, useEffect } from 'react';
import { Smartphone, Mic, MicOff, Volume2, CheckCircle, Wifi, AlertTriangle } from 'lucide-react';
import { PhoneMicService } from '../services/phoneMicService';

interface PhoneMicReceiverScreenProps {
  sessionId: string;
}

export const PhoneMicReceiverScreen: React.FC<PhoneMicReceiverScreenProps> = ({ sessionId }) => {
  const service = PhoneMicService.getInstance();
  const [isConnected, setIsConnected] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStartMic = async () => {
    setErrorMessage(null);
    const success = await service.connectAsPhone(sessionId, (level) => {
      setAudioLevel(level);
    });

    if (success) {
      setIsConnected(true);
    } else {
      setErrorMessage('Mikrofon erişimi başlatılamadı. Lütfen tarayıcı ayarlarından mikrofon iznini onaylayınız.');
    }
  };

  const handleToggleMute = () => {
    const muted = service.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#10b98120', border: '1px solid #10b981', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
          <Smartphone size={32} color="#10b981" />
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px 0' }}>DersPusulası Kablosuz Mikrofon</h2>
        <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: '0 0 24px 0' }}>
          Oturum Kodu: <code style={{ backgroundColor: '#1e293b', padding: '2px 6px', borderRadius: '4px', color: '#38bdf8' }}>{sessionId}</code>
        </p>

        {errorMessage && (
          <div style={{ backgroundColor: '#fef2f220', border: '1px solid #ef4444', color: '#fca5a5', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
            <AlertTriangle size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            {errorMessage}
          </div>
        )}

        {!isConnected ? (
          <button
            onClick={handleStartMic}
            style={{ 
              width: '100%', 
              padding: '16px', 
              borderRadius: '12px', 
              backgroundColor: '#10b981', 
              color: 'white', 
              fontWeight: 700, 
              fontSize: '1.1rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
            }}
          >
            <Mic size={22} />
            <span>Mikrofonu Başlat ve Bağlan</span>
          </button>
        ) : (
          <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '24px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#10b981', marginBottom: '16px' }}>
              <Wifi size={20} />
              <strong style={{ fontSize: '1rem' }}>Bilgisayara Bağlandı</strong>
            </div>

            {/* VU Meter Canlı Çubuk */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                <span>Canlı Ses Seviyesi</span>
                <span>{audioLevel}%</span>
              </div>
              <div style={{ height: '14px', backgroundColor: '#0f172a', borderRadius: '7px', overflow: 'hidden', padding: '2px' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${audioLevel}%`, 
                    backgroundColor: audioLevel > 75 ? '#ef4444' : audioLevel > 40 ? '#10b981' : '#3b82f6',
                    borderRadius: '5px',
                    transition: 'width 0.08s ease'
                  }} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleToggleMute}
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  borderRadius: '10px', 
                  backgroundColor: isMuted ? '#ef4444' : '#334155', 
                  color: 'white', 
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                <span>{isMuted ? 'Sesi Aç' : 'Sessize Al'}</span>
              </button>
            </div>

            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '16px', lineHeight: 1.4 }}>
              🔒 Sesiniz doğrudan bilgisayarınızdaki ders rehberi oturumuna aktarılır. Kayıt sunucularda saklanmaz.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
