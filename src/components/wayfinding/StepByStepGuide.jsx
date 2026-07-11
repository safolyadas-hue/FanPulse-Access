import { useProfile } from '../../hooks/useProfile.js'
import { useSpeech } from '../../hooks/useSpeech.js'

export function getIconForInstruction(instruction = '') {
  const lower = instruction.toLowerCase()
  if (lower.includes('elevator')) return 'elevator'
  if (lower.includes('ramp')) return 'accessible_forward'
  if (lower.includes('left')) return 'turn_left'
  if (lower.includes('right')) return 'turn_right'
  if (lower.includes('straight')) return 'straight'
  if (lower.includes('arrive') || lower.includes('destination')) return 'flag'
  return 'directions_walk'
}


function simplifyInstruction(instruction) {
  // A naive simplification for Cognitive profile demo purposes
  // E.g., "Proceed straight down the concourse for 50 meters, then turn left at the concession stand." -> "Go straight. Turn left at food."
  return instruction
    .replace(/Proceed straight down the concourse for \d+ meters, then/i, 'Go straight.')
    .replace(/at the concession stand/i, 'at the food.')
    .replace(/Take the/i, 'Use')
    .replace(/Continue/i, 'Go')
}

export default function StepByStepGuide({ steps }) {
  const { profileId } = useProfile()
  const { speak } = useSpeech()

  if (!steps || steps.length === 0) return null

  const isCognitive = profileId === 'cognitive'
  const isVision = profileId === 'vision'

  return (
    <div className="glass-card rounded-2xl p-lg mt-4">
      <h3 className="text-lg font-bold text-on-surface mb-md">Step-by-Step Guide</h3>
      
      <div className="relative border-l-2 border-white/10 ml-4 space-y-6">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1
          const iconName = getIconForInstruction(step.instruction)
          const textToDisplay = isCognitive ? simplifyInstruction(step.instruction) : step.instruction

          return (
            <div key={index} className="relative pl-6">
              {/* Timeline dot */}
              <div className="absolute -left-[17px] top-1 w-8 h-8 rounded-full bg-surface-container border border-white/20 flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>
                  {iconName}
                </span>
              </div>
              
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className={[
                    'font-medium text-on-surface',
                    isVision ? 'text-xl tracking-wide' : 'text-base'
                  ].join(' ')}>
                    {textToDisplay}
                  </h4>
                  <p className="text-sm text-on-surface-variant mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>straighten</span>
                    {step.distance} {step.stepFree ? '• Step-free' : ''}
                  </p>
                </div>

                {isVision && (
                  <button 
                    onClick={() => speak(textToDisplay)}
                    className="w-10 h-10 shrink-0 rounded-full bg-primary/20 hover:bg-primary/40 text-primary border border-primary/30 flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Read step aloud"
                  >
                    <span className="material-symbols-outlined">volume_up</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
