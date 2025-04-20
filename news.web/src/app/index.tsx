import News from "./news"
import ErrorBoundary from "./shared/components/error-boundary"

function App() {
  return (
    <ErrorBoundary>
      <News />
    </ErrorBoundary>
  )
}

export default App
