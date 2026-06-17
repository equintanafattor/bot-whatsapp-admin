interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center mb-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <p className="text-foreground font-medium">{title}</p>
      {description && (
        <p className="text-muted-foreground text-sm mt-1 max-w-sm">{description}</p>
      )}
    </div>
  );
}
