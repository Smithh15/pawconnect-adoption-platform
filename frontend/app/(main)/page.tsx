import Link from 'next/link';
import { PawPrint, Heart, ShieldCheck, ArrowRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="flex flex-col">

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-amber-50 px-4 py-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-[500px] w-[500px] translate-x-1/3 -translate-y-1/4 rounded-full bg-amber-200/50" />
          <div className="absolute bottom-0 left-0 h-72 w-72 -translate-x-1/4 translate-y-1/4 rounded-full bg-orange-100/80" />
        </div>

        <div className="relative container mx-auto max-w-4xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-700">
            <PawPrint className="h-3.5 w-3.5" />
            Adopción animal responsable
          </div>

          <h1 className="mb-6 max-w-2xl text-5xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-6xl">
            Ellos solo quieren<br />
            <span className="text-amber-500">alguien que los ame.</span>
          </h1>

          <p className="mb-8 max-w-lg text-lg text-slate-500 leading-relaxed">
            Miles de perros esperan una familia. En PawConnect encontrarás al compañero que cambiará tu vida — y tú la de él.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/animals" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-700">
              Ver animales disponibles
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/register" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
              Crear cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────── */}
      <section className="border-y bg-white px-4 py-10">
        <div className="container mx-auto grid grid-cols-3 gap-6 max-w-2xl">
          {[
            { value: '500+', label: 'Animales rescatados' },
            { value: '200+', label: 'Adopciones exitosas' },
            { value: '50+',  label: 'Rescatistas activos' },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1 text-center">
              <span className="text-3xl font-black text-amber-500">{stat.value}</span>
              <span className="text-xs text-slate-400 font-medium">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Por qué adoptar ────────────────────────────────── */}
      <section className="bg-white px-4 py-20">
        <div className="container mx-auto max-w-4xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-500">Por qué adoptar</p>
          <h2 className="mb-10 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Un perro adoptado es un perro<br />que te lo agradece toda la vida.
          </h2>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: PawPrint,
                title: 'Rescatistas verificados',
                desc: 'Cada perfil de rescatista es revisado antes de poder publicar. Tú y el animal siempre estarán protegidos.',
              },
              {
                icon: Heart,
                title: 'Proceso humano',
                desc: 'Cuéntanos sobre ti y tu hogar. El rescatista elige al adoptante ideal para cada animal.',
              },
              {
                icon: ShieldCheck,
                title: 'Seguimiento completo',
                desc: 'Desde la primera solicitud hasta que el perro llega a casa, todo queda registrado en la plataforma.',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                    <Icon className="h-5 w-5 text-amber-600" />
                  </div>
                  <h3 className="mb-2 font-bold text-slate-800">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="bg-slate-900 px-4 py-20 text-white">
        <div className="container mx-auto max-w-4xl grid gap-8 sm:grid-cols-2 items-center">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-400">Únete hoy</p>
            <h2 className="text-3xl font-extrabold sm:text-4xl">
              Hay un perro<br />esperándote ahora.
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <Link href="/animals" className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 font-bold text-slate-900 transition hover:bg-amber-300">
              Explorar animales
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/register/rescuer" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm font-medium text-white/70 transition hover:text-white">
              ¿Eres rescatista? Regístrate aquí
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
