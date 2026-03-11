import React, { useState, useEffect } from 'react';
const barSpeeds = [.5, 1, 2, 4, 8, 16, 32];
const defaultColors = ['#FF0000', '#FFA500', '#FFFF00', '#008000', '#0000FF', '#4B0082', '#EE82EE'];
const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{6})$/;
const CURRENT_USER_CHANGE_EVENT = 'currentuserchange';
const API_BASE =
  process.env.REACT_APP_API_BASE ||
  (window.location.port === '3000' ? 'http://localhost:3002' : window.location.origin);

interface BarsProps {
  colors?: string[];
  currentUserEmail?: string;
  interactive?: boolean;
}

function getStoredCurrentUserEmail(): string {
  const currentUserRaw = localStorage.getItem('currentUser');
  if (!currentUserRaw) {
    return '';
  }

  try {
    const currentUser = JSON.parse(currentUserRaw) as { email?: string };
    return currentUser.email?.trim().toLowerCase() || '';
  } catch (error) {
    return '';
  }
}

function Bars({ colors: providedColors, currentUserEmail = '', interactive = false }: BarsProps) {
    const barHeight = 100/ barSpeeds.length;
    const [isFilled, setIsFilled] = useState(false);
    const [resolvedColors, setResolvedColors] = useState(defaultColors);
    const [activeUserEmail, setActiveUserEmail] = useState(
      currentUserEmail.trim().toLowerCase() || getStoredCurrentUserEmail()
    );
    const [completedBars, setCompletedBars] = useState<boolean[]>(() =>
      barSpeeds.map(() => false)
    );
    const [pointerOffset, setPointerOffset] = useState(0);
    const [isPointerActive, setIsPointerActive] = useState(false);
    const [activeLaneIndex, setActiveLaneIndex] = useState<number | null>(null);
    const [animationCycle, setAnimationCycle] = useState(0);

    useEffect(() => {
        setIsFilled(false);
        const timer = setTimeout(() => {
          setIsFilled(true);
        }, 100);
    
        return () => clearTimeout(timer);
      }, [animationCycle]);

    useEffect(() => {
      if (!interactive || !isFilled) {
        setCompletedBars(barSpeeds.map(() => false));
        setPointerOffset(0);
        setActiveLaneIndex(null);
        return;
      }

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

    useEffect(() => {
      setActiveUserEmail(currentUserEmail.trim().toLowerCase() || getStoredCurrentUserEmail());
    }, [currentUserEmail]);

    useEffect(() => {
      const syncActiveUser = () => {
        setActiveUserEmail(getStoredCurrentUserEmail());
      };

      window.addEventListener('storage', syncActiveUser);
      window.addEventListener(CURRENT_USER_CHANGE_EVENT, syncActiveUser);

      return () => {
        window.removeEventListener('storage', syncActiveUser);
        window.removeEventListener(CURRENT_USER_CHANGE_EVENT, syncActiveUser);
      };
    }, []);

    useEffect(() => {
      const hasValidProvidedColors =
        Array.isArray(providedColors) &&
        providedColors.length === barSpeeds.length &&
        providedColors.every((color) => typeof color === 'string' && HEX_COLOR_REGEX.test(color));

      if (hasValidProvidedColors) {
        setResolvedColors(providedColors);
        return;
      }

      const isLoggedIn = Boolean(localStorage.getItem('currentUser'));
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
    }, [activeUserEmail, providedColors]);

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
                  completedBars[index] && isPointerActive && activeLaneIndex === index
                    ? 'mouse-reactive'
                    : ''
                }`}
                style={{
                transitionDuration:
                  completedBars[index] && isPointerActive && activeLaneIndex === index
                    ? `${Math.max(0.08, speed * 0.12)}s, ${Math.max(0.08, speed * 0.12)}s`
                    : `${speed}s, ${speed}s`,
                height: `${barHeight}%`, // Set height as percentage of parent
                backgroundColor: resolvedColors[index % resolvedColors.length],
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
