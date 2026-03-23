interface BadgeProps {
  count?: number;
  show?: boolean;
}

export default function Badge({ count, show = true }: BadgeProps) {
  if (!show && !count) return null;

  return (
    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-unread rounded-full leading-none">
      {count !== undefined ? (count > 99 ? "99+" : count) : ""}
    </span>
  );
}
