import './App.css';
import { Dashboard } from "./pages/Dashboard.jsx";
import { Route, Routes } from "react-router-dom";
import Team from "./pages/Team.jsx";
import Login from "./components/Login/login.jsx";
import Register from "./components/Login/register.jsx";
import React from "react";



function setToken(token) {
    sessionStorage.setItem("token", JSON.stringify(token));

}

function getToken() {
    const tokenString = sessionStorage.getItem('token');

    const userToken = JSON.parse(tokenString);
    return userToken?.token
}

function App() {

    const [loggedIn, setLoggedIn] = React.useState(false);


    const token=getToken()
    console.log(token);
    if (token){
        setLoggedIn(true)
    }
    if (!loggedIn){

        return <Login  setToken={setToken} setLoggedIn={setLoggedIn} />
    }

    return (

        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Main Application Routes */}
            <Routes>
                {/* Dashboard Route */}
                <Route path="/" element={<Dashboard />} />

                {/* Team Route */}
                <Route path="/Team" element={<Team />} />
                {/*<Route path="/login" element={} />*/}
                <Route path="/register" element={<Register />} />
            </Routes>
        </div>
    );
}

export default App;
