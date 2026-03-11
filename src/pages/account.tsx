import React, { useEffect, useState } from 'react';
import '../CSS/account.css';
import Bars from '../components/Bars';

interface CurrentUser {
  name: string;
  email: string;
}

const BAR_COUNT = 7;
const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{6})$/;
const DEFAULT_COLORS = ['#FF0000', '#FFA500', '#FFFF00', '#008000', '#0000FF', '#4B0082', '#EE82EE'];
const API_BASE =
  process.env.REACT_APP_API_BASE ||
  (window.location.port === '3000' ? 'http://localhost:3002' : window.location.origin);

interface HoverPreviewState {
  isVisible: boolean;
  x: number;
  y: number;
  hex: string;
}

function getStoredBarColors(storageKey: string): string[] | null {
  if (!storageKey) {
    return null;
  }

  const rawValue = localStorage.getItem(storageKey);
  if (!rawValue) {
    return null;
  }

  try {
    const parsedColors = JSON.parse(rawValue) as string[];
    const hasValidColors =
      Array.isArray(parsedColors) &&
      parsedColors.length === BAR_COUNT &&
      parsedColors.every((color) => typeof color === 'string' && HEX_COLOR_REGEX.test(color));

    return hasValidColors ? parsedColors : null;
  } catch (error) {
    return null;
  }
}

function hslToHex(hue: number, saturation: number, lightness: number): string {
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const huePrime = hue / 60;
  const x = chroma * (1 - Math.abs((huePrime % 2) - 1));

  let r = 0;
  let g = 0;
  let b = 0;

  if (huePrime >= 0 && huePrime < 1) {
    r = chroma;
    g = x;
  } else if (huePrime >= 1 && huePrime < 2) {
    r = x;
    g = chroma;
  } else if (huePrime >= 2 && huePrime < 3) {
    g = chroma;
    b = x;
  } else if (huePrime >= 3 && huePrime < 4) {
    g = x;
    b = chroma;
  } else if (huePrime >= 4 && huePrime < 5) {
    r = x;
    b = chroma;
  } else {
    r = chroma;
    b = x;
  }

  const m = l - chroma / 2;
  const toHex = (channel: number) =>
    Math.round((channel + m) * 255)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function AccountPage() {
  const [barColors, setBarColors] = useState<string[]>(DEFAULT_COLORS);
  const [savedBarColors, setSavedBarColors] = useState<string[]>(DEFAULT_COLORS);
  const [previewInstance, setPreviewInstance] = useState(0);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [hoverPreview, setHoverPreview] = useState<HoverPreviewState>({
    isVisible: false,
    x: 0,
    y: 0,
    hex: '#FF0000',
  });

  const currentUserRaw = localStorage.getItem('currentUser');
  const currentUser = currentUserRaw ? (JSON.parse(currentUserRaw) as CurrentUser) : null;
  const accountStorageKey = currentUser?.email
    ? `barColors:${currentUser.email.trim().toLowerCase()}`
    : '';

  useEffect(() => {
    if (!currentUser?.email) {
      return;
    }

    const storedColors = getStoredBarColors(accountStorageKey);
    if (storedColors) {
      setBarColors(storedColors);
      setSavedBarColors(storedColors);
      setPreviewInstance((current) => current + 1);
    }

    const loadColors = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/account/colors/${encodeURIComponent(currentUser.email)}`
        );
        const data = await response.json();
        if (response.ok && Array.isArray(data.colors) && data.colors.length === BAR_COUNT) {
          setBarColors(data.colors);
          setSavedBarColors(data.colors);
          setPreviewInstance((current) => current + 1);
          if (accountStorageKey) {
            localStorage.setItem(accountStorageKey, JSON.stringify(data.colors));
          }
        } else if (!storedColors) {
          setBarColors(DEFAULT_COLORS);
          setSavedBarColors(DEFAULT_COLORS);
        }
      } catch (error) {
        if (!storedColors) {
          setSaveError('Could not load saved bar colors. Check that the server is running.');
        }
      }
    };

    loadColors();
  }, [accountStorageKey, currentUser?.email]);

  const handleColorChange = (index: number, value: string) => {
    setSaveMessage('');
    setSaveError('');

    const next = [...barColors];
    next[index] = value;
    setBarColors(next);
  };

  const handleSaveColors = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMessage('');
    setSaveError('');

    const normalized = barColors.map((color) => color.trim().toUpperCase());
    const hasInvalid = normalized.some((color) => !HEX_COLOR_REGEX.test(color));
    if (hasInvalid) {
      setSaveError('All bar colors must be valid hex codes like #A1B2C3.');
      return;
    }

    if (!currentUser?.email) {
      setSaveError('You must be signed in to save colors.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/account/colors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          colors: normalized,
        }),
      });
      const rawText = await response.text();
      const data = rawText ? JSON.parse(rawText) : {};

      if (!response.ok) {
        setSaveError(data.error || 'Could not save colors.');
        return;
      }

      setBarColors(data.colors);
      setSavedBarColors(data.colors);
      setPreviewInstance((current) => current + 1);
      if (accountStorageKey) {
        localStorage.setItem(accountStorageKey, JSON.stringify(data.colors));
      }
      setSaveMessage('Bar colors saved to your account.');
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Could not save colors. Check that the server is running.';
      setSaveError(errorMessage);
    }
  };

  const getHexFromPickerEvent = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
    const hue = (relativeX / rect.width) * 360;
    return hslToHex(hue, 100, 50);
  };

  const handlePickerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const hex = getHexFromPickerEvent(e);

    setHoverPreview({
      isVisible: true,
      x: e.clientX + 16,
      y: e.clientY + 16,
      hex,
    });
  };

  const handlePickerLeave = () => {
    setHoverPreview((previous) => ({ ...previous, isVisible: false }));
  };

  const handlePickerSelect = (index: number, e: React.MouseEvent<HTMLDivElement>) => {
    const hex = getHexFromPickerEvent(e);
    handleColorChange(index, hex);
  };

  if (!currentUser) {
    return (
      <main className="account-page">
        <section className="account-card">
          <h1>Account</h1>
          <p>You are not signed in.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="account-page">
      <div className="account-layout">
        <section className="account-card account-details-card">
          <h1>Account</h1>
          <div className="account-details-list">
            <p><strong>Name:</strong> {currentUser.name}</p>
            <p><strong>Email:</strong> {currentUser.email}</p>
          </div>
        </section>
        <section className="account-card account-colors-card">
          <h2>Bar Colors</h2>
          <form className="account-form" onSubmit={handleSaveColors}>
            {barColors.map((color, index) => (
              <label key={index} className="account-label">
                <span className="account-label-row">
                  <span>{`Bar ${index + 1}`}</span>
                  <span
                    className="account-saved-color"
                    style={{ backgroundColor: barColors[index] }}
                    aria-label={`Selected color for bar ${index + 1}: ${barColors[index]}`}
                    title={`Selected color: ${barColors[index]}`}
                  />
                </span>
                <div className="rainbow-picker-group">
                  <p className="rainbow-picker-label">Pick a color</p>
                  <div
                    className="rainbow-picker"
                    onMouseMove={handlePickerMove}
                    onMouseLeave={handlePickerLeave}
                    onClick={(e) => handlePickerSelect(index, e)}
                    aria-label={`Rainbow hex color picker for bar ${index + 1}`}
                  />
                </div>
                <input
                  className="account-input"
                  type="text"
                  value={color}
                  onChange={(e) => handleColorChange(index, e.target.value)}
                  placeholder="#RRGGBB"
                />
              </label>
            ))}
            <button className="account-save-btn" type="submit">Save Colors</button>
          </form>
          <div className="account-bars-preview">
            <p className="account-preview-label">Saved Color Preview</p>
            <div className="account-bars-canvas">
              <Bars key={previewInstance} colors={savedBarColors} />
            </div>
          </div>
          {saveMessage && <p className="account-success">{saveMessage}</p>}
          {saveError && <p className="account-error">{saveError}</p>}
        </section>
      </div>
      {hoverPreview.isVisible && (
        <div
          className="color-hover-modal"
          style={{ left: hoverPreview.x, top: hoverPreview.y }}
        >
          <span
            className="color-hover-swatch"
            style={{ backgroundColor: hoverPreview.hex }}
          />
          <span className="color-hover-hex">{hoverPreview.hex}</span>
        </div>
      )}
    </main>
  );
}

export default AccountPage;
