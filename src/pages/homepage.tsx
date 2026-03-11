import React from 'react';
import Bars from '../components/Bars';
import '../CSS/homepage.css';

interface HomePageProps {
  barsKey: string;
  currentUserEmail: string;
}

function HomePage({ barsKey, currentUserEmail }: HomePageProps) {
  return (
    <main className="homepage">
      <section className="homepage-stage">
        <Bars key={barsKey} currentUserEmail={currentUserEmail} interactive />
      </section>
    </main>
  );
}

export default HomePage;
