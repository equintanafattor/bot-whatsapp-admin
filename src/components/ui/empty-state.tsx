interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
          {icon}
        </div>
      )}
      <p className="text-gray-900 font-medium">{title}</p>
      {description && (
        <p className="text-gray-500 text-sm mt-1 max-w-sm">{description}</p>
      )}
    </div>
  );
}
