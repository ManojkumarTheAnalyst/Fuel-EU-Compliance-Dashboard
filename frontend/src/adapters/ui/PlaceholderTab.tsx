type Props = {
  title: string;
  description: string;
};

export function PlaceholderTab({ title, description }: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-varuna-navy-600 bg-varuna-navy-900/20 px-6 py-16 text-center">
      <h2 className="text-lg font-semibold text-varuna-teal-300">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">{description}</p>
    </div>
  );
}
