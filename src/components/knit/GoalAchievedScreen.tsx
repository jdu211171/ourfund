import { Share2, Sparkles, Trophy } from 'lucide-react'
import { formatUsdAsCurrency } from '@/lib/currency'
import { useAppNavigation } from '@/lib/navigation'
import { GoalIcon, normalizeGoalIconName } from './goalIconOptions'
import { PhoneFrame } from './PhoneFrame'

export function GoalAchievedScreen() {
  const { navigate, currency, goals, selectedGoalId } = useAppNavigation()
  const goal = goals.find(g => g.id === selectedGoalId) ?? goals[0]
  const confetti = 'abcdefghijklmn'.split('')
  const palette = [
    'oklch(0.75 0.18 85)',
    'oklch(0.65 0.22 265)',
    'oklch(0.7 0.2 150)',
    'oklch(0.7 0.22 25)',
    'oklch(0.75 0.18 320)'
  ]

  if (!goal) {
    return (
      <PhoneFrame>
        <div className="flex h-full flex-col px-7 pt-12 pb-7">
          <button
            onClick={() => navigate('new_goal')}
            className="m-auto rounded-3xl bg-white px-5 py-6 text-center shadow-[var(--shadow-soft)]"
          >
            <p className="text-[14px] font-bold text-foreground">No completed goal yet</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Create a goal and fund it to celebrate here.
            </p>
          </button>
        </div>
      </PhoneFrame>
    )
  }

  const goalIconName = normalizeGoalIconName(goal.icon)

  return (
    <PhoneFrame>
      <div
        className="relative flex h-full flex-col items-center px-7 pt-12 pb-7 text-white overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, oklch(0.35 0.18 265) 0%, oklch(0.22 0.1 265) 100%)'
        }}
      >
        <style>{`
          @keyframes confetti-fall {
            0% {
              transform: translateY(-40px) translateX(0) rotate(var(--rot));
              opacity: 0;
            }
            10% { opacity: 0.85; }
            90% { opacity: 0.85; }
            100% {
              transform: translateY(480px) translateX(var(--drift)) rotate(calc(var(--rot) + 220deg));
              opacity: 0;
            }
          }
        `}</style>

        {confetti.map((piece, i) => {
          const rot = (i * 47) % 360
          const drift = ((i * 29) % 60) - 30
          const duration = 2.6 + (i % 5) * 0.5
          const delay = (i % 7) * 0.25

          return (
            <span
              key={piece}
              className="absolute rounded-[2px]"
              style={{
                width: 6 + (i % 3) * 2,
                height: 10 + (i % 4) * 2,
                top: `${8 + ((i * 37) % 20)}%`,
                left: `${(i * 53) % 90}%`,
                background: palette[i % palette.length],
                '--rot': `${rot}deg`,
                '--drift': `${drift}px`,
                animation: `confetti-fall ${duration}s linear ${delay}s infinite`,
                opacity: 0
              } as React.CSSProperties}
            />
          )
        })}

        <div className="relative grid h-20 w-20 place-items-center rounded-3xl bg-white/10 backdrop-blur-sm shadow-[var(--shadow-tile)]">
          <GoalIcon name={goalIconName} className="h-9 w-9 text-[oklch(0.85_0.18_85)]" strokeWidth={2} />
          <div className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-[oklch(0.85_0.18_85)]">
            <Trophy className="h-3.5 w-3.5 text-[oklch(0.22_0.1_265)]" strokeWidth={2.5} />
          </div>
        </div>

        <p className="relative mt-6 text-[11px] font-bold uppercase tracking-widest text-white/70">
          Goal reached
        </p>
        <h2 className="relative mt-1 text-center font-display text-[28px] leading-tight tracking-tight">
          {goal.title}
          <br />
          fully funded!
        </h2>
        <p className="relative mt-2 text-center text-[12px] text-white/75 max-w-[240px]">
          You saved{' '}
          <span className="font-bold text-white">
            {formatUsdAsCurrency(goal.targetUsd, currency)}
          </span>
          . Time to use the funds.
        </p>

        <div className="relative mt-6 w-full rounded-3xl bg-white/10 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-[11px] text-white/70">
            <span>Target</span>
            <span>Saved</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="font-display text-[18px] font-bold">
              {formatUsdAsCurrency(goal.targetUsd, currency)}
            </span>
            <span className="font-display text-[18px] font-bold text-[oklch(0.85_0.2_150)]">
              {formatUsdAsCurrency(goal.savedUsd, currency)}
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
            <div className="h-full w-full rounded-full bg-[oklch(0.8_0.2_150)]" />
          </div>
        </div>

        <div className="relative mt-auto w-full space-y-2">
          <button
            onClick={() => navigate('goal_withdraw')}
            className="w-full rounded-full bg-white py-4 text-[15px] font-semibold text-[oklch(0.22_0.1_265)]"
          >
            Withdraw funds
          </button>
          <button
            onClick={() => navigate('family')}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-white/10 py-3 text-[13px] font-semibold text-white"
          >
            <Share2 className="h-4 w-4" strokeWidth={2.25} />
            Share with family
          </button>
        </div>
      </div>
    </PhoneFrame>
  )
}
