import React, { useState } from 'react';
import { Star } from 'lucide-react';

// Simple Feedback Modal component
// Props: booking (object), onClose (function), onSubmit (function rating, comment)
export default function FeedbackModal({ booking, onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (rating === 0) {
      alert('Please select a rating before submitting.');
      return;
    }
    onSubmit(rating, comment);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 style={styles.title}>We value your feedback</h2>
        <p style={styles.subtitle}>Your booking: {booking?.token || booking?.id}</p>
        <div style={styles.ratingContainer}>
          {[1,2,3,4,5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 0 }}
            >
              <Star
                size={26}
                fill={star <= (hoverRating || rating) ? "#E5A93B" : "none"}
                color={star <= (hoverRating || rating) ? "#E5A93B" : "var(--line, #162234)"}
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>
        <textarea
          placeholder="Additional comments (optional)"
          value={comment}
          onChange={e => setComment(e.target.value)}
          style={styles.textarea}
        />
        <div style={styles.buttonRow}>
          <button onClick={handleSubmit} style={styles.submitBtn}>Submit</button>
          <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(16px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    cursor: 'pointer',
  },
  modal: {
    background: 'var(--surface, #0C1220)',
    color: 'var(--paper, #fff)',
    padding: '36px 32px',
    border: '1px solid var(--line, #162234)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    width: '100%',
    maxWidth: '400px',
    cursor: 'default',
  },
  title: { margin: 0, fontSize: '18px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', textAlign: 'center', color: 'var(--paper, #fff)' },
  subtitle: { marginTop: '8px', fontSize: '12px', textAlign: 'center', color: 'var(--muted, #6C7D93)', letterSpacing: '0.1em' },
  ratingContainer: { display: 'flex', justifyContent: 'center', margin: '24px 0', gap: '8px' },
  star: { fontSize: '24px', color: 'var(--line, #162234)', cursor: 'pointer', transition: 'color 0.15s' },
  starSelected: { fontSize: '24px', color: '#E5A93B', cursor: 'pointer', transition: 'color 0.15s' },
  textarea: { width: '100%', height: '80px', marginTop: '8px', padding: '14px 16px', background: 'transparent', color: 'var(--paper, #fff)', border: '1px solid var(--line, #162234)', outline: 'none', resize: 'none', fontFamily: 'inherit', fontSize: '13px' },
  buttonRow: { display: 'flex', gap: '10px', marginTop: '24px' },
  submitBtn: { flex: 1, background: 'var(--paper, #ffffff)', color: 'var(--ink, #000000)', border: 'none', padding: '14px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer' },
  cancelBtn: { flex: 1, background: 'transparent', color: 'var(--muted, #6C7D93)', border: '1px solid var(--line, #162234)', padding: '14px', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer' },
};
