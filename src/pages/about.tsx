import React from 'react';
import '../CSS/about.css';

// Each character of the "Rainbow Bars" heading paired with its rainbow color class.
// Wrapping each character in its own <span> allows individual color styling.
const rainbowTitle = [
  { char: 'R', colorClass: 'rainbow-red' },
  { char: 'a', colorClass: 'rainbow-orange' },
  { char: 'i', colorClass: 'rainbow-yellow' },
  { char: 'n', colorClass: 'rainbow-green' },
  { char: 'b', colorClass: 'rainbow-blue' },
  { char: 'o', colorClass: 'rainbow-indigo' },
  { char: 'w', colorClass: 'rainbow-violet' },
  { char: ' ', colorClass: 'rainbow-space' },
  { char: 'B', colorClass: 'rainbow-red' },
  { char: 'a', colorClass: 'rainbow-orange' },
  { char: 'r', colorClass: 'rainbow-yellow' },
  { char: 's', colorClass: 'rainbow-green' },
];

// Static informational page describing what the app does and how it works.
function AboutPage() {
  return (
    <main className="about-page">
      <section className="about-card">
        <p className="about-eyebrow">About</p>

        {/* Render the title letter-by-letter so each character gets its own color. */}
        <h1 className="about-title" aria-label="Rainbow Bars">
          {rainbowTitle.map(({ char, colorClass }, index) => (
            <span key={`${char}-${index}`} className={colorClass}>
              {char}
            </span>
          ))}
        </h1>

        <p className="about-lead">
          This project animates layered color bars and lets each signed-in user save a
          personalized palette to their account.
        </p>
        <div className="about-section">
          <h2>What You Can Do</h2>
          <p>
            Create an account, sign in, edit each bar color with a picker or hex code, and
            save the result so the animation reflects your stored theme the next time you log in.
          </p>
        </div>
        <div className="about-section">
          <h2>How It Works</h2>
          <p>
            The frontend renders the animated bars, while the account page syncs saved colors
            with the backend and local storage for fast reloads.
          </p>
        </div>
      </section>
    </main>
  );
}

export default AboutPage;
