import { ArrowLeft, Camera } from 'lucide-react'
import { useState } from 'react'
import { useAppNavigation } from '@/lib/navigation'
import { PhoneFrame } from './PhoneFrame'

export function EditProfileScreen() {
  const { navigate, goBack, profile, updateProfile } = useAppNavigation()
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [phone, setPhone] = useState(profile.phone)
  const [pronouns, setPronouns] = useState(profile.pronouns)
  const [photoChanged, setPhotoChanged] = useState(false)

  const handleSave = () => {
    updateProfile({ name, email, phone, pronouns })
    navigate('settings')
  }

  return (
    <PhoneFrame>
      <div className="flex-1 overflow-y-auto flex flex-col px-7 pt-10 pb-7 min-h-0">
        <header className="flex items-center justify-between">
          <button
            onClick={goBack}
            className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-slate-50 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <h2 className="text-[17px] font-bold tracking-tight">Edit profile</h2>
          <button
            onClick={handleSave}
            className="text-[12px] font-semibold text-[var(--primary)] cursor-pointer hover:underline"
          >
            Save
          </button>
        </header>

        <div className="mt-6 flex flex-col items-center">
          <div className="relative">
            <div
              className="grid h-20 w-20 place-items-center rounded-full text-white text-[28px] font-bold shadow-[var(--shadow-tile)]"
              style={{
                background: 'linear-gradient(135deg, oklch(0.65 0.22 30), oklch(0.45 0.24 30))'
              }}
            >
              {name[0] ?? 'U'}
            </div>
            <button
              onClick={() => setPhotoChanged(prev => !prev)}
              className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-[var(--primary)] text-white shadow-[var(--shadow-soft)] hover:bg-[oklch(0.5_0.2_265)] cursor-pointer active:scale-95"
            >
              <Camera className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
          </div>
          <p className="mt-3 text-[12px] font-bold text-foreground">
            {photoChanged ? 'New photo selected' : 'Change photo'}
          </p>
        </div>

        <div className="mt-5 space-y-2">
          <label className="block rounded-2xl bg-white px-4 py-2.5 shadow-[var(--shadow-soft)] focus-within:ring-2 focus-within:ring-[var(--primary)] transition-all">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Display name
            </p>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="mt-0.5 w-full bg-transparent text-[13px] font-semibold text-foreground outline-none border-none p-0 focus:ring-0"
            />
          </label>

          <label className="block rounded-2xl bg-white px-4 py-2.5 shadow-[var(--shadow-soft)] focus-within:ring-2 focus-within:ring-[var(--primary)] transition-all">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Email
            </p>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-0.5 w-full bg-transparent text-[13px] font-semibold text-foreground outline-none border-none p-0 focus:ring-0"
            />
          </label>

          <label className="block rounded-2xl bg-white px-4 py-2.5 shadow-[var(--shadow-soft)] focus-within:ring-2 focus-within:ring-[var(--primary)] transition-all">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Phone
            </p>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="mt-0.5 w-full bg-transparent text-[13px] font-semibold text-foreground outline-none border-none p-0 focus:ring-0"
            />
          </label>

          <label className="block rounded-2xl bg-white px-4 py-2.5 shadow-[var(--shadow-soft)] focus-within:ring-2 focus-within:ring-[var(--primary)] transition-all">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Pronouns
            </p>
            <input
              type="text"
              value={pronouns}
              onChange={e => setPronouns(e.target.value)}
              className="mt-0.5 w-full bg-transparent text-[13px] font-semibold text-foreground outline-none border-none p-0 focus:ring-0"
            />
          </label>
        </div>

        <button
          onClick={() => navigate('passcode')}
          className="mt-5 w-full rounded-2xl bg-white px-4 py-3 text-left text-[12px] font-semibold text-foreground shadow-[var(--shadow-soft)] hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Change passcode
        </button>

        <button
          onClick={handleSave}
          className="mt-auto w-full rounded-full bg-[oklch(0.18_0.04_265)] py-4 text-[15px] font-semibold text-white active:scale-95 transition-all cursor-pointer"
        >
          Save profile
        </button>
      </div>
    </PhoneFrame>
  )
}
