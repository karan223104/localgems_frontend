import { useState } from 'react'
import AppRouter from './router/AppRouter'
import axios from 'axios'
import { ToastContainer, Zoom } from 'react-toastify'
// import './App.css'

function App() {
  const [count, setCount] = useState(0)
  axios.defaults.baseURL = "http://localhost:3000"
  return (
    <>
      <AppRouter></AppRouter>
      <ToastContainer
        position="top-right"
        autoClose={1000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        transition={Zoom}
      />
    </>
  )
}

export default App
