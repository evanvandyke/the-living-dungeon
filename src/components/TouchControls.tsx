"use client";

interface Props {
  onMove: (dx: number, dy: number) => void;
  onDescend: () => void;
  onAscend: () => void;
  onWait: () => void;
  onEvolution: () => void;
}

function DPadButton({
  label,
  onPress,
  className,
}: {
  label: string;
  onPress: () => void;
  className?: string;
}) {
  return (
    <button
      onTouchStart={(e) => {
        e.preventDefault();
        onPress();
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        onPress();
      }}
      className={`w-14 h-14 flex items-center justify-center bg-white/10 active:bg-white/25 rounded-lg text-gray-300 text-xl font-mono select-none touch-manipulation ${className || ""}`}
    >
      {label}
    </button>
  );
}

export default function TouchControls({
  onMove,
  onDescend,
  onAscend,
  onWait,
  onEvolution,
}: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 p-4 pb-6 md:hidden">
      <div className="flex justify-between items-end max-w-lg mx-auto">
        <div className="grid grid-cols-3 gap-1">
          <div />
          <DPadButton label="^" onPress={() => onMove(0, -1)} />
          <div />
          <DPadButton label="<" onPress={() => onMove(-1, 0)} />
          <DPadButton label="." onPress={onWait} className="text-sm" />
          <DPadButton label=">" onPress={() => onMove(1, 0)} />
          <div />
          <DPadButton label="v" onPress={() => onMove(0, 1)} />
          <div />
        </div>

        <div className="flex gap-2">
          <DPadButton
            label="DN"
            onPress={onDescend}
            className="text-xs text-yellow-400/80"
          />
          <DPadButton
            label="UP"
            onPress={onAscend}
            className="text-xs text-blue-400/80"
          />
          <DPadButton
            label="E"
            onPress={onEvolution}
            className="text-xs text-purple-400/80"
          />
        </div>
      </div>
    </div>
  );
}
