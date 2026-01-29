import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8">
      <h1 className="text-4xl font-bold text-foreground">RPG Box</h1>
      <p className="text-muted-foreground">Browser-based RPG editor</p>
      <Button>Get Started</Button>
    </main>
  );
}
