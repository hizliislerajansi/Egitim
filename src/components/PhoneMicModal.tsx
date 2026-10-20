import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  X, 
  Mic, 
  MicOff, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  AlertTriangle,
  QrCode,
  Volume2,
  RefreshCw,
  Laptop
} from 'lucide-react';
import { PhoneMicService, PhoneMicStatus } from '../services/phoneMicService';

interface PhoneMicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscriptReceived?: (text: string) => void;
}

export const PhoneMicModal: React.FC<PhoneMicModalProps> = ({ isOpen, onClose, onTranscriptReceived }) => {
  const service = PhoneMicService.getInstance();
  const [status, setStatus] = useState<PhoneMicStatus>(service.getStatus());
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [lastTranscript, setLastTranscript] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const pairingUrl = service.getPairingUrl();

  useEffect(() => {
    if (isOpen) {
      service.startHostSession();
      const unsubscribe = service.subscribe((event) => {
        if (event.type === 'status_change' && event.status) {
          setStatus(event.status);
        } else if (event.type === 'audio_level' && event.audioLevel !== undefined) {
          setAudioLevel(event.audioLevel);
        } else if (event.type === 'transcript' && event.transcript) {
          setLastTranscript(event.transcript);
          if (onTranscriptReceived) onTranscriptReceived(event.transcript);
        }
      });

      return () => {
        unsubscribe();
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleMute = () => {
    const muted = service.toggleMute();
    setIsMuted(muted);
  };

  const handleDisconnect = () => {
    service.disconnect();
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 10000 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '520px', width: '92%', padding: '24px', borderRadius: '16px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: '#10b98120', padding: '8px', borderRadius: '10px', color: '#10b981' }}>
              <Smartphone size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Sekmeler arası mikrofon (deneysel)</h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Aynı cihazdaki sekmeler arasında dikte ve ses seviyesi aktarımı.
              </p>
            </div>
          </div>
          <button aria-label="Mikrofon penceresini kapat" className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Durum Kartı */}
        <div style={{ 
          padding: '14px', 
          borderRadius: '12px', 
          backgroundColor: status === 'connected' ? '#ecfdf5' : status === 'fallback_to_pc' ? '#fffbeb' : 'var(--bg-secondary)', 
          border: `1px solid ${status === 'connected' ? '#a7f3d0' : status === 'fallback_to_pc' ? '#fde68a' : 'var(--border-color)'}`,
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {status === 'connected' ? (
                <Wifi size={18} color="#10b981" />
              ) : status === 'fallback_to_pc' ? (
                <Laptop size={18} color="#d97706" />
              ) : (
                <RefreshCw size={18} className="animate-spin" color="#2563eb" />
              )}
              <strong style={{ fontSize: '0.9rem', color: status === 'connected' ? '#059669' : status === 'fallback_to_pc' ? '#d97706' : 'var(--text-primary)' }}>
                {status === 'connected' ? 'Telefon Bağlandı (Canlı Ses Aktif)' : status === 'fallback_to_pc' ? 'Telefon Kesildi • PC Mikrofonuna Geçildi' : 'Telefon Eşleşmesi Hazırlanıyor…'}
              </strong>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', backgroundColor: status === 'connected' ? '#10b981' : '#94a3b8', color: 'white' }}>
              {status.toUpperCase()}
            </span>
          </div>

          {/* Ses Seviyesi Göstergesi (VU-Meter) */}
          {status === 'connected' && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                <span>Mikrofon Ses Seviyesi</span>
                <span>{audioLevel}%</span>
              </div>
              <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${audioLevel}%`, 
                    backgroundColor: audioLevel > 75 ? '#ef4444' : audioLevel > 40 ? '#10b981' : '#3b82f6',
                    transition: 'width 0.1s ease'
                  }} 
                />
              </div>
            </div>
          )}
        </div>

        {/* Eşleştirme QR Kodu & Link Alanı */}
        {status !== 'connected' && (
          <div style={{ textAlign: 'center', padding: '16px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
            <p>Ayrı telefon üzerinden ağ bağlantısı bu sürümde desteklenmiyor. QR eşleştirme sunulmuyor. Bu bağlantı yalnızca aynı cihaz ve tarayıcı profilindeki başka sekmede çalışır:</p>
            <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', backgroundColor: 'var(--bg-secondary)', padding: '6px 10px', borderRadius: '6px', wordBreak: 'break-all' }}>
              {pairingUrl}
            </div>
          </div>
        )}

        {/* Son İletilen Dikte */}
        {lastTranscript && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Telefondan Alınan Son Ses/Dikte:</span>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', fontStyle: 'italic' }}>"{lastTranscript}"</p>
          </div>
        )}

        {/* Alt Butonlar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {status === 'connected' && (
            <button 
              className={`btn ${isMuted ? 'btn-primary' : 'btn-secondary'}`}
              onClick={handleToggleMute}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
              <span>{isMuted ? 'Sesi Aç' : 'Sessize Al'}</span>
            </button>
          )}

          <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
            <button className="btn btn-secondary" onClick={handleDisconnect}>
              {status === 'connected' ? 'Bağlantıyı Kes' : 'Kapat'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
