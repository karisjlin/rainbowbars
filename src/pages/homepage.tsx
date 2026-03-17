import React from 'react';
import Bars from '../components/Bars';
import '../CSS/homepage.css';

interface HomePageProps {
  // Key used to force a full remount of Bars when the user logs in/out,
  // ensuring colors and animation state are reset for the new auth state.
  barsKey: string;
}

// The main landing page — renders the full-screen interactive Bars animation.
function HomePage({ barsKey }: HomePageProps) {
  return (
    <main className="homepage">
      <section className="homepage-stage">
        {/* Pass barsKey as React's key so the component remounts on auth change */}
        <Bars key={barsKey} interactive />
      </section>
    </main>
  );
}

export default HomePage;
