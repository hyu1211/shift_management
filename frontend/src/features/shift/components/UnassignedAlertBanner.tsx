import { AlertTriangleIcon, CheckCircleIcon } from "@/components/common/icons";

export type UnassignedAlertItem = {
  id: string;
  label: string;
};

type UnassignedAlertBannerProps = {
  items: UnassignedAlertItem[];
};

export default function UnassignedAlertBanner({ items }: UnassignedAlertBannerProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
        <CheckCircleIcon className="h-4 w-4" />
        全て配置済みです
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4">
      <div className="flex items-center gap-2 text-sm font-bold text-red-700">
        <AlertTriangleIcon className="h-4 w-4" />
        {items.length}件の授業が未配置です
      </div>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="inline-block rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-600 transition-colors duration-200 hover:bg-red-100"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
