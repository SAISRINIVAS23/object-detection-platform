import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";

function DashboardLayout() {
    return (
        <div className="dashboard-container">

            <Sidebar />

            <div className="main-content">

                <Navbar />

                <div className="page-content">
                    <Outlet />
                </div>

            </div>

        </div>
    );
}

export default DashboardLayout;