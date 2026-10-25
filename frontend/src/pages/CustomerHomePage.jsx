import Icon from "../components/Icon.jsx";

export default function CustomerHomePage({ user }) {
  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[10px] font-semibold tracking-[0.12em] text-blue-800 uppercase">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        Customer account
      </div>
      <h1 className="text-[27px] font-semibold tracking-[-0.035em] text-slate-950 sm:text-[32px]">Welcome, {user.name}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        You are signed in with a customer account. Customer vehicle browsing and purchase tools are planned for a later milestone.
      </p>

      <section className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.025)] sm:p-8">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-800 ring-1 ring-inset ring-teal-100">
          <Icon name="vehicles" className="h-5 w-5" />
        </span>
        <h2 className="mt-5 text-base font-semibold text-slate-900">Customer workspace preview</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
          Your account is connected. This temporary landing page does not display live inventory or record purchases yet.
        </p>
      </section>
    </div>
  );
}
