import { TeamRunDashboard } from './components/dashboard/TeamRunDashboard.tsx'
import { demoTeamRun } from './data/demo-team-run.ts'



export default function App() {
  

  return (
    <div className="relative h-screen overflow-hidden">
      <header className="absolute top-0 right-0 z-50 flex items-center gap-3 px-6 py-3 text-[10px] font-headline uppercase tracking-widest text-on-surface-variant">
        <span className="text-primary font-black">OMA Forge</span>
      </header>
      <TeamRunDashboard result={demoTeamRun} />
    </div>
  )
}
