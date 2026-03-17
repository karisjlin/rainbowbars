import React, { useEffect, useState } from 'react';
import '../CSS/account.css';
import Bars from '../components/Bars';

// Minimal user shape read directly from localStorage on this page.
interface CurrentUser {
  name: string;
  email: string;
}

// Number of bars — must match barSpeeds.length in Bars.tsx.
const BAR_COUNT = 7;

// Validates that a string is a 6-digit hex color like #A1B2C3.
const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{6})$/;

// Rainbow default palette used before the user has saved custom colors.
const DEFAULT_COLORS = ['#FF0000', '#FFA500', '#FFFF00', '#008000', '#0000FF', '#4B0082', '#EE82EE'];

// Resolve the backend URL: env variable > dev port detection > same origin.
const API_BASE =
  process.env.REACT_APP_API_BASE ||
  (window.location.port === '3000' ? 'http://localhost:3002' : window.location.origin);

// State for the floating color-preview tooltip shown while hovering the rainbow picker.
interface HoverPreviewState {
  isVisible: boolean;
  x: number;       // Viewport X position (offset slightly so it doesn't cover the cursor).
  y: number;       // Viewport Y position.
  hex: string;     // Hex color under the cursor.
}

// Reads and validates saved bar colors from localStorage for the given key.
// Returns null if nothing is stored, the value is malformed, or the count is wrong.
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

// Converts HSL values to a 6-digit uppercase hex color string.
// Used to map a cursor's X position on the rainbow picker to a color.
function hslToHex(hue: number, saturation: number, lightness: number): string {
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const huePrime = hue / 60;
  const x = chroma * (1 - Math.abs((huePrime % 2) - 1));

  let r = 0;
  let g = 0;
  let b = 0;

  // Map hue sector (0–5) to RGB component values.
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

  // Add the lightness adjustment and convert each channel to a 2-digit hex string.
  const m = l - chroma / 2;
  const toHex = (channel: number) =>
    Math.round((channel + m) * 255)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Page where logged-in users can customize their bar colors.
// Shows account details, a color editor with rainbow pickers and hex inputs,
// and a live preview of the saved palette.
function AccountPage() {
  // Working copy of colors — updated as the user edits without saving.
  const [barColors, setBarColors] = useState<string[]>(DEFAULT_COLORS);

  // Last-saved colors — used for the preview so it only updates on save.
  const [savedBarColors, setSavedBarColors] = useState<string[]>(DEFAULT_COLORS);

  // Incrementing key that forces the preview Bars component to remount after each save.
  const [previewInstance, setPreviewInstance] = useState(0);

  // Success message shown after a successful save.
  const [saveMessage, setSaveMessage] = useState('');

  // Error message shown after a failed save or load.
  const [saveError, setSaveError] = useState('');

  // State for the floating tooltip shown when hovering the rainbow color picker.
  const [hoverPreview, setHoverPreview] = useState<HoverPreviewState>({
    isVisible: false,
    x: 0,
    y: 0,
    hex: '#FF0000',
  });

  // Read the current user from localStorage (written by AuthContext on login).
  const currentUserRaw = localStorage.getItem('currentUser');
  const currentUser = currentUserRaw ? (JSON.parse(currentUserRaw) as CurrentUser) : null;

  // Per-user localStorage key for bar colors, e.g. "barColors:user@example.com".
  const accountStorageKey = currentUser?.email
    ? `barColors:${currentUser.email.trim().toLowerCase()}`
    : '';

  // On mount (or when the user changes), load colors from localStorage first for a
  // fast render, then fetch from the server to get the authoritative saved values.
  useEffect(() => {
    if (!currentUser?.email) {
      return;
    }

    // Apply localStorage colors immediately so the UI isn't blank while the fetch runs.
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
          // Server colors are authoritative — update state and refresh localStorage cache.
          setBarColors(data.colors);
          setSavedBarColors(data.colors);
          setPreviewInstance((current) => current + 1);
          if (accountStorageKey) {
            localStorage.setItem(accountStorageKey, JSON.stringify(data.colors));
          }
        } else if (!storedColors) {
          // No server colors and no local cache — fall back to defaults.
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

  // Updates a single bar's color in the working copy.
  const handleColorChange = (index: number, value: string) => {
    setSaveMessage('');
    setSaveError('');

    const next = [...barColors];
    next[index] = value;
    setBarColors(next);
  };

  // Validates all colors, then POSTs them to the server.
  // On success, updates savedBarColors and refreshes localStorage.
  const handleSaveColors = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMessage('');
    setSaveError('');

    // Normalize hex to uppercase before validation and submission.
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

      // Update both the working copy and the saved copy with what the server echoes back.
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

  // Converts a mouse event on the rainbow picker div to a hex color,
  // mapping the horizontal cursor position (0–100%) to a full-saturation hue.
  const getHexFromPickerEvent = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
    const hue = (relativeX / rect.width) * 360;
    return hslToHex(hue, 100, 50);
  };

  // Updates the hover tooltip position and color as the cursor moves over the picker.
  const handlePickerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const hex = getHexFromPickerEvent(e);

    setHoverPreview({
      isVisible: true,
      // Offset so the tooltip appears just below and to the right of the cursor.
      x: e.clientX + 16,
      y: e.clientY + 16,
      hex,
    });
  };

  // Hides the hover tooltip when the cursor leaves the picker area.
  const handlePickerLeave = () => {
    setHoverPreview((previous) => ({ ...previous, isVisible: false }));
  };

  // Applies the hovered color to the bar when the user clicks the picker.
  const handlePickerSelect = (index: number, e: React.MouseEvent<HTMLDivElement>) => {
    const hex = getHexFromPickerEvent(e);
    handleColorChange(index, hex);
  };

  // Guard: show a placeholder if no user is logged in.
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
        {/* Account details card — displays name and email */}
        <section className="account-card account-details-card">
          <h1>Account</h1>
          <div className="account-details-list">
            <p><strong>Name:</strong> {currentUser.name}</p>
            <p><strong>Email:</strong> {currentUser.email}</p>
          </div>
        </section>

        {/* Color editor card — one row per bar with picker, swatch, and hex input */}
        <section className="account-card account-colors-card">
          <h2>Bar Colors</h2>
          <form className="account-form" onSubmit={handleSaveColors}>
            {barColors.map((color, index) => (
              <label key={index} className="account-label">
                <span className="account-label-row">
                  <span>{`Bar ${index + 1}`}</span>
                  {/* Color swatch showing the currently selected color for this bar */}
                  <span
                    className="account-saved-color"
                    style={{ backgroundColor: barColors[index] }}
                    aria-label={`Selected color for bar ${index + 1}: ${barColors[index]}`}
                    title={`Selected color: ${barColors[index]}`}
                  />
                </span>
                <div className="rainbow-picker-group">
                  <p className="rainbow-picker-label">Pick a color</p>
                  {/* Gradient rainbow strip — hover to preview, click to select */}
                  <div
                    className="rainbow-picker"
                    onMouseMove={handlePickerMove}
                    onMouseLeave={handlePickerLeave}
                    onClick={(e) => handlePickerSelect(index, e)}
                    aria-label={`Rainbow hex color picker for bar ${index + 1}`}
                  />
                </div>
                {/* Direct hex input for typing a color manually */}
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

          {/* Live preview of the last-saved palette using the Bars component */}
          <div className="account-bars-preview">
            <p className="account-preview-label">Saved Color Preview</p>
            <div className="account-bars-canvas">
              {/* key={previewInstance} forces remount so bars re-animate after each save */}
              <Bars key={previewInstance} colors={savedBarColors} />
            </div>
          </div>
          {saveMessage && <p className="account-success">{saveMessage}</p>}
          {saveError && <p className="account-error">{saveError}</p>}
        </section>
      </div>

      {/* Floating tooltip that follows the cursor over the rainbow picker */}
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
