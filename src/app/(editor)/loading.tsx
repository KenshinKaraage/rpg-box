export default function Loading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="mt-3 text-sm text-muted-foreground">読み込み中...</p>
      </div>
    </div>
  );
}
