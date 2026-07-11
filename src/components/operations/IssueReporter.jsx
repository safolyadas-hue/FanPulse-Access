import { useState, useMemo, useEffect } from 'react'
import { useTickets } from '../../hooks/useTickets.js'
import stadiumData from '../../data/stadium.json'

const ISSUE_TYPES = [
  'Broken Elevator',
  'Blocked Ramp',
  'Medical Emergency',
  'Cleanliness/Spill',
  'Safety Concern',
  'Other'
]

export default function IssueReporter() {
  const { submitTicket } = useTickets()
  
  const locations = useMemo(() => {
    const locs = []
    if (stadiumData.sections) stadiumData.sections.forEach(s => locs.push(s.name))
    if (stadiumData.gates) stadiumData.gates.forEach(g => locs.push(g.name))
    if (stadiumData.restrooms) stadiumData.restrooms.forEach(r => locs.push(r.name))
    return locs.sort()
  }, [])

  const [location, setLocation] = useState(() => locations.length > 0 ? locations[0] : '')
  const [type, setType] = useState(ISSUE_TYPES[0])
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate network delay
    setTimeout(() => {
      submitTicket(location, type, description)
      setIsSubmitting(false)
      setShowSuccess(true)
      setDescription('') // Reset
      
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000)
    }, 800)
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 animate-in fade-in zoom-in-95 duration-300">
      <header className="flex flex-col gap-xs mb-lg z-10 relative">
        <h2 className="text-on-surface font-extrabold" style={{ fontSize: '36px', lineHeight: '1.1' }}>
          Report an Issue
        </h2>
        <p className="text-body-lg text-on-surface-variant max-w-2xl">
          Help us keep the stadium accessible for everyone. Report blockers, broken facilities, or hazards here.
        </p>
      </header>

      <div className="flex-1 overflow-y-auto pb-xl pr-2 custom-scrollbar">
        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-lg flex flex-col gap-lg">
          
          <div className="flex flex-col gap-sm">
            <label htmlFor="location" className="text-sm font-semibold text-on-surface">Location</label>
            <div className="bg-surface-container rounded-xl px-md py-sm border border-white/10 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">pin_drop</span>
              <select 
                id="location"
                value={location} 
                onChange={(e) => setLocation(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-on-surface w-full appearance-none cursor-pointer"
                required
              >
                {locations.map(loc => (
                  <option key={loc} value={loc} className="bg-surface text-on-surface">
                    {loc}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined text-on-surface-variant pointer-events-none">arrow_drop_down</span>
            </div>
          </div>

          <div className="flex flex-col gap-sm">
            <label htmlFor="issueType" className="text-sm font-semibold text-on-surface">Issue Type</label>
            <div className="bg-surface-container rounded-xl px-md py-sm border border-white/10 flex items-center gap-3">
              <span className="material-symbols-outlined text-warning">warning</span>
              <select 
                id="issueType"
                value={type} 
                onChange={(e) => setType(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-on-surface w-full appearance-none cursor-pointer"
                required
              >
                {ISSUE_TYPES.map(t => (
                  <option key={t} value={t} className="bg-surface text-on-surface">
                    {t}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined text-on-surface-variant pointer-events-none">arrow_drop_down</span>
            </div>
          </div>

          <div className="flex flex-col gap-sm">
            <label htmlFor="description" className="text-sm font-semibold text-on-surface">Description</label>
            <div className="bg-surface-container rounded-xl p-sm border border-white/10 focus-within:border-primary transition-colors">
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe the issue..."
                rows="4"
                className="w-full bg-transparent border-none focus:outline-none text-on-surface resize-none p-2 placeholder:text-on-surface-variant/50"
                required
              ></textarea>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-on-primary font-bold py-md rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 cursor-pointer min-h-[56px]"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">send</span>
                Submit Report
              </>
            )}
          </button>
        </form>

        {showSuccess && (
          <div className="mt-md animate-in slide-in-from-bottom-2 duration-300">
            <div className="bg-green-900/50 border border-green-500/50 text-green-100 p-md rounded-xl flex items-center gap-4 shadow-xl">
              <span className="material-symbols-outlined text-green-400">check_circle</span>
              <div>
                <h4 className="font-bold">Thank You!</h4>
                <p className="text-sm text-green-200">Your report has been sent to stadium operations. Thanks for keeping FanPulse Access safe and accessible for everyone.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
