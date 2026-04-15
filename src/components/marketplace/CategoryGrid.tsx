interface Category {
  id: string;
  label: string;
  emoji: string;
}

interface Props {
  categories: Category[];
  selected: string | null;
  onSelect: (id: string) => void;
}

const CategoryGrid = ({ categories, selected, onSelect }: Props) => (
  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
    {categories.map(cat => (
      <button
        key={cat.id}
        onClick={() => onSelect(cat.id)}
        className={`flex flex-col items-center gap-1 rounded-2xl border p-2.5 sm:p-3 transition-all text-center ${
          selected === cat.id
            ? "border-primary bg-primary/10 shadow-sm"
            : "border-border/40 bg-card/60 hover:border-primary/30 hover:bg-primary/5"
        }`}
      >
        <span className="text-lg sm:text-xl">{cat.emoji}</span>
        <span className="text-[0.6rem] sm:text-[0.65rem] font-medium leading-tight text-foreground">
          {cat.label.replace(cat.emoji + " ", "")}
        </span>
      </button>
    ))}
  </div>
);

export default CategoryGrid;
