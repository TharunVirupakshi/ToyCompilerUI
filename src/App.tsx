import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import EditorWindow from './components/EditorWindow'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="">
      <h1 className="text-xl font-bold mb-4">Code Editor</h1>
      <EditorWindow />
    </div>
  )
}

export default App
