export default function RouteOverview({ route }) {
  if (!route) return null

  // If we have warnings but no routeId, it means a route couldn't be found
  if (!route.routeId && route.warnings.length > 0) {
    return (
      <div className="glass-card rounded-2xl p-md bg-error-container/20 border-error/30 mt-4">
        <h4 className="text-error font-bold flex items-center gap-2 mb-sm">
          <span className="material-symbols-outlined">error</span>
          Route Unavailable
        </h4>
        <ul className="list-disc list-inside text-sm text-error/90 space-y-1">
          {route.warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-2xl p-lg bg-primary/5 border-primary/20 mt-4">
      <h3 className="text-lg font-bold text-on-surface mb-md flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">route</span>
        Route Summary
      </h3>
      
      <div className="grid grid-cols-2 gap-md mb-md">
        <div className="bg-surface-container rounded-xl p-sm text-center border border-white/5">
          <div className="text-on-surface-variant text-xs font-semibold mb-1 uppercase tracking-wider">Distance</div>
          <div className="text-2xl font-bold text-primary">{route.totalDistance}</div>
        </div>
        <div className="bg-surface-container rounded-xl p-sm text-center border border-white/5">
          <div className="text-on-surface-variant text-xs font-semibold mb-1 uppercase tracking-wider">Est. Time</div>
          <div className="text-2xl font-bold text-primary">{route.estimatedMinutes} <span className="text-sm font-normal">min</span></div>
        </div>
      </div>

      {route.warnings && route.warnings.length > 0 && (
        <div className="mt-md space-y-2">
          {route.warnings.map((warning, idx) => (
            <div key={idx} className="flex gap-2 items-start text-sm bg-warning-container/20 text-warning px-sm py-xs rounded-lg">
              <span className="material-symbols-outlined shrink-0" style={{ fontSize: '18px' }}>warning</span>
              <p>{warning}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
