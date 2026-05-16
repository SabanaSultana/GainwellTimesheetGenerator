import React from 'react';

const ConfirmModal = ({ isOpen, title, message, confirmLabel = 'Confirm', confirmDanger = false, onConfirm, onCancel, loading = false }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(14,30,61,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff', borderRadius: '14px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          padding: '32px 32px 28px',
          width: '100%', maxWidth: '440px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <h3 style={{ margin: '0 0 10px', fontSize: '18px', fontWeight: 700, color: '#0e1e3d' }}>
          {title}
        </h3>
        <p style={{ margin: '0 0 28px', fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>
          {message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '10px 22px', borderRadius: '8px',
              border: '1.5px solid #e5e7eb', background: '#ffffff',
              color: '#374151', fontSize: '13px', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '10px 22px', borderRadius: '8px', border: 'none',
              background: confirmDanger
                ? '#dc2626'
                : 'linear-gradient(135deg, #3b82f6 80%, #60a5fa 100%)',
              color: '#ffffff', fontSize: '13px', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            }}
          >
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
