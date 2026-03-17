import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// CSS transition durations (in seconds) for each bar — slower bars take longer to fill.
const barSpeeds = [.5, 1, 2, 4, 8, 16, 32];

// Rainbow default palette used when no user colors are saved.
const defaultColors = ['#FF0000', '#FFA500', '#FFFF00', '#008000', '#0000FF', '#4B0082', '#EE82EE'];

// Validates that a string is a 6-digit hex color like #A1B2C3.
const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{6})$/;

// Resolve the backend URL: env variable > dev port detection > same origin.
const API_BASE =
  process.env.REACT_APP_API_BASE ||
  (window.location.port === '3000' ? 'http://localhost:3002' : window.location.origin);

interface BarsProps {
  // Optional explicit color list; overrides user-saved and default colors.
  colors?: string[];
  // When true, bars react to mouse movement and restart on mouse leave.
  interactive?: boolean;
}

// Renders a stack of animated horizontal bars.
// Each bar fills at its own speed; in interactive mode the active bar tracks the cursor.
function Bars({ colors: providedColors, interactive = false }: BarsProps) {
    // Each bar takes up an equal share of the container height.
    const barHeight = 100/ barSpeeds.length;

    // isFilled drives the CSS fill animation — briefly set to false to restart it.
    const [isFilled, setIsFilled] = useState(false);

    // The actual colors rendered, resolved from props > localStorage > defaults.
    const [resolvedColors, setResolvedColors] = useState(defaultColors);

    // Tracks which bars have finished their initial fill animation.
    const [completedBars, setCompletedBars] = useState<boolean[]>(() =>
      barSpeeds.map(() => false)
    );

    // Horizontal cursor position (0–1) used to size the active bar while mouse is over it.
    const [pointerOffset, setPointerOffset] = useState(0);

    // True while the mouse is inside the bars container.
    const [isPointerActive, setIsPointerActive] = useState(false);

    // Index of the bar lane the cursor is currently hovering over.
    const [activeLaneIndex, setActiveLaneIndex] = useState<number | null>(null);

    // Incremented on mouse-leave to trigger a fresh fill animation cycle.
    const [animationCycle, setAnimationCycle] = useState(0);

    const { currentUser, isLoggedIn } = useAuth();
    const activeUserEmail = currentUser?.email?.trim().toLowerCase() || '';

    // Restart the fill animation at the start of each cycle:
    // reset isFilled immediately, then set it back after a short delay so
    // CSS transitions re-trigger from zero width.
    useEffect(() => {
        setIsFilled(false);
        const timer = setTimeout(() => {
          setIsFilled(true);
        }, 100);

        return () => clearTimeout(timer);
      }, [animationCycle]);

    // After the fill animation begins, schedule per-bar timers so each bar marks
    // itself as "completed" once its fill transition finishes.
    // Only runs in interactive mode; resets state when not interactive or not yet filled.
    useEffect(() => {
      if (!interactive || !isFilled) {
        setCompletedBars(barSpeeds.map(() => false));
        setPointerOffset(0);
        setActiveLaneIndex(null);
        return;
      }

      // Each timer fires after `speed` seconds — matching the bar's CSS transition duration.
      const timers = barSpeeds.map((speed, index) =>
        window.setTimeout(() => {
          setCompletedBars((previous) =>
            previous.map((isComplete, timerIndex) =>
              timerIndex === index ? true : isComplete
            )
          );
        }, speed * 1000)
      );

      return () => {
        timers.forEach((timer) => window.clearTimeout(timer));
      };
    }, [animationCycle, interactive, isFilled]);

    // Resolve which colors to display, in priority order:
    // 1. Valid colors passed directly as props
    // 2. Colors saved to localStorage for the current user
    // 3. Colors fetched from the server (also cached to localStorage)
    // 4. Default rainbow palette
    useEffect(() => {
      const hasValidProvidedColors =
        Array.isArray(providedColors) &&
        providedColors.length === barSpeeds.length &&
        providedColors.every((color) => typeof color === 'string' && HEX_COLOR_REGEX.test(color));

      if (hasValidProvidedColors) {
        setResolvedColors(providedColors);
        return;
      }

      if (!isLoggedIn) {
        setResolvedColors(defaultColors);
        return;
      }

      const accountEmail = activeUserEmail;
      if (!accountEmail) {
        setResolvedColors(defaultColors);
        return;
      }

      const accountStorageKey = `barColors:${accountEmail}`;
      const savedColorsRaw = localStorage.getItem(accountStorageKey);
      if (!savedColorsRaw) {
        setResolvedColors(defaultColors);
      }

      // Apply localStorage colors immediately for a fast initial render.
      if (savedColorsRaw) {
        try {
          const savedColors = JSON.parse(savedColorsRaw) as string[];
          const validSavedColors =
            Array.isArray(savedColors) &&
            savedColors.length === barSpeeds.length &&
            savedColors.every((color) => typeof color === 'string' && HEX_COLOR_REGEX.test(color));

          if (validSavedColors) {
            setResolvedColors(savedColors);
          } else {
            setResolvedColors(defaultColors);
          }
        } catch (error) {
          // Ignore malformed local storage and keep defaults.
          setResolvedColors(defaultColors);
        }
      }

      // Then fetch the authoritative colors from the server and update if valid.
      // Also refreshes localStorage so the next load is instant.
      const syncColorsFromServer = async () => {
        try {
          const response = await fetch(
            `${API_BASE}/api/account/colors/${encodeURIComponent(accountEmail)}`
          );
          const data = await response.json();
          const hasValidAccountColors =
            response.ok &&
            Array.isArray(data.colors) &&
            data.colors.length === barSpeeds.length &&
            data.colors.every((color: unknown) => typeof color === 'string' && HEX_COLOR_REGEX.test(color));

          if (hasValidAccountColors) {
            setResolvedColors(data.colors);
            localStorage.setItem(accountStorageKey, JSON.stringify(data.colors));
          }
        } catch (error) {
          // Keep local/default colors if server fetch fails.
        }
      };

      syncColorsFromServer();
    }, [activeUserEmail, isLoggedIn, providedColors]);

    // Track cursor position within the bars container.
    // Determines which lane (bar row) is active and how far across the bar the cursor is.
    const handlePointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!interactive) {
        return;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const relativeX = (e.clientX - rect.left) / rect.width;
      const relativeY = (e.clientY - rect.top) / rect.height;
      const nextLaneIndex = Math.min(
        barSpeeds.length - 1,
        Math.max(0, Math.floor(relativeY * barSpeeds.length))
      );
      setIsPointerActive(true);
      setPointerOffset(Math.min(Math.max(relativeX, 0), 1));
      setActiveLaneIndex(nextLaneIndex);
    };

    // When the mouse leaves, reset pointer state and increment the animation cycle
    // so the bars restart their fill animation from scratch.
    const handlePointerLeave = () => {
      setIsPointerActive(false);
      setPointerOffset(0);
      setActiveLaneIndex(null);
      setAnimationCycle((current) => current + 1);
    };

    return (
        <div
          className={`bars-stage ${interactive ? 'bars-stage-interactive' : ''}`}
          onMouseMove={handlePointerMove}
          onMouseLeave={handlePointerLeave}
        >
            {barSpeeds.map((speed, index) => (
            <div
                key={index}
                className={`horizontal-bar ${isFilled ? 'filled' : ''} ${
                  // Add mouse-reactive class only for the bar that has finished filling
                  // and is currently under the cursor.
                  completedBars[index] && isPointerActive && activeLaneIndex === index
                    ? 'mouse-reactive'
                    : ''
                }`}
                style={{
                // Mouse-reactive bars use a much faster transition so they snap to the cursor;
                // all other bars use their natural fill speed.
                transitionDuration:
                  completedBars[index] && isPointerActive && activeLaneIndex === index
                    ? `${Math.max(0.08, speed * 0.12)}s, ${Math.max(0.08, speed * 0.12)}s`
                    : `${speed}s, ${speed}s`,
                height: `${barHeight}%`, // Each bar takes an equal slice of the container height.
                backgroundColor: resolvedColors[index % resolvedColors.length],
                // Width: tracks cursor when mouse-reactive, fills to 100% normally, or 0% when reset.
                width:
                  completedBars[index] && isPointerActive && activeLaneIndex === index
                    ? `${pointerOffset * 100}%`
                    : isFilled
                      ? '100%'
                      : '0%',
                marginLeft: '0%',
                }}
            ></div>
            ))}
        </div>
    );
}

export default Bars;
