export default function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
    return (
        <div className="mb-6 flex items-center gap-4">
            <h2 className="font-serif text-[1.6rem] font-semibold tracking-tight text-ink">{children}</h2>
            <span className="h-px flex-1 bg-line" />
            {aside}
        </div>
    );
}
