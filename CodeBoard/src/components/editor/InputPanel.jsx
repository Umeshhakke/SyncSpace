function InputPanel({ value, onChange }) {
    return (
        <div className="border-b border-slate-800 px-4 py-3">
            <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Input (stdin)
                </span>
            </div>

            <textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Provide stdin values for your program here."
                rows={4}
                className="w-full resize-none rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-700"
            />
        </div>
    );
}

export default InputPanel;
