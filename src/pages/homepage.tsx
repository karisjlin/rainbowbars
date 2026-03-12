import React from 'react';
import Bars from '../components/Bars';
import '../CSS/homepage.css';

interface HomePageProps {
  barsKey: string;
}

function HomePage({ barsKey }: HomePageProps) {
  return (
    <main className="homepage">
      <section className="homepage-stage">
        <Bars key={barsKey} interactive />
      </section>
    </main>
  );
}

export default HomePage;
