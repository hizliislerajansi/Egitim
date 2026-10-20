import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Trash2, Save, Sparkles } from 'lucide-react';
import { readSetting, writeSetting } from '../services/apiClient';
import { AiAdapter } from '../services/aiAdapter';
import {downloadBlob} from '../services/download';
import { MEB_SUBJECTS } from '../data/mebCurriculum';

interface NoteItem {
  id: string;
  title: string;
  subject: string;
  date: string;
  preview: string;
  content: string;
}

const DEFAULT_NOTES: NoteItem[] = [];

export const NotesScreen: React.FC = () => {
  const [notes, setNotes] = useState<NoteItem[]>(() => readSetting<NoteItem[]>('student_notes_v1', DEFAULT_NOTES));
  const [activeNote, setActiveNote] = useState<NoteItem | null>(() => {
    const initial = readSetting<NoteItem[]>('student_notes_v1', DEFAULT_NOTES);
    return initial[0] || null;
  });
  const [search, setSearch] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [deletedNote,setDeletedNote]=useState<NoteItem|null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const persistNotes = (nextNotes: NoteItem[]) => {
    setNotes(nextNotes);
    writeSetting('student_notes_v1', nextNotes);
  };

  const updateDraft=(draft:NoteItem)=>{
    const saved={...draft,preview:draft.content.slice(0,90)};
    const next=notes.map(n=>n.id===saved.id?saved:n);
    writeSetting('student_notes_v1',next);setNotes(next);setActiveNote(saved);setStatusMessage('Otomatik kaydedildi.');
  };

  const handleAddNewNote = () => {
    const newN: NoteItem = {
      id: `note_${Date.now()}`,
      title: 'Yeni Çalışma Notu',
      subject: 'Matematik',
      date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
      preview: '',
      content: ''
    };
    const next = [newN, ...notes];
    persistNotes(next);
    setActiveNote(newN);
    setStatusMessage('Yeni not oluşturuldu.');
  };

  const handleSaveActiveNote = () => {
    if (!activeNote) return;
    const updated: NoteItem = {
      ...activeNote,
      title: activeNote.title.trim() || 'Başlıksız Not',
      preview: activeNote.content.trim().slice(0, 90) + (activeNote.content.length > 90 ? '...' : ''),
      date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    };
    const next = notes.map(n => (n.id === updated.id ? updated : n));
    persistNotes(next);
    setActiveNote(updated);
    setStatusMessage('Not yerel veritabanına kaydedildi.');
  };

  const handleDeleteNote = (id: string) => {
    setDeletedNote(notes.find(n=>n.id===id)||null);
    const next = notes.filter(n => n.id !== id);
    persistNotes(next);
    if (activeNote?.id === id) {
      setActiveNote(next[0] || null);
    }
    setStatusMessage('Not silindi.');
  };

  const handleSummarizeWithAi = async () => {
    if (!activeNote || isSummarizing) return;
    setIsSummarizing(true);
    setStatusMessage('ders rehberi notunuzu özetliyor...');
    try {
      const response = await AiAdapter.request({
        role: 'subject_teacher',
        taskType: 'explanation',
        userMessage: `Aşağıdaki öğrenci ders notunu kısaca özetle ve varsa önemli MEB 9. sınıf ipuçlarını madde olarak ekle:\n\nBaşlık: ${activeNote.title}\nDers: ${activeNote.subject}\nİçerik: ${activeNote.content}`,
        maxTokens: 320
      });
      const enrichedContent = `${activeNote.content.trim()}\n\n--- 📌 ders rehberi Özeti & MEB İpuçları ---\n${response.text}`;
      const updated: NoteItem = {
        ...activeNote,
        content: enrichedContent,
        preview: enrichedContent.slice(0, 90) + '...'
      };
      const next = notes.map(n => (n.id === updated.id ? updated : n));
      persistNotes(next);
      setActiveNote(updated);
      setStatusMessage('Rehber özeti nota eklendi ve kaydedildi.');
    } catch (err: any) {
      setStatusMessage(err?.message || 'Rehber özeti alınamadı.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const filteredNotes = notes.filter(
    n =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.subject.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dp-notes-page">
      {deletedNote&&<div role="status">Not silindi. <button onClick={()=>{persistNotes([deletedNote,...notes]);setActiveNote(deletedNote);setDeletedNote(null);}}>Geri al</button></div>}
      <div className="dp-notes-sidebar">
        <div className="dp-notes-head">
          <div className="dp-search-input-wrap" style={{ width: '100%' }}>
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              aria-label="Not ara" placeholder="Not ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="dp-btn-primary"
            style={{ width: '100%', marginTop: '10px' }}
            onClick={handleAddNewNote}
          >
            <Plus size={16} /> Yeni Not Oluştur
          </button>
        </div>

        <div className="dp-notes-list">
          {filteredNotes.map(n => (
            <button type="button"
              key={n.id}
              className={`dp-note-card-item ${activeNote?.id === n.id ? 'active' : ''}`}
              onClick={() => {
                setActiveNote(n);
                setStatusMessage(null);
              }}
            >
              <div className="dp-note-item-top">
                <span className="dp-note-subj">{n.subject}</span>
                <span className="dp-note-date">{n.date}</span>
              </div>
              <h4 className="dp-note-item-title">{n.title}</h4>
              <p className="dp-note-item-snippet">{n.preview}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="dp-notes-editor-pane">
        {activeNote ? (
          <div className="dp-card dp-editor-card">
            <div className="dp-editor-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <input
                  type="text"
                  aria-label="Not başlığı" className="dp-editor-title-input"
                  value={activeNote.title}
                  onChange={e => updateDraft({ ...activeNote, title: e.target.value })}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <select
                    aria-label="Not dersi"
                    className="chat-input"
                    style={{ padding: '2px 8px', fontSize: '0.78rem' }}
                    value={activeNote.subject}
                    onChange={e => updateDraft({ ...activeNote, subject: e.target.value })}
                  >
                    {MEB_SUBJECTS.map(s => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <span className="dp-editor-meta">• {activeNote.date}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={isSummarizing}
                  onClick={() => void handleSummarizeWithAi()}
                >
                  <Sparkles size={15} color="#2563eb" /> {isSummarizing ? 'Özetleniyor…' : 'Özetle'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={()=>downloadBlob(new Blob([activeNote.title+'\n\n'+activeNote.content],{type:'text/plain;charset=utf-8'}),'ders-notu.txt')}>Dışa aktar</button>
                <button type="button" className="btn btn-primary" onClick={handleSaveActiveNote}>
                  <Save size={15} /> Kaydet
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleDeleteNote(activeNote.id)}
                  title="Notu Sil"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {statusMessage && (
              <div
                role="status"
                style={{
                  fontSize: '0.8rem',
                  color: '#059669',
                  backgroundColor: '#ecfdf5',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  marginBottom: '8px'
                }}
              >
                {statusMessage}
              </div>
            )}

            <textarea
              aria-label="Not içeriği" className="dp-editor-textarea"
              value={activeNote.content}
              onChange={e => updateDraft({ ...activeNote, content: e.target.value })}
              placeholder="Ders notlarını, formülleri ve önemli soru çözümlerini buraya yaz..."
            />
          </div>
        ) : (
          <div className="dp-empty-state">
            <FileText size={48} color="#cbd5e1" />
            <p>Görüntülemek için soldan bir not seçin veya yeni bir not oluşturun.</p>
          </div>
        )}
      </div>
    </div>
  );
};
