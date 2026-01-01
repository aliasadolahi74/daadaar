import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen p-8 font-vazirmatn">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Welcome to Daadaar Frontend
        </h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">✅ Installations Complete</h2>
            <ul className="space-y-2">
              <li>• shadcn/ui - UI component library</li>
              <li>• Tailwind CSS v4 - Utility-first CSS</li>
              <li>• Vazirmatn Font - Persian/Arabic typography</li>
              <li>• MapLibre GL - Interactive maps</li>
            </ul>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">🧪 Test Components</h2>
            <div className="space-y-4">
              <Button>shadcn/ui Button</Button>
              <div className="p-4 bg-secondary rounded">
                <p className="font-vazirmatn">
                  This text uses Vazirmatn font
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">🗺️ MapLibre Ready</h2>
          <p className="text-muted-foreground">
            MapLibre GL is installed and ready for interactive maps. 
            CSS is imported in globals.css.
          </p>
        </div>
      </main>
    </div>
  );
}