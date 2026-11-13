'use client';

import React, { useId, useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';
import { IMAGE_ACCEPT, uploadImage } from './shared';

/**
 * An image chosen by upload or by address, with its description.
 * value: { url, alt }; errors: { url?, alt? }.
 */
export default function ImageField({ label, value, onChange, errors = {}, hint, aspect = 'aspect-[1200/630]', emptyText = 'Upload an image' }) {
  const inputId = useId();
  const fileInput = useRef(null);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [over, setOver] = useState(false);
  const url = value?.url || '';
  const alt = value?.alt || '';

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    setUploadError('');
    try {
      onChange({ url: await uploadImage(file), alt });
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (event) => {
    event.preventDefault();
    setOver(false);
    upload(event.dataTransfer?.files?.[0]);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-xs font-semibold text-[#4A4A4A]">{label}</span>
        {url && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={busy}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md text-[#4A4A4A] hover:bg-[#F0EEEB]"
            >
              <Upload className="w-3 h-3" />
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange({ url: '', alt: '' })}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md text-[#B11912] hover:bg-[#FCE9E7]"
            >
              <Trash2 className="w-3 h-3" />
              Remove
            </button>
          </div>
        )}
      </div>

      {url ? (
        <div className={`relative ${aspect} rounded-lg overflow-hidden border border-[#E8E6E3] bg-[#F7F5F2]`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
          {busy && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[#E1261C]" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={onDrop}
          disabled={busy}
          className={`w-full ${aspect} rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1.5 text-center px-4 transition-colors ${
            over ? 'border-[#E1261C] bg-[#FCE9E7]' : 'border-[#E0DDD8] bg-[#FCFBFA] hover:border-[#E1261C]'
          }`}
        >
          {busy ? <Loader2 className="w-5 h-5 animate-spin text-[#E1261C]" /> : <ImagePlus className="w-5 h-5 text-[#B4B0AA]" />}
          <span className="text-xs font-semibold text-[#0A0A0A]">{busy ? 'Uploading…' : emptyText}</span>
          <span className="text-[11px] text-[#888888]">Click or drop a file · JPEG, PNG, WebP or GIF up to 5 MB</span>
        </button>
      )}
      <input ref={fileInput} type="file" accept={IMAGE_ACCEPT} className="hidden" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />

      {!url && (
        <input
          type="text"
          aria-label={`${label}: image address`}
          placeholder="…or paste an image address (https://)"
          onBlur={(e) => {
            const next = e.target.value.trim();
            if (next) {
              onChange({ url: next, alt });
              e.target.value = '';
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          className="mt-2 w-full px-3 py-1.5 text-xs rounded-lg border border-[#E8E6E3] bg-white focus:outline-none focus:border-[#E1261C] focus:ring-2 focus:ring-[#FCE9E7]"
        />
      )}
      {(uploadError || errors.url) && <p className="mt-1.5 text-[11px] font-semibold text-[#B11912]">{uploadError || errors.url}</p>}

      {url && (
        <label htmlFor={inputId} className="block mt-2">
          <span className="block text-[11px] font-semibold text-[#4A4A4A] mb-1">Description (alt text)</span>
          <input
            id={inputId}
            type="text"
            value={alt}
            maxLength={200}
            onChange={(e) => onChange({ url, alt: e.target.value })}
            placeholder="What the image shows"
            aria-invalid={Boolean(errors.alt)}
            className={`w-full px-3 py-1.5 text-xs rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-[#FCE9E7] ${
              errors.alt ? 'border-[#E1261C]' : 'border-[#E8E6E3] focus:border-[#E1261C]'
            }`}
          />
          {errors.alt && <span className="block mt-1 text-[11px] font-semibold text-[#B11912]">{errors.alt}</span>}
        </label>
      )}
      {hint && <p className="mt-1.5 text-[11px] text-[#888888] leading-relaxed">{hint}</p>}
    </div>
  );
}
