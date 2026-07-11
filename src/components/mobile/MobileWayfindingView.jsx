import React from 'react';
import { getIconForInstruction } from '../wayfinding/StepByStepGuide.jsx';

// Note: These strings are mobile-UI-specific microcopy for the route summary.
// They explain the high-level adaptation to the user and don't exist natively in profileEngine.js.
const PROFILE_NOTES = {
  standard: 'Standard profile — fastest available route.',
  mobility: 'Mobility profile — route adapted to step-free elevators & ramps only.',
  vision: 'Vision profile — high-contrast text and tap-to-hear audio directions enabled.',
  hearing: 'Hearing profile — visual and text-based alerts only, no audio dependency.',
  cognitive: 'Cognitive / Sensory profile — simplified language and quieter route preferred.',
};

export default function MobileWayfindingView({
  activeView,
  currentLocation,
  setCurrentLocation,
  destination,
  setDestination,
  renderLocationOptions,
  activeRoute,
  profileId,
  speakStep
}) {
  return (
    <section className={`view ${activeView === 'wayfinding' ? 'active' : ''}`}>
      <div className="view-header">
        <h2>Wayfinding</h2>
        <p>Step-by-step, profile-adapted directions to any stadium location.</p>
      </div>

      <div style={{ margin: '16px 20px 0' }} className="card">
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="field-group">
            <span className="field-label">Starting point</span>
            <div className="select-row">
              <span className="material-symbols-outlined">my_location</span>
              <select value={currentLocation} onChange={e => setCurrentLocation(e.target.value)}>
                <option value="" disabled>Select start...</option>
                {renderLocationOptions()}
              </select>
            </div>
          </div>
          <div className="field-group">
            <span className="field-label">Destination</span>
            <div className="select-row">
              <span className="material-symbols-outlined" style={{ color: 'var(--color-error)' }}>location_on</span>
              <select value={destination || ''} onChange={e => setDestination(e.target.value)}>
                <option value="" disabled>Select destination...</option>
                {renderLocationOptions()}
              </select>
            </div>
          </div>
        </div>
      </div>

      {activeRoute && (
        <>
          <div className="route-summary card">
            <h3><span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '19px' }}>route</span> Route summary</h3>
            <div className="route-stats">
              <div className="route-stat"><div className="num">{activeRoute.totalDistance}</div><div className="lbl">Distance</div></div>
              <div className="route-stat"><div className="num">{activeRoute.estimatedMinutes} <span style={{ fontSize: '12px', fontWeight: '600' }}>min</span></div><div className="lbl">Est. time</div></div>
            </div>
            <div className="profile-note">
              <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>info</span>
              <span>{PROFILE_NOTES[profileId]}</span>
            </div>
          </div>

          <div className="steps card">
            <h3>Step-by-step guide</h3>
            <div>
              {activeRoute.steps.map((step, idx) => {
                const icon = getIconForInstruction(step.instruction);
                return (
                  <div key={idx} className="step">
                    <div className="step-dot"><span className="material-symbols-outlined" style={{ fontSize: '17px' }}>{icon}</span></div>
                    <div className="step-body">
                      <h4>{step.instruction}</h4>
                      <p><span className="material-symbols-outlined" style={{ fontSize: '13px' }}>straighten</span> {step.distance} m{step.stepFree ? ' • Step-free' : ''}</p>
                    </div>
                    {profileId === 'vision' && (
                      <div className="step-audio" onClick={() => speakStep(step.instruction)}>
                        <span className="material-symbols-outlined">volume_up</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
