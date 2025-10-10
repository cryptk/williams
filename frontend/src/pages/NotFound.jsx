import { Button } from '../uielements'
import { route } from 'preact-router'

export function NotFound() {
  return (
    <div class="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h2 class="text-primary mb-4 text-4xl font-bold">404 - Page Not Found</h2>
      <p class="text-gray mb-8 text-lg">The page you're looking for doesn't exist.</p>
      {/* Add an onClick handler to navigate home if using a router */}
      <Button onClick={() => route('/')} variant="primary">
        Go Home
      </Button>
    </div>
  )
}
