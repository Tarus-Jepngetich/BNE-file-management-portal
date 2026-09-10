function Navbar() {
  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          BNE Construction Ltd
        </h2>

        <p className="text-sm text-slate-500">
          Company Management Portal
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-900">
            Main Admin
          </p>

          <p className="text-xs text-slate-500">
            Administrator
          </p>
        </div>

        <div className="h-10 w-10 rounded-full bg-[#c5a66a] flex items-center justify-center font-bold text-[#111315]">
          A
        </div>
      </div>
    </header>
  )
}

export default Navbar