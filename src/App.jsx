import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import './App.css';
import { calculateFlamesTimeline } from './FlamesLogic';

const HeartIcon = () => (
  <span className="heart-icon" style={{
    fontSize: '52px',
    lineHeight: '52px',
    filter: 'drop-shadow(0 4px 8px rgba(255, 42, 85, 0.4))',
    display: 'inline-block',
    transform: 'translate(-10px, 16px)'
  }}>💘</span>
);

const MaleIcon = () => (
  <svg className="gender-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="14" r="5" />
    <path d="M13.5 10.5L21 3" />
    <path d="M16 3h5v5" />
  </svg>
);

const FemaleIcon = () => (
  <svg className="gender-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="10" r="5" />
    <path d="M12 15v8" />
    <path d="M9 19h6" />
  </svg>
);

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function App() {
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');

  // Animation state
  const [timelineData, setTimelineData] = useState(null);
  const [struck1, setStruck1] = useState([]);
  const [struck2, setStruck2] = useState([]);
  const [showFlames, setShowFlames] = useState(false);
  const [underscoreIdx, setUnderscoreIdx] = useState(-1);
  const [eliminated, setEliminated] = useState([]);
  const [finalIdx, setFinalIdx] = useState(-1);
  const [showResult, setShowResult] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  const resultsRef = useRef(null);
  const letterRefs = useRef({}); // To calculate underscore position
  const skipRef = useRef(false);
  const [hasAutoMatched, setHasAutoMatched] = useState(false);

  useEffect(() => {
    if (hasAutoMatched) return;
    const params = new URLSearchParams(window.location.search);
    const n1 = params.get('n1');
    const n2 = params.get('n2');
    if (n1 && n2) {
      setName1(n1);
      setName2(n2);
      setHasAutoMatched(true);
      setTimeout(() => performMatch(n1, n2), 500);
    }
  }, [hasAutoMatched]);

  const handleMatchClick = () => {
    if (!name1.trim() || !name2.trim()) return;
    performMatch(name1, name2);
  };

  const handleSkip = () => {
    if (!isAnimating) return;
    skipRef.current = true;
  };

  const performMatch = async (n1, n2) => {
    // Reset state
    skipRef.current = false;
    setStruck1([]);
    setStruck2([]);
    setShowFlames(false);
    setUnderscoreIdx(-1);
    setEliminated([]);
    setFinalIdx(-1);
    setShowResult('');

    const data = calculateFlamesTimeline(n1, n2);
    setTimelineData(data);

    // Scroll to results using smooth behavior
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    setIsAnimating(true);

    const checkSkip = () => {
      if (skipRef.current) {
        setStruck1(data.strike1);
        setStruck2(data.strike2);
        setShowFlames(true);
        const allElim = data.eliminationSteps.map(step => step.eliminatedIndex);
        setEliminated(allElim);
        setUnderscoreIdx(-1);
        setFinalIdx(data.finalIndex);
        setShowResult(data.finalResult);
        setIsAnimating(false);
        return true;
      }
      return false;
    };

    if (checkSkip()) return;
    await wait(800);
    if (checkSkip()) return;

    // 1. Strike out common letters slowly
    for (let i = 0; i < data.strike1.length; i++) {
      setStruck1(prev => [...prev, data.strike1[i]]);
      setStruck2(prev => [...prev, data.strike2[i]]);
      if (checkSkip()) return;
      await wait(600);
      if (checkSkip()) return;
    }

    await wait(1000);
    if (checkSkip()) return;
    setShowFlames(true);
    await wait(600);
    if (checkSkip()) return;

    // 2. Play hopping and elimination
    for (let round of data.eliminationSteps) {
      for (let hopIdx of round.hops) {
        setUnderscoreIdx(hopIdx);
        await wait(400);
        if (checkSkip()) return;
      }
      setEliminated(prev => [...prev, round.eliminatedIndex]);
      setUnderscoreIdx(-1); // Hide underscore during elimination strike
      if (checkSkip()) return;
      await wait(800);
      if (checkSkip()) return;
    }

    // 3. Final Result
    setUnderscoreIdx(-1);
    await wait(500);
    if (checkSkip()) return;
    setFinalIdx(data.finalIndex);
    await wait(1200);
    if (checkSkip()) return;
    setShowResult(data.finalResult);
    setIsAnimating(false);
  };

  const getUnderscoreStyle = () => {
    if (underscoreIdx === -1 || !letterRefs.current[underscoreIdx]) {
      return { opacity: 0, width: 0, left: 0 };
    }
    const el = letterRefs.current[underscoreIdx];
    return {
      opacity: 1,
      width: el.offsetWidth,
      left: el.offsetLeft
    };
  };

  const flamesChars = ['F', 'L', 'A', 'M', 'E', 'S'];

  const handleShare = async () => {
    if (!resultsRef.current) return;

    const shareBtn = resultsRef.current.querySelector('.share-btn');
    if (shareBtn) shareBtn.style.display = 'none';

    try {
      const canvas = await html2canvas(resultsRef.current, {
        backgroundColor: '#e6005c',
        scale: 2,
      });

      if (shareBtn) shareBtn.style.display = 'block';

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'flamesify-result.png', { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: 'Flamesify Result',
              text: `${name1.toUpperCase()} & ${name2.toUpperCase()} are ${showResult}!`,
              files: [file]
            });
          } catch (err) { }
        } else {
          // Fallback to auto-downloading the image if native sharing isn't supported
          const link = document.createElement('a');
          link.download = 'flamesify-result.png';
          link.href = URL.createObjectURL(blob);
          link.click();
        }
      }, 'image/png');
    } catch (err) {
      if (shareBtn) shareBtn.style.display = 'block';
    }
  };

  return (
    <div className="app-container">
      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="logo-title title-font">Flamesify</h1>
        <p className="subtitle">Find out what your names say about your relationship!</p>

        <div className="input-container">
          <div className="input-group">
            <MaleIcon />
            <input
              type="text"
              className="name-input"
              placeholder="Male Name"
              value={name1}
              onChange={e => setName1(e.target.value)}
              disabled={isAnimating}
            />
          </div>

          <div className="heart-divider">
            <HeartIcon />
          </div>

          <div className="input-group">
            <FemaleIcon />
            <input
              type="text"
              className="name-input"
              placeholder="Female Name"
              value={name2}
              onChange={e => setName2(e.target.value)}
              disabled={isAnimating}
            />
          </div>
        </div>

        <button
          className="match-btn"
          onClick={handleMatchClick}
          disabled={isAnimating || !name1.trim() || !name2.trim()}
        >
          {isAnimating ? 'Calculating...' : 'Match'}
        </button>

        {!timelineData && (
          <div className="signature-badge">
            Developed by <span>Imteyaz Arif</span>
          </div>
        )}
      </section>

      {/* Results Section (Hidden until timelineData exists) */}
      {timelineData && (
        <section className="results-section" ref={resultsRef}>

          {isAnimating && (
            <button className="skip-btn" onClick={handleSkip}>
              Skip Animation &raquo;
            </button>
          )}

          <div className="names-comparison">
            <div className="name-letters">
              {timelineData.arr1.map((char, idx) => (
                <span
                  key={`n1-${idx}`}
                  className={`letter ${struck1.includes(idx) ? 'strikethrough' : ''}`}
                  style={{ width: char === ' ' ? '1rem' : 'auto' }}
                >
                  {char === ' ' ? '\u00A0' : char.toUpperCase()}
                </span>
              ))}
            </div>
            <div className="name-letters">
              {timelineData.arr2.map((char, idx) => (
                <span
                  key={`n2-${idx}`}
                  className={`letter ${struck2.includes(idx) ? 'strikethrough' : ''}`}
                  style={{ width: char === ' ' ? '1rem' : 'auto' }}
                >
                  {char === ' ' ? '\u00A0' : char.toUpperCase()}
                </span>
              ))}
            </div>
          </div>

          <div className="unique-count-tag" style={{ opacity: showFlames ? 1 : 0, transition: 'opacity 1s ease' }}>
            Unique Letters: <strong>{timelineData.remainingCount}</strong>
          </div>

          <div className="flames-wrapper" style={{ opacity: showFlames ? 1 : 0, transition: 'opacity 1s ease', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="flames-container">
              {flamesChars.map((char, idx) => {
                let classes = ['flames-letter'];
                if (eliminated.includes(idx)) classes.push('eliminated');
                if (finalIdx === idx) classes.push('final');
                if (underscoreIdx === idx) classes.push('active');

                return (
                  <span
                    key={idx}
                    className={classes.join(' ')}
                    ref={el => letterRefs.current[idx] = el}
                  >
                    {char}
                  </span>
                );
              })}
              {/* Dynamic Underscore */}
              <div className="underscore-indicator" style={getUnderscoreStyle()} />
            </div>

            {showResult && (
              <div className="final-result-container">
                <div className="final-result title-font">
                  {showResult}!
                </div>
                <button className="share-btn" onClick={handleShare}>
                  Share Result
                </button>
              </div>
            )}
          </div>

        </section>
      )}
    </div>
  );
}

export default App;